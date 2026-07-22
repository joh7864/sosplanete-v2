'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, AlertCircle, Users, ChevronRight } from 'lucide-react';
import { getAssetUrl } from '@/utils/assets';

export interface PlayerSearchItem {
  player: any;
  teamName: string;
  groupName: string;
  teamColor?: string;
}

interface PlayerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: PlayerSearchItem[];
  onSelectPlayer: (player: any, teamName: string, groupName: string) => void;
}

export const PlayerSearchModal: React.FC<PlayerSearchModalProps> = ({
  isOpen,
  onClose,
  allPlayers,
  onSelectPlayer,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlayerSearchItem[]>([]);
  const [showUnknownPopup, setShowUnknownPopup] = useState(false);
  const [unknownPseudo, setUnknownPseudo] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSuggestions([]);
      setShowUnknownPopup(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }
    const matches = allPlayers.filter(item =>
      (item.player?.pseudo || '').toLowerCase().includes(trimmed)
    );
    setSuggestions(matches.slice(0, 8));
  }, [query, allPlayers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return;

    // Recherche d'une correspondance exacte d'abord, puis partielle
    const match = allPlayers.find(
      item => (item.player?.pseudo || '').toLowerCase() === trimmed
    ) || suggestions[0];

    if (match) {
      onSelectPlayer(match.player, match.teamName, match.groupName);
      onClose();
    } else {
      setUnknownPseudo(query.trim());
      setShowUnknownPopup(true);
    }
  };

  const handleSelectSuggestion = (item: PlayerSearchItem) => {
    onSelectPlayer(item.player, item.teamName, item.groupName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <Search size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Rechercher un joueur</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recherche par pseudo uniquement</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white text-slate-400 hover:text-slate-600 border border-slate-100 shadow-sm transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Saisissez le pseudo d'un joueur..."
                  className="w-full pl-11 pr-24 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="absolute right-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all shadow-md"
                >
                  Chercher
                </button>
              </div>
            </form>

            {/* Suggestions d'autocomplétion */}
            {suggestions.length > 0 && (
              <div className="mt-2 space-y-1 max-h-[260px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl p-1 bg-slate-50/50">
                <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Suggestions ({suggestions.length})
                </div>
                {suggestions.map((item, idx) => {
                  const avatarUrl = item.player.avatar
                    ? (item.player.avatar.startsWith('http')
                        ? item.player.avatar
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/legacy', '')}/static/${item.player.avatar}`)
                    : null;

                  return (
                    <button
                      key={item.player.id || idx}
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white hover:shadow-md transition-all group text-left border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-black text-slate-600">
                              {(item.player.pseudo || '?')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
                            {item.player.pseudo}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold truncate mt-0.5">
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.teamColor || '#10b981' }}
                              />
                              <strong className="text-slate-600">{item.teamName}</strong>
                            </span>
                            <span>•</span>
                            <span>Groupe : <strong className="text-emerald-700">{item.groupName}</strong></span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {query.trim() !== '' && suggestions.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs font-bold font-italic">
                Aucune suggestion correspondant à "{query}"... Appuyez sur Entrée pour rechercher.
              </div>
            )}
          </div>
        </motion.div>

        {/* Modal Popup d'avertissement : Joueur Inconnu */}
        <AnimatePresence>
          {showUnknownPopup && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 tracking-tight">Joueur inconnu</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Aucun joueur avec le pseudo <strong className="text-slate-800">"{unknownPseudo}"</strong> n'a été trouvé dans cet établissement.
                  </p>
                </div>
                <button
                  onClick={() => setShowUnknownPopup(false)}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md"
                >
                  Fermer
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
