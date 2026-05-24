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
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Utilizador não autenticado');
    return user;
  },

  async getSavedLocations(userId: string) {
    if (!userId) return [];
    if (userId === 'demo-user-id') {
      return getDemoLocations();
    }
    const { data, error } = await supabase
      .from('saved_locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved locations:', error);
      return [];
    }
    return data as SavedLocation[];
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
    
    const { data, error, status, statusText } = await supabase
      .from('saved_locations')
      .insert([{
        ...location,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status,
        statusText
      });
      throw error;
    }
    
    console.log('Location saved successfully:', data);
    return data as SavedLocation;
  },

  async updateSavedLocation(id: string, location: Partial<SavedLocation>) {
    const savedDemo = localStorage.getItem('demo_user');
    const isDemo = savedDemo ? JSON.parse(savedDemo)?.user?.id === 'demo-user-id' : false;

    if (isDemo || id.startsWith('demo-loc-')) {
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

    const { data, error } = await supabase
      .from('saved_locations')
      .update(location)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SavedLocation;
  },

  async deleteSavedLocation(id: string) {
    const savedDemo = localStorage.getItem('demo_user');
    const isDemo = savedDemo ? JSON.parse(savedDemo)?.user?.id === 'demo-user-id' : false;

    if (isDemo || id.startsWith('demo-loc-')) {
      const demoLocs = getDemoLocations();
      const filtered = demoLocs.filter(loc => loc.id !== id);
      saveDemoLocations(filtered);
      return;
    }

    const { error } = await supabase
      .from('saved_locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
