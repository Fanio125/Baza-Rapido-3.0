import { motion } from 'motion/react';
import { ChevronLeft, Shield, Lock, Eye, Download, Check } from 'lucide-react';
import type { ViewState } from '../types';

interface PrivacySectionProps {
  onNavigate: (view: ViewState) => void;
}

export default function PrivacySection({ onNavigate }: PrivacySectionProps) {
  const points = [
    'Os teus dados (nome, telefone e localização) são usados apenas para funcionamento do serviço.',
    'A localização pode ser usada para conectar utilizadores a motoristas próximos.',
    'Não vendemos dados pessoais a terceiros.',
    'Os dados são armazenados de forma segura no sistema.'
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
        <h2 className="text-xl font-bold font-display tracking-tight text-gray-900">Política de privacidade</h2>
      </div>

      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6 border-none space-y-6"
        >
          <div className="flex items-center gap-3 text-secondary">
            <Lock size={24} />
            <h3 className="font-bold text-lg">Nós respeitamos a tua privacidade.</h3>
          </div>

          <div className="space-y-6">
            {points.map((point, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (index * 0.1) }}
                className="flex gap-4 items-start"
              >
                <div className="mt-1 flex-shrink-0 p-1.5 bg-gray-50 rounded-lg text-gray-400 group-hover:text-primary transition-colors">
                  <Eye size={16} />
                </div>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  {point}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="premium-card p-6 border-none space-y-4"
        >
          <div className="flex items-center gap-2 text-amber-600">
            <span className="text-xl">📌</span>
            <h3 className="font-black text-[10px] uppercase tracking-widest pt-1">3. Consentimento</h3>
          </div>
          
          <p className="text-sm font-bold text-gray-900">
            Ao continuar a usar o Baza Rápido, o utilizador confirma que:
          </p>

          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-gray-600 font-medium italic">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Leu e aceitou os Termos de Uso
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-600 font-medium italic">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Concorda com a Política de Privacidade
            </li>
          </ul>

          <div className="pt-4">
            <button 
              onClick={() => onNavigate('settings')}
              className="w-full h-14 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-gray-200"
            >
              <Check size={20} className="text-emerald-400" />
              Aceitar e continuar
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
