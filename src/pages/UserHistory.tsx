import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Navigation2, 
  DollarSign, 
  RefreshCw,
  Compass,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { rideHistoryService, RideHistory } from '../services/rideHistoryService';
import { cn } from '../lib/utils';

const UserHistory: React.FC = () => {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<RideHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (showRefresher = false) => {
    if (showRefresher) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const userId = user?.id || 'demo-user-id';

    try {
      const data = await rideHistoryService.getHistory(userId, isDemo);
      setHistory(data);
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err);
      setError('Não foi possível carregar as viagens. Tenta novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    // Listen for real-time history changes (fired when a ride is registered or edited)
    const handleHistoryUpdate = () => {
      fetchHistory(true);
    };

    window.addEventListener('ride-history-updated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('ride-history-updated', handleHistoryUpdate);
    };
  }, [user?.id, isDemo]);

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('pt-AO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  // Helper function to render specific status badges
  const renderStatusBadge = (status: RideHistory['status']) => {
    switch (status) {
      case 'Concluída':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100/50">
            <CheckCircle2 size={12} className="stroke-[3]" />
            Concluída
          </span>
        );
      case 'Cancelada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-100/50">
            <XCircle size={12} className="stroke-[3]" />
            Cancelada
          </span>
        );
      case 'Em andamento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-100/50 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping mr-0.5" />
            Em curso
          </span>
        );
      default:
        return null;
    }
  };

  const activeRides = history.filter(r => r.status === 'Em andamento');
  const pastRides = history.filter(r => r.status !== 'Em andamento');

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-gray-900">Histórico de Viagens</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tuas voltas guardadas</p>
          </div>
        </div>

        <button 
          onClick={() => fetchHistory(true)}
          disabled={loading || refreshing}
          className="p-2.5 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-sm font-bold text-gray-400">A carregar o teu histórico...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-3xl text-center space-y-4">
          <AlertCircle size={40} className="text-red-500 mx-auto" />
          <p className="text-sm text-red-600 font-bold">{error}</p>
          <button 
            onClick={() => fetchHistory()} 
            className="btn-primary py-2 px-6 text-xs font-black uppercase tracking-wider inline-flex w-auto bg-red-600 text-white"
          >
            Tentar Novamente
          </button>
        </div>
      ) : history.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center px-6 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100"
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md shadow-gray-100 border border-gray-50 text-4xl mb-4">
            🧭
          </div>
          <h3 className="text-lg font-bold font-display text-gray-800">Sem viagens recentes</h3>
          <p className="text-gray-400 text-xs font-medium max-w-xs mt-1">
            As tuas estimativas escolhidas e viagens finalizadas serão guardadas automaticamente aqui.
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-6 px-10 py-3.5 bg-primary hover:bg-primary/95 active:scale-95 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all"
          >
            Pedir Agora
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          
          {/* Active / Em curso section */}
          {activeRides.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">
                Viagens Ativas ({activeRides.length})
              </span>
              <AnimatePresence>
                {activeRides.map(ride => (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="premium-card p-5 border border-amber-200 bg-amber-50/20 relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-gray-900 font-display">{ride.app_name}</h4>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{formatDate(ride.created_at)}</span>
                      </div>
                      {renderStatusBadge(ride.status)}
                    </div>

                    <div className="space-y-3 text-xs mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-primary mt-0.5" />
                        <p className="font-bold text-gray-700">{ride.origem}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-emerald-500 mt-0.5" />
                        <p className="font-bold text-gray-700">{ride.destino}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex gap-4">
                        <div>
                          <span className="block text-[8px] font-black uppercase text-gray-400">Preço</span>
                          <span className="text-xs font-black text-primary">{ride.preco.toLocaleString('pt-AO')} Kz</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black uppercase text-gray-400">Volta</span>
                          <span className="text-xs font-black text-gray-700">{ride.distancia?.toFixed(1)} km</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1 text-[10px] text-amber-600 font-black uppercase tracking-widest hover:underline"
                      >
                        Gerir Viagem
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Past rides section */}
          {pastRides.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Histórico Anterior ({pastRides.length})
              </span>
              <div className="space-y-4">
                {pastRides.map((ride, index) => (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="premium-card p-5 hover:border-gray-200 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-extrabold text-gray-900 font-display group-hover:text-primary transition-colors">{ride.app_name}</h4>
                        <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                          <Calendar size={11} />
                          <span className="text-[10px] font-bold">{formatDate(ride.created_at)}</span>
                        </div>
                      </div>
                      {renderStatusBadge(ride.status)}
                    </div>

                    <div className="space-y-3 text-xs mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
                        <p className="font-bold text-gray-600 line-clamp-1">{ride.origem}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="font-bold text-gray-600 line-clamp-1">{ride.destino}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                      <div className="flex gap-4">
                        <div>
                          <span className="block text-[8px] font-black uppercase text-gray-400">Preço</span>
                          <span className="font-black text-gray-900">{ride.preco.toLocaleString('pt-AO')} Kz</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black uppercase text-gray-400">Distância</span>
                          <span className="font-black text-gray-700">{ride.distancia?.toFixed(1)} km</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black uppercase text-gray-400">Modo Pgto</span>
                          <span className="font-black text-gray-500">{ride.payment_method}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserHistory;
