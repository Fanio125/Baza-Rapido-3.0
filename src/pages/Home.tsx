import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Zap, TrendingUp, ArrowRight, MapPin, Sparkles, History, Building2, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SearchSection from '../components/SearchSection';
import SavedLocationsSection from '../components/SavedLocationsSection';
import { useNavigate } from 'react-router-dom';
import { Location, SavedLocation } from '../types';
import { rideHistoryService } from '../services/rideHistoryService';
import { adService, Ad } from '../services/adService';

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
  const [featuredAds, setFeaturedAds] = useState<Ad[]>([]);

  useEffect(() => {
    setFeaturedAds(adService.getActiveApprovedAds().slice(0, 3));
    
    const handleUpdate = () => {
      setFeaturedAds(adService.getActiveApprovedAds().slice(0, 3));
    };
    window.addEventListener('ads-updated', handleUpdate);
    return () => window.removeEventListener('ads-updated', handleUpdate);
  }, []);

  const loadFrequentRoutes = async () => {
    setRoutesLoading(true);
    try {
      const userId = user?.id || 'demo-user-id';
      // 1. Get ride history
      let rides: any[] = [];
      try {
        rides = await rideHistoryService.getHistory(userId, isDemo);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-display tracking-tight text-gray-900">
            Olá, <span className="text-primary underline decoration-primary/20">
              {user ? (user.user_metadata?.full_name || user.email?.split('@')[0]) : 'Viajante'}
            </span>! 👋
          </h1>
          <p className="text-gray-500 font-medium">Para onde vamos hoje?</p>
        </div>
        <button 
          onClick={() => navigate('/rides')}
          className="relative p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Bell size={24} className="text-gray-700" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full" />
        </button>
      </div>

      <div className="premium-card p-6 border-none shadow-xl shadow-gray-200/50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50 overflow-hidden relative">
        <div className="relative z-10">
          <SearchSection 
            onCompare={handleCompare} 
            initialDestination={selectedDestinationAddr}
            initialOrigin={selectedOriginAddr}
          />
        </div>
      </div>

      {/* Recommended/Frequent Routes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            <h3 className="font-bold font-display text-gray-900 tracking-tight">Rotas Frequentes</h3>
          </div>
          <span className="text-[10px] font-black text-gray-400 bg-gray-50 uppercase tracking-widest px-2.5 py-1 rounded-lg border border-gray-100/50">
            Sugeridas para si
          </span>
        </div>

        {routesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2].map((n) => (
              <div key={n} className="p-4 bg-gray-50/50 rounded-2xl animate-pulse space-y-2 border border-gray-100">
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {frequentRoutes.map((route, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectFrequentRoute(route)}
                className="group p-4 bg-white hover:bg-orange-50/10 border border-gray-100/80 hover:border-primary/20 rounded-3xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:shadow-primary/5 relative overflow-hidden"
              >
                {/* Visual connector line in backgrounds */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 to-primary/5 group-hover:from-primary/70 transition-all" />

                <div className="flex-1 min-w-0 pl-1">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-medium leading-none mb-1 text-left">
                    <History size={11} className="text-gray-400" />
                    <span className="truncate">De: {route.origem === 'Minha localização atual' ? 'Localização Atual' : route.origem}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-left">
                    <MapPin size={12} className="text-primary fill-primary/10 shrink-0" />
                    <span className="font-extrabold font-display text-gray-900 text-sm truncate">{route.destino}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-tight group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                    {route.isPreset ? (
                      <>
                        <Sparkles size={8} className="text-primary fill-primary/10" />
                        Popular
                      </>
                    ) : (
                      `${route.count}× busca`
                    )}
                  </span>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Premium & Sponsored Ads Section */}
      {featuredAds.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-primary" />
              <h3 className="font-bold font-display text-gray-900 tracking-tight">Destaques e Serviços</h3>
            </div>
            <button 
              onClick={() => navigate('/ads')}
              className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
            {featuredAds.map((ad) => (
              <div
                key={ad.id}
                onClick={() => navigate('/ads')}
                className={`flex-none w-72 p-4 rounded-3xl border bg-white cursor-pointer hover:border-primary/20 transition-all shadow-xs relative overflow-hidden space-y-3 ${
                  ad.type === 'Premium' ? 'ring-1 ring-amber-400/20 border-amber-200' : 'border-gray-100'
                }`}
              >
                {/* Image */}
                <div className="w-full h-32 rounded-2xl overflow-hidden bg-gray-50 relative">
                  <img 
                    src={ad.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'} 
                    alt={ad.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                    ad.type === 'Premium' ? 'bg-amber-500 text-white' : 'bg-primary text-white'
                  }`}>
                    {ad.type}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span className="truncate">{ad.category}</span>
                    <span>•</span>
                    <span className="truncate">{ad.city}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1">{ad.title}</h4>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-500 font-bold truncate max-w-[150px]">{ad.company_name || ad.advertiser}</span>
                    {ad.price && ad.price > 0 ? (
                      <span className="text-xs font-black text-primary">{ad.price.toLocaleString('pt-AO')} Kz</span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400">Consultar</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SavedLocationsSection 
        user={user} 
        onSelect={handleSelectSavedLocation} 
        onLoginRedirect={() => navigate('/profile')}
      />
    </motion.div>
  );
};

export default Home;
