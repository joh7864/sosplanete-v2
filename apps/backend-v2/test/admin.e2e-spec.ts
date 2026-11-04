import * as request from 'supertest';
import { createTestApp, TestAuthContext } from './helpers/test-app.helper';

describe('Cockpit Administrateur - Suite E2E Fonctionnelle & Sécurité', () => {
  let ctx: TestAuthContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  }, 30000);

  afterAll(async () => {
    if (ctx) await ctx.close();
  });

  // ----------------------------------------------------
  // 1. Authentification Back-Office
  // ----------------------------------------------------
  describe('Authentification Back-Office', () => {
    it('TST-ADM-001 : Connexion SuperAdmin AS réussie (/auth/login)', async () => {
      const res = await request(ctx.httpServer)
        .post('/auth/login')
        .send({ email: 'jo@dev.fr', password: 'jo' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('AS');
      expect(res.body.user.email).toBe('jo@dev.fr');
    });

    it('TST-ADM-002 : Connexion refusée 401 si mot de passe erroné', async () => {
      await request(ctx.httpServer)
        .post('/auth/login')
        .send({ email: 'jo@dev.fr', password: 'mauvais_pass' })
        .expect(401);
    });

    it('TST-ADM-003 : Rejet 401 sur les routes admin sans token JWT', async () => {
      await request(ctx.httpServer)
        .get('/instances')
        .expect(401);

      await request(ctx.httpServer)
        .get('/categories')
        .expect(401);

      await request(ctx.httpServer)
        .get('/action-ref')
        .expect(401);
    });

    it('TST-ADM-004 : Rejet 403 Forbidden sur /categories avec token élève', async () => {
      await request(ctx.httpServer)
        .get(`/categories?instanceId=${ctx.grootInstanceId}&schoolYear=2025-2026`)
        .set('Authorization', `Bearer ${ctx.grootToken}`)
        .expect(403);
    });
  });

  // ----------------------------------------------------
  // 2. Gestion des Instances (Écoles)
  // ----------------------------------------------------
  describe('Gestion des Instances (Écoles)', () => {
    it('TST-ADM-005 : Consultation des instances par le SuperAdmin (/instances)', async () => {
      const res = await request(ctx.httpServer)
        .get('/instances?schoolYear=2025-2026')
        .set('Authorization', `Bearer ${ctx.superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      const schoolNames = res.body.map((i: any) => i.schoolName);
      expect(schoolNames).toContain('Académie Spatiale Recette');
      expect(schoolNames).toContain('Collège Horizon Nord (Fermé)');
    });

    it('TST-ADM-006 : Détails d une instance (/instances/:id)', async () => {
      const res = await request(ctx.httpServer)
        .get(`/instances/${ctx.grootInstanceId}`)
        .set('Authorization', `Bearer ${ctx.superAdminToken}`)
        .expect(200);

      expect(res.body.schoolName).toBe('Académie Spatiale Recette');
    });
  });

  // ----------------------------------------------------
  // 3. Référentiel des Actions & Catégories
  // ----------------------------------------------------
  describe('Référentiel des Actions & Catégories', () => {
    it('TST-ADM-007 : Consultation du référentiel global d actions (/action-ref)', async () => {
      const res = await request(ctx.httpServer)
        .get('/action-ref')
        .set('Authorization', `Bearer ${ctx.superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(61);

      const codes = res.body.map((a: any) => a.code);
      expect(codes).toContain('B01');
      expect(codes).toContain('C01');
      expect(codes).toContain('D01');
    });

    it('TST-ADM-008 : Consultation des catégories (/categories)', async () => {
      const res = await request(ctx.httpServer)
        .get(`/categories?instanceId=${ctx.grootInstanceId}&schoolYear=2025-2026`)
        .set('Authorization', `Bearer ${ctx.profAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(6);

      const catNames = res.body.map((c: any) => c.name);
      expect(catNames).toContain('Transport');
      expect(catNames).toContain('Biodiversité');
      expect(catNames).toContain('Déchets');
    });
  });
});
