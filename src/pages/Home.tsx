import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SearchSection from '../components/SearchSection';
import SavedLocationsSection from '../components/SavedLocationsSection';
import { useNavigate } from 'react-router-dom';
import { Location } from '../types';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDestinationAddr, setSelectedDestinationAddr] = useState("");

  const handleCompare = (start: Location, end: Location) => {
    // Navigate to results with state
    navigate('/rides', { state: { origin: start, destination: end } });
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
          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest mb-4">
            <Zap size={14} className="fill-primary" />
            Economia Inteligente
          </div>
          <SearchSection 
            onCompare={handleCompare} 
            initialDestination={selectedDestinationAddr}
          />
        </div>
      </div>

      <SavedLocationsSection 
        user={user} 
        onSelect={(addr) => setSelectedDestinationAddr(addr)} 
        onLoginRedirect={() => navigate('/profile')}
      />
    </motion.div>
  );
};

export default Home;
