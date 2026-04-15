import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false
}) => {
  const colors = {
    danger: { bg: 'bg-red-50', text: 'text-red-600', button: 'bg-red-600 hover:bg-red-700' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-600', button: 'bg-amber-600 hover:bg-amber-700' },
    info: { bg: 'bg-blue-50', text: 'text-blue-600', button: 'bg-blue-600 hover:bg-blue-700' }
  };

  const style = colors[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className={`p-8 ${style.bg} flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center ${style.text}`}>
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
            </div>

            <div className="p-8">
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                {description}
              </p>

              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  onClick={onClose} 
                  className="flex-1 rounded-2xl"
                  disabled={isLoading}
                >
                  {cancelLabel}
                </Button>
                <Button 
                  onClick={onConfirm}
                  isLoading={isLoading}
                  className={`flex-1 rounded-2xl text-white shadow-lg ${style.button}`}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
