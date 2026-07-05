/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface ComparisonResult {
  appId: string;
  name: string;
  logo: string;
  price: number;
  waitingTime: number;
  travelTime: number;
  carType: string;
  rating: number;
  paymentMethods: string[];
  isCheapest: boolean;
  isFastest: boolean;
  isBestRated: boolean;
}

export type SavedLocationType = 'home' | 'work' | 'school' | 'other';

export interface SavedLocation {
  id: string;
  user_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: SavedLocationType;
  created_at: string;
}

export type ViewState = 'home' | 'comparing' | 'results' | 'profile' | 'history' | 'settings' | 'languages' | 'cities' | 'terms' | 'privacy' | 'version' | 'edit-profile' | 'ads';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface TripHistory {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  selected_app: string;
  price: number;
  created_at: string;
}

export interface RecentSearch {
  id: string;
  user_id: string;
  place_name: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}
