import React, { useState } from 'react';
import { MapPin, Radio, Shield, X, Compass, HelpCircle, Search, RefreshCw, Globe, Navigation } from 'lucide-react';
import { useLocation, POPULAR_CITIES } from '../context/LocationContext';
import { playSketchClick, playRadarPing } from '../utils/audio';

interface LocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationGranted?: () => void;
  onOpenPinDropMode?: () => void;
}

export function LocationPromptModal({
  isOpen,
  onClose,
  onLocationGranted,
  onOpenPinDropMode,
}: LocationPromptModalProps) {
  const { requestLocation, setManualLocation, searchAndSetLocation, status, errorMessage } = useLocation();
  const [customCitySearch, setCustomCitySearch] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Method 1: One-Tap GPS Geolocation
  const handleEnableLocation = async () => {
    playSketchClick();
    const result = await requestLocation();
    if (result) {
      playRadarPing();
      if (onLocationGranted) {
        onLocationGranted();
      }
      onClose();
    }
  };

  // Quick preset click
  const handleSelectCity = (city: typeof POPULAR_CITIES[0]) => {
    playSketchClick();
    setManualLocation(city.cityName, city.lat, city.lng, city.country);
    if (onLocationGranted) {
      onLocationGranted();
    }
    onClose();
  };

  // Method 2: Global City / Region / Country Search
  const handleSearchCustomCity = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = customCitySearch.trim();
    if (!query) return;

    setIsSearchingCity(true);
    setSearchError(null);

    try {
      const res = await searchAndSetLocation(query);
      if (res) {
        if (onLocationGranted) {
          onLocationGranted();
        }
        onClose();
        return;
      }
      setSearchError('Location not found. Please enter any city, region, or country (e.g. Tokyo, London, Berlin).');
    } catch {
      setSearchError('Search timed out. Select a city below or drop a pin on the map.');
    } finally {
      setIsSearchingCity(false);
    }
  };

  // Method 3: Direct Map Tap / Pin Drop
  const handleDropPinOnMap = () => {
    playSketchClick();
    onClose();
    if (onOpenPinDropMode) {
      onOpenPinDropMode();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm select-none overflow-y-auto">
      <div
        className="w-full max-w-lg bg-[#030904] text-slate-100 p-6 relative border my-8"
        style={{
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          borderColor: '#22c55e',
          boxShadow: '0 0 40px rgba(34, 197, 94, 0.5), inset 0 0 25px rgba(34, 197, 94, 0.08)',
          filter: 'url(#sketch-glow)',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-green-500/20 mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-400 animate-pulse" />
            <h2 className="text-lg font-bold font-display text-white tracking-wide">
              Global Radar & Nearby Players
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Universal 3 Methods Explanation Banner */}
        <div className="p-3 bg-green-950/40 border border-green-500/40 rounded-xl mb-4 text-xs font-sketch text-slate-200 leading-relaxed">
          <p className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Works Worldwide:</strong> Share your gaming location from any country using one of three universal options below — GPS, global city search, or direct map pin drop.
            </span>
          </p>
        </div>

        {/* Why Location Was Denied Explanation Banner */}
        {status === 'denied' && (
          <div className="p-3 bg-amber-950/70 border border-amber-500/60 rounded mb-4 text-xs font-sketch text-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Browser GPS Blocked?</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              No problem! You don't need GPS. You can type any city worldwide below or tap anywhere on the map to set your location pin.
            </p>
          </div>
        )}

        {/* METHOD 1: One-Tap GPS Geolocation */}
        <div className="mb-4">
          <label className="block text-[11px] font-mono font-bold text-lime-400 uppercase tracking-wider mb-1.5">
            Method 1 · One-Tap GPS (Worldwide)
          </label>
          <button
            type="button"
            disabled={status === 'requesting'}
            onClick={handleEnableLocation}
            className="w-full py-2.5 px-4 text-xs font-bold font-display tracking-wider text-green-100 bg-green-900/80 hover:bg-green-800 border border-green-400 rounded cursor-pointer transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.5)] active:scale-95"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            {status === 'denied' ? (
              <>
                <RefreshCw className="w-4 h-4 text-green-300" />
                <span>Retry Browser / Phone GPS</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-green-300" />
                <span>{status === 'requesting' ? 'Scanning GPS...' : 'Use Current Device Location (GPS)'}</span>
              </>
            )}
          </button>
        </div>

        {/* METHOD 2: City / Region / Country Search */}
        <div className="mb-4">
          <label className="block text-[11px] font-mono font-bold text-lime-400 uppercase tracking-wider mb-1.5">
            Method 2 · Search Any City / Country
          </label>
          <form onSubmit={handleSearchCustomCity} className="relative">
            <input
              type="text"
              placeholder="Enter any city or country (e.g. Tokyo, London, São Paulo, Berlin)..."
              value={customCitySearch}
              onChange={(e) => setCustomCitySearch(e.target.value)}
              className="w-full pl-3 pr-24 py-2 bg-[#020603] border border-green-500/40 rounded text-xs text-green-100 placeholder-slate-500 focus:outline-none focus:border-green-400"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            />
            <button
              type="submit"
              disabled={isSearchingCity || !customCitySearch.trim()}
              className="absolute right-1 top-1 bottom-1 px-3 bg-green-950 hover:bg-green-900 border border-green-400/60 rounded text-xs font-sketch text-green-300 cursor-pointer disabled:opacity-50 flex items-center gap-1"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <Search className="w-3 h-3" />
              <span>{isSearchingCity ? 'Searching...' : 'Locate'}</span>
            </button>
          </form>
          {searchError && (
            <p className="text-[11px] text-amber-400 font-sketch mt-1">{searchError}</p>
          )}
        </div>

        {/* METHOD 3: Direct Map Tap / Pin Drop */}
        <div className="mb-4">
          <label className="block text-[11px] font-mono font-bold text-lime-400 uppercase tracking-wider mb-1.5">
            Method 3 · Direct Map Pin Drop
          </label>
          <button
            type="button"
            onClick={handleDropPinOnMap}
            className="w-full py-2 px-3 text-xs font-bold font-sketch text-lime-300 bg-[#041508] hover:bg-[#08230f] border border-lime-400/70 rounded cursor-pointer transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(163,230,53,0.3)] active:scale-95"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <Navigation className="w-3.5 h-3.5 text-lime-400" />
            <span>Tap Anywhere on Tactical Map to Plant Pin</span>
          </button>
        </div>

        {/* Popular Global Gaming Metros Quick-Select */}
        <div className="mb-4">
          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">
            Quick-Select Worldwide Hub:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {POPULAR_CITIES.slice(0, 12).map((city) => (
              <button
                key={city.cityName}
                type="button"
                onClick={() => handleSelectCity(city)}
                className="p-1.5 bg-[#040e06] hover:bg-green-950 border border-green-500/30 hover:border-green-400 rounded text-xs font-sketch text-slate-200 hover:text-green-200 transition-all flex items-center justify-between text-left"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <span className="truncate">{city.cityName.split(',')[0]}</span>
                <MapPin className="w-3 h-3 text-green-400 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-green-500/20 flex items-center justify-between text-[11px] font-sketch text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            <span>Approximate sector proximity shared. Exact street addresses never saved.</span>
          </span>
          <button
            type="button"
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white underline cursor-pointer ml-2 flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
