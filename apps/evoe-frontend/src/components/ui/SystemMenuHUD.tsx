import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, HelpCircle, LogOut, ExternalLink, BookOpen, Cpu } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

interface SystemMenuHUDProps {
  whatsappInviteUrl?: string | null;
  onOpenHelp: () => void;
  onOpenAbout: () => void;
  onLogout: () => void;
  version?: string;
  isMobile?: boolean;
  isUnbridledDpr?: boolean;
  onToggleUnbridledDpr?: () => void;
}

export const SystemMenuHUD: React.FC<SystemMenuHUDProps> = ({
  whatsappInviteUrl,
  onOpenHelp,
  onOpenAbout,
  onLogout,
  version,
  isMobile = false,
  isUnbridledDpr = false,
  onToggleUnbridledDpr,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic en dehors et sur touche Échap
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const buttonSize = isMobile ? 36 : 40;

  return (
    <div
      ref={containerRef}
      id="hud-system-menu-container"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        zIndex: 90,
      }}
    >
      {/* Bouton déclencheur "..." */}
      <button
        id="hud-system-menu"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={isOpen ? "Fermer le menu" : "Options système & aides"}
        style={{
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          minWidth: `${buttonSize}px`,
          minHeight: `${buttonSize}px`,
          borderRadius: '50%',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen ? 'rgba(0, 255, 204, 0.22)' : 'rgba(5, 15, 30, 0.75)',
          border: isOpen ? '1.5px solid #00ffcc' : '1.5px solid rgba(0, 255, 204, 0.4)',
          color: '#00ffcc',
          boxShadow: isOpen
            ? '0 0 16px rgba(0, 255, 204, 0.6), 0 0 30px rgba(0, 255, 204, 0.25)'
            : '0 0 10px rgba(0, 255, 204, 0.25)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
      >
        <MoreHorizontal
          size={isMobile ? 18 : 20}
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.25s ease',
          }}
        />
      </button>

      {/* Bulle flottante (Popover contextuel en verre sombre holographique) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: `calc(${buttonSize}px + 10px)`,
              right: 0,
              width: isMobile ? '240px' : '260px',
              maxWidth: 'calc(100vw - 24px)',
              background: 'linear-gradient(145deg, rgba(8, 16, 32, 0.96) 0%, rgba(4, 9, 20, 0.98) 100%)',
              border: '1.5px solid rgba(0, 255, 204, 0.35)',
              borderRadius: '16px',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 255, 204, 0.2)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 10050,
              pointerEvents: 'auto',
            }}
          >
            {/* Petit en-tête cybernétique discret */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px 6px 8px',
                borderBottom: '1px solid rgba(0, 255, 204, 0.12)',
                marginBottom: '2px',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '1px',
                  fontWeight: 800,
                  color: 'rgba(0, 255, 204, 0.7)',
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                }}
              >
                Système EVOE
              </span>
              {version && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAbout();
                  }}
                  title="Ouvrir le Journal de bord & fonctionnalités"
                  style={{
                    background: 'rgba(0, 179, 255, 0.18)',
                    border: '1px solid rgba(0, 179, 255, 0.45)',
                    borderRadius: '6px',
                    padding: '2px 7px',
                    fontSize: '0.65rem',
                    color: '#00b3ff',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 0 8px rgba(0, 179, 255, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 179, 255, 0.35)';
                    e.currentTarget.style.borderColor = '#00b3ff';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 179, 255, 0.18)';
                    e.currentTarget.style.borderColor = 'rgba(0, 179, 255, 0.45)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  v{version}
                </button>
              )}
            </div>

            {/* Item 1 : WhatsApp Équipe (si URL disponible) */}
            {whatsappInviteUrl && (
              <a
                id="hud-menu-whatsapp"
                href={whatsappInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  background: 'rgba(37, 211, 102, 0.08)',
                  border: '1px solid rgba(37, 211, 102, 0.25)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(37, 211, 102, 0.18)';
                  e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(37, 211, 102, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.25)';
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'rgba(37, 211, 102, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#25D366',
                    flexShrink: 0,
                  }}
                >
                  <FaWhatsapp size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                    WhatsApp Équipe
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(37, 211, 102, 0.85)' }}>
                    Canal d'équipage direct
                  </span>
                </div>
                <ExternalLink size={12} color="rgba(255, 255, 255, 0.4)" style={{ flexShrink: 0 }} />
              </a>
            )}

            {/* Item 2 : Guide interactif (Onboarding) */}
            <button
              id="hud-menu-help"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenHelp();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid transparent',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(254, 243, 199, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(254, 243, 199, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(254, 243, 199, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fef3c7',
                  flexShrink: 0,
                }}
              >
                <HelpCircle size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Guide de navigation
                </span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(226, 232, 240, 0.6)' }}>
                  Visite interactive & astuces
                </span>
              </div>
            </button>

            {/* Item 3 : Journal de bord & Mises à jour */}
            <button
              id="hud-menu-about"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAbout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid transparent',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 179, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(0, 179, 255, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(0, 179, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00b3ff',
                  flexShrink: 0,
                }}
              >
                <BookOpen size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Journal de bord
                </span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(226, 232, 240, 0.6)' }}>
                  Fonctionnalités & versions
                </span>
              </div>
            </button>

            {/* Item DPR : Qualité Graphique 3D */}
            {onToggleUnbridledDpr && (
              <button
                id="hud-menu-graphic-mode"
                type="button"
                onClick={() => {
                  onToggleUnbridledDpr();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  background: isUnbridledDpr ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                  border: isUnbridledDpr ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                title={isUnbridledDpr ? "Cliquez pour repasser en mode Fluide (recommandé)" : "Cliquez pour activer le mode Haute Définition"}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: isUnbridledDpr ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isUnbridledDpr ? '#f59e0b' : '#10b981',
                    flexShrink: 0,
                  }}
                >
                  <Cpu size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                      Graphismes 3D
                    </span>
                    <span style={{ 
                      fontSize: '0.62rem', 
                      fontWeight: 700, 
                      padding: '1px 6px', 
                      borderRadius: '4px',
                      background: isUnbridledDpr ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isUnbridledDpr ? '#fbbf24' : '#34d399'
                    }}>
                      {isUnbridledDpr ? 'ULTRA' : 'FLUIDE'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(226, 232, 240, 0.6)' }}>
                    {isUnbridledDpr ? 'DPR débridé (retina)' : 'DPR bridé 1.25 (60 FPS)'}
                  </span>
                </div>
              </button>
            )}

            {/* Séparateur néon subtil */}
            <div
              style={{
                height: '1px',
                background: 'rgba(0, 255, 204, 0.15)',
                margin: '3px 4px',
              }}
            />

            {/* Item 4 : Quitter la simulation (Déconnexion) */}
            <button
              id="hud-menu-logout"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '10px',
                background: 'rgba(255, 59, 59, 0.08)',
                border: '1px solid rgba(255, 59, 59, 0.25)',
                color: '#ff5c5c',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 59, 59, 0.2)';
                e.currentTarget.style.borderColor = '#ff3b3b';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 59, 59, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 59, 59, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 59, 59, 0.25)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(255, 59, 59, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff3b3b',
                  flexShrink: 0,
                }}
              >
                <LogOut size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ff5c5c' }}>
                  Quitter la simulation
                </span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255, 92, 92, 0.75)' }}>
                  Déconnexion de session
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
