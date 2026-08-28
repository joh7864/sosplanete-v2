'use client';

import React, { useEffect, useState, useRef } from 'react';
import { School, Globe, Upload, User, Search, Check, AlertCircle, Camera } from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { WizardDraftState } from '@/types/wizard';
import { getAuthData } from '@/utils/storage';
import { useSession } from '@/hooks/useSession';

interface Step2IdentityProps {
  state: WizardDraftState;
  onChange: (updater: (prev: WizardDraftState) => WizardDraftState) => void;
}

export const Step2Identity: React.FC<Step2IdentityProps> = ({ state, onChange }) => {
  const { user, isManager } = useSession();
  const [amUsers, setAmUsers] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAMUsers();
    if (!state.identity.adminId && isManager && user) {
      onChange((prev) => ({
        ...prev,
        identity: { ...prev.identity, adminId: user.id },
      }));
    }
  }, [user, isManager]);

  const fetchAMUsers = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
      });
      if (resp.ok) {
        const all = await resp.json();
        setAmUsers(all.filter((u: any) => u.role === 'AM' || u.role === 'AS'));
      }
    } catch (e) {
      console.error('Fetch users error:', e);
    }
  };

  const handleNameChange = (val: string) => {
    // Generate auto slug if hostUrl wasn't manually customized
    const cleanSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    onChange((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        schoolName: val,
        selectedAnchorId: null,
        hostUrl: prev.identity.hostUrl ? prev.identity.hostUrl : cleanSlug,
      },
      meta: {
        ...prev.meta,
        instanceNamePreview: val || 'Nouvel Espace',
      },
    }));

    // Trigger autocompletion search
    if (val.trim().length > 1) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(async () => {
        try {
          const resp = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/instances/search?q=${encodeURIComponent(val)}`,
            { headers: { Authorization: `Bearer ${getAuthData('access_token')}` } },
          );
          if (resp.ok) {
            setSuggestions(await resp.json());
            setShowSuggestions(true);
          }
        } catch (e) {}
      }, 300);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestedAnchor = (anchor: any) => {
    onChange((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        selectedAnchorId: anchor.id,
        schoolName: anchor.schoolName,
        adminId: anchor.adminId || prev.identity.adminId,
      },
      meta: {
        ...prev.meta,
        instanceNamePreview: anchor.schoolName,
      },
    }));
    setShowSuggestions(false);
  };

  const PRESET_ICONS = ['🦊', '🐼', '🦉', '🐬', '🦁', '🌿', '🌍', '🚀', '⚡', '🌳'];

  return (
    <div>
      <StepHeader
        stepNumber={2}
        title="Identité & Ancrage de l'Établissement"
        subtitle="Définissez les informations administratives, le nom officiel, le logo et l'accès web de l'école."
        objective="Nommer l'établissement, configurer l'URL d'accès des élèves et assigner l'animateur référent."
        impact="Ces informations apparaîtront sur l'écran d'accueil des élèves et sur les rapports de suivi de l'école."
        tip="Si l'école a déjà participé par le passé, sélectionnez-la dans les suggestions pour la rattacher à son ancre existante."
      />

      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Nom de l'établissement avec autocomplétion */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Nom de l'établissement / École *
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="ex: École Élémentaire Victor Hugo"
                value={state.identity.schoolName}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              <School size={18} className="absolute left-3 top-3.5 text-slate-400" />
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
                <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Établissements existants détectés (cliquez pour rattacher)
                </div>
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    onClick={() => selectSuggestedAnchor(sug)}
                    className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none transition-colors"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-800">{sug.schoolName}</div>
                      <div className="text-xs text-slate-400">ID #{sug.id} • Déjà enregistré</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Rattacher
                    </span>
                  </div>
                ))}
              </div>
            )}

            {state.identity.selectedAnchorId && (
              <p className="mt-1 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <Check size={14} /> Rattaché à l'établissement existant #{state.identity.selectedAnchorId}
              </p>
            )}
          </div>

          {/* Année Scolaire */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Année Scolaire (Millésime) *
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="2025-2026"
              value={state.identity.schoolYear}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  identity: { ...prev.identity, schoolYear: e.target.value },
                }))
              }
            />
          </div>

          {/* Slug URL d'accès */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Identifiant / URL d'accès abrégé
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="victor-hugo-2025"
                value={state.identity.hostUrl}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, hostUrl: e.target.value },
                  }))
                }
              />
              <Globe size={18} className="absolute left-3 top-3.5 text-slate-400" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Permet un accès simplifié direct à l'espace via cette URL.
            </p>
          </div>

          {/* Animateur Référent */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Animateur Référent (AM)
            </label>
            <div className="relative">
              <select
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={state.identity.adminId || ''}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    identity: {
                      ...prev.identity,
                      adminId: e.target.value ? parseInt(e.target.value, 10) : null,
                    },
                  }))
                }
                disabled={getAuthData('user_role') === 'AM'}
              >
                <option value="">-- Assigner un animateur --</option>
                {amUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ? `${u.name} (${u.email})` : u.email} [{u.role}]
                  </option>
                ))}
              </select>
              <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Mascotte / Icône */}
        <div className="pt-6 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Mascotte / Icône de l'Établissement
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {PRESET_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, icon: emoji },
                  }))
                }
                className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                  state.identity.icon === emoji
                    ? 'bg-emerald-100 ring-4 ring-emerald-400 scale-110'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {emoji}
              </button>
            ))}

            <input
              type="text"
              placeholder="Ou saisissez un emoji / lien"
              className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold w-48 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={state.identity.icon}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  identity: { ...prev.identity, icon: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
