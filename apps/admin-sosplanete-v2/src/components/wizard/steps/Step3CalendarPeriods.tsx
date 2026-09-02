'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, RotateCcw, AlertCircle, Edit3, Check } from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { WizardDraftState, WizardPeriodItem } from '@/types/wizard';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

interface Step3CalendarPeriodsProps {
  state: WizardDraftState;
  onChange: (updater: (prev: WizardDraftState) => WizardDraftState) => void;
}

export const Step3CalendarPeriods: React.FC<Step3CalendarPeriodsProps> = ({ state, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Generate 7-day periods when dates change if no custom periods yet
  useEffect(() => {
    if (!state.calendar.customPeriods || state.calendar.customPeriods.length === 0) {
      recomputePeriods(
        state.calendar.gameStartDate,
        state.calendar.gameEndDate,
        state.calendar.periodStartDay ?? 3,
      );
    }
  }, []);

  const recomputePeriods = (startStr: string, endStr: string, startDayOfWeek: number = 3) => {
    if (!startStr || !endStr) return;
    const gameStart = new Date(startStr);
    const gameEnd = new Date(endStr);
    if (gameStart >= gameEnd) return;

    // Début de la période 1 calé sur startDayOfWeek
    const d = new Date(gameStart);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    let diff = (day - startDayOfWeek + 7) % 7;

    let pStart = new Date(d.getTime() - diff * 24 * 60 * 60 * 1000);
    pStart.setHours(0, 0, 0, 0);

    const generated: WizardPeriodItem[] = [];
    let periodNumber = 1;

    while (pStart <= gameEnd) {
      const pEnd = new Date(pStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      pEnd.setHours(23, 59, 59, 999);

      generated.push({
        number: periodNumber,
        startDate: pStart.toISOString().split('T')[0],
        endDate: pEnd.toISOString().split('T')[0],
      });

      pStart = new Date(pStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      pStart.setHours(0, 0, 0, 0);
      periodNumber++;
    }

    onChange((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        gameStartDate: startStr,
        gameEndDate: endStr,
        periodStartDay: startDayOfWeek,
        gamePeriodsCount: generated.length,
        customPeriods: generated,
      },
    }));
  };

  const handleGlobalDateChange = (type: 'gameStartDate' | 'gameEndDate', value: string) => {
    const newStart = type === 'gameStartDate' ? value : state.calendar.gameStartDate;
    const newEnd = type === 'gameEndDate' ? value : state.calendar.gameEndDate;

    onChange((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        [type]: value,
      },
    }));

    recomputePeriods(newStart, newEnd, state.calendar.periodStartDay ?? 3);
  };

  const handleStartDayChange = (newDay: number) => {
    onChange((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        periodStartDay: newDay,
      },
    }));

    recomputePeriods(state.calendar.gameStartDate, state.calendar.gameEndDate, newDay);
  };

  const handlePeriodDateChange = (idx: number, field: 'startDate' | 'endDate', val: string) => {
    onChange((prev) => {
      const updated = [...prev.calendar.customPeriods];
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          [field]: val,
        };
      }
      return {
        ...prev,
        calendar: {
          ...prev.calendar,
          customPeriods: updated,
        },
      };
    });
  };

  return (
    <div>
      <StepHeader
        stepNumber={3}
        title="Calendrier de Saison & Périodes de Jeu"
        subtitle="Définissez les dates de saison et générez automatiquement le calendrier des périodes de 7 jours."
        objective="Fixer la date de début, de fin et le jour de début de cycle (ex: Mercredi ou Dimanche)."
        impact="Toutes les périodes de 7 jours s'enchaînent automatiquement pour rythmer les défis et les missions."
        tip="Les périodes sont calculées par tranches de 7 jours consécutives selon le jour de début choisi."
      />

      {/* Global dates selector */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Date de Début de Saison *
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={state.calendar.gameStartDate}
              onChange={(e) => handleGlobalDateChange('gameStartDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Date de Fin de Saison *
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={state.calendar.gameEndDate}
              onChange={(e) => handleGlobalDateChange('gameEndDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Jour de Début de Période *
            </label>
            <select
              value={state.calendar.periodStartDay ?? 3}
              onChange={(e) => handleStartDayChange(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={() =>
                recomputePeriods(
                  state.calendar.gameStartDate,
                  state.calendar.gameEndDate,
                  state.calendar.periodStartDay ?? 3,
                )
              }
              className="w-full px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs uppercase tracking-wider border border-emerald-200 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Recalculer 7 jours
            </button>
          </div>
        </div>
      </div>

      {/* 24 Periods interactive table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-emerald-600" />
            Découpage des {state.calendar.customPeriods.length} Périodes de Jeu (Cycles de 7 jours)
          </h3>
          <span className="text-xs font-bold text-slate-500">
            Périodes consécutives de 7 jours alignées sur le {DAYS_OF_WEEK.find(d => d.value === (state.calendar.periodStartDay ?? 3))?.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
          {state.calendar.customPeriods.map((p, idx) => (
            <div
              key={p.number}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all text-xs"
            >
              <div className="flex items-center justify-between font-extrabold text-slate-800 mb-2">
                <span>Période #{p.number}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  Saison
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Du:</span>
                  <input
                    type="date"
                    value={p.startDate}
                    onChange={(e) => handlePeriodDateChange(idx, 'startDate', e.target.value)}
                    className="px-2 py-1 rounded bg-white border border-slate-200 font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Au:</span>
                  <input
                    type="date"
                    value={p.endDate}
                    onChange={(e) => handlePeriodDateChange(idx, 'endDate', e.target.value)}
                    className="px-2 py-1 rounded bg-white border border-slate-200 font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
