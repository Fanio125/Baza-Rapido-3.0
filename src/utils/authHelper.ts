import { User } from '@supabase/supabase-js';

/**
 * Helper function to verify if the logged-in user is an admin
 * and has complete profile data (full name and phone).
 * 
 * @param user The current Supabase user
 * @returns boolean indicating if the admin is fully authenticated with complete data
 */
export function isAdminAuthenticated(user: User | null): boolean {
  if (!user) return false;
  
  // Verify if user email belongs to the admin
  const isAdmin = user.email === 'frankmanuel123.com@gmail.com';
  if (!isAdmin) return false;
  
  // Verify if profile data is complete
  const hasName = !!user.user_metadata?.full_name?.trim();
  const hasPhone = !!user.user_metadata?.phone?.trim();
  
  return hasName && hasPhone;
}

/**
 * Helper to analyze admin auth status and determine if a redirection
 * to the profile page is required (due to expired session or incomplete data).
 * 
 * @param user The current Supabase user
 * @returns Object with details about the admin status and redirection need
 */
export function getAdminAuthStatus(user: User | null): {
  isAdmin: boolean;
  isSessionActive: boolean;
  isProfileComplete: boolean;
  needsRedirectToProfile: boolean;
} {
  const isSessionActive = !!user;
  const isAdmin = user?.email === 'frankmanuel123.com@gmail.com';
  
  if (!isSessionActive) {
    return {
      isAdmin: false,
      isSessionActive: false,
      isProfileComplete: false,
      needsRedirectToProfile: true, // Session expired -> redirect to profile/login
    };
  }
  
  if (!isAdmin) {
    return {
      isAdmin: false,
      isSessionActive: true,
      isProfileComplete: true,
      needsRedirectToProfile: false, // Normal user -> no admin-specific profile redirect needed here
    };
  }
  
  const hasName = !!user.user_metadata?.full_name?.trim();
  const hasPhone = !!user.user_metadata?.phone?.trim();
  const isProfileComplete = hasName && hasPhone;
  
  return {
    isAdmin: true,
    isSessionActive: true,
    isProfileComplete,
    needsRedirectToProfile: !isProfileComplete, // Admin with incomplete data -> redirect to profile
  };
}
