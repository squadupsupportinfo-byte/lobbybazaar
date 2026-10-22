import React, { useState, useEffect } from 'react';
import { X, Radio, MapPin, Shield, AlertCircle, Navigation, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { SquadBeacon, ChatRoomData } from '../types';
import { searchGlobalLocation, POPULAR_WORLD_CITIES } from '../utils/locationService';
import { playSketchClick, playSquadJoinSound, playRadarPing } from '../utils/audio';
import { GameRoomBuilding3D } from './GameRoomBuilding3D';

interface CreateChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployChatRoom: (room: SquadBeacon) => void;
  onOpenAuthModal: (mode: 'signup' | 'signin') => void;
  existingRoom?: SquadBeacon | null;
  onSelectExistingRoom?: (room: SquadBeacon) => void;
  onDeleteExistingRoom?: (roomId: string) => void;
}

const PRESET_TOPICS = [
  'Apex Legends & FPS Ranked',
  'Valorant Daily Scrims',
  'Call of Duty Warzone Squads',
  'FGC & Fighting Games Lounge',
  'Co-op & Helldivers 2 Missions',
  'Late Night Chill & Just Chatting',
  'Nintendo & Smash Bros Hub',
  'Retro & Indie Game Talk',
];

export function CreateChatRoomModal({
  isOpen,
  onClose,
  onDeployChatRoom,
  onOpenAuthModal,
  existingRoom,
  onSelectExistingRoom,
  onDeleteExistingRoom,
}: CreateChatRoomModalProps) {
  const { user, gamerProfile, updateGamerProfile } = useAuth();
  const { coords, setManualLocation } = useLocation();

  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [cityName, setCityName] = useState('');
  const [lat, setLat] = useState<number>(35.6762);
  const [lng, setLng] = useState<number>(139.6503);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync location directly with the exact same address as the user's profile pin
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      const profileAddress =
        gamerProfile?.locationName || coords?.cityName || 'Sector Active';
      setCityName(profileAddress);
      setLat(gamerProfile?.coords?.lat ?? coords?.lat ?? 35.6762);
      setLng(gamerProfile?.coords?.lng ?? coords?.lng ?? 139.6503);

      if (!roomName && gamerProfile?.gamerTag) {
        setRoomName(`${gamerProfile.gamerTag}'s Comms Lounge`);
      }
    }
  }, [isOpen, gamerProfile, coords]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearchLocation = async () => {
    const query = cityName.trim();
    if (!query) return;
    setIsSearchingLocation(true);
    setErrorMsg('');
    try {
      const res = await searchGlobalLocation(query);
      if (res) {
        setCityName(res.cityName);
        setLat(res.lat);
        setLng(res.lng);
        playRadarPing();
      } else {
        setErrorMsg(`Could not find "${query}". Please check spelling.`);
      }
    } catch {
      setErrorMsg('Error locating city.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleUseGPS = () => {
    playSketchClick();
    if (coords) {
      setCityName(coords.cityName || 'Current GPS Sector');
      setLat(coords.lat);
      setLng(coords.lng);
      playRadarPing();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('You must be signed in to create a live chat room.');
      return;
    }

    if (!roomName.trim()) {
      setErrorMsg('Please enter a chat room name.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please provide a short description for the room.');
      return;
    }

    if (!cityName.trim()) {
      setErrorMsg('Please enter a location or city to place the room pin on the map.');
      return;
    }

    setIsSubmitting(true);
    playSquadJoinSound();

    const finalCity = cityName.trim() || gamerProfile?.locationName || coords?.cityName || 'Global Sector';
    const finalLat = lat || gamerProfile?.coords?.lat || coords?.lat || 35.6762;
    const finalLng = lng || gamerProfile?.coords?.lng || coords?.lng || 139.6503;

    // Same address entered for profile pin is the same one for chat room location
    if (user && updateGamerProfile) {
      updateGamerProfile({
        locationName: finalCity,
        coords: { lat: finalLat, lng: finalLng },
      }).catch(() => {});
    }
    setManualLocation(finalCity, finalLat, finalLng);

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const hostName = gamerProfile?.gamerTag || user.displayName || 'Host Gamer';
    const hostPhoto = gamerProfile?.photoUrl || user.photoURL || undefined;
    const hostAvatar = gamerProfile?.characterAvatar || 'waving';

    const chatRoomData: ChatRoomData = {
      roomId,
      roomName: roomName.trim(),
      topic: description.trim().slice(0, 50) || 'Game Room Lounge',
      game: 'Game Room',
      description: description.trim(),
      hostId: user.uid,
      hostName,
      hostPhoto,
      hostAvatar,
      icon: '💬',
      micRequired: false,
      activeUsersCount: 1,
      tags: ['Live Chat', 'Game Room'],
      cityName: finalCity,
      lat: finalLat,
      lng: finalLng,
      createdAt: new Date().toISOString(),
    };

    const newBeacon: SquadBeacon = {
      id: roomId,
      ownerId: user.uid,
      name: roomName.trim(),
      game: 'Game Room Lounge',
      genre: 'Action',
      rank: 'Live Chat',
      currentMembers: 1,
      maxMembers: 5,
      sector: finalCity,
      locationName: finalCity,
      lat: finalLat,
      lng: finalLng,
      x: 50,
      y: 50,
      micRequired: false,
      playstyle: 'Casual',
      description: description.trim(),
      lookingFor: ['Live Chat', 'Gamers'],
      pingMs: 15,
      accentColor: 'lime',
      beaconType: 'chat_room',
      characterAvatar: hostAvatar,
      chatRoomData,
      members: [
        {
          id: user.uid,
          name: hostName,
          avatarSeed: hostName,
          role: 'Room Host',
          rank: gamerProfile?.rank || 'Host',
          isLeader: true,
          photoUrl: hostPhoto,
        },
      ],
    };

    // Users with accounts can only create one chat room, not two!
    // If they already had an active room, close the old one so the new one replaces it
    if (existingRoom && onDeleteExistingRoom) {
      try {
        onDeleteExistingRoom(existingRoom.id);
      } catch (err) {
        console.warn('Could not remove previous room:', err);
      }
    }

    onDeployChatRoom(newBeacon);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSketchClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-[105] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#030a05] text-slate-100 rounded-2xl border-2 border-cyan-400 p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.45)] my-auto max-h-[92vh] flex flex-col select-none cursor-default"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playSketchClick();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer z-10"
          title="Close [Esc]"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-cyan-500/30 flex-shrink-0 pr-8">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.5)] flex-shrink-0">
            💬
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide flex items-center gap-2">
              <span>HOST LIVE CHAT ROOM</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400 text-black font-bold uppercase shadow">
                MAP PIN
              </span>
            </h2>
            <p className="text-xs font-sketch text-cyan-200/90 truncate sm:whitespace-normal">
              Deploy an interactive chat room pin live on the map for all gamers to discover & join
            </p>
          </div>
        </div>

        {/* Auth Guard Banner if not signed in */}
        {!user ? (
          <div className="my-auto py-6 px-5 rounded-xl bg-red-950/40 border-2 border-red-500/70 text-center space-y-3 overflow-y-auto">
            <div className="flex items-center justify-center gap-2 text-red-300 font-display font-bold text-base">
              <Shield className="w-5 h-5 text-red-400" />
              <span>Sign In Required</span>
            </div>
            <p className="text-xs font-sketch text-slate-300 max-w-md mx-auto">
              Only signed-in gamers can create live chat rooms on the map. Please sign in or create a free gamer account to host your room.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  onClose();
                  onOpenAuthModal('signin');
                }}
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-display text-xs rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  onClose();
                  onOpenAuthModal('signup');
                }}
                className="px-4 py-2 bg-black/60 hover:bg-white/10 text-white font-bold font-display text-xs rounded-lg border border-white/20 transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 mt-3">
            {/* Scrollable Fields Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-cyan-500/40">
              {errorMsg && (
                <div className="p-2.5 rounded bg-red-950/60 border border-red-500 text-red-300 text-xs font-sketch flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Active Room Limit Warning Banner (Users with accounts can only create one chat room, not two) */}
              {existingRoom && (
                <div className="p-3.5 rounded-xl bg-amber-950/85 border-2 border-amber-400 text-xs font-sketch text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.35)] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <strong className="text-amber-300 font-bold block text-sm">
                        Active Room Limit: 1 Chat Room Per Account
                      </strong>
                      <p className="text-slate-200 text-xs mt-0.5 leading-relaxed">
                        Users with accounts can only create <strong>one chat room</strong> on the radar map, not two.
                        You currently have an active room: <strong className="text-cyan-300">"{existingRoom.name}"</strong> (📍 {existingRoom.sector || 'Active Sector'}).
                      </p>
                      <p className="text-amber-200/90 text-[11px] mt-1">
                        Deploying this new room will automatically close and replace your old room so your account only has 1 active chat room at a time.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-500/30 flex-wrap">
                    {onSelectExistingRoom && (
                      <button
                        type="button"
                        onClick={() => {
                          playSketchClick();
                          onClose();
                          onSelectExistingRoom(existingRoom);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-display text-xs cursor-pointer shadow transition-transform active:scale-95"
                      >
                        🚀 Open My Active Room
                      </button>
                    )}
                    {onDeleteExistingRoom && (
                      <button
                        type="button"
                        onClick={() => {
                          playSketchClick();
                          onDeleteExistingRoom(existingRoom.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-950/90 hover:bg-red-900 border border-red-500 text-red-200 font-bold font-display text-xs cursor-pointer shadow transition-transform active:scale-95"
                      >
                        🗑️ Close Old Room Now
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 3D Gaming Building Preview Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.45)] flex flex-col sm:flex-row items-center gap-4 flex-shrink-0">
                <div className="relative flex-shrink-0 flex items-center justify-center p-2 bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 rounded-xl border-2 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <GameRoomBuilding3D
                    roomTitle={roomName || 'GAME ROOM'}
                    width={140}
                    height={116}
                  />
                </div>
                <div className="min-w-0 space-y-1 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400 text-black text-[10px] font-mono font-black uppercase tracking-wider shadow">
                      <span>🕹️ 3D GAME ROOM CAFE BUILDING</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      <span>👥 5 USERS MAX (HOST INCLUDED)</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold font-display text-white truncate">
                    {roomName || 'Your Retro Arcade & Lounge'}
                  </h3>
                  <p className="text-[11px] font-sketch text-cyan-200/90 leading-snug">
                    This illuminated 3D arcade & cafe building will be deployed live at your location on the map so gamers can see your room and join the chat!
                  </p>
                </div>
              </div>

              {/* 1. Room Name */}
              <div>
                <label className="block text-xs font-bold font-display text-cyan-300 uppercase tracking-wider mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. San Diego Gamers Comms Lounge"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-black/70 border border-cyan-500/40 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-sketch"
                />
              </div>

              {/* 2. Room Description */}
              <div>
                <label className="block text-xs font-bold font-display text-cyan-300 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this chat room for? (e.g. Chatting about gaming, daily squads, chill vibes)..."
                  maxLength={240}
                  className="w-full px-3 py-2 bg-black/70 border border-cyan-500/40 focus:border-cyan-400 rounded-lg text-xs text-white focus:outline-none font-sketch resize-none"
                />
                {/* Preset Topic Quick Pickers */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 mt-1">
                  <span className="text-[10px] text-cyan-400/80 font-mono flex-shrink-0">Presets:</span>
                  {PRESET_TOPICS.slice(0, 5).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        playSketchClick();
                        setDescription(`Active community chat for ${p}. Join in and say hi!`);
                      }}
                      className="px-2 py-0.5 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-[10px] text-cyan-200 font-sketch whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Map Placement & Global Location - Same address as profile pin */}
              <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display text-cyan-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Global Map Placement & Location *</span>
                  </span>
                  {coords && (
                    <button
                      type="button"
                      onClick={handleUseGPS}
                      className="text-[10px] font-sketch text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Use My GPS</span>
                    </button>
                  )}
                </div>

                {/* Profile Address Sync Notice */}
                <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-400/60 text-xs font-sketch text-cyan-200 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <span className="text-base shrink-0">📍</span>
                  <div className="min-w-0">
                    <strong className="text-white block font-display">Profile Pin Address Synced:</strong>
                    <span>Your chat room 3D lounge is planted at the exact same location as your profile pin (<span className="text-cyan-300 font-mono font-bold">{cityName}</span>).</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    required
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchLocation();
                      }
                    }}
                    placeholder="Enter city or country (e.g. Tokyo, London, Berlin)"
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-black border border-cyan-500/40 focus:border-cyan-400 rounded text-xs text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={isSearchingLocation}
                    className="w-full sm:w-auto shrink-0 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/60 rounded text-xs font-sketch text-cyan-200 cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap active:scale-95"
                  >
                    <Search className="w-3 h-3 shrink-0" />
                    <span>{isSearchingLocation ? 'Locating...' : 'Verify'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>Pin Coordinates: [{lat.toFixed(3)}°, {lng.toFixed(3)}°]</span>
                  <span className="text-cyan-400">Synced with Profile Pin</span>
                </div>
              </div>
          </div>

          {/* Pinned Modal Actions Footer */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-cyan-500/30 flex-shrink-0 mt-3 bg-[#030a05]">
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onClose();
              }}
              className="px-3 sm:px-4 py-2 bg-transparent hover:bg-white/10 text-slate-300 font-display font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="max-w-full px-4 sm:px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black font-display text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <Radio className="w-4 h-4 shrink-0" />
              <span className="truncate">DEPLOY LIVE PIN TO MAP</span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
