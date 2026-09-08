import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Droplets, Trees, Trash2, Bike, ArrowLeftRight, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export type EcoThemeId = 'ENERGY' | 'WATER' | 'BIODIVERSITY' | 'WASTE' | 'MOBILITY';

export interface ThemeScenario {
  id: EcoThemeId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  before: {
    title: string;
    subtitle: string;
    tag: string;
    description: string;
    bgGradient: string;
    visualElements: React.ReactNode;
  };
  after: {
    title: string;
    subtitle: string;
    tag: string;
    description: string;
    bgGradient: string;
    visualElements: React.ReactNode;
  };
  keyImpact: string;
  metricLabel: string;
  metricValue: string;
}

export const THEME_SCENARIOS: Record<EcoThemeId, ThemeScenario> = {
  ENERGY: {
    id: 'ENERGY',
    label: 'Énergie & Climat',
    icon: Zap,
    accentColor: '#f59e0b',
    before: {
      title: 'Mégapole Sous Dépendance Fossile',
      subtitle: 'Atmosphère suffocante sous dôme de chaleur et particules fines',
      tag: 'Projection 2050 Inaction',
      description:
        'Centrale thermique à flamme en surrégime, cheminées industrielles rejetant un panache noir, façades noircies par la suie, smog stagnant masquant le soleil et climatiseurs vétustes surchauffant la rue.',
      bgGradient: 'from-[#1c1917] via-[#292524] to-[#0c0a09]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="smogSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#44403c" />
              <stop offset="50%" stopColor="#78716c" />
              <stop offset="100%" stopColor="#a8a29e" />
            </linearGradient>
            <radialGradient id="smogSun" cx="70%" cy="30%" r="20%">
              <stop offset="0%" stopColor="#fdba74" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#44403c" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="450" fill="url(#smogSky)" />
          <circle cx="560" cy="135" r="90" fill="url(#smogSun)" />
          {/* Usines & Cheminées */}
          <rect x="60" y="240" width="140" height="180" fill="#1c1917" />
          <rect x="230" y="200" width="90" height="220" fill="#292524" />
          <rect x="250" y="110" width="30" height="90" fill="#1c1917" />
          <rect x="420" y="220" width="130" height="200" fill="#1f1d1b" />
          <rect x="450" y="90" width="25" height="130" fill="#141210" />
          {/* Panaches de fumée lourde */}
          <ellipse cx="265" cy="70" rx="60" ry="35" fill="#57534e" opacity="0.8" />
          <ellipse cx="320" cy="45" rx="90" ry="40" fill="#78716c" opacity="0.6" />
          <ellipse cx="462" cy="55" rx="70" ry="35" fill="#44403c" opacity="0.85" />
          <ellipse cx="530" cy="30" rx="100" ry="45" fill="#57534e" opacity="0.6" />
          {/* Ligne d'horizon urbaine industrielle */}
          <path d="M0 380 L180 370 L340 390 L520 375 L800 395 L800 450 L0 450 Z" fill="#0c0a09" />
          {/* Voyant de pollution toxique */}
          <circle cx="100" cy="270" r="4" fill="#ef4444" opacity="0.9" />
          <circle cx="120" cy="270" r="4" fill="#ef4444" opacity="0.9" />
          <circle cx="480" cy="250" r="4" fill="#f97316" opacity="0.9" />
        </svg>
      ),
    },
    after: {
      title: 'Cité Solaire Végétalisée & Zéro Émission',
      subtitle: 'Ciel d’azur limpide, toitures photovoltaïques et îlots de fraîcheur',
      tag: '2050 Restauré (Objectif Atteint)',
      description:
        'Toitures et façades biosourcées équipées de tuiles solaires intégrées, micro-éoliennes urbaines silencieuses, canopée arborée rafraîchissant les rues et production 100% locale d’énergie propre.',
      bgGradient: 'from-[#0284c7] via-[#0369a1] to-[#082f49]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="cleanSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
            <radialGradient id="brightSun" cx="75%" cy="25%" r="25%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#fef08a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="450" fill="url(#cleanSky)" />
          <circle cx="600" cy="110" r="70" fill="url(#brightSun)" />
          {/* Bâtiments écologiques avec toitures solaires */}
          <rect x="70" y="210" width="130" height="210" fill="#f1f5f9" />
          <polygon points="70,210 200,210 180,185 90,185" fill="#0284c7" opacity="0.8" />
          <rect x="230" y="170" width="100" height="250" fill="#e2e8f0" />
          <polygon points="230,170 330,170 310,140 250,140" fill="#0369a1" opacity="0.85" />
          <rect x="360" y="230" width="140" height="190" fill="#ffffff" />
          <rect x="540" y="200" width="110" height="220" fill="#f8fafc" />
          {/* Toitures végétalisées et parcs urbains */}
          <ellipse cx="430" cy="225" rx="65" ry="12" fill="#10b981" />
          <ellipse cx="135" cy="205" rx="60" ry="10" fill="#059669" />
          <path d="M0 380 Q200 360 400 375 T800 365 L800 450 L0 450 Z" fill="#047857" />
          {/* Canopée d'arbres matures */}
          <circle cx="160" cy="370" r="35" fill="#10b981" />
          <circle cx="340" cy="365" r="42" fill="#059669" />
          <circle cx="500" cy="370" r="38" fill="#10b981" />
          <circle cx="680" cy="360" r="45" fill="#047857" />
        </svg>
      ),
    },
    keyImpact: 'Neutralité carbone atteinte et température urbaine abaissée de -3,8°C en été.',
    metricLabel: 'Émissions CO2',
    metricValue: '-68%',
  },

  WATER: {
    id: 'WATER',
    label: 'Eau & Ressources',
    icon: Droplets,
    accentColor: '#06b6d4',
    before: {
      title: 'Assèchement & Terres Stériles',
      subtitle: 'Lit de rivière évaporé, terres craquelées et pénurie généralisée',
      tag: 'Projection 2050 Inaction',
      description:
        'Sols arides fissurés par la sécheresse répétée, lit de fleuve réduit à un mince filet boueux contaminé, végétation roussie et réservoirs municipaux sous seuil critique d’alerte.',
      bgGradient: 'from-[#451a03] via-[#78350f] to-[#1c1917]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="drySky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9a3412" />
              <stop offset="50%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#fed7aa" />
            </linearGradient>
          </defs>
          <rect width="800" height="450" fill="url(#drySky)" />
          {/* Collines pelées */}
          <path d="M0 240 Q250 180 500 230 T800 210 L800 450 L0 450 Z" fill="#78350f" />
          <path d="M0 290 Q200 270 450 310 T800 280 L800 450 L0 450 Z" fill="#92400e" />
          {/* Sol craquelé désertique */}
          <path d="M0 350 L800 350 L800 450 L0 450 Z" fill="#451a03" />
          <path d="M120 360 L140 400 L110 440 M280 370 L300 420 L330 450 M480 360 L500 410 L470 450 M660 370 L680 430" stroke="#292524" strokeWidth="2.5" />
          {/* Filet d'eau croupie */}
          <path d="M350 350 Q390 390 380 450" stroke="#713f12" strokeWidth="12" fill="none" opacity="0.6" />
        </svg>
      ),
    },
    after: {
      title: 'Bassin Fluvial Vivant & Restauré',
      subtitle: 'Zones humides filtrantes, nappes rechargées et eau limpide',
      tag: '2050 Restauré (Objectif Atteint)',
      description:
        'Fleuve revitalisé aux méandres naturels, berges végétalisées dépolluantes, biodiversité aquatique prolifique, nappes phréatiques sécurisées et réutilisation intégrale des eaux pluviales.',
      bgGradient: 'from-[#0891b2] via-[#0e7490] to-[#155e75]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="wetSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="60%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#cffafe" />
            </linearGradient>
          </defs>
          <rect width="800" height="450" fill="url(#wetSky)" />
          {/* Collines verdoyantes */}
          <path d="M0 220 Q240 160 520 210 T800 190 L800 450 L0 450 Z" fill="#047857" />
          <path d="M0 270 Q200 240 440 280 T800 250 L800 450 L0 450 Z" fill="#059669" />
          {/* Fleuve étincelant aux reflets bleus purs */}
          <path d="M220 280 Q380 340 320 450 L480 450 Q490 340 380 280 Z" fill="#06b6d4" />
          <path d="M260 290 Q390 350 350 450" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.6" />
          {/* Berges fleuries et roselières filtrantes */}
          <ellipse cx="200" cy="380" rx="80" ry="30" fill="#10b981" />
          <ellipse cx="500" cy="390" rx="90" ry="35" fill="#10b981" />
          <circle cx="210" cy="360" r="22" fill="#047857" />
          <circle cx="490" cy="370" r="25" fill="#047857" />
        </svg>
      ),
    },
    keyImpact: 'Sécurité hydrique garantie pour 100% de la population et débit écologique doublé.',
    metricLabel: 'Eau Économisée',
    metricValue: '+85%',
  },

  BIODIVERSITY: {
    id: 'BIODIVERSITY',
    label: 'Biodiversité & Forêts',
    icon: Trees,
    accentColor: '#10b981',
    before: {
      title: 'Forêt Ravagée & Sol Dégradé',
      subtitle: 'Coupe rase dévastatrice, terre à nu et silence absolu des espèces',
      tag: 'Projection 2050 Inaction',
      description:
        'Paysage de souches calcinées et de terre décapée par l’érosion, perte irrémédiable des habitats fauniques, effondrement des populations d’oiseaux et prolifération d’espèces invasives mortifères.',
      bgGradient: 'from-[#1c1917] via-[#292524] to-[#451a03]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <rect width="800" height="450" fill="#292524" />
          {/* Collines pelées grises */}
          <path d="M0 240 Q300 190 600 230 T800 220 L800 450 L0 450 Z" fill="#1c1917" />
          <path d="M0 320 L800 320 L800 450 L0 450 Z" fill="#0c0a09" />
          {/* Souches d'arbres abattus */}
          <rect x="140" y="330" width="30" height="25" fill="#44403c" />
          <rect x="320" y="340" width="25" height="20" fill="#57534e" />
          <rect x="520" y="325" width="35" height="30" fill="#44403c" />
          <rect x="680" y="345" width="28" height="22" fill="#57534e" />
          {/* Troncs brisés */}
          <line x1="155" y1="330" x2="190" y2="355" stroke="#78716c" strokeWidth="6" />
          <line x1="535" y1="325" x2="570" y2="350" stroke="#78716c" strokeWidth="8" />
        </svg>
      ),
    },
    after: {
      title: 'Canopée Primaire Résiliente & Vivante',
      subtitle: 'Forêt dense multi-étagée, corridor biologique et retour de la faune',
      tag: '2050 Restauré (Objectif Atteint)',
      description:
        'Forêt régénérée d’essences indigènes diversifiées, sous-bois regorgeant de pollinisateurs et de champignons mycorhiziens, sanctuaire rétabli pour les espèces protégées et puits de carbone optimal.',
      bgGradient: 'from-[#064e3b] via-[#047857] to-[#022c22]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <rect width="800" height="450" fill="#0284c7" />
          {/* Forêt dense multi-strates */}
          <path d="M0 200 Q200 160 400 190 T800 170 L800 450 L0 450 Z" fill="#047857" />
          {/* Arbres matures géants */}
          <circle cx="120" cy="270" r="90" fill="#065f46" />
          <circle cx="280" cy="250" r="110" fill="#047857" />
          <circle cx="450" cy="260" r="100" fill="#059669" />
          <circle cx="620" cy="240" r="115" fill="#065f46" />
          <circle cx="750" cy="280" r="95" fill="#047857" />
          {/* Deuxième rangée plus dense */}
          <circle cx="200" cy="340" r="85" fill="#10b981" />
          <circle cx="370" cy="330" r="95" fill="#059669" />
          <circle cx="540" cy="350" r="90" fill="#10b981" />
          {/* Rayons de soleil traversant la canopée */}
          <polygon points="300,0 350,0 450,450 380,450" fill="#fef08a" opacity="0.15" />
          <polygon points="500,0 540,0 620,450 560,450" fill="#fef08a" opacity="0.12" />
        </svg>
      ),
    },
    keyImpact: '3 500 hectares sanctuarisés et recolonisation par 42 espèces d’oiseaux menacées.',
    metricLabel: 'Faune & Flore',
    metricValue: '+140%',
  },

  WASTE: {
    id: 'WASTE',
    label: 'Ressources & Matières',
    icon: Trash2,
    accentColor: '#8b5cf6',
    before: {
      title: 'Littoral Submergé par les Macroplastiques',
      subtitle: 'Estuaire saturé de déchets, sols contaminés et dépotoir marin',
      tag: 'Projection 2050 Inaction',
      description:
        'Plages défigurées sous des couches de plastique compacté et de fragments toxiques, oiseaux marins emmêlés, microplastiques polluant la chaîne alimentaire et absence totale de valorisation.',
      bgGradient: 'from-[#1e1b4b] via-[#312e81] to-[#0f172a]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <rect width="800" height="450" fill="#475569" />
          {/* Mer grise et polluée */}
          <path d="M0 220 Q400 240 800 210 L800 450 L0 450 Z" fill="#334155" />
          {/* Plage jonchée d'amoncellements de déchets */}
          <path d="M0 310 Q350 280 800 330 L800 450 L0 450 Z" fill="#64748b" />
          {/* Détritus épars aux couleurs artificielles toxiques */}
          <rect x="120" y="340" width="18" height="12" fill="#ef4444" transform="rotate(15 120 340)" />
          <rect x="160" y="360" width="22" height="10" fill="#3b82f6" transform="rotate(-20 160 360)" />
          <rect x="250" y="345" width="20" height="14" fill="#eab308" transform="rotate(35 250 345)" />
          <rect x="390" y="355" width="25" height="12" fill="#ec4899" transform="rotate(-10 390 355)" />
          <rect x="520" y="365" width="18" height="15" fill="#06b6d4" transform="rotate(25 520 365)" />
          <rect x="650" y="350" width="30" height="14" fill="#a855f7" transform="rotate(-15 650 350)" />
        </svg>
      ),
    },
    after: {
      title: 'Littoral Préservé & Économie Circulaire',
      subtitle: 'Plage immaculée, mer turquoise et valorisation 100% biosourcée',
      tag: '2050 Restauré (Objectif Atteint)',
      description:
        'Bande côtière entièrement restaurée, disparition totale des plastiques à usage unique, éco-conception circulaire et valorisation biologique des matières à l’échelle régionale.',
      bgGradient: 'from-[#0284c7] via-[#0d9488] to-[#115e59]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <rect width="800" height="450" fill="#38bdf8" />
          {/* Mer turquoise pure */}
          <path d="M0 200 Q400 210 800 195 L800 450 L0 450 Z" fill="#06b6d4" />
          <path d="M0 240 Q400 250 800 235 L800 450 L0 450 Z" fill="#0891b2" />
          {/* Écume blanche sur l'eau */}
          <path d="M0 295 Q200 310 400 295 T800 305" stroke="#ffffff" strokeWidth="6" fill="none" opacity="0.8" />
          {/* Plage de sable doré pur */}
          <path d="M0 310 Q400 300 800 320 L800 450 L0 450 Z" fill="#fde047" opacity="0.9" />
          {/* Végétation dunaire fixatrice */}
          <ellipse cx="140" cy="410" rx="60" ry="25" fill="#10b981" />
          <ellipse cx="680" cy="405" rx="70" ry="28" fill="#10b981" />
        </svg>
      ),
    },
    keyImpact: '94% des matières recyclées ou régénérées en boucle fermée.',
    metricLabel: 'Déchets Éliminés',
    metricValue: '-92%',
  },

  MOBILITY: {
    id: 'MOBILITY',
    label: 'Mobilité & Cadre de Vie',
    icon: Bike,
    accentColor: '#3b82f6',
    before: {
      title: 'Boulevard Saturé & Air Toxique',
      subtitle: 'Embouteillage monstre de véhicules thermiques et façades étouffées',
      tag: 'Projection 2050 Inaction',
      description:
        'Paralysie du trafic urbain, bruit assourdissant des moteurs à explosion, concert de klaxons, trottoirs étroits colonisés par le stationnement et seuils d’ozone quotidiennement dépassés.',
      bgGradient: 'from-[#18181b] via-[#27272a] to-[#09090b]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <rect width="800" height="450" fill="#52525b" />
          {/* Immeubles austères */}
          <rect x="50" y="80" width="180" height="370" fill="#27272a" />
          <rect x="570" y="60" width="180" height="390" fill="#18181b" />
          {/* Chaussée goudronnée saturée */}
          <polygon points="250,450 340,240 460,240 550,450" fill="#09090b" />
          {/* Embouteillage dense (phares rouges et jaunes) */}
          <rect x="350" y="370" width="100" height="45" rx="8" fill="#dc2626" />
          <circle cx="365" cy="410" r="6" fill="#ef4444" />
          <circle cx="435" cy="410" r="6" fill="#ef4444" />
          <rect x="370" y="310" width="60" height="35" rx="6" fill="#475569" />
          <circle cx="380" cy="340" r="4" fill="#ef4444" />
          <circle cx="420" cy="340" r="4" fill="#ef4444" />
          {/* Brouillard de pots d'échappement */}
          <ellipse cx="400" cy="420" rx="90" ry="20" fill="#71717a" opacity="0.6" />
        </svg>
      ),
    },
    after: {
      title: 'Avenue Végétale & Mobilités Douces',
      subtitle: 'Voie verte partagée, silence apaisé, vélos et tramway silencieux',
      tag: '2050 Restauré (Objectif Atteint)',
      description:
        'Espace public restitué aux piétons et aux enfants, vaste piste cyclable sécurisée sous allée d’arbres d’ombrage, tramway alimenté à l’électricité verte et disparition totale du bruit moteur.',
      bgGradient: 'from-[#0284c7] via-[#059669] to-[#047857]',
      visualElements: (
        <svg viewBox="0 0 800 450" className="w-full h-full object-cover">
          <rect width="800" height="450" fill="#7dd3fc" />
          {/* Bâtiments écologiques avec terrasses bois */}
          <rect x="50" y="100" width="160" height="350" fill="#f8fafc" />
          <rect x="590" y="80" width="160" height="370" fill="#f1f5f9" />
          {/* Allée verte arborée */}
          <polygon points="210,450 350,220 450,220 590,450" fill="#dcfce7" />
          {/* Piste cyclable ocre rouge */}
          <polygon points="340,450 380,220 420,220 460,450" fill="#fed7aa" />
          {/* Alignement d'arbres majestueux */}
          <circle cx="270" cy="320" r="50" fill="#10b981" />
          <circle cx="530" cy="310" r="52" fill="#059669" />
          <circle cx="290" cy="240" r="35" fill="#059669" />
          <circle cx="510" cy="235" r="38" fill="#10b981" />
          {/* Tramway moderne discret */}
          <rect x="230" y="390" width="90" height="35" rx="8" fill="#0284c7" />
          <circle cx="250" cy="405" r="6" fill="#e0f2fe" />
          <circle cx="280" cy="405" r="6" fill="#e0f2fe" />
        </svg>
      ),
    },
    keyImpact: '82% des trajets quotidiens effectués en mobilités actives ou transports décarbonés.',
    metricLabel: 'Part Modale Douce',
    metricValue: '+310%',
  },
};

interface TemporalEchoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTheme?: EcoThemeId;
}

export const TemporalEchoModal: React.FC<TemporalEchoModalProps> = ({
  isOpen,
  onClose,
  initialTheme = 'ENERGY',
}) => {
  const [activeTheme, setActiveTheme] = useState<EcoThemeId>(initialTheme);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 à 100%
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // Synchroniser quand initialTheme change
  React.useEffect(() => {
    if (initialTheme) {
      setActiveTheme(initialTheme);
    }
  }, [initialTheme]);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const scenario = THEME_SCENARIOS[activeTheme] || THEME_SCENARIOS.ENERGY;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-5xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100"
          style={{
            boxShadow: '0 0 60px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Vision 2050 : L'Écho des Décisions
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    Photoréaliste
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Déplacez le curseur central pour mesurer l'impact concret de vos missions sur l'avenir
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sélecteur des 5 Thèmes */}
          <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(Object.keys(THEME_SCENARIOS) as EcoThemeId[]).map((themeKey) => {
              const th = THEME_SCENARIOS[themeKey];
              const Icon = th.icon;
              const isSelected = activeTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => setActiveTheme(themeKey)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-xs'
                      : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={14} />
                  <span>{th.label}</span>
                </button>
              );
            })}
          </div>

          {/* Zone du Slider Avant / Après Interactif */}
          <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onClick={(e) => handleMove(e.clientX)}
              className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden cursor-ew-resize select-none border border-slate-700/80 shadow-inner"
            >
              {/* Image / Scène "APRÈS" (en dessous, visible à droite du slider) */}
              <div className="absolute inset-0 w-full h-full">
                {scenario.after.visualElements}
                {/* Badge Côté Droit */}
                <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-1.5 backdrop-blur-sm shadow-md">
                  <CheckCircle2 size={14} />
                  <span>{scenario.after.tag}</span>
                </div>
              </div>

              {/* Image / Scène "AVANT" (au-dessus, découpée à la largeur du slider) */}
              <div
                className="absolute inset-0 h-full overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <div className="absolute inset-0 w-full h-full" style={{ width: containerRef.current?.offsetWidth || '100%' }}>
                  {scenario.before.visualElements}
                </div>
                {/* Badge Côté Gauche */}
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center gap-1.5 backdrop-blur-sm shadow-md">
                  <AlertTriangle size={14} />
                  <span>{scenario.before.tag}</span>
                </div>
              </div>

              {/* Ligne de séparation & Poignée du Slider */}
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                {/* Trait lumineux vertical */}
                <div className="w-0.5 h-full bg-white shadow-[0_0_10px_#ffffff]" />

                {/* Poignée centrale néon */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl border-2 border-slate-900 pointer-events-auto">
                  <ArrowLeftRight size={15} />
                </div>
              </div>
            </div>

            {/* Fiche Pédagogique Synthétique */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/40 space-y-1">
                <div className="text-[11px] font-black uppercase text-rose-400">
                  {scenario.before.title}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {scenario.before.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 space-y-1">
                <div className="text-[11px] font-black uppercase text-emerald-400">
                  {scenario.after.title}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {scenario.after.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Bilan Pédagogique 2050
                  </div>
                  <div className="text-xs font-bold text-slate-200 mt-1">
                    {scenario.keyImpact}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{scenario.metricLabel} :</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {scenario.metricValue}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              La réalisation de vos missions quotidiennes oriente directement l'aiguille du destin.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
            >
              Compris
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
