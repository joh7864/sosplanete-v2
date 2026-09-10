import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Layers,
  Globe,
  Radio,
  Zap,
  Compass,
  Trophy,
  MessageSquare,
  UserCheck,
  Search,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string;
  releaseDate?: string;
  periodsTimeout?: number;
  daysPerPeriod?: number;
}

interface EpicItem {
  id: string;
  code: string;
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string; style?: React.CSSProperties }>;
  color: string;
  summary: string;
  features: string[];
}

// Catalogue des EPICs opérationnels (EPIC-01 à EPIC-10)
const EPICS_DATA: EpicItem[] = [
  {
    id: 'epic-01',
    code: 'EPIC-01',
    title: 'Authentification Quantique & Sélection de Nexus',
    icon: UserCheck,
    color: '#00b3ff',
    summary: 'Gestion des sessions d’Agents Temporels et rattachement aux écoles/Nexus.',
    features: [
      'Connexion rapide et sécurisée par pseudo et mot de passe',
      'Sélection et routage multi-instances (écoles, collèges, classes)',
      'Mémorisation locale et persistance automatique de la session',
      'Protection d’accès et redirection automatique vers le sas de connexion'
    ]
  },
  {
    id: 'epic-02',
    code: 'EPIC-02',
    title: 'Immersion, Briefing & Onboarding Temporel',
    icon: Sparkles,
    color: '#a855f7',
    summary: 'Scénarisation d’accueil et guidage immersif pas à pas pour les nouveaux explorateurs.',
    features: [
      'Briefing vidéo FTUX avec transmission narrative des enjeux écologiques',
      'Guide interactif contextuel pour découvrir les commandes du QG',
      'Sauvegarde de l’état d’onboarding pour éviter les répétitions',
      'Adaptabilité complète de l’expérience sur ordinateur et mobile'
    ]
  },
  {
    id: 'epic-03',
    code: 'EPIC-03',
    title: 'Passerelle Temporelle & Scène 3D Principale (QG 2026)',
    icon: Globe,
    color: '#00ffcc',
    summary: 'Environnement spatial 3D temps réel centré sur la Terre et les secteurs thématiques.',
    features: [
      'Globe terrestre 3D haute fidélité avec shaders atmosphériques et rotation interactive',
      'Anneau orbital et secteurs éco-citoyens (Énergie, Eau, Biodiversité, Mobilité...)',
      'Positionnement spatial des bulles des Agents connectés en temps réel',
      'Caméra dynamique et commandes tactiles / souris avec recentrage orbital'
    ]
  },
  {
    id: 'epic-04',
    code: 'EPIC-04',
    title: 'Codex des Missions & Impulsion Écologique',
    icon: Compass,
    color: '#10b981',
    summary: 'Catalogue des actions éco-responsables à réaliser au quotidien et conversion en points IT.',
    features: [
      'Catalogue d’actions réparties par piliers écologiques avec fiches explicatives détaillées',
      'Système d’impulsion d’action avec gain de points d’Impact Temporel (IT)',
      'Suivi des missions de la semaine et historique des réalisations',
      'Possibilité d’annuler ou réimpulser les actions avec confirmation sécurisée'
    ]
  },
  {
    id: 'epic-05',
    code: 'EPIC-05',
    title: 'Arène des Défis PvP Inter-Équipes',
    icon: Zap,
    color: '#f59e0b',
    summary: 'Compétition collaborative et défis ludiques lancés entre équipages de vaisseaux.',
    features: [
      'Création et envoi de défis directs à d’autres équipes avec gages personnalisés',
      'Minuteur de validité et résolution sous contrainte de temps',
      'Pari et redistribution équitable des points d’impact en duel',
      'Historique des défis reçus, envoyés et relevés avec statut en direct'
    ]
  },
  {
    id: 'epic-06',
    code: 'EPIC-06',
    title: 'Projection Temporelle 2070 & Extrapolation Mondiale',
    icon: Calendar,
    color: '#06b6d4',
    summary: 'Simulation prospective montrant la régénération de la Terre en 2070 selon les actions d’aujourd’hui.',
    features: [
      'Voyage vers l’ère 2070 d’un simple clic sur le commutateur temporel',
      'Oracle Terrestre interactif avec messages d’évolution selon l’état planétaire',
      'Calcul d’impact global : CO2 évité, eau préservée et déchets détournés',
      'Jauges holographiques de régénération planétaire synchronisées'
    ]
  },
  {
    id: 'epic-07',
    code: 'EPIC-07',
    title: 'Radar de Propulsion & Niveaux Technologiques',
    icon: Radio,
    color: '#3b82f6',
    summary: 'Vaisseaux spatiotemporels représentant les équipes et propulsion par niveaux (1 à 5).',
    features: [
      'Radar spatial cartographiant la position et vitesse de tous les vaisseaux d’équipe',
      'Évolution des moteurs de propulsion par paliers selon l’intensité écologique collective',
      'Effets visuels de traînées laser et boosters énergétiques',
      'Mode discrétion (Stealth Mode) activable pour optimiser la concentration'
    ]
  },
  {
    id: 'epic-08',
    code: 'EPIC-08',
    title: 'Classement Spatial & Leaderboard 3D',
    icon: Trophy,
    color: '#ffd700',
    summary: 'Palmarès holographique en 3D célébrant les équipages les plus investis.',
    features: [
      'Podium 3D avec élévation dynamique des piédestaux pour les équipes de tête',
      'Classement par score d’impact, médailles d’or, d’argent et de bronze',
      'Statistiques comparatives d’équipage et répartition par classe',
      'Filtre dynamique par équipe et consultation rapide des fiches membres'
    ]
  },
  {
    id: 'epic-09',
    code: 'EPIC-09',
    title: 'Comm-Link / Messagerie Quantique (WebSockets)',
    icon: MessageSquare,
    color: '#8b5cf6',
    summary: 'Canal de communication sécurisé en direct pour coordonner les équipages.',
    features: [
      'Tchat en temps réel avec salons Équipe, Instance (école) et Général',
      'Messages privés directs entre explorateurs avec accusés de réception',
      'Badges d’alerte de messages non lus sur le HUD et dans la barre mobile',
      'Intégration facultative avec lien direct vers le groupe WhatsApp d’équipe'
    ]
  },
  {
    id: 'epic-10',
    code: 'EPIC-10',
    title: 'Profil de l’Agent Temporel & Personnalisation',
    icon: UserCheck,
    color: '#ec4899',
    summary: 'Identité d’Agent, statistiques personnelles et personnalisation de l’avatar.',
    features: [
      'Fiche d’identité complète de l’Agent avec avatar, biographie et couleur d’équipe',
      'Bilan chiffré des points IT accumulés et répartition des actions par pilier',
      'Galerie d’avatars spatiaux personnalisables',
      'Consultation des profils d’autres Agents depuis le globe 3D ou le HUD'
    ]
  }
];

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  version = '1.6.0',
  releaseDate = '2026-09-10T10:00:00.000Z',
  periodsTimeout = 2, // 2 périodes avant retrait
  daysPerPeriod = 7,  // 7 jours par période (soit 14 jours de visibilité)
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>({
    'epic-01': false,
    'epic-03': false,
    'epic-04': false,
  });

  // Calcul du timeout des dernières évolutions (1 à 2 périodes de jeu)
  const isReleaseRecent = useMemo(() => {
    const relTime = new Date(releaseDate).getTime();
    const totalDays = Math.max(1, periodsTimeout * daysPerPeriod);
    const maxAgeMs = totalDays * 24 * 60 * 60 * 1000;
    return Date.now() - relTime < maxAgeMs;
  }, [releaseDate, periodsTimeout, daysPerPeriod]);

  // Fermeture par la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleEpic = (id: string) => {
    setExpandedEpics(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    EPICS_DATA.forEach(e => { allExpanded[e.id] = true; });
    setExpandedEpics(allExpanded);
  };

  const collapseAll = () => {
    setExpandedEpics({});
  };

  // Filtrage par texte de recherche
  const filteredEpics = EPICS_DATA.filter(epic => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      epic.code.toLowerCase().includes(q) ||
      epic.title.toLowerCase().includes(q) ||
      epic.summary.toLowerCase().includes(q) ||
      epic.features.some(f => f.toLowerCase().includes(q))
    );
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10020,
            padding: '16px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              width: '100%',
              maxWidth: '860px',
              maxHeight: '90vh',
              background: 'linear-gradient(145deg, rgba(8, 16, 36, 0.98), rgba(4, 8, 20, 0.99))',
              border: '1.5px solid rgba(0, 255, 204, 0.45)',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 255, 204, 0.22)',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du Journal */}
            <div
              style={{
                padding: '22px 28px 18px 28px',
                borderBottom: '1.5px solid rgba(0, 255, 204, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(90deg, rgba(0, 255, 204, 0.08) 0%, transparent 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(0, 255, 204, 0.15)',
                    border: '1.5px solid #00ffcc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00ffcc',
                    boxShadow: '0 0 14px rgba(0, 255, 204, 0.4)',
                  }}
                >
                  <Layers size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.35rem',
                        fontWeight: '800',
                        letterSpacing: '0.5px',
                        background: 'linear-gradient(90deg, #ffffff 0%, #00ffcc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      EVOE — Journal de Bord & Cartographie
                    </h2>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#050a16',
                        background: '#00ffcc',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        letterSpacing: '0.5px',
                        fontFamily: 'monospace',
                        boxShadow: '0 0 10px rgba(0, 255, 204, 0.5)',
                      }}
                    >
                      v{version}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '0.82rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                    }}
                  >
                    Spécifications fonctionnelles, modules du Nexus et historique des mises à jour.
                  </p>
                </div>
              </div>

              {/* Bouton Fermer */}
              <button
                type="button"
                onClick={onClose}
                title="Fermer le journal"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.75)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ff3b3b';
                  e.currentTarget.style.borderColor = '#ff3b3b';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenu Défilable */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '22px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {/* ======================================================== */}
              {/* SECTION 1 : DERNIÈRES MODIFICATIONS (AVEC TIMEOUT D'EXPIRATION) */}
              {/* ======================================================== */}
              {isReleaseRecent && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(0, 179, 255, 0.05) 100%)',
                    border: '1.5px solid rgba(0, 255, 204, 0.5)',
                    borderRadius: '16px',
                    padding: '18px 22px',
                    boxShadow: '0 4px 20px rgba(0, 255, 204, 0.12)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="#00ffcc" />
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.05rem',
                          fontWeight: '800',
                          color: '#00ffcc',
                          letterSpacing: '0.4px',
                        }}
                      >
                        Dernières Évolutions — Version {version}
                      </h3>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(5, 12, 28, 0.75)',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 255, 204, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Search size={15} color="#00ffcc" />
                        <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                          Recherche Rapide de Joueur (HUD)
                        </strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>
                        Nouveau bouton extensible à gauche du commutateur temporel. Autocomplétion dynamique en direct et ouverture instantanée de la fiche profil.
                      </p>
                    </div>

                    <div
                      style={{
                        background: 'rgba(5, 12, 28, 0.75)',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 255, 204, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Calendar size={15} color="#00b3ff" />
                        <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                          Année Temporelle Dynamique
                        </strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>
                        Calcul automatique de l’année courante dans le cockpit, adaptant les références historiques et les calculs d’âge des explorateurs.
                      </p>
                    </div>

                    <div
                      style={{
                        background: 'rgba(5, 12, 28, 0.75)',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 255, 204, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Globe size={15} color="#10b981" />
                        <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                          Immersion & Visibilité 3D Accrue
                        </strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>
                        Suppression des barres intermédiaires encombrantes pour offrir une vue panoramique dégagée sur la Terre spatiale et les anneaux de missions.
                      </p>
                    </div>

                    <div
                      style={{
                        background: 'rgba(5, 12, 28, 0.75)',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 255, 204, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <CheckCircle2 size={15} color="#ffd700" />
                        <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                          Optimisations & Ergonomie Multi-supports
                        </strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>
                        Fluidité renforcée des animations d’interface, navigation au clavier intuitive et synchronisation complète de la plateforme.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 2 : CARTOGRAPHIE DES FONCTIONNALITÉS PAR EPIC */}
              {/* ======================================================== */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} color="#00ffcc" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#ffffff' }}>
                      Fonctionnalités & Modules par EPIC ({EPICS_DATA.length} Piliers)
                    </h3>
                  </div>

                  {/* Barre de recherche d'EPIC & Boutons Tout Déplier / Replier */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '4px 10px',
                      }}
                    >
                      <Search size={13} color="rgba(255, 255, 255, 0.5)" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Filtrer un EPIC..."
                        style={{
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#fff',
                          fontSize: '0.76rem',
                          width: '130px',
                        }}
                      />
                      {searchFilter && (
                        <button
                          type="button"
                          onClick={() => setSearchFilter('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={expandAll}
                      style={{
                        background: 'rgba(0, 255, 204, 0.1)',
                        border: '1px solid rgba(0, 255, 204, 0.3)',
                        borderRadius: '6px',
                        color: '#00ffcc',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Tout déplier
                    </button>
                    <button
                      type="button"
                      onClick={collapseAll}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Tout replier
                    </button>
                  </div>
                </div>

                {/* Liste des Accordeons EPIC */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredEpics.length > 0 ? (
                    filteredEpics.map((epic) => {
                      const isExpanded = !!expandedEpics[epic.id];
                      const IconComponent = epic.icon;

                      return (
                        <div
                          key={epic.id}
                          style={{
                            background: 'rgba(10, 20, 42, 0.65)',
                            border: `1.2px solid ${isExpanded ? epic.color : 'rgba(255, 255, 255, 0.08)'}`,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                            boxShadow: isExpanded ? `0 0 15px ${epic.color}22` : 'none',
                          }}
                        >
                          {/* En-tête cliquable de l'accordéon */}
                          <div
                            onClick={() => toggleEpic(epic.id)}
                            style={{
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              background: isExpanded ? `${epic.color}0d` : 'transparent',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: `${epic.color}22`,
                                  border: `1px solid ${epic.color}55`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: epic.color,
                                }}
                              >
                                <IconComponent size={17} />
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: '800',
                                      color: epic.color,
                                      background: `${epic.color}1a`,
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {epic.code}
                                  </span>
                                  <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                                    {epic.title}
                                  </strong>
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
                                  {epic.summary}
                                </div>
                              </div>
                            </div>

                            <div style={{ color: epic.color, marginLeft: '12px' }}>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>

                          {/* Détails déroulants */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div
                                  style={{
                                    padding: '12px 18px 16px 58px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                  }}
                                >
                                  <ul
                                    style={{
                                      margin: 0,
                                      padding: 0,
                                      listStyleType: 'none',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '7px',
                                    }}
                                  >
                                    {epic.features.map((feature, fIdx) => (
                                      <li
                                        key={fIdx}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: '8px',
                                          fontSize: '0.78rem',
                                          color: 'rgba(255, 255, 255, 0.85)',
                                          lineHeight: '1.4',
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: epic.color,
                                            marginTop: '6px',
                                            flexShrink: 0,
                                            boxShadow: `0 0 6px ${epic.color}`,
                                          }}
                                        />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.45)',
                        fontSize: '0.85rem',
                        fontStyle: 'italic',
                      }}
                    >
                      Aucun EPIC ne correspond à « {searchFilter} »
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer du Journal */}
            <div
              style={{
                padding: '14px 28px',
                borderTop: '1.5px solid rgba(0, 255, 204, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(3, 7, 18, 0.95)',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                EVOE — Exploration Visuelle et Opérations Éco-citoyennes © {new Date().getFullYear()}
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.25) 0%, rgba(0, 179, 255, 0.25) 100%)',
                  border: '1.5px solid #00ffcc',
                  borderRadius: '10px',
                  padding: '8px 24px',
                  color: '#00ffcc',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  letterSpacing: '0.4px',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(0, 255, 204, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00ffcc';
                  e.currentTarget.style.color = '#050a16';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 204, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 204, 0.25) 0%, rgba(0, 179, 255, 0.25) 100%)';
                  e.currentTarget.style.color = '#00ffcc';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 204, 0.3)';
                }}
              >
                Fermer le Journal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
