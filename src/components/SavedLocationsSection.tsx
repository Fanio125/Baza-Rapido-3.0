import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Home, Briefcase, GraduationCap, Star, ArrowUpRight, Loader2, Trash2 } from 'lucide-react';
import { locationService } from '../services/locationService';
import type { SavedLocation, SavedLocationType } from '../types';
import AddLocationModal from './AddLocationModal';

interface SavedLocationsSectionProps {
  onSelect: (address: string) => void;
  user: any;
  onLoginRedirect: () => void;
}

export default function SavedLocationsSection({ onSelect, user, onLoginRedirect }: SavedLocationsSectionProps) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchLocations();
    } else {
      setLocations([]);
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchLocations = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await locationService.getSavedLocations(user.id);
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocation = async (name: string, address: string, type: SavedLocationType, lat?: number, lng?: number) => {
    try {
      await locationService.addSavedLocation({
        name,
        address,
        latitude: lat || -8.8390,
        longitude: lng || 13.2345,
        type
      });
      await fetchLocations();
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await locationService.deleteSavedLocation(id);
      setLocations(locations.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const getTypeIcon = (type: SavedLocationType) => {
    switch (type) {
      case 'home': return <Home size={20} className="text-blue-500" />;
      case 'work': return <Briefcase size={20} className="text-amber-500" />;
      case 'school': return <GraduationCap size={20} className="text-emerald-500" />;
      default: return <Star size={20} className="text-purple-500" />;
    }
  };

  const getTypeEmoji = (type: SavedLocationType) => {
    switch (type) {
      case 'home': return '🏠';
      case 'work': return '💼';
      case 'school': return '🎓';
      default: return '📍';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold font-display text-gray-900 tracking-tight">Locais Guardados</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <Plus size={12} />
          Adicionar
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Loader2 className="animate-spin mb-2" size={24} />
          <p className="text-xs font-medium">A carregar os teus locais...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {locations.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">Ainda não tens locais guardados.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold text-primary mt-2"
              >
                Adicionar primeiro local
              </button>
            </div>
          ) : (
            locations.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSelect(item.address)}
                className="flex items-center gap-4 p-4 premium-card border-none hover:bg-gray-50 text-left group transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl group-hover:bg-white group-hover:rotate-6 transition-all duration-300">
                  {getTypeEmoji(item.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 capitalize">{item.name}</h4>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-[200px]">{item.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ArrowUpRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AddLocationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddLocation}
        onLoginRedirect={onLoginRedirect}
        user={user}
      />
    </div>
  );
}
