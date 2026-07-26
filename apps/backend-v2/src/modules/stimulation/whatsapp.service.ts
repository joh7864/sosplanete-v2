import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Envoi automatique du rapport hebdomadaire tous les lundis à 08h00.
   */
  @Cron('0 8 * * 1')
  async handleWeeklyReportCron() {
    this.logger.log('[CRON WhatsApp] Déclenchement du rapport hebdomadaire...');
    // Récupérer l'année scolaire en cours (on cible par défaut '2024-2025' ou la dernière active)
    const activeConfig = await this.prisma.systemConfig.findFirst({
      orderBy: { id: 'desc' },
    });
    if (activeConfig) {
      await this.sendReport(activeConfig.schoolYear);
    }
  }

  /**
   * Génère et envoie le rapport hebdomadaire à partir des statistiques de la période courante.
   */
  async sendReport(schoolYear: string) {
    try {
      const sy = schoolYear || '2024-2025';

      // 1. Récupérer la configuration générale WhatsApp
      const systemConfig = await this.prisma.systemConfig.findUnique({
        where: { schoolYear: sy },
      });
      if (!systemConfig || !systemConfig.whatsappGeneralUrl || !systemConfig.whatsappGeneralId) {
        this.logger.warn(`[WhatsApp] Configuration générale non définie pour l'année ${sy}. Annulation du rapport.`);
        return { success: false, message: 'Configuration générale WhatsApp manquante.' };
      }

      // 2. Trouver l'instanceYear active
      const instanceYear = await this.prisma.instanceYear.findFirst({
        where: { schoolYear: sy, isOpen: true },
        include: { periods: { where: { isOpen: true } } },
      });
      if (!instanceYear) {
        this.logger.warn(`[WhatsApp] Aucune InstanceYear active trouvée pour l'année ${sy}.`);
        return { success: false, message: 'Aucun espace actif.' };
      }

      const activePeriod = instanceYear.periods[0];
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
          whatsappGroupId: team.whatsappGroupId,
        });

        if (teamGlitchPseudos.length > 0) {
          glitchingPlayersByTeam.set(team.id, teamGlitchPseudos);
        }
      }

      // Trier les équipes par CO2 descendant
      teamScores.sort((a, b) => b.co2 - a.co2);
      const leadingTeam = teamScores[0]?.name || 'Aucune';

      // 4. Calculer la stabilité du Nexus (Timeline)
      // Cible : 5 kg de CO2 par joueur et par action, avec une cible configurée d'actions par période (ex: 8)
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

      globalMessage += `🔗 _Consultez vos missions et propulsez votre vaisseau sur Evoe !_`;;

      // Envoyer le message au groupe général
      await this.sendMessageToGateway(systemConfig.whatsappGeneralUrl, systemConfig.whatsappGeneralId, globalMessage);

      // 6. Envoyer les alertes ciblées par équipe
      for (const team of teamScores) {
        const teamGlitchPseudos = glitchingPlayersByTeam.get(team.id);
        if (teamGlitchPseudos && teamGlitchPseudos.length > 0 && team.whatsappGroupId) {
          let teamMessage = `🧬 *ALERTES DE PARADOXE TEMPOREL — VAISSEAU ${team.name.toUpperCase()}*\n`;
          teamMessage += `─────────────────────────\n\n`;
          teamMessage += `⚠️ Attention équipage, certains membres créent un paradoxe temporel car ils n'ont validé aucune action cette semaine :\n`;
          teamMessage += teamGlitchPseudos.map((p) => `• @${p} (Son descendant s'efface... 🔌)`).join('\n') + `\n\n`;
          teamMessage += `Faites vos rapports de mission au Codex pour propulser vos moteurs ! 🚀`;

          await this.sendMessageToGateway(systemConfig.whatsappGeneralUrl, team.whatsappGroupId, teamMessage);
        }
      }

      return { success: true, stability, leadingTeam, glitchCount: allGlitchPseudos.length };
    } catch (e) {
      this.logger.error('Erreur lors de la génération du rapport WhatsApp :', e);
      return { success: false, message: e.message };
    }
  }

  /**
   * Envoi d'un message de test manuel depuis l'Admin (avec fallback simulateur).
   */
  async sendTestMessage(
    schoolYear: string,
    customGatewayUrl?: string,
    customChatId?: string,
    customMessage?: string,
  ) {
    const sy = schoolYear || '2024-2025';
    const systemConfig = await this.prisma.systemConfig.findFirst({
      where: { schoolYear: sy },
    });

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
      success: true,
      simulated: false,
      message: 'Message de test transmis à la passerelle WhatsApp.',
      previewText: testMsg,
      result,
    };
  }

  /**
   * Envoi de message HTTP POST vers l'API / passerelle WhatsApp configurée.
   */
  private async sendMessageToGateway(gatewayUrl: string, chatId: string, message: string) {
    try {
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          message,
        }),
      });

      if (!response.ok) {
        this.logger.warn(`[WhatsApp API] Échec de l'envoi du message à ${chatId}. Code: ${response.status}`);
        return { ok: false, status: response.status };
      } else {
        this.logger.log(`[WhatsApp API] Message envoyé avec succès à ${chatId}.`);
        return { ok: true, status: response.status };
      }
    } catch (error) {
      this.logger.error(`[WhatsApp API] Erreur d'appel de passerelle pour ${chatId} :`, error);
      return { ok: false, error: error.message };
    }
  }
}
