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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>) {
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
  }
};
