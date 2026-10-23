import React, { useState, useRef } from 'react';
import {
  Compass,
  ArrowRight,
  UserCheck,
  MapPin,
  Radio,
  Edit3,
  Sparkles,
  Gamepad2,
  Calendar,
  Clock,
  Link as LinkIcon,
  ExternalLink,
  Image as ImageIcon,
  X,
  Camera,
  Upload,
  Trash2,
  Plus,
  Store,
  Mail,
} from 'lucide-react';
import { playRadarPing, playSketchClick, playSquadJoinSound } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { TacticalLogo } from './TacticalLogo';
import { LocationPromptModal } from './LocationPromptModal';
import { BlockyCharacter3D } from './BlockyCharacter3D';
import { compressImage } from '../utils/imageCompressor';
import { GamerPhoto } from '../types';
import { PhotoLightbox } from './PhotoLightbox';

interface WelcomeScreenProps {
  onSearchMap: () => void;
  onOpenEditProfile?: () => void;
  onOpenSellTradeModal?: () => void;
  onOpenTerms?: () => void;
  onOpenSupport?: () => void;
}

export function WelcomeScreen({
  onSearchMap,
  onOpenEditProfile,
  onOpenSellTradeModal,
  onOpenTerms,
  onOpenSupport,
}: WelcomeScreenProps) {
  const { user, gamerProfile, updateGamerProfile } = useAuth();
  const { coords, status, requestLocation } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<{ url: string; caption?: string } | null>(null);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleUploadGalleryPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsUploadingGallery(true);
      playSketchClick();
      const newPhotos: GamerPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await compressImage(file, 640, 0.72);
        newPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: dataUrl,
          caption: file.name.replace(/\.[^/.]+$/, '').slice(0, 40),
          uploadedAt: new Date().toISOString(),
        });
      }
      const existing = gamerProfile?.photos || [];
      const updatedPhotos = [...newPhotos, ...existing];
      await updateGamerProfile({ photos: updatedPhotos });
      playSquadJoinSound();
    } catch (err) {
      console.error('Error uploading photos:', err);
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    playSketchClick();
    const existing = gamerProfile?.photos || [];
    const updatedPhotos = existing.filter((p) => p.id !== photoId);
    await updateGamerProfile({ photos: updatedPhotos });
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      playSketchClick();
      const dataUrl = await compressImage(file, 360, 0.8);
      await updateGamerProfile({ photoUrl: dataUrl });
      playSquadJoinSound();
    } catch (err) {
      console.error('Error uploading profile photo:', err);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleMapClick = () => {
    playRadarPing();
    if (!coords && !gamerProfile?.coords) {
      // Always prompt user for location before searching on map
      setShowLocationModal(true);
    } else {
      onSearchMap();
    }
  };

  const handleLocationGranted = () => {
    setShowLocationModal(false);
    onSearchMap();
  };

  const activeGamerName = gamerProfile?.gamerTag || user?.displayName || 'Gamer';

  return (
    <div className="min-h-screen bg-[#020703] bg-sketch-grid text-slate-100 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background glowing radar circles for atmospheric sketch depth */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
        <svg
          className="w-[700px] h-[700px] max-w-full max-h-full animate-radar"
          viewBox="0 0 600 600"
          fill="none"
          style={{ filter: 'url(#sketch-glow)' }}
        >
          <circle cx="300" cy="300" r="250" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="16 8" />
          <circle cx="300" cy="300" r="160" stroke="#22c55e" strokeWidth="1" strokeDasharray="12 6" />
          <circle cx="300" cy="300" r="80" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="8 4" />
          <line x1="300" y1="20" x2="300" y2="580" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="6 6" />
          <line x1="20" y1="300" x2="580" y2="300" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="6 6" />
        </svg>
      </div>

      {/* Focused Welcoming Box with glowing hand-drawn outline */}
      <div
        className="relative z-10 max-w-2xl w-full p-6 sm:p-10 text-center bg-[#050f07]/90 transition-all duration-300 flex flex-col items-center my-auto"
        style={{
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          border: '2.5px solid #22c55e',
          boxShadow: '0 0 35px rgba(34, 197, 94, 0.45), inset 0 0 25px rgba(34, 197, 94, 0.1)',
          filter: 'url(#sketch-glow)',
        }}
      >
        {/* Live Gamer Profile Dossier Showcase (Shown when signed in) */}
        {user ? (
          <div className="w-full text-left mb-6 p-4 sm:p-5 bg-[#030c06]/95 border-2 border-lime-400/80 rounded-xl shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all">
            {/* Header: Photo, Name, Status, Badges */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 pb-3 border-b border-lime-500/25">
              <div className="flex items-center gap-3.5">
                {/* Profile Photo with direct upload and click to zoom */}
                <div className="relative group flex-shrink-0">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    onChange={handleUploadAvatar}
                    className="hidden"
                  />
                  {gamerProfile?.photoUrl ? (
                    <div
                      onClick={() => {
                        playSketchClick();
                        setSelectedLightboxPhoto({
                          url: gamerProfile.photoUrl!,
                          caption: `${activeGamerName}'s Profile Photo`,
                        });
                      }}
                      className="relative cursor-pointer"
                      title="Click to view photo"
                    >
                      <img
                        src={gamerProfile.photoUrl}
                        alt="Profile"
                        className="w-14 h-14 rounded-full object-cover border-2 border-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.5)] group-hover:scale-105 transition-transform"
                        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        playSketchClick();
                        avatarInputRef.current?.click();
                      }}
                      className="w-14 h-14 rounded-full border-2 border-lime-400 bg-lime-950/90 flex items-center justify-center font-display font-black text-lime-300 text-lg shadow-[0_0_12px_rgba(163,230,53,0.4)] cursor-pointer hover:border-lime-300 transition-colors"
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                      title="Click to upload profile photo"
                    >
                      {activeGamerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Change/Upload Photo Trigger Icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSketchClick();
                      avatarInputRef.current?.click();
                    }}
                    title="Change Profile Photo"
                    className="absolute -bottom-1 -right-1 p-1 bg-[#030d05] hover:bg-lime-950 border border-lime-400 text-lime-300 rounded-full cursor-pointer shadow-[0_0_8px_rgba(163,230,53,0.5)] hover:scale-110 transition-transform"
                  >
                    <Camera className="w-3.5 h-3.5 text-lime-300" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono-num text-lime-400 font-bold bg-lime-950/90 px-2 py-0.5 rounded border border-lime-400/60 uppercase flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                      <span>LIVE PROFILE · BEACON ACTIVE</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-display text-white mt-0.5 truncate">
                    {activeGamerName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      setShowLocationModal(true);
                    }}
                    className="text-xs font-sketch text-slate-300 hover:text-lime-300 flex items-center gap-1 cursor-pointer transition-colors group mt-0.5"
                    title="Change location (GPS, Search City, or Drop Pin)"
                  >
                    <MapPin className="w-3 h-3 text-lime-400 group-hover:scale-110 transition-transform" />
                    <span>{gamerProfile?.locationName || coords?.cityName || 'Deployment Sector'}</span>
                    <span className="text-[10px] text-lime-400/80 group-hover:text-lime-300 underline font-mono ml-1">Change</span>
                  </button>
                </div>
              </div>

              {/* Profile Action Buttons */}
              <div className="flex items-center gap-2 self-start flex-wrap">
                {onOpenEditProfile && (
                  <button
                    onClick={() => {
                      playSketchClick();
                      onOpenEditProfile();
                    }}
                    className="px-3 py-1.5 text-xs font-sketch bg-lime-950/80 hover:bg-lime-900 border border-lime-400 text-lime-200 rounded flex items-center gap-1.5 cursor-pointer transition-colors shadow-[0_0_10px_rgba(163,230,53,0.3)]"
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-lime-400" />
                    <span>Edit Profile</span>
                  </button>
                )}
                {user && onOpenEditProfile && (
                  <button
                    onClick={() => {
                      playSketchClick();
                      onOpenEditProfile();
                    }}
                    className="px-2.5 py-1.5 text-xs font-sketch bg-red-950/60 hover:bg-red-900/80 border border-red-500/50 text-red-300 hover:text-white rounded flex items-center gap-1 cursor-pointer transition-colors"
                    title="Delete Account Permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="hidden sm:inline">Delete Account</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active 3D Character Avatar Spotlight */}
            <div
              className="mt-3 p-2.5 bg-gradient-to-r from-[#010803] via-[#041207] to-[#010803] border border-lime-500/40 rounded-xl flex items-center justify-between gap-3 shadow-[0_0_12px_rgba(163,230,53,0.15)] group hover:border-lime-400 transition-colors"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-14 h-16 flex-shrink-0 flex items-center justify-center pointer-events-none">
                  <BlockyCharacter3D
                    variant={gamerProfile?.characterAvatar || 'waving'}
                    width={56}
                    height={68}
                    isLive={true}
                    speechText="LIVE!"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono-num uppercase tracking-wider text-lime-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-lime-400 flex-shrink-0" />
                    <span>Active 3D Character Avatar</span>
                  </div>
                  <div className="text-xs sm:text-sm font-display font-black text-white truncate">
                    {gamerProfile?.characterAvatar === 'moon_demon_noble'
                      ? '🌙 Moon Demon Noble · Silver Demon Lord'
                      : gamerProfile?.characterAvatar === 'demon_dog_warrior'
                      ? '🗡️ Demon Dog Warrior · Tessaiga Blade'
                      : gamerProfile?.characterAvatar === 'celestial_moon_guardian'
                      ? '⭐ Celestial Moon Guardian · Moon Stick'
                      : gamerProfile?.characterAvatar === 'sacred_shrine_priestess'
                      ? '🏹 Sacred Shrine Priestess · Sacred Bow'
                      : gamerProfile?.characterAvatar === 'cyber_soccer_girl'
                      ? '⚽ Cyber Soccer Girl · Blue Anime Skin'
                      : gamerProfile?.characterAvatar === 'cyber_soccer_boy'
                      ? '⚽ Cyber Soccer Player · Red Anime Skin'
                      : gamerProfile?.characterAvatar === 'purple_anime_girl'
                      ? '🐱 Lavender Anime Girl · Pastel Violet'
                      : gamerProfile?.characterAvatar === 'mexican_traveler'
                      ? '🐕 Traveler · Anime Dog Companion'
                      : gamerProfile?.characterAvatar === 'alien_girl'
                      ? '🛸 Cool Alien Girl · Cosmic Star'
                      : gamerProfile?.characterAvatar === 'alien_boy'
                      ? '👾 Cool Alien Boy · Cosmic Striker'
                      : gamerProfile?.characterAvatar === 'freddy'
                      ? '🧤 Freddy Krueger · Springwood Slasher'
                      : gamerProfile?.characterAvatar === 'jason'
                      ? '🪓 Jason Voorhees · Crystal Lake Slasher'
                      : gamerProfile?.characterAvatar === 'ghostface'
                      ? '👻 Ghostface · Woodsboro Stalker'
                      : gamerProfile?.characterAvatar === 'michael_myers'
                      ? '🔪 Michael Myers · The Shape'
                      : gamerProfile?.characterAvatar === 'pumpkin'
                      ? '🎃 Pumpkin Monster · Pumpkin Dread'
                      : gamerProfile?.characterAvatar === 'girly_pumpkin'
                      ? '🎀 Girly Pumpkin · Sweet Pumpkin'
                      : gamerProfile?.characterAvatar === 'classic'
                      ? '⚔️ Boy Warrior · Scout Vanguard'
                      : '🛡️ Girl Warrior · Cyber Valkyrie'}
                  </div>
                  <div className="text-[10px] font-sketch text-slate-300 truncate">
                    Visible live to all squads on the Radar Map.
                  </div>
                </div>
              </div>

              {onOpenEditProfile && (
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    onOpenEditProfile();
                  }}
                  className="flex-shrink-0 px-2.5 py-1 text-[11px] font-display font-bold text-lime-200 bg-lime-950/90 hover:bg-lime-900 border border-lime-400/60 rounded cursor-pointer transition-all hover:scale-105"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  Change Character
                </button>
              )}
            </div>

            {/* Badges (Main Game) */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {gamerProfile?.favoriteGame && (
                <span className="px-2.5 py-0.5 text-xs font-mono-num font-semibold text-lime-300 bg-lime-950/80 rounded border border-lime-400/50 flex items-center gap-1">
                  <span>🎮 Main:</span>
                  <span>{gamerProfile.favoriteGame}</span>
                </span>
              )}
            </div>

            {/* Player Bio */}
            {gamerProfile?.bio && (
              <div className="mt-2.5 p-2.5 bg-[#010603] border border-lime-500/25 rounded text-xs font-sketch text-slate-200 italic leading-relaxed">
                "{gamerProfile.bio}"
              </div>
            )}

            {/* Liked Genres & Games */}
            {((gamerProfile?.likedGenres && gamerProfile.likedGenres.length > 0) ||
              (gamerProfile?.likedGames && gamerProfile.likedGames.length > 0)) && (
              <div className="mt-2.5 p-2.5 bg-[#010603] border border-lime-500/25 rounded">
                <div className="text-[10px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-1.5 flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3 text-lime-400" />
                  <span>Favorite Genres & Titles</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {gamerProfile?.likedGenres?.map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 text-[11px] font-sketch bg-lime-950/80 text-lime-200 border border-lime-400/50 rounded"
                    >
                      {genre}
                    </span>
                  ))}
                  {gamerProfile?.likedGames?.map((game) => (
                    <span
                      key={game}
                      className="px-2 py-0.5 text-[11px] font-sketch bg-emerald-950/80 text-emerald-200 border border-emerald-400/50 rounded"
                    >
                      🎮 {game}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Play Schedule & Tactical Times (Days & Hours When User Plays) */}
            {gamerProfile?.playSchedule &&
              ((gamerProfile.playSchedule.days && gamerProfile.playSchedule.days.length > 0) ||
                gamerProfile.playSchedule.timeSlot ||
                gamerProfile.playSchedule.customHours) && (
                <div className="mt-2.5 p-2.5 bg-[#010603] border border-lime-500/25 rounded">
                  <div className="text-[10px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-lime-400" />
                      <span>Play Days & Gaming Hours</span>
                    </span>
                    {onOpenEditProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          playSketchClick();
                          onOpenEditProfile();
                        }}
                        className="text-[10px] font-sketch text-lime-300 hover:text-white underline cursor-pointer"
                      >
                        Edit Schedule
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {gamerProfile.playSchedule.days && gamerProfile.playSchedule.days.length > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-mono-num font-bold bg-lime-950/80 text-lime-200 border border-lime-400/50 rounded">
                        🗓️ {gamerProfile.playSchedule.days.join(' · ')}
                      </span>
                    )}
                    {gamerProfile.playSchedule.timeSlot && (
                      <span className="px-2 py-0.5 text-[11px] font-sketch bg-emerald-950/80 text-emerald-200 border border-emerald-400/50 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>{gamerProfile.playSchedule.timeSlot}</span>
                      </span>
                    )}
                    {gamerProfile.playSchedule.customHours && (
                      <span className="text-[11px] font-sketch text-slate-300 italic">
                        "{gamerProfile.playSchedule.customHours}"
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* Connected Socials */}
            {gamerProfile?.socialLinks && Object.values(gamerProfile.socialLinks).some(Boolean) && (
              <div className="mt-2.5 p-2.5 bg-[#010603] border border-lime-500/25 rounded">
                <div className="text-[10px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-1.5 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-lime-400" />
                  <span>Connect & Socials</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {gamerProfile.socialLinks.discord && (
                    <span className="px-2 py-0.5 text-[11px] font-sketch bg-[#5865F2]/20 text-[#c7d2fe] border border-[#5865F2]/50 rounded">
                      <strong className="text-[#818cf8]">Discord:</strong> {gamerProfile.socialLinks.discord}
                    </span>
                  )}
                  {gamerProfile.socialLinks.twitch && (
                    <a
                      href={gamerProfile.socialLinks.twitch.startsWith('http') ? gamerProfile.socialLinks.twitch : `https://${gamerProfile.socialLinks.twitch}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 text-[11px] font-sketch bg-[#9146FF]/20 text-[#e9d5ff] border border-[#9146FF]/50 rounded flex items-center gap-1 hover:text-white"
                    >
                      <span className="text-[#c084fc] font-bold">Twitch</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {gamerProfile.socialLinks.steam && (
                    <a
                      href={gamerProfile.socialLinks.steam.startsWith('http') ? gamerProfile.socialLinks.steam : `https://${gamerProfile.socialLinks.steam}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 text-[11px] font-sketch bg-[#1b2838] text-slate-200 border border-slate-600 rounded flex items-center gap-1 hover:text-white"
                    >
                      <span className="text-slate-400 font-bold">Steam</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {gamerProfile.socialLinks.twitter && (
                    <span className="px-2 py-0.5 text-[11px] font-sketch bg-sky-950/80 text-sky-200 border border-sky-500/40 rounded">
                      <strong className="text-sky-400">X:</strong> {gamerProfile.socialLinks.twitter}
                    </span>
                  )}
                  {gamerProfile.socialLinks.youtube && (
                    <span className="px-2 py-0.5 text-[11px] font-sketch bg-red-950/80 text-red-200 border border-red-500/40 rounded">
                      <strong className="text-red-400">YouTube:</strong> {gamerProfile.socialLinks.youtube}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Screenshots & Battlestation Photo Showcase Gallery */}
            <div className="mt-2.5 p-3 bg-[#010603] border border-lime-500/25 rounded">
              <input
                type="file"
                ref={galleryInputRef}
                accept="image/*"
                multiple
                onChange={handleUploadGalleryPhotos}
                className="hidden"
              />
              <div className="text-[10px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-lime-400" />
                  <span>Screenshots & Battlestation Photos ({gamerProfile?.photos?.length || 0})</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      galleryInputRef.current?.click();
                    }}
                    disabled={isUploadingGallery}
                    className="px-2.5 py-1 text-[11px] font-sketch bg-lime-950/90 hover:bg-lime-900 border border-lime-400/70 text-lime-200 rounded flex items-center gap-1 cursor-pointer transition-colors shadow-[0_0_8px_rgba(163,230,53,0.3)] hover:scale-105"
                  >
                    {isUploadingGallery ? (
                      <span className="animate-pulse">Uploading...</span>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 text-lime-400" />
                        <span>Add Photos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {gamerProfile?.photos && gamerProfile.photos.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {gamerProfile.photos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => {
                          playSketchClick();
                          setSelectedLightboxPhoto({ url: photo.url, caption: photo.caption });
                        }}
                        className="relative aspect-video rounded-lg overflow-hidden border border-lime-500/40 group cursor-pointer hover:border-lime-300 transition-all hover:scale-105 shadow-[0_0_10px_rgba(163,230,53,0.2)]"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Upload'}
                          className="w-full h-full object-cover"
                        />
                        {/* Delete photo button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeletePhoto(e, photo.id)}
                          className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-950 text-red-400 hover:text-red-300 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/85 px-1.5 py-0.5 text-[9px] text-lime-200 font-sketch truncate">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-sketch mt-2 text-right">
                    Click any photo to zoom · Hover to delete
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => {
                    playSketchClick();
                    galleryInputRef.current?.click();
                  }}
                  className="p-3 text-center border border-dashed border-lime-500/30 hover:border-lime-400 rounded bg-[#010703]/80 text-xs font-sketch text-slate-400 hover:text-lime-200 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Upload className="w-4 h-4 text-lime-400 group-hover:scale-110 transition-transform" />
                    <span>No photos or victory screenshots uploaded yet.</span>
                    <span className="text-[11px] text-lime-400/90 underline font-bold">
                      Click here to upload battlestation setup or screenshots!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Status badges row when not logged in */
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            {coords ? (
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  setShowLocationModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime-950/70 hover:bg-lime-900/80 border border-lime-400/60 rounded text-xs font-sketch text-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.3)] cursor-pointer transition-colors"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                title="Change location (GPS, Search City, or Drop Pin)"
              >
                <MapPin className="w-3.5 h-3.5 text-lime-400" />
                <span>📍 {coords.cityName || 'Local Sector'}</span>
                <span className="text-[10px] text-lime-400/80 underline font-mono ml-1">Change</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLocationModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 hover:bg-green-950/40 border border-green-500/40 rounded text-xs font-sketch text-green-400 hover:text-green-200 cursor-pointer transition-colors"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <Radio className="w-3 h-3 text-green-400 animate-pulse" />
                <span>Enable GPS to Go Live</span>
              </button>
            )}
          </div>
        )}

        {/* Welcoming Heading with Sketched Logo and Brand Title */}
        <div className="flex flex-col items-center mb-2 mt-1 w-full max-w-xl px-2">
          <span className="text-xs sm:text-sm font-sketch uppercase tracking-wider text-green-300 font-bold mb-1.5">
            Welcome To
          </span>
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <TacticalLogo size={52} showHUD={false} animated={true} className="flex-shrink-0 sm:hidden" />
            <TacticalLogo size={68} showHUD={false} animated={true} className="flex-shrink-0 hidden sm:inline-flex" />
            <h1
              className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-white select-none whitespace-nowrap"
              style={{
                textShadow:
                  '0 0 10px rgba(34, 197, 94, 0.9), 0 0 25px rgba(34, 197, 94, 0.6), 0 0 50px rgba(34, 197, 94, 0.3)',
                filter: 'url(#sketch-glow)',
              }}
            >
              <span className="text-green-400">Squad</span>
              <span className="text-lime-400">Up</span>
            </h1>
          </div>
        </div>

        {/* Sketched Underline */}
        <svg
          className="w-48 sm:w-64 h-4 mb-6 text-green-400"
          viewBox="0 0 260 16"
          fill="none"
          style={{ filter: 'url(#sketch-glow)' }}
        >
          <path
            d="M6 8 Q 70 3, 130 9 T 254 7"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* The requested text: Never solo queue etc. */}
        <p className="text-base sm:text-lg text-slate-200 font-sketch leading-relaxed mb-6 max-w-md">
          Never solo queue again. Connect with local squads, find teammates for your favorite games, and dominate together.
        </p>

        {/* CTA Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full">
          {/* The requested Search Map Button */}
          <button
            onClick={handleMapClick}
            className="group relative px-7 py-3.5 w-full sm:w-auto text-base sm:text-lg font-bold font-display tracking-wider text-green-100 bg-[#06180b] hover:bg-[#0b2913] cursor-pointer transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_24px_rgba(34,197,94,0.65)]"
            style={{
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              border: '2.5px solid #22c55e',
              filter: 'url(#sketch-glow)',
            }}
          >
            <Compass className="w-5 h-5 text-green-400 group-hover:rotate-45 transition-transform duration-300" />
            <span>Launch Squad Radar Map</span>
            <ArrowRight className="w-4 h-4 text-green-400 group-hover:translate-x-1.5 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Clean quiet footer */}
      <footer className="mt-8 text-center text-xs text-slate-500 font-sketch flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>LobbyBazaar © 2026 · All rights reserved</span>
        <span className="hidden sm:inline">·</span>
        <button
          type="button"
          onClick={() => {
            playSketchClick();
            if (onOpenTerms) onOpenTerms();
          }}
          className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
        >
          Terms and Conditions
        </button>
        {onOpenSupport && (
          <>
            <span className="hidden sm:inline">·</span>
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onOpenSupport();
              }}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Questions & Reports (lobbybazaar6@gmail.com)</span>
            </button>
          </>
        )}
      </footer>

      {/* Photo Lightbox Modal */}
      <PhotoLightbox
        photoUrl={selectedLightboxPhoto?.url || null}
        caption={selectedLightboxPhoto?.caption}
        onClose={() => setSelectedLightboxPhoto(null)}
      />

      {/* Location Permission Modal */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationGranted={handleLocationGranted}
        onOpenPinDropMode={() => {
          setShowLocationModal(false);
          onSearchMap();
        }}
      />
    </div>
  );
}
