import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Info, RefreshCw } from 'lucide-react';

interface AppStat {
  id: string;
  name: string;
  count: number;
  color: string;
  logoColor: string;
}

export default function StatisticsSection() {
  const [platformStats, setPlatformStats] = useState<AppStat[]>([]);

  const loadPlatformStats = () => {
    try {
      const countKey = 'ride_app_requests_count';
      const currentCountsStr = localStorage.getItem(countKey);
      const currentCounts = currentCountsStr ? JSON.parse(currentCountsStr) : {};
      
      const apps = [
        { id: 'yango', name: 'Yango', color: 'from-orange-500 to-amber-600', logoColor: '#FF6B00' },
        { id: 'bolt', name: 'Bolt', color: 'from-emerald-500 to-teal-600', logoColor: '#34D186' },
        { id: 'indrive', name: 'inDrive', color: 'from-lime-500 to-green-600', logoColor: '#28A745' },
        { id: 'uber', name: 'Uber', color: 'from-gray-800 to-neutral-900', logoColor: '#1A1A1A' },
        { id: 'heetch', name: 'Heetch', color: 'from-pink-500 to-rose-600', logoColor: '#FF007F' },
        { id: 'ugo', name: 'UGO', color: 'from-blue-500 to-indigo-600', logoColor: '#2563EB' },
        { id: 'tleva', name: "T'Leva", color: 'from-cyan-500 to-teal-600', logoColor: '#00D1FF' },
        { id: 'vambazar', name: 'Vambanzar', color: 'from-amber-500 to-orange-600', logoColor: '#F59E0B' },
        { id: 'anda', name: 'Anda', color: 'from-teal-500 to-emerald-600', logoColor: '#0D9488' }
      ];

      const loadedStats = apps.map(app => {
        const liveCount = Number(currentCounts[app.id] || 0);
        return {
          id: app.id,
          name: app.name,
          count: liveCount,
          color: app.color,
          logoColor: app.logoColor
        };
      });

      // Sort by request count descending
      loadedStats.sort((a, b) => b.count - a.count);
      setPlatformStats(loadedStats);
    } catch (e) {
      console.error('Error loading platform request stats:', e);
    }
  };

  useEffect(() => {
    loadPlatformStats();
  }, []);

  const totalRequests = platformStats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Real-time platform popularity dashboard section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-primary" size={22} />
            <h3 className="text-xl font-black font-display tracking-tight text-gray-900 dark:text-white">Uso de Aplicações</h3>
          </div>
          <button 
            type="button"
            onClick={loadPlatformStats}
            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all rounded-xl cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="premium-card p-6 space-y-5">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Frequência de Escolhas por Correios</p>
          
          {totalRequests === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs font-bold">
              Sem estatísticas disponíveis. Nenhuma solicitação registrada ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {platformStats.map((app, index) => {
                const percentage = totalRequests > 0 ? Math.round((app.count / totalRequests) * 100) : 0;
                return (
                  <div key={app.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-250">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: app.logoColor }} />
                        <span className="capitalize">{app.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-medium">{app.count} Cliques</span>
                        <span className="text-gray-900 dark:text-white font-black">{percentage}%</span>
                      </div>
                    </div>
                    
                    {/* Progress Line */}
                    <div className="relative h-3 w-full bg-gray-150/40 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`absolute top-0 left-0 bottom-0 rounded-full bg-gradient-to-r ${app.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-gray-50 dark:border-neutral-800/60 flex items-center justify-between text-[11px] font-semibold text-gray-500">
            <span>Total Registrado: {totalRequests} solicitações</span>
            <span className="text-primary font-black">Dados em Tempo Real</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-gray-50 dark:bg-neutral-800/40 p-4 rounded-xl">
        <Info size={16} className="text-gray-400 mt-0.5" />
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">As estatísticas são calculadas com base nos dados reais registrados pelos utilizadores na plataforma.</p>
      </div>
    </div>
  );
}
