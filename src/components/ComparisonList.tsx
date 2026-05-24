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
      const saved = await rideHistoryService.saveRide(rideData, isDemo);
      setActiveSimRide(saved);
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

    const userId = user?.id || 'demo-user-id';

    try {
      await rideHistoryService.updateRideStatus(activeSimRide.id, status, userId, isDemo);
      
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

          <button 
            type="button"
            onClick={() => handleStartSimulatedRide(item)}
            disabled={isStarting}
            className="w-full btn-primary py-3 hover:scale-[1.01] active:scale-95 transition-all text-sm font-bold flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Abrir {item.name}</span>
                <ArrowUpRight size={18} />
              </>
            )}
          </button>
        </motion.div>
      ))}

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
