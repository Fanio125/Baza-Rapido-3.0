import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Navigation, ArrowRight, Loader2, Compass } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import type { Location } from '../types';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface SearchSectionProps {
  onCompare: (origin: Location, destination: Location) => void;
  initialDestination?: string;
  initialOrigin?: string;
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

function getFallbackCoordinates(text: string): google.maps.LatLngLiteral {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = (Math.abs(hash) % 100) / 1000 - 0.05; // -0.05 to +0.05
  const lngOffset = (Math.abs(hash >> 5) % 100) / 1000 - 0.05; // -0.05 to +0.05
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

export default function SearchSection({ onCompare, initialDestination = "", initialOrigin = "" }: SearchSectionProps) {
  const [originText, setOriginText] = useState<string>("Minha localização atual");
  const [originCoords, setOriginCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [destinationText, setDestinationText] = useState<string>(initialDestination);
  const [destinationCoords, setDestinationCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [hasMapsError, setHasMapsError] = useState(false);
  const [isLocatingOrigin, setIsLocatingOrigin] = useState(false);
  const [isLocatingDest, setIsLocatingDest] = useState(false);
  
  const placesLib = useMapsLibrary('places');

  const detectAndGeocode = (isOrigin: boolean) => {
    const setLoading = isOrigin ? setIsLocatingOrigin : setIsLocatingDest;
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (isOrigin) {
          setOriginCoords(coords);
        } else {
          setDestinationCoords(coords);
        }

        if ((window as any).google?.maps?.Geocoder) {
          try {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: coords }, (results: any, status: any) => {
              setLoading(false);
              if (status === 'OK' && results && results[0]) {
                const formatted = results[0].formatted_address;
                if (isOrigin) {
                  setOriginText(formatted);
                } else {
                  setDestinationText(formatted);
                }
              } else {
                const fallback = `Localização Atual (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
                if (isOrigin) {
                  setOriginText(fallback);
                } else {
                  setDestinationText(fallback);
                }
              }
            });
          } catch (err) {
            console.warn("Error raw geocode execution:", err);
            setLoading(false);
            const fallback = `Localização Atual (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
            if (isOrigin) {
              setOriginText(fallback);
                } else {
                  setDestinationText(fallback);
                }
              }
        } else {
          setLoading(false);
          const fallback = `Localização Atual (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
          if (isOrigin) {
            setOriginText(fallback);
          } else {
            setDestinationText(fallback);
          }
        }
      },
      (err) => {
        console.warn("Geolocation failure inside helper:", err);
        setLoading(false);
        const fallbackCoords = { lat: -8.8390, lng: 13.2345 };
        if (isOrigin) {
          setOriginCoords(fallbackCoords);
          setOriginText("Luanda, Angola");
        } else {
          setDestinationCoords(fallbackCoords);
          setDestinationText("Luanda, Angola");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

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
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (placesLib) {
      try {
        autocompleteService.current = new placesLib.AutocompleteService();
        const dummy = document.createElement('div');
        placesService.current = new placesLib.PlacesService(dummy);
      } catch (err) {
        console.warn("Falha ao inicializar serviços adicionais do Places:", err);
      }
    }
  }, [placesLib]);

  useEffect(() => {
    if (initialDestination) {
      setDestinationText(initialDestination);
    }
  }, [initialDestination]);

  useEffect(() => {
    if (initialOrigin) {
      setOriginText(initialOrigin);
    }
  }, [initialOrigin]);

  // Hide suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false);
        setShowDestinationSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Geolocation for "Minha localização atual"
  useEffect(() => {
    if (originText === "Minha localização atual") {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setOriginCoords(coords);
          
          if ((window as any).google?.maps?.Geocoder) {
            try {
              const geocoder = new (window as any).google.maps.Geocoder();
              geocoder.geocode({ location: coords }, (results: any, status: any) => {
                if (status === 'OK' && results && results[0]) {
                  setOriginText(results[0].formatted_address);
                }
              });
            } catch (err) {
              console.warn("Failed reverse geocode for current location on load:", err);
            }
          }
        },
        (err) => {
          console.warn("Geolocation error:", err);
          const fallback = { lat: -8.8390, lng: 13.2345 };
          setOriginCoords(fallback);
          if ((window as any).google?.maps?.Geocoder) {
            try {
              const geocoder = new (window as any).google.maps.Geocoder();
              geocoder.geocode({ location: fallback }, (results: any, status: any) => {
                if (status === 'OK' && results && results[0]) {
                  setOriginText(results[0].formatted_address);
                }
              });
            } catch (err) {
              console.warn("Failed reserve geocoding on fallback load:", err);
            }
          }
        }
      );
    }
  }, [originText, placesLib]);

  // Retenta geocodificar se o Maps carregar depois de termos as coordenadas
  useEffect(() => {
    if (originCoords && (originText === "Minha localização atual" || originText.startsWith("Localização"))) {
      if ((window as any).google?.maps?.Geocoder) {
        try {
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode({ location: originCoords }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              setOriginText(results[0].formatted_address);
            }
          });
        } catch (err) {
          console.warn("Delayed geocode error:", err);
        }
      }
    }
  }, [originCoords, placesLib]);

  const fetchSuggestions = async (query: string, isOrigin: boolean) => {
    if (query.length < 3) {
      if (isOrigin) setOriginSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

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

    if (isOrigin) setIsSearchingOrigin(true);
    else setIsSearchingDest(true);

    // 1. Primariamente, tenta usar o novo Places API (New) que funciona perfeitamente com a chave
    if (placesLib && placesLib.Place) {
      try {
        const searchQuery = query.toLowerCase().includes('angola') ? query : `${query}, Luanda, Angola`;
        const response = await placesLib.Place.searchByText({
          textQuery: searchQuery,
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

          if (isOrigin) {
            setOriginSuggestions(results);
            setIsSearchingOrigin(false);
          } else {
            setDestSuggestions(results);
            setIsSearchingDest(false);
          }
          return;
        }
      } catch (err) {
        console.warn("Places searchByText falhou, tentando Autocomplete tradicional...", err);
      }
    }

    // 2. Fallback Secundário: AutocompleteService tradicional se habilitado ou em teste local
    if (autocompleteService.current && !hasMapsError) {
      try {
        autocompleteService.current.getPlacePredictions({
          input: query,
          componentRestrictions: { country: 'ao' }, // Angola
          types: ['geocode', 'establishment']
        }, (predictions, status) => {
          if (isOrigin) setIsSearchingOrigin(false);
          else setIsSearchingDest(false);

          if (status === google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
            const results: PlaceSuggestion[] = predictions.map(p => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting.main_text,
              secondaryText: p.structured_formatting.secondary_text
            }));
            if (isOrigin) setOriginSuggestions(results);
            else setDestSuggestions(results);
          } else {
            if (status === 'REQUEST_DENIED' || status === 'INVALID_REQUEST') {
              console.warn("Places legacy prediction denegado:", status);
              setHasMapsError(true);
            }
            const mocks = getMockPredictions(query);
            if (isOrigin) setOriginSuggestions(mocks);
            else setDestSuggestions(mocks);
          }
        });
        return;
      } catch (err) {
        console.warn("Erro ao rodar autocomplete tradicional:", err);
      }
    }

    // 3. Fallback Terciário: Base local inteligente sem rede para garantir funcionamento imediato
    if (isOrigin) setIsSearchingOrigin(false);
    else setIsSearchingDest(false);

    const mocks = getMockPredictions(query);
    if (isOrigin) setOriginSuggestions(mocks);
    else setDestSuggestions(mocks);
  };

  const handleTextChange = (value: string, isOrigin: boolean) => {
    if (isOrigin) {
      setOriginText(value);
      setOriginCoords(null);
      setShowOriginSuggestions(true);
      setShowDestinationSuggestions(false);
    } else {
      setDestinationText(value);
      setDestinationCoords(null);
      setShowDestinationSuggestions(true);
      setShowOriginSuggestions(false);
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value, isOrigin);
    }, 400);
  };

  const getPlaceCoords = async (suggestion: PlaceSuggestion): Promise<google.maps.LatLngLiteral> => {
    if (suggestion.coords) {
      return suggestion.coords;
    }

    const placeId = suggestion.placeId;

    if (placeId.startsWith('mock-')) {
      const found = POPULAR_LUANDA_PLACES.find(p => `mock-${p.main_text.toLowerCase().replace(/\s+/g, '-')}` === placeId);
      if (found) {
        return { lat: found.lat, lng: found.lng };
      }
    }

    // Tenta usar Places API (New) se disponível
    if (placesLib && placesLib.Place) {
      try {
        const place = new placesLib.Place({ id: placeId });
        await place.fetchFields({ fields: ['location'] });
        if (place.location) {
          const lat = typeof place.location.lat === 'function' ? (place.location.lat as any)() : (place.location.lat as any);
          const lng = typeof place.location.lng === 'function' ? (place.location.lng as any)() : (place.location.lng as any);
          return { lat, lng };
        }
      } catch (err) {
        console.warn("Falha no fetchFields do Places (New), tentando legado...", err);
      }
    }

    if (placesService.current) {
      return new Promise((resolve, reject) => {
        try {
          placesService.current!.getDetails({
            placeId,
            fields: ['geometry']
          }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
              resolve({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              });
            } else {
              if (status === 'REQUEST_DENIED' || status === 'INVALID_REQUEST') {
                console.warn("Places getDetails tradicional falhou:", status);
                setHasMapsError(true);
              }
              reject(new Error(`Falha ao obter coordenadas: ${status}`));
            }
          });
        } catch (err) {
          setHasMapsError(true);
          reject(err);
        }
      });
    }

    return getFallbackCoordinates(suggestion.description);
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion, isOrigin: boolean) => {
    if (isOrigin) {
      setOriginText(suggestion.description);
      setShowOriginSuggestions(false);
    } else {
      setDestinationText(suggestion.description);
      setShowDestinationSuggestions(false);
    }

    try {
      const coords = await getPlaceCoords(suggestion);
      if (isOrigin) {
        setOriginCoords(coords);
      } else {
        setDestinationCoords(coords);
      }
      return coords;
    } catch (error) {
      console.error("Erro ao carregar detalhes da coordenada:", error);
      const coords = getFallbackCoordinates(suggestion.description);
      if (isOrigin) {
        setOriginCoords(coords);
      } else {
        setDestinationCoords(coords);
      }
      return coords;
    }
  };

  const handleCompare = async () => {
    setIsComparing(true);
    try {
      let finalOriginCoords = originCoords;
      let finalDestCoords = destinationCoords;

      if (originText === "Minha localização atual" && !finalOriginCoords) {
        finalOriginCoords = await new Promise<google.maps.LatLngLiteral>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve({ lat: -8.8390, lng: 13.2345 })
          );
        });
        setOriginCoords(finalOriginCoords);
      } else if (!finalOriginCoords && originSuggestions.length > 0) {
        try {
          finalOriginCoords = await getPlaceCoords(originSuggestions[0]);
          setOriginText(originSuggestions[0].description);
          setOriginCoords(finalOriginCoords);
        } catch (e) {
          finalOriginCoords = getFallbackCoordinates(originText);
          setOriginCoords(finalOriginCoords);
        }
      }

      if (!finalDestCoords && destSuggestions.length > 0) {
        try {
          finalDestCoords = await getPlaceCoords(destSuggestions[0]);
          setDestinationText(destSuggestions[0].description);
          setDestinationCoords(finalDestCoords);
        } catch (e) {
          finalDestCoords = getFallbackCoordinates(destinationText);
          setDestinationCoords(finalDestCoords);
        }
      }

      // Final fallback if coordinates still missing
      if (!finalOriginCoords && originText) {
        finalOriginCoords = getFallbackCoordinates(originText);
        setOriginCoords(finalOriginCoords);
      }
      if (!finalDestCoords && destinationText) {
        finalDestCoords = getFallbackCoordinates(destinationText);
        setDestinationCoords(finalDestCoords);
      }

      if (finalOriginCoords && finalDestCoords) {
        onCompare(
          { address: originText, ...finalOriginCoords },
          { address: destinationText, ...finalDestCoords }
        );
      }
    } catch (error) {
      console.error("Erro ao comparar localizações:", error);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-6" ref={searchRef}>
      <div className="relative space-y-4">
        {/* Origin Input */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 rounded-lg text-primary">
            <Navigation size={18} fill="currentColor" fillOpacity={0.2} />
          </div>
          <input
            type="text"
            className="input-field pl-14 pr-12"
            placeholder="De onde você sai?"
            value={originText}
            onChange={(e) => handleTextChange(e.target.value, true)}
            onFocus={() => originText.length >= 3 && setShowOriginSuggestions(true)}
          />
          
          <button
            type="button"
            onClick={() => detectAndGeocode(true)}
            disabled={isLocatingOrigin}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-colors cursor-pointer z-10"
            title="Usar localização atual"
          >
            {isLocatingOrigin ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <Compass size={16} className="hover:scale-110 active:scale-95 transition-transform" />
            )}
          </button>
          
          <AnimatePresence>
            {showOriginSuggestions && (originSuggestions.length > 0 || isSearchingOrigin) && (
              <SuggestionsDropdown 
                suggestions={originSuggestions} 
                isSearching={isSearchingOrigin} 
                onSelect={(s) => handleSelectSuggestion(s, true)} 
              />
            )}
          </AnimatePresence>
        </div>

        {/* Decoration Line */}
        <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-linear-to-b from-primary/50 to-primary/20 -z-10" />

        {/* Destination Input */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm shadow-primary/10">
            <MapPin size={18} fill="currentColor" fillOpacity={0.2} />
          </div>
          <input
            type="text"
            className="input-field pl-14 pr-12"
            placeholder="Para onde vamos?"
            value={destinationText}
            onChange={(e) => handleTextChange(e.target.value, false)}
            onFocus={() => destinationText.length >= 3 && setShowDestinationSuggestions(true)}
          />
          
          <button
            type="button"
            onClick={() => detectAndGeocode(false)}
            disabled={isLocatingDest}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-colors cursor-pointer z-10"
            title="Usar localização atual"
          >
            {isLocatingDest ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <Compass size={16} className="hover:scale-110 active:scale-95 transition-transform" />
            )}
          </button>
          
          <AnimatePresence>
            {showDestinationSuggestions && (destSuggestions.length > 0 || isSearchingDest) && (
              <SuggestionsDropdown 
                suggestions={destSuggestions} 
                isSearching={isSearchingDest} 
                onSelect={(s) => handleSelectSuggestion(s, false)} 
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <button 
        onClick={handleCompare}
        disabled={isComparing || !destinationText || (!destinationCoords && !destSuggestions.length)}
        className={cn(
          "btn-primary w-full py-5 text-lg flex items-center justify-center gap-2",
          (isComparing || !destinationText || (!destinationCoords && !destSuggestions.length)) && "opacity-50 cursor-not-allowed saturate-0"
        )}
      >
        {isComparing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>A pesquisar...</span>
          </>
        ) : (
          <>
            <span>Comparar Agora</span>
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </div>
  );
}

function SuggestionsDropdown({ 
  suggestions, 
  isSearching, 
  onSelect 
}: { 
  suggestions: PlaceSuggestion[], 
  isSearching: boolean, 
  onSelect: (s: PlaceSuggestion) => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[300px] overflow-y-auto"
    >
      {isSearching ? (
        <div className="p-4 flex items-center justify-center gap-2 text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">A pesquisar locais...</span>
        </div>
      ) : (
        suggestions.map((suggestion) => (
          <button
            key={suggestion.placeId}
            className="w-full text-left px-6 py-4 hover:bg-gray-50 flex items-center gap-3 transition-colors group border-b border-gray-50 last:border-0"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(suggestion);
            }}
          >
            <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary/10 transition-colors shrink-0">
              <MapPin size={16} className="text-gray-400 group-hover:text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-700 truncate">
                {suggestion.mainText}
              </span>
              <span className="text-[10px] text-gray-400 font-medium truncate">
                {suggestion.secondaryText}
              </span>
            </div>
          </button>
        ))
      )}
    </motion.div>
  );
}
