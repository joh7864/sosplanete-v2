import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { runSeedRecette } from '../../prisma/seed-recette';

export interface TestAuthContext {
  app: INestApplication;
  httpServer: any;
  prisma: PrismaService;
  superAdminToken: string;
  profAdminToken: string;
  grootToken: string;
  grootChildId: number;
  grootInstanceId: number;
  instanceYearId: number;
  marianeToken: string;
  marianeChildId: number;
  marianeInstanceId: number;
  close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestAuthContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();
  const httpServer = app.getHttpServer();
  const prisma = app.get(PrismaService);

  // Remettre la base dans son état initial déterministe
  await runSeedRecette(prisma);

  // 1. Récupération du token SuperAdmin (AS)
  const resSuperAdmin = await request(httpServer)
    .post('/auth/login')
    .send({ email: 'jo@dev.fr', password: 'jo' });
  const superAdminToken = resSuperAdmin.body.access_token;

  // 2. Récupération du token ProfAdmin (AM)
  const resProfAdmin = await request(httpServer)
    .post('/auth/login')
    .send({ email: 'prof@ecole-recette.fr', password: 'prof123' });
  const profAdminToken = resProfAdmin.body.access_token;

  // 3. Récupération du token Agent groot
  const basicGroot = Buffer.from('groot:password123').toString('base64');
  const resGroot = await request(httpServer)
    .get('/legacy/check_auth')
    .set('Authorization', `Basic ${basicGroot}`);
  const grootToken = resGroot.body.token;
  const grootChildId = resGroot.body.childId;
  const grootInstanceId = resGroot.body.instanceId;

  // 4. Récupération du token Agent mariane
  const basicMariane = Buffer.from('mariane:password123').toString('base64');
  const resMariane = await request(httpServer)
    .get('/legacy/check_auth')
    .set('Authorization', `Basic ${basicMariane}`);
  const marianeToken = resMariane.body.token;
  const marianeChildId = resMariane.body.childId;
  const marianeInstanceId = resMariane.body.instanceId;

  // Résolution de l'instanceYearId
  const instanceYear = await prisma.instanceYear.findFirst({
    where: { instanceId: grootInstanceId, schoolYear: '2025-2026' },
  });
  const instanceYearId = instanceYear?.id || 1;

  return {
    app,
    httpServer,
    prisma,
    superAdminToken,
    profAdminToken,
    grootToken,
    grootChildId,
    grootInstanceId,
    instanceYearId,
    marianeToken,
    marianeChildId,
    marianeInstanceId,
    close: async () => {
      try {
        await prisma.$disconnect();
      } catch {}
      await app.close();
    },
  };
}
