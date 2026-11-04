import * as request from 'supertest';
import { createTestApp, TestAuthContext } from './helpers/test-app.helper';

describe('EVOE 2026/2070 - Suite E2E Fonctionnelle & Sécurité', () => {
  let ctx: TestAuthContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  }, 30000);

  afterAll(async () => {
    if (ctx) await ctx.close();
  });

  // ----------------------------------------------------
  // EPIC-01 : Authentification & Résolution de Nexus
  // ----------------------------------------------------
  describe('EPIC-01 : Authentification & Nexus', () => {
    it('TST-EVOE-001 : Rejet 401 vers /evoe/context si non authentifié', async () => {
      await request(ctx.httpServer)
        .get('/evoe/context')
        .expect(401);
    });

    it('TST-EVOE-002 : Connexion réussie (Nexus unique) avec identifiants valides', async () => {
      const basicAuth = Buffer.from('groot:password123').toString('base64');
      const res = await request(ctx.httpServer)
        .get('/legacy/check_auth')
        .set('Authorization', `Basic ${basicAuth}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.pseudo).toBe('groot');
      expect(res.body.schoolName).toBe('Académie Spatiale Recette');
      expect(res.body.instanceId).toBe(ctx.grootInstanceId);
    });

    it('TST-EVOE-003 : Mot de passe erroné ou espace fermé -> Rejet 401', async () => {
      const basicWrong = Buffer.from('groot:mauvais_pass').toString('base64');
      await request(ctx.httpServer)
        .get('/legacy/check_auth')
        .set('Authorization', `Basic ${basicWrong}`)
        .expect(401);
    });

    it('TST-EVOE-004 : Résolution Multi-Nexus (homonyme présent dans 2 écoles)', async () => {
      const basicHomonyme = Buffer.from('homonyme:password123').toString('base64');
      const res = await request(ctx.httpServer)
        .get('/legacy/check_auth')
        .set('Authorization', `Basic ${basicHomonyme}`)
        .expect(200);

      expect(res.body.status).toBe('multiple_choices');
      expect(Array.isArray(res.body.choices)).toBe(true);
      expect(res.body.choices.length).toBeGreaterThanOrEqual(2);
    });

    it('TST-EVOE-005 : Maintien de session (Keep Logged via Bearer Token)', async () => {
      const res = await request(ctx.httpServer)
        .get('/legacy/check_auth')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.childId).toBe(ctx.grootChildId);
      expect(res.body.pseudo).toBe('groot');
    });
  });

  // ----------------------------------------------------
  // EPIC-02 : Briefing SF & Immersion FTUX
  // ----------------------------------------------------
  describe('EPIC-02 : Briefing SF & Onboarding Guide', () => {
    it('TST-EVOE-007 : Récupération des étapes FTUX d onboarding pour l école', async () => {
      const res = await request(ctx.httpServer)
        .get('/evoe/onboarding-steps')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(res.body.ftuxSteps).toBeDefined();
      expect(Array.isArray(res.body.ftuxSteps)).toBe(true);
      expect(res.body.ftuxSteps.length).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------
  // EPIC-03 : Passerelle 2026 & Contexte Joueur
  // ----------------------------------------------------
  describe('EPIC-03 : Passerelle 2026 & Contexte Joueur', () => {
    it('TST-EVOE-013 : Chargement du contexte joueur (/evoe/context)', async () => {
      const res = await request(ctx.httpServer)
        .get('/evoe/context')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(res.body.childInfos).toBeDefined();
      expect(res.body.childInfos.pseudo).toBe('groot');
      expect(res.body.childInfos.group.team.name).toBe('Vaisseau Orion');
      expect(res.body.childInfos.isPeriodOpen).toBe(true);
      expect(Array.isArray(res.body.players)).toBe(true);
      expect(res.body.players.length).toBeGreaterThan(0);
    });

    it('TST-EVOE-014 : Liste des missions SF associées aux actions (/evoe/missions/:id)', async () => {
      const res = await request(ctx.httpServer)
        .get(`/evoe/missions/${ctx.grootInstanceId}?schoolYear=2025-2026`)
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const mission = res.body.find((m: any) => m.evoeMission?.titreSF);
      expect(mission).toBeDefined();
      expect(mission.evoeMission.titreSF).toBeDefined();
    });

    it('TST-EVOE-015 : Sécurité S2 - /evoe/missions sans Authorization refuse l accès (401)', async () => {
      await request(ctx.httpServer)
        .get(`/evoe/missions/${ctx.grootInstanceId}`)
        .expect(401);
    });
  });

  // ----------------------------------------------------
  // EPIC-04 : Codex & Impulsion d Action
  // ----------------------------------------------------
  describe('EPIC-04 : Codex & Impulsion d Action', () => {
    it('TST-EVOE-019 : Consultation du statut du dashboard et score IT (/evoe/dashboard/status/:id)', async () => {
      const res = await request(ctx.httpServer)
        .get(`/evoe/dashboard/status/${ctx.grootInstanceId}`)
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(res.body.teams).toBeDefined();
      expect(res.body.topPlayers).toBeDefined();
      expect(res.body.playersHealth).toBeDefined();

      const grootHealth = res.body.playersHealth.find(
        (p: any) => p.childId === ctx.grootChildId,
      );
      expect(grootHealth).toBeDefined();
      // groot a 3 actions réalisées dans la période active
      expect(grootHealth.health).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------
  // EPIC-05 : Arène des Défis PvP
  // ----------------------------------------------------
  describe('EPIC-05 : Arène des Défis PvP', () => {
    it('TST-EVOE-025 : Récupération des défis actifs de la période (/evoe/challenges)', async () => {
      const res = await request(ctx.httpServer)
        .get(`/evoe/challenges?instanceId=${ctx.grootInstanceId}`)
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const challenge = res.body[0];
      expect(challenge.challengerTeamName).toBeDefined();
      expect(challenge.targetTeamName).toBeDefined();
      expect(challenge.actionTitle).toBeDefined();
    });
  });

  // ----------------------------------------------------
  // EPIC-06 : Projection Temporelle 2070 & Extrapolation
  // ----------------------------------------------------
  describe('EPIC-06 : Projection Temporelle 2070 & Extrapolation', () => {
    it('TST-EVOE-031 : Calcul des métriques d extrapolation mondiale (/evoe/extrapolation/metrics)', async () => {
      const res = await request(ctx.httpServer)
        .get('/evoe/extrapolation/metrics')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(res.body.nbPlanetes).toBeDefined();
      expect(res.body.dateDepassement).toBeDefined();
      expect(res.body.iceSavedKg).toBeDefined();
    });
  });

  // ----------------------------------------------------
  // EPIC-09 : Profil Agent & Personnalisation
  // ----------------------------------------------------
  describe('EPIC-09 : Profil Agent & Sécurité', () => {
    it('TST-EVOE-049 : Consultation du profil (/evoe/profile/:childId)', async () => {
      const res = await request(ctx.httpServer)
        .get(`/evoe/profile/${ctx.grootChildId}`)
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.pseudo).toBe('groot');
      expect(res.body.profile.avatar).toContain('avatar_astronaut_01.glb');
    });

    it('TST-EVOE-050 : Sécurité S2 - /evoe/profile/:childId sans Authorization refuse l accès (401)', async () => {
      await request(ctx.httpServer)
        .get(`/evoe/profile/${ctx.grootChildId}`)
        .expect(401);
    });
  });
});
