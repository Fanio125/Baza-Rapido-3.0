import { supabase } from '../lib/supabase';
import type { SavedLocation } from '../types';

const LOCAL_LOCATIONS_KEY = 'br_saved_locations';

const getLocalLocations = (): SavedLocation[] => {
  try {
    const data = localStorage.getItem(LOCAL_LOCATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalLocations = (locations: SavedLocation[]) => {
  try {
    localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(locations));
  } catch (e) {}
};

export const locationService = {
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('Utilizador não autenticado');
      return user;
    } catch (err) {
      throw new Error('Utilizador não autenticado');
    }
  },

  async getSavedLocations(userId: string) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch saved locations from Supabase:', error.message);
        return getLocalLocations().filter(loc => loc.user_id === userId);
      }
      if (data) {
        const otherUsersLocs = getLocalLocations().filter(loc => loc.user_id !== userId);
        saveLocalLocations([...otherUsersLocs, ...(data as SavedLocation[])]);
        return data as SavedLocation[];
      }
      return getLocalLocations().filter(loc => loc.user_id === userId);
    } catch (err) {
      console.warn('Network error fetching locations from Supabase:', err);
      return getLocalLocations().filter(loc => loc.user_id === userId);
    }
  },

  async addSavedLocation(location: Omit<SavedLocation, 'id' | 'created_at' | 'user_id'>) {
    const user = await this.getCurrentUser();

    const newLoc: SavedLocation = {
      ...location,
      id: crypto.randomUUID ? crypto.randomUUID() : 'loc_' + Date.now(),
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    const currentLocal = getLocalLocations();
    saveLocalLocations([newLoc, ...currentLocal]);

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .insert([{
          ...location,
          user_id: user.id
        }])
        .select()
        .single();

      if (!error && data) {
        return data as SavedLocation;
      }
    } catch (err) {
      console.warn('Error saving location to Supabase:', err);
    }

    return newLoc;
  },

  async updateSavedLocation(id: string, location: Partial<SavedLocation>) {
    const currentLocal = getLocalLocations();
    const updated = currentLocal.map(loc => {
      if (loc.id === id) {
        return { ...loc, ...location };
      }
      return loc;
    });
    saveLocalLocations(updated);

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .update(location)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as SavedLocation;
      }
    } catch (err) {
      console.warn('Error updating location in Supabase:', err);
    }

    const found = updated.find(loc => loc.id === id);
    if (!found) throw new Error('Localização não encontrada');
    return found;
  },

  async deleteSavedLocation(id: string) {
    const currentLocal = getLocalLocations();
    const filtered = currentLocal.filter(loc => loc.id !== id);
    saveLocalLocations(filtered);

    try {
      await supabase
        .from('saved_locations')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Error deleting location from Supabase:', err);
    }
  }
};
