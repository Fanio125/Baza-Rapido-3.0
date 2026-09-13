import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, ShieldCheck, Zap } from 'lucide-react';
import ComparisonList from '../components/ComparisonList';
import MapComponent from '../components/MapComponent';
import { ComparisonResult, Location as TLocation } from '../types';
import { rideService } from '../services/rideService';
import { logger } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

const RideResults: React.FC = () => {
  const { user } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [isComparing, setIsComparing] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  const origin = state?.origin as TLocation;
  const destination = state?.destination as TLocation;

  useEffect(() => {
    if (!user) {
      navigate('/profile');
      return;
    }
    if (!origin || !destination) {
      logger.warn('RideResults accessed without origin or destination state');
      navigate('/');
      return;
    }
  }, [origin, destination, navigate, user]);

  if (!origin || !destination) {
    return null;
  }

  const handleRouteCalculated = async (distance: number, duration: number) => {
    setRouteInfo({ distance, duration });
    try {
      setIsComparing(true);
      // Pass the real distance to the estimate service
      const data = await rideService.getEstimates(origin, destination, distance);
      setResults(data);
    } catch (err) {
      logger.error('Failed to fetch ride estimates', err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/')}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-2xl shrink-0"
          title="Voltar"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black font-display text-gray-900 leading-tight">Melhores opções</h2>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold truncate mt-0.5">
            <MapPin size={11} className="text-primary shrink-0" />
            <span className="truncate">{destination?.address}</span>
          </div>
        </div>
      </div>

      <MapComponent 
        origin={{ lat: origin.lat, lng: origin.lng }}
        destination={{ lat: destination.lat, lng: destination.lng }}
        onRouteCalculated={handleRouteCalculated}
      />

      {isComparing ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-4 text-center p-6 bg-gray-50/70 rounded-3xl border border-gray-100">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-14 h-14 border-3 border-gray-100 border-t-primary rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap size={18} className="text-primary fill-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold font-display tracking-tight text-gray-900">
              Estamos a comparar os melhores preços em Luanda...
            </h3>
            <p className="text-xs text-gray-400 max-w-[240px] mx-auto font-medium">
              Consultando Yango, Bolt, Heetch, inDrive, Uber, Anda e outros serviços em tempo real.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-emerald-800 text-xs font-bold leading-tight">
                Economia garantida! Encontramos uma opção <span className="underline">mais barata</span> que a média do mercado.
              </p>
              {routeInfo && (
                <p className="text-emerald-600 text-[10px] font-medium mt-1">
                  Viagem de {routeInfo.distance.toFixed(1)}km • Aprox. {Math.round(routeInfo.duration)} mins
                </p>
              )}
            </div>
          </div>

          <ComparisonList results={results} origin={origin} destination={destination} distance={routeInfo?.distance} />
        </>
      )}
    </div>
  );
};

export default RideResults;
