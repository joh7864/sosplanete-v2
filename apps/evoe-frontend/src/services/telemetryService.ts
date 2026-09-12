import axios from 'axios';

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3011/legacy';
const BASE_API_URL = VITE_API_URL.replace(/\/legacy\/?$/, '');

export interface TelemetryEvent {
  eventType: 'LOGIN' | 'LOGOUT' | 'PAGE_VIEW' | 'MISSION_DONE' | 'MISSION_CANCELLED' | 'CHALLENGE_INTERACTION' | 'EASTER_EGG_INTERACTION' | 'HEARTBEAT';
  target: string;
  label?: string;
  timeSpentSeconds?: number;
  metadata?: any;
  timestamp?: string;
}

class TelemetryService {
  private sessionId: string | null = null;
  private childId: number | null = null;
  private childPseudo: string | null = null;
  private instanceId: number | null = null;
  private schoolYear: string | null = null;
  private queue: TelemetryEvent[] = [];
  private flushTimer: any = null;
  private currentView: string = 'QG_2026';
  private viewStartTime: number = Date.now();
  private initPromise: Promise<string | null> | null = null;

  public getSessionId(): string | null {
    return this.sessionId;
  }

  public getChildId(): number | null {
    return this.childId;
  }

  public getChildPseudo(): string | null {
    return this.childPseudo;
  }

  public getInstanceId(): number | null {
    return this.instanceId;
  }

  public getSchoolYear(): string | null {
    return this.schoolYear;
  }

  public destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  constructor() {
    // Récupérer la session stockée en sessionStorage si existante
    if (typeof window !== 'undefined') {
      this.sessionId = sessionStorage.getItem('evoe_session_id');
      const savedChildId = sessionStorage.getItem('evoe_session_child_id');
      const savedPseudo = sessionStorage.getItem('evoe_session_child_pseudo');
      if (savedChildId) this.childId = parseInt(savedChildId, 10);
      if (savedPseudo) this.childPseudo = savedPseudo;

      // Flush automatique et heartbeat de présence toutes les 30 secondes
      this.flushTimer = setInterval(() => {
        if (this.sessionId && this.queue.length === 0) {
          this.logEvent('HEARTBEAT', this.currentView, 'Signal de présence');
        }
        this.flush();
      }, 30000);

      // Flush propre sans fermeture prématurée lors du déchargement ou masquage de l'onglet
      window.addEventListener('beforeunload', () => {
        this.recordCurrentViewTime();
        this.flush();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.recordCurrentViewTime();
          this.flush();
        }
      });

      // Écoute de l'orientation pour mettre à jour les métadonnées
      window.addEventListener('orientationchange', () => {
        this.logEvent('PAGE_VIEW', this.currentView, `Bascule d'orientation : ${this.getDeviceType()}`);
      });
    }
  }

  public getDeviceType(): string {
    if (typeof window === 'undefined') return 'DESKTOP';
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Ordinateurs de bureau : non-mobile UA et écran large
    if (!isMobileUA && (!isTouch || window.innerWidth > 1024)) {
      return 'DESKTOP';
    }
    const isLandscape = window.innerWidth > window.innerHeight;
    return isLandscape ? 'MOBILE_LANDSCAPE' : 'MOBILE_PORTRAIT';
  }

  public getBrowser(): string {
    if (typeof navigator === 'undefined') return 'Autre';
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Autre';
  }

  public getOS(): string {
    if (typeof navigator === 'undefined') return 'Autre';
    const ua = navigator.userAgent;
    // Vérifier Android et iOS avant Linux (car Android UA contient aussi Linux)
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Autre';
  }

  /**
   * Démarre une session dès que l'enfant est identifié dans AuthContext
   */
  public async initSession(params: {
    childId: number;
    childPseudo: string;
    instanceId: number;
    schoolYear: string;
    instanceYearId?: number;
  }): Promise<string | null> {
    this.childId = params.childId;
    this.childPseudo = params.childPseudo;
    this.instanceId = params.instanceId;
    this.schoolYear = params.schoolYear;

    const savedChildId = sessionStorage.getItem('evoe_session_child_id');
    sessionStorage.setItem('evoe_session_child_id', params.childId.toString());
    sessionStorage.setItem('evoe_session_child_pseudo', params.childPseudo);

    // Si on a déjà une session active pour le même enfant, on continue
    if (this.sessionId && savedChildId === params.childId.toString()) {
      return this.sessionId;
    }

    // Éviter les créations concurrentes simultanées
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const resp = await axios.post(`${BASE_API_URL}/tracking/telemetry/session/start`, {
          childId: params.childId,
          childPseudo: params.childPseudo,
          instanceId: params.instanceId,
          schoolYear: params.schoolYear,
          instanceYearId: params.instanceYearId,
          deviceType: this.getDeviceType(),
          browser: this.getBrowser(),
          os: this.getOS(),
        });

        if (resp.data?.sessionId) {
          this.sessionId = resp.data.sessionId;
          sessionStorage.setItem('evoe_session_id', resp.data.sessionId);
        }
      } catch (e) {
        console.warn('[Telemetry] Impossible d’initier la session:', e);
      } finally {
        this.initPromise = null;
      }
      return this.sessionId;
    })();

    return this.initPromise;
  }

  /**
   * Enregistre le temps passé sur la vue courante avant transition
   */
  private recordCurrentViewTime() {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - this.viewStartTime) / 1000));
    this.queue.push({
      eventType: 'PAGE_VIEW',
      target: this.currentView,
      label: this.getViewLabel(this.currentView),
      timeSpentSeconds: elapsedSeconds,
      timestamp: new Date().toISOString(),
    });
    this.viewStartTime = Date.now();
  }

  private getViewLabel(view: string): string {
    const labels: Record<string, string> = {
      'QG_2026': 'Passerelle Orbitale 2026',
      'WORLD_2070': 'Voyage Temporel 2070',
      'CODEX_MISSIONS': 'Codex des Missions Écologiques',
      'AGENT_PROFILE': 'Fiche Profil d’Agent',
      'COMM_LINK': 'Comm-Link (Messagerie)',
      'LEADERBOARD': 'Classement Spatial 3D',
      'CHALLENGES': 'Arène des Défis PvP',
      'ABOUT_LOG': 'Journal de Bord & Spécifications',
      'ONBOARDING_GUIDE': 'Guide Interactif QG',
    };
    return labels[view] || view;
  }

  /**
   * Notifie une transition macroscopique vers une nouvelle vue/modale
   */
  public trackView(newView: string) {
    if (newView === this.currentView) return;
    this.recordCurrentViewTime();
    this.currentView = newView;
    this.viewStartTime = Date.now();

    // Flush si la file grossit
    if (this.queue.length >= 8) {
      this.flush();
    }
  }

  /**
   * Enregistre un événement générique (Mission validée, défi, etc.)
   */
  public logEvent(
    eventType: TelemetryEvent['eventType'],
    target: string,
    label?: string,
    metadata?: any,
    timeSpentSeconds: number = 0,
  ) {
    this.queue.push({
      eventType,
      target,
      label,
      timeSpentSeconds,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // Envoi immédiat pour les actions majeures
    if (eventType === 'MISSION_DONE' || eventType === 'MISSION_CANCELLED' || eventType === 'EASTER_EGG_INTERACTION') {
      this.flush();
    }
  }

  /**
   * Envoie les événements accumulés vers le backend
   */
  public async flush() {
    if (!this.sessionId || this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      await axios.post(`${BASE_API_URL}/tracking/telemetry/events`, {
        sessionId: this.sessionId,
        events: eventsToSend,
      });
    } catch (e) {
      // En cas d'échec réseau, on remet les événements dans la file
      this.queue = [...eventsToSend, ...this.queue];
      console.warn('[Telemetry] Échec de l’envoi des événements (buffer conservé):', e);
    }
  }

  /**
   * Clôture la session lors d'une déconnexion explicite
   */
  public async endSession() {
    this.recordCurrentViewTime();
    const sid = this.sessionId;
    this.sessionId = null;
    sessionStorage.removeItem('evoe_session_id');

    if (!sid) return;

    // Vider la file
    if (this.queue.length > 0) {
      await this.flush();
    }

    try {
      await axios.post(`${BASE_API_URL}/tracking/telemetry/close`, { sessionId: sid });
    } catch (e) {
      console.warn('[Telemetry] Échec de fermeture de session:', e);
    }
  }

  /**
   * Clôture rapide par balise Beacon lors du déchargement de fenêtre
   */
  private endSessionBeacon() {
    if (!this.sessionId) return;
    const sid = this.sessionId;

    // Envoi du reliquat d'événements et fermeture
    const closeUrl = `${BASE_API_URL}/tracking/telemetry/close`;
    const payload = JSON.stringify({ sessionId: sid });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(closeUrl, blob);
    } else {
      fetch(closeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }
}

export const telemetry = new TelemetryService();
