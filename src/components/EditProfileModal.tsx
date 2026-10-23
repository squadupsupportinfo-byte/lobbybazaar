import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Trash2,
  Check,
  Gamepad2,
  Sparkles,
  Link,
  Image as ImageIcon,
  Shield,
  Save,
  Plus,
  MapPin,
  Navigation,
  Search,
  CheckCircle,
  Calendar,
  Clock,
  Radio,
  Lock,
  AlertTriangle,
  Instagram,
  Youtube,
  Facebook,
  MessageSquare,
  Users,
  ExternalLink,
} from 'lucide-react';
import { TikTokIcon } from './SocialIcons';
import { useAuth, GamerProfile, GamerPhoto, GamerSocialLinks } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { SquadBeacon, CharacterAvatarType } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { searchGlobalLocation, POPULAR_WORLD_CITIES } from '../utils/locationService';
import { playSketchClick, playSquadJoinSound, playRadarPing } from '../utils/audio';
import { BlockyCharacter3D } from './BlockyCharacter3D';
import { GameRoomBuilding3D } from './GameRoomBuilding3D';
import { getSavedLocalChatRooms, deleteLocalChatRoom, saveLocalChatRoom } from '../utils/chatRoomService';
import { db } from '../lib/firebase';
import { doc, deleteDoc, setDoc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  activeChatRooms?: SquadBeacon[];
  onCloseChatRoom?: (roomId: string) => void;
  onUpdateChatRoom?: (room: SquadBeacon) => void;
}

export const PLAY_DAYS_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PLAY_TIME_SLOTS = [
  'Evenings (6 PM - 11 PM)',
  'Late Night (11 PM - 3 AM)',
  'Afternoons (12 PM - 6 PM)',
  'Mornings (8 AM - 12 PM)',
  'Weekends All Day',
  'Flexible / Anytime',
];

// Popular gaming genres
const GENRE_OPTIONS = [
  'Action',
  'Adventure',
  'FPS / Shooter',
  'RPG / JRPG',
  'Battle Royale',
  'Open World',
  'Survival / Craft',
  'Strategy / RTS',
  'Horror',
  'MOBA',
  'Fighting',
  'Co-Op / PvE',
  'Tactical Sim',
  'Sports / Racing',
];

export function EditProfileModal({
  isOpen,
  onClose,
  onSaved,
  activeChatRooms,
  onCloseChatRoom,
  onUpdateChatRoom,
}: EditProfileModalProps) {
  const { user, gamerProfile, updateGamerProfile, deleteAccountPermanently, signInWithGoogle } = useAuth();
  const { coords, requestLocation, setManualLocation, isLive, setIsLive } = useLocation();

  // Chat room management state inside profile modal
  const [closedRoomIds, setClosedRoomIds] = useState<string[]>([]);
  const [closeSuccessMsg, setCloseSuccessMsg] = useState<string | null>(null);

  // Resolve active chat rooms owned by this user
  const rawUserRooms =
    activeChatRooms && activeChatRooms.length > 0
      ? activeChatRooms
      : user
      ? getSavedLocalChatRooms().filter((r) => r.ownerId === user.uid || r.chatRoomData?.hostId === user.uid || !r.ownerId)
      : getSavedLocalChatRooms();

  const userRooms = rawUserRooms.filter((r) => !closedRoomIds.includes(r.id));

  // Permanent Account Deletion states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // State
  const [gamerTag, setGamerTag] = useState(gamerProfile?.gamerTag || user?.displayName || '');
  const [favoriteGame, setFavoriteGame] = useState(gamerProfile?.favoriteGame || 'Valorant');
  const [favoriteConsole, setFavoriteConsole] = useState(
    gamerProfile?.favoriteConsole || gamerProfile?.role || 'PlayStation 5'
  );
  const [bio, setBio] = useState(gamerProfile?.bio || '');
  const [photoUrl, setPhotoUrl] = useState(gamerProfile?.photoUrl || '');
  const [likedGenres, setLikedGenres] = useState<string[]>(
    gamerProfile?.likedGenres || ['Action', 'Adventure', 'FPS / Shooter']
  );
  const [customGameInput, setCustomGameInput] = useState('');
  const [likedGames, setLikedGames] = useState<string[]>(
    gamerProfile?.likedGames || ['Valorant', 'Apex Legends']
  );
  const [socialLinks, setSocialLinks] = useState<GamerSocialLinks>(
    gamerProfile?.socialLinks || {
      discord: '',
      twitch: '',
      steam: '',
      twitter: '',
      youtube: '',
      tiktok: '',
      instagram: '',
      facebook: '',
    }
  );
  const [photos, setPhotos] = useState<GamerPhoto[]>(gamerProfile?.photos || []);
  const [characterAvatar, setCharacterAvatar] = useState<CharacterAvatarType>(
    gamerProfile?.characterAvatar || 'waving'
  );
  const [showCharacterSelectModal, setShowCharacterSelectModal] = useState(false);
  const [liveBeaconEnabled, setLiveBeaconEnabled] = useState<boolean>(isLive);
  const [unlockingCharacter, setUnlockingCharacter] = useState<string | null>(null);
  const [activeCheckoutSession, setActiveCheckoutSession] = useState<{
    charId: string;
    charName: string;
    url: string;
    sessionId?: string;
  } | null>(null);
  const [isVerifyingCheckout, setIsVerifyingCheckout] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<{ text: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [, setUnlockRerender] = useState(0);

  useEffect(() => {
    const handleUnlocked = (e: any) => {
      const charId = e.detail?.characterId;
      if (charId) {
        setCharacterAvatar(charId as CharacterAvatarType);
        setUnlockingCharacter(null);
        setActiveCheckoutSession(null);
        setUnlockRerender((r) => r + 1);
      }
    };
    const handleStorage = () => {
      setUnlockRerender((r) => r + 1);
    };
    window.addEventListener('squadup_character_unlocked', handleUnlocked);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('squadup_character_unlocked', handleUnlocked);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Check if character is free or unlocked via one-time $3.00 payment
  const isCharacterUnlocked = (charId: string) => {
    const freeCharacters = [
      'waving',
      'classic',
      'pumpkin',
      'girly_pumpkin',
      'jason',
      'ghostface',
      'michael_myers',
      'freddy',
      'cyber_soccer_girl',
      'cyber_soccer_boy',
      'purple_anime_girl',
      'mexican_traveler',
      'alien_girl',
      'alien_boy',
    ];
    if (freeCharacters.includes(charId)) return true;
    if (gamerProfile?.unlockedCharacters?.includes(charId)) return true;
    if (typeof window !== 'undefined' && localStorage.getItem(`squadup_character_unlocked_${charId}`) === 'true') {
      return true;
    }
    return false;
  };

  const handleUnlockCharacter = async (charId: string, charName: string) => {
    // Open a blank tab synchronously to prevent popup blocker
    let checkoutTab: Window | null = null;
    try {
      checkoutTab = window.open('about:blank', '_blank');
    } catch (_) {}

    try {
      setUnlockingCharacter(charId);
      setCheckoutMessage({ text: `Directing to secure Stripe Checkout for ${charName}...`, type: 'info' });
      playSketchClick();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          purchaseType: 'character_unlock',
          characterId: charId,
          characterName: charName,
          userId: user?.uid,
          gamerTag: gamerTag || gamerProfile?.gamerTag || 'Player',
          origin: window.location.origin,
        }),
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response.');
      }

      const data = await res.json();
      if (data.url) {
        setActiveCheckoutSession({
          charId,
          charName,
          url: data.url,
          sessionId: data.sessionId,
        });

        if (checkoutTab && !checkoutTab.closed) {
          checkoutTab.location.href = data.url;
        }

        setCheckoutMessage({
          text: `Stripe Checkout session ready for ${charName}! Click the checkout button below if the window did not open.`,
          type: 'info',
        });
      } else {
        if (checkoutTab) checkoutTab.close();
        setCheckoutMessage({ text: data.error || 'Failed to start Stripe checkout session', type: 'error' });
        setUnlockingCharacter(null);
      }
    } catch (err: any) {
      console.error('Character checkout error:', err);
      if (checkoutTab) {
        try { checkoutTab.close(); } catch (_) {}
      }
      setCheckoutMessage({
        text: err.name === 'AbortError'
          ? 'Stripe request timed out. Please try again.'
          : 'Unable to connect to Stripe checkout. Please try again.',
        type: 'error',
      });
      setUnlockingCharacter(null);
    }
  };

  const handleVerifyPendingPayment = async () => {
    if (!activeCheckoutSession?.sessionId) return;
    setIsVerifyingCheckout(true);
    setCheckoutMessage({ text: 'Verifying payment with Stripe...', type: 'info' });
    try {
      const res = await fetch('/api/verify-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeCheckoutSession.sessionId }),
      });
      const data = await res.json();
      if (data.verified && data.status === 'paid') {
        const charId = activeCheckoutSession.charId;
        localStorage.setItem(`squadup_character_unlocked_${charId}`, 'true');
        setCharacterAvatar(charId as CharacterAvatarType);
        if (updateGamerProfile) {
          const current = gamerProfile?.unlockedCharacters || [];
          const next = Array.from(new Set([...current, charId]));
          await updateGamerProfile({ unlockedCharacters: next, characterAvatar: charId as CharacterAvatarType });
        }
        window.dispatchEvent(new CustomEvent('squadup_character_unlocked', { detail: { characterId: charId } }));
        setActiveCheckoutSession(null);
        setUnlockingCharacter(null);
        setCheckoutMessage({ text: `🎉 Payment confirmed! ${activeCheckoutSession.charName} permanently unlocked & equipped!`, type: 'success' });
        playSquadJoinSound();
      } else {
        setCheckoutMessage({ text: 'Stripe has not confirmed payment yet. Once paid on Stripe, click confirm to unlock!', type: 'info' });
      }
    } catch (e) {
      console.error('Verify error:', e);
      setCheckoutMessage({ text: 'Error contacting verification server. Please retry.', type: 'error' });
    } finally {
      setIsVerifyingCheckout(false);
    }
  };

  const getCharacterMeta = (cId: string) => {
    switch (cId) {
      case 'moon_demon_noble':
        return { name: 'Moon Demon Noble', emoji: '🌙', sub: 'Moon Demon Noble (Silver Demon Lord)' };
      case 'demon_dog_warrior':
        return { name: 'Demon Dog Warrior', emoji: '🗡️', sub: 'Demon Dog Warrior (Tessaiga Blade)' };
      case 'celestial_moon_guardian':
        return { name: 'Celestial Moon Guardian', emoji: '⭐', sub: 'Celestial Moon Guardian (Moon Stick)' };
      case 'sacred_shrine_priestess':
        return { name: 'Sacred Shrine Priestess', emoji: '🏹', sub: 'Sacred Shrine Priestess (Sacred Bow)' };
      case 'cyber_soccer_girl':
        return { name: 'Cyber Soccer Girl', emoji: '⚽', sub: 'Cyber Soccer Girl (Blue Anime Skin)' };
      case 'cyber_soccer_boy':
        return { name: 'Cyber Soccer Player', emoji: '⚽', sub: 'Cyber Soccer Player (Red Anime Skin)' };
      case 'purple_anime_girl':
        return { name: 'Lavender Anime Girl', emoji: '🐱', sub: 'Lavender Anime Girl (Pastel Violet)' };
      case 'mexican_traveler':
        return { name: 'Traveler', emoji: '🐕', sub: 'Traveler (Anime Dog Companion)' };
      case 'alien_girl':
        return { name: 'Cool Alien Girl', emoji: '🛸', sub: 'Cool Alien Girl (Cosmic Star)' };
      case 'alien_boy':
        return { name: 'Cool Alien Boy', emoji: '👾', sub: 'Cool Alien Boy (Cosmic Striker)' };
      case 'jason':
        return { name: 'Jason Voorhees', emoji: '🪓', sub: 'Jason Voorhees (Crystal Lake Slasher)' };
      case 'ghostface':
        return { name: 'Ghostface', emoji: '👻', sub: 'Ghostface (Woodsboro Stalker)' };
      case 'michael_myers':
        return { name: 'Michael Myers', emoji: '🔪', sub: 'Michael Myers (The Shape)' };
      case 'freddy':
        return { name: 'Freddy Krueger', emoji: '🧤', sub: 'Freddy Krueger (Springwood Slasher)' };
      case 'pumpkin':
        return { name: 'Pumpkin Monster', emoji: '🎃', sub: 'Pumpkin Monster (Pumpkin Dread)' };
      case 'girly_pumpkin':
        return { name: 'Girly Pumpkin', emoji: '🎀', sub: 'Girly Pumpkin (Sweet Pumpkin)' };
      case 'classic':
        return { name: 'Boy Warrior', emoji: '⚔️', sub: 'Boy Warrior (Scout Vanguard)' };
      case 'waving':
      default:
        return { name: 'Girl Warrior', emoji: '🛡️', sub: 'Girl Warrior (Cyber Valkyrie)' };
    }
  };

  // Global Location state (Worldwide: GPS, City search, Map Pin)
  const [cityInput, setCityInput] = useState(
    gamerProfile?.locationName || coords?.cityName || 'Tokyo, Japan'
  );
  const [resolvedLocation, setResolvedLocation] = useState<{
    cityName: string;
    lat: number;
    lng: number;
    country?: string;
  } | null>(
    gamerProfile?.coords && gamerProfile?.locationName
      ? {
          cityName: gamerProfile.locationName,
          lat: gamerProfile.coords.lat,
          lng: gamerProfile.coords.lng,
        }
      : coords
      ? {
          cityName: coords.cityName || 'Local Sector',
          lat: coords.lat,
          lng: coords.lng,
          country: coords.country,
        }
      : {
          cityName: 'Tokyo, Japan',
          lat: 35.6762,
          lng: 139.6503,
        }
  );
  const [isLookingUpLocation, setIsLookingUpLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Manual Play schedule & availability timing state
  const [manualDaysInput, setManualDaysInput] = useState<string>(
    gamerProfile?.playSchedule?.days?.join(', ') || 'Fri, Sat, Sun'
  );
  const [manualTimeSlot, setManualTimeSlot] = useState<string>(
    gamerProfile?.playSchedule?.timeSlot || 'Evenings (6 PM - 11 PM)'
  );
  const [customHours, setCustomHours] = useState<string>(
    gamerProfile?.playSchedule?.customHours || ''
  );

  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isCompressingGallery, setIsCompressingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Sync all form state strictly with the currently logged-in user whenever the modal opens or user changes
  useEffect(() => {
    // Always clear sensitive password and delete confirmation states
    setDeletePassword('');
    setConfirmDeleteInput('');
    setShowDeleteConfirmModal(false);
    setDeleteAccountError(null);

    if (isOpen && user) {
      setGamerTag(gamerProfile?.gamerTag || user?.displayName || user?.email?.split('@')[0] || '');
      setFavoriteGame(gamerProfile?.favoriteGame || 'Valorant');
      setFavoriteConsole(gamerProfile?.favoriteConsole || gamerProfile?.role || 'PlayStation 5');
      setBio(gamerProfile?.bio || '');
      setPhotoUrl(gamerProfile?.photoUrl || '');
      setLikedGenres(gamerProfile?.likedGenres || ['Action', 'Adventure', 'FPS / Shooter']);
      setLikedGames(gamerProfile?.likedGames || ['Valorant', 'Apex Legends']);
      setSocialLinks(
        gamerProfile?.socialLinks || {
          discord: '',
          twitch: '',
          steam: '',
          twitter: '',
          youtube: '',
        }
      );
      setPhotos(gamerProfile?.photos || []);
      setCharacterAvatar(gamerProfile?.characterAvatar || 'waving');
      setCityInput(gamerProfile?.locationName || coords?.cityName || 'Tokyo, Japan');
      if (gamerProfile?.coords && gamerProfile?.locationName) {
        setResolvedLocation({
          cityName: gamerProfile.locationName,
          lat: gamerProfile.coords.lat,
          lng: gamerProfile.coords.lng,
        });
      } else if (coords) {
        setResolvedLocation({
          cityName: coords.cityName || 'Local Sector',
          lat: coords.lat,
          lng: coords.lng,
          country: coords.country,
        });
      }
      setManualDaysInput(gamerProfile?.playSchedule?.days?.join(', ') || 'Fri, Sat, Sun');
      setManualTimeSlot(gamerProfile?.playSchedule?.timeSlot || 'Evenings (6 PM - 11 PM)');
      setCustomHours(gamerProfile?.playSchedule?.customHours || '');
      setLocationError(null);
    }
  }, [isOpen, user?.uid, gamerProfile?.uid, gamerProfile?.updatedAt]);

  // Lookup Global Location by city/country
  const handleLookupLocation = async (queryToLookup?: string) => {
    const target = (queryToLookup || cityInput).trim();
    if (!target) {
      setLocationError('Please enter a city or country (e.g. Tokyo, London, Berlin)');
      return null;
    }
    setLocationError(null);
    setIsLookingUpLocation(true);
    try {
      const res = await searchGlobalLocation(target);
      if (res) {
        setResolvedLocation({
          cityName: res.cityName,
          lat: res.lat,
          lng: res.lng,
          country: res.country,
        });
        setCityInput(res.cityName);
        playRadarPing();
        return res;
      } else {
        setLocationError(`Could not find location "${target}". Please check spelling or select below.`);
        return null;
      }
    } catch {
      setLocationError('Error locating city. Please try again.');
      return null;
    } finally {
      setIsLookingUpLocation(false);
    }
  };

  // One-Tap GPS
  const handleUseGPS = async () => {
    playSketchClick();
    setIsLookingUpLocation(true);
    setLocationError(null);
    try {
      const gpsRes = await requestLocation();
      if (gpsRes) {
        setResolvedLocation({
          cityName: gpsRes.cityName || 'Current GPS Sector',
          lat: gpsRes.lat,
          lng: gpsRes.lng,
          country: gpsRes.country,
        });
        setCityInput(gpsRes.cityName || 'Current GPS Sector');
        playRadarPing();
      }
    } catch {
      setLocationError('GPS permission not available.');
    } finally {
      setIsLookingUpLocation(false);
    }
  };

  // Toggle genre tag
  const handleToggleGenre = (genre: string) => {
    playSketchClick();
    setLikedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Add custom game
  const handleAddGame = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customGameInput.trim()) return;
    const game = customGameInput.trim();
    if (!likedGames.includes(game)) {
      playSketchClick();
      setLikedGames([...likedGames, game]);
    }
    setCustomGameInput('');
  };

  const handleRemoveGame = (gameToRemove: string) => {
    playSketchClick();
    setLikedGames(likedGames.filter((g) => g !== gameToRemove));
  };

  // Close and delete chat room immediately
  const handleCloseChatRoomClick = (room: SquadBeacon) => {
    playRadarPing();
    const targetId = room.id;
    setClosedRoomIds((prev) => [...prev, targetId]);
    deleteLocalChatRoom(targetId);
    try {
      deleteDoc(doc(db, 'squads', targetId)).catch(() => {});
    } catch {}
    if (onCloseChatRoom) {
      onCloseChatRoom(targetId);
    }
    setCloseSuccessMsg(`"${room.name}" was closed and removed from the tactical map.`);
    setTimeout(() => {
      setCloseSuccessMsg(null);
    }, 4500);
  };

  // Profile photo upload handler
  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingPhoto(true);
      const dataUrl = await compressImage(file, 400, 0.85);
      setPhotoUrl(dataUrl);
      playSketchClick();
    } catch (err) {
      console.error('Error compressing profile photo:', err);
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  // Gallery multi-photo upload handler
  const handleGalleryPhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsCompressingGallery(true);
      const newPhotos: GamerPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await compressImage(file, 720, 0.75);
        newPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: dataUrl,
          caption: file.name.replace(/\.[^/.]+$/, '').slice(0, 40),
          uploadedAt: new Date().toISOString(),
        });
      }

      setPhotos((prev) => [...prev, ...newPhotos]);
      playSketchClick();
    } catch (err) {
      console.error('Error compressing gallery photo:', err);
    } finally {
      setIsCompressingGallery(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    playSketchClick();
    setPhotos(photos.filter((p) => p.id !== photoId));
  };

  const handleUpdatePhotoCaption = (photoId: string, caption: string) => {
    setPhotos(
      photos.map((p) => (p.id === photoId ? { ...p, caption: caption.slice(0, 60) } : p))
    );
  };

  // Save profile ("Safe" button)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate or resolve global location if needed
      let loc = resolvedLocation;
      if (!loc || loc.cityName !== cityInput.trim()) {
        const fresh = await handleLookupLocation(cityInput);
        if (fresh) {
          loc = fresh;
        }
      }

      if (!loc) {
        setLocationError('Please enter a valid city or select from the options below.');
        setIsSaving(false);
        return;
      }

      const updatedData: Partial<GamerProfile> = {
        gamerTag: gamerTag.trim() || user?.displayName || 'Gamer',
        bio: bio.trim(),
        photoUrl,
        favoriteGame: favoriteGame.trim(),
        favoriteConsole: favoriteConsole.trim(),
        role: favoriteConsole.trim(),
        characterAvatar,
        isLive: liveBeaconEnabled,
        likedGenres,
        likedGames,
        socialLinks,
        photos,
        locationName: loc.cityName,
        coords: { lat: loc.lat, lng: loc.lng },
        playSchedule: {
          days: manualDaysInput
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean),
          timeSlot: manualTimeSlot.trim(),
          customHours: customHours.trim(),
        },
      };

      await updateGamerProfile(updatedData);

      // Deploy user's beacon to this global sector on the map!
      setManualLocation(loc.cityName, loc.lat, loc.lng, loc.country);
      setIsLive(liveBeaconEnabled);

      // Keep any user-owned squads in sync with the new characterAvatar
      if (user?.uid) {
        try {
          const squadsQ = query(collection(db, 'squads'), where('ownerId', '==', user.uid));
          const snap = await getDocs(squadsQ);
          for (const sDoc of snap.docs) {
            const sData = sDoc.data();
            if (sData.beaconType !== 'store' && sData.beaconType !== 'other_event' && sData.beaconType !== 'chat_room') {
              updateDoc(sDoc.ref, { characterAvatar }).catch(() => {});
            }
          }
        } catch {}
      }

      // The exact same address and coordinates entered for profile pin are synced to user's chat rooms
      for (const room of userRooms) {
        const updatedRoom: SquadBeacon = {
          ...room,
          sector: loc.cityName,
          locationName: loc.cityName,
          lat: loc.lat,
          lng: loc.lng,
          chatRoomData: room.chatRoomData
            ? {
                ...room.chatRoomData,
                cityName: loc.cityName,
                lat: loc.lat,
                lng: loc.lng,
              }
            : undefined,
        };
        saveLocalChatRoom(updatedRoom);
        if (user) {
          try {
            setDoc(doc(db, 'squads', room.id), updatedRoom, { merge: true }).catch(() => {});
          } catch {}
        }
        if (onUpdateChatRoom) {
          onUpdateChatRoom(updatedRoom);
        }
      }

      playSquadJoinSound();
      setSaveSuccess(true);

      setTimeout(() => {
        setSaveSuccess(false);
        if (onSaved) onSaved();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error saving gamer profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccountPermanently = async () => {
    if (confirmDeleteInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteAccountError('Please type "DELETE" to confirm permanent account deletion.');
      return;
    }
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await deleteAccountPermanently(deletePassword.trim() || undefined);
      try {
        localStorage.removeItem('squadup_deployed_stores');
      } catch {
        // ignore
      }
      setShowDeleteConfirmModal(false);
      onClose();
    } catch (err: any) {
      setDeleteAccountError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCharacterSelectModal) {
          setShowCharacterSelectModal(false);
          return;
        }
        if (showDeleteConfirmModal) {
          setShowDeleteConfirmModal(false);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCharacterSelectModal, showDeleteConfirmModal, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSketchClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#030904] text-slate-100 p-5 sm:p-7 relative border my-auto max-h-[92vh] flex flex-col cursor-default"
        style={{
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          borderColor: '#22c55e',
          boxShadow: '0 0 35px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-green-500/30 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-green-400" />
            <div>
              <h2 className="text-lg font-bold font-display text-white tracking-wide flex items-center gap-2">
                <span>Tactical Gamer Dossier · Edit Profile</span>
                <span className="text-[10px] font-mono-num text-green-400 bg-green-950 px-2 py-0.5 rounded border border-green-500/40">
                  LIVE SYNC
                </span>
              </h2>
              <p className="text-xs font-sketch text-slate-400">
                Update your avatar, bio, favorite genres, socials & screenshot showcase.
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

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1.5 custom-scrollbar">
          {/* Section: Radar Beacon Live Broadcast (Only signed in users can go online) */}
          <div className="p-4 bg-[#020603] rounded border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold font-display text-green-300 uppercase tracking-wider">
                  Radar Beacon · Online / Offline Status
                </span>
              </div>
              {user ? (
                <span
                  className={`text-[10px] font-mono-num px-2 py-0.5 rounded border ${
                    liveBeaconEnabled
                      ? 'bg-lime-950 text-lime-300 border-lime-400/50'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {liveBeaconEnabled ? 'BROADCASTING ONLINE' : 'SIGNAL STANDBY (OFFLINE)'}
                </span>
              ) : (
                <span className="text-[10px] font-mono-num bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>SIGN IN REQUIRED</span>
                </span>
              )}
            </div>

            {user ? (
              <div className="space-y-3">
                <p className="text-xs font-sketch text-slate-300 leading-relaxed">
                  {liveBeaconEnabled
                    ? 'Your profile beacon is actively broadcasting live on the tactical radar map so nearby gamers can find you.'
                    : 'Beacon is currently in standby mode (hidden from the public radar canvas).'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      const next = !liveBeaconEnabled;
                      setLiveBeaconEnabled(next);
                      setIsLive(next);
                      updateGamerProfile({ isLive: next });
                    }}
                    className={`px-4 py-2 text-xs font-bold font-display uppercase tracking-wider rounded cursor-pointer transition-all border shadow-[0_0_12px_rgba(34,197,94,0.3)] hover:scale-105 active:scale-95 ${
                      liveBeaconEnabled
                        ? 'bg-red-950/80 hover:bg-red-900 border-red-500/60 text-red-200'
                        : 'bg-green-950/90 hover:bg-green-900 border-green-400 text-green-200'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {liveBeaconEnabled ? 'Go Offline (Hide Beacon)' : 'Broadcast Live Online'}
                  </button>
                  <span className="text-[11px] font-sketch text-slate-400">
                    {liveBeaconEnabled ? 'Status: Active on map' : 'Status: Hidden'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-sketch text-amber-200">
                  <strong className="block text-amber-300 font-bold mb-0.5">Authentication Required</strong>
                  <span>Only logged in users can broadcast online or offer live beacons on the map.</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    playSketchClick();
                    try {
                      await signInWithGoogle();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold font-display text-xs rounded transition-all whitespace-nowrap cursor-pointer self-start sm:self-center"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  Sign In with Google
                </button>
              </div>
            )}
          </div>

          {/* Section: Active Live Chat Rooms & Close Chat Room Button */}
          {user && (
            <div className="p-4 bg-[#030d14] rounded border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold font-display text-cyan-300 uppercase tracking-wider">
                    Live Chat Room · Map Pin Status
                  </span>
                </div>
                {userRooms.length > 0 ? (
                  <span className="text-[10px] font-mono-num px-2 py-0.5 rounded border bg-cyan-950 text-cyan-300 border-cyan-400/50 flex items-center gap-1.5 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>PIN DEPLOYED ON MAP</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono-num px-2 py-0.5 rounded border bg-slate-900 text-slate-400 border-slate-700">
                    NO ACTIVE ROOM
                  </span>
                )}
              </div>

              {/* Close success feedback notification */}
              {closeSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-sketch flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{closeSuccessMsg}</span>
                </div>
              )}

              {userRooms.length > 0 ? (
                <div className="space-y-3">
                  {userRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3 bg-[#02070c] rounded-xl border border-cyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-slate-900 to-indigo-950 border border-cyan-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                          <GameRoomBuilding3D roomTitle={room.name} width={44} height={38} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold font-display text-white truncate">
                              {room.name}
                            </h4>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                              Limit: 5 Gamers (Host Included)
                            </span>
                          </div>
                          <p className="text-xs font-sketch text-slate-300 truncate mt-0.5">
                            {room.description || 'Live chat room & cafe building pin'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-sketch text-cyan-300/80 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              <span>{room.sector || 'Global Sector'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prominent Close Chat Room Button - Direct 1-tap close */}
                      <button
                        type="button"
                        onClick={() => handleCloseChatRoomClick(room)}
                        className="px-3.5 py-2 border-2 text-xs font-bold font-display uppercase tracking-wider rounded-lg shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 flex-shrink-0 bg-red-950/90 hover:bg-red-900 border-red-500 text-red-200 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105"
                        title="Close and remove this chat room from the map"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Close Chat Room</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-black/50 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-sketch text-slate-400">
                  <span>You do not have an active chat room deployed. You can create a 3D chat room lounge anytime using the "Create Room Chat" button on the map.</span>
                </div>
              )}
            </div>
          )}

          {/* Section 1: Profile Photo & Nickname */}
          <div className="p-4 bg-[#020603] rounded border border-green-500/30">
            <h3 className="text-xs font-bold font-display text-green-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-green-400" />
              <span>1. Profile Photo & Call Sign</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview Container */}
              <div className="relative group">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-400/80 bg-[#061409] flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Camera className="w-7 h-7 text-green-500/50 mb-1" />
                      <span className="text-[10px] font-sketch">No Photo</span>
                    </div>
                  )}
                </div>

                {isCompressingPhoto && (
                  <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-[10px] text-green-400 font-mono">
                    Compressing...
                  </div>
                )}
              </div>

              {/* Upload Controls & Nick Name input */}
              <div className="flex-1 w-full space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={profilePhotoInputRef}
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      profilePhotoInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-green-900/70 hover:bg-green-800 text-green-100 text-xs font-sketch rounded border border-green-400/80 flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Profile Photo</span>
                  </button>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        playSketchClick();
                        setPhotoUrl('');
                      }}
                      className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 font-sketch border border-red-500/30 rounded cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Nick Name / Call Sign Input */}
                <div className="pt-1">
                  <label className="block text-xs font-sketch text-slate-300 mb-1">
                    Nick Name / Call Sign *
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    required
                    placeholder="e.g. GhostSniper#NA1"
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#010603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none focus:border-green-400 font-display text-left"
                    style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
                  />
                </div>

                {/* Gaming Preferences (Main Game) */}
                <div className="pt-2">
                  <div>
                    <label className="block text-[11px] font-sketch text-slate-300 mb-1">
                      Main Game
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="e.g. Valorant, Apex, COD, Fortnite"
                      value={favoriteGame}
                      onChange={(e) => setFavoriteGame(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none font-sketch text-left"
                      style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
                    />
                  </div>
                </div>

                {/* 3D Warrior Avatar Selection - Compact Single Button */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-sketch text-slate-300">
                      3D Warrior Avatar Pin (Tactical Map)
                    </label>
                    <span className="text-[10px] font-mono-num text-lime-400 bg-lime-950/80 border border-lime-500/40 px-2 py-0.5 rounded">
                      Active: {getCharacterMeta(characterAvatar).name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      setShowCharacterSelectModal(true);
                    }}
                    className="w-full p-2.5 bg-[#010603] hover:bg-[#061408] border-2 border-lime-500/60 hover:border-lime-400 text-lime-200 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-[0_0_15px_rgba(163,230,53,0.2)] group"
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-lime-950/90 border border-lime-400/50 flex items-center justify-center text-lg shadow-[0_0_8px_rgba(163,230,53,0.4)]">
                        {getCharacterMeta(characterAvatar).emoji}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-display font-bold tracking-wider text-white group-hover:text-lime-300 transition-colors">
                          Character Selection
                        </div>
                        <div className="text-[10px] font-sketch text-slate-400">
                          Selected:{' '}
                          <span className="text-lime-400 font-semibold">
                            {getCharacterMeta(characterAvatar).sub}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-lime-400 hover:bg-lime-300 text-black text-[11px] font-display font-bold rounded-lg shadow-[0_0_10px_#a3e635] flex items-center gap-1 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                      <span>Character Selection</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Global Map Location (Worldwide: GPS or City Search) */}
          <div className="p-4 bg-[#020603] rounded border border-lime-500/40 shadow-[0_0_15px_rgba(163,230,53,0.15)]">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold font-display text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-lime-400" />
                <span>2. Map Location · Any City, Region, or GPS *</span>
              </h3>
              <span className="text-[10px] font-mono-num text-lime-400 bg-lime-950 px-2 py-0.5 rounded border border-lime-500/50">
                GLOBAL MAP
              </span>
            </div>
            <p className="text-[11px] font-sketch text-slate-400 mb-2">
              Enter any city or country (or use GPS) to plant your gamer beacon on the tactical map:
            </p>
            <div className="mb-3 p-2 rounded bg-cyan-950/40 border border-cyan-500/40 text-[11px] font-sketch text-cyan-200 flex items-center gap-2">
              <span className="text-sm shrink-0">📍</span>
              <span>
                <strong>Profile Pin & Chat Room Sync:</strong> The same address and coordinates you enter here will automatically be used for your chat rooms on the map.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  required
                  placeholder="Enter city or country (e.g. Tokyo, London, Dallas, Berlin)"
                  value={cityInput}
                  onChange={(e) => {
                    const cleanVal = e.target.value;
                    setCityInput(cleanVal);
                    if (locationError) setLocationError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookupLocation();
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#010603] border border-lime-500/50 rounded text-sm text-lime-100 focus:outline-none focus:border-lime-400 font-mono tracking-wide text-left"
                />
              </div>

              {/* Find City Button */}
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  handleLookupLocation();
                }}
                disabled={isLookingUpLocation}
                className="w-full sm:w-auto shrink-0 px-3.5 py-2 bg-lime-950/90 hover:bg-lime-900 border border-lime-400 text-lime-200 text-xs font-bold font-display tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(163,230,53,0.35)] transition-all whitespace-nowrap active:scale-95"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <Search className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                <span>{isLookingUpLocation ? 'Locating...' : 'Locate City'}</span>
              </button>

              {/* Use Device GPS Button */}
              <button
                type="button"
                onClick={handleUseGPS}
                disabled={isLookingUpLocation}
                className="w-full sm:w-auto shrink-0 px-3.5 py-2 bg-green-950/90 hover:bg-green-900 border border-green-400 text-green-200 text-xs font-bold font-display tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(34,197,94,0.35)] transition-all whitespace-nowrap active:scale-95"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                title="Use device GPS location"
              >
                <Navigation className="w-3.5 h-3.5 text-green-300 shrink-0" />
                <span>Use GPS</span>
              </button>
            </div>

            {/* Error Message */}
            {locationError && (
              <div className="text-xs text-red-400 font-sketch mb-2 flex items-center gap-1">
                <span>⚠️ {locationError}</span>
              </div>
            )}

            {/* Resolved Sector Confirmation Card */}
            {resolvedLocation && (
              <div
                className="p-3 bg-[#010903] border border-lime-400/60 rounded flex items-center justify-between shadow-[0_0_15px_rgba(163,230,53,0.2)] mt-2"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-lime-950 border border-lime-400 flex items-center justify-center text-lime-400 animate-pulse">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-display text-white flex items-center gap-1.5">
                      <span>{resolvedLocation.cityName}</span>
                    </div>
                    <div className="text-[10px] font-mono-num text-slate-400">
                      Coordinates: [{resolvedLocation.lat.toFixed(4)}°, {resolvedLocation.lng.toFixed(4)}°]
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono-num text-lime-400 font-semibold uppercase">
                    <CheckCircle className="w-3.5 h-3.5 text-lime-400" />
                    <span>Sector Active</span>
                  </span>
                </div>
              </div>
            )}

            {/* Quick Popular Worldwide shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
              <span className="text-[10px] font-sketch text-slate-400">Quick Global Sectors:</span>
              {POPULAR_WORLD_CITIES.slice(0, 6).map((item) => (
                <button
                  key={item.cityName}
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    setCityInput(item.cityName);
                    handleLookupLocation(item.cityName);
                  }}
                  className="px-2 py-0.5 text-[10px] font-mono-num bg-[#010602] hover:bg-lime-950 text-slate-300 hover:text-lime-200 border border-green-900/60 hover:border-lime-400/50 rounded cursor-pointer transition-colors"
                >
                  {item.cityName}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Short Description / Bio */}
          <div className="p-4 bg-[#020603] rounded border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold font-display text-green-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-green-400" />
                <span>3. Short Description / Gamer Bio</span>
              </h3>
              <span className="text-[11px] font-mono-num text-slate-500">{bio.length}/500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              dir="ltr"
              placeholder="Tell squads about your gaming style, favorite roles, play schedule, or tournament achievements..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none focus:border-green-400 leading-relaxed font-sketch placeholder-slate-600 resize-none text-left"
              style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
            />
          </div>

          {/* Section 4: Games He Likes (Action, Adventure, etc.) */}
          <div className="p-4 bg-[#020603] rounded border border-green-500/30">
            <h3 className="text-xs font-bold font-display text-green-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-green-400" />
              <span>4. Games & Genres You Like</span>
            </h3>
            <p className="text-[11px] font-sketch text-slate-400 mb-3">
              Select all genres you love playing (e.g. Action, Adventure, FPS, etc.) so squads can match with you:
            </p>

            {/* Genre Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {GENRE_OPTIONS.map((genre) => {
                const isSelected = likedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleToggleGenre(genre)}
                    className={`px-2.5 py-1 rounded text-xs font-sketch cursor-pointer transition-all duration-150 border flex items-center gap-1 ${
                      isSelected
                        ? 'bg-lime-950/80 text-lime-200 border-lime-400 font-bold shadow-[0_0_8px_rgba(163,230,53,0.35)]'
                        : 'bg-[#010502] text-slate-400 border-green-900/60 hover:text-slate-200 hover:border-green-500/40'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-lime-400" />}
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Game Titles */}
            <div className="pt-2 border-t border-green-500/20">
              <label className="block text-xs font-sketch text-slate-300 mb-1.5">
                Specific Game Titles You Play:
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="e.g. Elden Ring, Valorant, CS2, Helldivers..."
                  value={customGameInput}
                  onChange={(e) => setCustomGameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGame();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none font-sketch text-left"
                  style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
                />
                <button
                  type="button"
                  onClick={() => handleAddGame()}
                  className="px-3 py-1.5 bg-green-900/60 hover:bg-green-800 text-green-200 text-xs font-sketch rounded border border-green-400/60 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Game</span>
                </button>
              </div>

              {likedGames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {likedGames.map((game) => (
                    <span
                      key={game}
                      className="px-2 py-0.5 bg-[#041207] border border-green-400/50 text-green-200 text-xs font-sketch rounded flex items-center gap-1.5"
                    >
                      <span>{game}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGame(game)}
                        className="text-slate-400 hover:text-red-400 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Manual Play Schedule & Times */}
          <div className="p-4 bg-[#020603] rounded border border-green-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold font-display text-green-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-green-400" />
                <span>4. Manual Play Schedule & Active Times</span>
              </h3>
              <span className="text-[10px] font-mono-num text-lime-400 bg-lime-950/80 px-2 py-0.5 rounded border border-lime-500/40">
                MANUAL TIMING
              </span>
            </div>
            <p className="text-[11px] font-sketch text-slate-400 mb-3">
              Set your exact play schedule manually: enter your active days, gaming hours, timezone, or custom times:
            </p>

            {/* Manual Play Days Text Input */}
            <div className="mb-3">
              <label className="block text-xs font-sketch text-slate-300 mb-1">
                Active Days (Manual):
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="e.g. Mon, Wed, Fri & Weekends / Everyday / Weekdays after work"
                value={manualDaysInput}
                onChange={(e) => setManualDaysInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none focus:border-green-400 font-sketch mb-1.5 text-left"
                style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
              />
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] font-sketch text-slate-500 mr-1">Quick Add:</span>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Weekends', 'Weekdays', 'Everyday'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      setManualDaysInput((prev) => (prev ? `${prev}, ${chip}` : chip));
                    }}
                    className="text-[10px] font-mono-num px-2 py-0.5 bg-[#010502] hover:bg-green-950 text-slate-400 hover:text-green-300 border border-green-900/60 rounded cursor-pointer transition-colors"
                  >
                    +{chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Exact Time Window & Hours */}
            <div className="mb-3">
              <label className="block text-xs font-sketch text-slate-300 mb-1">
                Active Gaming Hours / Time Window (Manual):
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="e.g. 7:00 PM - 11:30 PM / 19:00 - 23:00 / Late Nights 10 PM - 2 AM"
                value={manualTimeSlot}
                onChange={(e) => setManualTimeSlot(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none focus:border-green-400 font-sketch mb-1.5 text-left"
                style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
              />
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] font-sketch text-slate-500 mr-1">Quick Presets:</span>
                {['Evenings (6 PM - 11 PM)', 'Late Night (10 PM - 3 AM)', 'Afternoons (12 PM - 5 PM)', 'Mornings (8 AM - 12 PM)', 'All Day / Anytime'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      setManualTimeSlot(preset);
                    }}
                    className="text-[10px] font-sketch px-2 py-0.5 bg-[#010502] hover:bg-green-950 text-slate-400 hover:text-green-300 border border-green-900/60 rounded cursor-pointer transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Timezone & Notes (Manual) */}
            <div>
              <label className="block text-xs font-sketch text-slate-300 mb-1">
                Timezone & Additional Timing Details (Manual):
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="e.g. EST / UTC-5, flexible on weekends, message on Discord anytime"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none focus:border-green-400 font-sketch text-left"
                style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
              />
            </div>
          </div>

          {/* Section 5: Social Media Links */}
          <div className="p-4 bg-[#020603] rounded border border-green-500/30">
            <h3 className="text-xs font-bold font-display text-green-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Link className="w-4 h-4 text-green-400" />
              <span>5. Social Media & Gamer Profiles</span>
            </h3>
            <p className="text-[11px] font-sketch text-slate-400 mb-3">
              Add your TikTok, Instagram, YouTube, Facebook, Discord, Twitch, Steam, or X handles so players can connect:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* TikTok */}
              <div>
                <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                  <TikTokIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>TikTok (@handle or link)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. @squadleader or tiktok.com/@..."
                  value={socialLinks.tiktok || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 focus:border-cyan-400 rounded text-xs text-green-100 focus:outline-none transition-colors"
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
                  placeholder="e.g. @pro_gamer or instagram.com/..."
                  value={socialLinks.instagram || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 focus:border-pink-400 rounded text-xs text-green-100 focus:outline-none transition-colors"
                />
              </div>

              {/* YouTube */}
              <div>
                <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                  <span>YouTube (Channel or @handle)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. @GamingChannel or youtube.com/@..."
                  value={socialLinks.youtube || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 focus:border-red-400 rounded text-xs text-green-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Facebook */}
              <div>
                <label className="text-[11px] font-sketch text-slate-300 mb-1 flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5 text-blue-500" />
                  <span>Facebook (Profile or Page link)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. facebook.com/gamerpage or username"
                  value={socialLinks.facebook || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 focus:border-blue-400 rounded text-xs text-green-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Discord */}
              <div>
                <label className="block text-[11px] font-sketch text-slate-400 mb-1">
                  Discord (Tag or Server invite)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Commander#1337 or discord.gg/..."
                  value={socialLinks.discord || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none"
                />
              </div>

              {/* Twitch */}
              <div>
                <label className="block text-[11px] font-sketch text-slate-400 mb-1">
                  Twitch Stream Channel
                </label>
                <input
                  type="text"
                  placeholder="e.g. twitch.tv/yourchannel"
                  value={socialLinks.twitch || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitch: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none"
                />
              </div>

              {/* Steam */}
              <div>
                <label className="block text-[11px] font-sketch text-slate-400 mb-1">
                  Steam Community Profile
                </label>
                <input
                  type="text"
                  placeholder="e.g. steamcommunity.com/id/..."
                  value={socialLinks.steam || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, steam: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none"
                />
              </div>

              {/* Twitter / X */}
              <div>
                <label className="block text-[11px] font-sketch text-slate-400 mb-1">
                  Twitter / X
                </label>
                <input
                  type="text"
                  placeholder="e.g. @yourgamertag"
                  value={socialLinks.twitter || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 rounded text-xs text-green-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Upload Photos (Gallery / Screenshot Showcase) */}
          <div className="p-4 bg-[#020603] rounded border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold font-display text-green-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-green-400" />
                <span>6. Upload Photos & Screenshot Showcase</span>
              </h3>
              <span className="text-[11px] font-mono-num text-green-400">
                {photos.length} Photo{photos.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[11px] font-sketch text-slate-400 mb-3">
              Upload setup photos, match victory screenshots, or highlight clips to display on your map profile!
            </p>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="file"
                ref={galleryInputRef}
                accept="image/*"
                multiple
                onChange={handleGalleryPhotosChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  galleryInputRef.current?.click();
                }}
                className="px-3.5 py-1.5 bg-green-900/60 hover:bg-green-800 text-green-100 text-xs font-sketch rounded border border-green-400 flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(34,197,94,0.3)]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isCompressingGallery ? 'Compressing...' : 'Add Photos / Screenshots'}</span>
              </button>
            </div>

            {/* Photos Grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group bg-[#010603] rounded border border-green-500/40 p-1.5 flex flex-col"
                  >
                    <div className="relative aspect-video rounded overflow-hidden bg-black/60 mb-1.5">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Upload'}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-950 text-red-400 rounded cursor-pointer transition-colors"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Add caption..."
                      value={photo.caption || ''}
                      onChange={(e) => handleUpdatePhotoCaption(photo.id, e.target.value)}
                      className="w-full px-1.5 py-0.5 bg-[#000401] border border-green-500/30 rounded text-[10px] text-green-200 focus:outline-none font-sketch"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-green-500/20 rounded bg-[#010502] text-xs font-sketch text-slate-500">
                No screenshots or photos uploaded yet. Click "Add Photos" above to showcase your gameplay!
              </div>
            )}
          </div>

          {/* Section 7: Danger Zone - Permanent Account Deletion */}
          {user && (
            <div className="p-4 bg-red-950/25 rounded border border-red-500/40">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold font-display text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>7. Danger Zone · Permanent Account Deletion</span>
                </h3>
                <span className="text-[10px] font-mono-num font-bold text-red-400 bg-red-950/90 px-2 py-0.5 rounded border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                  IRREVERSIBLE
                </span>
              </div>
              <p className="text-[11px] font-sketch text-red-200/80 mb-3 leading-relaxed">
                Permanently purge your gamer account, all combat stats, 3D warrior avatar pin, uploaded photos, and active squad beacons from the radar map. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  setConfirmDeleteInput('');
                  setDeletePassword('');
                  setDeleteAccountError(null);
                  setShowDeleteConfirmModal(true);
                }}
                className="px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white text-xs font-sketch font-bold rounded border border-red-500/70 flex items-center gap-2 cursor-pointer transition-colors shadow-[0_0_15px_rgba(239,68,68,0.35)]"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete Account Permanently</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions: Save ("Safe") Button & Cancel */}
        <div className="pt-4 border-t border-green-500/30 mt-3 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="px-4 py-2 text-xs font-sketch text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-6 py-2.5 text-xs font-bold font-display tracking-wider text-green-100 bg-green-900/80 hover:bg-green-800 border border-green-400 rounded cursor-pointer transition-all duration-200 shadow-[0_0_20px_rgba(34,197,94,0.6)] flex items-center gap-2"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            {isSaving ? (
              <span>Saving Dossier...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-green-300" />
                <span>Saved to Map!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-green-400" />
                <span>Save Profile to Map</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Permanent Account Deletion Confirmation Modal Dialog */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div
            className="relative w-full max-w-md bg-[#080202] border-2 border-red-500/80 p-5 rounded-lg text-slate-100 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-in fade-in zoom-in-95 duration-200"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-red-500/30 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold font-display text-red-200 tracking-wide uppercase">
                  Confirm Permanent Deletion
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  setShowDeleteConfirmModal(false);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-sketch text-red-200/90 leading-relaxed mb-3">
              This will <strong className="text-red-400 underline font-bold">permanently erase</strong> your account for{' '}
              <span className="text-white font-mono">{user?.email}</span>.
            </p>

            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded text-[11px] font-sketch text-red-200/90 space-y-1 mb-4">
              <div className="font-bold text-red-300">The following data will be deleted forever:</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                <li>Your Gamer Tag, bio, and gaming preferences</li>
                <li>3D avatar pin and map presence</li>
                <li>All uploaded battlestation screenshots & photos</li>
                <li>All active squad beacons and deployed store shops on the radar</li>
                <li>Your Firebase login account (freeing up the email)</li>
              </ul>
            </div>

            {/* Error Message */}
            {deleteAccountError && (
              <div className="mb-3 p-2.5 bg-red-950/90 border border-red-500 rounded text-red-200 text-xs font-sketch flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{deleteAccountError}</span>
              </div>
            )}

            {/* Optional Password field for re-auth safety */}
            {user?.providerData?.some((p) => p.providerId === 'password') && (
              <div className="mb-3">
                <label className="block text-xs font-sketch text-slate-300 mb-1">
                  Enter Password (to verify authorization):
                </label>
                <input
                  type="password"
                  placeholder="Your current password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#030000] border border-red-500/50 rounded text-xs text-red-100 focus:outline-none focus:border-red-400 placeholder-slate-600 font-mono"
                />
              </div>
            )}

            {/* Confirmation text input */}
            <div className="mb-4">
              <label className="block text-xs font-sketch text-slate-300 mb-1">
                Type <strong className="text-red-400 font-mono">DELETE</strong> in all-caps to confirm:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#030000] border border-red-500/50 rounded text-xs text-red-100 focus:outline-none focus:border-red-400 placeholder-slate-600 font-mono font-bold tracking-widest uppercase"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-500/30">
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  setShowDeleteConfirmModal(false);
                }}
                disabled={isDeletingAccount}
                className="px-3.5 py-1.5 text-xs font-sketch text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccountPermanently}
                disabled={isDeletingAccount || confirmDeleteInput.trim().toUpperCase() !== 'DELETE'}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold font-display uppercase tracking-wider rounded border border-red-400 flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Character Selection UI Modal */}
      {showCharacterSelectModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playSketchClick();
              setShowCharacterSelectModal(false);
            }
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-[#030904] text-slate-100 p-5 sm:p-6 relative border border-lime-400 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.5)] cursor-default my-auto overflow-y-auto max-h-[92vh]"
            style={{
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-green-500/25">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-lime-950/80 rounded-lg border border-lime-400/60 shadow-[0_0_10px_rgba(163,230,53,0.3)]">
                  <Gamepad2 className="w-5 h-5 text-lime-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-display text-white">
                    Character Selection
                  </h3>
                  <p className="text-xs font-sketch text-slate-300">
                    Select your tactical 3D avatar pin to deploy on the Map & Radar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  setShowCharacterSelectModal(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-green-900/40 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checkout Notification / Status Banner */}
            {checkoutMessage && (
              <div
                className={`mb-3 p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-sketch ${
                  checkoutMessage.type === 'error'
                    ? 'bg-red-950/70 border-red-500/50 text-red-200'
                    : checkoutMessage.type === 'success'
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                    : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200'
                }`}
              >
                <span>{checkoutMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setCheckoutMessage(null)}
                  className="p-1 hover:bg-white/10 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Active Stripe Checkout Banner */}
            {activeCheckoutSession && (
              <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-purple-950/80 border-2 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.4)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-center sm:text-left">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h4 className="text-sm font-bold font-display text-white">
                      Stripe Checkout: {activeCheckoutSession.charName} ($3.00)
                    </h4>
                    <p className="text-[11px] font-sketch text-purple-200">
                      Payment window opened! Complete payment on Stripe to unlock your 3D character.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={activeCheckoutSession.url}
                    target="_top"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-3.5 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-display font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.5)] text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Direct Stripe Window</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={handleVerifyPendingPayment}
                    disabled={isVerifyingCheckout}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 bg-lime-400 hover:bg-lime-300 text-black font-display font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(163,230,53,0.5)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isVerifyingCheckout ? (
                      <span className="animate-pulse">Checking...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>I Paid · Unlock</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCheckoutSession(null);
                      setUnlockingCharacter(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 4 Character Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
              {/* Card 1: Girl Warrior */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('waving');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'waving'
                    ? 'border-2 border-lime-400 bg-gradient-to-b from-[#0e2a14] to-[#041207] shadow-[0_0_30px_rgba(163,230,53,0.55)] scale-[1.02]'
                    : 'border-2 border-green-500/30 bg-[#020803] hover:border-lime-500/60 hover:bg-[#051408]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'waving' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-lime-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#a3e635]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-pink-300 bg-pink-950/60 border border-pink-400/40 rounded">
                  CYBER VALKYRIE
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="waving"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Valkyrie'}
                    isLive={characterAvatar === 'waving'}
                    speechText="READY!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Girl Warrior
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Armored cyber suit with visor optics, magenta combat trim & wave emote.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'waving'
                      ? 'bg-lime-400 text-black shadow-[0_0_12px_rgba(163,230,53,0.6)]'
                      : 'bg-green-950/80 text-green-300 border border-green-500/40 hover:bg-green-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'waving' ? '✓ Selected' : 'Choose Girl Warrior'}
                </div>
              </div>

              {/* Card 2: Boy Warrior */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('classic');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'classic'
                    ? 'border-2 border-lime-400 bg-gradient-to-b from-[#0e2a14] to-[#041207] shadow-[0_0_30px_rgba(163,230,53,0.55)] scale-[1.02]'
                    : 'border-2 border-green-500/30 bg-[#020803] hover:border-lime-500/60 hover:bg-[#051408]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'classic' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-lime-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#a3e635]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-sky-300 bg-sky-950/60 border border-sky-400/40 rounded">
                  SCOUT VANGUARD
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="classic"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Scout'}
                    isLive={characterAvatar === 'classic'}
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Boy Warrior
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Red tactical scout cap, cobalt battle tunic, and ready combat stance.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'classic'
                      ? 'bg-lime-400 text-black shadow-[0_0_12px_rgba(163,230,53,0.6)]'
                      : 'bg-green-950/80 text-green-300 border border-green-500/40 hover:bg-green-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'classic' ? '✓ Selected' : 'Choose Boy Warrior'}
                </div>
              </div>

              {/* Card 3: Pumpkin Monster */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('pumpkin');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'pumpkin'
                    ? 'border-2 border-orange-400 bg-gradient-to-b from-[#2a1304] to-[#120704] shadow-[0_0_30px_rgba(251,146,60,0.55)] scale-[1.02]'
                    : 'border-2 border-orange-500/30 bg-[#080402] hover:border-orange-500/60 hover:bg-[#140a05]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'pumpkin' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-orange-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#fb923c]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-orange-300 bg-orange-950/60 border border-orange-400/40 rounded">
                  PUMPKIN DREAD
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="pumpkin"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Monster'}
                    isLive={characterAvatar === 'pumpkin'}
                    speechText="BOO!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Pumpkin Monster
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Glowing Jack-O'-Lantern head, sharp claw hands, torn coat & floating embers.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'pumpkin'
                      ? 'bg-orange-400 text-black shadow-[0_0_12px_rgba(251,146,60,0.6)]'
                      : 'bg-orange-950/80 text-orange-300 border border-orange-500/40 hover:bg-orange-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'pumpkin' ? '✓ Selected' : 'Choose Pumpkin Monster'}
                </div>
              </div>

              {/* Card 4: Girly Pumpkin */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('girly_pumpkin');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'girly_pumpkin'
                    ? 'border-2 border-pink-400 bg-gradient-to-b from-[#2e0e24] to-[#12040e] shadow-[0_0_30px_rgba(244,114,182,0.55)] scale-[1.02]'
                    : 'border-2 border-pink-500/30 bg-[#090206] hover:border-pink-500/60 hover:bg-[#150510]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'girly_pumpkin' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-pink-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#f472b6]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-pink-300 bg-pink-950/60 border border-pink-400/40 rounded">
                  SWEET PUMPKIN
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="girly_pumpkin"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Princess'}
                    isLive={characterAvatar === 'girly_pumpkin'}
                    speechText="CUTE!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Girly Pumpkin
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Glowing heart-carved eyes, pink ribbon bow, frilly dress, boots & floating sparkles.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'girly_pumpkin'
                      ? 'bg-pink-400 text-black shadow-[0_0_12px_rgba(244,114,182,0.6)]'
                      : 'bg-pink-950/80 text-pink-300 border border-pink-500/40 hover:bg-pink-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'girly_pumpkin' ? '✓ Selected' : 'Choose Girly Pumpkin'}
                </div>
              </div>

              {/* Card 5: Jason Voorhees */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('jason');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'jason'
                    ? 'border-2 border-red-500 bg-gradient-to-b from-[#2a0e0e] to-[#120404] shadow-[0_0_30px_rgba(239,68,68,0.55)] scale-[1.02]'
                    : 'border-2 border-red-500/30 bg-[#080202] hover:border-red-500/60 hover:bg-[#140505]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'jason' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-500 text-white font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#ef4444]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-red-300 bg-red-950/60 border border-red-500/40 rounded">
                  CRYSTAL LAKE SLASHER
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="jason"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Jason'}
                    isLive={characterAvatar === 'jason'}
                    speechText="KI-KI-KI!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Jason Voorhees
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Iconic hockey mask, olive work jacket, bloody machete & campfire embers.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'jason'
                      ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                      : 'bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'jason' ? '✓ Selected' : 'Choose Jason'}
                </div>
              </div>

              {/* Card 6: Ghostface */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('ghostface');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'ghostface'
                    ? 'border-2 border-slate-300 bg-gradient-to-b from-[#1c2230] to-[#090b10] shadow-[0_0_30px_rgba(203,213,225,0.45)] scale-[1.02]'
                    : 'border-2 border-slate-700/50 bg-[#06080e] hover:border-slate-500 hover:bg-[#0c1018]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'ghostface' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-slate-200 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#e2e8f0]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-slate-300 bg-slate-900/80 border border-slate-600/50 rounded">
                  WOODSBORO STALKER
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="ghostface"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Ghostface'}
                    isLive={characterAvatar === 'ghostface'}
                    speechText="SCARY!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Ghostface
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Screaming mask, pointed cowl hood, hanging streamers & Buck 120 knife.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'ghostface'
                      ? 'bg-slate-200 text-black shadow-[0_0_12px_rgba(241,245,249,0.6)]'
                      : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'ghostface' ? '✓ Selected' : 'Choose Ghostface'}
                </div>
              </div>

              {/* Card 7: Michael Myers */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('michael_myers');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'michael_myers'
                    ? 'border-2 border-indigo-400 bg-gradient-to-b from-[#141d2e] to-[#070b14] shadow-[0_0_30px_rgba(129,140,248,0.55)] scale-[1.02]'
                    : 'border-2 border-indigo-900/50 bg-[#050810] hover:border-indigo-500/60 hover:bg-[#090e1c]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'michael_myers' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-indigo-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#818cf8]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-indigo-300 bg-indigo-950/60 border border-indigo-400/40 rounded">
                  HADDONFIELD BOOGEYMAN
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="michael_myers"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Myers'}
                    isLive={characterAvatar === 'michael_myers'}
                    speechText="..."
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Michael Myers
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Bleached pale mask, dark hollow eyes, navy mechanic suit & butcher knife.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'michael_myers'
                      ? 'bg-indigo-400 text-black shadow-[0_0_12px_rgba(129,140,248,0.6)]'
                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'michael_myers' ? '✓ Selected' : 'Choose Michael Myers'}
                </div>
              </div>

              {/* Card 8: Freddy Krueger */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('freddy');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'freddy'
                    ? 'border-2 border-red-600 bg-gradient-to-b from-[#2e0a0a] to-[#0f0404] shadow-[0_0_30px_rgba(220,38,38,0.55)] scale-[1.02]'
                    : 'border-2 border-red-900/50 bg-[#080202] hover:border-red-600/60 hover:bg-[#140505]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'freddy' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-600 text-white font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#dc2626]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="px-2 py-0.5 mb-1 text-[9px] font-mono-num uppercase tracking-wider text-red-300 bg-red-950/80 border border-red-600/50 rounded">
                  SPRINGWOOD SLASHER
                </div>
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="freddy"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Freddy'}
                    isLive={characterAvatar === 'freddy'}
                    speechText="DREAM!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Freddy Krueger
                </h4>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Brown fedora hat, red & dark green striped sweater, burned skin & razor-claw glove.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'freddy'
                      ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.6)]'
                      : 'bg-red-950/80 text-red-300 border border-red-800/50 hover:bg-red-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'freddy' ? '✓ Selected' : 'Choose Freddy Krueger'}
                </div>
              </div>

              {/* Card 9: Cyber Soccer Girl & Akita Inu */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('cyber_soccer_girl');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'cyber_soccer_girl'
                    ? 'border-2 border-pink-400 bg-gradient-to-b from-[#2a0f2e] to-[#0d0412] shadow-[0_0_30px_rgba(236,72,153,0.55)] scale-[1.02]'
                    : 'border-2 border-pink-900/50 bg-[#0c0410] hover:border-pink-500/60 hover:bg-[#160820]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'cyber_soccer_girl' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-pink-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#f472b6]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="cyber_soccer_girl"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Striker'}
                    isLive={characterAvatar === 'cyber_soccer_girl'}
                    speechText="GOAL!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Cyber Soccer Girl
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-pink-950/80 border border-pink-500/40 text-pink-300 text-[10px] font-mono font-bold rounded-full">
                  ANIME + AKITA
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Blue cyber skin, pink twin tails, purple jersey dress, glowing cyber tattoos & Akita Inu on leash.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'cyber_soccer_girl'
                      ? 'bg-pink-400 text-black shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                      : 'bg-pink-950/80 text-pink-300 border border-pink-800/50 hover:bg-pink-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'cyber_soccer_girl' ? '✓ Selected' : 'Choose Soccer Girl'}
                </div>
              </div>

              {/* Card 10: Cyber Soccer Player & Shiba Inu */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('cyber_soccer_boy');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'cyber_soccer_boy'
                    ? 'border-2 border-emerald-400 bg-gradient-to-b from-[#0a2618] to-[#040e09] shadow-[0_0_30px_rgba(16,185,129,0.55)] scale-[1.02]'
                    : 'border-2 border-emerald-900/50 bg-[#030d07] hover:border-emerald-500/60 hover:bg-[#071a10]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'cyber_soccer_boy' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-emerald-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#34d399]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="cyber_soccer_boy"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Player 10'}
                    isLive={characterAvatar === 'cyber_soccer_boy'}
                    speechText="STRIKE!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Cyber Soccer Player
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold rounded-full">
                  ANIME + SHIBA
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Red cyber skin, green striker jersey, spiky hair, soccer boots & tan/cream Shiba Inu on leash.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'cyber_soccer_boy'
                      ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'cyber_soccer_boy' ? '✓ Selected' : 'Choose Soccer Player'}
                </div>
              </div>

              {/* Card 11: Lavender Anime Girl & Gray Cat */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('purple_anime_girl');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'purple_anime_girl'
                    ? 'border-2 border-purple-400 bg-gradient-to-b from-[#241038] to-[#0c0514] shadow-[0_0_30px_rgba(168,85,247,0.55)] scale-[1.02]'
                    : 'border-2 border-purple-900/50 bg-[#090310] hover:border-purple-500/60 hover:bg-[#150722]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'purple_anime_girl' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-purple-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#c084fc]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="purple_anime_girl"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Neko'}
                    isLive={characterAvatar === 'purple_anime_girl'}
                    speechText="MEOW!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Lavender Anime Girl
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold rounded-full">
                  ANIME + CAT
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Pastel purple skin, violet dress with golden gem, waving hello & playful gray cat.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'purple_anime_girl'
                      ? 'bg-purple-400 text-black shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                      : 'bg-purple-950/80 text-purple-300 border border-purple-800/50 hover:bg-purple-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'purple_anime_girl' ? '✓ Selected' : 'Choose Lavender Girl'}
                </div>
              </div>

              {/* Card 12: Anime Traveler & Blue Dog */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('mexican_traveler');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'mexican_traveler'
                    ? 'border-2 border-amber-400 bg-gradient-to-b from-[#2e1d0a] to-[#120b04] shadow-[0_0_30px_rgba(245,158,11,0.55)] scale-[1.02]'
                    : 'border-2 border-amber-900/50 bg-[#0e0702] hover:border-amber-500/60 hover:bg-[#1c0f05]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'mexican_traveler' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#fbbf24]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="mexican_traveler"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Amigo'}
                    isLive={characterAvatar === 'mexican_traveler'}
                    speechText="HOLA!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Traveler
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold rounded-full">
                  ANIME + DOG
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Traditional sombrero, multi-colored serape poncho stripes & loyal blue dog.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'mexican_traveler'
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-800/50 hover:bg-amber-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'mexican_traveler' ? '✓ Selected' : 'Choose Traveler'}
                </div>
              </div>

              {/* Card 13: Cool Alien Girl & Alien Dog */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('alien_girl');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'alien_girl'
                    ? 'border-2 border-rose-400 bg-gradient-to-b from-[#240a24] to-[#08020b] shadow-[0_0_30px_rgba(244,63,94,0.55)] scale-[1.02]'
                    : 'border-2 border-rose-900/50 bg-[#0b030b] hover:border-rose-500/60 hover:bg-[#1a071a]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'alien_girl' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-rose-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#fb7185]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="alien_girl"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Stella'}
                    isLive={characterAvatar === 'alien_girl'}
                    speechText="PEACE!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Cool Alien Girl
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-bold rounded-full">
                  COSMIC + PUPPY
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Lavender alien skin, star antennae, bouncy pigtails, glowing heart core & antenna puppy.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'alien_girl'
                      ? 'bg-rose-400 text-black shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800/50 hover:bg-rose-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'alien_girl' ? '✓ Selected' : 'Choose Alien Girl'}
                </div>
              </div>

              {/* Card 14: Cool Alien Boy & Alien Dog */}
              <div
                onClick={() => {
                  playSketchClick();
                  setCharacterAvatar('alien_boy');
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                  characterAvatar === 'alien_boy'
                    ? 'border-2 border-cyan-400 bg-gradient-to-b from-[#061e24] to-[#020a0d] shadow-[0_0_30px_rgba(6,182,212,0.55)] scale-[1.02]'
                    : 'border-2 border-cyan-900/50 bg-[#02090c] hover:border-cyan-500/60 hover:bg-[#05171e]'
                }`}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {characterAvatar === 'alien_boy' && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-cyan-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#22d3ee]">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}
                <div className="my-1 pointer-events-none">
                  <BlockyCharacter3D
                    variant="alien_boy"
                    width={90}
                    height={125}
                    gamerTag={gamerTag || 'Cosmo'}
                    isLive={characterAvatar === 'alien_boy'}
                    speechText="COSMIC!"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                  Cool Alien Boy
                </h4>
                <div className="inline-block px-2 py-0.5 mt-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold rounded-full">
                  COSMIC + PUPPY
                </div>
                <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                  Green alien skin, dark space suit with cyan glowing core & antenna alien dog.
                </p>
                <div
                  className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors ${
                    characterAvatar === 'alien_boy'
                      ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                      : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  {characterAvatar === 'alien_boy' ? '✓ Selected' : 'Choose Alien Boy'}
                </div>
              </div>

              {/* Card 15: Moon Demon Noble & Floating Blade */}
              {(() => {
                const unlocked = isCharacterUnlocked('moon_demon_noble');
                const isSelected = characterAvatar === 'moon_demon_noble';
                const isBusy = unlockingCharacter === 'moon_demon_noble';
                return (
                  <div
                    onClick={() => {
                      playSketchClick();
                      if (unlocked) {
                        setCharacterAvatar('moon_demon_noble');
                      } else {
                        handleUnlockCharacter('moon_demon_noble', 'Moon Demon Noble');
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-2 border-purple-400 bg-gradient-to-b from-[#250d3a] to-[#0d0317] shadow-[0_0_30px_rgba(168,85,247,0.6)] scale-[1.02]'
                        : 'border-2 border-purple-900/50 bg-[#0d0317] hover:border-purple-500/60 hover:bg-[#1a082b]'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-purple-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#c084fc]">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    {!unlocked && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[9px] rounded-full flex items-center gap-1 shadow-[0_0_8px_#f59e0b]">
                        <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>$3.00 UNLOCK</span>
                      </div>
                    )}
                    <div className="my-1 pointer-events-none">
                      <BlockyCharacter3D
                        variant="moon_demon_noble"
                        width={90}
                        height={125}
                        gamerTag={gamerTag || 'Noble'}
                        isLive={isSelected}
                        speechText="SILENCE!"
                      />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                      Moon Demon Noble
                    </h4>
                    <div className="inline-block px-2 py-0.5 mt-1 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold rounded-full">
                      B&W NOBLE + GLOWING BLADE
                    </div>
                    <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                      Black & white sketch block-toon, silver hair, crescent crest, fur mokomoko & glowing color-shifting Bakusaiga blade.
                    </p>
                    <div
                      className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-purple-400 text-black shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                          : unlocked
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50 hover:bg-purple-900'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black'
                      }`}
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                      {isSelected ? (
                        '✓ Selected'
                      ) : unlocked ? (
                        'Choose Moon Demon Noble'
                      ) : isBusy ? (
                        'Connecting...'
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-black stroke-[2.5]" />
                          <span>Unlock for $3.00</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Card 16: Demon Dog Warrior & Tessaiga Blade */}
              {(() => {
                const unlocked = isCharacterUnlocked('demon_dog_warrior');
                const isSelected = characterAvatar === 'demon_dog_warrior';
                const isBusy = unlockingCharacter === 'demon_dog_warrior';
                return (
                  <div
                    onClick={() => {
                      playSketchClick();
                      if (unlocked) {
                        setCharacterAvatar('demon_dog_warrior');
                      } else {
                        handleUnlockCharacter('demon_dog_warrior', 'Demon Dog Warrior');
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-2 border-red-500 bg-gradient-to-b from-[#380b0b] to-[#120303] shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-[1.02]'
                        : 'border-2 border-red-950/60 bg-[#120303] hover:border-red-500/60 hover:bg-[#200606]'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-500 text-white font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#ef4444]">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    {!unlocked && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[9px] rounded-full flex items-center gap-1 shadow-[0_0_8px_#f59e0b]">
                        <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>$3.00 UNLOCK</span>
                      </div>
                    )}
                    <div className="my-1 pointer-events-none">
                      <BlockyCharacter3D
                        variant="demon_dog_warrior"
                        width={90}
                        height={125}
                        gamerTag={gamerTag || 'Warrior'}
                        isLive={isSelected}
                        speechText="IRON REAVER!"
                      />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                      Demon Dog Warrior
                    </h4>
                    <div className="inline-block px-2 py-0.5 mt-1 bg-red-950/80 border border-red-500/40 text-red-300 text-[10px] font-mono font-bold rounded-full">
                      B&W WARRIOR + GLOWING ORB
                    </div>
                    <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                      Black & white sketch block-toon, dog ears, flowing silver hair, charcoal kimono & floating glowing Shikon Jewel.
                    </p>
                    <div
                      className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                          : unlocked
                          ? 'bg-red-950/80 text-red-300 border border-red-800/50 hover:bg-red-900'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black'
                      }`}
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                      {isSelected ? (
                        '✓ Selected'
                      ) : unlocked ? (
                        'Choose Demon Dog Warrior'
                      ) : isBusy ? (
                        'Connecting...'
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-black stroke-[2.5]" />
                          <span>Unlock for $3.00</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Card 17: Celestial Moon Guardian & Moon Stick */}
              {(() => {
                const unlocked = isCharacterUnlocked('celestial_moon_guardian');
                const isSelected = characterAvatar === 'celestial_moon_guardian';
                const isBusy = unlockingCharacter === 'celestial_moon_guardian';
                return (
                  <div
                    onClick={() => {
                      playSketchClick();
                      if (unlocked) {
                        setCharacterAvatar('celestial_moon_guardian');
                      } else {
                        handleUnlockCharacter('celestial_moon_guardian', 'Celestial Moon Guardian');
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-2 border-pink-400 bg-gradient-to-b from-[#350d24] to-[#14030d] shadow-[0_0_30px_rgba(244,114,182,0.6)] scale-[1.02]'
                        : 'border-2 border-pink-950/60 bg-[#14030d] hover:border-pink-500/60 hover:bg-[#240618]'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-pink-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#f472b6]">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    {!unlocked && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[9px] rounded-full flex items-center gap-1 shadow-[0_0_8px_#f59e0b]">
                        <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>$3.00 UNLOCK</span>
                      </div>
                    )}
                    <div className="my-1 pointer-events-none">
                      <BlockyCharacter3D
                        variant="celestial_moon_guardian"
                        width={90}
                        height={125}
                        gamerTag={gamerTag || 'Usagi'}
                        isLive={isSelected}
                        speechText="COSMIC POWER!"
                      />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                      Celestial Moon Guardian
                    </h4>
                    <div className="inline-block px-2 py-0.5 mt-1 bg-pink-950/80 border border-pink-500/40 text-pink-300 text-[10px] font-mono font-bold rounded-full">
                      B&W GUARDIAN + GLOWING WAND
                    </div>
                    <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                      Black & white sketch block-toon, silver twin odangos, charcoal sailor fuku & floating glowing Cosmic Moon Stick.
                    </p>
                    <div
                      className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-pink-400 text-black shadow-[0_0_12px_rgba(244,114,182,0.6)]'
                          : unlocked
                          ? 'bg-pink-950/80 text-pink-300 border border-pink-800/50 hover:bg-pink-900'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black'
                      }`}
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                      {isSelected ? (
                        '✓ Selected'
                      ) : unlocked ? (
                        'Choose Moon Guardian'
                      ) : isBusy ? (
                        'Connecting...'
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-black stroke-[2.5]" />
                          <span>Unlock for $3.00</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Card 18: Sacred Shrine Priestess & Sacred Bow */}
              {(() => {
                const unlocked = isCharacterUnlocked('sacred_shrine_priestess');
                const isSelected = characterAvatar === 'sacred_shrine_priestess';
                const isBusy = unlockingCharacter === 'sacred_shrine_priestess';
                return (
                  <div
                    onClick={() => {
                      playSketchClick();
                      if (unlocked) {
                        setCharacterAvatar('sacred_shrine_priestess');
                      } else {
                        handleUnlockCharacter('sacred_shrine_priestess', 'Sacred Shrine Priestess');
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-2 border-emerald-400 bg-gradient-to-b from-[#09291b] to-[#030e09] shadow-[0_0_30px_rgba(52,211,153,0.6)] scale-[1.02]'
                        : 'border-2 border-emerald-950/60 bg-[#030e09] hover:border-emerald-500/60 hover:bg-[#071f14]'
                    }`}
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-emerald-400 text-black font-display font-black text-[10px] rounded-full flex items-center gap-1 shadow-[0_0_10px_#34d399]">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                    {!unlocked && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-400 text-black font-display font-black text-[9px] rounded-full flex items-center gap-1 shadow-[0_0_8px_#f59e0b]">
                        <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>$3.00 UNLOCK</span>
                      </div>
                    )}
                    <div className="my-1 pointer-events-none">
                      <BlockyCharacter3D
                        variant="sacred_shrine_priestess"
                        width={90}
                        height={125}
                        gamerTag={gamerTag || 'Miko'}
                        isLive={isSelected}
                        speechText="PURIFY!"
                      />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                      Sacred Shrine Priestess
                    </h4>
                    <div className="inline-block px-2 py-0.5 mt-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold rounded-full">
                      B&W PRIESTESS + GLOWING ARROW
                    </div>
                    <p className="text-[11px] font-sketch text-slate-300 mt-0.5 leading-snug">
                      Black & white sketch block-toon, flowing white hair, charcoal miko robes & floating glowing sacred arrow.
                    </p>
                    <div
                      className={`mt-3 w-full py-1.5 text-xs font-display font-bold tracking-wider rounded transition-colors flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                          : unlocked
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900'
                          : 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black'
                      }`}
                      style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                    >
                      {isSelected ? (
                        '✓ Selected'
                      ) : unlocked ? (
                        'Choose Shrine Priestess'
                      ) : isBusy ? (
                        'Connecting...'
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-black stroke-[2.5]" />
                          <span>Unlock for $3.00</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Confirm button */}
            <button
              type="button"
              onClick={() => {
                playSquadJoinSound();
                setShowCharacterSelectModal(false);
              }}
              className="w-full py-2.5 bg-lime-400 hover:bg-lime-300 text-black text-xs font-display font-bold tracking-wider rounded-xl cursor-pointer shadow-[0_0_20px_rgba(163,230,53,0.5)] transition-all flex items-center justify-center gap-2"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm Character & Return to Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
