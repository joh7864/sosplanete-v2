import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CsvRow {
  prenom: string;
  pseudo: string;
  dateStr: string; // DD/MM/YYYY
  parsedDate: Date | null;
  day: number | null;
  month: number | null;
  year: number | null;
}

/**
 * Formate une Date JS en DD/MM/YYYY (en UTC)
 */
function formatDateUTC(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return 'Aucune';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parse une chaîne DD/MM/YYYY en Date UTC (12:00:00Z)
 */
function parseDateFrench(str: string): { date: Date | null; day: number | null; month: number | null; year: number | null } {
  if (!str || !str.trim()) return { date: null, day: null, month: null, year: null };
  const parts = str.trim().split('/');
  if (parts.length !== 3) return { date: null, day: null, month: null, year: null };
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return { date: null, day: null, month: null, year: null };
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  return { date, day, month, year };
}

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`\n======================================================================`);
  console.log(`  SYNCHRONISATION DES DATES DE NAISSANCE DEPUIS LE FICHIER CSV`);
  console.log(`  Mode : ${isApply ? '🚀 APPLICATION RÉELLE (--apply)' : '🔍 SIMULATION / DRY-RUN (ajoutez --apply pour enregistrer)'}`);
  console.log(`======================================================================\n`);

  // Recherche du fichier CSV dans plusieurs emplacements relatifs possibles
  const possiblePaths = [
    path.resolve(__dirname, '../../../.docs/3-fct/Nom-Pseudo-Naissance.csv'),
    path.resolve(process.cwd(), '.docs/3-fct/Nom-Pseudo-Naissance.csv'),
    path.resolve(process.cwd(), '../../.docs/3-fct/Nom-Pseudo-Naissance.csv'),
    path.resolve(__dirname, '../.docs/3-fct/Nom-Pseudo-Naissance.csv'),
  ];

  let csvPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p;
      break;
    }
  }

  // Vérification de l'argument --file personnalisé
  const fileArgIndex = process.argv.indexOf('--file');
  if (fileArgIndex !== -1 && process.argv[fileArgIndex + 1]) {
    csvPath = path.resolve(process.argv[fileArgIndex + 1]);
  }

  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error(`❌ Fichier CSV introuvable. Emplacements testés :`, possiblePaths);
    process.exit(1);
  }

  console.log(`📄 Fichier CSV utilisé : ${csvPath}`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  // Parsing du CSV
  const csvRows: CsvRow[] = [];
  // La première ligne est l'en-tête (Prenom;Pseudo;Date naissance)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 2) continue;
    const prenom = (cols[0] || '').trim();
    const pseudo = (cols[1] || '').trim();
    const dateStr = (cols[2] || '').trim();
    const { date, day, month, year } = parseDateFrench(dateStr);
    csvRows.push({
      prenom,
      pseudo,
      dateStr,
      parsedDate: date,
      day,
      month,
      year,
    });
  }

  console.log(`📋 Entrées trouvées dans le CSV : ${csvRows.length}\n`);

  // Récupération de tous les enfants de la base
  const allChildren = await prisma.child.findMany({
    select: {
      id: true,
      pseudo: true,
      birthDate: true,
      group: {
        select: {
          id: true,
          name: true,
          team: {
            select: {
              id: true,
              name: true,
              instanceYear: {
                select: {
                  schoolYear: true,
                  instance: { select: { schoolName: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const updatedEntries: any[] = [];
  const compliantEntries: any[] = [];
  const notFoundInDb: any[] = [];
  const emptyInCsv: any[] = [];

  for (const row of csvRows) {
    // Recherche par pseudo insensible à la casse
    let matchingChildren = allChildren.filter(
      (c) => c.pseudo.toLowerCase() === row.pseudo.toLowerCase()
    );

    // Cas particulier de faute de frappe dans le CSV ou la base (ex: willims / william)
    if (matchingChildren.length === 0) {
      if (row.pseudo.toLowerCase() === 'willims') {
        matchingChildren = allChildren.filter((c) => c.pseudo.toLowerCase() === 'william');
      } else if (row.pseudo.toLowerCase() === 'william') {
        matchingChildren = allChildren.filter((c) => c.pseudo.toLowerCase() === 'willims');
      }
    }

    if (matchingChildren.length === 0) {
      notFoundInDb.push({
        prenom: row.prenom,
        pseudo: row.pseudo,
        csvDate: row.dateStr || '(non renseignée)',
      });
      continue;
    }

    if (!row.parsedDate) {
      emptyInCsv.push({
        prenom: row.prenom,
        pseudo: row.pseudo,
        matchingIds: matchingChildren.map((c) => c.id),
        currentDbDates: matchingChildren.map((c) => formatDateUTC(c.birthDate)),
      });
      continue;
    }

    for (const child of matchingChildren) {
      const currentDbStr = formatDateUTC(child.birthDate);
      const targetStr = row.dateStr;

      if (currentDbStr === targetStr) {
        compliantEntries.push({
          id: child.id,
          pseudo: child.pseudo,
          prenom: row.prenom,
          date: targetStr,
          team: child.group?.team?.name || 'Sans équipe',
        });
      } else {
        updatedEntries.push({
          id: child.id,
          pseudo: child.pseudo,
          prenom: row.prenom,
          oldDate: currentDbStr,
          newDate: targetStr,
          team: child.group?.team?.name || 'Sans équipe',
          targetDateObj: row.parsedDate,
        });

        if (isApply) {
          await prisma.child.update({
            where: { id: child.id },
            data: { birthDate: row.parsedDate },
          });
        }
      }
    }
  }

  // Joueurs en base qui ne sont pas dans le CSV
  const csvPseudosLower = new Set(csvRows.map((r) => r.pseudo.toLowerCase()));
  // Inclure aussi l'alias william/willims
  csvPseudosLower.add('william');
  csvPseudosLower.add('willims');

  const inDbNotInCsv = allChildren.filter(
    (c) => c.birthDate !== null && !csvPseudosLower.has(c.pseudo.toLowerCase())
  );

  // ==================== RAPPORT DÉTAILLÉ ====================
  console.log(`\n======================================================================`);
  console.log(`  1. MODIFICATIONS ${isApply ? 'APPLIQUÉES' : 'À APPLIQUER'} (${updatedEntries.length})`);
  console.log(`======================================================================`);
  if (updatedEntries.length === 0) {
    console.log(`  ✓ Aucune modification nécessaire, toutes les dates sont synchronisées !`);
  } else {
    for (const item of updatedEntries) {
      const actionSymbol = isApply ? '✅ Mis à jour' : '⚡ Différence détectée';
      console.log(
        `  ${actionSymbol} [ID ${item.id}] ${item.prenom} (@${item.pseudo}) - Équipe: ${item.team}`
      );
      console.log(`     DB actuelle : ${item.oldDate} -> Nouveau (CSV) : ${item.newDate}`);
    }
  }

  console.log(`\n======================================================================`);
  console.log(`  2. PERSONNES DU CSV NON TROUVÉES DANS LA BASE (${notFoundInDb.length})`);
  console.log(`======================================================================`);
  if (notFoundInDb.length === 0) {
    console.log(`  ✓ Tous les pseudos du CSV ont été trouvés dans la base.`);
  } else {
    for (const item of notFoundInDb) {
      console.log(`  ⚠️  ${item.prenom} (pseudo: "${item.pseudo}") - Date CSV: ${item.csvDate}`);
    }
  }

  console.log(`\n======================================================================`);
  console.log(`  3. PERSONNES DU CSV SANS DATE DE NAISSANCE (${emptyInCsv.length})`);
  console.log(`======================================================================`);
  for (const item of emptyInCsv) {
    console.log(
      `  ℹ️  ${item.prenom} (pseudo: "${item.pseudo}") - ID(s) DB: ${item.matchingIds.join(', ')} - Date(s) actuelle(s) en DB: ${item.currentDbDates.join(', ')}`
    );
  }

  console.log(`\n======================================================================`);
  console.log(`  4. DATES DÉJÀ CONFORMES ENTRE CSV ET BASE (${compliantEntries.length})`);
  console.log(`======================================================================`);
  for (const item of compliantEntries) {
    console.log(`  ✓ [ID ${item.id}] ${item.prenom} (@${item.pseudo}) : ${item.date} (${item.team})`);
  }

  console.log(`\n======================================================================`);
  console.log(`  5. JOUEURS EN BASE AVEC DATE QUI NE SONT PAS DANS LE CSV (${inDbNotInCsv.length})`);
  console.log(`======================================================================`);
  for (const c of inDbNotInCsv) {
    console.log(
      `  🔹 [ID ${c.id}] @${c.pseudo} : ${formatDateUTC(c.birthDate)} (Équipe: ${c.group?.team?.name || 'Sans équipe'})`
    );
  }

  console.log(`\n======================================================================`);
  console.log(`  RÉSUMÉ GLOBAL`);
  console.log(`======================================================================`);
  console.log(`  Total lignes CSV             : ${csvRows.length}`);
  console.log(`  Dates conformes              : ${compliantEntries.length}`);
  console.log(`  Dates modifiées / à modifier : ${updatedEntries.length}`);
  console.log(`  Non trouvés dans la base     : ${notFoundInDb.length}`);
  console.log(`  Sans date dans le CSV        : ${emptyInCsv.length}`);
  console.log(`  En base hors CSV             : ${inDbNotInCsv.length}`);
  console.log(`======================================================================\n`);

  if (!isApply && updatedEntries.length > 0) {
    console.log(`💡 Pour appliquer réellement ces modifications en base, lancez :`);
    console.log(`   npx tsx scripts/sync-birthdates-from-csv.ts --apply\n`);
  }
}

main()
  .catch((e) => {
    console.error('Erreur lors de la synchronisation :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
