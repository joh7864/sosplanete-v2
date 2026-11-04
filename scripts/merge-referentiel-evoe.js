const fs = require('fs');
const path = require('path');

const refPath = path.join(__dirname, '..', '.docs', '5-tests', 'Referentiel_actions_V4.csv');
const evoePath = path.join(__dirname, '..', '.docs', '3-fct', 'Missiosn Evoe.csv');
const outPath = path.join(__dirname, '..', '.docs', '5-tests', 'Referentiel_actions_complet_v1_et_evoe.csv');

// Simple CSV parser for semicolon delimited with possible quotes
function parseSemicolonCsv(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  const header = lines[0].split(';').map(h => h.trim());
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split on ; but protect quotes if needed
    const parts = rawLine.split(';');
    const row = {};
    header.forEach((col, idx) => {
      row[col] = (parts[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return { header, rows };
}

const refData = parseSemicolonCsv(fs.readFileSync(refPath, 'utf8'));
const evoeData = parseSemicolonCsv(fs.readFileSync(evoePath, 'utf8'));

console.log(`Ref rows: ${refData.rows.length}, Evoe rows: ${evoeData.rows.length}`);

// Header for the combined CSV
const combinedHeaders = [
  'ID_REF action',
  'Catégorie',
  'Titre action (SOSPlanète-v1)',
  'Titre mission SF (Evoe)',
  'Description mission SF (Evoe)',
  'Description action (SOSPlanète-v1)',
  'CO2e (kg CO2e / sem)',
  'Eau (l /sem)',
  'Déchets (kg /sem)',
  'tCO2e /an',
  'Impact',
  'Impact total',
  'Etoile pondéré',
  'Image v1',
  'Hypothese_Calcul'
];

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const outLines = [];
outLines.push(combinedHeaders.join(';'));

for (let i = 0; i < refData.rows.length; i++) {
  const r = refData.rows[i];
  const e = evoeData.rows[i];

  const rowCols = [
    r['ID_REF action'] || '',
    r['Catégorie'] || '',
    r['Titre action'] || '',
    e['mission_titre'] || '',
    e['description'] || '',
    r['Description'] || '',
    r['CO2e (kg CO2e / sem)'] || '0',
    r['Eau (l /sem)'] || '0',
    r['Déchetss kg /sem)'] || r['Déchets (kg /sem)'] || '0',
    r['tCO2e /an'] || '0',
    r['Impact'] || '',
    r['Impact total'] || '0',
    r['Etoile pondéré'] || '0',
    r['Image'] || '',
    r['Hypothese_Calcul'] || ''
  ];

  outLines.push(rowCols.map(escapeCsvCell).join(';'));
}

fs.writeFileSync(outPath, '\ufeff' + outLines.join('\r\n'), 'utf8');
console.log(`✅ Fichier généré avec succès : ${outPath}`);
