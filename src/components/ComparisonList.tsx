import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Clock, 
  Navigation2, 
  ArrowUpRight, 
  CheckCircle2, 
  Zap, 
  Award, 
  MapPin, 
  Loader2, 
  ShieldAlert,
  Compass,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import type { ComparisonResult, Location as TLocation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { rideHistoryService, RideHistory } from '../services/rideHistoryService';
import { triggerDeepLink } from '../utils/deeplinks';

interface ComparisonListProps {
  results: ComparisonResult[];
  origin?: TLocation;
  destination?: TLocation;
  distance?: number;
}

export default function ComparisonList({ results, origin, destination, distance = 1.0 }: ComparisonListProps) {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [activeSimRide, setActiveSimRide] = useState<RideHistory | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Check if there's already an active "Em andamento" ride in LocalStorage on mount
  useEffect(() => {
    const checkActiveRide = () => {
      try {
        const raw = localStorage.getItem('vambora_ride_history');
        if (raw) {
          const list: RideHistory[] = JSON.parse(raw);
          const active = list.find(r => r.status === 'Em andamento' && r.user_id === (user?.id || 'demo-user-id'));
          if (active) {
            setActiveSimRide(active);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar corrida ativa:', err);
      }
    };
    checkActiveRide();
  }, [user?.id]);

  const handleStartSimulatedRide = async (item: ComparisonResult) => {
    setIsStarting(true);
    setMessage(null);

    const userId = user?.id || 'demo-user-id';
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilizador';

    const rideData = {
      user_id: userId,
      user_name: userName,
      origem: origin?.address || 'Origem não informada',
      destino: destination?.address || 'Destino não informado',
      distancia: parseFloat(distance.toFixed(2)),
      preco: item.price,
      status: 'Em andamento' as const,
      payment_method: item.paymentMethods[0] || 'Dinheiro',
      origem_lat: origin?.lat,
      origem_lng: origin?.lng,
      destino_lat: destination?.lat,
      destino_lng: destination?.lng,
      app_name: item.name
    };

    try {
      const saved = await rideHistoryService.saveRide(rideData);
      setActiveSimRide(saved);
      // Trigger native/official mobile deep link redirection (with auto-fallback to Web if not installed)
      triggerDeepLink(item.appId, origin, destination);
    } catch (err) {
      console.error('Erro ao iniciar corrida simulada:', err);
      setMessage({ type: 'error', text: 'Não foi possível iniciar a viagem. Tenta novamente.' });
    } finally {
      setIsStarting(false);
    }
  };

  const handleFinishRide = async (status: 'Concluída' | 'Cancelada') => {
    if (!activeSimRide) return;
    setIsFinishing(true);
    setMessage(null);

    const userId = user?.id || '';

    try {
      await rideHistoryService.updateRideStatus(activeSimRide.id, status, userId);
      
      setMessage({ 
        type: 'success', 
        text: status === 'Concluída' ? 'Viagem finalizada com sucesso!' : 'Viagem cancelada.' 
      });

      setTimeout(() => {
        setActiveSimRide(null);
        navigate('/history');
      }, 1500);

    } catch (err) {
      console.error('Erro ao atualizar corrida:', err);
      setMessage({ type: 'error', text: 'Erro ao registar o fim da corrida.' });
    } finally {
      setIsFinishing(false);
    }
  };

  const [activeFilter, setActiveFilter] = useState<'all' | 'cheapest' | 'fastest' | 'rating'>('all');

  // Filter and sort results based on user selection
  const filteredResults = [...results].sort((a, b) => {
    if (activeFilter === 'cheapest') return a.price - b.price;
    if (activeFilter === 'fastest') return a.waitingTime - b.waitingTime;
    if (activeFilter === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Results Count */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-black font-display text-gray-900">
          Resultados encontrados
        </h3>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {results.length} táxis disponíveis
        </span>
      </div>

      {/* Filter Tabs requested by user */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'cheapest', label: '🏷️ Mais barato' },
          { id: 'fastest', label: '⚡ Mais rápido' },
          { id: 'rating', label: '⭐ Melhor avaliação' }
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id as any)}
            className={cn(
              "px-3.5 py-2 rounded-xl whitespace-nowrap transition-all select-none active:scale-95",
              activeFilter === f.id
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards List */}
      <div className="space-y-3.5">
        {filteredResults.map((item, index) => (
          <motion.div
            key={item.appId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={cn(
              "bg-white rounded-3xl p-5 border transition-all duration-200 shadow-sm relative overflow-hidden",
              item.isCheapest && activeFilter === 'all' && "border-emerald-500/40 ring-2 ring-emerald-500/10",
              item.isFastest && activeFilter === 'all' && "border-blue-500/40 ring-2 ring-blue-500/10",
              item.isBestRated && activeFilter === 'all' && "border-amber-500/40 ring-2 ring-amber-500/10",
              !item.isCheapest && !item.isFastest && !item.isBestRated && "border-gray-100 hover:border-gray-200"
            )}
          >
            {/* Badges Top Bar */}
            <div className="flex items-center justify-between gap-2 mb-3">
              {/* App logo + Name */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl border border-gray-100 bg-gray-50 p-1.5 flex items-center justify-center shrink-0">
                  <img 
                    src={item.logo} 
                    alt={item.name} 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-gray-900 leading-tight">{item.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-0.5">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {item.rating}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[11px] font-medium text-gray-500">{item.carType}</span>
                  </div>
                </div>
              </div>

              {/* Distinction pill badge */}
              <div>
                {item.isCheapest && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Mais Barato
                  </span>
                )}
                {item.isFastest && !item.isCheapest && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-wide">
                    <Zap size={10} className="fill-blue-500" />
                    Mais Rápido
                  </span>
                )}
                {item.isBestRated && !item.isCheapest && !item.isFastest && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wide">
                    <Award size={10} className="fill-amber-500" />
                    Top Avaliado
                  </span>
                )}
              </div>
            </div>

            {/* Price Highlight Section */}
            <div className="py-2.5 px-3 bg-gray-50/70 rounded-2xl mb-3 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black font-display text-gray-900 tracking-tight leading-none">
                  {item.price.toLocaleString('pt-AO')} <span className="text-xs font-bold text-gray-500">Kz</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                  Preço Estimado
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-700 justify-end">
                  <Clock size={13} className="text-primary" />
                  <span>~ {item.waitingTime} min</span>
                </div>
                <div className="text-[10px] font-medium text-gray-500 mt-0.5">
                  Chegada estimada
                </div>
              </div>
            </div>

            {/* Details row: Car & Payment */}
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1 mb-4">
              <span>{item.carType} • {item.paymentMethods.join(' / ')}</span>
              <span className="text-[11px] text-gray-400">Viagem: ~{item.travelTime} min</span>
            </div>

            {/* Main Action Button: [ Abrir app ] */}
            <button 
              type="button"
              onClick={() => handleStartSimulatedRide(item)}
              disabled={isStarting}
              className="w-full btn-primary py-3.5 rounded-2xl hover:scale-[1.01] active:scale-95 transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              {isStarting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Abrir app ({item.name})</span>
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Beautiful Simulated Ride Modal Overlay */}
      <AnimatePresence>
        {activeSimRide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden p-6 border border-gray-100 flex flex-col space-y-6"
            >
              {/* Spinning/pulsating header simulation */}
              <div className="flex flex-col items-center justify-center space-y-3 pt-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 bg-primary/15 rounded-full animate-ping absolute" />
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20 relative z-10">
                    <Compass size={32} className="animate-spin duration-1000" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Viagem ativa em curso
                  </div>
                  <h3 className="text-xl font-black font-display tracking-tight text-gray-900">
                    A viajar com {activeSimRide.app_name}
                  </h3>
                </div>
              </div>

              {/* Stats detail grid */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Origem</span>
                    <p className="font-bold text-gray-800 text-xs leading-normal">{activeSimRide.origem}</p>
                  </div>
                </div>
                <div className="h-4 border-l-2 border-dashed border-gray-200 ml-2" />
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Destino</span>
                    <p className="font-bold text-gray-800 text-xs leading-normal">{activeSimRide.destino}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <span className="block text-[8px] font-black uppercase text-gray-400">Distância</span>
                    <span className="text-xs font-black text-gray-900">{activeSimRide.distancia?.toFixed(1)} km</span>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <span className="block text-[8px] font-black uppercase text-gray-400">Preço</span>
                    <span className="text-xs font-black text-primary">{activeSimRide.preco?.toLocaleString('pt-AO')} Kz</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[8px] font-black uppercase text-gray-400">Pagamento</span>
                    <span className="text-[10px] font-black text-gray-700 truncate block">{activeSimRide.payment_method}</span>
                  </div>
                </div>
              </div>

              {/* Event messages */}
              {message && (
                <div className={cn(
                  "p-3 rounded-xl text-center text-xs font-bold leading-tight flex items-center justify-center gap-2",
                  message.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {message.type === 'error' && <ShieldAlert size={14} />}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Interactive simulated actions button list */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleFinishRide('Concluída')}
                  disabled={isFinishing}
                  className="w-full h-12 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/95 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isFinishing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>Terminar e Guardar Corrida</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleFinishRide('Cancelada')}
                  disabled={isFinishing}
                  className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center"
                >
                  Cancelar Viagem
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
