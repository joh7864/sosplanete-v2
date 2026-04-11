'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Papa from 'papaparse';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface CsvImportModalProps {
  isOpen: boolean;
  instanceId: number;
  instanceName: string;
  onClose: () => void;
  onImport: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, instanceId, instanceName, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{teams: number, groups: number, players: number} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeKey = (obj: any, searchKeys: string[]) => {
    const entry = Object.entries(obj).find(([key]) => 
      searchKeys.some(sk => key.toLowerCase().trim() === sk.toLowerCase())
    );
    return entry ? entry[1] : null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setTotalRows(results.data.length);
          setPreview(results.data.slice(0, 50)); // Up to 50 for compact preview
          setStep('preview');
        } else {
          setError("Le fichier semble vide ou mal formaté.");
        }
      },
      error: (err) => {
        setError("Erreur lors de la lecture du fichier : " + err.message);
      }
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvContent = e.target?.result as string;
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/import-csv?instanceId=${instanceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthData('access_token')}`,
          },
          body: JSON.stringify({ csvContent }),
        });

        if (resp.ok) {
          const result = await resp.json();
          setStats(result);
          onImport();
          setTimeout(onClose, 3000);
        } else {
          const data = await resp.json();
          setError(data.message || "Erreur lors de l'import (500).");
        }
      } catch (err) {
        setError("Erreur réseau.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
          
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-3xl">
            <GlassCard padding="none" className="overflow-hidden border-none shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Importer l'Organisation</h2>
                    <p className="text-xs text-slate-500 font-medium">Glissez votre fichier CSV pour peupler votre instance.</p>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>

                {stats ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100 animate-bounce"><Check size={32} /></div>
                    <h3 className="text-xl font-black text-slate-800">Import réussi !</h3>
                    <p className="text-sm text-slate-500">{stats.teams} équipes, {stats.groups} groupes et {stats.players} joueurs créés.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      {step === 'upload' ? (
                        <motion.div key="upload" className="space-y-6">
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const droppedFile = e.dataTransfer.files?.[0];
                              if (droppedFile && droppedFile.name.endsWith('.csv')) {
                                processFile(droppedFile);
                              }
                            }}
                            className="border-4 border-dashed border-slate-100 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-emerald-500/30 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                          >
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all"><Upload size={32} /></div>
                            <div className="text-center"><p className="text-base font-black text-slate-700">Sélectionner {instanceName}.csv</p><p className="text-xs text-slate-400 font-medium">Semicolon (;) separator required</p></div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                          </div>
                          
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                                <Upload size={20} className="rotate-180" />
                             </div>
                             <div className="flex flex-col gap-1">
                                <h4 className="font-black text-slate-800 text-sm">Spécifications du fichier</h4>
                                <p className="text-slate-500 text-xs leading-relaxed">
                                  Le fichier doit comporter 5 colonnes séparées par des points-virgules (;) : <br/>
                                  <span className="font-black text-slate-700">Équipe, Groupe, Pseudo, Mot de passe, Logo équipe</span>.
                                </p>
                             </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="preview" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 <FileSpreadsheet size={14} /> {totalRows} LIGNES DÉTECTÉES
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Aperçu compact (50 premières)</span>
                            </div>
                            <button onClick={() => setStep('upload')} className="text-[10px] font-black text-emerald-600 hover:underline uppercase">Changer</button>
                          </div>
                          
                          <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-[10px]">
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-100/90 backdrop-blur-sm text-slate-500 font-black uppercase tracking-widest border-b border-slate-200">
                                  <th className="px-3 py-2">Équipe</th>
                                  <th className="px-3 py-2">Groupe</th>
                                  <th className="px-3 py-2">Joueur</th>
                                  <th className="px-3 py-2">Pass</th>
                                  <th className="px-3 py-2">Logo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {preview.map((row, i) => (
                                  <tr key={i} className="border-b border-slate-100/50 last:border-none hover:bg-white/50 transition-colors">
                                    <td className="px-3 py-1.5 font-bold text-slate-700">{(normalizeKey(row, ['Equipe', 'equipe']) as string) || '-'}</td>
                                    <td className="px-3 py-1.5 text-slate-600">{(normalizeKey(row, ['Group', 'group', 'groupe']) as string) || '-'}</td>
                                    <td className="px-3 py-1.5 text-slate-600">{(normalizeKey(row, ['Pseudo', 'pseudo']) as string) || '-'}</td>
                                    <td className="px-3 py-1.5 text-slate-400 font-mono italic">******</td>
                                    <td className="px-3 py-1.5">{normalizeKey(row, ['logo equipe']) ? '🖼️' : '❌'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {error && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold flex items-center gap-2">
                              <AlertCircle size={14} /> {error}
                            </div>
                          )}

                          <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs" onClick={() => setStep('upload')}>Annuler</Button>
                            <Button variant="primary" className="flex-[2] h-12 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs" onClick={handleUpload} disabled={loading} isLoading={loading}>
                              Confirmer l'importation
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
