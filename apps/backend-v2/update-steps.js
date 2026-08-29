const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDb() {
  const steps = [
    { id: 1, badge: 'Étape 1 / 12', title: '🚀 Bienvenue à bord, Agent !', targetId: 'hud-agent-profile', position: 'bottom', explanation: "Vous appartenez à l'équipage de l'Arche Temporelle. Votre bio-stabilité et votre identité d'agent s'affichent ici. Vos éco-gestes réels restaurent l'avenir planétaire !" },
    { id: 2, badge: 'Étape 2 / 12', title: '🌍 La Passerelle & Les Secteurs Écologiques', targetId: 'sector-orb-guide', position: 'bottom', explanation: "Voici la Terre en 2026 entourée de ses orbes cristallines de secteurs écologiques (Eau, Énergie, Biodiversité, Recyclage...). Cliquez sur un orbe 3D pour ouvrir ses éco-missions." },
    { id: 3, badge: 'Étape 3 / 12', title: '⚡ Le Codex & Impulsion d\'une Mission', targetId: 'hud-active-mission-card', position: 'left', explanation: "Quand vous accomplissez une action éco-responsable dans la vraie vie, cliquez sur 'Impulser'. Vous gagnez des points IT (Impulsions Temporelles) et réduisez l'empreinte carbone collective de l'équipage." },
    { id: 4, badge: 'Étape 4 / 12', title: '⚡ La Puissance des Impulsions Temporelles (IT)', targetId: 'mission-card-it-counter', position: 'left', explanation: "Les IT représentent la puissance de l'énergie vitale envoyée vers le futur. Chaque éco-geste réel accompli génère des IT. Plus vous accumulez d'IT, plus le futur se régénère rapidement et évolue dans le bon sens !" },
    { id: 5, badge: 'Étape 5 / 12', title: '🌕 L\'Arène des Défis Temporels', targetId: 'hud-moon-arena', position: 'bottom', explanation: "Cliquez sur la Lune en orbite ou le badge d'un joueur pour entrer dans l'arène des défis. Défiez les équipes adverses avec un chrono (24h/48h) et un gage d'équipe !" },
    { id: 6, badge: 'Étape 6 / 12', title: '📊 TERRE 2070 : % RÉGÉNÉRÉE', targetId: 'hud-completion-bar', position: 'bottom', explanation: "Suivez la jauge de régénération planétaire en direct. Plus votre équipage accomplit d'éco-gestes réels, plus le score d'accomplissement augmente et plus la Terre se refroidit à l'horizon 2070 !" },
    { id: 7, badge: 'Étape 7 / 12', title: '⏳ Projection Temporelle : Cap sur 2070', targetId: 'hud-epoch-switch', position: 'bottom', explanation: "Basculez à tout moment vers l'ère 2070 pour explorer la Terre régénérée dans le futur et visualiser en direct l'impact à long terme des actions de votre équipage !" },
    { id: 8, badge: 'Étape 8 / 12', title: '🔮 Extrapolation 2070 & Bilan d\'Impact', targetId: 'panel-extrapolation-2070', position: 'right', explanation: "Explorez le tableau d'extrapolation 2070 ! Visualisez le recul du Jour de Dépassement Mondial, la glace arctique préservée et les équivalences en piscines d'eau potable et camions évités." },
    { id: 9, badge: 'Étape 9 / 12', title: '🚀 Radar Temporel & Évolution des Vaisseaux', targetId: 'panel-radar-2070', position: 'left', explanation: "Chaque vaisseau possède 5 niveaux d'évolution. Vous franchissez des paliers technologiques selon votre progression globale de régénération :\\n- N1 (0%) : Friction Thermique\\n- N2 (25%) : Voiles Photovoltaïques\\n- N3 (45%) : Fusion Magnétique\\n- N4 (65%) : Résonance Quantique\\n- N5 (85%) : Singularité Protonique" },
    { id: 10, badge: 'Étape 10 / 12', title: '🏆 Podium 3D & Progression', targetId: 'btn-podium-leaderboard', position: 'left', explanation: "Consultez le classement général sur le podium holographique 3D et cliquez sur n'importe quel avatar d'agent pour inspecter sa fiche, ses badges et son palmarès." },
    { id: 11, badge: 'Étape 11 / 12', title: '💬 Com-Link & Messagerie d\'Équipage', targetId: 'chat-panel-container', position: 'left', explanation: "Ouvrez le Com-Link spatial pour dialoguer en direct avec votre équipage, coordonner vos actions éco-responsables et débriefer vos stratégies de mission !" },
    { id: 12, badge: 'Étape 12 / 12', title: '📡 Canal WhatsApp Équipe & Alertes', targetId: 'hud-btn-whatsapp', position: 'left', explanation: "Rejoignez le groupe WhatsApp officiel de votre équipe pour recevoir instantanément les notifications de défis reçus, les alertes d'impact et rester connecté !" }
  ];

  await prisma.systemConfig.updateMany({
    data: {
      ftuxSteps: steps
    }
  });

  console.log('Database updated!');
  await prisma.$disconnect();
}

updateDb().catch(e => {
  console.error(e);
  process.exit(1);
});
