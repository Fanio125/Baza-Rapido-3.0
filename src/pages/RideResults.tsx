import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, ShieldCheck, Zap } from 'lucide-react';
import ComparisonList from '../components/ComparisonList';
import MapComponent from '../components/MapComponent';
import { ComparisonResult, Location as TLocation } from '../types';
import { rideService } from '../services/rideService';
import { logger } from '../utils/logger';

const RideResults: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [isComparing, setIsComparing] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  const origin = state?.origin as TLocation;
  const destination = state?.destination as TLocation;

  useEffect(() => {
    if (!origin || !destination) {
      logger.warn('RideResults accessed without origin or destination state');
      navigate('/');
      return;
    }
  }, [origin, destination, navigate]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 bg-gray-50 rounded-xl"
        >
          <ChevronLeft />
        </button>
        <div>
          <h2 className="text-xl font-bold font-display">Sua melhor opção</h2>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
            <MapPin size={10} className="text-primary" />
            <span className="truncate max-w-[200px]">{destination?.address}</span>
          </div>
        </div>
      </div>

      <MapComponent 
        origin={{ lat: origin.lat, lng: origin.lng }}
        destination={{ lat: destination.lat, lng: destination.lng }}
        onRouteCalculated={handleRouteCalculated}
      />

      {isComparing ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-4 text-center p-6 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-gray-100 border-t-primary rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap size={20} className="text-primary fill-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black font-display tracking-tight">Comparando preços...</h3>
            <p className="text-xs text-gray-500 max-w-[200px] mx-auto font-medium">
              Analisando Bolt, Yango, Uber e outros em <span className="text-gray-900 font-bold tracking-tight">TEMPO REAL</span>.
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

          <ComparisonList results={results} />
        </>
      )}
    </motion.div>
  );
};

export default RideResults;
