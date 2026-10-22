import React, { createContext, useContext, useState } from 'react';
import { playRadarPing, playSquadJoinSound, playSketchClick } from '../utils/audio';
import {
  searchGlobalLocation,
  reverseGeocodeCoordinates,
  POPULAR_WORLD_CITIES,
  GlobalLocationResult,
} from '../utils/locationService';

export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  cityName?: string;
  country?: string;
}

export const POPULAR_CITIES = POPULAR_WORLD_CITIES;

interface LocationContextType {
  coords: UserCoordinates | null;
  status: 'idle' | 'requesting' | 'granted' | 'denied';
  errorMessage: string | null;
  isLive: boolean;
  searchRadiusKm: number;
  requestLocation: () => Promise<UserCoordinates | null>;
  setManualLocation: (cityName: string, lat: number, lng: number, country?: string) => void;
  searchAndSetLocation: (query: string) => Promise<UserCoordinates | null>;
  setIsLive: (live: boolean) => void;
  setSearchRadiusKm: (radius: number) => void;
  getDistanceKm: (targetLat: number, targetLng: number) => number | null;
  formatDistance: (km: number | null) => string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Haversine formula to compute distance in km
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<UserCoordinates | null>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('squadup_user_location_coords');
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return null;
  });
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLive, setIsLiveState] = useState<boolean>(true);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(50);

  const requestLocation = (): Promise<UserCoordinates | null> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setStatus('denied');
        setErrorMessage('Geolocation is not supported by this browser.');
        resolve(null);
        return;
      }

      setStatus('requesting');
      setErrorMessage(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          const rev = await reverseGeocodeCoordinates(lat, lng);

          const userCoords: UserCoordinates = {
            lat,
            lng,
            accuracy,
            cityName: rev.cityName,
            country: rev.country,
          };
          setCoords(userCoords);
          try {
            localStorage.setItem('squadup_user_location_coords', JSON.stringify(userCoords));
          } catch {}
          setStatus('granted');
          playRadarPing();
          resolve(userCoords);
        },
        (error) => {
          setStatus('denied');
          let msg = 'Location permission was denied by your browser or operating system.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission is blocked in your browser settings or preview frame.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'GPS location is currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out.';
          }
          setErrorMessage(msg);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    });
  };

  const setManualLocation = (cityName: string, lat: number, lng: number, country?: string) => {
    playSketchClick();
    const userCoords: UserCoordinates = { lat, lng, accuracy: 100, cityName, country };
    setCoords(userCoords);
    try {
      localStorage.setItem('squadup_user_location_coords', JSON.stringify(userCoords));
    } catch {}
    setStatus('granted');
    setErrorMessage(null);
    playRadarPing();
  };

  const searchAndSetLocation = async (query: string): Promise<UserCoordinates | null> => {
    try {
      const result = await searchGlobalLocation(query);
      if (result) {
        const userCoords: UserCoordinates = {
          lat: result.lat,
          lng: result.lng,
          accuracy: 50,
          cityName: result.cityName,
          country: result.country,
        };
        setCoords(userCoords);
        try {
          localStorage.setItem('squadup_user_location_coords', JSON.stringify(userCoords));
        } catch {}
        setStatus('granted');
        setErrorMessage(null);
        playRadarPing();
        return userCoords;
      }
      return null;
    } catch {
      return null;
    }
  };

  const setIsLive = (live: boolean) => {
    playSketchClick();
    if (live) {
      playSquadJoinSound();
    }
    setIsLiveState(live);
  };

  const getDistanceKm = (targetLat: number, targetLng: number): number | null => {
    if (!coords) return null;
    return haversineDistanceKm(coords.lat, coords.lng, targetLat, targetLng);
  };

  const formatDistance = (km: number | null): string => {
    if (km === null) return 'Nearby';
    if (km < 1) return `${Math.round(km * 1000)} m away`;
    return `${km.toFixed(1)} km away`;
  };

  return (
    <LocationContext.Provider
      value={{
        coords,
        status,
        errorMessage,
        isLive,
        searchRadiusKm,
        requestLocation,
        setManualLocation,
        searchAndSetLocation,
        setIsLive,
        setSearchRadiusKm,
        getDistanceKm,
        formatDistance,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
