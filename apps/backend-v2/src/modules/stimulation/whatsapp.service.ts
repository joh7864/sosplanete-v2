import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère dynamiquement la configuration active avec les identifiants WhatsApp.
   */
  async getActiveConfig(schoolYear?: string) {
    if (schoolYear) {
      const config = await this.prisma.systemConfig.findUnique({
        where: { schoolYear },
      });
      if (config && config.whatsappGeneralUrl && config.whatsappGeneralId) {
        return config;
      }
    }

    // 1. Chercher la config correspondant à une InstanceYear active
    const activeInstanceYear = await this.prisma.instanceYear.findFirst({
      where: { isOpen: true },
      orderBy: { id: 'desc' },
    });
    if (activeInstanceYear) {
      const config = await this.prisma.systemConfig.findUnique({
        where: { schoolYear: activeInstanceYear.schoolYear },
      });
      if (config && config.whatsappGeneralUrl && config.whatsappGeneralId) {
        return config;
      }
    }

    // 2. Sinon chercher la dernière config ayant les champs WhatsApp renseignés
    const configWithWhatsapp = await this.prisma.systemConfig.findFirst({
      where: {
        whatsappGeneralUrl: { not: null },
        whatsappGeneralId: { not: null },
      },
      orderBy: { id: 'desc' },
    });
    return configWithWhatsapp;
  }

  /**
   * Envoi d'une notification générale sur le canal WhatsApp configuré.
   */
  async sendGeneralNotification(message: string, schoolYear?: string) {
    try {
      const config = await this.getActiveConfig(schoolYear);
      if (!config || !config.whatsappGeneralUrl || !config.whatsappGeneralId) {
        this.logger.warn('[WhatsApp] Aucune configuration générale WhatsApp active trouvée pour envoyer la notification.');
        return { ok: false, reason: 'missing_config' };
      }
      return await this.sendMessageToGateway(config.whatsappGeneralUrl, config.whatsappGeneralId, message);
    } catch (e: any) {
      this.logger.error('[WhatsApp] Erreur lors de l\'envoi de la notification générale :', e);
      return { ok: false, error: e.message };
    }
  }

  /**
   * Notification : Défi créé dans l'Arène
   */
  async sendChallengeCreatedNotification(
    challengerTeamName: string,
    targetTeamName: string,
    missionLabel: string,
    pledge?: string,
    schoolYear?: string,
  ) {
    const msg =
      `🚨 *NOUVEAU DÉFI DANS L'ARÈNE TEMPORELLE !*\n` +
      `─────────────────────────\n\n` +
      `⚔️ L'équipe *"${challengerTeamName}"* défie l'équipe *"${targetTeamName}"* !\n` +
      `🎯 *Mission imposée* : "${missionLabel}"\n` +
      `📜 *Gage d'équipe* : "${pledge || 'aucun'}"\n\n` +
      `⏳ _Rendez-vous dans le Codex Evoe pour relever ou esquiver ce défi !_`;
    return this.sendGeneralNotification(msg, schoolYear);
  }

  /**
   * Notification : Défi accepté
   */
  async sendChallengeAcceptedNotification(
    challengerTeamName: string,
    targetTeamName: string,
    missionLabel: string,
    schoolYear?: string,
  ) {
    const msg =
      `⚔️ *DÉFI SPATIO-TEMPOREL ACCEPTÉ !*\n` +
      `─────────────────────────\n\n` +
      `L'équipe *"${targetTeamName}"* relève officiellement le défi lancé par *"${challengerTeamName}"* !\n` +
      `🎯 *Mission en cours* : "${missionLabel}"\n` +
      `⏳ Le compte à rebours est lancé dans l'arène !\n\n` +
      `🚀 _Que la meilleure équipe l'emporte sur Evoe !_`;
    return this.sendGeneralNotification(msg, schoolYear);
  }

  /**
   * Notification : Défi refusé / esquivé
   */
  async sendChallengeDeclinedNotification(
    challengerTeamName: string,
    targetTeamName: string,
    missionLabel: string,
    schoolYear?: string,
  ) {
    const msg =
      `🛡️ *DÉFI SPATIO-TEMPOREL DÉCLINÉ*\n` +
      `─────────────────────────\n\n` +
      `L'équipe *"${targetTeamName}"* a décliné le défi de l'équipe *"${challengerTeamName}"* sur la mission "${missionLabel}".\n\n` +
      `📡 _Restez à l'affût des prochaines provocations temporelles !_`;
    return this.sendGeneralNotification(msg, schoolYear);
  }

  /**
   * Notification : Défi remporté / terminé
   */
  async sendChallengeWonNotification(
    winnerTeamName: string,
    challengerTeamName: string,
    missionLabel: string,
    isRetroactive = false,
    schoolYear?: string,
  ) {
    const msg =
      `⚡ *VICTOIRE DANS L'ARÈNE DES DÉFIS !*\n` +
      `─────────────────────────\n\n` +
      `🏆 L'équipe *"${winnerTeamName}"* a accompli sa mission "${missionLabel}" et triomphe du défi de l'équipe *"${challengerTeamName}"* !\n` +
      (isRetroactive
        ? `✨ _Mission validée immédiatement grâce aux actions déjà accomplies !_ \n\n`
        : `🎉 _Victoire éclatante pour la stabilité du continuum !_ \n\n`) +
      `🚀 _Félicitations aux vainqueurs !_`;
    return this.sendGeneralNotification(msg, schoolYear);
  }

  /**
   * Notification : Évolution / Changement de niveau de vaisseau
   */
  async sendPropulsionLevelUpNotification(
    teamName: string,
    newLevel: number,
    levelName: string,
    schoolYear?: string,
  ) {
    const msg =
      `🚀 *SURSAUT TECHNOLOGIQUE — PROPULSION NIVEAU ${newLevel} !*\n` +
      `─────────────────────────\n\n` +
      `Le vaisseau de l'équipe *"${teamName}"* franchit un palier technologique majeur !\n` +
      `⚡ *Nouvelle Propulsion* : Niveau ${newLevel} — *${levelName}*\n` +
      `🌌 La vitesse et la portée du vaisseau dans le continuum augmentent en flèche !\n\n` +
      `👏 _Bravo à tout l'équipage pour cette avancée collective !_`;
    return this.sendGeneralNotification(msg, schoolYear);
  }

  /**
   * Notification : Montée d'un utilisateur sur le Podium (Top 3)
   */
  async sendPodiumArrivalNotification(
    pseudo: string,
    teamName: string,
    rankNumber: number,
    score: number,
    schoolYear?: string,
  ) {
    const medal = rankNumber === 1 ? '🥇' : rankNumber === 2 ? '🥈' : '🥉';
    const rankLabel = rankNumber === 1 ? '1ère place (LEADER)' : `${rankNumber}e place`;
    const msg =
      `${medal} *NOUVEL AGENT SUR LE PODIUM !*\n` +
      `─────────────────────────\n\n` +
      `L'agent *@${pseudo}* (Équipe *"${teamName}"*) propulse son score et monte sur le podium à la *${rankLabel}* avec *${score.toFixed(0)} points* !\n\n` +
      `🏆 _La course au sommet de l'Arche Temporelle s'intensifie !_`;
    return this.sendGeneralNotification(msg, schoolYear);
  }

  /**
   * Envoi automatique du rapport hebdomadaire tous les lundis à 08h00.
   */
  @Cron('0 8 * * 1')
  async handleWeeklyReportCron() {
    this.logger.log('[CRON WhatsApp] Déclenchement du rapport hebdomadaire...');
    const activeConfig = await this.getActiveConfig();
    if (activeConfig) {
      await this.sendReport(activeConfig.schoolYear);
    } else {
      this.logger.warn('[CRON WhatsApp] Aucun SystemConfig avec WhatsApp actif trouvé.');
    }
  }

  /**
   * Génère et envoie le rapport hebdomadaire à partir des statistiques de la période courante.
   */
  async sendReport(schoolYear?: string) {
    try {
      const systemConfig = await this.getActiveConfig(schoolYear);
      if (!systemConfig || !systemConfig.whatsappGeneralUrl || !systemConfig.whatsappGeneralId) {
        this.logger.warn(`[WhatsApp] Configuration générale non définie pour l'année ${schoolYear || 'active'}. Annulation du rapport.`);
        return { success: false, message: 'Configuration générale WhatsApp manquante.' };
      }

      const sy = systemConfig.schoolYear;

      // 2. Trouver l'instanceYear active
      let instanceYear = await this.prisma.instanceYear.findFirst({
        where: { schoolYear: sy, isOpen: true },
        include: { periods: { where: { isOpen: true } } },
      });
      if (!instanceYear) {
        instanceYear = await this.prisma.instanceYear.findFirst({
          where: { isOpen: true },
          include: { periods: { where: { isOpen: true } } },
        });
      }
      if (!instanceYear) {
        this.logger.warn(`[WhatsApp] Aucune InstanceYear active trouvée pour l'année ${sy}.`);
        return { success: false, message: 'Aucun espace actif.' };
      }

      let activePeriod: any = instanceYear.periods[0];
      if (!activePeriod) {
        activePeriod = await this.prisma.period.findFirst({
          where: { instanceYearId: instanceYear.id },
          orderBy: { id: 'desc' },
        });
      }
      if (!activePeriod) {
        this.logger.warn(`[WhatsApp] Aucune période ouverte trouvée pour l'espace.`);
        return { success: false, message: 'Aucune période ouverte.' };
      }

      // 3. Calculer la charge et les scores par équipe sur la période
      const teams = await this.prisma.team.findMany({
        where: { instanceYearId: instanceYear.id },
        include: {
          evoeTechnology: true,
          groups: {
            include: {
              children: {
                include: {
                  actionsDone: {
                    where: { periodId: activePeriod.id },
                  },
                },
              },
            },
          },
        },
      });

      const totalChildren = teams.reduce((acc, t) => acc + t.groups.reduce((ag, g) => ag + g.children.length, 0), 0);
      if (totalChildren === 0) {
        return { success: false, message: 'Aucun joueur enregistré.' };
      }

      // Calcul des totaux et identification des glitchs
      const teamScores = [];
      const glitchingPlayersByTeam = new Map<number, string[]>();
      let totalCo2Saved = 0;

      for (const team of teams) {
        let teamCo2 = 0;
        const teamGlitchPseudos: string[] = [];

        for (const group of team.groups) {
          for (const child of group.children) {
            const hasActions = child.actionsDone.length > 0;
            if (hasActions) {
              const childCo2 = child.actionsDone.reduce((sum, ad) => sum + ad.savedCo2, 0);
              teamCo2 += childCo2;
              totalCo2Saved += childCo2;
            } else {
              teamGlitchPseudos.push(child.pseudo);
            }
          }
        }

        teamScores.push({
          id: team.id,
          name: team.name,
          co2: teamCo2,
        });

        if (teamGlitchPseudos.length > 0) {
          glitchingPlayersByTeam.set(team.id, teamGlitchPseudos);
        }
      }

      // Trier les équipes par CO2 descendant
      teamScores.sort((a, b) => b.co2 - a.co2);
      const leadingTeam = teamScores[0]?.name || 'Aucune';

      // 4. Calculer la stabilité du Nexus (Timeline)
      const gameConfig = await this.prisma.gameConfig.findFirst({
        where: { instanceId: instanceYear.instanceId, schoolYear: sy },
      });
      const actionsTarget = gameConfig?.avgActionsPerChildPerPeriod || 8;
      const targetCo2 = totalChildren * actionsTarget * 5.0; // 5 kg par action en moyenne
      const stability = Math.min(100, Math.round((totalCo2Saved / (targetCo2 || 1)) * 100));

      // 5. Générer le message général de type SF
      let globalMessage = `🔮 *RAPPORT TEMPOREL EVOE — NEXUS 2070*\n`;
      globalMessage += `─────────────────────────\n\n`;
      globalMessage += `🛡️ *Stabilité de la Timeline* : ${stability}% (Nexus central ${stability >= 80 ? '🟢 Stable' : stability >= 50 ? '🟠 Vacillant' : '🚨 Déstabilisé'})\n\n`;
      
      globalMessage += `🚀 *CLASSEMENT DES VAISSEAUX & PROPULSIONS* :\n`;
      const PROPULSION_THRESHOLDS = [
        { level: 1, name: 'Friction Thermique' },
        { level: 2, name: 'Voiles Photovoltaïques' },
        { level: 3, name: 'Fusion Magnétique' },
        { level: 4, name: 'Résonance Quantique' },
        { level: 5, name: 'Singularité Protonique' },
      ];
      for (let i = 0; i < teamScores.length; i++) {
        const t = teamScores[i];
        const teamObj = teams.find(team => team.id === t.id);
        const techLevel = teamObj?.evoeTechnology?.maxLevel || 1;
        const propName = PROPULSION_THRESHOLDS.find(p => p.level === techLevel)?.name || 'Friction Thermique';
        const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🛸';
        globalMessage += `${rankEmoji} *Équipe ${t.name}* : Propulsion N${techLevel} (${propName}) — ${t.co2.toFixed(1)} kg CO2e\n`;
      }
      globalMessage += `\n`;

      // Lister tous les glitchs
      const allGlitchPseudos = Array.from(glitchingPlayersByTeam.values()).flat();
      if (allGlitchPseudos.length > 0) {
        globalMessage += `⚠️ *Alerte Paradoxe Ancestral* : Certains Watchmen n'ont pas synchronisé leur Codex cette semaine. Leurs descendants glitcheront bientôt en 2070 :\n`;
        globalMessage += allGlitchPseudos.map((p) => `• @${p}`).join('\n') + `\n\n`;
      } else {
        globalMessage += `✨ Aucun paradoxe temporel détecté. Tous les descendants d'équipage sont physiquement complets ! 🧬\n\n`;
      }

      globalMessage += `🔗 _Consultez vos missions et propulsez votre vaisseau sur Evoe !_`;

      // Envoyer le message unique au groupe WhatsApp EVOE
      const result = await this.sendMessageToGateway(systemConfig.whatsappGeneralUrl, systemConfig.whatsappGeneralId, globalMessage);

      return { success: result.ok, stability, leadingTeam, glitchCount: allGlitchPseudos.length, result };
    } catch (e: any) {
      this.logger.error('Erreur lors de la génération du rapport WhatsApp :', e);
      return { success: false, message: e.message };
    }
  }

  /**
   * Envoi d'un message de test manuel depuis l'Admin (avec fallback simulateur).
   */
  async sendTestMessage(
    schoolYear?: string,
    customGatewayUrl?: string,
    customChatId?: string,
    customMessage?: string,
  ) {
    const systemConfig = await this.getActiveConfig(schoolYear);

    const gatewayUrl = customGatewayUrl || systemConfig?.whatsappGeneralUrl;
    const chatId = customChatId || systemConfig?.whatsappGeneralId;
    const communityName = systemConfig?.whatsappCommunityName || 'Communauté SOS Planète';

    const testMsg =
      customMessage ||
      `🧪 *TEST DU CANAL TEMPOREL — ${communityName.toUpperCase()}*\n` +
      `─────────────────────────\n\n` +
      `✅ Connexion établie avec succès entre le serveur EVOE et ce canal WhatsApp.\n` +
      `📢 Les alertes de jeu, duels et bilans hebdo seront transmis ici.\n\n` +
      `🚀 _Transmission test réussie !_`;

    if (!gatewayUrl || !chatId) {
      return {
        success: false,
        simulated: true,
        message: 'URL de passerelle ou Identifiant de canal non configuré. Mode simulation actif.',
        previewText: testMsg,
      };
    }

    const result = await this.sendMessageToGateway(gatewayUrl, chatId, testMsg);
    return {
      success: result.ok,
      simulated: false,
      message: result.ok ? 'Message de test transmis à la passerelle WhatsApp.' : `Échec de la transmission (Erreur HTTP ${result.status || 'Interne'})`,
      previewText: testMsg,
      result,
    };
  }

  /**
   * Envoi de message HTTP POST vers l'API / passerelle WhatsApp configurée.
   */
  private async sendMessageToGateway(gatewayUrl: string, chatId: string, message: string) {
    try {
      const apiKey = process.env.EVOLUTION_API_KEY || 'evoe4=SecretWhatsappAPI07!';
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: chatId,
          text: message,
        }),
      });

      if (!response.ok) {
        this.logger.warn(`[WhatsApp API] Échec de l'envoi du message à ${chatId}. Code: ${response.status}`);
        return { ok: false, status: response.status };
      } else {
        this.logger.log(`[WhatsApp API] Message envoyé avec succès à ${chatId}.`);
        return { ok: true, status: response.status };
      }
    } catch (error: any) {
      this.logger.error(`[WhatsApp API] Erreur d'appel de passerelle pour ${chatId} :`, error);
      return { ok: false, error: error.message };
    }
  }
}
