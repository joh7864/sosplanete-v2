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
  FileSpreadsheet,
  PartyPopper,
  Sparkles,
  Info,
  FolderOpen
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { PremiumProgressBar } from '@/components/ui/PremiumProgressBar';
import Papa from 'papaparse';
import { getAuthData } from '@/utils/storage';

interface CategoryImportModalProps {
  isOpen: boolean;
  instanceId: number;
  instanceName: string;
  onClose: () => void;
  onImport: () => void;
}

export const CategoryImportModal: React.FC<CategoryImportModalProps> = ({ 
  isOpen, 
  instanceId, 
  instanceName, 
  onClose, 
  onImport 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Analyse du fichier...');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{created: number, updated: number} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setTotalRows(results.data.length);
          setPreview(results.data.slice(0, 50));
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
      setStep('importing');
      setProgress(0);
      setStatus('Initialisation de l\'import...');

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 400);

      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/import-csv?instanceId=${instanceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthData('access_token')}`,
          },
          body: JSON.stringify({ csvContent }),
        });

        if (resp.ok) {
          setStatus('Sychronisation terminée...');
          await new Promise(r => setTimeout(r, 1000));
          
          clearInterval(progressInterval);
          setProgress(100);
          setStatus('Importation terminée !');
          
          const result = await resp.json();
          setTimeout(() => {
            setStats(result);
            setTimeout(() => {
              onImport();
              onClose();
              // Reset for next time
              setStats(null);
              setStep('upload');
            }, 3500); 
          }, 500);
        } else {
          clearInterval(progressInterval);
          const data = await resp.json();
          setError(data.message || "Erreur lors de l'import.");
          setStep('preview');
        }
      } catch (err) {
        clearInterval(progressInterval);
        setError("Erreur réseau.");
        setStep('preview');
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
          
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl">
            <GlassCard padding="none" className="overflow-hidden border-none shadow-3xl bg-white/95 backdrop-blur-xl rounded-[2.5rem]">
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100">
                       <FolderOpen size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Importer les Catégories</h2>
                      <p className="text-xs text-slate-500 font-medium italic">Pour l'école : {instanceName}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><X size={20} /></button>
                </div>

                {stats ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-10 flex flex-col items-center text-center gap-6"
                  >
                    <div className="relative">
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 relative z-10"
                      >
                         <Check size={40} strokeWidth={3} />
                      </motion.div>
                      <Sparkles className="absolute -top-3 -right-3 text-amber-400 animate-pulse" size={28} />
                      <PartyPopper className="absolute -bottom-3 -left-3 text-sky-400 animate-bounce" size={28} />
                    </div>

                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-slate-800 tracking-tight">C'est en ligne !</h3>
                       <p className="text-sm text-slate-500 max-w-sm mx-auto">
                         Les catégories ont été synchronisées avec succès.
                       </p>
                    </div>

                    <div className="flex gap-4 justify-center">
                       {[
                         { label: 'Créées', value: stats.created, color: 'text-emerald-500' },
                         { label: 'Mises à jour', value: stats.updated, color: 'text-sky-500' }
                       ].map((s, i) => (
                         <div key={i} className="px-6 py-3 bg-white rounded-2xl border border-slate-100 flex flex-col shadow-sm">
                            <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                ) : step === 'importing' ? (
                  <div className="py-20 px-10">
                    <PremiumProgressBar progress={progress} status={status} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <AnimatePresence mode="wait">
                      {step === 'upload' ? (
                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              const droppedFile = e.dataTransfer.files?.[0];
                              if (droppedFile && droppedFile.name.endsWith('.csv')) processFile(droppedFile);
                            }}
                            className="border-4 border-dashed border-slate-100 rounded-3xl p-14 flex flex-col items-center justify-center gap-4 hover:border-emerald-500/30 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                          >
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all shadow-inner"><Upload size={32} /></div>
                            <div className="text-center"><p className="text-lg font-black text-slate-700 tracking-tight">Sélectionner votre CSV</p><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Séparateur requis : point-virgule (;)</p></div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                          </div>
                          
                          <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50 flex gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shrink-0 shadow-sm border border-emerald-50">
                                <Info size={20} />
                             </div>
                             <div className="flex flex-col gap-1">
                                <h4 className="font-black text-slate-800 text-sm italic">Format de colonnes attendu :</h4>
                                <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
                                  Le fichier doit comporter les colonnes suivantes : <br/>
                                  <span className="font-black text-emerald-700 uppercase tracking-tighter decoration-emerald-200 decoration-2">Nom ; Icone ; Ordre</span>.
                                </p>
                             </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                              <div className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100">
                                 <FileSpreadsheet size={14} /> {totalRows} LIGNES
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Aperçu des données</span>
                            </div>
                            <button onClick={() => setStep('upload')} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg transition-colors uppercase tracking-widest">Changer</button>
                          </div>
                          
                          <div className="rounded-3xl border border-slate-100 overflow-hidden bg-white shadow-inner max-h-[250px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-[11px]">
                              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
                                <tr className="text-slate-400 font-black uppercase tracking-widest">
                                  <th className="px-5 py-3">Nom</th>
                                  <th className="px-5 py-3">Icone</th>
                                  <th className="px-5 py-3 text-center">Ordre</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {preview.map((row, i) => (
                                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-2.5 font-bold text-slate-700">{row['nom'] || row['name'] || '-'}</td>
                                    <td className="px-5 py-2.5 text-slate-400 font-medium italic">{row['icone'] || row['icon'] || '-'}</td>
                                    <td className="px-5 py-2.5 text-slate-600 font-black text-center">{row['ordre'] || row['order'] || '0'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {error && (
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-3 animate-shake">
                              <AlertCircle size={18} /> {error}
                            </div>
                          )}

                          <div className="flex gap-4 pt-4">
                            <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400" onClick={() => setStep('upload')}>Annuler</Button>
                            <Button variant="primary" className="flex-[2] h-14 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20" onClick={handleUpload} disabled={loading}>
                              Lancer la synchronisation
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
