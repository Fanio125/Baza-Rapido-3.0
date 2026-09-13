import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Navigation, 
  ArrowRight, 
  Loader2, 
  Compass, 
  X, 
  Plane, 
  ShoppingBag, 
  Landmark as LandmarkIcon, 
  Building2, 
  GraduationCap, 
  HeartPulse, 
  Trophy, 
  Sparkles,
  Search
} from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';
import type { Location } from '../types';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { LUANDA_LANDMARKS, searchLuandaLandmarks, type LuandaLandmark } from '../data/luandaLandmarks';

interface SearchSectionProps {
  onCompare: (origin: Location, destination: Location) => void;
  initialDestination?: string;
  initialOrigin?: string;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  coords?: google.maps.LatLngLiteral;
  isLandmark?: boolean;
  category?: string;
  iconType?: 'airport' | 'shopping' | 'landmark' | 'stadium' | 'hospital' | 'university' | 'urban' | 'pin';
}

function getFallbackCoordinates(text: string): google.maps.LatLngLiteral {
  // Check if text matches any known Luanda landmark
  const matched = searchLuandaLandmarks(text, 1);
  if (matched.length > 0) {
    return { lat: matched[0].lat, lng: matched[0].lng };
  }

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

export default function SearchSection({ onCompare, initialDestination = "", initialOrigin = "" }: SearchSectionProps) {
  const [originText, setOriginText] = useState<string>("Minha localização atual");
  const [originCoords, setOriginCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [destinationText, setDestinationText] = useState<string>(initialDestination);
  const [destinationCoords, setDestinationCoords] = useState<google.maps.LatLngLiteral | null>(null);
  
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [hasMapsError, setHasMapsError] = useState(false);
  const [isLocatingOrigin, setIsLocatingOrigin] = useState(false);
  const [isLocatingDest, setIsLocatingDest] = useState(false);
  
  const placesLib = useMapsLibrary('places');
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Places Autocomplete & Session Token
  useEffect(() => {
    if (placesLib) {
      try {
        autocompleteService.current = new placesLib.AutocompleteService();
        const dummy = document.createElement('div');
        placesService.current = new placesLib.PlacesService(dummy);
        if (placesLib.AutocompleteSessionToken) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
      } catch (err) {
        console.warn("Falha ao inicializar serviços Google Places:", err);
      }
    }
  }, [placesLib]);

  const refreshSessionToken = useCallback(() => {
    if (placesLib?.AutocompleteSessionToken) {
      try {
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      } catch (e) {
        console.warn("Error refreshing Places session token:", e);
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

  // Click outside listener
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

  // Geolocation detection
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
                if (isOrigin) setOriginText(formatted);
                else setDestinationText(formatted);
              } else {
                const fallback = `Localização Atual (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
                if (isOrigin) setOriginText(fallback);
                else setDestinationText(fallback);
              }
            });
          } catch (err) {
            setLoading(false);
            const fallback = `Localização Atual (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
            if (isOrigin) setOriginText(fallback);
            else setDestinationText(fallback);
          }
        } else {
          setLoading(false);
          const fallback = `Localização Atual (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
          if (isOrigin) setOriginText(fallback);
          else setDestinationText(fallback);
        }
      },
      (err) => {
        console.warn("Falha no GPS:", err);
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

  // Convert landmark to PlaceSuggestion
  const mapLandmarkToSuggestion = (landmark: LuandaLandmark): PlaceSuggestion => ({
    placeId: landmark.id,
    description: landmark.address,
    mainText: landmark.name,
    secondaryText: landmark.secondaryText,
    coords: { lat: landmark.lat, lng: landmark.lng },
    isLandmark: true,
    category: landmark.category,
    iconType: landmark.iconType
  });

  // Get initial default landmarks when field is focused with empty/short query
  const getDefaultLandmarks = (): PlaceSuggestion[] => {
    return LUANDA_LANDMARKS.slice(0, 6).map(mapLandmarkToSuggestion);
  };

  // Real-time Autocompletion with Google Places API + Luanda Landmark prioritization
  const fetchSuggestions = async (query: string, isOrigin: boolean) => {
    const trimmed = query.trim();

    if (!trimmed) {
      const defaults = getDefaultLandmarks();
      if (isOrigin) {
        setOriginSuggestions(defaults);
        setIsSearchingOrigin(false);
      } else {
        setDestSuggestions(defaults);
        setIsSearchingDest(false);
      }
      return;
    }

    if (isOrigin) setIsSearchingOrigin(true);
    else setIsSearchingDest(true);

    // 1. First Priority: Curated Luanda landmarks matching query
    const matchedLandmarks = searchLuandaLandmarks(trimmed, 5).map(mapLandmarkToSuggestion);

    // 2. Second Priority: Google Places API real-time prediction
    let googleSuggestions: PlaceSuggestion[] = [];

    // Attempt Google Places API (New) or AutocompleteService
    if (placesLib) {
      try {
        // Try modern AutocompleteService with Luanda bias & Angola restriction
        if (autocompleteService.current && !hasMapsError) {
          const predictions = await new Promise<google.maps.places.AutocompletePrediction[] | null>((resolve) => {
            try {
              const req: google.maps.places.AutocompletionRequest = {
                input: trimmed,
                componentRestrictions: { country: 'ao' },
                locationBias: new (window as any).google.maps.Circle({
                  center: { lat: -8.8390, lng: 13.2345 },
                  radius: 45000 // 45km Luanda metropolitan area
                }),
                types: ['geocode', 'establishment'],
                sessionToken: sessionTokenRef.current || undefined
              };

              autocompleteService.current!.getPlacePredictions(req, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                  resolve(results);
                } else {
                  if (status === 'REQUEST_DENIED' || status === 'INVALID_REQUEST') {
                    setHasMapsError(true);
                  }
                  resolve(null);
                }
              });
            } catch {
              resolve(null);
            }
          });

          if (predictions && predictions.length > 0) {
            googleSuggestions = predictions.map(p => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting.main_text,
              secondaryText: p.structured_formatting.secondary_text || 'Luanda, Angola',
              isLandmark: false,
              iconType: 'pin'
            }));
          }
        }

        // Secondary Modern API fallback: placesLib.Place.searchByText
        if (googleSuggestions.length === 0 && placesLib.Place) {
          try {
            const searchQuery = trimmed.toLowerCase().includes('angola') || trimmed.toLowerCase().includes('luanda')
              ? trimmed
              : `${trimmed}, Luanda, Angola`;
            
            const response = await placesLib.Place.searchByText({
              textQuery: searchQuery,
              fields: ['id', 'displayName', 'location', 'formattedAddress'],
              locationBias: { lat: -8.8390, lng: 13.2345 },
              maxResultCount: 5,
            });

            if (response?.places && response.places.length > 0) {
              googleSuggestions = response.places.map((p: any) => {
                const lat = typeof p.location?.lat === 'function' ? p.location.lat() : p.location?.lat;
                const lng = typeof p.location?.lng === 'function' ? p.location.lng() : p.location?.lng;
                return {
                  placeId: p.id,
                  description: p.formattedAddress || p.displayName || '',
                  mainText: p.displayName || '',
                  secondaryText: p.formattedAddress || 'Luanda, Angola',
                  coords: (lat && lng) ? { lat, lng } : undefined,
                  isLandmark: false,
                  iconType: 'pin'
                };
              });
            }
          } catch (e) {
            console.warn("Places searchByText fallback error:", e);
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar autocompletação Google Places:", err);
      }
    }

    // Combine results: Prioritize Luanda landmarks, then add Google Places results (deduplicating)
    const combined: PlaceSuggestion[] = [...matchedLandmarks];
    const seenNames = new Set(matchedLandmarks.map(m => m.mainText.toLowerCase().trim()));

    for (const g of googleSuggestions) {
      const gLower = g.mainText.toLowerCase().trim();
      const isDuplicate = Array.from(seenNames).some(name => 
        name.includes(gLower) || gLower.includes(name)
      );

      if (!isDuplicate) {
        seenNames.add(gLower);
        combined.push(g);
      }
    }

    // Fallback: If no results at all, provide closest landmark matches
    if (combined.length === 0) {
      const fallbackLandmarks = LUANDA_LANDMARKS.slice(0, 4).map(mapLandmarkToSuggestion);
      combined.push(...fallbackLandmarks);
    }

    if (isOrigin) {
      setOriginSuggestions(combined);
      setIsSearchingOrigin(false);
    } else {
      setDestSuggestions(combined);
      setIsSearchingDest(false);
    }
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
    }, 200); // Fast 200ms debounce for responsive real-time feel
  };

  const handleFocus = (isOrigin: boolean) => {
    if (isOrigin) {
      setShowOriginSuggestions(true);
      setShowDestinationSuggestions(false);
      if (originSuggestions.length === 0) {
        fetchSuggestions(originText, true);
      }
    } else {
      setShowDestinationSuggestions(true);
      setShowOriginSuggestions(false);
      if (destSuggestions.length === 0) {
        fetchSuggestions(destinationText, false);
      }
    }
  };

  const handleClear = (isOrigin: boolean) => {
    if (isOrigin) {
      setOriginText('');
      setOriginCoords(null);
      const defaults = getDefaultLandmarks();
      setOriginSuggestions(defaults);
      setShowOriginSuggestions(true);
      originInputRef.current?.focus();
    } else {
      setDestinationText('');
      setDestinationCoords(null);
      const defaults = getDefaultLandmarks();
      setDestSuggestions(defaults);
      setShowDestinationSuggestions(true);
      destInputRef.current?.focus();
    }
  };

  const getPlaceCoords = async (suggestion: PlaceSuggestion): Promise<google.maps.LatLngLiteral> => {
    if (suggestion.coords) {
      return suggestion.coords;
    }

    const placeId = suggestion.placeId;

    // Check if landmark ID
    const foundLandmark = LUANDA_LANDMARKS.find(l => l.id === placeId);
    if (foundLandmark) {
      return { lat: foundLandmark.lat, lng: foundLandmark.lng };
    }

    // Try Google Places (New) fetchFields
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
        console.warn("Falha no fetchFields de coordenadas:", err);
      }
    }

    // Try PlacesService getDetails
    if (placesService.current) {
      try {
        return await new Promise((resolve, reject) => {
          placesService.current!.getDetails({
            placeId,
            fields: ['geometry'],
            sessionToken: sessionTokenRef.current || undefined
          }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
              resolve({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              });
            } else {
              reject(new Error(`Places Service status: ${status}`));
            }
          });
        });
      } catch {
        // Fallback to local coordinates
      }
    }

    return getFallbackCoordinates(suggestion.description);
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion, isOrigin: boolean) => {
    refreshSessionToken();

    if (isOrigin) {
      setOriginText(suggestion.mainText);
      setShowOriginSuggestions(false);
    } else {
      setDestinationText(suggestion.mainText);
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
    } catch {
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
      } else if (!finalOriginCoords) {
        finalOriginCoords = getFallbackCoordinates(originText || "Luanda");
        setOriginCoords(finalOriginCoords);
      }

      if (!finalDestCoords) {
        finalDestCoords = getFallbackCoordinates(destinationText || "Luanda");
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
    <div className="space-y-5" ref={searchRef}>
      <div className="relative space-y-3">
        {/* Origin Input */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-primary/10 rounded-xl text-primary shrink-0 transition-transform group-focus-within:scale-105">
            <Navigation size={17} fill="currentColor" fillOpacity={0.2} />
          </div>

          <input
            ref={originInputRef}
            type="text"
            className="input-field pl-14 pr-20 py-3.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 transition-all rounded-2xl border-gray-200/80 bg-white"
            placeholder="Ponto de partida (de onde você sai?)"
            value={originText}
            onChange={(e) => handleTextChange(e.target.value, true)}
            onFocus={() => handleFocus(true)}
          />

          {/* Action icons right side */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            {isSearchingOrigin && (
              <Loader2 size={15} className="animate-spin text-primary mr-0.5" />
            )}
            
            {originText && (
              <button
                type="button"
                onClick={() => handleClear(true)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg active:scale-95 transition-all"
                title="Limpar campo"
              >
                <X size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => detectAndGeocode(true)}
              disabled={isLocatingOrigin}
              className="p-1.5 text-gray-500 hover:text-primary hover:bg-orange-50 rounded-lg active:scale-95 transition-all"
              title="Usar minha localização atual (GPS)"
            >
              {isLocatingOrigin ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : (
                <Compass size={16} className="text-primary" />
              )}
            </button>
          </div>

          {/* Suggestions Dropdown for Origin */}
          <AnimatePresence>
            {showOriginSuggestions && (
              <SuggestionsDropdown 
                suggestions={originSuggestions} 
                isSearching={isSearchingOrigin}
                currentQuery={originText}
                onSelect={(s) => handleSelectSuggestion(s, true)} 
              />
            )}
          </AnimatePresence>
        </div>

        {/* Route Connecting Line Indicator */}
        <div className="flex items-center pl-7 py-0.5 gap-2 select-none pointer-events-none">
          <div className="w-0.5 h-3 bg-gradient-to-b from-primary/60 to-primary/20 rounded-full" />
        </div>

        {/* Destination Input */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-primary/10 rounded-xl text-primary shrink-0 transition-transform group-focus-within:scale-105 shadow-xs shadow-primary/15">
            <MapPin size={17} fill="currentColor" fillOpacity={0.2} />
          </div>

          <input
            ref={destInputRef}
            type="text"
            className="input-field pl-14 pr-20 py-3.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 transition-all rounded-2xl border-gray-200/80 bg-white"
            placeholder="Para onde vamos? (Destino ou referência)"
            value={destinationText}
            onChange={(e) => handleTextChange(e.target.value, false)}
            onFocus={() => handleFocus(false)}
          />

          {/* Action icons right side */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            {isSearchingDest && (
              <Loader2 size={15} className="animate-spin text-primary mr-0.5" />
            )}

            {destinationText && (
              <button
                type="button"
                onClick={() => handleClear(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg active:scale-95 transition-all"
                title="Limpar destino"
              >
                <X size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => detectAndGeocode(false)}
              disabled={isLocatingDest}
              className="p-1.5 text-gray-500 hover:text-primary hover:bg-orange-50 rounded-lg active:scale-95 transition-all"
              title="Preencher com GPS atual"
            >
              {isLocatingDest ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : (
                <Compass size={16} className="text-primary" />
              )}
            </button>
          </div>

          {/* Suggestions Dropdown for Destination */}
          <AnimatePresence>
            {showDestinationSuggestions && (
              <SuggestionsDropdown 
                suggestions={destSuggestions} 
                isSearching={isSearchingDest}
                currentQuery={destinationText}
                onSelect={(s) => handleSelectSuggestion(s, false)} 
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Compare Action Button */}
      <button 
        type="button"
        onClick={handleCompare}
        disabled={isComparing || !destinationText.trim()}
        className={cn(
          "btn-primary w-full py-4 text-base font-extrabold tracking-wide flex items-center justify-center gap-2 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all",
          (isComparing || !destinationText.trim()) && "opacity-50 cursor-not-allowed saturate-0"
        )}
      >
        {isComparing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>A comparar opções em Luanda...</span>
          </>
        ) : (
          <>
            <span>Comparar Preços</span>
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </div>
  );
}

// Icon helper function based on landmark category
function getLandmarkIcon(type?: string) {
  switch (type) {
    case 'airport':
      return <Plane size={15} className="text-sky-600" />;
    case 'shopping':
      return <ShoppingBag size={15} className="text-purple-600" />;
    case 'landmark':
      return <LandmarkIcon size={15} className="text-amber-600" />;
    case 'hospital':
      return <HeartPulse size={15} className="text-rose-600" />;
    case 'university':
      return <GraduationCap size={15} className="text-blue-600" />;
    case 'stadium':
      return <Trophy size={15} className="text-emerald-600" />;
    case 'urban':
      return <Building2 size={15} className="text-orange-600" />;
    default:
      return <MapPin size={15} className="text-primary" />;
  }
}

function getIconBgColor(type?: string) {
  switch (type) {
    case 'airport':
      return 'bg-sky-50 border-sky-100';
    case 'shopping':
      return 'bg-purple-50 border-purple-100';
    case 'landmark':
      return 'bg-amber-50 border-amber-100';
    case 'hospital':
      return 'bg-rose-50 border-rose-100';
    case 'university':
      return 'bg-blue-50 border-blue-100';
    case 'stadium':
      return 'bg-emerald-50 border-emerald-100';
    case 'urban':
      return 'bg-orange-50 border-orange-100';
    default:
      return 'bg-orange-50/70 border-orange-100';
  }
}

function SuggestionsDropdown({ 
  suggestions, 
  isSearching, 
  currentQuery,
  onSelect 
}: { 
  suggestions: PlaceSuggestion[], 
  isSearching: boolean, 
  currentQuery: string,
  onSelect: (s: PlaceSuggestion) => void 
}) {
  const hasLandmarks = suggestions.some(s => s.isLandmark);
  const hasGooglePlaces = suggestions.some(s => !s.isLandmark);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.99 }}
      transition={{ duration: 0.16 }}
      className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[340px] overflow-y-auto no-scrollbar divide-y divide-gray-50"
    >
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary fill-primary" />
          <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
            {!currentQuery.trim() ? 'Pontos de Referência em Luanda' : 'Sugestões & Pontos de Luanda'}
          </span>
        </div>
        {isSearching && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
            <Loader2 size={11} className="animate-spin" />
            <span>Google Places</span>
          </div>
        )}
      </div>

      {suggestions.length === 0 && !isSearching ? (
        <div className="p-6 text-center text-gray-400">
          <Search size={22} className="mx-auto mb-2 text-gray-300" />
          <p className="text-xs font-semibold text-gray-600">Nenhum local encontrado</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Tente pesquisar por um bairro ou ponto de referência (ex: Belas, Mutamba, Aeroporto)</p>
        </div>
      ) : (
        suggestions.map((suggestion) => (
          <button
            key={suggestion.placeId}
            type="button"
            className="w-full text-left px-4 py-3 hover:bg-orange-50/40 active:bg-orange-100/50 flex items-center gap-3 transition-colors group cursor-pointer"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevents input blur before click fires
              onSelect(suggestion);
            }}
          >
            {/* Category Icon Badge */}
            <div className={cn(
              "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
              getIconBgColor(suggestion.iconType)
            )}>
              {getLandmarkIcon(suggestion.iconType)}
            </div>

            {/* Texts */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                  {suggestion.mainText}
                </span>

                {suggestion.isLandmark && suggestion.category && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 tracking-tight shrink-0">
                    {suggestion.category}
                  </span>
                )}
              </div>

              <span className="text-[11px] text-gray-500 font-medium truncate block mt-0.5">
                {suggestion.secondaryText}
              </span>
            </div>

            <ArrowRight size={13} className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        ))
      )}
    </motion.div>
  );
}
