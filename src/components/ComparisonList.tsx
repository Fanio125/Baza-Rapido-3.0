import { motion } from 'motion/react';
import { Star, Clock, Navigation2, ArrowUpRight, CheckCircle2, Zap, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ComparisonResult } from '../types';

interface ComparisonListProps {
  results: ComparisonResult[];
}

export default function ComparisonList({ results }: ComparisonListProps) {
  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold font-display">Resultados encontrados</h3>
        <span className="text-xs font-medium text-gray-500">{results.length} serviços disponíveis</span>
      </div>

      {results.map((item, index) => (
        <motion.div
          key={item.appId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "premium-card p-5 relative overflow-hidden group",
            item.isCheapest && "ring-2 ring-emerald-500/20",
            item.isFastest && "ring-2 ring-blue-500/20",
            item.isBestRated && "ring-2 ring-orange-500/20"
          )}
        >
          {/* Badges */}
          <div className="absolute top-0 right-5 flex gap-2">
            {item.isCheapest && (
              <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-b-lg flex items-center gap-1 uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Mais Barato
              </div>
            )}
            {item.isFastest && (
              <div className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-b-lg flex items-center gap-1 uppercase tracking-wider">
                <Zap size={10} className="fill-blue-500" />
                Mais Rápido
              </div>
            )}
             {item.isBestRated && (
              <div className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-b-lg flex items-center gap-1 uppercase tracking-wider">
                <Award size={10} className="fill-orange-500" />
                Melhor Avaliado
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center bg-gray-50 group-hover:scale-105 transition-transform p-2">
                <img 
                  src={item.logo} 
                  alt={item.name} 
                  className={cn(
                    "w-full h-full object-contain",
                    item.appId === 'indrive' && "scale-125",
                    item.appId === 'bolt' && "scale-125 object-cover",
                    item.appId === 'uber' && "scale-125 object-cover",
                    item.appId === 'heetch' && "scale-125 object-cover",
                    item.appId === 'vambazar' && "scale-125 object-cover",
                    item.appId === 'ugo' && "scale-125 object-cover",
                    item.appId === 'tleva' && "scale-125 object-cover",
                    item.appId === 'yango' && "scale-125 object-cover"
                  )}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{item.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span>{item.rating}</span>
                  </div>
                  <span className="text-[10px] text-gray-300">•</span>
                  <span className="text-xs font-medium text-gray-400">{item.carType}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900 leading-none">
                {item.price.toLocaleString('pt-AO')} <span className="text-xs font-medium">Kz</span>
              </div>
              <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Preço Estimado</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 rounded-xl p-2 flex flex-col items-center justify-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Chegada</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={12} className="text-primary" />
                <span className="text-xs font-bold">{item.waitingTime} min</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-2 flex flex-col items-center justify-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Viagem</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Navigation2 size={12} className="text-blue-500" />
                <span className="text-xs font-bold">{item.travelTime} min</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-2 flex flex-col items-center justify-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Pagamento</span>
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold truncate max-w-[50px]">{item.paymentMethods[0]}</span>
              </div>
            </div>
          </div>

          <button className="w-full btn-primary py-3">
            <span>Abrir {item.name}</span>
            <ArrowUpRight size={18} />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
