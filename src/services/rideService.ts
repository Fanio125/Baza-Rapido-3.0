import { TaxiApp, TAXI_APPS } from '../constants';
import { ComparisonResult, Location } from '../types';

/**
 * Service to calculate and compare ride prices.
 * Structured to allow easy integration with real APIs (Uber, Bolt, Yango).
 */
export class RideService {
  /**
   * Calculates estimates for all registered taxi apps.
   * In the future, this method would call real APIs in parallel via Edge Functions.
   */
   async getEstimates(origin: Location, destination: Location, realDistance?: number): Promise<ComparisonResult[]> {
    // 1. Calculate distance (use real route distance if provided, otherwise fallback to straight line)
    const distance = realDistance !== undefined ? realDistance : this.calculateDistance(origin, destination);
    
    // 2. Map through apps and calculate estimated prices
    const estimates: ComparisonResult[] = TAXI_APPS.map(app => {
      return this.calculateAppEstimate(app, distance);
    });

    // 3. Post-process to mark winners
    return this.calculateWinners(estimates);
  }

  private calculateAppEstimate(app: TaxiApp, distance: number): ComparisonResult {
    // Basic formula: Base + (PricePerKm * distance) * factor
    // factor can be used to simulate surge pricing during rush hour
    const rushHourFactor = this.isRushHour() ? 1.2 : 1.0;
    const price = Math.round(app.basePrice + (app.pricePerKm * distance * rushHourFactor));
    
    // Estimate travel time (base 3 mins/km + waiting time)
    const travelTime = Math.round((distance * 2.5 * app.travelTimeFactor) + app.waitingTime);

    return {
      appId: app.id,
      name: app.name,
      logo: app.logo,
      price,
      waitingTime: app.waitingTime,
      travelTime,
      carType: app.carType,
      rating: app.rating,
      paymentMethods: app.paymentMethods,
      isCheapest: false,
      isFastest: false,
      isBestRated: false,
    };
  }

  private calculateDistance(origin: Location, destination: Location): number {
    // Simple Euclidean for demo, or Haversine if needed
    const rad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = rad(destination.lat - origin.lat);
    const dLon = rad(destination.lng - origin.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(origin.lat)) * Math.cos(rad(destination.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    
    // Return minimum 1km if destinations are very close
    return Math.max(1, parseFloat(d.toFixed(2)));
  }

  private isRushHour(): boolean {
    const hour = new Date().getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }

  private calculateWinners(results: ComparisonResult[]): ComparisonResult[] {
    if (results.length === 0) return [];

    const sortedByPrice = [...results].sort((a, b) => a.price - b.price);
    const sortedBySpeed = [...results].sort((a, b) => (a.waitingTime + a.travelTime) - (b.waitingTime + b.travelTime));
    const sortedByRating = [...results].sort((a, b) => b.rating - a.rating);

    const newResults = results.map(res => ({
      ...res,
      isCheapest: res.appId === sortedByPrice[0].appId,
      isFastest: res.appId === sortedBySpeed[0].appId,
      isBestRated: res.appId === sortedByRating[0].appId,
    }));

    return newResults.sort((a, b) => a.price - b.price);
  }
}

export const rideService = new RideService();
