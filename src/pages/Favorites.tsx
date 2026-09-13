import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Plus, 
  Home as HomeIcon, 
  Briefcase, 
  GraduationCap, 
  Star, 
  MapPin, 
  Navigation, 
  Pencil, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { locationService } from '../services/locationService';
import type { SavedLocation, SavedLocationType, Location } from '../types';
import AddLocationModal from '../components/AddLocationModal';

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<SavedLocation | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<SavedLocation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchLocations = async () => {
    if (!user?.id) {
      setLocations([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await locationService.getSavedLocations(user.id);
      setLocations(data);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [user?.id]);

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
      console.error('Erro ao adicionar local favorito:', error);
      throw error;
    }
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
      console.error('Erro ao editar local favorito:', error);
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    setIsDeleting(true);
    try {
      await locationService.deleteSavedLocation(locationToDelete.id);
      setLocations(locations.filter(l => l.id !== locationToDelete.id));
      setLocationToDelete(null);
    } catch (error) {
      console.error('Erro ao eliminar local favorito:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGoToLocation = (savedLoc: SavedLocation) => {
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
        navigate('/rides', { state: { origin: start, destination: end } });
      },
      () => {
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
        navigate('/rides', { state: { origin: start, destination: end } });
      }
    );
  };

  const getTypeIcon = (type: SavedLocationType) => {
    switch (type) {
      case 'home': return <HomeIcon size={18} className="text-blue-500" />;
      case 'work': return <Briefcase size={18} className="text-amber-500" />;
      case 'school': return <GraduationCap size={18} className="text-emerald-500" />;
      default: return <Star size={18} className="text-purple-500" />;
    }
  };

  const getTypeLabel = (type: SavedLocationType) => {
    switch (type) {
      case 'home': return 'Casa';
      case 'work': return 'Trabalho';
      case 'school': return 'Escola / Faculdade';
      default: return 'Outro';
    }
  };

  const filteredLocations = filterType === 'all' 
    ? locations 
    : locations.filter(l => l.type === filterType);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black font-display tracking-tight text-gray-900">
              Favoritos
            </h2>
            <Heart size={20} className="text-primary fill-primary" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Guarde e aceda aos seus destinos habituais</p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              navigate('/profile');
              return;
            }
            setLocationToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'home', label: '🏠 Casa' },
          { id: 'work', label: '💼 Trabalho' },
          { id: 'school', label: '🎓 Escola' },
          { id: 'other', label: '📍 Outros' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
          <Loader2 className="animate-spin text-primary" size={28} />
          <p className="text-xs font-medium">A carregar os seus locais favoritos...</p>
        </div>
      ) : !user ? (
        <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Heart size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800">Inicie sessão para guardar favoritos</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Guarde os seus destinos mais frequentes como Casa, Trabalho e Escola para comparar preços com apenas 1 toque.
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="btn-primary py-3 px-6 text-xs font-bold uppercase tracking-wider mx-auto"
          >
            Entrar / Registar
          </button>
        </div>
      ) : filteredLocations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 text-center bg-gray-50/70 rounded-3xl border border-dashed border-gray-200 space-y-4"
        >
          <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
            ❤️
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800">
              Guarde os seus locais favoritos para encontrar rapidamente.
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              {filterType === 'all' 
                ? 'Adicione a sua Casa, Trabalho ou outros pontos para pedir táxi com máxima rapidez.' 
                : 'Não há nenhum local salvo nesta categoria.'}
            </p>
          </div>
          <button
            onClick={() => {
              setLocationToEdit(null);
              setIsModalOpen(true);
            }}
            className="btn-primary py-3 px-6 text-xs font-bold uppercase tracking-wider mx-auto inline-flex"
          >
            <Plus size={16} />
            <span>Adicionar local</span>
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredLocations.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleGoToLocation(item)}
              className="premium-card p-4 hover:border-primary/20 transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-gray-400 px-2 py-0.5 bg-gray-50 rounded-md">
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                    {item.address}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocationToEdit(item);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocationToDelete(item);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                  <div 
                    onClick={() => handleGoToLocation(item)}
                    className="p-2 text-primary bg-primary/5 group-hover:bg-primary group-hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Comparar preços para aqui"
                  >
                    <Navigation size={15} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Add Modal */}
      <AddLocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setLocationToEdit(null);
        }}
        onAdd={handleAddLocation}
        onEdit={handleEditLocation}
        locationToEdit={locationToEdit}
        onLoginRedirect={() => navigate('/profile')}
        user={user}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {locationToDelete && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLocationToDelete(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Remover local dos favoritos?</h3>
                  <p className="text-xs text-gray-500">"{locationToDelete.name}" deixará de estar guardado.</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setLocationToDelete(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isDeleting && <Loader2 size={14} className="animate-spin" />}
                  <span>Remover</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
