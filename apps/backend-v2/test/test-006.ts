import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { InstanceService } from '../src/modules/instance/instance.service';
import { TeamService } from '../src/modules/team/team.service';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

async function runTest006() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const prisma = app.get(PrismaService);
  const authService = app.get(AuthService);
  const instanceService = app.get(InstanceService);
  const teamService = app.get(TeamService);

  const admin = await prisma.user.findFirst({ where: { role: 'AS' } });
  const { access_token } = await authService.login(admin);
  const user = { ...admin, access_token };

  const anomalies: string[] = [];
  const logAnomaly = (testId: string, desc: string) => {
    anomalies.push(
      `| ${testId} | ${new Date().toLocaleDateString()} | Recette Auto | ${desc} | Haute | 🔴 À corriger |`,
    );
    console.error(`[ANOMALIE] ${testId}: ${desc}`);
  };

  const results: string[] = [];

  try {
    // TST-030: Création multi-années
    console.log('--- TST-030: Création multi-années ---');
    const instance = await instanceService.create({
      schoolName: 'Ecole Multi-Années',
      adminId: admin.id,
      currentSchoolYear: '2024-2025',
      gameStartDate: new Date('2024-09-01'),
      gameEndDate: new Date('2025-07-01'),
      gamePeriodsCount: 24,
    } as any);

    const year2Response = await request(app.getHttpServer())
      .get(`/instances/${instance.id}/year?schoolYear=2025-2026`)
      .set('Authorization', `Bearer ${access_token}`);

    if (year2Response.status !== 200) {
      logAnomaly(
        'TST-030',
        `Erreur création 2025-2026: ${year2Response.status}`,
      );
    } else {
      results.push('TST-030: OK');
    }

    const iy1 = await prisma.instanceYear.findUnique({
      where: {
        instanceId_schoolYear: {
          instanceId: instance.id,
          schoolYear: '2024-2025',
        },
      },
    });
    const iy2 = await prisma.instanceYear.findUnique({
      where: {
        instanceId_schoolYear: {
          instanceId: instance.id,
          schoolYear: '2025-2026',
        },
      },
    });

    // TST-031: Étanchéité des équipes
    console.log('--- TST-031: Étanchéité des équipes ---');
    await teamService.create(
      {
        name: 'Equipe 24-25',
        color: '#FFF',
        icon: 'star',
        instanceYearId: iy1.id,
      },
      user,
    );
    await teamService.create(
      {
        name: 'Equipe 25-26',
        color: '#000',
        icon: 'star',
        instanceYearId: iy2.id,
      },
      user,
    );

    const teams2425 = await prisma.team.findMany({
      where: { instanceYearId: iy1.id },
    });
    const teams2526 = await prisma.team.findMany({
      where: { instanceYearId: iy2.id },
    });

    if (
      teams2425.length !== 1 ||
      teams2526.length !== 1 ||
      teams2425[0].name === teams2526[0].name
    ) {
      logAnomaly('TST-031', `Étanchéité équipes en échec`);
    } else {
      results.push('TST-031: OK');
    }

    // TST-034: isOpen
    console.log('--- TST-034: Activation/Désactivation ---');
    await prisma.instanceYear.update({
      where: { id: iy2.id },
      data: { isOpen: true },
    });
    await prisma.instanceYear.update({
      where: { id: iy1.id },
      data: { isOpen: false },
    });

    const checkIy2 = await prisma.instanceYear.findUnique({
      where: { id: iy2.id },
    });
    if (!checkIy2.isOpen) {
      logAnomaly('TST-034', `L'état isOpen a bavé sur l'autre année`);
    } else {
      results.push('TST-034: OK');
    }

    // TST-033: Suppression
    console.log('--- TST-033: Suppression ---');
    await instanceService.remove(instance.id);
    const deletedIy1 = await prisma.instanceYear.findUnique({
      where: { id: iy1.id },
    });
    const deletedIy2 = await prisma.instanceYear.findUnique({
      where: { id: iy2.id },
    });
    if (deletedIy1 || deletedIy2) {
      logAnomaly(
        'TST-033',
        `Suppression d'instance n'a pas supprimé les InstanceYear`,
      );
    } else {
      results.push('TST-033: OK');
    }

    console.log(
      'DONE.',
      anomalies.length === 0 ? '0 anomalies' : `${anomalies.length} anomalies`,
    );
    if (anomalies.length > 0) {
      const anomalyFile = path.join(
        __dirname,
        '..',
        '..',
        '..',
        '.docs',
        '4-reports',
        'anomalies_recette.md',
      );
      let content = fs.existsSync(anomalyFile)
        ? fs.readFileSync(anomalyFile, 'utf-8')
        : '';
      content += '\n' + anomalies.join('\n') + '\n';
      fs.writeFileSync(anomalyFile, content);
    }
  } catch (e) {
    console.error('Crash', e);
  } finally {
    await app.close();
  }
}
runTest006();
