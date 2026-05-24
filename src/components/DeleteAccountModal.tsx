import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError('Houve um erro ao eliminar a conta. Tenta novamente.');
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              {/* Header Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500">
                  <AlertTriangle size={40} />
                </div>
              </div>

              {/* Text Info */}
              <div className="text-center space-y-3 mb-8">
                <h3 className="text-xl font-black font-display tracking-tight text-gray-900">
                  Tens certeza que queres eliminar a tua conta?
                </h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  Esta ação é permanente e não pode ser desfeita. Todos os teus dados serão eliminados definitivamente do nosso sistema.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 rounded-2xl">
                  <p className="text-xs font-bold text-red-500 text-center">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="w-full h-14 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Trash2 size={20} />
                  )}
                  {isDeleting ? 'Eliminando...' : 'Eliminar conta'}
                </button>
                
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="w-full h-14 bg-white text-gray-500 rounded-2xl font-bold hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>

            {/* Close Button Top Right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
