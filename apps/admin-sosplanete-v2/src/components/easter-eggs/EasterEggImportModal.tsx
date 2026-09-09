'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  FileCode2,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { importAdminCatalog } from '@/utils/easterEggApi';

interface EasterEggImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EasterEggImportModal({
  isOpen,
  onClose,
  onSuccess,
}: EasterEggImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<any[] | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'replace'>('upsert');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    processFile(dropped);
  };

  const processFile = (f: File) => {
    setError(null);
    if (!f.name.endsWith('.json')) {
      setError('Veuillez sélectionner un fichier au format .json valide.');
      setFile(null);
      setParsedItems(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        if (!Array.isArray(json)) {
          throw new Error("Le fichier JSON doit contenir une liste (tableau) d'énigmes.");
        }
        if (json.length === 0) {
          throw new Error('Le fichier JSON ne contient aucune énigme.');
        }
        // Vérifie qu'au moins quelques champs clés sont présents
        const validItems = json.filter((item) => item && (item.code || item.title));
        if (validItems.length === 0) {
          throw new Error('Aucune énigme valide avec les champs "code" ou "title" n\'a été détectée.');
        }

        setFile(f);
        setParsedItems(validItems);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la lecture du fichier JSON.');
        setFile(null);
        setParsedItems(null);
      }
    };
    reader.readAsText(f);
  };

  const handleResetFile = () => {
    setFile(null);
    setParsedItems(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!parsedItems || parsedItems.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await importAdminCatalog(parsedItems, importMode);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'importation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg"
      >
        <GlassCard className="p-6 bg-white/95 border-slate-200/80 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <FileJson size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Importer un catalogue d'Easter Eggs</h3>
                <p className="text-xs text-slate-500">Format JSON avec toutes les caractéristiques</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="py-5 space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* File Dropzone */}
            {!file ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload
                  size={36}
                  className="mx-auto text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all mb-3"
                />
                <p className="text-sm font-bold text-slate-700 mb-1">
                  Glissez-déposez votre fichier JSON ici
                </p>
                <p className="text-xs text-slate-400">
                  ou cliquez pour parcourir vos dossiers (.json)
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
                    <FileCode2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{file.name}</p>
                    <p className="text-[11px] text-emerald-600 font-bold">
                      {parsedItems?.length} énigme(s) détectée(s)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Changer
                </button>
              </div>
            )}

            {/* Mode selector */}
            {parsedItems && parsedItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700">Mode d'importation :</label>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      importMode === 'upsert'
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <strong className="block text-slate-800 font-bold">
                        Mettre à jour & ajouter (Recommandé)
                      </strong>
                      <span className="text-slate-500">
                        Met à jour les énigmes existantes (par code) et ajoute les nouvelles sans toucher aux autres.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      importMode === 'replace'
                        ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-xs">
                      <strong className="block text-slate-800 font-bold">
                        Remplacement complet
                      </strong>
                      <span className="text-slate-500">
                        Efface l'intégralité du catalogue actuel et importe uniquement les énigmes du fichier.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!parsedItems || parsedItems.length === 0 || isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black shadow-sm shadow-emerald-600/30 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Importation...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Importer {parsedItems ? `(${parsedItems.length})` : ''}
                </>
              )}
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
