import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Info } from 'lucide-react';

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

export default function StatisticsSection() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-display">Histórico de Preços</h3>
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="premium-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Melhor hora</div>
          <div className="text-lg font-bold text-gray-900">10:00 - 11:30</div>
          <p className="text-[10px] text-gray-400 mt-1">Preços 30% menores</p>
        </div>
        <div className="premium-card p-4 border-l-4 border-l-red-500">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Hora de Pico</div>
          <div className="text-lg font-bold text-gray-900">17:00 - 19:00</div>
          <p className="text-[10px] text-gray-400 mt-1">Alta demanda</p>
        </div>
      </div>

      <div className="bg-dark p-6 rounded-2xl relative overflow-hidden">
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

      <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl">
        <Info size={16} className="text-gray-400 mt-0.5" />
        <p className="text-[11px] text-gray-500 font-medium">Os preços são estimativas baseadas em dados históricos e podem variar conforme o trânsito real.</p>
      </div>
    </div>
  );
}
