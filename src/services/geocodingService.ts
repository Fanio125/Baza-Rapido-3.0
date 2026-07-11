
export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    suburb?: string;
    road?: string;
    neighbourhood?: string;
  };
}

const POSITIONSTACK_KEY = import.meta.env.VITE_POSITIONSTACK_KEY || '';

if (!POSITIONSTACK_KEY) {
  console.warn("PositionStack API Key is missing! Please define VITE_POSITIONSTACK_KEY in your .env file.");
}

export const geocodingService = {
  async search(query: string): Promise<GeocodingResult[]> {
    if (query.length < 3) return [];

    try {
      // Tentar PositionStack primariamente via HTTPS se possível, ou cair para HTTP
      const url = `https://api.positionstack.com/v1/forward?access_key=${POSITIONSTACK_KEY}&query=${encodeURIComponent(query)}&country=AO&limit=5`;
      
      const response = await fetch(url).catch(async () => {
        // Se falhar (por exemplo, bloqueio de mixed-content ou HTTPS não disponível na conta grátis de PositionStack)
        // usamos o OpenStreetMap Nominatim que é 100% seguro (HTTPS), livre e funciona incrivelmente bem em Angola!
        const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ao&limit=5`;
        return fetch(osmUrl, {
          headers: {
            'Accept-Language': 'pt-AO,pt;q=0.9',
            'User-Agent': 'BazaRapido/1.0'
          }
        });
      });

      if (!response.ok) throw new Error('Falha na rede');
      const data = await response.json();
      
      // Se for formato do Nominatim osm
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
          address: {
            city: item.address?.city || item.address?.town,
            road: item.address?.road,
            neighbourhood: item.address?.suburb || item.address?.neighbourhood
          }
        }));
      }

      // Se for formato do PositionStack
      if (!data.data) return [];

      return data.data.map((item: any) => ({
        display_name: item.label,
        lat: item.latitude.toString(),
        lon: item.longitude.toString(),
        address: {
          city: item.locality,
          road: item.street,
          neighbourhood: item.neighbourhood
        }
      }));
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      // Fallback local simples para evitar qualquer tipo de falha
      return [];
    }
  }
};
