import { supabase } from '../lib/supabase';
import type { SavedLocation, SavedLocationType } from '../types';

const DEMO_LOCATIONS_KEY = 'demo_saved_locations';

const getDemoLocations = (): SavedLocation[] => {
  try {
    const data = localStorage.getItem(DEMO_LOCATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveDemoLocations = (locations: SavedLocation[]) => {
  localStorage.setItem(DEMO_LOCATIONS_KEY, JSON.stringify(locations));
};

export const locationService = {
  async getCurrentUser() {
    const savedDemo = localStorage.getItem('demo_user');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        if (parsed?.user) return parsed.user;
      } catch (e) {
        // ignore
      }
    }
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
    if (userId === 'demo-user-id') {
      return getDemoLocations();
    }
    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch saved locations from Supabase. Falling back to local storage.', error.message);
        return getDemoLocations().filter(loc => loc.user_id === userId);
      }
      return data as SavedLocation[];
    } catch (err) {
      console.warn('Network error fetching locations from Supabase. Falling back to local storage.', err);
      return getDemoLocations().filter(loc => loc.user_id === userId);
    }
  },

  async addSavedLocation(location: Omit<SavedLocation, 'id' | 'created_at' | 'user_id'>) {
    let user;
    try {
      user = await this.getCurrentUser();
    } catch (err) {
      // Direct validation fallback if Supabase getUser fails but they are demo/guest representation
      const savedDemo = localStorage.getItem('demo_user');
      if (savedDemo) {
        user = JSON.parse(savedDemo).user;
      } else {
        throw err;
      }
    }

    if (user.id === 'demo-user-id') {
      const demoLocs = getDemoLocations();
      const newLoc: SavedLocation = {
        ...location,
        id: `demo-loc-${Date.now()}`,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      demoLocs.unshift(newLoc);
      saveDemoLocations(demoLocs);
      return newLoc;
    }

    console.log('Attempting to save location to Supabase for user:', user.id);
    
    try {
      const { data, error, status, statusText } = await supabase
        .from('saved_locations')
        .insert([{
          ...location,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.warn('Supabase Error saving location. Falling back to local storage:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status,
          statusText
        });
        const demoLocs = getDemoLocations();
        const newLoc: SavedLocation = {
          ...location,
          id: `local-fallback-loc-${Date.now()}`,
          user_id: user.id,
          created_at: new Date().toISOString()
        };
        demoLocs.unshift(newLoc);
        saveDemoLocations(demoLocs);
        return newLoc;
      }
      
      console.log('Location saved successfully:', data);
      return data as SavedLocation;
    } catch (err) {
      console.warn('Network or database exception in addSavedLocation. Falling back to local storage:', err);
      const demoLocs = getDemoLocations();
      const newLoc: SavedLocation = {
        ...location,
        id: `local-fallback-loc-${Date.now()}`,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      demoLocs.unshift(newLoc);
      saveDemoLocations(demoLocs);
      return newLoc;
    }
  },

  async updateSavedLocation(id: string, location: Partial<SavedLocation>) {
    const savedDemo = localStorage.getItem('demo_user');
    const isDemo = savedDemo ? JSON.parse(savedDemo)?.user?.id === 'demo-user-id' : false;

    if (isDemo || id.startsWith('demo-loc-') || id.startsWith('local-fallback-loc-')) {
      const demoLocs = getDemoLocations();
      const updated = demoLocs.map(loc => {
        if (loc.id === id) {
          return { ...loc, ...location };
        }
        return loc;
      });
      saveDemoLocations(updated);
      const found = updated.find(loc => loc.id === id);
      if (!found) throw new Error('Localização não encontrada');
      return found;
    }

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .update(location)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase update failed. Falling back to local storage:', error.message);
        const demoLocs = getDemoLocations();
        const updated = demoLocs.map(loc => {
          if (loc.id === id) {
            return { ...loc, ...location };
          }
          return loc;
        });
        saveDemoLocations(updated);
        const found = updated.find(loc => loc.id === id);
        if (!found) throw new Error('Localização não encontrada');
        return found;
      }
      return data as SavedLocation;
    } catch (err) {
      console.warn('Network or database exception in updateSavedLocation. Falling back to local storage:', err);
      const demoLocs = getDemoLocations();
      const updated = demoLocs.map(loc => {
        if (loc.id === id) {
          return { ...loc, ...location };
        }
        return loc;
      });
      saveDemoLocations(updated);
      const found = updated.find(loc => loc.id === id);
      if (!found) throw new Error('Localização não encontrada');
      return found;
    }
  },

  async deleteSavedLocation(id: string) {
    const savedDemo = localStorage.getItem('demo_user');
    const isDemo = savedDemo ? JSON.parse(savedDemo)?.user?.id === 'demo-user-id' : false;

    if (isDemo || id.startsWith('demo-loc-') || id.startsWith('local-fallback-loc-')) {
      const demoLocs = getDemoLocations();
      const filtered = demoLocs.filter(loc => loc.id !== id);
      saveDemoLocations(filtered);
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase delete failed. Falling back to local storage:', error.message);
        const demoLocs = getDemoLocations();
        const filtered = demoLocs.filter(loc => loc.id !== id);
        saveDemoLocations(filtered);
      }
    } catch (err) {
      console.warn('Network or database exception in deleteSavedLocation. Falling back to local storage:', err);
      const demoLocs = getDemoLocations();
      const filtered = demoLocs.filter(loc => loc.id !== id);
      saveDemoLocations(filtered);
    }
  }
};
