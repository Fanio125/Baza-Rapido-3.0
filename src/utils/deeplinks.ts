/**
 * Mobility Apps Deep Link Integration Utility
 * Implements official deep links for Yango, with extensions for future apps support.
 */

import { Location as TLocation } from '../types';

/**
 * Opens the Yango mobile application using the official Yango Partner Program route.
 * Includes complete fallback for mobile web browsers if the native application is not installed.
 */
export function abrirYango(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): void {
  const url = `https://yango.go.link/route?start-lat=${startLat}&start-lon=${startLon}&end-lat=${endLat}&end-lon=${endLon}&ref=bazarapido&adj_t=vokme8e_nd9s9z9&adj_deeplink_js=1&adj_fallback=https://yango.com/en_int/order`;

  // Redirect the current window/webview to the deep link
  window.location.href = url;
}

/**
 * Base template to open Uber deep links with pickup and dropoff coordinates.
 */
export function abrirUber(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): void {
  // Deep link format: uber://?action=setPickup&pickup[latitude]=&pickup[longitude]=...
  // Universal link fallback: https://m.uber.com/ul/?action=setPickup...
  const url = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${startLat}&pickup[longitude]=${startLon}&dropoff[latitude]=${endLat}&dropoff[longitude]=${endLon}`;
  window.location.href = url;
}

/**
 * Base template to open Heetch deep links.
 */
export function abrirHeetch(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): void {
  // Deep link format or generic web fallback
  const url = `heetch://ride?pickup_lat=${startLat}&pickup_lng=${startLon}&dropoff_lat=${endLat}&dropoff_lng=${endLon}`;
  // For safety without browser popup blocking, we fallback to a web route or open standard
  const webFallback = `https://www.heetch.com/en`;
  
  // Custom smart redirection strategy
  const start = Date.now();
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.location.href = webFallback;
    }
  }, 1000);
  
  window.location.href = url;
}

/**
 * Base template to open T'Leva deep links.
 */
export function abrirTLeva(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): void {
  // Placeholder deep links logic for T'Leva, fallback to landing page
  const appLink = `tleva://booking?start_lat=${startLat}&start_lng=${startLon}&end_lat=${endLat}&end_lng=${endLon}`;
  const webFallback = `https://tleva.com`;
  
  const start = Date.now();
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.location.href = webFallback;
    }
  }, 1000);
  
  window.location.href = appLink;
}

/**
 * Base template to open Bolt deep links.
 */
export function abrirBolt(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): void {
  const appLink = `bolt://pickup?pickup[lat]=${startLat}&pickup[lng]=${startLon}&dropoff[lat]=${endLat}&dropoff[lng]=${endLon}`;
  const webFallback = `https://bolt.eu`;
  
  const start = Date.now();
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.location.href = webFallback;
    }
  }, 1000);
  
  window.location.href = appLink;
}

/**
 * Base template to open inDrive deep links.
 */
export function abrirInDrive(
  _startLat: number,
  _startLon: number,
  _endLat: number,
  _endLon: number
): void {
  const appLink = `indrive://`;
  const webFallback = `https://indrive.com`;
  
  const start = Date.now();
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.location.href = webFallback;
    }
  }, 1000);
  
  window.location.href = appLink;
}

/**
 * Base template to open UGO deep links.
 */
export function abrirUGO(
  _startLat: number,
  _startLon: number,
  _endLat: number,
  _endLon: number
): void {
  const appLink = `ugo://`;
  const webFallback = `https://ugotaxi.ao`;
  
  const start = Date.now();
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.location.href = webFallback;
    }
  }, 1000);
  
  window.location.href = appLink;
}

/**
 * Base template to open Vambanzar deep links.
 */
export function abrirVambanzar(
  _startLat: number,
  _startLon: number,
  _endLat: number,
  _endLon: number
): void {
  const appLink = `vambazar://`;
  const webFallback = `https://vambanzar.com`;
  
  const start = Date.now();
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.location.href = webFallback;
    }
  }, 1000);
  
  window.location.href = appLink;
}

/**
 * Base template to open Anda deep links.
 */
export function abrirAnda(
  _startLat: number,
  _startLon: number,
  _endLat: number,
  _endLon: number
): void {
  const appLink = `anda://ride`;
  const webFallback = `https://play.google.com/store/apps/details?id=com.anda.passenger`;
  
  const start = Date.now();
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      window.location.href = webFallback;
    }
  }, 1000);
  
  window.location.href = appLink;
}

/**
 * Main dispatcher to route deep links based on the specific application ID.
 * Supports the official apps: 'yango', 'bolt', 'indrive', 'uber', 'heetch', 'ugo', 'tleva', 'vambazar', 'anda'
 */
export function triggerDeepLink(
  appId: string,
  origin?: TLocation,
  destination?: TLocation
): void {
  if (!origin || !destination) {
    console.error('Cannot open deep link: Missing origin or destination coordinates.');
    return;
  }

  const startLat = origin.lat;
  const startLon = origin.lng;
  const endLat = destination.lat;
  const endLon = destination.lng;

  const normalizedAppId = appId.toLowerCase();

  // Log and track request frequency in localStorage
  try {
    const countKey = 'ride_app_requests_count';
    const currentCountsStr = localStorage.getItem(countKey);
    const currentCounts = currentCountsStr ? JSON.parse(currentCountsStr) : {};
    currentCounts[normalizedAppId] = (currentCounts[normalizedAppId] || 0) + 1;
    localStorage.setItem(countKey, JSON.stringify(currentCounts));
  } catch (error) {
    console.error('Error updating ride app request counts in localStorage:', error);
  }

  switch (normalizedAppId) {
    case 'yango':
      abrirYango(startLat, startLon, endLat, endLon);
      break;
    case 'bolt':
      abrirBolt(startLat, startLon, endLat, endLon);
      break;
    case 'indrive':
      abrirInDrive(startLat, startLon, endLat, endLon);
      break;
    case 'uber':
      abrirUber(startLat, startLon, endLat, endLon);
      break;
    case 'heetch':
      abrirHeetch(startLat, startLon, endLat, endLon);
      break;
    case 'ugo':
      abrirUGO(startLat, startLon, endLat, endLon);
      break;
    case 'tleva':
      abrirTLeva(startLat, startLon, endLat, endLon);
      break;
    case 'vambazar':
      abrirVambanzar(startLat, startLon, endLat, endLon);
      break;
    case 'anda':
      abrirAnda(startLat, startLon, endLat, endLon);
      break;
    default:
      console.warn(`Deep link dispatch generic fallback for App: ${appId}`);
      abrirYango(startLat, startLon, endLat, endLon);
      break;
  }
}
