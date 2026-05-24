import { motion } from 'motion/react';
import { ChevronLeft, Info, CheckCircle2, User, Globe, Calendar } from 'lucide-react';
import type { ViewState } from '../types';

interface VersionSectionProps {
  onNavigate: (view: ViewState) => void;
}

export default function VersionSection({ onNavigate }: VersionSectionProps) {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate('settings')}
          className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold font-display tracking-tight text-gray-900">Versão</h2>
      </div>

      <div className="space-y-6">
        {/* Technical Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-1 border-none divide-y divide-gray-50"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <Globe size={18} />
              </div>
              <span className="text-sm font-bold text-gray-900">Versão</span>
            </div>
            <span className="text-sm font-mono font-bold text-gray-500">1.0.0</span>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                <Info size={18} />
              </div>
              <span className="text-sm font-bold text-gray-900">Build</span>
            </div>
            <span className="text-sm font-mono font-bold text-gray-500">100</span>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <Calendar size={18} />
              </div>
              <span className="text-sm font-bold text-gray-900">Última atualização</span>
            </div>
            <span className="text-sm font-bold text-gray-500">30/04/2026</span>
          </div>
        </motion.div>

        {/* Founder */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-4 border-none flex items-center gap-4 group"
        >
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
            <User size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Fundador</p>
            <p className="text-sm font-bold text-gray-900 leading-tight">Franklin Manuel Teixeira Garcia</p>
          </div>
        </motion.div>

        {/* Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4 flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} className="text-emerald-500" />
          <span className="text-sm font-bold text-gray-600">O aplicativo está atualizado</span>
        </motion.div>
      </div>
    </div>
  );
}
