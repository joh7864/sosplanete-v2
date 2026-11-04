import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { parseBold } from '../../../utils/format';

export interface MissionHoloPopoverProps {
  isCodexCollapsed: boolean;
  expandedMission: any;
  popoverPos: number;
  evoeImgUrl: string;
  loadingMissionId: number | null;
  setCancelMissionConfirm: (confirm: any) => void;
  handleImpulseMissionWithBirthday: (id: number) => Promise<any> | void;
  isBirthdayActive: boolean;
  birthdayBoostsRemaining: number;
}

export const MissionHoloPopover: React.FC<MissionHoloPopoverProps> = ({
  isCodexCollapsed,
  expandedMission,
  popoverPos,
  evoeImgUrl,
  loadingMissionId,
  setCancelMissionConfirm,
  handleImpulseMissionWithBirthday,
  isBirthdayActive,
  birthdayBoostsRemaining,
}) => {
  return (
    <AnimatePresence>
      {isCodexCollapsed && expandedMission && (
        <motion.div
          className="mission-popover"
          initial={{ opacity: 0, x: -20, y: '-50%', scale: 0.95 }}
          animate={{ opacity: 1, x: 0, y: '-50%', scale: 1 }}
          exit={{ opacity: 0, x: -10, y: '-50%', scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ top: popoverPos }}
        >
          <div className="mission-header">
            {expandedMission.icon && (
              <img src={`${evoeImgUrl}${expandedMission.icon}`} alt="" className="mission-icon" />
            )}
            <h3>{expandedMission.evoeMission?.titreSF || expandedMission.label}</h3>
          </div>
          <p>
            {parseBold(
              expandedMission.evoeMission?.descriptionSF ||
                expandedMission.description ||
                'Mission secrète en attente de déchiffrage.'
            )}
          </p>
          <button
            className={`hack-btn ${expandedMission.evoeMission?.isImpulsed ? 'impulsed-btn' : ''}`}
            disabled={loadingMissionId === expandedMission.id}
            onClick={() => {
              if (expandedMission.evoeMission?.isImpulsed) {
                setCancelMissionConfirm({
                  actionDoneId: expandedMission.evoeMission.actionDoneId,
                  label: expandedMission.evoeMission?.titreSF || expandedMission.label,
                });
              } else {
                handleImpulseMissionWithBirthday(expandedMission.id);
              }
            }}
            style={
              expandedMission.evoeMission?.isImpulsed
                ? {
                    background: 'rgba(16, 185, 129, 0.15)',
                    borderColor: '#10b981',
                    color: '#10b981',
                  }
                : isBirthdayActive && birthdayBoostsRemaining > 0
                ? {
                    borderColor: '#ffd700',
                    color: '#ffd700',
                    boxShadow: '0 0 12px rgba(255, 215, 0, 0.35)',
                  }
                : {}
            }
          >
            {loadingMissionId === expandedMission.id ? (
              <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
            ) : expandedMission.evoeMission?.isImpulsed ? (
              'Déjà Impulsé'
            ) : isBirthdayActive && birthdayBoostsRemaining > 0 ? (
              `Impulser (+${(expandedMission.evoeMission?.amplitude || 10) * 2} IT 🎂 x2)`
            ) : (
              `Impulser (+${expandedMission.evoeMission?.amplitude || 10} IT)`
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
