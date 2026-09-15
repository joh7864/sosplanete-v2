'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmDeleteLocalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionTitle?: string;
  actionsCount: number;
  actionsDoneCount: number;
  loading?: boolean;
}

export const ConfirmDeleteLocalActionModal: React.FC<ConfirmDeleteLocalActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionTitle,
  actionsCount,
  actionsDoneCount,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden z-10"
        >
          {/* Top Banner accent */}
          <div className="h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600" />

          <div className="p-6 sm:p-7 flex flex-col gap-5">
            {/* Header Icon & Close */}
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shadow-inner">
                <AlertTriangle size={24} className="animate-pulse" />
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title & Warning */}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {actionsCount > 1
                  ? 'Suppression de plusieurs actions'
                  : 'Supprimer de mon catalogue ?'}
              </h3>

              <div className="text-sm text-slate-600 leading-relaxed">
                {actionsCount === 1 ? (
                  <>
                    L&apos;action{' '}
                    <span className="font-black text-slate-900">
                      « {actionTitle || 'cette action'} »
                    </span>{' '}
                    a déjà été réalisée{' '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                      {actionsDoneCount} fois
                    </span>{' '}
                    par les élèves de cet établissement.
                  </>
                ) : (
                  <>
                    Les{' '}
                    <span className="font-black text-slate-900">
                      {actionsCount} actions
                    </span>{' '}
                    sélectionnées cumulent{' '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                      {actionsDoneCount} réalisations
                    </span>{' '}
                    par les élèves de cet établissement.
                  </>
                )}
              </div>
            </div>

            {/* Impact Box */}
            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex flex-col gap-1.5 text-xs text-rose-800">
              <p className="font-bold flex items-center gap-1.5 text-rose-900">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Conséquence irréversible :
              </p>
              <p className="leading-normal text-rose-700">
                Retirer ces actions supprimera définitivement les{' '}
                <span className="font-black">{actionsDoneCount} réalisations</span> associées, ainsi que leur contribution aux scores, au thermomètre et aux défis en cours.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl px-5 h-11 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
              >
                Annuler
              </Button>
              <Button
                onClick={onConfirm}
                disabled={loading}
                className="rounded-xl px-5 h-11 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2"
              >
                <Trash2 size={16} />
                {loading ? 'Suppression...' : 'Supprimer définitivement'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
