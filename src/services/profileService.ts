import { supabase } from '../lib/supabase';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  photo_url?: string;
}

export const profileService = {
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch (err) {
      console.warn('Network error getting profile from Supabase:', err);
      throw err;
    }
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Network error updating profile in Supabase:', err);
      throw err;
    }
  }
};
