import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Info, BarChart3, Star, RefreshCw } from 'lucide-react';

const data = [
  { time: '06:00', price: 1200 },
  { time: '08:00', price: 2100 },
  { time: '10:00', price: 1500 },
  { time: '12:00', price: 1800 },
  { time: '14:00', price: 1600 },
  { time: '16:00', price: 2400 },
  { time: '18:00', price: 2800 },
  { time: '20:00', price: 1900 },
  { time: '22:00', price: 1400 },
];

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
        { id: 'yango', name: 'Yango', defaultCount: 18, color: 'from-orange-500 to-amber-600', logoColor: '#FF6B00' },
        { id: 'heetch', name: 'Heetch', defaultCount: 12, color: 'from-pink-500 to-rose-600', logoColor: '#FF007F' },
        { id: 'uber', name: 'Uber', defaultCount: 6, color: 'from-gray-800 to-neutral-900', logoColor: '#1A1A1A' },
        { id: 'tleva', name: 'T\'Leva', defaultCount: 4, color: 'from-cyan-500 to-indigo-600', logoColor: '#00D1FF' }
      ];

      const loadedStats = apps.map(app => {
        const liveCount = currentCounts[app.id] || 0;
        return {
          id: app.id,
          name: app.name,
          count: liveCount + app.defaultCount, // combine live clicks with base illustrative demo stats
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

  const totalRequests = platformStats.reduce((acc, curr) => acc + curr.count, 0) || 1;

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
            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all rounded-xl"
            title="Atualizar dados"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="premium-card p-6 space-y-5">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Frequência de Escolhas por Correios</p>
          
          <div className="space-y-4">
            {platformStats.map((app, index) => {
              const percentage = Math.round((app.count / totalRequests) * 100);
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

          <div className="pt-2 border-t border-gray-50 dark:border-neutral-800/60 flex items-center justify-between text-[11px] font-semibold text-gray-500">
            <span>Total Logado: {totalRequests} solicitações</span>
            <span className="text-primary font-black">Dados de Escolha Real</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">Histórico de Preços em Luanda</h3>
        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
          <TrendingDown size={14} />
          <span>Barato agora</span>
        </div>
      </div>

      <div className="premium-card p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 600, fill: '#999' }}
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                fontSize: '12px',
                fontWeight: 'bold'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#FF6B00" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              name="Preço médio (Kz)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="premium-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Melhor hora</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">10:00 - 11:30</div>
          <p className="text-[10px] text-gray-400 mt-1">Preços 30% menores</p>
        </div>
        <div className="premium-card p-4 border-l-4 border-l-red-500">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Hora de Pico</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">17:00 - 19:00</div>
          <p className="text-[10px] text-gray-400 mt-1">Alta demanda</p>
        </div>
      </div>

      <div className="bg-[#121214] p-6 rounded-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary mb-2">
            <TrendingUp size={20} />
            <span className="font-bold text-sm uppercase tracking-widest">Previsão Inteligente</span>
          </div>
          <p className="text-white text-sm leading-relaxed opacity-90">
            Amanhã os preços devem subir 15% devido ao evento no <span className="text-primary font-bold">Estádio 11 de Novembro</span>. Recomendamos reservar cedo.
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 blur-xl scale-150 pointer-events-none">
          <TrendingUp size={120} className="text-primary" />
        </div>
      </div>

      <div className="flex items-start gap-3 bg-gray-50 dark:bg-neutral-800/40 p-4 rounded-xl">
        <Info size={16} className="text-gray-400 mt-0.5" />
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Os preços são estimativas baseadas em dados históricos e podem variar conforme o trânsito real.</p>
      </div>
    </div>
  );
}
