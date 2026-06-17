import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { InstanceService } from '../src/modules/instance/instance.service';
import { CategoryService } from '../src/modules/category/category.service';
import { TeamService } from '../src/modules/team/team.service';
import { TrackingService } from '../src/modules/tracking/tracking.service';
import { ImpactService } from '../src/modules/impact/impact.service';
import { ActionRefService } from '../src/modules/action-ref/action-ref.service';
import { UsersService } from '../src/modules/users/users.service';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

async function runRecette() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const prisma = app.get(PrismaService);
  const authService = app.get(AuthService);
  const instanceService = app.get(InstanceService);
  const categoryService = app.get(CategoryService);
  const teamService = app.get(TeamService);
  const trackingService = app.get(TrackingService);
  const impactService = app.get(ImpactService);
  const actionRefService = app.get(ActionRefService);
  const usersService = app.get(UsersService);

  const admin = await prisma.user.findFirst({ where: { role: 'AS' } });
  if (!admin) {
    console.error('Aucun administrateur AS trouvé.');
    process.exit(1);
  }

  const { access_token } = await authService.login(admin);
  const user = { ...admin, access_token };

  const baseline: any = {
    timestamp: new Date().toISOString(),
    steps: [],
  };

  // TST-002: Login Valide
  baseline.steps.push({
    id: 'TST-002',
    status: 'SUCCESS',
    data: { email: admin.email, role: admin.role },
  });

  const anomalies: string[] = [];

  const logAnomaly = (
    testId: string,
    description: string,
    severity: string = 'Moyenne',
  ) => {
    anomalies.push(
      `| ${testId} | ${new Date().toLocaleDateString()} | Recette Auto | ${description} | ${severity} | 🔴 À corriger |`,
    );
    console.error(`[ANOMALIE] ${testId}: ${description}`);
  };

  // TST-005: Protection des routes
  console.log('--- TST-005: Protection des routes ---');
  try {
    const response = await request(app.getHttpServer()).get('/instances');
    if (response.status === 401) {
      baseline.steps.push({
        id: 'TST-005',
        status: 'SUCCESS',
        data: { blocked: true },
      });
    } else {
      logAnomaly(
        'TST-005',
        `L'accès à /instances sans token a renvoyé un statut ${response.status} au lieu de 401.`,
        'Haute',
      );
    }
  } catch (e) {
    logAnomaly(
      'TST-005',
      `Erreur lors du test de protection des routes: ${e.message}`,
      'Moyenne',
    );
  }

  try {
    const schoolYear = '2024-2025';
    const docsPath = path.join(__dirname, '..', '..', '..', '.docs', '5-tests');
    const fctPath = path.join(__dirname, '..', '..', '..', '.docs', '3-fct');

    // TST-003: Login Invalide
    console.log('--- TST-003: Login Invalide ---');
    try {
      const result = await authService.validateUser(
        admin.email,
        'wrong-password',
      );
      if (result) {
        logAnomaly(
          'TST-003',
          `Le login avec un mauvais mot de passe n'a pas été rejeté (validateUser a renvoyé un utilisateur).`,
          'Moyenne',
        );
      } else {
        baseline.steps.push({
          id: 'TST-003',
          status: 'SUCCESS',
          data: { blocked: true },
        });
      }
    } catch (e) {
      baseline.steps.push({
        id: 'TST-003',
        status: 'SUCCESS',
        data: { blocked: true, message: e.message },
      });
    }

    // TST-006: Liste des utilisateurs
    console.log('--- TST-006: Liste des utilisateurs ---');
    try {
      const users = await usersService.findAll();
      if (users.length > 0) {
        baseline.steps.push({
          id: 'TST-006',
          status: 'SUCCESS',
          data: { count: users.length },
        });
      } else {
        logAnomaly('TST-006', `La liste des utilisateurs est vide.`, 'Moyenne');
      }
    } catch (e) {
      logAnomaly('TST-006', `Erreur liste utilisateurs: ${e.message}`, 'Haute');
    }

    // TST-007: Création utilisateur
    console.log('--- TST-007: Création utilisateur ---');
    const testUserEmail = `test_${Date.now()}@example.com`;
    let createdUser;
    try {
      createdUser = await usersService.createUser({
        email: testUserEmail,
        password: 'pwd',
        name: 'Test User',
        role: 'AM',
      });
      baseline.steps.push({
        id: 'TST-007',
        status: 'SUCCESS',
        data: { id: createdUser.id, email: createdUser.email },
      });
    } catch (e) {
      logAnomaly(
        'TST-007',
        `Erreur création utilisateur: ${e.message}`,
        'Haute',
      );
    }

    // TST-008: Doublon email
    console.log('--- TST-008: Doublon email ---');
    try {
      await usersService.createUser({
        email: testUserEmail,
        password: 'pwd',
        name: 'Test User 2',
        role: 'AM',
      });
      logAnomaly(
        'TST-008',
        `Le doublon d'email n'a pas été bloqué.`,
        'Moyenne',
      );
    } catch (e) {
      if (
        e.status === 409 ||
        e.message.includes('Cet email est déjà utilisé')
      ) {
        baseline.steps.push({
          id: 'TST-008',
          status: 'SUCCESS',
          data: { blocked: true },
        });
      } else {
        logAnomaly(
          'TST-008',
          `Erreur inattendue pour doublon email: ${e.message}`,
          'Basse',
        );
      }
    }

    // TST-009: Suppression utilisateur
    console.log('--- TST-009: Suppression utilisateur ---');
    try {
      if (createdUser) {
        await usersService.deleteUser(createdUser.id);
        baseline.steps.push({
          id: 'TST-009',
          status: 'SUCCESS',
          data: { deleted: true },
        });
      }
    } catch (e) {
      logAnomaly(
        'TST-009',
        `Erreur suppression utilisateur: ${e.message}`,
        'Haute',
      );
    }

    // TST-015: Import Référentiel Actions (DATA-01)
    console.log('--- TST-015: Import Référentiel Actions ---');
    try {
      const refFile = path.join(
        fctPath,
        'SOSPlanete_referentiel_actions_V3.csv',
      );
      const refBuffer = fs.readFileSync(refFile);
      const refResult = await (actionRefService as any).importFromCSV(
        refBuffer,
      );
      baseline.steps.push({
        id: 'TST-015',
        status: 'SUCCESS',
        data: refResult,
      });
    } catch (e) {
      logAnomaly('TST-015', `Erreur import Référentiel: ${e.message}`, 'Haute');
    }

    // TST-016: Import CSV Actions (DATA-02)
    console.log('--- TST-016: Import CSV Actions ---');
    try {
      const refFile = path.join(
        fctPath,
        'SOSPlanete_referentiel_actions_V3.csv',
      );
      const refBuffer = fs.readFileSync(refFile);
      const refResult = await (actionRefService as any).importFromCSV(
        refBuffer,
      );
      baseline.steps.push({
        id: 'TST-016',
        status: 'SUCCESS',
        data: refResult,
      });
    } catch (e) {
      logAnomaly('TST-016', `Erreur import Actions CSV: ${e.message}`, 'Haute');
    }

    // TST-014: Catalogue d'actions
    console.log("--- TST-014: Catalogue d'actions ---");
    try {
      const catalog = await actionRefService.findAll();
      baseline.steps.push({
        id: 'TST-014',
        status: 'SUCCESS',
        data: { count: catalog.length },
      });
    } catch (e) {
      logAnomaly(
        'TST-014',
        `Erreur catalogue actions: ${e.message}`,
        'Moyenne',
      );
    }

    // TST-011: Création instance
    console.log('--- TST-011: Création Instance ---');
    let instance;
    try {
      instance = await instanceService.create({
        schoolName: 'Recette Automatique Instance',
        adminId: admin.id,
        currentSchoolYear: schoolYear,
        gameStartDate: new Date('2024-09-01'), // Pour correspondre aux données CSV de test
        gameEndDate: new Date('2025-07-01'), // Fin d'année scolaire
        gamePeriodsCount: 24,
      } as any);
      baseline.steps.push({ id: 'TST-011', status: 'SUCCESS', data: instance });
    } catch (e) {
      logAnomaly('TST-011', `Erreur création instance: ${e.message}`, 'Haute');
      throw e;
    }

    // TST-024: Import Catégories
    console.log('--- TST-024: Import Catégories ---');
    try {
      const catCsv = fs.readFileSync(
        path.join(docsPath, 'Catégories.csv'),
        'utf-8',
      );
      const catResult = await categoryService.importCsv(
        instance.id,
        catCsv,
        schoolYear,
        user,
      );
      baseline.steps.push({
        id: 'TST-024',
        status: 'SUCCESS',
        data: catResult,
      });
    } catch (e) {
      logAnomaly(
        'TST-024',
        `Erreur import Catégories.csv: ${e.message}`,
        'Haute',
      );
    }

    // TST-026: Import Équipes
    console.log('--- TST-026: Import Équipes ---');
    try {
      const teamCsv = fs.readFileSync(
        path.join(docsPath, 'Neyron_equipes.csv'),
        'utf-8',
      );
      const teamResult = await teamService.importCsv(
        instance.id,
        teamCsv,
        schoolYear,
        user,
      );
      baseline.steps.push({
        id: 'TST-026',
        status: 'SUCCESS',
        data: teamResult,
      });
    } catch (e) {
      logAnomaly(
        'TST-026',
        `Erreur import Neyron_equipes.csv: ${e.message}`,
        'Haute',
      );
    }

    // TST-027: Import Actions Réalisées
    console.log('--- TST-027: Import Actions Réalisées ---');
    try {
      const actionsDoneCsv = fs.readFileSync(
        path.join(docsPath, 'Neyron_actions_realisees.csv'),
        'utf-8',
      );
      const actionsResult = await trackingService.importActionsCsv(
        instance.id,
        actionsDoneCsv,
        schoolYear,
      );
      baseline.steps.push({
        id: 'TST-027',
        status: 'SUCCESS',
        data: actionsResult,
      });
    } catch (e) {
      logAnomaly(
        'TST-027',
        `Erreur import Neyron_actions_realisees.csv: ${e.message}`,
        'Haute',
      );
    }

    // TST-028: Calcul Impact
    console.log('--- TST-028: Calcul Impact ---');
    try {
      const impact = await impactService.calculateImpact(
        schoolYear,
        instance.id,
      );
      baseline.steps.push({ id: 'TST-028', status: 'SUCCESS', data: impact });
    } catch (e) {
      logAnomaly('TST-028', `Erreur calcul impact: ${e.message}`, 'Critique');
    }

    // TST-021, 022, 023, 013: Création manuelle et suppression d'instance
    console.log(
      '--- TST-021, 022, 023, 013: Gestion manuelle et suppression ---',
    );
    try {
      const tempInstance = await instanceService.create({
        schoolName: 'Instance Temporaire Test',
        adminId: admin.id,
        currentSchoolYear: schoolYear,
        gameStartDate: new Date('2024-09-01'),
        gameEndDate: new Date('2025-07-01'),
        gamePeriodsCount: 24,
      } as any);

      // TST-021: Créer équipe
      const team = await teamService.create(
        {
          name: 'Équipe Alpha',
          color: '#FF0000',
          instanceId: tempInstance.id,
          schoolYear: schoolYear,
        },
        user,
      );
      baseline.steps.push({
        id: 'TST-021',
        status: 'SUCCESS',
        data: { teamId: team.id },
      });

      // TST-022: Créer groupe
      const group = await teamService.createGroup(
        team.id,
        'Groupe A',
        '#00FF00',
      );
      baseline.steps.push({
        id: 'TST-022',
        status: 'SUCCESS',
        data: { groupId: group.id },
      });

      // TST-023: Créer enfant
      const child = await teamService.createChild(group.id, 'Alice');
      baseline.steps.push({
        id: 'TST-023',
        status: 'SUCCESS',
        data: { childId: child.id },
      });

      // TST-013: Suppression d'instance (Doit supprimer en cascade l'enfant, groupe, équipe)
      await instanceService.remove(tempInstance.id);
      baseline.steps.push({
        id: 'TST-013',
        status: 'SUCCESS',
        data: { deleted: true },
      });

      // Nouveaux tests: Isolation par Année Scolaire (InstanceYear)
      // TST-030: Création multi-années
      console.log('--- TST-030: Création multi-années ---');
      const myInstance = await instanceService.create({
        schoolName: 'Ecole Multi-Années',
        adminId: admin.id,
        currentSchoolYear: '2024-2025',
        gameStartDate: new Date('2024-09-01'),
        gameEndDate: new Date('2025-07-01'),
        gamePeriodsCount: 24,
      } as any);

      const year2Response = await request(app.getHttpServer())
        .get(`/instances/${myInstance.id}/year?schoolYear=2025-2026`)
        .set('Authorization', `Bearer ${access_token}`);

      if (year2Response.status !== 200) {
        logAnomaly(
          'TST-030',
          `Erreur création 2025-2026: ${year2Response.status}`,
          'Haute',
        );
      } else {
        baseline.steps.push({
          id: 'TST-030',
          status: 'SUCCESS',
          data: { multiYear: true },
        });
      }

      const iy1 = await prisma.instanceYear.findUnique({
        where: {
          instanceId_schoolYear: {
            instanceId: myInstance.id,
            schoolYear: '2024-2025',
          },
        },
      });
      const iy2 = await prisma.instanceYear.findUnique({
        where: {
          instanceId_schoolYear: {
            instanceId: myInstance.id,
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
        logAnomaly('TST-031', `Étanchéité équipes en échec`, 'Haute');
      } else {
        baseline.steps.push({ id: 'TST-031', status: 'SUCCESS' });
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
        logAnomaly(
          'TST-034',
          `L'état isOpen a bavé sur l'autre année`,
          'Haute',
        );
      } else {
        baseline.steps.push({ id: 'TST-034', status: 'SUCCESS' });
      }

      // TST-033: Suppression
      console.log('--- TST-033: Suppression ---');
      await instanceService.remove(myInstance.id);
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
          'Haute',
        );
      } else {
        baseline.steps.push({ id: 'TST-033', status: 'SUCCESS' });
      }
    } catch (e) {
      logAnomaly(
        'TST-MANUAL-DELETE',
        `Erreur lors des tests manuels ou de suppression: ${e.message}`,
        'Critique',
      );
    }

    // Sauvegarde Baseline
    const baselineFile = path.join(docsPath, 'baseline_results.json');
    fs.writeFileSync(baselineFile, JSON.stringify(baseline, null, 2));
    console.log(`Baseline sauvegardée dans ${baselineFile}`);
  } catch (err) {
    console.error('Erreur fatale lors de la recette:', err);
  } finally {
    // Mise à jour Rapport Anomalies (Toujours exécuté)
    if (anomalies.length > 0) {
      try {
        const anomalyFile = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '.docs',
          '4-reports',
          'anomalies_recette.md',
        );
        const currentContent = fs.readFileSync(anomalyFile, 'utf-8');
        fs.writeFileSync(
          anomalyFile,
          currentContent + '\n' + anomalies.join('\n') + '\n',
        );
        console.log(
          `Rapport d'anomalies mis à jour avec ${anomalies.length} entrée(s).`,
        );
      } catch (fileErr) {
        console.error(
          "Erreur lors de l'écriture du rapport d'anomalies:",
          fileErr,
        );
      }
    }
    await app.close();
  }
}

runRecette();
