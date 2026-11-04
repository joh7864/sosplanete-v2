import * as request from 'supertest';
import { EasterEggTriggerType } from '@prisma/client';
import { createTestApp, TestAuthContext } from './helpers/test-app.helper';

describe('EVOE - Moteur Easter Eggs (E2E & Sécurité)', () => {
  let ctx: TestAuthContext;
  let activeEggId: number;

  beforeAll(async () => {
    ctx = await createTestApp();
  }, 30000);

  afterAll(async () => {
    if (ctx) await ctx.close();
  });

  // ----------------------------------------------------
  // 1. Endpoints Joueur
  // ----------------------------------------------------
  describe('Endpoints Joueur', () => {
    it('TST-EGG-001 : Rejet 401 si non authentifié sur /evoe/easter-eggs/active', async () => {
      await request(ctx.httpServer)
        .get('/evoe/easter-eggs/active')
        .expect(401);
    });

    it('TST-EGG-002 : Récupération de l Easter Egg actif pour le joueur connecté', async () => {
      const res = await request(ctx.httpServer)
        .get('/evoe/easter-eggs/active')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(200);

      expect(res.body.hasActiveEgg).toBe(true);
      expect(res.body.easterEgg).toBeDefined();
      expect(res.body.easterEgg.code).toBe('EGG_01_SOLAR');
      expect(res.body.easterEgg.title).toBe('Le Premier Signal Orbital');
      expect(res.body.easterEgg.crypticMessage).toBeDefined();
      // La solution attendue ne doit JAMAIS être exposée au joueur
      expect(res.body.easterEgg.expectedAnswer).toBeUndefined();

      activeEggId = res.body.easterEgg.id;
    });

    it('TST-EGG-003 : Vérification de réponse erronée -> success: false', async () => {
      const res = await request(ctx.httpServer)
        .post('/evoe/easter-eggs/verify-answer')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .send({ easterEggId: activeEggId, answer: 'mauvaise_reponse' })
        .expect(201);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Combinaison incorrecte');
    });

    it('TST-EGG-004 : Validation d un déclencheur incompatible -> Rejet 400', async () => {
      const res = await request(ctx.httpServer)
        .post('/evoe/easter-eggs/validate-trigger')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .send({
          easterEggId: activeEggId,
          triggerType: EasterEggTriggerType.COMM_LINK_COMMAND,
        })
        .expect(400);

      expect(res.body.message).toContain('Déclencheur non conforme');
    });

    it('TST-EGG-005 : Résolution réussie avec bonne réponse -> success: true et message de victoire', async () => {
      const res = await request(ctx.httpServer)
        .post('/evoe/easter-eggs/verify-answer')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .send({ easterEggId: activeEggId, answer: 'soleil' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
    });
  });

  // ----------------------------------------------------
  // 2. Sécurité Cockpit Administrateur (@AdminOnly)
  // ----------------------------------------------------
  describe('Sécurité Cockpit Administrateur (@AdminOnly)', () => {
    it('TST-EGG-010 : Rejet 401 si pas de token sur /evoe/easter-eggs/admin/catalog', async () => {
      await request(ctx.httpServer)
        .get('/evoe/easter-eggs/admin/catalog')
        .expect(401);
    });

    it('TST-EGG-011 : Rejet 403 Forbidden si token élève (non-admin) sur route admin', async () => {
      await request(ctx.httpServer)
        .get('/evoe/easter-eggs/admin/catalog')
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(403);
    });

    it('TST-EGG-012 : Accès autorisé 200 avec token SuperAdmin (AS) au catalogue', async () => {
      const res = await request(ctx.httpServer)
        .get('/evoe/easter-eggs/admin/catalog')
        .set('Authorization', `Bearer ${ctx.superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
      const codes = res.body.map((e: any) => e.code);
      expect(codes).toContain('EGG_01_SOLAR');
      expect(codes).toContain('EGG_02_CYBER');
      expect(codes).toContain('EGG_03_PAUSE');
    });

    it('TST-EGG-013 : Accès autorisé 200 avec token ProfAdmin (AM) au tracking', async () => {
      const res = await request(ctx.httpServer)
        .get(`/evoe/easter-eggs/admin/tracking/${ctx.instanceYearId}`)
        .set('Authorization', `Bearer ${ctx.profAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('TST-EGG-014 : Accès à la Chrono-Frise admin (/admin/chrono-frise/:id)', async () => {
      const res = await request(ctx.httpServer)
        .get(`/evoe/easter-eggs/admin/chrono-frise/${ctx.instanceYearId}`)
        .set('Authorization', `Bearer ${ctx.profAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('TST-EGG-015 : Rejet 400 Bad Request si payload invalide sur force-hint (validation DTO)', async () => {
      await request(ctx.httpServer)
        .post('/evoe/easter-eggs/admin/force-hint')
        .set('Authorization', `Bearer ${ctx.superAdminToken}`)
        .send({})
        .expect(400);
    });
  });
});
