import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  Navigation,
  Building,
  Phone,
  Mail,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Instagram,
  Youtube,
  Facebook,
} from 'lucide-react';
import { playSketchClick, playSquadJoinSound, playRadarPing } from '../utils/audio';
import { SquadBeacon, EventData, GamerSocialLinks } from '../types';
import { EventBuilding3D } from './EventBuilding3D';
import { useLocation } from '../context/LocationContext';
import { searchGlobalLocation, POPULAR_WORLD_CITIES } from '../utils/locationService';
import { TikTokIcon } from './SocialIcons';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (eventBeacon: SquadBeacon) => void;
}

export function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const { coords } = useLocation();

  const [eventName, setEventName] = useState('');
  const [durationDays, setDurationDays] = useState<number>(2);
  const [cityInput, setCityInput] = useState('');
  const [venueName, setVenueName] = useState('');
  const [mainAddress, setMainAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [socialDiscord, setSocialDiscord] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialTikTok, setSocialTikTok] = useState('');
  const [socialYouTube, setSocialYouTube] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTwitch, setSocialTwitch] = useState('');
  const [socialSteam, setSocialSteam] = useState('');
  const [showSocials, setShowSocials] = useState(false);
  const [description, setDescription] = useState('');

  // Global Geocoding state (Worldwide)
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<{
    cityName: string;
    lat: number;
    lng: number;
    country?: string;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with user's current location if available
  useEffect(() => {
    if (coords && !cityInput) {
      setCityInput(coords.cityName || 'Tokyo, Japan');
      setResolvedLocation({
        cityName: coords.cityName || 'Tokyo, Japan',
        lat: coords.lat,
        lng: coords.lng,
        country: coords.country,
      });
    }
  }, [coords]);

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate expiration date
  const calculatedExpiration = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const handleCityInputChange = (val: string) => {
    setCityInput(val);
    setLocationError(null);
    setFormError(null);
  };

  const handleUseCurrentLocation = () => {
    playSketchClick();
    if (coords) {
      setCityInput(coords.cityName || 'Current GPS Sector');
      setResolvedLocation({
        cityName: coords.cityName || 'Current GPS Sector',
        lat: coords.lat,
        lng: coords.lng,
        country: coords.country,
      });
      playRadarPing();
    }
  };

  const handleManualVerify = async () => {
    const clean = cityInput.trim();
    if (!clean) {
      setLocationError('Please enter a city, region, or country.');
      return;
    }
    setIsResolvingLocation(true);
    setLocationError(null);
    try {
      const res = await searchGlobalLocation(clean);
      if (res) {
        setResolvedLocation({
          cityName: res.cityName,
          lat: res.lat,
          lng: res.lng,
          country: res.country,
        });
        setCityInput(res.cityName);
        playRadarPing();
      } else {
        setLocationError(`Location "${clean}" not found. Please check spelling or select from quick list.`);
      }
    } catch {
      setLocationError('Lookup timed out. Please try again.');
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!eventName.trim()) {
      setFormError('Please enter an event name.');
      return;
    }

    if (!cityInput.trim()) {
      setFormError('Please enter an event city or location.');
      return;
    }

    if (!description.trim()) {
      setFormError('Please provide a short description about the event.');
      return;
    }

    setIsSubmitting(true);
    playSketchClick();

    let finalLoc = resolvedLocation;
    if (!finalLoc) {
      const res = await searchGlobalLocation(cityInput.trim());
      if (res) {
        finalLoc = {
          cityName: res.cityName,
          lat: res.lat,
          lng: res.lng,
          country: res.country,
        };
      }
    }

    if (!finalLoc) {
      setFormError('Could not locate city. Please enter a valid city or country.');
      setIsSubmitting(false);
      return;
    }

    const targetCity = finalLoc.cityName;
    const targetAddress = mainAddress.trim()
      ? `${mainAddress.trim()}, ${targetCity}`
      : venueName.trim()
      ? `${venueName.trim()}, ${targetCity}`
      : targetCity;

    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const socialLinks: GamerSocialLinks = {};
    if (socialDiscord.trim()) socialLinks.discord = socialDiscord.trim();
    if (socialInstagram.trim()) socialLinks.instagram = socialInstagram.trim();
    if (socialTwitter.trim()) socialLinks.twitter = socialTwitter.trim();
    if (socialTikTok.trim()) socialLinks.tiktok = socialTikTok.trim();
    if (socialYouTube.trim()) socialLinks.youtube = socialYouTube.trim();
    if (socialFacebook.trim()) socialLinks.facebook = socialFacebook.trim();
    if (socialTwitch.trim()) socialLinks.twitch = socialTwitch.trim();
    if (socialSteam.trim()) socialLinks.steam = socialSteam.trim();

    const hasSocials = Object.keys(socialLinks).length > 0;

    const eventData: EventData = {
      name: eventName.trim(),
      durationDays,
      locationAddress: targetAddress,
      mainAddress: mainAddress.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      socialLinks: hasSocials ? socialLinks : undefined,
      description: description.trim(),
      lat: finalLoc.lat,
      lng: finalLoc.lng,
      cityName: targetCity,
      createdAt,
      expiresAt,
      buildingType: 'grand_event',
    };

    const eventBeacon: SquadBeacon = {
      id: `event-${Date.now()}`,
      name: eventName.trim(),
      game: eventName.trim(),
      genre: 'Other',
      rank: 'Open to All',
      currentMembers: 1,
      maxMembers: 100,
      sector: targetCity,
      locationName: venueName.trim() || mainAddress.trim() || targetCity,
      locationAddress: targetAddress,
      mainAddress: mainAddress.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      socialLinks: hasSocials ? socialLinks : undefined,
      lat: finalLoc.lat,
      lng: finalLoc.lng,
      x: 50,
      y: 50,
      micRequired: false,
      playstyle: 'Tournament',
      description: description.trim(),
      lookingFor: ['All Gamers', 'Spectators', 'Competitors'],
      pingMs: 15,
      members: [
        {
          id: `host-${Date.now()}`,
          name: 'Event Host',
          avatarSeed: eventName.trim(),
          role: 'Event Organizer',
          isLeader: true,
        },
      ],
      accentColor: 'amber',
      beaconType: 'other_event',
      buildingType: 'grand_event',
      durationDays,
      expiresAt,
      eventData,
    };

    playSquadJoinSound();
    onEventCreated(eventBeacon);
    setIsSubmitting(false);
    onClose();
  };

  const DURATION_PRESETS = [1, 2, 3, 5, 7, 14, 30];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSketchClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md select-none overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#030907] text-slate-100 p-5 sm:p-7 relative border my-auto transition-all shadow-[0_0_50px_rgba(234,179,8,0.35)] cursor-default"
        style={{
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          borderColor: '#eab308',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-amber-500/30 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(234,179,8,0.5)]">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-display text-white tracking-wide">
                  Create Public Event
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50 rounded-full">
                  No Sign-In Required
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-sketch">
                Plots your 3D Grand Event Hall building directly on the live map
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playSketchClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
            title="Close [Esc]"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/80 rounded-lg text-xs font-sketch text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row: 3D Grand Event Hall Preview Card */}
          <div className="p-3.5 bg-gradient-to-r from-[#0d0914] via-[#090b14] to-[#0d0914] border border-amber-500/40 rounded-xl flex flex-col sm:flex-row items-center gap-4 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <div className="relative w-36 h-28 flex-shrink-0 bg-black/60 rounded-lg border border-amber-400/50 overflow-hidden flex items-center justify-center shadow-inner">
              <EventBuilding3D eventTitle={eventName || 'GRAND EVENT HALL'} width={144} height={112} />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/80 border border-amber-400 rounded text-[9px] font-mono text-amber-300">
                3D MAP PIN
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold font-display text-amber-300 uppercase tracking-wider">
                  Grand Event Hall Building (Exclusive)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sketch leading-relaxed">
                Features golden columns, royal purple roof crest, red carpet entrance, stanchions, sweeping spotlights, and floating gold sparkles.
              </p>
            </div>
          </div>

          {/* 1. Name of Event */}
          <div>
            <label className="block text-xs font-bold font-display text-amber-300 uppercase tracking-wider mb-1.5">
              Name of Event *
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Smash Bros Weekly Showdown, Apex Legends LAN, Retro Arcade Gala"
              className="w-full px-3.5 py-2.5 bg-[#020503] border border-amber-500/50 hover:border-amber-400 focus:border-amber-400 rounded-lg text-sm text-amber-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all font-sketch"
              required
            />
          </div>

          {/* 2. How Many Days (Duration) with Auto-Delete Notice */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold font-display text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>How Many Days? (Duration) *</span>
              </label>
              <span className="text-[11px] font-mono text-amber-400/90 font-bold">
                {durationDays} {durationDays === 1 ? 'Day' : 'Days'} Duration
              </span>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    setDurationDays(d);
                  }}
                  className={`px-3 py-1 text-xs font-display font-bold rounded-md border cursor-pointer transition-all ${
                    durationDays === d
                      ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(234,179,8,0.7)] scale-105'
                      : 'bg-black/60 text-slate-300 border-amber-500/30 hover:border-amber-400 hover:text-amber-200'
                  }`}
                >
                  {d} {d === 1 ? 'Day' : 'Days'}
                </button>
              ))}
            </div>

            {/* Auto-Delete Info Box */}
            <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-lg flex items-center justify-between text-[11px] font-sketch text-amber-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                <span>
                  <strong>Auto-Deletes:</strong> Post automatically vanishes from map in{' '}
                  <strong className="text-amber-300">{durationDays} days</strong> on{' '}
                  {calculatedExpiration.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at {calculatedExpiration.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                </span>
              </div>
            </div>
          </div>

          {/* 3. Event Location by City or GPS (Worldwide) */}
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold font-display text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Event City / Region (Worldwide) *</span>
                </label>
                {coords && (
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="text-[11px] font-sketch text-lime-400 hover:text-lime-300 flex items-center gap-1 cursor-pointer underline"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Use My Location (GPS)</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualVerify();
                    }
                  }}
                  placeholder="Enter city or country (e.g. Tokyo, London, Dallas, Berlin)"
                  className="flex-1 min-w-0 w-full px-3.5 py-2.5 bg-[#020503] border border-amber-500/50 hover:border-amber-400 focus:border-amber-400 rounded-lg text-sm text-amber-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={handleManualVerify}
                  disabled={isResolvingLocation || !cityInput.trim()}
                  className="w-full sm:w-auto shrink-0 whitespace-nowrap px-4 py-2.5 bg-amber-950/90 hover:bg-amber-900 border border-amber-400/80 rounded-lg text-xs font-bold font-display text-amber-200 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(234,179,8,0.3)] active:scale-95"
                >
                  <Search className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{isResolvingLocation ? 'Locating...' : 'Locate City'}</span>
                </button>
              </div>

              {/* Verified Location Feedback */}
              {resolvedLocation && (
                <div className="mt-1.5 p-2 bg-emerald-950/60 border border-emerald-400/60 rounded text-[11px] font-sketch text-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">
                    <strong>Verified Location:</strong> {resolvedLocation.cityName} · Lat {resolvedLocation.lat.toFixed(3)}, Lng {resolvedLocation.lng.toFixed(3)}
                  </span>
                </div>
              )}
              {locationError && (
                <div className="mt-1.5 p-2 bg-amber-950/60 border border-amber-500/60 rounded text-[11px] font-sketch text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}
            </div>

            {/* Optional Venue / Hall Name */}
            <div>
              <label className="block text-xs font-bold font-display text-amber-300/80 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>Venue / Hall Name (Optional)</span>
                </span>
                <span className="text-[10px] text-amber-400/70 font-mono">Optional</span>
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. San Diego Convention Center, Downtown Arcade Lounge, Civic Arena"
                className="w-full px-3.5 py-2.5 bg-[#020503] border border-amber-500/30 hover:border-amber-400/60 focus:border-amber-400 rounded-lg text-xs sm:text-sm text-amber-100 placeholder-slate-500 focus:outline-none transition-all font-sketch"
              />
            </div>

            {/* Optional Main Street / Physical Address */}
            <div>
              <label className="block text-xs font-bold font-display text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Main Physical Address (Optional)</span>
                </span>
                <span className="text-[10px] text-amber-400/70 font-mono">Optional</span>
              </label>
              <input
                type="text"
                value={mainAddress}
                onChange={(e) => setMainAddress(e.target.value)}
                placeholder="e.g. 111 W Harbor Dr or 742 Evergreen Terrace, Suite 200"
                className="w-full px-3.5 py-2.5 bg-[#020503] border border-amber-500/30 hover:border-amber-400/60 focus:border-amber-400 rounded-lg text-xs sm:text-sm text-amber-100 placeholder-slate-500 focus:outline-none transition-all font-sketch"
              />
              <p className="mt-1 text-[11px] text-slate-400 font-sketch">
                Attendees will get direct Google Maps navigation to this exact street address.
              </p>
            </div>

            {/* Optional Contact Phone & Contact Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold font-display text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-green-400" />
                    <span>Contact Phone (Optional)</span>
                  </span>
                  <span className="text-[10px] text-amber-400/70 font-mono">Optional</span>
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. (555) 234-5678 (Call / Text)"
                  className="w-full px-3.5 py-2 bg-[#020503] border border-amber-500/30 hover:border-amber-400/60 focus:border-amber-400 rounded-lg text-xs text-amber-100 placeholder-slate-500 focus:outline-none transition-all font-sketch"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-display text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contact Email (Optional)</span>
                  </span>
                  <span className="text-[10px] text-amber-400/70 font-mono">Optional</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. eventorganizer@domain.com"
                  className="w-full px-3.5 py-2 bg-[#020503] border border-amber-500/30 hover:border-amber-400/60 focus:border-amber-400 rounded-lg text-xs text-amber-100 placeholder-slate-500 focus:outline-none transition-all font-sketch"
                />
              </div>
            </div>

            {/* Optional Social Media Links & Usernames */}
            <div className="p-3 bg-black/60 border border-amber-500/30 rounded-xl space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  setShowSocials(!showSocials);
                }}
                className="w-full flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold font-display text-amber-300 uppercase tracking-wider block">
                      Social Media Links & Usernames (Optional)
                    </span>
                    <span className="text-[11px] text-slate-400 font-sketch">
                      Discord, Instagram, X (Twitter), TikTok, YouTube, Facebook, Twitch, Steam
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400 font-sketch group-hover:text-amber-300 shrink-0">
                  <span>{showSocials ? 'Collapse' : 'Add Links'}</span>
                  {showSocials ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {showSocials && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-amber-500/20">
                  {/* Discord */}
                  <div>
                    <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                      <span className="font-bold text-[#818cf8]">Discord</span>
                      <span className="text-[10px] text-slate-400">(Server or User)</span>
                    </label>
                    <input
                      type="text"
                      value={socialDiscord}
                      onChange={(e) => setSocialDiscord(e.target.value)}
                      placeholder="e.g. discord.gg/event or user#1234"
                      className="w-full px-2.5 py-1.5 bg-[#010603] border border-amber-500/40 focus:border-[#818cf8] rounded text-xs text-amber-100 focus:outline-none transition-colors font-sketch"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      <span>Instagram (@handle or link)</span>
                    </label>
                    <input
                      type="text"
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                      placeholder="e.g. @grandtournament or instagram.com/..."
                      className="w-full px-2.5 py-1.5 bg-[#010603] border border-amber-500/40 focus:border-pink-400 rounded text-xs text-amber-100 focus:outline-none transition-colors font-sketch"
                    />
                  </div>

                  {/* X / Twitter */}
                  <div>
                    <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                      <span className="font-bold text-sky-400">X / Twitter</span>
                      <span className="text-[10px] text-slate-400">(@handle or link)</span>
                    </label>
                    <input
                      type="text"
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                      placeholder="e.g. @eventhq or x.com/..."
                      className="w-full px-2.5 py-1.5 bg-[#010603] border border-amber-500/40 focus:border-sky-400 rounded text-xs text-amber-100 focus:outline-none transition-colors font-sketch"
                    />
                  </div>

                  {/* TikTok */}
                  <div>
                    <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                      <TikTokIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>TikTok (@handle or link)</span>
                    </label>
                    <input
                      type="text"
                      value={socialTikTok}
                      onChange={(e) => setSocialTikTok(e.target.value)}
                      placeholder="e.g. @eventorganizer or tiktok.com/@..."
                      className="w-full px-2.5 py-1.5 bg-[#010603] border border-amber-500/40 focus:border-cyan-400 rounded text-xs text-amber-100 focus:outline-none transition-colors font-sketch"
                    />
                  </div>

                  {/* YouTube */}
                  <div>
                    <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                      <span>YouTube (Channel or link)</span>
                    </label>
                    <input
                      type="text"
                      value={socialYouTube}
                      onChange={(e) => setSocialYouTube(e.target.value)}
                      placeholder="e.g. @eventchannel or youtube.com/@..."
                      className="w-full px-2.5 py-1.5 bg-[#010603] border border-amber-500/40 focus:border-red-400 rounded text-xs text-amber-100 focus:outline-none transition-colors font-sketch"
                    />
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                      <Facebook className="w-3.5 h-3.5 text-blue-500" />
                      <span>Facebook (Page or Event link)</span>
                    </label>
                    <input
                      type="text"
                      value={socialFacebook}
                      onChange={(e) => setSocialFacebook(e.target.value)}
                      placeholder="e.g. facebook.com/events/..."
                      className="w-full px-2.5 py-1.5 bg-[#010603] border border-amber-500/40 focus:border-blue-400 rounded text-xs text-amber-100 focus:outline-none transition-colors font-sketch"
                    />
                  </div>

                  {/* Twitch */}
                  <div>
                    <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                      <span className="font-bold text-[#a855f7]">Twitch</span>
                      <span className="text-[10px] text-slate-400">(Stream link or username)</span>
                    </label>
                    <input
                      type="text"
                      value={socialTwitch}
                      onChange={(e) => setSocialTwitch(e.target.value)}
                      placeholder="e.g. twitch.tv/eventstream"
                      className="w-full px-2.5 py-1.5 bg-[#010603] border border-amber-500/40 focus:border-[#a855f7] rounded text-xs text-amber-100 focus:outline-none transition-colors font-sketch"
                    />
                  </div>

                  {/* Steam */}
                  <div>
                    <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                      <span className="font-bold text-slate-300">Steam</span>
                      <span className="text-[10px] text-slate-400">(Group or link)</span>
                    </label>
                    <input
                      type="text"
                      value={socialSteam}
                      onChange={(e) => setSocialSteam(e.target.value)}
                      placeholder="e.g. steamcommunity.com/groups/..."
                      className="w-full px-2.5 py-1.5 bg-[#010603] border border-amber-500/40 focus:border-slate-400 rounded text-xs text-amber-100 focus:outline-none transition-colors font-sketch"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Description */}
          <div>
            <label className="block text-xs font-bold font-display text-amber-300 uppercase tracking-wider mb-1.5">
              Event Description & Schedule *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the event, entry fees or free admission, tournament bracket rules, prizes, schedule, Discord links, and who can attend..."
              className="w-full px-3.5 py-2.5 bg-[#020503] border border-amber-500/50 hover:border-amber-400 focus:border-amber-400 rounded-lg text-xs text-amber-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all font-sketch leading-relaxed"
              required
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-amber-500/20">
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onClose();
              }}
              className="px-4 py-2.5 text-xs font-bold font-display text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="max-w-full px-5 sm:px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black font-display text-xs tracking-wider rounded-lg shadow-[0_0_24px_rgba(234,179,8,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-black shrink-0" />
              <span className="truncate">{isSubmitting ? 'Posting Event...' : 'Post Event to Live Map'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
