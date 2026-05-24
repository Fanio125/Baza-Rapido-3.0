import { motion } from 'motion/react';
import { ChevronLeft, Info, CheckCircle2 } from 'lucide-react';
import type { ViewState } from '../types';

interface TermsSectionProps {
  onNavigate: (view: ViewState) => void;
}

export default function TermsSection({ onNavigate }: TermsSectionProps) {
  const terms = [
    'O Baza Rápido é uma plataforma de intermediação de transporte.',
    'O utilizador deve fornecer informações verdadeiras ao criar a conta.',
    'É proibido usar o app para fins ilegais ou fraudulentos.',
    'O serviço pode ser atualizado ou alterado a qualquer momento.',
    'O uso contínuo do app significa aceitação dos termos.'
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate('settings')}
          className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold font-display tracking-tight text-gray-900">Termos de uso</h2>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-6 border-none space-y-6"
      >
        <div className="flex items-center gap-3 text-secondary">
          <Info size={24} />
          <h3 className="font-bold text-lg">Bem-vindo ao Baza Rápido.</h3>
        </div>

        <p className="text-gray-600 leading-relaxed">
          Ao utilizar este aplicativo, o utilizador concorda com os seguintes termos:
        </p>

        <div className="space-y-4">
          {terms.map((term, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + (index * 0.1) }}
              className="flex gap-4 items-start"
            >
              <div className="mt-1 flex-shrink-0">
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-gray-700 leading-snug">
                {term}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-50">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
            Última atualização: Abril 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
}
