import * as request from 'supertest';
import { createTestApp, TestAuthContext } from './helpers/test-app.helper';

describe('SOS Planète Legacy API - Suite E2E Fonctionnelle & Rétrocompatibilité', () => {
  let ctx: TestAuthContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  }, 30000);

  afterAll(async () => {
    if (ctx) await ctx.close();
  });

  // ----------------------------------------------------
  // 1. Authentification & Résolution d'Identité
  // ----------------------------------------------------
  describe('Authentification Legacy (/legacy/check_auth)', () => {
    it('TST-LEG-001 : Connexion Basic Auth élève unique réussie', async () => {
      const basicHeader = `Basic ${Buffer.from('groot:password123').toString('base64')}`;
      const res = await request(ctx.httpServer)
        .get('/legacy/check_auth')
        .set('Authorization', basicHeader)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.pseudo).toBe('groot');
      expect(res.body.token).toBeDefined();
      expect(res.body.childId).toBe(ctx.grootChildId);
      expect(res.body.instanceId).toBe(ctx.grootInstanceId);
      expect(res.body.schoolName).toBe('Académie Spatiale Recette');
      expect(res.body.schoolYear).toBe('2025-2026');
    });

    it('TST-LEG-002 : Connexion refusée si mot de passe erroné', async () => {
      const basicHeader = `Basic ${Buffer.from('groot:wrongpassword').toString('base64')}`;
      await request(ctx.httpServer)
        .get('/legacy/check_auth')
        .set('Authorization', basicHeader)
        .expect(401);
    });

    it('TST-LEG-003 : Rejet 401 si aucun header d autorisation', async () => {
      await request(ctx.httpServer)
        .get('/legacy/check_auth')
        .expect(401);
    });

    it('TST-LEG-004 : Validation de session par Bearer token', async () => {
      const res = await request(ctx.httpServer)
        .get('/legacy/check_auth')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.childId).toBe(ctx.grootChildId);
      expect(res.body.pseudo).toBe('groot');
    });

    it('TST-LEG-005 : Détection et résolution de choix multiples pour élève homonyme', async () => {
      const basicHeader = `Basic ${Buffer.from('homonyme:password123').toString('base64')}`;
      const res = await request(ctx.httpServer)
        .get('/legacy/check_auth')
        .set('Authorization', basicHeader)
        .expect(200);

      expect(res.body.status).toBe('multiple_choices');
      expect(res.body.pseudo).toBe('homonyme');
      expect(Array.isArray(res.body.choices)).toBe(true);
      expect(res.body.choices.length).toBe(2);
      expect(res.body.choices[0].token).toBeDefined();
    });
  });

  // ----------------------------------------------------
  // 2. Référentiel, Catégories & Actions
  // ----------------------------------------------------
  describe('Catalogue & Référentiel (/legacy/categories, /legacy/actions)', () => {
    it('TST-LEG-006 : Récupération des catégories avec x-instance-id', async () => {
      const res = await request(ctx.httpServer)
        .get('/legacy/categories')
        .set('x-instance-id', ctx.grootInstanceId.toString())
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(6);
      const names = res.body.map((c: any) => c.name);
      expect(names).toContain('Transport');
      expect(names).toContain('Biodiversité');
      expect(names).toContain('Déchets');
    });

    it('TST-LEG-007 : Récupération de la liste complète des actions de l école', async () => {
      const res = await request(ctx.httpServer)
        .get('/legacy/actions')
        .set('x-instance-id', ctx.grootInstanceId.toString())
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(10);
      const action = res.body[0];
      expect(action.id).toBeDefined();
      expect(action.name).toBeDefined();
      expect(action.co2).toBeDefined();
    });

    it('TST-LEG-008 : Récupération des actions filtrées par catégorie', async () => {
      const catsRes = await request(ctx.httpServer)
        .get('/legacy/categories')
        .set('x-instance-id', ctx.grootInstanceId.toString());
      const firstCat = catsRes.body[0];

      const res = await request(ctx.httpServer)
        .get(`/legacy/categories/${firstCat.id}/actions`)
        .set('x-instance-id', ctx.grootInstanceId.toString())
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((a: any) => {
        expect(a.id).toBeDefined();
        expect(a.name).toBeDefined();
      });
    });
  });

  // ----------------------------------------------------
  // 3. Équipes & Synthèse Globale
  // ----------------------------------------------------
  describe('Organisation Scolaire & Équipes (/legacy/teams)', () => {
    it('TST-LEG-009 : Liste des équipes de l école', async () => {
      const res = await request(ctx.httpServer)
        .get('/legacy/teams')
        .set('x-instance-id', ctx.grootInstanceId.toString())
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      const teamNames = res.body.map((t: any) => t.name);
      expect(teamNames).toContain('Vaisseau Orion');
      expect(teamNames).toContain('Vaisseau Phoenix');
    });

    it('TST-LEG-010 : Cumul des scores par équipe (/legacy/teams/total)', async () => {
      const res = await request(ctx.httpServer)
        .get('/legacy/teams/total')
        .set('x-instance-id', ctx.grootInstanceId.toString())
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('TST-LEG-011 : Indicateurs globaux d impact environnemental (/legacy/impact)', async () => {
      const res = await request(ctx.httpServer)
        .get('/legacy/impact')
        .set('x-instance-id', ctx.grootInstanceId.toString())
        .expect(200);

      expect(res.body.totalCo2).toBeDefined();
      expect(res.body.totalWater).toBeDefined();
      expect(res.body.totalWaste).toBeDefined();
      expect(res.body.depassementnombreplanetes).toBeDefined();
    });
  });

  // ----------------------------------------------------
  // 4. Cycle de Vie d une Action Réalisée (Impulsion)
  // ----------------------------------------------------
  describe('Actions Réalisées (Cycle Complet)', () => {
    let createdActionDoneId: number;
    let targetActionId: number;

    beforeAll(async () => {
      const action = await ctx.prisma.localAction.findFirst({
        where: { instanceId: ctx.grootInstanceId },
      });
      targetActionId = action!.id;
    });

    it('TST-LEG-012 : Validation d une action effectuée (/legacy/actiondone/:childId)', async () => {
      const res = await request(ctx.httpServer)
        .post(`/legacy/actiondone/${ctx.grootChildId}`)
        .set('x-instance-id', ctx.grootInstanceId.toString())
        .send({ action_id: targetActionId })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.actionId).toBeDefined();
      createdActionDoneId = res.body.actionId;
    });

    it('TST-LEG-013 : Historique des actions de l élève (/legacy/children/:id/actionsdone)', async () => {
      const res = await request(ctx.httpServer)
        .get(`/legacy/children/${ctx.grootChildId}/actionsdone`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const actionIds = res.body.map((a: any) => parseInt(a.action_id, 10));
      expect(actionIds).toContain(targetActionId);
    });

    it('TST-LEG-014 : Annulation / Suppression d une action réalisée (/legacy/actiondone/:id)', async () => {
      const res = await request(ctx.httpServer)
        .delete(`/legacy/actiondone/${createdActionDoneId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
