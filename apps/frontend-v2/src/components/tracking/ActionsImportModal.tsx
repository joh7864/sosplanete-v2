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
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { PremiumProgressBar } from '@/components/ui/PremiumProgressBar';
import Papa from 'papaparse';
import { getAuthData } from '@/utils/storage';

interface ActionsImportModalProps {
  isOpen: boolean;
  instanceId: number;
  onClose: () => void;
  onImport: () => void;
}

export const ActionsImportModal: React.FC<ActionsImportModalProps> = ({ isOpen, instanceId, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Analyse du fichier...');
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{imported: number, total: number, errors: string[]} | null>(null);
  const [showLogs, setShowLogs] = useState(false);

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
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          // Vérification sommaire des colonnes
          const headers = results.meta.fields || [];
          const required = ['Arction ref', 'Team', 'Group', 'Children', 'Date'];
          const missing = required.filter(h => !headers.includes(h));
          
          if (missing.length > 0) {
            setError(`Colonnes manquantes : ${missing.join(', ')}`);
            setFile(null);
            return;
          }

          setTotalRows(results.data.length);
          setPreview(results.data.slice(0, 10));
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
      setStatus('Préparation de l\'envoi...');

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 5;
        });
      }, 500);

      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracking/import-actions-csv?instanceId=${instanceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthData('access_token')}`,
          },
          body: JSON.stringify({ csvContent }),
        });

        if (resp.ok) {
          clearInterval(progressInterval);
          setProgress(100);
          setStatus('Importation terminée !');
          
          const result = await resp.json();
          setImportResult(result);
          setStep('result');
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

  const handleClose = () => {
    if (step === 'result') onImport();
    onClose();
    // Reset state after a short delay to avoid flicker
    setTimeout(() => {
        setStep('upload');
        setFile(null);
        setImportResult(null);
        setShowLogs(false);
        setProgress(0);
    }, 300);
  };

  const handleExportErrors = () => {
    if (!importResult?.errors) return;
    // Format simple : Numero de ligne;Message
    const csvContent = "Ligne;Erreur\n" + importResult.errors.map(err => {
        const parts = err.split(':');
        const line = parts[0]?.replace('Ligne ', '') || '';
        const msg = parts.slice(1).join(':').trim().replace(/"/g, '""');
        return `${line};"${msg}"`;
    }).join("\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `erreurs_import_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
          
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl">
            <GlassCard padding="none" className="overflow-hidden border-none shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Importer des Saisies</h2>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Injectez massivement les actions réalisées par les joueurs via CSV.</p>
                  </div>
                  <button onClick={handleClose} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>

                {step === 'result' ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-6 flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="relative">
                            <motion.div animate={{ scale: [1, 1.1, 1] }} className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 relative z-10">
                                <Check size={32} strokeWidth={3} />
                            </motion.div>
                            <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" size={20} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-800">Importation terminée</h3>
                            <p className="text-sm text-slate-500 font-medium">
                                <span className="text-emerald-600 font-black">{importResult?.imported}</span> actions importées sur un total de {importResult?.total}.
                            </p>
                        </div>
                    </div>

                    {importResult && importResult.errors.length > 0 && (
                        <div className="border border-slate-100 bg-slate-50/50 rounded-2xl overflow-hidden">
                            <button 
                                onClick={() => setShowLogs(!showLogs)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-widest">
                                    <Info size={14} className="text-rose-500" />
                                    <span>Journal des erreurs ({importResult.errors.length})</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleExportErrors(); }}
                                        className="p-1.5 rounded-lg bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-100 shadow-sm"
                                        title="Exporter les erreurs en CSV"
                                    >
                                        <Download size={14} />
                                    </button>
                                    <div className="p-1.5">{showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                                </div>
                            </button>
                            
                            <AnimatePresence>
                                {showLogs && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                        <div className="px-4 pb-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                                            <div className="space-y-1 pt-1">
                                                {importResult.errors.map((err, idx) => (
                                                    <div key={idx} className="flex gap-2 text-[10px] leading-relaxed py-1 border-b border-slate-100 last:border-none">
                                                        <span className="text-rose-500 font-bold shrink-0">FAIL</span>
                                                        <span className="text-slate-500 font-medium">{err}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <Button variant="primary" className="h-12 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs" onClick={handleClose}>
                        Terminer
                    </Button>
                  </motion.div>
                ) : step === 'importing' ? (
                  <div className="py-20 px-10">
                    <PremiumProgressBar progress={progress} status={status} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      {step === 'upload' ? (
                        <motion.div key="upload" className="space-y-6">
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              const droppedFile = e.dataTransfer.files?.[0];
                              if (droppedFile && droppedFile.name.endsWith('.csv')) processFile(droppedFile);
                            }}
                            className="border-4 border-dashed border-slate-100 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-emerald-500/30 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                          >
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all"><Upload size={32} /></div>
                            <div className="text-center">
                                <p className="text-base font-black text-slate-700">Choisir Actions_realisees.csv</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Semicolon (;) separator & DD/MM/YYYY dates</p>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                          </div>

                          {error && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold flex items-center gap-2">
                              <AlertCircle size={14} /> {error}
                            </div>
                          )}
                          
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shrink-0 shadow-sm"><Info size={20} /></div>
                             <div className="flex flex-col gap-1">
                                <h4 className="font-black text-slate-800 text-sm italic tracking-tight">Règle de conformité organisationnelle</h4>
                                <p className="text-slate-500 text-[10px] font-medium leading-relaxed uppercase tracking-tight">
                                  Le fichier ne doit mentionner que des Équipes, Groupes et Pseudos **déjà existants** dans l'instance scolaire. Les lignes inconnues seront filtrées.
                                </p>
                             </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="preview" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 <FileSpreadsheet size={14} /> {totalRows} LIGNES
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Aperçu (10 premières)</span>
                            </div>
                            <button onClick={() => setStep('upload')} className="text-[10px] font-black text-emerald-600 hover:underline uppercase">Annuler</button>
                          </div>
                          
                          <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/50 overflow-x-auto">
                            <table className="w-full text-left text-[9px]">
                              <thead>
                                <tr className="bg-slate-100/90 text-slate-500 font-black uppercase tracking-widest border-b border-slate-200">
                                  <th className="px-3 py-2">REF</th>
                                  <th className="px-3 py-2">Équipe</th>
                                  <th className="px-3 py-2">Groupe</th>
                                  <th className="px-3 py-2">Joueur</th>
                                  <th className="px-3 py-2 text-right">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {preview.map((row, i) => (
                                  <tr key={i} className="border-b border-slate-100/50 last:border-none hover:bg-white/50 transition-colors">
                                    <td className="px-3 py-2 font-bold text-emerald-600">{row['Arction ref']}</td>
                                    <td className="px-3 py-2 text-slate-600 font-medium">{row['Team']}</td>
                                    <td className="px-3 py-2 text-slate-500">{row['Group']}</td>
                                    <td className="px-3 py-2 text-slate-800 font-black">{row['Children']}</td>
                                    <td className="px-3 py-2 text-slate-400 text-right">{row['Date']}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold" onClick={() => setStep('upload')}>Changer fichier</Button>
                            <Button variant="primary" className="flex-[2] h-12 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs" onClick={handleUpload} disabled={loading} isLoading={loading}>
                              Lancer l'importation
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
