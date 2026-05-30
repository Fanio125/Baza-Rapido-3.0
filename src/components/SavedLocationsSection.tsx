import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Home, Briefcase, GraduationCap, Star, ArrowUpRight, Loader2, Trash2, X, AlertTriangle, Pencil } from 'lucide-react';
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
  const [locationToDelete, setLocationToDelete] = useState<SavedLocation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<SavedLocation | null>(null);

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

  const handleEditClick = (e: React.MouseEvent, item: SavedLocation) => {
    e.stopPropagation();
    setLocationToEdit(item);
    setIsModalOpen(true);
  };

  const handleEditLocation = async (id: string, name: string, address: string, type: SavedLocationType, lat?: number, lng?: number) => {
    try {
      await locationService.updateSavedLocation(id, {
        name,
        address,
        latitude: lat || -8.8390,
        longitude: lng || 13.2345,
        type
      });
      await fetchLocations();
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, item: SavedLocation) => {
    e.stopPropagation();
    setLocationToDelete(item);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    setIsDeleting(true);
    try {
      await locationService.deleteSavedLocation(locationToDelete.id);
      setLocations(locations.filter(l => l.id !== locationToDelete.id));
      setLocationToDelete(null);
    } catch (error) {
      console.error('Error deleting location:', error);
    } finally {
      setIsDeleting(false);
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
                <div className="flex items-center gap-1 sm:gap-2">
                  <button 
                    type="button"
                    onClick={(e) => handleEditClick(e, item)}
                    className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl transition-all cursor-pointer"
                    title="Editar local"
                  >
                    <Pencil size={15} />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleDeleteClick(e, item)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                    title="Eliminar definitivamente"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ArrowUpRight size={16} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AddLocationModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setLocationToEdit(null);
        }}
        onAdd={handleAddLocation}
        onEdit={handleEditLocation}
        locationToEdit={locationToEdit}
        onLoginRedirect={onLoginRedirect}
        user={user}
      />

      {/* Confirmation Modal for Definite Deletion */}
      <AnimatePresence>
        {locationToDelete && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLocationToDelete(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1a1a1c] border border-gray-100 dark:border-[#262629] rounded-[32px] shadow-2xl overflow-hidden z-10"
            >
              <div className="p-8">
                {/* Header Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-3xl flex items-center justify-center text-red-500 dark:text-red-400 animate-pulse">
                    <AlertTriangle size={40} />
                  </div>
                </div>

                {/* Text Info */}
                <div className="text-center space-y-3 mb-8">
                  <h3 className="text-xl font-black font-display tracking-tight text-gray-900 dark:text-white">
                    Eliminar local definitivamente?
                  </h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                    Tens a certeza de que desejas eliminar permanentemente o local <span className="font-extrabold text-gray-800 dark:text-gray-250 capitalize">"{locationToDelete.name}"</span>? Esta ação não pode ser desfeita.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="w-full h-14 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-250 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Trash2 size={20} />
                    )}
                    {isDeleting ? 'Eliminando...' : 'Eliminar Local'}
                  </button>
                  
                  <button
                    onClick={() => setLocationToDelete(null)}
                    disabled={isDeleting}
                    className="w-full h-14 bg-gray-50 dark:bg-[#262629] text-gray-500 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-[#2e2e32] active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* Close Button Top Right */}
              <button
                onClick={() => setLocationToDelete(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
