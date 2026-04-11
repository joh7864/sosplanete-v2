'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Check,
  AlertTriangle,
  Info,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Papa from 'papaparse';

interface ReferenceCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

interface ActionRefRow {
  code: string;
  name: string;
  co2: string;
  water: string;
  waste: string;
  category: string;
  impactLabel: string;
  stars: string;
}

export const ReferenceCsvModal: React.FC<ReferenceCsvModalProps> = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ActionRefRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (selectedFile: File) => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: false,
      skipEmptyLines: true,
      delimiter: ';',
      complete: (results) => {
        const rows = results.data as string[][];
        if (!rows || rows.length < 2) {
          setError("Le fichier semble vide ou invalide (en-tête manquant ?).");
          setLoading(false);
          return;
        }

        // Preview mapping (limit to first 100 for performance)
        const formattedRows: ActionRefRow[] = rows.slice(1, 101).map(row => ({
          code: row[0]?.trim() || '',
          name: row[1]?.trim() || '',
          co2: row[2]?.trim() || '0',
          water: row[3]?.trim() || '0',
          waste: row[4]?.trim() || '0',
          category: row[5]?.trim() || '',
          impactLabel: row[7]?.trim() || '',
          stars: row[9]?.trim() || '0',
        })).filter(r => r.code && r.name);

        if (formattedRows.length === 0) {
          setError("Aucune donnée valide trouvée (Code et Nom obligatoires).");
        } else {
          setPreviewData(formattedRows);
          setStep('preview');
        }
        setLoading(false);
      },
      error: () => {
        setError("Erreur lors du parsing du fichier CSV.");
        setLoading(false);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
        const isCsv = droppedFile.name.toLowerCase().endsWith('.csv') || 
                      droppedFile.type === 'text/csv' || 
                      droppedFile.type === 'application/vnd.ms-excel';
        if (isCsv) {
            processFile(droppedFile);
        } else {
            setError("Veuillez déposer un fichier CSV (.csv).");
        }
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        onImport();
        onClose();
        // Reset local state
        setStep('upload');
        setFile(null);
        setPreviewData([]);
      } else {
        const msg = await response.text();
        setError(msg || "Erreur lors de l'importation sur le serveur.");
      }
    } catch (e) {
      setError("Erreur réseau lors de l'envoi du fichier.");
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                 <Upload size={24} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Import Référentiel Communs</h2>
                 <p className="text-slate-500 text-xs font-medium">Mise à jour massive des actions globales SOS Planète.</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-800 transition-all shadow-sm">
              <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8">
           {step === 'upload' ? (
             <div className="flex flex-col gap-6">
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                   className={`group border-4 border-dashed rounded-3xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-all ${isDragging ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30'}`}
                >
                   <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-emerald-500 transition-all shadow-inner">
                      {loading ? <Loader2 size={40} className="animate-spin text-emerald-500" /> : <Plus size={40} strokeWidth={3} />}
                   </div>
                   <div className="text-center">
                      <p className="font-black text-slate-800 text-xl tracking-tight">Déposez le fichier CSV ici</p>
                      <p className="text-slate-400 text-sm mt-1 font-bold">Séparateur requis : point-virgule (;)</p>
                   </div>
                   <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv"
                      className="hidden" 
                      onChange={handleFileUpload}
                   />
                </div>

                <div className="bg-emerald-50/20 p-6 rounded-2xl border border-emerald-100 flex gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-50">
                      <Info size={20} />
                   </div>
                   <div className="flex flex-col gap-1">
                      <h4 className="font-black text-slate-800 text-sm italic">IMPORTANT : Spécifications du fichier</h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
                        Le fichier doit comporter exactement <span className="text-emerald-700 font-black underline">11 colonnes</span> dans cet ordre précis : <br/>
                        <span className="font-bold">Code, Nom Action, CO2, Eau, Déchets, Catégorie, CO2/An, Impact, Total Impact, Étoiles, Image.</span>
                      </p>
                   </div>
                </div>
                {error && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-sm flex items-center gap-2 animate-shake">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}
             </div>
            ) : (
             <div className="flex flex-col gap-6 pb-8">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fichier sélectionné</span>
                            <span className="text-xs font-black text-slate-700 max-w-[200px] truncate">{file?.name}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lignes analysées</span>
                            <span className="text-xs font-black text-emerald-600">{previewData.length} valides</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setStep('upload')} 
                        className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-xs font-black text-emerald-600 shadow-sm hover:bg-emerald-50 transition-all uppercase tracking-widest"
                    >
                        Changer de fichier
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-inner">
                   <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                       <table className="w-full text-left text-[11px]">
                           <thead className="sticky top-0 z-10 bg-slate-900 text-white shadow-lg">
                               <tr>
                                   <th className="px-5 py-3 font-black uppercase tracking-widest">Code</th>
                                   <th className="px-5 py-3 font-black uppercase tracking-widest">Nom</th>
                                   <th className="px-5 py-3 font-black uppercase tracking-widest">Catégorie</th>
                                   <th className="px-5 py-3 font-black uppercase tracking-widest">Impact</th>
                                   <th className="px-5 py-3 font-black uppercase tracking-widest text-center">Étoiles</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                               {previewData.map((row, idx) => (
                                   <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                       <td className="px-5 py-3 font-black text-emerald-600">{row.code}</td>
                                       <td className="px-5 py-3 font-bold text-slate-700">{row.name}</td>
                                       <td className="px-5 py-3 text-slate-400 font-medium italic">{row.category}</td>
                                       <td className="px-5 py-3">
                                           <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-wider">{row.impactLabel}</span>
                                       </td>
                                       <td className="px-5 py-3 font-black text-center text-slate-600">{row.stars}★</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
                </div>
                
                <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold leading-relaxed">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>Attention : La confirmation écrasera ou mettra à jour les données existantes pour les codes correspondants. Assurez-vous de la validité du fichier.</span>
                </div>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <Button 
                variant="ghost" 
                onClick={onClose} 
                disabled={importing}
                className="font-bold text-slate-500"
            >
                Annuler
            </Button>
            <Button 
                onClick={handleConfirmImport} 
                className="h-12 px-12 bg-emerald-600 text-white shadow-2xl shadow-emerald-600/20 font-black uppercase tracking-widest text-xs rounded-2xl"
                disabled={importing || (step === 'preview' && previewData.length === 0)}
            >
                {importing ? (
                    <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin" size={20} /> Transfert...
                    </div>
                ) : (
                    step === 'upload' ? 'Passer à l\'aperçu' : 'Lancer l\'importation'
                )}
            </Button>
        </div>
      </motion.div>
    </div>
  );
};
