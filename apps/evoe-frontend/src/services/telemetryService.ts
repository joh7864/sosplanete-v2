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
  private instanceYearId?: number;

  private queue: TelemetryEvent[] = [];
  private flushTimer: any = null;
  private tickTimer: any = null;

  private currentView: string = 'QG_2026';
  private initPromise: Promise<string | null> | null = null;

  // --- Suivi du Temps Actif & Détection d'Inactivité ---
  // Seuil d'inactivité : 5 minutes sans action = gel du compteur
  private readonly IDLE_TIMEOUT_MS = 5 * 60 * 1000;
  // Seuil de rupture de session : 15 minutes d'inactivité continue = nouvelle session au réveil
  private readonly SESSION_BREAK_TIMEOUT_MS = 15 * 60 * 1000;

  private activeSecondsOnCurrentView: number = 0;
  private lastActivityTime: number = Date.now();
  private lastTickTime: number = Date.now();
  private isIdle: boolean = false;
  private isTabVisible: boolean = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
  private lastThrottledActivityTime: number = 0;

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
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.removeActivityListeners();
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionId = sessionStorage.getItem('evoe_session_id');
      const savedChildId = sessionStorage.getItem('evoe_session_child_id');
      const savedPseudo = sessionStorage.getItem('evoe_session_child_pseudo');
      if (savedChildId) this.childId = parseInt(savedChildId, 10);
      if (savedPseudo) this.childPseudo = savedPseudo;

      this.isTabVisible = document.visibilityState === 'visible';
      this.lastActivityTime = Date.now();
      this.lastTickTime = Date.now();

      // Horloge d'accumulation du temps actif réel (1 tick par seconde)
      this.tickTimer = setInterval(() => {
        this.tick();
      }, 1000);

      // Heartbeat toutes les 30 secondes envoyé UNIQUEMENT si l'onglet est visible ET actif
      this.flushTimer = setInterval(() => {
        if (this.sessionId && this.isTabVisible && !this.isIdle) {
          if (this.queue.length === 0) {
            this.logEvent('HEARTBEAT', this.currentView, 'Signal de présence');
          }
          this.flush();
        }
      }, 30000);

      // Écoute des interactions utilisateur
      this.attachActivityListeners();

      // Coupure immédiate du temps dès que l'onglet est masqué ou minimisé
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Arrêt immédiat de l'accumulation
          this.tick();
          this.isTabVisible = false;
          this.recordCurrentViewTime();
          this.flush();
        } else if (document.visibilityState === 'visible') {
          // Retour sur l'onglet : reprise du chronomètre
          this.isTabVisible = true;
          this.lastTickTime = Date.now();
          this.handleUserActivity();
        }
      });

      // Flush propre lors de la fermeture
      window.addEventListener('beforeunload', () => {
        this.recordCurrentViewTime();
        this.flush();
      });

      // Écoute de l'orientation pour mettre à jour les métadonnées
      window.addEventListener('orientationchange', () => {
        this.logEvent('PAGE_VIEW', this.currentView, `Bascule d'orientation : ${this.getDeviceType()}`);
      });
    }
  }

  /**
   * Horloge interne d'accumulation du temps actif réel sur la page.
   */
  private tick() {
    const now = Date.now();
    const deltaSeconds = Math.max(0, Math.round((now - this.lastTickTime) / 1000));
    this.lastTickTime = now;

    // Coupure immédiate : si l'onglet n'est pas au premier plan, pas de temps comptabilisé
    if (!this.isTabVisible) {
      return;
    }

    // Si aucune action depuis plus de 5 minutes :
    if (now - this.lastActivityTime >= this.IDLE_TIMEOUT_MS) {
      if (!this.isIdle) {
        this.isIdle = true;
      }
      // Compteur gelé : on n'ajoute pas les secondes d'inactivité
      return;
    }

    // Joueur actif et onglet visible : incrémenter le temps
    this.activeSecondsOnCurrentView += deltaSeconds;
  }

  /**
   * Prise en compte d'une preuve d'activité de l'utilisateur.
   */
  public handleUserActivity() {
    const now = Date.now();
    const idleDuration = now - this.lastActivityTime;

    // Si le joueur revient après plus de 15 minutes d'absence continue :
    // Clôture de l'ancienne session expirée et création d'une nouvelle session propre.
    if (idleDuration >= this.SESSION_BREAK_TIMEOUT_MS && this.sessionId) {
      this.renewSessionAfterLongIdle();
    }

    this.lastActivityTime = now;
    this.lastTickTime = now;

    // Si le joueur était gelé en inactivité (> 5 min), reprise immédiate
    if (this.isIdle) {
      this.isIdle = false;
    }
  }

  private handleThrottledActivity = () => {
    const now = Date.now();
    if (now - this.lastThrottledActivityTime > 2500) {
      this.lastThrottledActivityTime = now;
      this.handleUserActivity();
    }
  };

  private handleDirectActivity = () => {
    this.handleUserActivity();
  };

  private attachActivityListeners() {
    if (typeof window === 'undefined') return;
    // Mouvements et défilements (throttled pour préserver les performances)
    window.addEventListener('mousemove', this.handleThrottledActivity, { passive: true });
    window.addEventListener('touchmove', this.handleThrottledActivity, { passive: true });
    window.addEventListener('wheel', this.handleThrottledActivity, { passive: true });
    window.addEventListener('scroll', this.handleThrottledActivity, { passive: true });

    // Clics, touches et frappes clavier (immédiats)
    window.addEventListener('mousedown', this.handleDirectActivity, { passive: true });
    window.addEventListener('click', this.handleDirectActivity, { passive: true });
    window.addEventListener('keydown', this.handleDirectActivity, { passive: true });
    window.addEventListener('touchstart', this.handleDirectActivity, { passive: true });
    window.addEventListener('pointerdown', this.handleDirectActivity, { passive: true });
  }

  private removeActivityListeners() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('mousemove', this.handleThrottledActivity);
    window.removeEventListener('touchmove', this.handleThrottledActivity);
    window.removeEventListener('wheel', this.handleThrottledActivity);
    window.removeEventListener('scroll', this.handleThrottledActivity);

    window.removeEventListener('mousedown', this.handleDirectActivity);
    window.removeEventListener('click', this.handleDirectActivity);
    window.removeEventListener('keydown', this.handleDirectActivity);
    window.removeEventListener('touchstart', this.handleDirectActivity);
    window.removeEventListener('pointerdown', this.handleDirectActivity);
  }

  /**
   * En cas de longue absence (> 15 minutes), clôture la session expirée
   * et relance une nouvelle session fraîche.
   */
  private async renewSessionAfterLongIdle() {
    const oldSid = this.sessionId;
    this.sessionId = null;
    sessionStorage.removeItem('evoe_session_id');

    if (oldSid) {
      try {
        await axios.post(`${BASE_API_URL}/tracking/telemetry/close`, { sessionId: oldSid });
      } catch (e) {
        // Ignorer si déjà expirée
      }
    }

    if (this.childId && this.childPseudo && this.instanceId && this.schoolYear) {
      await this.initSession({
        childId: this.childId,
        childPseudo: this.childPseudo,
        instanceId: this.instanceId,
        schoolYear: this.schoolYear,
        instanceYearId: this.instanceYearId,
      });
    }
  }

  public getDeviceType(): string {
    if (typeof window === 'undefined') return 'DESKTOP';
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
    this.instanceYearId = params.instanceYearId;

    const savedChildId = sessionStorage.getItem('evoe_session_child_id');
    sessionStorage.setItem('evoe_session_child_id', params.childId.toString());
    sessionStorage.setItem('evoe_session_child_pseudo', params.childPseudo);

    // Si on a déjà une session active pour le même enfant, on continue
    if (this.sessionId && savedChildId === params.childId.toString()) {
      return this.sessionId;
    }

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
   * Enregistre le temps actif réel passé sur la vue courante avant transition.
   */
  private recordCurrentViewTime() {
    this.tick();
    const elapsedSeconds = Math.max(0, this.activeSecondsOnCurrentView);
    if (elapsedSeconds > 0) {
      this.queue.push({
        eventType: 'PAGE_VIEW',
        target: this.currentView,
        label: this.getViewLabel(this.currentView),
        timeSpentSeconds: elapsedSeconds,
        timestamp: new Date().toISOString(),
      });
    }
    this.activeSecondsOnCurrentView = 0;
    this.lastTickTime = Date.now();
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
    this.handleUserActivity();
    if (newView === this.currentView) return;
    this.recordCurrentViewTime();
    this.currentView = newView;
    this.activeSecondsOnCurrentView = 0;
    this.lastTickTime = Date.now();

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
    this.handleUserActivity();
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

    if (this.queue.length > 0) {
      await this.flush();
    }

    try {
      await axios.post(`${BASE_API_URL}/tracking/telemetry/close`, { sessionId: sid });
    } catch (e) {
      console.warn('[Telemetry] Échec de fermeture de session:', e);
    }
  }
}

export const telemetry = new TelemetryService();
