import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Zap, TrendingUp, ArrowRight, MapPin, History, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SearchSection from '../components/SearchSection';
import SavedLocationsSection from '../components/SavedLocationsSection';
import { useNavigate } from 'react-router-dom';
import { Location, SavedLocation } from '../types';
import { rideHistoryService } from '../services/rideHistoryService';

interface SearchRoute {
  origem: string;
  destino: string;
  origem_lat: number;
  origem_lng: number;
  destino_lat: number;
  destino_lng: number;
  timestamp: string;
}

interface GroupedRoute {
  origem: string;
  destino: string;
  origem_lat: number;
  origem_lng: number;
  destino_lat: number;
  destino_lng: number;
  count: number;
  isPreset?: boolean;
}

const Home: React.FC = () => {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [selectedDestinationAddr, setSelectedDestinationAddr] = useState("");
  const [selectedOriginAddr, setSelectedOriginAddr] = useState("");
  const [frequentRoutes, setFrequentRoutes] = useState<GroupedRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  const loadFrequentRoutes = async () => {
    setRoutesLoading(true);
    try {
      const userId = user?.id || '';
      // 1. Get ride history
      let rides: any[] = [];
      try {
        rides = await rideHistoryService.getHistory(userId);
      } catch (err) {
        console.warn('Não foi possível carregar os dados de viagens:', err);
      }

      // 2. Get local search history
      let searches: SearchRoute[] = [];
      try {
        const searchesRaw = localStorage.getItem('vambora_search_history');
        searches = searchesRaw ? JSON.parse(searchesRaw) : [];
      } catch (err) {
        console.warn('Não foi possível carregar o histórico de pesquisa local:', err);
      }

      // 3. Aggregate route paths
      const routeCounts: { [key: string]: GroupedRoute } = {};

      const addRouteToAggr = (item: any) => {
        const o = item.origem || item.origin;
        const d = item.destino || item.destination;
        if (!o || !d) return;

        const k = `${o.trim().toLowerCase()} ➜ ${d.trim().toLowerCase()}`;
        if (!routeCounts[k]) {
          routeCounts[k] = {
            origem: o,
            destino: d,
            origem_lat: item.origem_lat || item.latitude || -8.8390,
            origem_lng: item.origem_lng || item.longitude || 13.2345,
            destino_lat: item.destino_lat || item.latitude || -8.8390,
            destino_lng: item.destino_lng || item.longitude || 13.2345,
            count: 0
          };
        }
        routeCounts[k].count += 1;
      };

      rides.forEach(addRouteToAggr);
      searches.forEach(addRouteToAggr);

      const aggregated = Object.values(routeCounts).sort((a, b) => b.count - a.count);

      // 4. Fallback items / popular preset routes in Luanda if there are fewer than 4 frequent ones
      const popularPresets: GroupedRoute[] = [
        {
          origem: "Minha localização atual",
          destino: "Aeroporto Internacional Quatro de Fevereiro, Luanda",
          origem_lat: -8.8390,
          origem_lng: 13.2345,
          destino_lat: -8.8504,
          destino_lng: 13.2312,
          count: 1,
          isPreset: true
        },
        {
          origem: "Minha localização atual",
          destino: "Talatona, Luanda",
          origem_lat: -8.8390,
          origem_lng: 13.2345,
          destino_lat: -8.9242,
          destino_lng: 13.1906,
          count: 1,
          isPreset: true
        },
        {
          origem: "Largo da Mutamba, Luanda",
          destino: "Centralidade do Kilamba, Luanda",
          origem_lat: -8.8152,
          origem_lng: 13.2275,
          destino_lat: -9.0064,
          destino_lng: 13.2758,
          count: 1,
          isPreset: true
        },
        {
          origem: "Minha localização atual",
          destino: "Marginal de Luanda, Luanda",
          origem_lat: -8.8390,
          origem_lng: 13.2345,
          destino_lat: -8.8078,
          destino_lng: 13.2241,
          count: 1,
          isPreset: true
        }
      ];

      const merged = [...aggregated];
      if (merged.length < 2) {
        const existingKeys = new Set(merged.map(r => `${r.origem.toLowerCase()}->${r.destino.toLowerCase()}`));
        for (const preset of popularPresets) {
          const pk = `${preset.origem.toLowerCase()}->${preset.destino.toLowerCase()}`;
          if (!existingKeys.has(pk)) {
            merged.push(preset);
            existingKeys.add(pk);
          }
          if (merged.length >= 2) break;
        }
      }

      setFrequentRoutes(merged.slice(0, 2));
    } catch (err) {
      console.warn('Erro ao processar rotas frequentes:', err);
    } finally {
      setRoutesLoading(false);
    }
  };

  useEffect(() => {
    loadFrequentRoutes();

    const handleHistoryUpdate = () => {
      loadFrequentRoutes();
    };

    window.addEventListener('ride-history-updated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('ride-history-updated', handleHistoryUpdate);
    };
  }, [user?.id, isDemo]);

  const handleCompare = (start: Location, end: Location) => {
    // Save to local search history
    try {
      const historyRaw = localStorage.getItem('vambora_search_history');
      const history: SearchRoute[] = historyRaw ? JSON.parse(historyRaw) : [];
      
      const newRoute: SearchRoute = {
        origem: start.address,
        destino: end.address,
        origem_lat: start.lat,
        origem_lng: start.lng,
        destino_lat: end.lat,
        destino_lng: end.lng,
        timestamp: new Date().toISOString()
      };
      
      const filtered = history.filter(h => 
        !(h.origem.toLowerCase() === newRoute.origem.toLowerCase() && h.destino.toLowerCase() === newRoute.destino.toLowerCase())
      );
      
      const updated = [newRoute, ...filtered].slice(0, 40);
      localStorage.setItem('vambora_search_history', JSON.stringify(updated));
      
      // Trigger update of frequent routes list instantly
      setTimeout(() => {
        loadFrequentRoutes();
      }, 50);
    } catch (e) {
      console.warn('Erro ao guardar histórico de pesquisa local:', e);
    }

    if (!user) {
      // Redirect to login page if user is not authenticated
      navigate('/profile', { state: { from: '/', origin: start, destination: end } });
      return;
    }
    // Navigate to results with state
    navigate('/rides', { state: { origin: start, destination: end } });
  };

  const handleSelectFrequentRoute = (route: GroupedRoute) => {
    if (route.origem === 'Minha localização atual') {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const start: Location = {
            address: "Minha localização atual",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          const end: Location = {
            address: route.destino,
            lat: route.destino_lat,
            lng: route.destino_lng
          };
          handleCompare(start, end);
        },
        (err) => {
          console.warn("Geolocation fallback for frequent route:", err);
          const start: Location = {
            address: route.origem,
            lat: route.origem_lat,
            lng: route.origem_lng
          };
          const end: Location = {
            address: route.destino,
            lat: route.destino_lat,
            lng: route.destino_lng
          };
          handleCompare(start, end);
        }
      );
    } else {
      const start: Location = {
        address: route.origem,
        lat: route.origem_lat,
        lng: route.origem_lng
      };
      const end: Location = {
        address: route.destino,
        lat: route.destino_lat,
        lng: route.destino_lng
      };
      handleCompare(start, end);
    }
  };

  const handleSelectSavedLocation = (savedLoc: SavedLocation) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const start: Location = {
          address: "Minha localização atual",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        const end: Location = {
          address: savedLoc.address,
          lat: savedLoc.latitude,
          lng: savedLoc.longitude
        };
        handleCompare(start, end);
      },
      (err) => {
        console.warn("Geolocation fallback for saved location comparison:", err);
        const start: Location = {
          address: "Minha localização atual",
          lat: -8.8390,
          lng: 13.2345
        };
        const end: Location = {
          address: savedLoc.address,
          lat: savedLoc.latitude,
          lng: savedLoc.longitude
        };
        handleCompare(start, end);
      }
    );
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Greeting & Slogan */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black font-display tracking-tight text-gray-900">
          Olá, <span className="text-primary">
            {user 
              ? ((user.user_metadata?.full_name?.trim().split(/\s+/)[0]) || user.email?.split('@')[0]) 
              : 'Viajante'}
          </span> 👋
        </h1>
        <p className="text-lg font-bold text-gray-800 font-display">Para onde vamos?</p>
        <p className="text-xs text-gray-400 font-medium">
          "Não escolha só o mais barato. Escolha o melhor."
        </p>
      </div>

      {/* Main Search Card */}
      <div className="premium-card p-5 border border-gray-100 shadow-xl shadow-gray-200/40 bg-white overflow-hidden relative rounded-3xl">
        <div className="relative z-10">
          <SearchSection 
            onCompare={handleCompare} 
            initialDestination={selectedDestinationAddr}
            initialOrigin={selectedOriginAddr}
          />
        </div>
      </div>

      {/* Recommended/Frequent Routes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="font-bold font-display text-gray-900 text-sm tracking-tight">Rotas Frequentes</h3>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 uppercase tracking-widest px-2 py-0.5 rounded-lg border border-gray-100">
            Sugeridas
          </span>
        </div>

        {routesLoading ? (
          <div className="grid grid-cols-1 gap-2.5">
            {[1, 2].map((n) => (
              <div key={n} className="p-3.5 bg-gray-50/50 rounded-2xl animate-pulse space-y-2 border border-gray-100">
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {frequentRoutes.map((route, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectFrequentRoute(route)}
                className="group p-3.5 bg-white hover:bg-orange-50/20 border border-gray-100 hover:border-primary/25 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs relative overflow-hidden"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-gray-400 text-[10px] font-medium leading-none mb-1 truncate">
                    <History size={10} className="shrink-0" />
                    <span className="truncate">De: {route.origem === 'Minha localização atual' ? 'Localização Atual' : route.origem}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-primary shrink-0" />
                    <span className="font-bold font-display text-gray-900 text-sm truncate">{route.destino}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 bg-gray-50 group-hover:bg-primary/10 rounded-lg text-[10px] font-bold text-gray-500 group-hover:text-primary transition-colors">
                    Repetir
                  </span>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-primary transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <SavedLocationsSection 
        user={user} 
        onSelect={handleSelectSavedLocation} 
        onLoginRedirect={() => navigate('/profile')}
      />
    </div>
  );
};

export default Home;
