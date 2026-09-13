import { supabase } from '../lib/supabase';

export interface RideHistory {
  id: string;
  user_id: string;
  user_name: string;
  origem: string;
  destino: string;
  distancia: number;
  preco: number;
  created_at: string;
  status: 'Concluída' | 'Cancelada' | 'Em andamento';
  payment_method: string;
  origem_lat?: number;
  origem_lng?: number;
  destino_lat?: number;
  destino_lng?: number;
  app_name: string;
}

const LOCAL_STORAGE_KEY = 'vambora_ride_history';

// Helper to load fallback local history
const getLocalHistory = (): RideHistory[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao aceder ao localStorage:', err);
    return [];
  }
};

// Helper to save fallback local history
const saveLocalHistory = (history: RideHistory[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Erro ao guardar no localStorage:', err);
  }
};

export const rideHistoryService = {
  /**
   * Fetches the entire ride history for the authenticated user, descending.
   */
  async getHistory(userId: string): Promise<RideHistory[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('ride_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao aceder à tabela ride_history no Supabase:', error.message);
        return getLocalHistory()
          .filter(r => r.user_id === userId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      if (data) {
        const otherUsersHistory = getLocalHistory().filter(r => r.user_id !== userId);
        const mappedData: RideHistory[] = data.map(item => ({
          id: item.id || String(item.id),
          user_id: item.user_id,
          user_name: item.user_name || 'Utilizador',
          origem: item.origem,
          destino: item.destino,
          distancia: Number(item.distancia || 0),
          preco: Number(item.preco || 0),
          created_at: item.created_at,
          status: item.status as any,
          payment_method: item.payment_method || 'Dinheiro',
          origem_lat: item.origem_lat,
          origem_lng: item.origem_lng,
          destino_lat: item.destino_lat,
          destino_lng: item.destino_lng,
          app_name: item.app_name || 'Táxi'
        }));
        
        saveLocalHistory([...otherUsersHistory, ...mappedData]);
        return mappedData;
      }
    } catch (err) {
      console.warn('Erro de rede ou Supabase:', err);
    }

    return getLocalHistory()
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Saves or inserts a new ride history record.
   */
  async saveRide(ride: Omit<RideHistory, 'id' | 'created_at'>): Promise<RideHistory> {
    const newRide: RideHistory = {
      ...ride,
      id: crypto.randomUUID ? crypto.randomUUID() : 'ride_' + Date.now(),
      created_at: new Date().toISOString()
    };

    const currentLocal = getLocalHistory();
    saveLocalHistory([newRide, ...currentLocal]);

    if (ride.user_id) {
      try {
        const { error } = await supabase
          .from('ride_history')
          .insert([{
            id: newRide.id,
            user_id: newRide.user_id,
            user_name: newRide.user_name,
            origem: newRide.origem,
            destino: newRide.destino,
            distancia: newRide.distancia,
            preco: newRide.preco,
            status: newRide.status,
            payment_method: newRide.payment_method,
            origem_lat: newRide.origem_lat,
            origem_lng: newRide.origem_lng,
            destino_lat: newRide.destino_lat,
            destino_lng: newRide.destino_lng,
            app_name: newRide.app_name,
            created_at: newRide.created_at
          }]);

        if (error) {
          console.warn('Supabase insert failed:', error.message);
        }
      } catch (err) {
        console.warn('Erro ao guardar no Supabase:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('ride-history-updated'));
    return newRide;
  },

  /**
   * Updates the status of a ride (e.g., from 'Em andamento' to 'Concluída' or 'Cancelada')
   */
  async updateRideStatus(rideId: string, status: 'Concluída' | 'Cancelada' | 'Em andamento', userId: string): Promise<boolean> {
    const currentLocal = getLocalHistory();
    const index = currentLocal.findIndex(r => r.id === rideId);
    if (index !== -1) {
      currentLocal[index].status = status;
      saveLocalHistory(currentLocal);
    }

    let success = true;

    if (userId) {
      try {
        const { error } = await supabase
          .from('ride_history')
          .update({ status })
          .eq('id', rideId)
          .eq('user_id', userId);

        if (error) {
          console.warn('Falha no update do Supabase:', error.message);
          success = false;
        }
      } catch (err) {
        console.warn('Exceção ao atualizar status no Supabase:', err);
        success = false;
      }
    }

    window.dispatchEvent(new CustomEvent('ride-history-updated'));
    return success;
  }
};
