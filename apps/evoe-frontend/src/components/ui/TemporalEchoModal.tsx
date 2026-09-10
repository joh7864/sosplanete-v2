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
        <img src="/images/echo/energy_before_1789060138008.jpg" alt="Avant 2050" className="w-full h-full object-cover" />
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
        <img src="/images/echo/energy_after_1789060147827.jpg" alt="Après 2050" className="w-full h-full object-cover" />
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
        <img src="/images/echo/water_before_1789060157940.jpg" alt="Avant eau" className="w-full h-full object-cover" />
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
        <img src="/images/echo/water_after_1789060168131.jpg" alt="Après eau" className="w-full h-full object-cover" />
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
        <img src="/images/echo/bio_before_1789060179894.jpg" alt="Avant bio" className="w-full h-full object-cover" />
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
        <img src="/images/echo/bio_after_1789060190762.jpg" alt="Après bio" className="w-full h-full object-cover" />
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
        <img src="/images/echo/waste_before_1789060201248.jpg" alt="Avant déchets" className="w-full h-full object-cover" />
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
        <img src="/images/echo/waste_after_1789060211755.jpg" alt="Après déchets" className="w-full h-full object-cover" />
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
        <img src="/images/echo/mobility_before_1789060222602.jpg" alt="Avant mobilité" className="w-full h-full object-cover" />
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
        <img src="/images/echo/mobility_after_1789060233508.jpg" alt="Après mobilité" className="w-full h-full object-cover" />
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
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(3, 7, 18, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 20000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1020px',
            maxHeight: '92vh',
            background: 'linear-gradient(175deg, rgba(15, 23, 42, 0.98) 0%, rgba(6, 12, 24, 0.99) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(16, 185, 129, 0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: '#f1f5f9',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(6, 78, 59, 0.25), rgba(15, 23, 42, 0.95))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6ee7b7',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.03em', margin: 0 }}>
                    Vision 2050 : L'Écho des Décisions
                  </h2>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#6ee7b7',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    Photoréaliste
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Déplacez le curseur central pour mesurer l'impact concret de vos missions sur l'avenir
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Sélecteur des 5 Thèmes */}
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: 'rgba(3, 7, 18, 0.6)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
            }}
          >
            {(Object.keys(THEME_SCENARIOS) as EcoThemeId[]).map((themeKey) => {
              const th = THEME_SCENARIOS[themeKey];
              const Icon = th.icon;
              const isSelected = activeTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => setActiveTheme(themeKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                    border: isSelected ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isSelected ? '#6ee7b7' : '#94a3b8',
                  }}
                >
                  <Icon size={14} />
                  <span>{th.label}</span>
                </button>
              );
            })}
          </div>

          {/* Zone du Slider Avant / Après Interactif */}
          <div
            style={{
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onClick={(e) => handleMove(e.clientX)}
              style={{
                position: 'relative',
                width: '100%',
                height: '340px',
                borderRadius: '18px',
                overflow: 'hidden',
                cursor: 'ew-resize',
                userSelect: 'none',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
              }}
            >
              {/* Image / Scène "APRÈS" (en dessous, visible à droite du slider) */}
              <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {scenario.after.visualElements}
                {/* Badge Côté Droit */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 10,
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(6, 78, 59, 0.85)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    color: '#6ee7b7',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>{scenario.after.tag}</span>
                </div>
              </div>

              {/* Image / Scène "AVANT" (au-dessus, découpée à la largeur du slider) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  height: '100%',
                  overflow: 'hidden',
                  width: `${sliderPosition}%`,
                }}
              >
                <div style={{ position: 'absolute', inset: 0, width: containerRef.current?.offsetWidth || '100%', height: '100%' }}>
                  {scenario.before.visualElements}
                </div>
                {/* Badge Côté Gauche */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    zIndex: 10,
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(136, 19, 55, 0.85)',
                    border: '1px solid rgba(244, 63, 94, 0.5)',
                    color: '#fda4af',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>{scenario.before.tag}</span>
                </div>
              </div>

              {/* Ligne de séparation & Poignée du Slider */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  zIndex: 20,
                  pointerEvents: 'none',
                  left: `${sliderPosition}%`,
                }}
              >
                {/* Trait lumineux vertical */}
                <div style={{ width: '2px', height: '100%', backgroundColor: '#ffffff', boxShadow: '0 0 10px #ffffff' }} />

                {/* Poignée centrale néon */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(0,0,0,0.7), 0 0 10px #ffffff',
                    border: '2px solid #0f172a',
                    pointerEvents: 'auto',
                  }}
                >
                  <ArrowLeftRight size={15} />
                </div>
              </div>
            </div>

            {/* Fiche Pédagogique Synthétique */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px',
                paddingTop: '6px',
              }}
            >
              <div
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(136, 19, 55, 0.25)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#fb7185' }}>
                  {scenario.before.title}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {scenario.before.description}
                </p>
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(6, 78, 59, 0.25)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#6ee7b7' }}>
                  {scenario.after.title}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {scenario.after.description}
                </p>
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                    Bilan Pédagogique 2050
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9', marginTop: '4px' }}>
                    {scenario.keyImpact}
                  </div>
                </div>
                <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{scenario.metricLabel} :</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6ee7b7', fontFamily: 'monospace' }}>
                    {scenario.metricValue}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(10, 15, 30, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#94a3b8',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <span>
              La réalisation de vos missions quotidiennes oriente directement l'aiguille du destin.
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 20px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Compris
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
