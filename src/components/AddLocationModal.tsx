import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Tag, Check, Loader2, Home, Briefcase, GraduationCap, Star, Search, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { SavedLocationType } from '../types';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, address: string, type: SavedLocationType, lat?: number, lng?: number) => Promise<void>;
  onLoginRedirect: () => void;
  user: any;
  locationToEdit?: any;
  onEdit?: (id: string, name: string, address: string, type: SavedLocationType, lat?: number, lng?: number) => Promise<void>;
}

const POPULAR_LUANDA_PLACES = [
  { description: "Aeroporto Internacional Quatro de Fevereiro, Luanda", main_text: "Aeroporto Quatro de Fevereiro", secondary_text: "Luanda, Angola", lat: -8.8504, lng: 13.2312 },
  { description: "Marginal de Luanda, Luanda", main_text: "Marginal de Luanda", secondary_text: "Luanda, Angola", lat: -8.8078, lng: 13.2241 },
  { description: "Talatona, Luanda", main_text: "Talatona", secondary_text: "Luanda, Angola", lat: -8.9242, lng: 13.1906 },
  { description: "Centralidade do Kilamba, Luanda", main_text: "Centralidade do Kilamba", secondary_text: "Luanda, Angola", lat: -9.0064, lng: 13.2758 },
  { description: "Mutamba, Luanda", main_text: "Largo da Mutamba", secondary_text: "Luanda, Angola", lat: -8.8152, lng: 13.2275 },
  { description: "Maianga, Luanda", main_text: "Maianga", secondary_text: "Luanda, Angola", lat: -8.8315, lng: 13.2305 },
  { description: "Alvalade, Luanda", main_text: "Alvalade", secondary_text: "Luanda, Angola", lat: -8.8378, lng: 13.2431 },
  { description: "Viana, Luanda", main_text: "Viana", secondary_text: "Luanda, Angola", lat: -8.9038, lng: 13.3664 },
  { description: "Samba, Luanda", main_text: "Samba", secondary_text: "Luanda, Angola", lat: -8.8569, lng: 13.2132 },
  { description: "Cacuaco, Luanda", main_text: "Cacuaco", secondary_text: "Luanda, Angola", lat: -8.7831, lng: 13.3667 }
];

function getFallbackCoordinates(text: string): { lat: number, lng: number } {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = (Math.abs(hash) % 100) / 1000 - 0.05;
  const lngOffset = (Math.abs(hash >> 5) % 100) / 1000 - 0.05;
  return {
    lat: -8.8390 + latOffset,
    lng: 13.2345 + lngOffset
  };
}

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  coords?: google.maps.LatLngLiteral;
}

export default function AddLocationModal({ isOpen, onClose, onAdd, onLoginRedirect, user, locationToEdit, onEdit }: AddLocationModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [type, setType] = useState<SavedLocationType>('other');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [hasMapsError, setHasMapsError] = useState(false);

  useEffect(() => {
    if (locationToEdit) {
      setName(locationToEdit.name);
      setAddress(locationToEdit.address);
      setType(locationToEdit.type);
      setSelectedCoords({ lat: locationToEdit.latitude, lng: locationToEdit.longitude });
    } else {
      setName('');
      setAddress('');
      setType('other');
      setSelectedCoords(null);
    }
    setStatus(null);
  }, [locationToEdit, isOpen]);

  const placesLib = useMapsLibrary('places');
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleAuthFailure = () => {
      setHasMapsError(true);
    };
    window.addEventListener('google-maps-auth-failure', handleAuthFailure);
    if ((window as any).gm_authFailed) {
      setHasMapsError(true);
    }

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      const msg = args.map(arg => typeof arg === 'string' ? arg : (arg?.message || '')).join(' ');
      if (msg.includes('LegacyApiNotActivatedMapError') || msg.includes('billing') || msg.includes('REQUEST_DENIED')) {
        setHasMapsError(true);
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const msg = args.map(arg => typeof arg === 'string' ? arg : (arg?.message || '')).join(' ');
      if (msg.includes('LegacyApiNotActivatedMapError') || msg.includes('billing') || msg.includes('REQUEST_DENIED')) {
        setHasMapsError(true);
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      window.removeEventListener('google-maps-auth-failure', handleAuthFailure);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  useEffect(() => {
    if (placesLib) {
      try {
        autocompleteService.current = new placesLib.AutocompleteService();
        const dummy = document.createElement('div');
        placesService.current = new placesLib.PlacesService(dummy);
      } catch (err) {
        console.warn("Falha ao inicializar serviços adicionais do Places no modal:", err);
      }
    }
  }, [placesLib]);

  const getMockPredictions = (q: string): PlaceSuggestion[] => {
    const lowerQuery = q.toLowerCase();
    const filtered = POPULAR_LUANDA_PLACES.filter(p => 
      p.main_text.toLowerCase().includes(lowerQuery) || 
      p.description.toLowerCase().includes(lowerQuery)
    );
    return filtered.map(p => ({
      placeId: `mock-${p.main_text.toLowerCase().replace(/\s+/g, '-')}`,
      description: p.description,
      mainText: p.main_text,
      secondaryText: p.secondary_text,
      coords: { lat: p.lat, lng: p.lng }
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    setSelectedCoords(null);
    setStatus(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        setIsSearching(true);

        // 1. Tenta usar o novo Places API (New) que funciona perfeitamente com a chave
        if (placesLib && placesLib.Place) {
          try {
            const response = await placesLib.Place.searchByText({
              textQuery: value,
              fields: ['id', 'displayName', 'location', 'formattedAddress'],
              locationBias: { lat: -8.8390, lng: 13.2345 },
              maxResultCount: 8,
            });

            if (response?.places && response.places.length > 0) {
              const results: PlaceSuggestion[] = response.places.map((p: any) => {
                const lat = typeof p.location?.lat === 'function' ? p.location.lat() : p.location?.lat;
                const lng = typeof p.location?.lng === 'function' ? p.location.lng() : p.location?.lng;
                return {
                  placeId: p.id,
                  description: p.formattedAddress || p.displayName || '',
                  mainText: p.displayName || '',
                  secondaryText: p.formattedAddress || '',
                  coords: (lat && lng) ? { lat, lng } : undefined
                };
              });

              setSuggestions(results);
              setShowSuggestions(true);
              setIsSearching(false);
              return;
            }
          } catch (err) {
            console.warn("Places searchByText falhou no modal, tentando Autocomplete tradicional...", err);
          }
        }

        // 2. Fallback Secundário: Autocomplete tradicional
        if (autocompleteService.current && !hasMapsError) {
          try {
            autocompleteService.current.getPlacePredictions({
              input: value,
              componentRestrictions: { country: 'ao' },
              types: ['geocode', 'establishment']
            }, (predictions, status) => {
              setIsSearching(false);
              if (status === google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
                const results: PlaceSuggestion[] = predictions.map(p => ({
                  placeId: p.place_id,
                  description: p.description,
                  mainText: p.structured_formatting.main_text,
                  secondaryText: p.structured_formatting.secondary_text
                }));
                setSuggestions(results);
                setShowSuggestions(true);
              } else {
                if (status === 'REQUEST_DENIED' || status === 'INVALID_REQUEST') {
                  console.warn("Places legacy prediction denegado no modal:", status);
                  setHasMapsError(true);
                }
                const mocks = getMockPredictions(value);
                setSuggestions(mocks);
                setShowSuggestions(true);
              }
            });
            return;
          } catch (err) {
            console.warn("Erro ao rodar autocomplete tradicional no modal:", err);
          }
        }

        // 3. Fallback Terciário: Mocks sem rede
        setIsSearching(false);
        const mocks = getMockPredictions(value);
        setSuggestions(mocks);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setAddress(suggestion.description);
    setShowSuggestions(false);

    if (suggestion.coords) {
      setSelectedCoords(suggestion.coords);
      return;
    }

    const placeId = suggestion.placeId;

    if (placeId.startsWith('mock-')) {
      const found = POPULAR_LUANDA_PLACES.find(p => `mock-${p.main_text.toLowerCase().replace(/\s+/g, '-')}` === placeId);
      if (found) {
        setSelectedCoords({ lat: found.lat, lng: found.lng });
        return;
      }
    }

    setIsSearching(true);

    // Tenta usar Places API (New) se disponível
    if (placesLib && placesLib.Place) {
      try {
        const place = new placesLib.Place({ id: placeId });
        await place.fetchFields({ fields: ['location'] });
        if (place.location) {
          const lat = typeof place.location.lat === 'function' ? (place.location.lat as any)() : (place.location.lat as any);
          const lng = typeof place.location.lng === 'function' ? (place.location.lng as any)() : (place.location.lng as any);
          setSelectedCoords({ lat, lng });
          setIsSearching(false);
          return;
        }
      } catch (err) {
        console.warn("Falha no fetchFields do Places (New) no modal, tentando legado...", err);
      }
    }

    if (placesService.current && !hasMapsError) {
      try {
        placesService.current.getDetails({
          placeId,
          fields: ['geometry']
        }, (place, status) => {
          setIsSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            setSelectedCoords({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          } else {
            if (status === 'REQUEST_DENIED' || status === 'INVALID_REQUEST') {
              console.warn("Places getDetails tradicional falhou no modal:", status);
              setHasMapsError(true);
            }
            setSelectedCoords(getFallbackCoordinates(suggestion.description));
          }
        });
        return;
      } catch (err) {
        setHasMapsError(true);
      }
    }

    setIsSearching(false);
    setSelectedCoords(getFallbackCoordinates(suggestion.description));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      setStatus({ type: 'error', message: 'Por favor, preenche todos os campos.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    
    try {
      let finalCoords = selectedCoords;
      if (!finalCoords && address) {
        finalCoords = getFallbackCoordinates(address);
      }

      if (locationToEdit && onEdit) {
        await onEdit(
          locationToEdit.id,
          name,
          address,
          type,
          finalCoords?.lat,
          finalCoords?.lng
        );
        setStatus({ type: 'success', message: 'Local atualizado com sucesso!' });
      } else {
        await onAdd(
          name, 
          address, 
          type, 
          finalCoords?.lat,
          finalCoords?.lng
        );
        setStatus({ type: 'success', message: 'Local guardado com sucesso!' });
      }
      
      setName('');
      setAddress('');
      setType('other');
      setSelectedCoords(null);
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving location:', error);
      setStatus({ 
        type: 'error', 
        message: error.message || 'Erro ao guardar local. Verifica a tua ligação.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const types: { value: SavedLocationType; label: string; icon: any }[] = [
    { value: 'home', label: 'Casa', icon: Home },
    { value: 'work', label: 'Trabalho', icon: Briefcase },
    { value: 'school', label: 'Escola', icon: GraduationCap },
    { value: 'other', label: 'Outro', icon: Star },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <h3 className="text-xl font-black font-display tracking-tight text-gray-900">
                  {locationToEdit ? 'Editar Local' : 'Adicionar Local'}
                </h3>
                <button onClick={onClose} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900">
                  <X size={20} />
                </button>
              </div>

              {status && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mb-6 p-4 rounded-2xl text-xs font-bold text-center",
                    status.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}
                >
                  {status.message}
                </motion.div>
              )}

              {hasMapsError && (
                <div className="mb-5 bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-start gap-2 max-h-40 overflow-y-auto">
                  <span className="p-1 text-amber-700 bg-amber-100 rounded-lg font-bold shrink-0 text-xs">⚠️</span>
                  <div className="text-left">
                    <p className="text-amber-800 text-[10px] font-black leading-tight">Configurações Google Maps (LegacyApiNotActivatedMapError)</p>
                    <p className="text-amber-600/90 text-[9px] font-semibold mt-0.5 leading-snug">
                      Para usar sugestões automáticas personalizadas, por favor ative <strong className="text-amber-800">Places API, Directions API, Distance Matrix API</strong> e <strong className="text-amber-800">Geocoding API</strong> clássicas na sua Consola do Google Cloud. Adaptámos o sistema híbrido local para pesquisas offline.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-5">
                  {/* Type Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-2 px-1">
                      TIPO DE LOCAL
                    </label>
                    <div className="flex justify-between gap-2">
                      {types.map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => {
                              setType(t.value);
                              if (!name || types.some(tp => tp.label === name)) {
                                setName(t.label);
                              }
                            }}
                            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                              type === t.value 
                                ? 'bg-primary/5 border-primary text-primary' 
                                : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            <Icon size={20} />
                            <span className="text-[10px] font-bold uppercase">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name field */}
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-2 px-1">
                      NOME PERSONALIZADO
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Minha Casa"
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all px-[16px] py-[14px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Address field */}
                  <div className="flex flex-col gap-2 relative mb-4">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-2 px-1">
                      ENDEREÇO
                    </label>
                    <div className="relative">
                      <MapPin className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", selectedCoords ? "text-emerald-500" : "text-gray-400")} size={18} />
                      <input 
                        type="text"
                        value={address}
                        onChange={handleAddressChange}
                        onFocus={() => address.length >= 3 && setShowSuggestions(true)}
                        placeholder="Pesquisar local real em Angola..."
                        className="w-full h-14 pl-12 pr-10 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all px-[16px] py-[14px]"
                        required
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                          <Loader2 size={16} className="animate-spin" />
                        </div>
                      )}
                      {selectedCoords && !isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                          <Check size={16} />
                        </div>
                      )}
                    </div>

                    {/* Suggestions list for Modal */}
                    <AnimatePresence>
                      {showSuggestions && (suggestions.length > 0 || isSearching) && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-48 overflow-y-auto"
                        >
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion.placeId}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                              onClick={() => handleSelectSuggestion(suggestion)}
                            >
                              <Search size={14} className="text-gray-400 group-hover:text-primary shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-bold text-gray-700 truncate">
                                  {suggestion.mainText}
                                </span>
                                <span className="text-[9px] text-gray-400 font-medium truncate">
                                  {suggestion.description}
                                </span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-6">
                  {!user ? (
                    <div className="flex flex-col gap-5">
                      <p className="text-xs text-center text-gray-500 font-medium">
                        Ops! Parece que não estás na tua conta. Entra para guardares os teus locais favoritos.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLoginRedirect();
                        }}
                        className="w-full h-14 bg-gray-900 text-white rounded-[14px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-gray-200"
                      >
                        <User size={20} />
                        Fazer Login
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !name || !address}
                      className="w-full h-14 bg-primary text-white rounded-[14px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Check size={20} />
                      )}
                      {isSubmitting ? 'A Guardar...' : locationToEdit ? 'Atualizar Local' : 'Guardar Local'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
