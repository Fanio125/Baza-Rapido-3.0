
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

const POSITIONSTACK_KEY = import.meta.env.VITE_POSITIONSTACK_KEY || '6a05ef900a680c730c1ec1dab6d0200d';

export const geocodingService = {
  async search(query: string): Promise<GeocodingResult[]> {
    if (query.length < 3) return [];

    try {
      // Usando PositionStack como solicitado
      const response = await fetch(
        `http://api.positionstack.com/v1/forward?access_key=${POSITIONSTACK_KEY}&query=${encodeURIComponent(query)}&country=AO&limit=5`
      );

      if (!response.ok) throw new Error('Falha na rede');
      const data = await response.json();
      
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
      console.error('Erro na geocodificação (PositionStack):', error);
      return [];
    }
  }
};
