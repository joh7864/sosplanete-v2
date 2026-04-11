'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Papa from 'papaparse';

interface CatalogCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  instanceId: number;
}

interface CsvRow {
  actionRef: string;
  name: string;
  icon: string;
  description: string;
  etoile: string;
  category: string;
}

interface PreviewItem extends CsvRow {
  existsInRef: boolean;
  refName?: string;
  refCategory?: string;
}

export const CatalogCsvModal: React.FC<CatalogCsvModalProps> = ({ isOpen, onClose, onImport, instanceId }) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      delimiter: ';',
      complete: async (results) => {
        const rows = results.data as string[][];
        if (!rows || rows.length < 2) {
          setError("Le fichier semble vide ou invalide.");
          setLoading(false);
          return;
        }

        const formattedRows: CsvRow[] = rows.slice(1).map(row => ({
          actionRef: row[0]?.trim() || '',
          name: row[1]?.trim() || '',
          icon: row[2]?.trim() || '',
          description: row[3]?.trim() || '',
          etoile: row[4]?.trim() || '',
          category: row[5]?.trim() || '',
        })).filter(r => r.actionRef);

        if (formattedRows.length === 0) {
          setError("Aucune donnée valide trouvée dans le fichier.");
          setLoading(false);
          return;
        }

        try {
          const token = localStorage.getItem('access_token');
          const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/action-ref`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          
          if (resp.ok) {
            const allRefs = await resp.json();
            const preview = formattedRows.map(row => {
               const ref = allRefs.find((r: any) => r.code === row.actionRef);
               return {
                 ...row,
                 existsInRef: !!ref,
                 refName: ref?.referenceName,
                 refCategory: ref?.category
               };
            });
            setPreviewData(preview);
            setStep('preview');
          }
        } catch (e) {
          setError("Erreur lors de la validation du référentiel.");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isCsv = file.name.toLowerCase().endsWith('.csv') || 
                    file.type === 'text/csv' || 
                    file.type === 'application/vnd.ms-excel';
      
      if (isCsv) {
        processFile(file);
      } else {
        setError("Veuillez déposer un fichier CSV valide (.csv).");
      }
    }
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const token = localStorage.getItem('access_token');
      // Only import valid rows
      const validActions = previewData.filter(d => d.existsInRef);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/local-actions/import-codes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instanceId,
          actions: validActions
        })
      });

      if (response.ok) {
        onImport();
        onClose();
        setStep('upload');
        setPreviewData([]);
      }
    } catch (e) {
      setError("Erreur lors de l'importation finale.");
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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                 <Upload size={24} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Importation Catalogue CSV</h2>
                 <p className="text-slate-500 text-sm">Liez massivement des actions par codes référentiels.</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-800 transition-all">
              <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 pt-0">
           {step === 'upload' ? (
             <div className="flex flex-col gap-6">
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                   className={`group border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-all ${isDragging ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02]' : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30'}`}
                >
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-emerald-500 transition-all shadow-sm">
                      {loading ? <Loader2 size={32} className="animate-spin" /> : <Plus size={32} />}
                   </div>
                   <div className="text-center">
                      <p className="font-black text-slate-700 text-lg uppercase tracking-tight">Déposer votre fichier CSV ici</p>
                      <p className="text-slate-400 text-sm mt-1 font-medium">ou cliquez pour parcourir votre ordinateur</p>
                   </div>
                   <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv"
                      className="hidden" 
                      onChange={handleFileUpload}
                   />
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shrink-0">
                      <Info size={20} />
                   </div>
                   <div className="flex flex-col gap-1">
                      <h4 className="font-black text-slate-800 text-sm">Spécifications du fichier</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Le fichier doit contenir 6 colonnes dans cet ordre : <br/>
                        <span className="font-black text-slate-700">ActionRef</span> (Code), 
                        <span className="font-bold"> Name</span>, 
                        <span className="font-bold"> Icon</span>, 
                        <span className="font-bold"> Description</span>, 
                        <span className="font-bold"> Etoile</span>, 
                        <span className="font-bold"> Category</span>.
                      </p>
                   </div>
                </div>
                {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
             </div>
           ) : (
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Aperçu de l'import</span>
                      <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                        {previewData.filter(d => d.existsInRef).length} VALIDES
                      </span>
                   </div>
                   <button onClick={() => setStep('upload')} className="text-xs font-bold text-emerald-600 hover:underline">Changer de fichier</button>
                </div>

                <div className="flex flex-col gap-2">
                   {previewData.map((row, idx) => (
                      <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${row.existsInRef ? 'bg-white border-slate-100' : 'bg-rose-50/50 border-rose-100 opacity-60'}`}>
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${row.existsInRef ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                            {row.existsInRef ? <Check size={20} /> : <AlertTriangle size={20} />}
                         </div>
                         <div className="flex flex-col flex-grow min-w-0">
                            <div className="flex items-center gap-2">
                               <span className="font-black text-slate-800 text-sm">{row.actionRef}</span>
                               <span className="text-xs font-bold text-slate-400 truncate">— {row.name || 'Aucun nom'}</span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 italic truncate">
                               {row.existsInRef ? `Correspondance : ${row.refName}` : "Code inconnu dans le référentiel"}
                            </span>
                         </div>
                         <div className="text-right shrink-0">
                            <span className="text-[10px] font-black p-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100 uppercase text-slate-400">
                               {row.category || 'Sans Cat.'}
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
           <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} disabled={importing}>Annuler</Button>
              <Button 
                onClick={handleConfirmImport} 
                className="h-12 px-10 bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                disabled={importing || previewData.filter(d => d.existsInRef).length === 0}
              >
                {importing ? <Loader2 className="animate-spin" size={20} /> : `Confirmer l'importation`}
              </Button>
           </div>
        )}
      </motion.div>
    </div>
  );
};

const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
