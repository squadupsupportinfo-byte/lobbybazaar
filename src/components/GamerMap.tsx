import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Compass,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Radio,
  Users,
  MessageSquare,
  Mic,
  MicOff,
  CheckCircle,
  X,
  Crosshair,
  UserCheck,
  MapPin,
  Move,
  Flame,
  Navigation,
  Signal,
  Trash2,
  Edit3,
  Gamepad2,
  Sparkles,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  Camera,
  Calendar,
  Clock,
  Upload,
  Trophy,
  AlertTriangle,
  Store,
  ShoppingBag,
  Mail,
  Phone,
  CalendarPlus,
  Send,
  UserPlus,
  UserX,
  Instagram,
  Youtube,
  Facebook,
  ShieldAlert,
  Lock,
  Check,
  Building,
  Plane,
} from 'lucide-react';
import { TikTokIcon, formatSocialUrl } from './SocialIcons';
import { SquadBeacon, FriendRequest, FriendRelation, CharacterAvatarType } from '../types';

export function isEventBeacon(squad: SquadBeacon | null | undefined): boolean {
  if (!squad) return false;
  return (
    squad.beaconType === 'other_event' ||
    squad.buildingType === 'grand_event' ||
    Boolean(squad.eventData) ||
    (typeof squad.id === 'string' && squad.id.startsWith('event-'))
  );
}
import {
  subscribeUserConversations,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  subscribeIncomingFriendRequests,
  subscribeSentFriendRequests,
  subscribeUserFriends,
} from '../utils/socialService';
import { POPULAR_GAMES, PLAYSTYLE_OPTIONS } from '../data/mockData';
import { GAMES_DATABASE, searchGames, matchesGameSearch } from '../data/gamesDatabase';
import { playSketchClick, playRadarPing, playSquadJoinSound } from '../utils/audio';
import { useAuth, GamerPhoto } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { reverseGeocodeCoordinates } from '../utils/locationService';
import { compressImage } from '../utils/imageCompressor';
import { GoogleGamerMap } from './GoogleGamerMap';
import { LocationPromptModal } from './LocationPromptModal';
import { BlockyCharacter3D } from './BlockyCharacter3D';
import { StoreBuilding3D } from './StoreBuilding3D';
import { EventBuilding3D } from './EventBuilding3D';
import { GameRoomBuilding3D } from './GameRoomBuilding3D';
import { CreateEventModal } from './CreateEventModal';
import { PhotoLightbox } from './PhotoLightbox';
import { FriendRequestsModal } from './FriendRequestsModal';
import { ChatRoomModal } from './ChatRoomModal';
import { CreateChatRoomModal } from './CreateChatRoomModal';
import { isEventExpired, filterActiveEvents } from '../utils/eventExpiration';
import { Airship3D } from './Airship3D';
import { AirshipBillboardModal } from './AirshipBillboardModal';
import {
  getAirshipFlightStatus,
  subscribeAirshipBillboard,
  AirshipFlightStatus,
  AirshipBillboardData,
  GLOBAL_AIRSHIP_CITIES,
  GlobalAirshipCity,
} from '../utils/airshipFlight';

interface GamerMapProps {
  squads: SquadBeacon[];
  selectedSquad: SquadBeacon | null;
  onSelectSquad: (squad: SquadBeacon | null) => void;
  onBackToWelcome: () => void;
  onOpenCreateSquad: () => void;
  onClearAllMarkers?: () => void;
  initialGameFilter?: string;
  onJoinSquadSuccess: (squadId: string, applicantName: string, applicantRole: string) => void;
  onOpenEditProfile?: () => void;
  onOpenSocialProfile?: (target: any) => void;
  onOpenDirectMessages?: (recipient: any) => void;
  onOpenSellTradeModal?: () => void;
  onOpenEditStore?: () => void;
  onDeleteStore?: (storeId: string) => void;
  onOpenAuthModal?: (mode: 'signup' | 'signin') => void;
  onEventCreated?: (eventBeacon: SquadBeacon) => void;
  onDeployChatRoom?: (room: SquadBeacon) => void;
  onDeleteChatRoom?: (roomId: string) => void;
  termsAgreed?: boolean;
  onOpenTerms?: () => void;
  onOpenSupport?: () => void;
}

export function GamerMap({
  squads,
  selectedSquad,
  onSelectSquad,
  onBackToWelcome,
  onOpenCreateSquad,
  onClearAllMarkers,
  initialGameFilter,
  onJoinSquadSuccess,
  onOpenEditProfile,
  onOpenSocialProfile,
  onOpenDirectMessages,
  onOpenSellTradeModal,
  onOpenEditStore,
  onDeleteStore,
  onOpenAuthModal,
  onEventCreated,
  onDeployChatRoom,
  onDeleteChatRoom,
  termsAgreed = true,
  onOpenTerms,
  onOpenSupport,
}: GamerMapProps) {
  const { user, gamerProfile, updateGamerProfile, deleteAccountPermanently } = useAuth();
  const {
    coords,
    status: locationStatus,
    requestLocation,
    setManualLocation,
    isLive,
    setIsLive,
  } = useLocation();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isCreateChatRoomModalOpen, setIsCreateChatRoomModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>(initialGameFilter || 'All Games');
  const [selectedPlaystyle, setSelectedPlaystyle] = useState<string>('All Styles');
  const [searchRadius, setSearchRadius] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'players'>('map');

  // Handle click outside to close game search dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Compute matching games from database
  const suggestedGames = useMemo(() => {
    return searchGames(searchQuery, 10);
  }, [searchQuery]);
  const [isRadarScanning, setIsRadarScanning] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [applicantTag, setApplicantTag] = useState('');
  const [applicantRole, setApplicantRole] = useState('');
  const [joinedSuccessMessage, setJoinedSuccessMessage] = useState<string | null>(null);
  const [contactCopied, setContactCopied] = useState(false);

  // User's personal beacon pin position on radar canvas
  const [userPinPos, setUserPinPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isRelocatingPin, setIsRelocatingPin] = useState(false);
  const [isUserPinSelected, setIsUserPinSelected] = useState(false); // Map opens unobstructed with live users
  const [mapEngine, setMapEngine] = useState<'google' | 'radar'>('google');
  const [characterAvatar, setCharacterAvatar] = useState<CharacterAvatarType>(
    gamerProfile?.characterAvatar || 'waving'
  );

  useEffect(() => {
    if (gamerProfile?.characterAvatar) {
      setCharacterAvatar(gamerProfile.characterAvatar);
    }
  }, [gamerProfile?.characterAvatar]);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<{
    url: string;
    caption?: string;
    price?: string;
    priceType?: 'firm' | 'negotiable';
    intent?: 'sell' | 'trade' | 'both';
    condition?: string;
    description?: string;
  } | null>(null);
  const [radarZoom, setRadarZoom] = useState<number>(0.75); // zoomed out by default to show wide region
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  // Friend Requests & Mutual Friendships real-time state
  const activeUserId = useMemo(() => {
    if (user?.uid) return user.uid;
    try {
      let gid = localStorage.getItem('squadup_guest_uid');
      if (!gid) {
        gid = `guest_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('squadup_guest_uid', gid);
      }
      return gid;
    } catch {
      return 'guest_player';
    }
  }, [user]);

  const activeUserPhoto = gamerProfile?.photoUrl || user?.photoURL || '';
  const activeUserAvatar = gamerProfile?.characterAvatar || 'classic';

  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequest[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequest[]>([]);
  const [userFriends, setUserFriends] = useState<FriendRelation[]>([]);
  const [isProcessingFriend, setIsProcessingFriend] = useState(false);
  const [friendToast, setFriendToast] = useState<string | null>(null);
  const [isFriendRequestsModalOpen, setIsFriendRequestsModalOpen] = useState(false);

  // Subscribe to friend requests & friendships for active user
  useEffect(() => {
    if (!activeUserId) return;
    const unsubIn = subscribeIncomingFriendRequests(activeUserId, setIncomingFriendRequests);
    const unsubSent = subscribeSentFriendRequests(activeUserId, setSentFriendRequests);
    const unsubFriends = subscribeUserFriends(activeUserId, setUserFriends);

    return () => {
      unsubIn();
      unsubSent();
      unsubFriends();
    };
  }, [activeUserId]);

  // Squadron Airship & Live Billboard State
  const [showAirshipModal, setShowAirshipModal] = useState<boolean>(false);
  const [activeBillboard, setActiveBillboard] = useState<AirshipBillboardData | null>(null);
  const [airshipFlight, setAirshipFlight] = useState<AirshipFlightStatus>(getAirshipFlightStatus());

  useEffect(() => {
    const unsub = subscribeAirshipBillboard((data) => {
      setActiveBillboard(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAirshipFlight(getAirshipFlightStatus());
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  // Find existing chat room owned by this signed-in user (1 room per account limit)
  const existingUserChatRoom = useMemo(() => {
    if (!user) return null;
    return (
      squads.find(
        (s) =>
          s.beaconType === 'chat_room' &&
          (s.ownerId === user.uid || s.chatRoomData?.hostId === user.uid)
      ) || null
    );
  }, [user, squads]);

  const showFriendToast = (msg: string) => {
    setFriendToast(msg);
    setTimeout(() => {
      setFriendToast(null);
    }, 3800);
  };

  const getPlayerFriendStatus = (targetUid: string) => {
    if (!targetUid || !activeUserId) return 'none';
    if (targetUid === activeUserId) return 'self';

    const isFriend = userFriends.some(
      (f) => f.user1Id === targetUid || f.user2Id === targetUid
    );
    if (isFriend) return 'friends';

    const hasSent = sentFriendRequests.some(
      (r) => r.receiverId === targetUid && r.status === 'pending'
    );
    if (hasSent) return 'pending_sent';

    const hasReceived = incomingFriendRequests.some(
      (r) => r.senderId === targetUid && r.status === 'pending'
    );
    if (hasReceived) return 'pending_received';

    return 'none';
  };

  const handleAddFriendClick = async (targetSquad: SquadBeacon) => {
    if (!user) {
      onOpenAuthModal?.('signin');
      return;
    }
    const targetUid = targetSquad.ownerId || targetSquad.id;
    if (targetUid === activeUserId) return;

    setIsProcessingFriend(true);
    try {
      playSketchClick();
      await sendFriendRequest({
        senderId: activeUserId,
        senderGamerTag: activeGamerName,
        senderPhotoUrl: activeUserPhoto,
        senderAvatar: activeUserAvatar,
        receiverId: targetUid,
        receiverGamerTag: targetSquad.name,
        receiverPhotoUrl: targetSquad.photoUrl || '',
        receiverAvatar: targetSquad.characterAvatar || 'classic',
      });
      showFriendToast(`Friend request sent to ${targetSquad.name}!`);

      // If sending to a squad beacon or player on the map, simulate realistic acceptance after ~2 seconds
      const isBotOrSquad =
        targetUid.startsWith('squad-') ||
        targetUid.includes('phantom') ||
        targetUid.includes('recon') ||
        targetUid.length < 15;

      if (isBotOrSquad) {
        setTimeout(async () => {
          try {
            await acceptFriendRequest({
              requestId: `${activeUserId}_${targetUid}`,
              senderId: activeUserId,
              senderGamerTag: activeGamerName,
              senderPhotoUrl: activeUserPhoto,
              senderAvatar: activeUserAvatar,
              receiverId: targetUid,
              receiverGamerTag: targetSquad.name,
              receiverPhotoUrl: targetSquad.photoUrl || '',
              receiverAvatar: targetSquad.characterAvatar || 'classic',
            });
            playSquadJoinSound();
            showFriendToast(`🎉 ${targetSquad.name} accepted your friend request! You are now friends.`);
          } catch (e) {
            console.warn('Auto accept error:', e);
          }
        }, 2200);
      }
    } catch (err: any) {
      console.warn('Could not send friend request:', err);
      showFriendToast(err.message || 'Could not send friend request');
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleAcceptFriendRequest = async (request: FriendRequest) => {
    if (!user) {
      onOpenAuthModal?.('signin');
      return;
    }
    setIsProcessingFriend(true);
    try {
      playSquadJoinSound();
      await acceptFriendRequest({
        requestId: request.id,
        senderId: request.senderId,
        senderGamerTag: request.senderGamerTag,
        senderPhotoUrl: request.senderPhotoUrl,
        senderAvatar: request.senderAvatar,
        receiverId: activeUserId,
        receiverGamerTag: activeGamerName,
        receiverPhotoUrl: activeUserPhoto,
        receiverAvatar: activeUserAvatar,
      });
      showFriendToast(`You and ${request.senderGamerTag} are now friends! 🎮`);
    } catch (err) {
      console.warn('Accept friend request error:', err);
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleDeclineFriendRequest = async (request: FriendRequest) => {
    if (!user) {
      onOpenAuthModal?.('signin');
      return;
    }
    setIsProcessingFriend(true);
    try {
      playSketchClick();
      await declineFriendRequest(request.id, activeUserId);
      showFriendToast(`Declined request from ${request.senderGamerTag}`);
    } catch (err) {
      console.warn('Decline friend request error:', err);
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleCancelFriendRequest = async (targetUid: string, targetName: string) => {
    if (!user) {
      onOpenAuthModal?.('signin');
      return;
    }
    setIsProcessingFriend(true);
    try {
      playSketchClick();
      await cancelFriendRequest(activeUserId, targetUid);
      showFriendToast(`Cancelled friend request to ${targetName}`);
    } catch (err) {
      console.warn('Cancel friend request error:', err);
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleRemoveFriend = async (targetUid: string, targetName: string) => {
    if (!user) {
      onOpenAuthModal?.('signin');
      return;
    }
    setIsProcessingFriend(true);
    try {
      playSketchClick();
      await removeFriend(activeUserId, targetUid);
      showFriendToast(`Removed ${targetName} from friends`);
    } catch (err) {
      console.warn('Remove friend error:', err);
    } finally {
      setIsProcessingFriend(false);
    }
  };

  // Real-time unread messages count subscription for logged in user
  useEffect(() => {
    if (!user) {
      setUnreadMessagesCount(0);
      return;
    }
    const unsub = subscribeUserConversations(user.uid, (convs) => {
      let count = 0;
      convs.forEach((c) => {
        if (c.unreadCounts && c.unreadCounts[user.uid]) {
          count += c.unreadCounts[user.uid];
        }
      });
      setUnreadMessagesCount(count);
    });
    return () => unsub();
  }, [user]);

  // Global Escape key listener to effortlessly close dossiers and lightboxes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedLightboxPhoto) {
          setSelectedLightboxPhoto(null);
        } else if (isUserPinSelected) {
          setIsUserPinSelected(false);
        } else if (selectedSquad) {
          onSelectSquad(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUserPinSelected, selectedSquad, selectedLightboxPhoto, onSelectSquad]);

  // Permanent Deletion States for User Profile & 3D Character on Map
  const [showDossierDeleteModal, setShowDossierDeleteModal] = useState(false);
  const [dossierDeletePassword, setDossierDeletePassword] = useState('');
  const [dossierConfirmWord, setDossierConfirmWord] = useState('');
  const [isDeletingDossier, setIsDeletingDossier] = useState(false);
  const [dossierDeleteError, setDossierDeleteError] = useState<string | null>(null);

  // Remove 3D Character from map without deleting account
  const handleRemoveCharacterFromMap = async () => {
    setIsDeletingDossier(true);
    setDossierDeleteError(null);
    try {
      playSketchClick();
      setIsLive(false);
      await updateGamerProfile({ isLive: false });
      setShowDossierDeleteModal(false);
      setIsUserPinSelected(false);
    } catch (err: any) {
      setDossierDeleteError(err.message || 'Failed to remove character from map.');
    } finally {
      setIsDeletingDossier(false);
    }
  };

  // Permanently delete user profile, character, and account forever
  const handlePermanentProfileDeletion = async () => {
    if (dossierConfirmWord.trim().toUpperCase() !== 'DELETE') {
      setDossierDeleteError('Please type "DELETE" into the confirmation field.');
      return;
    }
    setIsDeletingDossier(true);
    setDossierDeleteError(null);
    try {
      playSketchClick();
      setIsLive(false);
      await deleteAccountPermanently(dossierDeletePassword.trim() || undefined);
      setShowDossierDeleteModal(false);
      setIsUserPinSelected(false);
      onBackToWelcome();
    } catch (err: any) {
      setDossierDeleteError(err.message || 'Failed to permanently delete profile and character. Please try again.');
    } finally {
      setIsDeletingDossier(false);
    }
  };

  const handleDirectPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsUploadingPhoto(true);
      playSketchClick();
      const newPhotos: GamerPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await compressImage(file, 800, 0.8);
        newPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: dataUrl,
          caption: file.name.replace(/\.[^/.]+$/, '').slice(0, 40),
          uploadedAt: new Date().toISOString(),
        });
      }
      const existing = gamerProfile?.photos || [];
      const updated = [...newPhotos, ...existing];
      await updateGamerProfile({ photos: updated });
    } catch (err) {
      console.error('Failed to upload photos:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Compute calculated proximity distance for each squad (filtering out expired events automatically)
  const squadsWithDistance = useMemo(() => {
    const activeSquads = filterActiveEvents(squads);
    return activeSquads.map((sq, i) => {
      const baseKm = 0.6 + ((i * 3 + sq.name.length) % 18) * 0.7;
      const distanceKm = coords ? baseKm : baseKm + 1.2;
      return {
        ...sq,
        distanceKm,
        formattedDistance: `${distanceKm.toFixed(1)} km away`,
      };
    });
  }, [squads, coords]);

  // Total count of active events currently deployed
  const liveEventsCount = useMemo(() => {
    return squadsWithDistance.filter(
      (s) => s.beaconType === 'other_event' || s.buildingType === 'grand_event'
    ).length;
  }, [squadsWithDistance]);

  // Total count of active live chat rooms currently deployed
  const liveChatRoomsCount = useMemo(() => {
    return squadsWithDistance.filter((s) => s.beaconType === 'chat_room').length;
  }, [squadsWithDistance]);

  // If the currently selected squad is an event that has now expired, auto-deselect it
  useEffect(() => {
    if (selectedSquad && isEventExpired(selectedSquad)) {
      onSelectSquad(null);
    }
  }, [selectedSquad, onSelectSquad]);

  const handleOpenJoinModal = () => {
    playSketchClick();
    if (gamerProfile?.gamerTag) {
      setApplicantTag(gamerProfile.gamerTag);
      if (gamerProfile.role) {
        setApplicantRole(gamerProfile.role);
      }
    }
    setJoinModalOpen(true);
  };

  // Trigger manual radar ping
  const handleTriggerRadarPing = () => {
    playRadarPing();
    setIsRadarScanning(true);
    setTimeout(() => {
      setIsRadarScanning(false);
    }, 2500);
  };

  // Handle clicking on map canvas to relocate personal pin if in relocate mode
  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRelocatingPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(10, Math.min(90, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setUserPinPos({ x, y });
    setIsRelocatingPin(false);
    setIsUserPinSelected(true);
    onSelectSquad(null);
    playRadarPing();

    // Calculate real coordinate offset from current center
    const centerLat = coords?.lat ?? 34.0522;
    const centerLng = coords?.lng ?? -118.2437;
    const targetLat = centerLat + ((50 - y) / 50) * 0.15;
    const targetLng = centerLng + ((x - 50) / 50) * 0.15;
    const rev = await reverseGeocodeCoordinates(targetLat, targetLng);
    const locName = rev?.cityName || `Tactical Sector (${Math.round(x)}%, ${Math.round(y)}%)`;
    setManualLocation(locName, targetLat, targetLng, rev?.country);
    if (user && gamerProfile) {
      updateGamerProfile({
        locationName: locName,
        coords: { lat: targetLat, lng: targetLng },
      }).catch(() => {});
    }
  };

  // Handle clicking anywhere on Google Tactical Map to drop pin
  const handleGoogleMapClick = async (lat: number, lng: number) => {
    if (!isRelocatingPin) return;
    playRadarPing();
    setIsRelocatingPin(false);
    setIsUserPinSelected(true);
    onSelectSquad(null);

    const rev = await reverseGeocodeCoordinates(lat, lng);
    const locName = rev?.cityName || `Sector ${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
    setManualLocation(locName, lat, lng, rev?.country);
    if (user && gamerProfile) {
      updateGamerProfile({
        locationName: locName,
        coords: { lat, lng },
      }).catch(() => {});
    }
  };

  // Current user's store (1 store per user limit)
  const currentUserStore = user
    ? squads.find((s) => (s.beaconType === 'store' || !!s.storeData) && s.ownerId === user.uid)
    : null;

  // Filter squads based on direct selection (consoles, tournaments, other events) and search query
  // STRICT SEPARATION RULE: Characters and Stores are NEVER shown together on the map
  const filteredSquads = useMemo(() => {
    const cleanQ = searchQuery.toLowerCase().trim();
    // Detect if user query explicitly targets events (e.g. "event", "hall", tournament title, or matching an event's name/zip)
    const isSearchTargetingEvents =
      activeFilter === 'Events' ||
      (!!cleanQ &&
        (cleanQ.includes('event') ||
          cleanQ.includes('hall') ||
          squadsWithDistance.some(
            (s) =>
              (s.beaconType === 'other_event' || s.buildingType === 'grand_event') &&
              (s.name.toLowerCase().includes(cleanQ) || (s.zipCode && s.zipCode.includes(cleanQ)))
          )));

    return squadsWithDistance
      .filter((squad) => {
        const isStore = squad.beaconType === 'store' || !!squad.storeData;
        const isEvent = squad.beaconType === 'other_event' || squad.buildingType === 'grand_event';
        const isChatRoom = squad.beaconType === 'chat_room';

        // 1. Separation Filter: Events vs Stores vs Chat Rooms vs Characters/Squads
        if (activeFilter === 'ChatRooms') {
          // CHAT ROOMS MODE: Show ONLY live chat rooms on the map!
          if (!isChatRoom) return false;
        } else if (isSearchTargetingEvents) {
          // If searching events or in Events mode, show ONLY live events!
          if (!isEvent) return false;
        } else if (activeFilter === 'Stores') {
          // BUY OR TRADE MODE: Show ONLY live stores. All characters/squads and events are strictly hidden!
          if (!isStore) return false;
        } else {
          // DEFAULT / CHARACTER / SQUAD MODE: Show characters and squads. Stores, Events, and Chat Rooms are strictly hidden!
          if (isStore) return false;
          if (isEvent) return false;
          if (isChatRoom) return false;

          // Exclude any squad/beacon representing the currently logged-in user so the user never sees duplicate player pins
          const currentUid = user?.uid || gamerProfile?.uid;
          const currentTag = (gamerProfile?.gamerTag || user?.displayName || '').trim().toLowerCase();
          if (currentUid && (squad.ownerId === currentUid || squad.id === `user_${currentUid}` || squad.id === '__user_pin__')) {
            return false;
          }
          if (currentTag && squad.name && squad.name.trim().toLowerCase() === currentTag) {
            return false;
          }

          if (activeFilter === 'Tournaments') {
            const isTournament = squad.beaconType === 'tournament' || squad.playstyle === 'Tournament';
            if (!isTournament) return false;
          }
        }

        // 2. Search query filter
        if (cleanQ) {
          const q = cleanQ;

          if (activeFilter === 'ChatRooms') {
            const matchesChatRoom =
              squad.name.toLowerCase().includes(q) ||
              (squad.description && squad.description.toLowerCase().includes(q)) ||
              (squad.game && squad.game.toLowerCase().includes(q)) ||
              (squad.chatRoomData?.topic && squad.chatRoomData.topic.toLowerCase().includes(q)) ||
              (squad.chatRoomData?.hostName && squad.chatRoomData.hostName.toLowerCase().includes(q)) ||
              (squad.sector && squad.sector.toLowerCase().includes(q)) ||
              (squad.zipCode && squad.zipCode.includes(q)) ||
              q.includes('chat') ||
              q.includes('room');

            if (!matchesChatRoom) return false;
          } else if (isSearchTargetingEvents) {
            const matchesEvent =
              squad.name.toLowerCase().includes(q) ||
              (squad.description && squad.description.toLowerCase().includes(q)) ||
              (squad.locationAddress && squad.locationAddress.toLowerCase().includes(q)) ||
              (squad.locationName && squad.locationName.toLowerCase().includes(q)) ||
              (squad.sector && squad.sector.toLowerCase().includes(q)) ||
              (squad.zipCode && squad.zipCode.includes(q)) ||
              q.includes('event') ||
              q.includes('hall');

            if (!matchesEvent) return false;
          } else if (activeFilter === 'Stores') {
            const matchesStore =
              (squad.storeData?.storeName && squad.storeData.storeName.toLowerCase().includes(q)) ||
              (squad.storeData?.category && squad.storeData.category.toLowerCase().includes(q)) ||
              (squad.storeData?.description && squad.storeData.description.toLowerCase().includes(q)) ||
              (squad.storeData?.tradeLookingFor && squad.storeData.tradeLookingFor.toLowerCase().includes(q)) ||
              (squad.storeData?.actionTypes && squad.storeData.actionTypes.some((a) => a.toLowerCase().includes(q))) ||
              (squad.storeData?.zipCode && squad.storeData.zipCode.includes(q)) ||
              (squad.zipCode && squad.zipCode.includes(q)) ||
              squad.name.toLowerCase().includes(q) ||
              squad.sector.toLowerCase().includes(q) ||
              q.includes('store') ||
              q.includes('sell') ||
              q.includes('trade') ||
              q.includes('buy');

            if (!matchesStore) return false;
          } else {
            const matchesGame =
              matchesGameSearch(squad.game, q) ||
              (squad.likedGames && squad.likedGames.some((g) => matchesGameSearch(g, q)));

            // Check if this query is targeting a game in the catalog or has specific game sequel tokens
            const isCatalogGameQuery = GAMES_DATABASE.some(
              (g) => matchesGameSearch(g.name, q) || g.aliases.some((a) => matchesGameSearch(a, q))
            );

            if (isCatalogGameQuery) {
              if (!matchesGame) return false;
            } else {
              const matchesName = squad.name.toLowerCase().includes(q);
              const matchesSector = squad.sector.toLowerCase().includes(q);
              const matchesZip = squad.zipCode && squad.zipCode.includes(q);
              const matchesConsole = squad.console?.toLowerCase().includes(q);
              const matchesRole = squad.lookingFor.some((r) => r.toLowerCase().includes(q));
              const matchesMember = squad.members.some((m) => m.name.toLowerCase().includes(q));

              if (!matchesGame && !matchesName && !matchesSector && !matchesZip && !matchesRole && !matchesMember && !matchesConsole) {
                return false;
              }
            }
          }
        }
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [squadsWithDistance, activeFilter, searchQuery, user?.uid, gamerProfile?.uid, gamerProfile?.gamerTag]);

  // Determine if the current authenticated user's own live pin matches the active search query
  const isUserMatch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return matchesGameSearch(gamerProfile?.favoriteGame, q);
  }, [gamerProfile?.favoriteGame, searchQuery]);

  // Dynamic scale for characters, stores, and buildings based on radar zoom:
  // When zoomed out (e.g. 0.35x - 0.75x), items scale down so they don't look bigger or crowd the radar.
  // When zoomed in (e.g. 1.0x - 1.6x), items scale up closer so users can see everyone's characters and buildings up close!
  const radarPinScale = useMemo(() => {
    return Math.max(0.62, Math.min(1.35, 0.42 + radarZoom * 0.65));
  }, [radarZoom]);

  // Collision-free radar layout: Ensures characters, shop stores, and event buildings NEVER touch each other
  const radarLayoutPositions = useMemo(() => {
    type RadarItem = {
      id: string;
      x: number;
      y: number;
      radius: number;
      isFixed?: boolean;
    };

    const items: RadarItem[] = [];

    // 1. User's personal character pin (fixed at user position)
    const hasUserPin = user && gamerProfile && isLive && isUserMatch && activeFilter !== 'Stores' && activeFilter !== 'Events' && activeFilter !== 'ChatRooms';
    if (hasUserPin) {
      items.push({
        id: '__user__',
        x: 50 + (userPinPos.x - 50) * radarZoom,
        y: 50 + (userPinPos.y - 50) * radarZoom,
        radius: 12.5 * (radarPinScale / 0.95),
        isFixed: true,
      });
    }

    // 2. All filtered squads/stores/events on the radar
    filteredSquads.forEach((sq, i) => {
      // Natural Fibonacci spiral distribution if no manual x/y
      const goldenAngle = (i * 2.39996) + 0.45;
      const distPercent = 18 + ((i * 12) % 24);
      const defaultX = 50 + Math.cos(goldenAngle) * distPercent;
      const defaultY = 50 + Math.sin(goldenAngle) * (distPercent * 0.85);

      const rawX = typeof sq.x === 'number' && !isNaN(sq.x) ? sq.x : defaultX;
      const rawY = typeof sq.y === 'number' && !isNaN(sq.y) ? sq.y : defaultY;

      const baseX = 50 + (rawX - 50) * radarZoom;
      const baseY = 50 + (rawY - 50) * radarZoom;

      const isEvent = sq.beaconType === 'other_event' || sq.buildingType === 'grand_event';
      const isStore = sq.beaconType === 'store' || !!sq.storeData;

      // Clearance radius in radar percentage scaled dynamically with zoom
      const baseRadius = isEvent ? 14 : isStore ? 12.5 : 10.5;
      const radius = baseRadius * (radarPinScale / 0.95);

      items.push({
        id: sq.id,
        x: baseX,
        y: baseY,
        radius,
        isFixed: false,
      });
    });

    // 3. Multi-pass collision relaxation solver
    const ITERATIONS = 18;
    for (let iter = 0; iter < ITERATIONS; iter++) {
      let anyCollision = false;

      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];

          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.hypot(dx, dy);
          const minDist = a.radius + b.radius;

          if (dist < minDist) {
            anyCollision = true;
            if (dist < 0.1) {
              const hashAngle = (((i * 47 + j * 93) % 360) * Math.PI) / 180;
              dx = Math.cos(hashAngle);
              dy = Math.sin(hashAngle);
              dist = 0.1;
            }

            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            if (a.isFixed && !b.isFixed) {
              b.x += nx * overlap;
              b.y += ny * overlap;
            } else if (b.isFixed && !a.isFixed) {
              a.x -= nx * overlap;
              a.y -= ny * overlap;
            } else {
              const half = overlap * 0.5;
              a.x -= nx * half;
              a.y -= ny * half;
              b.x += nx * half;
              b.y += ny * half;
            }
          }
        }
      }

      // Constrain within visible radar boundaries [12%, 88%] so speech bubbles and badges stay comfortably on-screen
      for (const item of items) {
        if (!item.isFixed) {
          item.x = Math.max(12, Math.min(88, item.x));
          item.y = Math.max(14, Math.min(86, item.y));
        }
      }

      if (!anyCollision) break;
    }

    const posMap = new Map<string, { left: number; top: number }>();
    items.forEach((item) => {
      posMap.set(item.id, { left: item.x, top: item.y });
    });
    return posMap;
  }, [filteredSquads, user, gamerProfile, isLive, isUserMatch, activeFilter, userPinPos, radarZoom]);

  const activeGamerName = gamerProfile?.gamerTag || user?.displayName || 'YOU';

  // Aggregate all active players across squads
  const allActivePlayers = useMemo(() => {
    const list: { squad: typeof squadsWithDistance[0]; member: SquadBeacon['members'][0] }[] = [];
    filteredSquads.forEach((sq) => {
      sq.members.forEach((m) => {
        list.push({ squad: sq, member: m });
      });
    });
    return list;
  }, [filteredSquads]);

  // Check if current user profile matches active search filter
  const userMatchesSearch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const isGameMatch =
      matchesGameSearch(gamerProfile?.favoriteGame, q) ||
      (gamerProfile?.likedGames && gamerProfile.likedGames.some((g) => matchesGameSearch(g, q)));
    const tag = (gamerProfile?.gamerTag || activeGamerName).toLowerCase();
    const role = (gamerProfile?.role || '').toLowerCase();
    const rank = (gamerProfile?.rank || '').toLowerCase();
    const location = (gamerProfile?.locationName || coords?.cityName || '').toLowerCase();
    const bio = (gamerProfile?.bio || '').toLowerCase();
    return (
      isGameMatch ||
      tag.includes(q) ||
      role.includes(q) ||
      rank.includes(q) ||
      location.includes(q) ||
      bio.includes(q)
    );
  }, [searchQuery, gamerProfile, coords, activeGamerName]);

  const handleSquadPinClick = (squad: SquadBeacon) => {
    // Only users with sign in and log in accounts can join chat rooms
    if (squad.beaconType === 'chat_room' && !user) {
      playSketchClick();
      setFriendToast('🔒 Only signed-in gamers can join chat rooms. Please log in or sign up!');
      setTimeout(() => setFriendToast(null), 4500);
      onOpenAuthModal?.('signin');
      return;
    }
    playSketchClick();
    setIsUserPinSelected(false);
    onSelectSquad(squad);
  };

  const handleUserPinClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSketchClick();
    setIsUserPinSelected(true);
    onSelectSquad(null);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSquad || !applicantTag.trim()) return;

    playSquadJoinSound();
    onJoinSquadSuccess(selectedSquad.id, applicantTag.trim(), applicantRole.trim() || 'Flex Player');
    setJoinedSuccessMessage(`Request sent to ${selectedSquad.name}! Connected to squad lobby.`);
    setJoinModalOpen(false);
    setApplicantTag('');
    setApplicantRole('');

    setTimeout(() => {
      setJoinedSuccessMessage(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[#020703] bg-sketch-grid text-slate-100 flex flex-col">
      {/* Top Map & Players Control Bar */}
      <div className="border-b border-green-500/20 bg-[#040e06]/95 backdrop-blur-md px-4 sm:px-6 py-3 sticky top-16 z-30">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Title */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-bold font-display text-white tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-green-400" />
              <span>Squad Radar Map</span>
            </h1>
          </div>

          {/* Search Box with Interactive All-Games Dropdown */}
          <div ref={searchContainerRef} className="relative flex-1 w-full max-w-full sm:max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-lime-400" />
              <input
                type="text"
                dir="ltr"
                placeholder={
                  activeFilter === 'Events'
                    ? 'Search live events by title, sector, or city...'
                    : activeFilter === 'Stores'
                    ? 'Search stores, games for sale, or trades...'
                    : 'Search games, callsigns, city, or events...'
                }
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || e.key === 'Enter') {
                    setIsSearchFocused(false);
                  }
                }}
                className="w-full pl-9 pr-8 py-2 bg-[#030a05] border border-green-500/50 hover:border-lime-400 focus:border-lime-400 rounded text-xs text-green-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400/50 shadow-[0_0_15px_rgba(34,197,94,0.25)] transition-all font-sketch text-left"
                style={{
                  borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                  direction: 'ltr',
                  textAlign: 'left',
                  unicodeBidi: 'plaintext',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown with Games Database Autocomplete */}
            {isSearchFocused && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#030904]/98 border-2 border-lime-400/90 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_25px_rgba(163,230,53,0.35)] backdrop-blur-xl p-2.5 max-h-72 overflow-y-auto select-none"
                style={{
                  borderRadius: '15px 25px 15px 25px',
                }}
              >
                {activeFilter === 'Events' ? (
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1.5 px-2 flex items-center justify-between">
                      <span>🏛️ LIVE EVENTS ({squadsWithDistance.filter((s) => s.beaconType === 'other_event' || s.buildingType === 'grand_event').length})</span>
                      <span className="text-slate-400 text-[10px]">Click to filter & recenter map</span>
                    </div>
                    {squadsWithDistance.filter((s) => s.beaconType === 'other_event' || s.buildingType === 'grand_event').length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-sketch">
                        No live events deployed yet. Select your location to create one!
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {squadsWithDistance
                          .filter((s) => s.beaconType === 'other_event' || s.buildingType === 'grand_event')
                          .filter((ev) => !searchQuery.trim() || ev.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((ev) => (
                            <div
                              key={ev.id}
                              onClick={() => {
                                playSketchClick();
                                setSearchQuery(ev.name);
                                setIsSearchFocused(false);
                                onSelectSquad(null);
                              }}
                              className="p-2 rounded cursor-pointer transition-colors flex items-center justify-between gap-2 hover:bg-amber-950/70 border border-amber-500/30 bg-amber-950/20"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">🏛️</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-sketch text-white font-bold truncate">{ev.name}</div>
                                  <div className="text-[10px] font-mono text-amber-300">
                                    {ev.locationAddress || ev.sector}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono bg-black/60 px-1.5 py-0.5 rounded text-amber-400 border border-amber-400/40 flex-shrink-0">
                                View
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : !searchQuery.trim() ? (
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-lime-400 mb-1.5 px-2 flex items-center justify-between">
                      <span>🔥 POPULAR GAMES · CLICK TO PLOT ON MAP</span>
                      <span className="text-slate-400">150+ Games Ready</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1 mb-1">
                      {[
                        'Resident Evil 6',
                        'Call of Duty: Black Ops 6',
                        'Call of Duty: Warzone',
                        'Fortnite',
                        'Apex Legends',
                        'Valorant',
                        'Counter-Strike 2',
                        'GTA Online',
                        'Helldivers 2',
                        'EA Sports FC 25 (FIFA)',
                        'Rocket League',
                        'League of Legends',
                        'Minecraft',
                      ].map((popularName) => (
                        <button
                          key={popularName}
                          type="button"
                          onClick={() => {
                            playSketchClick();
                            setSearchQuery(popularName);
                            setIsSearchFocused(false);
                          }}
                          className={`px-2.5 py-1 text-[11px] font-sketch rounded cursor-pointer transition-all border ${
                            popularName.includes('Resident Evil')
                              ? 'bg-rose-950/80 border-rose-400/80 text-rose-200 hover:bg-rose-900 font-bold shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : popularName.includes('Call of Duty')
                              ? 'bg-amber-950/80 border-amber-400/80 text-amber-200 hover:bg-amber-900 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                              : 'bg-green-950/60 border-green-500/40 text-green-200 hover:bg-green-900/80 hover:text-white'
                          }`}
                        >
                          🎮 {popularName}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-lime-400 mb-1.5 px-2 flex items-center justify-between">
                      <span>🎮 MATCHING GAMES ({suggestedGames.length})</span>
                      <span className="text-slate-400 text-[10px]">Select to filter map</span>
                    </div>
                    {suggestedGames.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-sketch">
                        No catalog game matched "{searchQuery}".
                        <button
                          type="button"
                          onClick={() => setIsSearchFocused(false)}
                          className="block mx-auto mt-1 text-lime-400 hover:underline"
                        >
                          Press Enter to search callsigns & squads
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {suggestedGames.map((game) => (
                          <div
                            key={game.id}
                            onClick={() => {
                              playSketchClick();
                              setSearchQuery(game.name);
                              setIsSearchFocused(false);
                            }}
                            className={`p-2 rounded cursor-pointer transition-colors flex items-center justify-between gap-2 hover:bg-lime-950/70 border ${
                              game.name.toLowerCase().includes('call of duty')
                                ? 'border-amber-500/40 bg-amber-950/20'
                                : 'border-transparent hover:border-lime-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Gamepad2 className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
                              <span className="text-xs font-sketch text-white font-semibold truncate">
                                {game.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[10px] font-mono-num px-1.5 py-0.5 bg-black/60 rounded text-slate-300 border border-white/10">
                                {game.genre}
                              </span>
                              <span className="text-[10px] text-lime-400 font-sketch hover:underline">
                                Plot →
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto">
            {/* Sell or Trade Button (1 Store Per User) */}
            {onOpenSellTradeModal && (
              <button
                onClick={() => {
                  playSketchClick();
                  onOpenSellTradeModal();
                }}
                title={
                  currentUserStore
                    ? `Manage your active store "${currentUserStore.name}" (1 store per user limit)`
                    : "Create a 3D store to sell or trade gaming gear (1 store per user limit)"
                }
                className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold font-display text-pink-200 bg-pink-950/90 hover:bg-pink-900 border border-pink-400 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(236,72,153,0.45)] hover:scale-105 active:scale-95 w-full sm:w-auto"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <Store className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                <span className="truncate">
                  {currentUserStore ? 'My Store (Edit)' : 'Sell or Trade'}
                </span>
                {currentUserStore && (
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse hidden sm:inline" />
                )}
              </button>
            )}

            {/* Buy or Trade Button (Shows live stores / users selling & trading on map) */}
            <button
              onClick={() => {
                playSketchClick();
                setSearchQuery('');
                onSelectSquad(null);
                setIsUserPinSelected(false);
                setActiveTab('map');
                const nextFilter = activeFilter === 'Stores' ? 'all' : 'Stores';
                setActiveFilter(nextFilter);
              }}
              title="Show live stores and users selling or trading on the map"
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold font-display rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(16,185,129,0.45)] hover:scale-105 active:scale-95 border w-full sm:w-auto ${
                activeFilter === 'Stores'
                  ? 'bg-emerald-400 text-black border-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.7)] font-black scale-105'
                  : 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border-emerald-400'
              }`}
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Buy or Trade</span>
            </button>

            {/* Events Nearby Toggle Button */}
            <button
              onClick={() => {
                playSketchClick();
                onSelectSquad(null);
                setIsUserPinSelected(false);
                setActiveTab('map');
                const nextFilter = activeFilter === 'Events' ? 'all' : 'Events';
                setActiveFilter(nextFilter);
              }}
              title="Show live events and Grand Event Halls on the map"
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold font-display rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(245,158,11,0.45)] hover:scale-105 active:scale-95 border w-full sm:w-auto ${
                activeFilter === 'Events'
                  ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.7)] font-black scale-105'
                  : 'bg-amber-950/90 hover:bg-amber-900 text-amber-200 border-amber-400'
              }`}
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">Events Nearby</span>
            </button>

            {/* Create Event Button (Purple, prominent, fits on mobile phone screens) */}
            <button
              onClick={() => {
                playSketchClick();
                setIsCreateEventModalOpen(true);
              }}
              title="Create a public event with 3D Grand Event Hall building (No account required)"
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold font-display text-purple-200 bg-purple-950/90 hover:bg-purple-900 border border-purple-400 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 w-full sm:w-auto"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <CalendarPlus className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span className="truncate">Create Event</span>
            </button>

            {/* Chat Rooms Toggle Button (Cyan/Electric Blue) */}
            <button
              onClick={() => {
                playSketchClick();
                setSearchQuery('');
                onSelectSquad(null);
                setIsUserPinSelected(false);
                setActiveTab('map');
                const nextFilter = activeFilter === 'ChatRooms' ? 'all' : 'ChatRooms';
                setActiveFilter(nextFilter);
              }}
              title="Show live chat rooms and comms hubs on the map"
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold font-display rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(6,182,212,0.45)] hover:scale-105 active:scale-95 border w-full sm:w-auto ${
                activeFilter === 'ChatRooms'
                  ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.7)] font-black scale-105'
                  : 'bg-cyan-950/90 hover:bg-cyan-900 text-cyan-200 border-cyan-400'
              }`}
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">Chat Rooms</span>
            </button>

            {/* Host Chat Room Button (Only sign-in users can create this chat rooms) */}
            <button
              onClick={() => {
                playSketchClick();
                if (!user) {
                  if (onOpenAuthModal) {
                    onOpenAuthModal('signin');
                  }
                  return;
                }
                setIsCreateChatRoomModalOpen(true);
              }}
              title={user ? "Host a live chat room on the map" : "Sign in required to create a chat room"}
              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold font-display text-cyan-200 bg-gradient-to-r from-cyan-950/95 to-blue-950/95 hover:from-cyan-900 hover:to-blue-900 border border-cyan-400 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 w-full sm:w-auto"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">+ Host Room</span>
            </button>
          </div>
        </div>

        {/* Category & Map Filter Bar (Shows when filter active) */}
        {(activeFilter === 'ChatRooms' || activeFilter === 'Events') && (
          <div className="max-w-[1700px] mx-auto mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-green-500/20 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-xs">
            {activeFilter === 'ChatRooms' ? (
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                  <span>LIVE CHAT ROOMS ON MAP ({liveChatRoomsCount})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    if (!user) {
                      if (onOpenAuthModal) onOpenAuthModal('signin');
                      return;
                    }
                    setIsCreateChatRoomModalOpen(true);
                  }}
                  className="px-2.5 py-0.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-display rounded text-[10px] cursor-pointer transition-all shadow-[0_0_10px_rgba(6,182,212,0.6)] flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Host Chat Room</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    onSelectSquad(null);
                    setIsUserPinSelected(false);
                    setActiveTab('map');
                    setActiveFilter('all');
                  }}
                  className="px-2 py-0.5 bg-lime-400 hover:bg-lime-300 text-black font-bold font-display rounded text-[10px] cursor-pointer transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(163,230,53,0.5)] active:scale-95"
                  title="Switch back to showing players and squads on map"
                >
                  <Users className="w-2.5 h-2.5 text-black flex-shrink-0" />
                  <span>Back to Players Map</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    onSelectSquad(null);
                    setIsUserPinSelected(false);
                    setActiveTab('map');
                    setActiveFilter('all');
                  }}
                  className="px-2 py-0.5 bg-lime-400 hover:bg-lime-300 text-black font-bold font-display rounded text-[10px] cursor-pointer transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(163,230,53,0.5)] active:scale-95"
                  title="Switch back to showing players and squads on map"
                >
                  <Users className="w-2.5 h-2.5 text-black flex-shrink-0" />
                  <span>Back to Players Map</span>
                </button>
                {filteredSquads.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      setIsCreateEventModalOpen(true);
                    }}
                    className="px-2.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-black font-bold font-display rounded text-[10px] cursor-pointer transition-all shadow-[0_0_10px_rgba(234,179,8,0.6)]"
                  >
                    + Create Event Now
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Game Search Indicator Banner */}
      {searchQuery.trim() && (
        <div className="max-w-[1700px] mx-auto px-4 mt-2 w-full">
          <div
            className="p-2.5 bg-[#030c06]/95 border-2 border-lime-400/90 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-lime-200 text-xs font-sketch shadow-[0_0_20px_rgba(163,230,53,0.35)]"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse flex-shrink-0" />
              <span>
                Game Search: <strong className="text-white text-sm">"{searchQuery}"</strong>
                <span className="ml-2 text-slate-300">
                  · {filteredSquads.length} player{filteredSquads.length === 1 ? '' : 's'} on map
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {filteredSquads.length === 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-300">
                    No active beacons playing "{searchQuery}" right now.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      onOpenCreateSquad();
                    }}
                    className="px-2.5 py-1 text-[11px] bg-lime-400 text-black font-bold border border-lime-300 rounded cursor-pointer hover:bg-lime-300 transition-colors shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                  >
                    + Plant Beacon for "{searchQuery}"
                  </button>
                </div>
              )}
              {gamerProfile && gamerProfile.favoriteGame !== searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    onOpenEditProfile?.();
                  }}
                  className="px-2.5 py-1 text-[11px] bg-green-900/80 hover:bg-green-800 text-green-200 border border-green-400/60 rounded cursor-pointer transition-colors"
                >
                  Set as My Game
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  playSketchClick();
                  setSearchQuery('');
                }}
                className="px-2.5 py-1 text-[11px] bg-lime-950 hover:bg-lime-900 text-lime-300 border border-lime-400 rounded cursor-pointer transition-colors"
              >
                Clear Search (Show All)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Map View Area - FULL WIDTH AND EXTRA TALL */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-2 sm:p-4 relative">
        {/* Map View */}

        {activeTab === 'map' ? (
          <div className="relative w-full h-[82vh] min-h-[680px]">
            {/* Pin Drop Crosshair Mode Floating Banner */}
            {isRelocatingPin && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-lime-950/95 border-2 border-lime-400 text-lime-200 px-4 py-2 rounded-xl shadow-[0_0_30px_rgba(163,230,53,0.7)] flex items-center gap-3 backdrop-blur-md animate-bounce">
                <MapPin className="w-5 h-5 text-lime-400 animate-pulse flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold font-display tracking-wide">
                  TAP ANYWHERE ON MAP TO DROP YOUR PIN
                </span>
                <button
                  type="button"
                  onClick={() => setIsRelocatingPin(false)}
                  className="text-xs bg-black/70 hover:bg-black px-2.5 py-1 rounded border border-white/20 text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {mapEngine === 'google' ? (
              <GoogleGamerMap
                squads={filteredSquads}
                selectedSquad={selectedSquad}
                onSelectSquad={(s) => {
                  if (s) handleSquadPinClick(s);
                  else onSelectSquad(null);
                }}
                onSelectUserPin={() => {
                  setIsUserPinSelected(true);
                  onSelectSquad(null);
                }}
                userGamerTag={activeGamerName}
                characterAvatar={characterAvatar}
                isUserPinVisible={isUserMatch && activeFilter !== 'Stores' && activeFilter !== 'Events' && activeFilter !== 'ChatRooms'}
                onMapClick={handleGoogleMapClick}
              />
            ) : (
              <div
                onClick={handleCanvasClick}
                className={`relative w-full h-[82vh] min-h-[680px] rounded bg-[#020503] border border-green-500/40 overflow-hidden select-none ${
                  isRelocatingPin ? 'cursor-crosshair ring-2 ring-lime-400' : ''
                }`}
                style={{
                  borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.3), inset 0 0 40px rgba(34, 197, 94, 0.08)',
                }}
              >
                {/* Radar Grid and Sketched Topo Lines in Green */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 750" fill="none">
                  <defs>
                    <linearGradient id="radarSweepGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
                      <stop offset="50%" stopColor="#22c55e" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Hand-sketched Radar Rings */}
                  <circle cx="500" cy="375" r="340" stroke="#22c55e" strokeWidth="1.4" strokeDasharray="18 8 10 8" opacity="0.45" />
                  <circle cx="500" cy="375" r="250" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="14 6" opacity="0.4" />
                  <circle cx="500" cy="375" r="160" stroke="#22c55e" strokeWidth="1" strokeDasharray="10 5" opacity="0.5" />
                  <circle cx="500" cy="375" r="70" stroke="#22c55e" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />

                  {/* Crosshair Cardinal Lines */}
                  <line x1="500" y1="20" x2="500" y2="730" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 6" opacity="0.35" />
                  <line x1="20" y1="375" x2="980" y2="375" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 6" opacity="0.35" />

                  {/* Sketched Topographic Land Formations */}
                  <path d="M 60 120 C 180 80, 320 160, 480 100 C 640 40, 800 130, 940 90" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="15 5" opacity="0.25" />
                  <path d="M 80 580 C 240 640, 420 540, 620 620 C 760 670, 890 560, 950 630" stroke="#10b981" strokeWidth="1.2" strokeDasharray="20 6" opacity="0.2" />
                  <path d="M 120 340 C 220 260, 350 420, 520 340 C 680 270, 800 420, 920 310" stroke="#a3e635" strokeWidth="1" strokeDasharray="10 6" opacity="0.18" />

                  {/* Sector Labels */}
                  <text x="510" y="50" fill="#22c55e" opacity="0.65" fontSize="11" fontFamily="'JetBrains Mono', monospace">
                    N 00° // {coords?.cityName ? coords.cityName.toUpperCase() : 'NORTH ARCADE'}
                  </text>
                  <text x="510" y="725" fill="#22c55e" opacity="0.65" fontSize="11" fontFamily="'JetBrains Mono', monospace">S 180° // SOUTH HARBOR</text>
                  <text x="30" y="365" fill="#22c55e" opacity="0.65" fontSize="11" fontFamily="'JetBrains Mono', monospace">W 270° // WEST HILLS</text>
                  <text x="860" y="365" fill="#22c55e" opacity="0.65" fontSize="11" fontFamily="'JetBrains Mono', monospace">E 90° // EAST DISTRICT</text>

                  {/* Dynamic Radar Sweep Arm */}
                  <g className="animate-radar" style={{ transformOrigin: '500px 375px' }}>
                    <line x1="500" y1="375" x2="840" y2="375" stroke="#22c55e" strokeWidth="2" opacity="0.8" />
                    <path d="M 500 375 L 840 375 A 340 340 0 0 0 790 200 Z" fill="url(#radarSweepGradientGreen)" />
                  </g>
                </svg>

                {/* Ping Wave ripple animation when user clicks Ping */}
                {isRadarScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full border-2 border-green-400 animate-ping" />
                    <div className="w-48 h-48 rounded-full border border-lime-400 animate-ping opacity-60" style={{ animationDelay: '0.4s' }} />
                    <div className="w-96 h-96 rounded-full border border-emerald-300 animate-ping opacity-30" style={{ animationDelay: '0.8s' }} />
                  </div>
                )}

                {/* USER'S PERSONAL 3D BLOCKY CHARACTER PIN ON THE RADAR (Only if user has active profile, is broadcasting live, matches active search filter, and NOT in Stores, Events, or ChatRooms view) */}
                {user && gamerProfile && isLive && isUserMatch && activeFilter !== 'Stores' && activeFilter !== 'Events' && activeFilter !== 'ChatRooms' && (
                  <div
                    style={{
                      left: `${50 + (userPinPos.x - 50) * radarZoom}%`,
                      top: `${50 + (userPinPos.y - 50) * radarZoom}%`,
                      transform: `translate(-50%, -50%) scale(${radarPinScale.toFixed(3)})`,
                      transformOrigin: 'bottom center',
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="absolute cursor-pointer group z-30"
                  >
                    <BlockyCharacter3D
                      variant={characterAvatar}
                      speechText=""
                      width={92}
                      height={120}
                      gamerTag={`YOU (${activeGamerName})`}
                      isLive={isLive}
                      onClick={handleUserPinClick}
                    />
                  </div>
                )}

                {/* Squad Beacon Character Pins Plotted on Radar Canvas */}
                {filteredSquads.map((squad, i) => {
                  const isSelected = selectedSquad?.id === squad.id;
                  const layoutPos = radarLayoutPositions.get(squad.id);
                  const safeX = typeof squad.x === 'number' && !isNaN(squad.x) ? squad.x : 35 + ((i * 17) % 35);
                  const safeY = typeof squad.y === 'number' && !isNaN(squad.y) ? squad.y : 30 + ((i * 23) % 40);
                  const squadLeft = layoutPos ? layoutPos.left : 50 + (safeX - 50) * radarZoom;
                  const squadTop = layoutPos ? layoutPos.top : 50 + (safeY - 50) * radarZoom;

                  return (
                    <div
                      key={squad.id}
                      onClick={() => handleSquadPinClick(squad)}
                      style={{
                        left: `${squadLeft}%`,
                        top: `${squadTop}%`,
                        transform: `translate(-50%, -50%) scale(${isSelected ? (radarPinScale * 1.12).toFixed(3) : radarPinScale.toFixed(3)})`,
                        transformOrigin: 'bottom center',
                        transition: 'transform 0.15s ease-out',
                      }}
                      className={`absolute cursor-pointer group z-20 ${
                        isSelected ? 'z-30' : 'hover:scale-105'
                      }`}
                    >
                      {squad.beaconType === 'other_event' || squad.buildingType === 'grand_event' ? (
                        <div className="flex flex-col items-center">
                          {/* Event Speech Bubble on Map */}
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                            <div className="bg-[#0f172a]/95 border-2 border-amber-400 p-2 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] w-48 sm:w-56 text-left backdrop-blur-md">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-black font-display text-amber-300 truncate">
                                  🏛️ {squad.name}
                                </span>
                                {squad.expiresAt && (
                                  <span className="text-[9px] font-mono font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded flex-shrink-0">
                                    {Math.max(1, Math.ceil((new Date(squad.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}D LEFT
                                  </span>
                                )}
                              </div>
                              {squad.description && (
                                <p className="text-[10px] font-sketch text-slate-200 line-clamp-2 mt-0.5 leading-snug">
                                  "{squad.description}"
                                </p>
                              )}
                              <div className="mt-1 text-[9px] font-mono text-amber-200 flex items-center justify-between">
                                <span className="truncate">📍 {squad.locationAddress || squad.locationName || squad.sector}</span>
                                <span className="text-[8px] text-amber-400 font-bold ml-1 flex-shrink-0">CLICK TO VIEW</span>
                              </div>
                            </div>
                            <div className="w-2.5 h-2.5 bg-[#0f172a] border-r-2 border-b-2 border-amber-400 rotate-45 mx-auto -mt-1.5" />
                          </div>

                          {/* 3D Grand Event Hall Building */}
                          <EventBuilding3D
                            eventTitle={squad.name}
                            width={isSelected ? 106 : 88}
                            height={isSelected ? 96 : 80}
                          />

                          {/* Glowing Foundation Ring under event hall */}
                          <div
                            className="w-16 h-3.5 rounded-full -mt-2 pointer-events-none opacity-85 animate-pulse"
                            style={{
                              background: 'radial-gradient(circle, rgba(234,179,8,0.85) 0%, rgba(234,179,8,0) 70%)',
                              filter: 'blur(2px)',
                            }}
                          />
                        </div>
                      ) : squad.beaconType === 'store' ? (
                        <div className="flex flex-col items-center">
                          {/* Store Name & Short Description Speech Bubble on Map */}
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                            <div className="bg-[#020a04]/95 border-2 border-pink-400 p-2 rounded-xl shadow-2xl w-44 sm:w-52 text-left backdrop-blur-md">
                              <div className="text-[11px] font-bold font-display text-pink-300 truncate">
                                {squad.name}
                              </div>
                              {(squad.storeData?.description || squad.description) && (
                                <p className="text-[10px] font-sketch text-slate-200 line-clamp-2 mt-0.5 leading-snug">
                                  "{squad.storeData?.description || squad.description}"
                                </p>
                              )}
                              <div className="mt-1 text-[9px] font-mono text-emerald-400 flex items-center justify-between">
                                <span>📍 {squad.locationName || squad.sector}</span>
                                <span className="text-[8px] text-pink-400 font-bold">CLICK TO VIEW</span>
                              </div>
                            </div>
                            <div className="w-2.5 h-2.5 bg-[#020a04] border-r-2 border-b-2 border-pink-400 rotate-45 mx-auto -mt-1.5" />
                          </div>

                          {/* 3D Store Building */}
                          <StoreBuilding3D
                            buildingType={squad.buildingType || 'boutique'}
                            storeTitle={squad.name}
                            width={isSelected ? 106 : 88}
                            height={isSelected ? 96 : 80}
                          />

                          {/* Glowing Foundation Ring under store */}
                          <div
                            className="w-16 h-3.5 rounded-full -mt-2 pointer-events-none opacity-80 animate-pulse"
                            style={{
                              background:
                                squad.buildingType === 'boutique'
                                  ? 'radial-gradient(circle, rgba(236,72,153,0.8) 0%, rgba(236,72,153,0) 70%)'
                                  : squad.buildingType === 'girly_spooky'
                                  ? 'radial-gradient(circle, rgba(244,63,94,0.85) 0%, rgba(244,63,94,0) 70%)'
                                  : squad.buildingType === 'girly_kiosk'
                                  ? 'radial-gradient(circle, rgba(219,39,119,0.85) 0%, rgba(219,39,119,0) 70%)'
                                  : squad.buildingType === 'boy_kiosk'
                                  ? 'radial-gradient(circle, rgba(56,189,248,0.85) 0%, rgba(56,189,248,0) 70%)'
                                  : squad.buildingType === 'spooky_shop'
                                  ? 'radial-gradient(circle, rgba(249,115,22,0.8) 0%, rgba(249,115,22,0) 70%)'
                                  : squad.buildingType === 'medium_store'
                                  ? 'radial-gradient(circle, rgba(245,158,11,0.85) 0%, rgba(245,158,11,0) 70%)'
                                  : squad.buildingType === 'sketch_store'
                                  ? 'radial-gradient(circle, rgba(251,146,60,0.85) 0%, rgba(251,146,60,0) 70%)'
                                  : squad.buildingType === 'cyber_tower'
                                  ? 'radial-gradient(circle, rgba(6,182,212,0.85) 0%, rgba(6,182,212,0) 70%)'
                                  : 'radial-gradient(circle, rgba(16,185,129,0.8) 0%, rgba(16,185,129,0) 70%)',
                              filter: 'blur(2px)',
                            }}
                          />
                        </div>
                      ) : squad.beaconType === 'chat_room' ? (
                        <div className="flex flex-col items-center">
                          {/* Chat Room Speech Bubble */}
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                            <div className="bg-[#030d12]/95 border-2 border-cyan-400 p-2 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.6)] w-48 sm:w-56 text-left backdrop-blur-md">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-black font-display text-cyan-300 truncate">
                                  {squad.chatRoomData?.icon || '💬'} {squad.name}
                                </span>
                                <span className="text-[9px] font-mono font-bold bg-cyan-400 text-black px-1.5 py-0.2 rounded flex-shrink-0">
                                  LIVE CHAT
                                </span>
                              </div>
                              {squad.description && (
                                <p className="text-[10px] font-sketch text-slate-200 line-clamp-2 mt-0.5 leading-snug">
                                  "{squad.description}"
                                </p>
                              )}
                              <div className="mt-1 text-[9px] font-mono text-cyan-200 flex items-center justify-between">
                                <span className="truncate">📍 {squad.sector || squad.locationName}</span>
                                <span className="text-[8px] text-cyan-400 font-bold ml-1 flex-shrink-0">CLICK TO CHAT</span>
                              </div>
                            </div>
                            <div className="w-2.5 h-2.5 bg-[#030d12] border-r-2 border-b-2 border-cyan-400 rotate-45 mx-auto -mt-1.5" />
                          </div>

                          {/* 3D Game Room Cafe Arcade Building */}
                          <GameRoomBuilding3D
                            roomTitle={squad.name}
                            width={isSelected ? 112 : 94}
                            height={isSelected ? 100 : 84}
                          />

                          {/* Glowing Foundation Ring under chat room building */}
                          <div
                            className="w-16 h-3.5 rounded-full -mt-2 pointer-events-none opacity-85 animate-pulse"
                            style={{
                              background: 'radial-gradient(circle, rgba(0,240,255,0.9) 0%, rgba(0,240,255,0) 70%)',
                              filter: 'blur(2px)',
                            }}
                          />
                        </div>
                      ) : (
                        <BlockyCharacter3D
                          variant={
                            squad.characterAvatar ||
                            (i % 8 === 0
                              ? 'pumpkin'
                              : i % 8 === 1
                              ? 'girly_pumpkin'
                              : i % 8 === 2
                              ? 'freddy'
                              : i % 8 === 3
                              ? 'jason'
                              : i % 8 === 4
                              ? 'ghostface'
                              : i % 8 === 5
                              ? 'michael_myers'
                              : i % 8 === 6
                              ? 'classic'
                              : 'waving')
                          }
                          speechText=""
                          width={isSelected ? 74 : 58}
                          height={isSelected ? 96 : 76}
                          gamerTag={squad.name}
                          isLive={true}
                        />
                      )}
                    </div>
                  );
                })}

                {/* SQUADRON 3D VOXEL AIRSHIP HOVERING OVER TIJUANA ON RADAR */}
                <div
                  style={{
                    left: '50%',
                    top: '76%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    playSketchClick();
                    setShowAirshipModal(true);
                  }}
                  className="absolute cursor-pointer z-40 group select-none flex flex-col items-center"
                  title={
                    activeBillboard?.businessName
                      ? `★ Sponsor Billboard: ${activeBillboard.businessName} (Click to view billboard & visit link)`
                      : "Squadron Airship: Hovering stationary in the sky. Click to view full ship and billboard!"
                  }
                >
                  <Airship3D
                    width={170}
                    height={125}
                    imageUrl={activeBillboard?.imageUrl}
                    businessName={activeBillboard?.businessName}
                    businessLink={activeBillboard?.businessLink}
                    modelScale={0.72}
                    autoRotate={true}
                    onClick={() => {
                      playSketchClick();
                      setShowAirshipModal(true);
                    }}
                  />
                  {activeBillboard?.businessName && (
                    <div className="mt-1 px-2 py-0.5 rounded-full bg-black/90 border border-amber-400 text-[9px] font-display font-black text-amber-300 shadow-[0_0_10px_rgba(250,204,21,0.7)] flex items-center gap-1 animate-pulse">
                      <span>★</span>
                      <span className="truncate max-w-[120px]">{activeBillboard.businessName}</span>
                    </div>
                  )}
                </div>

                {/* Radar Legend, Zoom & Compass Header */}
                <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="text-xs font-mono-num text-green-400 bg-black/80 backdrop-blur-sm px-2.5 py-1 border border-green-500/30 rounded pointer-events-auto flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span>RADAR ONLINE · {isLive ? 'LIVE BROADCAST ON' : 'SIGNAL STANDBY'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pointer-events-auto bg-black/80 backdrop-blur-sm p-1 border border-green-500/30 rounded">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSketchClick();
                        setRadarZoom((z) => Math.max(0.35, +(z - 0.15).toFixed(2)));
                      }}
                      className="w-7 h-7 flex items-center justify-center text-green-300 hover:text-white hover:bg-green-950/80 rounded font-mono font-bold text-base cursor-pointer transition-colors"
                      title="Zoom Out Radar"
                    >
                      -
                    </button>
                    <span className="text-[10px] font-mono-num text-green-400 px-1 select-none">
                      {Math.round(radarZoom * 100)}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSketchClick();
                        setRadarZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)));
                      }}
                      className="w-7 h-7 flex items-center justify-center text-green-300 hover:text-white hover:bg-green-950/80 rounded font-mono font-bold text-base cursor-pointer transition-colors"
                      title="Zoom In Radar"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FULL-SCREEN TACTICAL DOSSIER OVERLAY FOR USER PIN OR SELECTED SQUAD (Fixed Full Screen) */}
            {isUserPinSelected || (selectedSquad && selectedSquad.beaconType !== 'chat_room') ? (
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    playSketchClick();
                    setIsUserPinSelected(false);
                    onSelectSquad(null);
                  }
                }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl p-3 sm:p-6 md:p-10 flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 overflow-y-auto select-text cursor-pointer"
              >
                {isUserPinSelected ? (
                  /* User's Personal Full-Screen Dossier */
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-6xl my-auto rounded-3xl bg-[#030a05]/98 border-2 border-lime-400 backdrop-blur-2xl shadow-[0_0_60px_rgba(163,230,53,0.45)] p-6 sm:p-8 md:p-10 text-white relative flex flex-col max-h-[94vh] overflow-y-auto cursor-default"
                    style={{
                      borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                      boxShadow: '0 0 50px rgba(163, 230, 53, 0.45), inset 0 0 25px rgba(163, 230, 53, 0.08)',
                    }}
                  >
                    {/* Simple outline smaller X close button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSketchClick();
                        setIsUserPinSelected(false);
                      }}
                      className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-50 p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
                      title="Close Window [Esc]"
                      aria-label="Close Window"
                    >
                      <X className="w-4 h-4 stroke-[1.75]" />
                    </button>

                    <div>
                      {/* Header with Avatar Photo, Callsign, Badges & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-lime-500/30 gap-5 mb-4 pr-10 sm:pr-12">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 min-w-0 text-center sm:text-left">
                          {/* Profile Avatar / Photo with Cool Cyber-Tactical HUD Frame */}
                          {gamerProfile?.photoUrl ? (
                            <div
                              onClick={() => {
                                playSketchClick();
                                setSelectedLightboxPhoto({
                                  url: gamerProfile.photoUrl!,
                                  caption: `${gamerProfile.gamerTag || activeGamerName}'s Profile Photo`,
                                });
                              }}
                              className="relative cursor-pointer group flex-shrink-0 p-3 select-none"
                              title="Click to zoom photo"
                            >
                              {/* Outer Cyber Radar Rotating Ring */}
                              <div className="absolute inset-0 rounded-full border border-dashed border-lime-400/50 animate-spin [animation-duration:24s] pointer-events-none group-hover:border-lime-300 transition-colors" />

                              {/* Secondary Counter-Rotating Cyber Ring */}
                              <div className="absolute inset-1.5 rounded-full border border-dotted border-emerald-400/40 animate-spin [animation-duration:14s] [animation-direction:reverse] pointer-events-none" />

                              {/* Tactical HUD Corner Brackets */}
                              <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 border-t-2 border-l-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 border-t-2 border-r-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute bottom-0.5 left-0.5 w-3.5 h-3.5 border-b-2 border-l-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-b-2 border-r-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />

                              {/* Cardinal Crosshair Tick Marks */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />

                              {/* Glowing Energy Aura Ring */}
                              <div className="relative rounded-full p-1 bg-gradient-to-tr from-lime-500 via-emerald-400 to-green-300 shadow-[0_0_35px_rgba(163,230,53,0.7)] group-hover:shadow-[0_0_50px_rgba(163,230,53,0.95)] transition-all duration-300">
                                <img
                                  src={gamerProfile.photoUrl}
                                  alt="Profile"
                                  className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full object-cover border-2 border-black/90 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                                />

                                {/* Interactive Camera & Zoom HUD Overlay */}
                                <div className="absolute inset-1 rounded-full bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200">
                                  <Camera className="w-8 h-8 text-lime-300 drop-shadow-[0_0_10px_rgba(163,230,53,0.9)] mb-1" />
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-lime-200 font-bold bg-black/80 px-2 py-0.5 rounded border border-lime-400/60 shadow-[0_0_8px_rgba(163,230,53,0.5)]">
                                    INSPECT
                                  </span>
                                </div>
                              </div>

                              {/* Tactical Operator Badge */}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#020a04] border border-lime-400 text-lime-300 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_12px_rgba(163,230,53,0.6)] z-10 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
                                <span>OPERATOR</span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative p-3 flex-shrink-0 select-none">
                              {/* Outer Cyber Radar Rotating Ring */}
                              <div className="absolute inset-0 rounded-full border border-dashed border-lime-400/50 animate-spin [animation-duration:24s] pointer-events-none" />
                              <div className="absolute inset-1.5 rounded-full border border-dotted border-emerald-400/40 animate-spin [animation-duration:14s] [animation-direction:reverse] pointer-events-none" />

                              {/* Corner Brackets */}
                              <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 border-t-2 border-l-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 border-t-2 border-r-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute bottom-0.5 left-0.5 w-3.5 h-3.5 border-b-2 border-l-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-b-2 border-r-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />

                              {/* Cardinal Ticks */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />

                              <div className="relative rounded-full p-1 bg-gradient-to-tr from-lime-500 via-emerald-400 to-green-300 shadow-[0_0_35px_rgba(163,230,53,0.7)]">
                                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-2 border-black/90 bg-lime-950/90 flex items-center justify-center font-display font-bold text-3xl sm:text-5xl text-lime-300 shadow-2xl">
                                  {(gamerProfile?.gamerTag || activeGamerName).slice(0, 2).toUpperCase()}
                                </div>
                              </div>

                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#020a04] border border-lime-400 text-lime-300 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_12px_rgba(163,230,53,0.6)] z-10 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                                <span>OPERATOR</span>
                              </div>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h2 className="text-2xl sm:text-4xl font-bold font-display text-white mt-1.5 truncate tracking-wide">
                              {gamerProfile?.gamerTag || activeGamerName}
                            </h2>

                            {/* Badges (Main Game, Favorite Console) */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
                              {gamerProfile?.favoriteGame && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    playSketchClick();
                                    setSearchQuery(gamerProfile.favoriteGame!);
                                    setIsUserPinSelected(false);
                                    onSelectSquad(null);
                                  }}
                                  className="group/badge text-xs font-mono-num font-semibold text-lime-300 bg-lime-950/80 hover:bg-lime-900/90 px-3 py-1 rounded-lg border border-lime-400/60 hover:border-lime-300 flex items-center gap-2 shadow-[0_0_12px_rgba(163,230,53,0.3)] transition-all cursor-pointer select-none"
                                  title={`Click to filter map to ${gamerProfile.favoriteGame}`}
                                >
                                  <span className="flex items-center gap-1">
                                    <Gamepad2 className="w-3.5 h-3.5 text-lime-400 group-hover/badge:rotate-12 transition-transform" />
                                    <span className="text-slate-400">Game:</span>
                                  </span>
                                  <span className="text-white font-bold underline decoration-lime-400/50 group-hover/badge:text-lime-200">
                                    {gamerProfile.favoriteGame}
                                  </span>
                                  <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-lime-400 border border-lime-500/40 opacity-80 group-hover/badge:opacity-100 flex items-center gap-1">
                                    <Search className="w-2.5 h-2.5" />
                                    <span>Show on Map</span>
                                  </span>
                                </button>
                              )}

                              {/* Direct Social & Message Actions for You */}
                              <button
                                type="button"
                                onClick={() => {
                                  playSketchClick();
                                  onOpenSocialProfile?.(gamerProfile);
                                }}
                                className="px-3 py-1 text-xs font-display font-bold text-black bg-lime-400 hover:bg-lime-300 rounded-lg shadow-[0_0_12px_rgba(163,230,53,0.5)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                              >
                                <Users className="w-3.5 h-3.5 text-black" />
                                <span>My Profile & Followers</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  playSketchClick();
                                  onSelectSquad(null);
                                  setIsUserPinSelected(false);
                                  onOpenDirectMessages?.(null);
                                }}
                                className="px-3.5 py-1 text-xs font-display font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 border border-emerald-300/90 rounded-lg shadow-[0_0_16px_rgba(16,185,129,0.55)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                                <span>Comms & Messages</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full-Screen Two-Column Tactical Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                        {/* Column 1: Dossier Bio & Socials */}
                        <div className="space-y-3.5">
                          {/* Short Description / Bio Dossier */}
                          <div className="p-3.5 bg-[#010702] border border-lime-500/25 rounded">
                            <div className="text-[11px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                              <span>Player Dossier & Mission Bio</span>
                            </div>
                            {gamerProfile?.bio ? (
                              <p className="text-xs sm:text-sm font-sketch text-slate-200 leading-relaxed whitespace-pre-line italic">
                                "{gamerProfile.bio}"
                              </p>
                            ) : (
                              onOpenEditProfile && (
                                <button
                                  onClick={() => {
                                    playSketchClick();
                                    onOpenEditProfile();
                                  }}
                                  className="w-full p-2.5 bg-[#010602] border border-dashed border-lime-500/30 hover:border-lime-400 rounded text-xs font-sketch text-slate-400 hover:text-lime-200 text-center transition-colors cursor-pointer"
                                >
                                  + Add short description in Edit Profile
                                </button>
                              )
                            )}
                          </div>

                          {/* Social Media Links */}
                          {gamerProfile?.socialLinks && Object.values(gamerProfile.socialLinks).some(Boolean) && (
                            <div className="p-3.5 bg-[#010702] border border-lime-500/25 rounded">
                              <div className="text-[11px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-2 flex items-center gap-1.5">
                                <LinkIcon className="w-3.5 h-3.5 text-lime-400" />
                                <span>Connect & Social Networks</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {/* TikTok */}
                                {gamerProfile.socialLinks.tiktok && (
                                  <a
                                    href={formatSocialUrl('tiktok', gamerProfile.socialLinks.tiktok)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-black/80 text-cyan-200 border border-cyan-400/60 hover:border-pink-500 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                  >
                                    <TikTokIcon className="w-3.5 h-3.5 text-cyan-400" />
                                    <span className="font-bold text-white">TikTok:</span>
                                    <span>{gamerProfile.socialLinks.tiktok}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}

                                {/* Instagram */}
                                {gamerProfile.socialLinks.instagram && (
                                  <a
                                    href={formatSocialUrl('instagram', gamerProfile.socialLinks.instagram)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-pink-950/40 text-pink-200 border border-pink-500/50 hover:border-pink-400 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(236,72,153,0.2)]"
                                  >
                                    <Instagram className="w-3.5 h-3.5 text-pink-400" />
                                    <span className="font-bold text-pink-300">Instagram:</span>
                                    <span>{gamerProfile.socialLinks.instagram}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}

                                {/* YouTube */}
                                {gamerProfile.socialLinks.youtube && (
                                  <a
                                    href={formatSocialUrl('youtube', gamerProfile.socialLinks.youtube)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-red-950/50 text-red-200 border border-red-500/50 hover:border-red-400 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                  >
                                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                                    <span className="font-bold text-red-400">YouTube:</span>
                                    <span>{gamerProfile.socialLinks.youtube}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}

                                {/* Facebook */}
                                {gamerProfile.socialLinks.facebook && (
                                  <a
                                    href={formatSocialUrl('facebook', gamerProfile.socialLinks.facebook)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-blue-950/40 text-blue-200 border border-blue-500/50 hover:border-blue-400 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                  >
                                    <Facebook className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="font-bold text-blue-300">Facebook:</span>
                                    <span>{gamerProfile.socialLinks.facebook}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}

                                {/* Discord */}
                                {gamerProfile.socialLinks.discord && (
                                  <span className="px-2.5 py-1 text-xs font-sketch bg-[#5865F2]/20 text-[#c7d2fe] border border-[#5865F2]/50 rounded flex items-center gap-1.5">
                                    <span className="text-[#818cf8] font-bold">Discord:</span>
                                    <span className="text-white">{gamerProfile.socialLinks.discord}</span>
                                  </span>
                                )}

                                {/* Twitch */}
                                {gamerProfile.socialLinks.twitch && (
                                  <a
                                    href={formatSocialUrl('twitch', gamerProfile.socialLinks.twitch)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-[#9146FF]/20 text-[#e9d5ff] border border-[#9146FF]/50 rounded flex items-center gap-1.5 hover:text-white transition-colors"
                                  >
                                    <span className="text-[#c084fc] font-bold">Twitch</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}

                                {/* Steam */}
                                {gamerProfile.socialLinks.steam && (
                                  <a
                                    href={formatSocialUrl('steam', gamerProfile.socialLinks.steam)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-[#1b2838] text-slate-200 border border-slate-600 rounded flex items-center gap-1.5 hover:text-white transition-colors"
                                  >
                                    <span className="text-slate-400 font-bold">Steam</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}

                                {/* Twitter / X */}
                                {gamerProfile.socialLinks.twitter && (
                                  <a
                                    href={formatSocialUrl('twitter', gamerProfile.socialLinks.twitter)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-sky-950/80 text-sky-200 border border-sky-500/40 rounded flex items-center gap-1.5 hover:text-white transition-colors"
                                  >
                                    <span className="text-sky-400 font-bold">X:</span>
                                    <span>{gamerProfile.socialLinks.twitter}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Column 2: Genres/Games & Play Schedule */}
                        <div className="space-y-3.5">
                          {/* Games & Genres He Likes */}
                          {((gamerProfile?.likedGenres && gamerProfile.likedGenres.length > 0) ||
                            (gamerProfile?.likedGames && gamerProfile.likedGames.length > 0)) && (
                            <div className="p-3.5 bg-[#010702] border border-lime-500/25 rounded">
                              <div className="text-[11px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-2 flex items-center gap-1.5">
                                <Gamepad2 className="w-3.5 h-3.5 text-lime-400" />
                                <span>Favorite Genres & Titles</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {gamerProfile?.likedGenres?.map((genre, gIdx) => (
                                  <span
                                    key={`genre-${genre}-${gIdx}`}
                                    className="px-2.5 py-1 rounded text-xs font-sketch bg-lime-950/80 text-lime-200 border border-lime-400/50"
                                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                                  >
                                    {genre}
                                  </span>
                                ))}
                                {gamerProfile?.likedGames?.map((game, gIdx) => (
                                  <span
                                    key={`game-${game}-${gIdx}`}
                                    className="px-2.5 py-1 rounded text-xs font-sketch bg-emerald-950/80 text-emerald-200 border border-emerald-400/50"
                                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                                  >
                                    🎮 {game}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Play Schedule & Availability (Days & Time When User Plays) */}
                          <div className="p-3.5 bg-[#010602] border border-lime-500/25 rounded">
                            <div className="text-[11px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-lime-400" />
                                <span>Play Schedule & Availability</span>
                              </span>
                              {onOpenEditProfile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    playSketchClick();
                                    onOpenEditProfile();
                                  }}
                                  className="text-[11px] font-sketch text-lime-300 hover:text-white underline cursor-pointer"
                                >
                                  Edit Days/Times
                                </button>
                              )}
                            </div>
                            {gamerProfile?.playSchedule &&
                            ((gamerProfile.playSchedule.days && gamerProfile.playSchedule.days.length > 0) ||
                              gamerProfile.playSchedule.timeSlot ||
                              gamerProfile.playSchedule.customHours) ? (
                              <div className="space-y-2">
                                {gamerProfile.playSchedule.days && gamerProfile.playSchedule.days.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {gamerProfile.playSchedule.days.map((day, dIdx) => (
                                      <span
                                        key={`day-${day}-${dIdx}`}
                                        className="px-2.5 py-1 text-xs font-mono-num font-bold bg-lime-950/80 text-lime-200 border border-lime-400/50 rounded"
                                      >
                                        🗓️ {day}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {gamerProfile.playSchedule.timeSlot && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2.5 py-1 text-xs font-sketch bg-emerald-950/80 text-emerald-200 border border-emerald-400/50 rounded flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Time: {gamerProfile.playSchedule.timeSlot}</span>
                                    </span>
                                  </div>
                                )}
                                {gamerProfile.playSchedule.customHours && (
                                  <p className="text-xs font-sketch text-slate-300 italic">
                                    "{gamerProfile.playSchedule.customHours}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              onOpenEditProfile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    playSketchClick();
                                    onOpenEditProfile();
                                  }}
                                  className="w-full p-2.5 bg-[#010602] border border-dashed border-lime-500/30 hover:border-lime-400 rounded text-xs font-sketch text-slate-400 hover:text-lime-200 text-center transition-colors cursor-pointer"
                                >
                                  + Set days and time when you play in Edit Profile
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Uploaded Photos Showcase Gallery */}
                      <div className="mt-4 p-3.5 bg-[#010602] border border-lime-500/25 rounded">
                        <div className="text-[11px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-lime-400" />
                            <span>Uploaded Photos & Battlestation ({gamerProfile?.photos?.length || 0})</span>
                          </span>
                          {onOpenEditProfile && (
                            <button
                              type="button"
                              onClick={() => {
                                playSketchClick();
                                onOpenEditProfile();
                              }}
                              className="text-[11px] font-sketch text-lime-300 hover:text-white underline cursor-pointer"
                            >
                              Manage Photos
                            </button>
                          )}
                        </div>
                        {gamerProfile?.photos && gamerProfile.photos.length > 0 ? (
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
                                {photo.caption && (
                                  <div className="absolute inset-x-0 bottom-0 bg-black/85 px-2 py-1 text-[10px] text-lime-200 font-sketch truncate">
                                    {photo.caption}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs font-sketch text-slate-400 italic py-2 text-center">
                            No setup photos or screenshots uploaded yet. Use Edit Profile to upload!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : selectedSquad && selectedSquad.beaconType !== 'chat_room' ? (
                  /* Selected Squad / Live User Full-Screen Dossier */
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-6xl my-auto rounded-3xl bg-[#030a05]/98 border-2 border-lime-400 backdrop-blur-2xl shadow-[0_0_60px_rgba(163,230,53,0.45)] p-6 sm:p-8 md:p-10 text-white relative flex flex-col max-h-[94vh] overflow-y-auto cursor-default"
                    style={{
                      borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                      boxShadow: '0 0 50px rgba(163, 230, 53, 0.45), inset 0 0 25px rgba(163, 230, 53, 0.08)',
                    }}
                  >
                    {/* Simple outline smaller X close button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSketchClick();
                        onSelectSquad(null);
                      }}
                      className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-50 p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
                      title="Close Window [Esc]"
                      aria-label="Close Window"
                    >
                      <X className="w-4 h-4 stroke-[1.75]" />
                    </button>

                    <div>
                      {/* Top Header: Avatar Photo, Name, Badges, Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-lime-500/30 gap-5 mb-4 pr-10 sm:pr-12">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 min-w-0 text-center sm:text-left">
                          {/* Grand Event Hall 3D Preview OR Store 3D Building Preview OR Profile Avatar */}
                          {selectedSquad.beaconType === 'other_event' || selectedSquad.buildingType === 'grand_event' ? (
                            <div className="relative p-2 flex-shrink-0 select-none flex flex-col items-center">
                              <div className="p-2 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-purple-950/70 to-amber-950/40 shadow-[0_0_35px_rgba(234,179,8,0.5)]">
                                <EventBuilding3D
                                  eventTitle={selectedSquad.name}
                                  width={142}
                                  height={126}
                                />
                              </div>
                              <div className="mt-2 bg-[#0f172a] border border-amber-400 text-amber-300 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_12px_rgba(234,179,8,0.6)]">
                                <span>🏛️ GRAND EVENT HALL</span>
                              </div>
                            </div>
                          ) : selectedSquad.beaconType === 'store' ? (
                            <div className="relative p-2 flex-shrink-0 select-none flex flex-col items-center">
                              <div
                                className={`p-2 rounded-2xl border-2 shadow-2xl relative ${
                                  selectedSquad.buildingType === 'boutique'
                                    ? 'border-pink-400 bg-pink-950/40 shadow-[0_0_30px_rgba(236,72,153,0.5)]'
                                    : selectedSquad.buildingType === 'girly_spooky'
                                    ? 'border-rose-400 bg-rose-950/40 shadow-[0_0_30px_rgba(244,63,94,0.5)]'
                                    : selectedSquad.buildingType === 'girly_kiosk'
                                    ? 'border-pink-400 bg-pink-950/40 shadow-[0_0_30px_rgba(219,39,119,0.5)]'
                                    : selectedSquad.buildingType === 'boy_kiosk'
                                    ? 'border-sky-400 bg-sky-950/40 shadow-[0_0_30px_rgba(56,189,248,0.5)]'
                                    : selectedSquad.buildingType === 'spooky_shop'
                                    ? 'border-orange-400 bg-orange-950/40 shadow-[0_0_30px_rgba(249,115,22,0.5)]'
                                    : selectedSquad.buildingType === 'medium_store'
                                    ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                                    : selectedSquad.buildingType === 'sketch_store'
                                    ? 'border-orange-300 bg-stone-900/60 shadow-[0_0_30px_rgba(251,146,60,0.5)]'
                                    : selectedSquad.buildingType === 'cyber_tower'
                                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                                    : 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                                }`}
                              >
                                <StoreBuilding3D
                                  buildingType={selectedSquad.buildingType || 'boutique'}
                                  storeTitle={selectedSquad.name}
                                  width={142}
                                  height={126}
                                />
                              </div>
                              <div className={`mt-2 bg-[#020a04] border ${
                                selectedSquad.buildingType === 'girly_spooky'
                                  ? 'border-rose-400 text-rose-300'
                                  : selectedSquad.buildingType === 'girly_kiosk'
                                  ? 'border-pink-400 text-pink-300'
                                  : selectedSquad.buildingType === 'boy_kiosk'
                                  ? 'border-sky-400 text-sky-300'
                                  : selectedSquad.buildingType === 'spooky_shop'
                                  ? 'border-orange-400 text-orange-300'
                                  : selectedSquad.buildingType === 'medium_store'
                                  ? 'border-amber-400 text-amber-300'
                                  : selectedSquad.buildingType === 'sketch_store'
                                  ? 'border-orange-300 text-orange-200'
                                  : selectedSquad.buildingType === 'cyber_tower'
                                  ? 'border-cyan-400 text-cyan-300'
                                  : selectedSquad.buildingType === 'boutique'
                                  ? 'border-pink-400 text-pink-300'
                                  : 'border-emerald-400 text-emerald-300'
                              } px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_12px_rgba(236,72,153,0.6)]`}>
                                <Store className={`w-3 h-3 ${
                                  selectedSquad.buildingType === 'girly_spooky'
                                    ? 'text-rose-400'
                                    : selectedSquad.buildingType === 'girly_kiosk'
                                    ? 'text-pink-400'
                                    : selectedSquad.buildingType === 'boy_kiosk'
                                    ? 'text-sky-400'
                                    : selectedSquad.buildingType === 'spooky_shop'
                                    ? 'text-orange-400'
                                    : selectedSquad.buildingType === 'medium_store'
                                    ? 'text-amber-400'
                                    : selectedSquad.buildingType === 'sketch_store'
                                    ? 'text-orange-300'
                                    : selectedSquad.buildingType === 'cyber_tower'
                                    ? 'text-cyan-400'
                                    : selectedSquad.buildingType === 'boutique'
                                    ? 'text-pink-400'
                                    : 'text-emerald-400'
                                }`} />
                                <span>{
                                  selectedSquad.buildingType === 'boutique'
                                    ? 'BOUTIQUE'
                                    : selectedSquad.buildingType === 'girly_spooky'
                                    ? 'GIRLY SPOOKY'
                                    : selectedSquad.buildingType === 'girly_kiosk'
                                    ? 'GIRLY KIOSK'
                                    : selectedSquad.buildingType === 'boy_kiosk'
                                    ? 'BOY KIOSK'
                                    : selectedSquad.buildingType === 'spooky_shop'
                                    ? 'SPOOKY'
                                    : selectedSquad.buildingType === 'medium_store'
                                    ? 'MEDIUM'
                                    : selectedSquad.buildingType === 'sketch_store'
                                    ? 'SKETCH'
                                    : selectedSquad.buildingType === 'cyber_tower'
                                    ? 'CYBER TOWER'
                                    : 'ARCADE'
                                } STORE</span>
                              </div>
                            </div>
                          ) : selectedSquad.photoUrl ? (
                            <div
                              onClick={() => {
                                playSketchClick();
                                setSelectedLightboxPhoto({
                                  url: selectedSquad.photoUrl!,
                                  caption: `${selectedSquad.name} Leader Photo`,
                                });
                              }}
                              className="relative cursor-pointer group flex-shrink-0 p-3 select-none"
                              title="Click to zoom photo"
                            >
                              {/* Outer Cyber Radar Rotating Ring */}
                              <div className="absolute inset-0 rounded-full border border-dashed border-lime-400/50 animate-spin [animation-duration:24s] pointer-events-none group-hover:border-lime-300 transition-colors" />

                              {/* Secondary Counter-Rotating Cyber Ring */}
                              <div className="absolute inset-1.5 rounded-full border border-dotted border-emerald-400/40 animate-spin [animation-duration:14s] [animation-direction:reverse] pointer-events-none" />

                              {/* Tactical HUD Corner Brackets */}
                              <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 border-t-2 border-l-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 border-t-2 border-r-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute bottom-0.5 left-0.5 w-3.5 h-3.5 border-b-2 border-l-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-b-2 border-r-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />

                              {/* Cardinal Crosshair Tick Marks */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />

                              {/* Glowing Energy Aura Ring */}
                              <div className="relative rounded-full p-1 bg-gradient-to-tr from-lime-500 via-emerald-400 to-green-300 shadow-[0_0_35px_rgba(163,230,53,0.7)] group-hover:shadow-[0_0_50px_rgba(163,230,53,0.95)] transition-all duration-300">
                                <img
                                  src={selectedSquad.photoUrl}
                                  alt={selectedSquad.name}
                                  className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full object-cover border-2 border-black/90 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                                />

                                {/* Interactive Camera & Zoom HUD Overlay */}
                                <div className="absolute inset-1 rounded-full bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200">
                                  <Camera className="w-8 h-8 text-lime-300 drop-shadow-[0_0_10px_rgba(163,230,53,0.9)] mb-1" />
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-lime-200 font-bold bg-black/80 px-2 py-0.5 rounded border border-lime-400/60 shadow-[0_0_8px_rgba(163,230,53,0.5)]">
                                    INSPECT
                                  </span>
                                </div>
                              </div>

                              {/* Squad Leader Badge */}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#020a04] border border-lime-400 text-lime-300 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_12px_rgba(163,230,53,0.6)] z-10 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                                <span>LEADER</span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative p-3 flex-shrink-0 select-none">
                              {/* Outer Cyber Radar Rotating Ring */}
                              <div className="absolute inset-0 rounded-full border border-dashed border-lime-400/50 animate-spin [animation-duration:24s] pointer-events-none" />
                              <div className="absolute inset-1.5 rounded-full border border-dotted border-emerald-400/40 animate-spin [animation-duration:14s] [animation-direction:reverse] pointer-events-none" />

                              {/* Corner Brackets */}
                              <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 border-t-2 border-l-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 border-t-2 border-r-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute bottom-0.5 left-0.5 w-3.5 h-3.5 border-b-2 border-l-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-b-2 border-r-2 border-lime-400 pointer-events-none drop-shadow-[0_0_6px_rgba(163,230,53,0.8)]" />

                              {/* Cardinal Ticks */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-lime-400 pointer-events-none shadow-[0_0_6px_rgba(163,230,53,0.9)]" />

                              <div className="relative rounded-full p-1 bg-gradient-to-tr from-lime-500 via-emerald-400 to-green-300 shadow-[0_0_35px_rgba(163,230,53,0.7)]">
                                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-2 border-black/90 bg-lime-950/90 flex items-center justify-center font-display font-bold text-3xl sm:text-5xl text-lime-300 shadow-2xl">
                                  {selectedSquad.name.slice(0, 2).toUpperCase()}
                                </div>
                              </div>

                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#020a04] border border-lime-400 text-lime-300 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_12px_rgba(163,230,53,0.6)] z-10 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                                <span>LEADER</span>
                              </div>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h2 className="text-2xl sm:text-4xl font-bold font-display text-white mt-1.5 truncate tracking-wide">
                              {selectedSquad.name}
                            </h2>

                            {/* Category & Details Badges */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
                              {isEventBeacon(selectedSquad) ? (
                                selectedSquad.expiresAt ? (
                                  <span className="px-2.5 py-1 text-xs font-mono-num font-bold text-yellow-300 bg-yellow-950/90 rounded border border-yellow-400/60 flex items-center gap-1.5 shadow-[0_0_8px_rgba(250,204,21,0.3)]">
                                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                    <span>Auto-Deletes in {Math.max(1, Math.ceil((new Date(selectedSquad.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days</span>
                                  </span>
                                ) : null
                              ) : (
                                <>
                                  {selectedSquad.beaconType === 'tournament' && (
                                    <span className="px-2.5 py-1 text-xs font-mono-num font-bold text-amber-200 bg-amber-950/90 rounded border border-amber-400 flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                      <span>🏆 TOURNAMENT</span>
                                    </span>
                                  )}

                                  {selectedSquad.prizePool && (
                                    <span className="px-2.5 py-1 text-xs font-mono-num font-bold text-yellow-300 bg-yellow-950/90 rounded border border-yellow-400/60 flex items-center gap-1.5 shadow-[0_0_8px_rgba(250,204,21,0.3)]">
                                      <span>💰 {selectedSquad.prizePool}</span>
                                    </span>
                                  )}
                                  {selectedSquad.eventDate && (
                                    <span className="px-2.5 py-1 text-xs font-sketch text-lime-300 bg-lime-950/80 rounded border border-lime-400/50 flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-lime-400" />
                                      <span>{selectedSquad.eventDate}</span>
                                    </span>
                                  )}
                                  {selectedSquad.beaconType === 'store' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playSketchClick();
                                        setSearchQuery(selectedSquad.name);
                                        onSelectSquad(null);
                                        setIsUserPinSelected(false);
                                      }}
                                      className="group/badge px-3 py-1 text-xs font-mono-num font-semibold text-pink-300 bg-pink-950/80 hover:bg-pink-900/90 rounded-lg border border-pink-400/60 hover:border-pink-300 flex items-center gap-2 shadow-[0_0_12px_rgba(236,72,153,0.3)] transition-all cursor-pointer select-none"
                                      title={`Click to filter map to ${selectedSquad.name}`}
                                    >
                                      <span className="flex items-center gap-1">
                                        <Store className="w-3.5 h-3.5 text-pink-400 group-hover/badge:rotate-12 transition-transform" />
                                        <span className="text-slate-400">Store:</span>
                                      </span>
                                      <span className="text-white font-bold underline decoration-pink-400/50 group-hover/badge:text-pink-200">
                                        {selectedSquad.name}
                                      </span>
                                      <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-pink-400 border border-pink-500/40 opacity-80 group-hover/badge:opacity-100 flex items-center gap-1">
                                        <Search className="w-2.5 h-2.5" />
                                        <span>Show on Map</span>
                                      </span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playSketchClick();
                                        setSearchQuery(selectedSquad.game);
                                        onSelectSquad(null);
                                        setIsUserPinSelected(false);
                                      }}
                                      className="group/badge px-3 py-1 text-xs font-mono-num font-semibold text-lime-300 bg-lime-950/80 hover:bg-lime-900/90 rounded-lg border border-lime-400/60 hover:border-lime-300 flex items-center gap-2 shadow-[0_0_12px_rgba(163,230,53,0.3)] transition-all cursor-pointer select-none"
                                      title={`Click to filter map to ${selectedSquad.game}`}
                                    >
                                      <span className="flex items-center gap-1">
                                        <Gamepad2 className="w-3.5 h-3.5 text-lime-400 group-hover/badge:rotate-12 transition-transform" />
                                        <span className="text-slate-400">Game:</span>
                                      </span>
                                      <span className="text-white font-bold underline decoration-lime-400/50 group-hover/badge:text-lime-200">
                                        {selectedSquad.game}
                                      </span>
                                      <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-lime-400 border border-lime-500/40 opacity-80 group-hover/badge:opacity-100 flex items-center gap-1">
                                        <Search className="w-2.5 h-2.5" />
                                        <span>Show on Map</span>
                                      </span>
                                    </button>
                                  )}
                                </>
                              )}

                                  {/* Direct Social Profile & Send Message Actions - Players & Character Pins ONLY */}
                                  {!isEventBeacon(selectedSquad) && selectedSquad.beaconType !== 'store' && (
                                    <>
                                      {/* Add Friend Button & Status Handling */}
                                    {(() => {
                                      const targetUid = selectedSquad.ownerId || selectedSquad.id;
                                      const status = getPlayerFriendStatus(targetUid);
                                      const incomingReq = incomingFriendRequests.find(
                                        (r) => r.senderId === targetUid && r.status === 'pending'
                                      );

                                      if (status === 'self') {
                                        return (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              playSketchClick();
                                              onOpenSocialProfile?.(selectedSquad);
                                            }}
                                            className="px-3 py-1 text-xs font-display font-bold text-black bg-lime-400 hover:bg-lime-300 rounded-lg shadow-[0_0_12px_rgba(163,230,53,0.5)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                          >
                                            <Users className="w-3.5 h-3.5 text-black" />
                                            <span>Your Profile</span>
                                          </button>
                                        );
                                      }

                                      if (status === 'friends') {
                                        return (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              playSketchClick();
                                              handleRemoveFriend(targetUid, selectedSquad.name);
                                            }}
                                            disabled={isProcessingFriend}
                                            title="You are friends! Click to remove friendship"
                                            className="px-3 py-1 text-xs font-display font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-[0_0_14px_rgba(16,185,129,0.5)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                          >
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-950" />
                                            <span>Friends ✓</span>
                                          </button>
                                        );
                                      }

                                      if (status === 'pending_sent') {
                                        return (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              playSketchClick();
                                              handleCancelFriendRequest(targetUid, selectedSquad.name);
                                            }}
                                            disabled={isProcessingFriend}
                                            title="Friend request sent! Click to cancel request"
                                            className="px-3 py-1 text-xs font-display font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-[0_0_14px_rgba(245,158,11,0.5)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                          >
                                            <Clock className="w-3.5 h-3.5 text-amber-950 animate-pulse" />
                                            <span>Request Sent (Pending)</span>
                                          </button>
                                        );
                                      }

                                      if (status === 'pending_received' && incomingReq) {
                                        return (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                playSketchClick();
                                                handleAcceptFriendRequest(incomingReq);
                                              }}
                                              disabled={isProcessingFriend}
                                              className="px-3 py-1 text-xs font-display font-bold text-black bg-lime-400 hover:bg-lime-300 rounded-lg shadow-[0_0_14px_rgba(163,230,53,0.6)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                            >
                                              <UserCheck className="w-3.5 h-3.5 text-black" />
                                              <span>Accept Friend</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                playSketchClick();
                                                handleDeclineFriendRequest(incomingReq);
                                              }}
                                              disabled={isProcessingFriend}
                                              className="px-2 py-1 text-xs font-display font-bold text-slate-300 hover:text-red-300 bg-black/60 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/50 rounded-lg transition-colors cursor-pointer"
                                            >
                                              Decline
                                            </button>
                                          </div>
                                        );
                                      }

                                      // Default: Add Friend button as requested by user
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            playSketchClick();
                                            handleAddFriendClick(selectedSquad);
                                          }}
                                          disabled={isProcessingFriend}
                                          className="px-3 py-1 text-xs font-display font-bold text-black bg-lime-400 hover:bg-lime-300 rounded-lg shadow-[0_0_12px_rgba(163,230,53,0.5)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                        >
                                          <UserPlus className="w-3.5 h-3.5 text-black" />
                                          <span>Add Friend</span>
                                        </button>
                                      );
                                    })()}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!user) {
                                          onOpenAuthModal?.('signin');
                                          return;
                                        }
                                        playSketchClick();
                                        onSelectSquad(null);
                                        setIsUserPinSelected(false);
                                        onOpenDirectMessages?.({
                                          uid: selectedSquad.ownerId || selectedSquad.id,
                                          gamerTag: selectedSquad.name,
                                          photoUrl: selectedSquad.photoUrl,
                                          avatar: selectedSquad.characterAvatar,
                                        });
                                      }}
                                      className="px-3.5 py-1 text-xs font-display font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 border border-emerald-300/90 rounded-lg shadow-[0_0_16px_rgba(16,185,129,0.55)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                      title={`Send direct message to ${selectedSquad.name}`}
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                                      <span>Send Message</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        playSketchClick();
                                        onOpenSocialProfile?.(selectedSquad);
                                      }}
                                      title="View Social Profile & Photos"
                                      className="px-2 py-1 text-xs font-display text-slate-300 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Users className="w-3 h-3 text-lime-400" />
                                      <span className="hidden sm:inline">Profile</span>
                                    </button>
                                  </>
                                  )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full-Screen Two-Column Tactical Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                        {/* Left Column: Dossier, Genres, Schedule, Socials (7 cols) */}
                        <div className="lg:col-span-7 space-y-3.5">
                          {/* Store Name & Short Description Card (Stores only) */}
                          {selectedSquad.beaconType === 'store' && (
                            <div className="p-4 bg-[#010602] rounded-xl border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.15)] space-y-2">
                              <div className="text-[11px] uppercase font-bold font-mono text-pink-300 tracking-wider flex items-center gap-1.5">
                                <Store className="w-4 h-4 text-pink-400" />
                                <span>About This Store · Description</span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-100 font-sketch leading-relaxed whitespace-pre-line bg-black/50 p-3 rounded-lg border border-pink-500/25">
                                "{selectedSquad.storeData?.description || selectedSquad.description || 'Welcome to our store! Browse our items below and reach out directly.'}"
                              </p>
                            </div>
                          )}

                          {/* Event Details Card (Grand Event Hall) */}
                          {isEventBeacon(selectedSquad) && (
                            <div className="p-4 bg-gradient-to-r from-[#0d0914] via-[#090b14] to-[#0d0914] rounded-xl border border-amber-500/40 shadow-[0_0_20px_rgba(234,179,8,0.2)] space-y-3">
                              <div className="text-[11px] uppercase font-bold font-mono text-amber-300 tracking-wider flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4 text-amber-400" />
                                  <span>Event Mission Brief & Schedule</span>
                                </span>
                                {selectedSquad.expiresAt && (
                                  <span className="text-[10px] text-amber-300 font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 font-bold">
                                    ⏳ Auto-deletes in {Math.max(1, Math.ceil((new Date(selectedSquad.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-slate-100 font-sketch leading-relaxed whitespace-pre-line bg-black/60 p-3.5 rounded-lg border border-amber-500/30">
                                "{selectedSquad.description}"
                              </p>

                              {/* Physical Address & Venue Sector info */}
                              <div className="space-y-1.5 pt-1 text-xs font-sketch">
                                {(selectedSquad.mainAddress || selectedSquad.eventData?.mainAddress) && (
                                  <div className="flex items-start gap-2 bg-amber-950/70 p-2.5 rounded-lg border border-amber-500/40 text-amber-100">
                                    <Building className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block">Main Physical Address:</span>
                                      <span className="font-semibold text-white break-words">{selectedSquad.mainAddress || selectedSquad.eventData?.mainAddress}</span>
                                    </div>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 text-amber-200">
                                  <span className="flex items-center gap-1.5 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-500/30">
                                    <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                    <span>{selectedSquad.locationAddress || selectedSquad.locationName}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Player Dossier / Bio (Squads & Players only) */}
                          {selectedSquad.beaconType !== 'store' &&
                            !isEventBeacon(selectedSquad) && (
                              <div className="p-3.5 bg-[#010602] rounded border border-lime-500/25">
                                <div className="text-[11px] uppercase font-bold font-mono tracking-wider mb-1.5 flex items-center gap-1.5 text-lime-400">
                                  <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                                  <span>Player Dossier & Mission Brief</span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sketch italic whitespace-pre-line">
                                  "{selectedSquad.bio || selectedSquad.description}"
                                </p>
                              </div>
                            )}

                          {/* Store Photos Gallery for up to 15 photos */}
                          {selectedSquad.beaconType === 'store' && selectedSquad.photos && selectedSquad.photos.length > 0 && (
                            <div className="p-3.5 bg-[#010602] rounded border border-pink-500/30">
                              <div className="text-[11px] uppercase font-bold font-mono text-pink-300 tracking-wider mb-2.5 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <ImageIcon className="w-4 h-4 text-pink-400" />
                                  <span>Store & Item Photos ({selectedSquad.photos.length} / {selectedSquad.buildingType?.includes('kiosk') ? 5 : 10} Items)</span>
                                </span>
                                <span className="text-xs text-slate-400 font-sketch">Click photo to zoom</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {selectedSquad.photos.map((photo, pIdx) => (
                                  <div
                                    key={photo.id || pIdx}
                                    className="bg-black/60 border border-pink-500/30 hover:border-pink-400/70 rounded-xl overflow-hidden flex flex-col group transition-all"
                                  >
                                    <div
                                      onClick={() => {
                                        playSketchClick();
                                        setSelectedLightboxPhoto({
                                          url: photo.url,
                                          caption: `${selectedSquad.name} - Item #${pIdx + 1}`,
                                          price: photo.price,
                                          priceType: photo.priceType,
                                          intent: photo.intent,
                                          condition: photo.condition,
                                          description: photo.description,
                                        });
                                      }}
                                      className="relative aspect-video w-full overflow-hidden bg-black/80 cursor-pointer"
                                    >
                                      <img
                                        src={photo.url}
                                        alt={`Item #${pIdx + 1}`}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                      />
                                      <div className="absolute top-1.5 left-1.5 bg-black/85 px-1.5 py-0.5 rounded text-[10px] font-mono text-pink-300 font-bold border border-pink-500/40">
                                        Item #{pIdx + 1}
                                      </div>
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Camera className="w-5 h-5 text-pink-200 drop-shadow" />
                                      </div>
                                    </div>

                                    {/* Info under each photo: price, condition, firm/negotiable, sell/trade, description */}
                                    {(photo.price || photo.priceType || photo.intent || photo.condition || photo.description) && (
                                      <div className="p-2.5 space-y-1.5 text-left border-t border-pink-500/20 bg-[#020703]">
                                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                                          {photo.price && (
                                            <span className="text-xs font-mono-num font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-400/50">
                                              {photo.price}
                                            </span>
                                          )}
                                          {photo.condition && (
                                            <span className="text-[10px] font-sketch font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/50">
                                              {photo.condition}
                                            </span>
                                          )}
                                          {photo.priceType && (
                                            <span
                                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                                                photo.priceType === 'firm'
                                                  ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                                                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                              }`}
                                            >
                                              {photo.priceType === 'firm' ? 'Firm on Price' : 'Negotiable'}
                                            </span>
                                          )}
                                          {photo.intent && (
                                            <span
                                              className={`text-[9px] font-display font-bold px-1.5 py-0.5 rounded uppercase border ${
                                                photo.intent === 'sell'
                                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-400/50'
                                                  : photo.intent === 'trade'
                                                  ? 'bg-amber-950 text-amber-300 border-amber-400/50'
                                                  : 'bg-lime-950 text-lime-300 border-lime-400/50'
                                              }`}
                                            >
                                              {photo.intent === 'sell' ? '💵 Sell' : photo.intent === 'trade' ? '🔄 Trade' : 'Sell/Trade'}
                                            </span>
                                          )}
                                        </div>
                                        {photo.description && (
                                          <p className="text-[11px] font-sketch text-slate-300 line-clamp-3 leading-relaxed">
                                            {photo.description}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Liked Games & Genres (Squads / Gamers only) */}
                          {selectedSquad.beaconType !== 'store' &&
                            ((selectedSquad.likedGenres && selectedSquad.likedGenres.length > 0) ||
                              (selectedSquad.likedGames && selectedSquad.likedGames.length > 0)) && (
                              <div className="p-3.5 bg-[#010602] rounded border border-lime-500/25">
                                <div className="text-[11px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-2 flex items-center gap-1.5">
                                  <Gamepad2 className="w-3.5 h-3.5 text-lime-400" />
                                  <span>Favorite Genres & Titles</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {selectedSquad.likedGenres?.map((genre, gIdx) => (
                                    <span
                                      key={`genre-${genre}-${gIdx}`}
                                      className="px-2.5 py-1 text-xs font-sketch bg-lime-950/80 text-lime-200 border border-lime-400/50 rounded"
                                    >
                                      {genre}
                                    </span>
                                  ))}
                                  {selectedSquad.likedGames?.map((game, gIdx) => (
                                    <span
                                      key={`game-${game}-${gIdx}`}
                                      className="px-2.5 py-1 text-xs font-sketch bg-emerald-950/80 text-emerald-200 border border-emerald-400/50 rounded"
                                    >
                                      🎮 {game}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Connected Socials */}
                          {selectedSquad.beaconType !== 'store' && selectedSquad.socialLinks && Object.values(selectedSquad.socialLinks).some(Boolean) && (
                            <div className="p-3.5 bg-[#010602] rounded border border-lime-500/25">
                              <div className="text-[11px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-2 flex items-center gap-1.5">
                                <LinkIcon className="w-3.5 h-3.5 text-lime-400" />
                                <span>Connect & Social Networks</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {/* TikTok */}
                                {selectedSquad.socialLinks.tiktok && (
                                  <a
                                    href={formatSocialUrl('tiktok', selectedSquad.socialLinks.tiktok)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-black/80 text-cyan-200 border border-cyan-400/60 hover:border-pink-500 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                  >
                                    <TikTokIcon className="w-3.5 h-3.5 text-cyan-400" />
                                    <span className="font-bold text-white">TikTok:</span>
                                    <span>{selectedSquad.socialLinks.tiktok}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}

                                {/* Instagram */}
                                {selectedSquad.socialLinks.instagram && (
                                  <a
                                    href={formatSocialUrl('instagram', selectedSquad.socialLinks.instagram)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-pink-950/40 text-pink-200 border border-pink-500/50 hover:border-pink-400 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(236,72,153,0.2)]"
                                  >
                                    <Instagram className="w-3.5 h-3.5 text-pink-400" />
                                    <span className="font-bold text-pink-300">Instagram:</span>
                                    <span>{selectedSquad.socialLinks.instagram}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}

                                {/* YouTube */}
                                {selectedSquad.socialLinks.youtube && (
                                  <a
                                    href={formatSocialUrl('youtube', selectedSquad.socialLinks.youtube)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-red-950/50 text-red-200 border border-red-500/50 hover:border-red-400 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                  >
                                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                                    <span className="font-bold text-red-400">YouTube:</span>
                                    <span>{selectedSquad.socialLinks.youtube}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}

                                {/* Facebook */}
                                {selectedSquad.socialLinks.facebook && (
                                  <a
                                    href={formatSocialUrl('facebook', selectedSquad.socialLinks.facebook)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-blue-950/40 text-blue-200 border border-blue-500/50 hover:border-blue-400 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                  >
                                    <Facebook className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="font-bold text-blue-300">Facebook:</span>
                                    <span>{selectedSquad.socialLinks.facebook}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}

                                {/* Discord */}
                                {selectedSquad.socialLinks.discord && (
                                  <span className="px-2.5 py-1 text-xs font-sketch bg-[#5865F2]/20 text-[#c7d2fe] border border-[#5865F2]/50 rounded flex items-center gap-1.5">
                                    <strong className="text-[#818cf8]">Discord:</strong> {selectedSquad.socialLinks.discord}
                                  </span>
                                )}

                                {/* Twitch */}
                                {selectedSquad.socialLinks.twitch && (
                                  <a
                                    href={formatSocialUrl('twitch', selectedSquad.socialLinks.twitch)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-[#9146FF]/20 text-[#e9d5ff] border border-[#9146FF]/50 rounded flex items-center gap-1 hover:text-white transition-colors"
                                  >
                                    <span className="text-[#c084fc] font-bold">Twitch</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}

                                {/* Steam */}
                                {selectedSquad.socialLinks.steam && (
                                  <a
                                    href={formatSocialUrl('steam', selectedSquad.socialLinks.steam)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-[#1b2838] text-slate-200 border border-slate-600 rounded flex items-center gap-1 hover:text-white transition-colors"
                                  >
                                    <span className="text-slate-400 font-bold">Steam</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}

                                {/* Twitter / X */}
                                {selectedSquad.socialLinks.twitter && (
                                  <a
                                    href={formatSocialUrl('twitter', selectedSquad.socialLinks.twitter)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-sketch bg-sky-950/80 text-sky-200 border border-sky-500/40 rounded flex items-center gap-1.5 hover:text-white transition-colors"
                                  >
                                    <strong className="text-sky-400">X:</strong> {selectedSquad.socialLinks.twitter}
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Seller & Contact (for store) OR Play Schedule & Join (for squads) (5 cols) */}
                        <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-start">
                          {selectedSquad.beaconType === 'store' ? (
                            <>
                              {/* Direct Contact Channels */}
                              <div className="p-3.5 bg-[#010602] rounded border border-pink-500/30 space-y-2.5">
                                <div className="text-[11px] uppercase font-bold font-mono text-pink-300 tracking-wider flex items-center gap-1.5">
                                  <LinkIcon className="w-3.5 h-3.5 text-pink-400" />
                                  <span>Trader / Seller Contact Channels</span>
                                </div>
                                <div className="space-y-2 text-xs font-sketch">
                                  {selectedSquad.storeData?.contactDiscord && (
                                    <div className="flex items-center justify-between p-2.5 bg-[#5865F2]/20 border border-[#5865F2]/50 rounded-lg">
                                      <span className="text-[#c7d2fe]">
                                        <strong className="text-[#818cf8]">Discord:</strong> {selectedSquad.storeData.contactDiscord}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(selectedSquad.storeData!.contactDiscord!);
                                          setContactCopied(true);
                                          setTimeout(() => setContactCopied(false), 2500);
                                        }}
                                        className="px-2.5 py-1 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded text-[11px] font-mono cursor-pointer transition-colors"
                                      >
                                        {contactCopied ? '✓ Copied' : 'Copy Tag'}
                                      </button>
                                    </div>
                                  )}

                                  {selectedSquad.storeData?.contactEmail && (
                                    <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
                                      <span className="text-emerald-200 flex items-center gap-1.5 truncate mr-2">
                                        <Mail className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                        <strong className="text-emerald-400">Email:</strong> {selectedSquad.storeData.contactEmail}
                                      </span>
                                      <a
                                        href={`mailto:${selectedSquad.storeData.contactEmail}`}
                                        className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded text-[11px] font-mono cursor-pointer transition-colors whitespace-nowrap"
                                      >
                                        Send Email
                                      </a>
                                    </div>
                                  )}

                                  {selectedSquad.storeData?.contactPhone && (
                                    <div className="flex items-center justify-between p-2.5 bg-[#091a0e] border border-green-500/40 rounded-lg">
                                      <span className="text-green-200 flex items-center gap-1.5 truncate mr-2">
                                        <Phone className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                        <strong className="text-green-400">Phone (Text / Call):</strong> {selectedSquad.storeData.contactPhone}
                                      </span>
                                      <a
                                        href={`tel:${selectedSquad.storeData.contactPhone}`}
                                        className="px-2.5 py-1 bg-green-400 hover:bg-green-300 text-black font-bold rounded text-[11px] font-mono cursor-pointer transition-colors whitespace-nowrap"
                                      >
                                        Call / Txt
                                      </a>
                                    </div>
                                  )}

                                  {!selectedSquad.storeData?.contactDiscord && !selectedSquad.storeData?.contactEmail && !selectedSquad.storeData?.contactPhone && (
                                    <p className="text-slate-400 italic text-xs">
                                      Local meetup & trade in {selectedSquad.sector}.
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Owner Store Management (1 Store Per User) */}
                              {user && (selectedSquad.ownerId === user.uid || (selectedSquad.members && selectedSquad.members.some((m) => m.id === user.uid))) && (
                                <div className="p-3.5 bg-pink-950/40 rounded-xl border border-pink-500/50 space-y-2.5 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                                  <div className="text-[10px] uppercase font-mono font-bold text-pink-300 flex items-center justify-between pb-1.5 border-b border-pink-500/20">
                                    <span className="flex items-center gap-1.5">
                                      <Store className="w-3.5 h-3.5 text-pink-400" />
                                      <span>Your Store (1 Store Limit)</span>
                                    </span>
                                    <span className="text-[9px] bg-pink-900/80 text-pink-200 px-2 py-0.5 rounded border border-pink-400/40 font-mono font-bold">
                                      SHOP OWNER
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-sketch text-slate-300 leading-snug">
                                    Each user can only have 1 store on the radar. You can update your building & items, or close this store to clear your store slot.
                                  </p>
                                  <div className="flex items-center gap-2 pt-1">
                                    {onOpenEditStore && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          playSketchClick();
                                          onOpenEditStore();
                                        }}
                                        className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-display font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(236,72,153,0.4)] cursor-pointer flex items-center justify-center gap-1.5"
                                      >
                                        <Store className="w-3.5 h-3.5" />
                                        <span>Edit My Store</span>
                                      </button>
                                    )}
                                    {onDeleteStore && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          playSketchClick();
                                          if (confirm(`Are you sure you want to close and permanently delete "${selectedSquad.name}"? This removes it from the map so you can create a new store.`)) {
                                            onDeleteStore(selectedSquad.id);
                                          }
                                        }}
                                        className="py-2 px-3 bg-red-950/80 hover:bg-red-900 border border-red-500/60 hover:border-red-400 text-red-200 font-display font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                      >
                                        Close Store
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : isEventBeacon(selectedSquad) ? (
                            <>
                              {/* Event Host Contacts, Physical Address & Social Media Channels */}
                              <div className="p-3.5 bg-[#0a0604] rounded-xl border border-amber-500/40 space-y-3 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                                <div className="text-[11px] uppercase font-bold font-mono text-amber-300 tracking-wider flex items-center justify-between pb-2 border-b border-amber-500/20">
                                  <span className="flex items-center gap-1.5">
                                    <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Event Host & Venue Contacts</span>
                                  </span>
                                  <span className="text-[10px] font-mono bg-amber-950 px-2 py-0.5 rounded text-amber-400 border border-amber-500/40 font-bold">
                                    PUBLIC EVENT
                                  </span>
                                </div>

                                <div className="space-y-2.5 text-xs font-sketch">
                                  {/* Main Physical Street Address */}
                                  {(selectedSquad.mainAddress || selectedSquad.eventData?.mainAddress) && (
                                    <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-lg">
                                      <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block mb-0.5">
                                        Main Physical Address
                                      </span>
                                      <p className="text-white font-semibold text-xs leading-snug">
                                        {selectedSquad.mainAddress || selectedSquad.eventData?.mainAddress}
                                      </p>
                                    </div>
                                  )}

                                  {/* Contact Phone */}
                                  {(selectedSquad.contactPhone || selectedSquad.eventData?.contactPhone) && (
                                    <div className="flex items-center justify-between p-2.5 bg-[#091a0e] border border-green-500/40 rounded-lg">
                                      <span className="text-green-200 flex items-center gap-1.5 truncate mr-2">
                                        <Phone className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                        <strong className="text-green-400">Phone:</strong> {selectedSquad.contactPhone || selectedSquad.eventData?.contactPhone}
                                      </span>
                                      <a
                                        href={`tel:${selectedSquad.contactPhone || selectedSquad.eventData?.contactPhone}`}
                                        className="px-2.5 py-1 bg-green-400 hover:bg-green-300 text-black font-bold rounded text-[11px] font-mono cursor-pointer transition-colors whitespace-nowrap"
                                      >
                                        Call / Txt
                                      </a>
                                    </div>
                                  )}

                                  {/* Contact Email */}
                                  {(selectedSquad.contactEmail || selectedSquad.eventData?.contactEmail) && (
                                    <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
                                      <span className="text-emerald-200 flex items-center gap-1.5 truncate mr-2">
                                        <Mail className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                        <strong className="text-emerald-400">Email:</strong> {selectedSquad.contactEmail || selectedSquad.eventData?.contactEmail}
                                      </span>
                                      <a
                                        href={`mailto:${selectedSquad.contactEmail || selectedSquad.eventData?.contactEmail}`}
                                        className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded text-[11px] font-mono cursor-pointer transition-colors whitespace-nowrap"
                                      >
                                        Send Email
                                      </a>
                                    </div>
                                  )}

                                  {/* Social Media Links & Usernames */}
                                  {(() => {
                                    const socials = selectedSquad.socialLinks || selectedSquad.eventData?.socialLinks;
                                    const hasAny = socials && Object.values(socials).some(Boolean);
                                    if (!hasAny) return null;

                                    return (
                                      <div className="pt-2 border-t border-amber-500/20">
                                        <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block mb-2">
                                          Event Social Channels & Links
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {socials.discord && (
                                            <span className="px-2.5 py-1 text-xs font-sketch bg-[#5865F2]/20 text-[#c7d2fe] border border-[#5865F2]/50 rounded flex items-center gap-1.5">
                                              <strong className="text-[#818cf8]">Discord:</strong> {socials.discord}
                                            </span>
                                          )}
                                          {socials.instagram && (
                                            <a
                                              href={formatSocialUrl('instagram', socials.instagram)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-2.5 py-1 text-xs font-sketch bg-pink-950/40 text-pink-200 border border-pink-500/50 hover:border-pink-400 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(236,72,153,0.2)]"
                                            >
                                              <Instagram className="w-3.5 h-3.5 text-pink-400" />
                                              <span className="font-bold text-pink-300">Instagram:</span>
                                              <span>{socials.instagram}</span>
                                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                            </a>
                                          )}
                                          {socials.twitter && (
                                            <a
                                              href={formatSocialUrl('twitter', socials.twitter)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-2.5 py-1 text-xs font-sketch bg-sky-950/80 text-sky-200 border border-sky-500/40 rounded flex items-center gap-1.5 hover:text-white transition-colors"
                                            >
                                              <strong className="text-sky-400">X:</strong> {socials.twitter}
                                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                            </a>
                                          )}
                                          {socials.tiktok && (
                                            <a
                                              href={formatSocialUrl('tiktok', socials.tiktok)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-2.5 py-1 text-xs font-sketch bg-black/80 text-cyan-200 border border-cyan-400/60 hover:border-pink-500 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                            >
                                              <TikTokIcon className="w-3.5 h-3.5 text-cyan-400" />
                                              <span className="font-bold text-white">TikTok:</span>
                                              <span>{socials.tiktok}</span>
                                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                            </a>
                                          )}
                                          {socials.youtube && (
                                            <a
                                              href={formatSocialUrl('youtube', socials.youtube)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-2.5 py-1 text-xs font-sketch bg-red-950/50 text-red-200 border border-red-500/50 hover:border-red-400 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            >
                                              <Youtube className="w-3.5 h-3.5 text-red-500" />
                                              <span className="font-bold text-red-400">YouTube:</span>
                                              <span>{socials.youtube}</span>
                                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                            </a>
                                          )}
                                          {socials.facebook && (
                                            <a
                                              href={formatSocialUrl('facebook', socials.facebook)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-2.5 py-1 text-xs font-sketch bg-blue-950/40 text-blue-200 border border-blue-500/50 hover:border-blue-400 rounded flex items-center gap-1.5 hover:text-white transition-all shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                            >
                                              <Facebook className="w-3.5 h-3.5 text-blue-400" />
                                              <span className="font-bold text-blue-300">Facebook:</span>
                                              <span>{socials.facebook}</span>
                                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                            </a>
                                          )}
                                          {socials.twitch && (
                                            <a
                                              href={formatSocialUrl('twitch', socials.twitch)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-2.5 py-1 text-xs font-sketch bg-[#9146FF]/20 text-[#e9d5ff] border border-[#9146FF]/50 rounded flex items-center gap-1 hover:text-white transition-colors"
                                            >
                                              <span className="text-[#c084fc] font-bold">Twitch</span>
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          )}
                                          {socials.steam && (
                                            <a
                                              href={formatSocialUrl('steam', socials.steam)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-2.5 py-1 text-xs font-sketch bg-[#1b2838] text-slate-200 border border-slate-600 rounded flex items-center gap-1 hover:text-white transition-colors"
                                            >
                                              <span className="text-slate-400 font-bold">Steam</span>
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {!(selectedSquad.contactPhone || selectedSquad.eventData?.contactPhone) &&
                                    !(selectedSquad.contactEmail || selectedSquad.eventData?.contactEmail) &&
                                    !(selectedSquad.mainAddress || selectedSquad.eventData?.mainAddress) &&
                                    !(
                                      (selectedSquad.socialLinks && Object.values(selectedSquad.socialLinks).some(Boolean)) ||
                                      (selectedSquad.eventData?.socialLinks && Object.values(selectedSquad.eventData.socialLinks).some(Boolean))
                                    ) && (
                                      <p className="text-slate-400 italic text-xs leading-relaxed">
                                        Public gathering in {selectedSquad.sector}. Open to all attendees. Refer to the event brief for schedule and details.
                                      </p>
                                    )}
                                </div>
                              </div>

                              {/* Action Directions Button for Event */}
                              <div className="pt-1">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    selectedSquad.mainAddress
                                      ? `${selectedSquad.mainAddress}, ${selectedSquad.sector || ''}`
                                      : selectedSquad.locationAddress || selectedSquad.locationName
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-3.5 text-sm font-bold font-display tracking-wider text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded cursor-pointer transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                                >
                                  <Navigation className="w-4 h-4 text-black" />
                                  <span>Get Directions to Event</span>
                                </a>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Uploaded Photos Showcase Gallery for non-store squads */}
                              {selectedSquad.photos && selectedSquad.photos.length > 0 && (
                                <div className="p-3.5 bg-[#010602] rounded border border-lime-500/25">
                                  <div className="text-[11px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-2.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                      <ImageIcon className="w-4 h-4 text-lime-400" />
                                      <span>Uploaded Photos ({selectedSquad.photos.length})</span>
                                    </span>
                                    <span className="text-xs text-slate-400 font-sketch">Click to zoom</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2.5">
                                    {selectedSquad.photos.map((photo) => (
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
                                        {photo.caption && (
                                          <div className="absolute inset-x-0 bottom-0 bg-black/85 px-2 py-1 text-[10px] text-lime-200 font-sketch truncate">
                                            {photo.caption}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Play Schedule & Tactical Times */}
                              <div className="p-3.5 bg-[#010602] rounded border border-lime-500/25">
                                <div className="text-[11px] uppercase font-bold font-mono text-lime-400 tracking-wider mb-2 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-lime-400" />
                                  <span>Play Schedule & Availability</span>
                                </div>
                                {selectedSquad.playSchedule &&
                                ((selectedSquad.playSchedule.days && selectedSquad.playSchedule.days.length > 0) ||
                                  selectedSquad.playSchedule.timeSlot ||
                                  selectedSquad.playSchedule.customHours) ? (
                                  <div className="space-y-2">
                                    {selectedSquad.playSchedule.days && selectedSquad.playSchedule.days.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {selectedSquad.playSchedule.days.map((day, dIdx) => (
                                          <span
                                            key={`day-${day}-${dIdx}`}
                                            className="px-2.5 py-1 text-xs font-mono-num font-bold bg-lime-950/80 text-lime-200 border border-lime-400/50 rounded"
                                          >
                                            🗓️ {day}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {selectedSquad.playSchedule.timeSlot && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-2.5 py-1 text-xs font-sketch bg-emerald-950/80 text-emerald-200 border border-emerald-400/50 rounded flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                          <span>Time: {selectedSquad.playSchedule.timeSlot}</span>
                                        </span>
                                      </div>
                                    )}
                                    {selectedSquad.playSchedule.customHours && (
                                      <p className="text-xs font-sketch text-slate-300 italic">
                                        "{selectedSquad.playSchedule.customHours}"
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs font-sketch text-slate-400 italic">
                                    🗓️ Active gaming days & times open for fireteam match
                                  </div>
                                )}
                              </div>

                              {/* Join CTA Button */}
                              <div className="pt-1">
                                {selectedSquad.currentMembers >= selectedSquad.maxMembers ? (
                                  <div className="text-center text-xs font-sketch text-amber-400 py-3 bg-amber-950/30 rounded border border-amber-500/30">
                                    Squad is full ({selectedSquad.maxMembers}/{selectedSquad.maxMembers} Operatives)
                                  </div>
                                ) : (
                                  <button
                                    onClick={handleOpenJoinModal}
                                    className="w-full py-3.5 text-sm font-bold font-display tracking-wider text-lime-100 bg-lime-950/90 hover:bg-lime-900 border-2 border-lime-400 rounded cursor-pointer transition-all shadow-[0_0_20px_rgba(163,230,53,0.35)] hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                                  >
                                    <span>Request to Join Squad & Connect</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          /* Players / Squads Roster List */
          <div className="space-y-3 overflow-y-auto max-h-[750px] pr-1">
            {/* User's Deployed Gamer Profile Card (Always visible when searching or browsing players) */}
            {userMatchesSearch && (
              <div
                onClick={() => {
                  playSketchClick();
                  setActiveTab('map');
                  setIsUserPinSelected(true);
                  onSelectSquad(null);
                }}
                className="p-4 rounded bg-[#030d05] border-2 border-lime-400 cursor-pointer transition-all duration-200 shadow-[0_0_20px_rgba(163,230,53,0.35)] hover:border-lime-300 hover:shadow-[0_0_25px_rgba(163,230,53,0.5)]"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {gamerProfile?.photoUrl ? (
                      <img
                        src={gamerProfile.photoUrl}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border-2 border-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full border-2 border-lime-400 bg-lime-950/80 flex items-center justify-center font-display font-bold text-sm text-lime-300"
                        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                      >
                        {(gamerProfile?.gamerTag || activeGamerName).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold font-display text-white">
                          {gamerProfile?.gamerTag || activeGamerName}
                        </h4>
                        <span className="text-[10px] font-mono-num text-lime-300 bg-lime-950 px-2 py-0.5 rounded border border-lime-400/60 font-bold animate-pulse">
                          YOU · LIVE BEACON
                        </span>
                        <span className="text-[11px] text-slate-400 font-sketch">
                          📍 {gamerProfile?.locationName || coords?.cityName || 'Sector Active'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-300 font-sketch">
                        {gamerProfile?.favoriteGame && (
                          <span className="text-lime-300 font-semibold">🎮 {gamerProfile.favoriteGame}</span>
                        )}
                        {gamerProfile?.role && (
                          <span>· Role: <strong className="text-emerald-300">{gamerProfile.role}</strong></span>
                        )}
                        {gamerProfile?.rank && (
                          <span>· Rank: <strong className="text-amber-300">{gamerProfile.rank}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-1.5">
                    {/* Play schedule badge */}
                    {gamerProfile?.playSchedule?.days && gamerProfile.playSchedule.days.length > 0 && (
                      <span className="text-[10px] font-mono-num bg-lime-950/80 text-lime-200 border border-lime-400/50 px-2 py-0.5 rounded">
                        🗓️ {gamerProfile.playSchedule.days.join(', ')}
                        {gamerProfile.playSchedule.timeSlot && ` · ${gamerProfile.playSchedule.timeSlot}`}
                      </span>
                    )}
                    <span className="text-xs font-sketch text-lime-400 hover:text-white underline">
                      Click to View Full Tactical Dossier →
                    </span>
                  </div>
                </div>

                {/* Bio preview if available */}
                {gamerProfile?.bio && (
                  <p className="text-xs font-sketch text-slate-300 mt-2 line-clamp-2 italic border-l-2 border-lime-400/40 pl-2">
                    "{gamerProfile.bio}"
                  </p>
                )}

                {/* Liked genres / games preview */}
                {((gamerProfile?.likedGenres && gamerProfile.likedGenres.length > 0) ||
                  (gamerProfile?.likedGames && gamerProfile.likedGames.length > 0)) && (
                  <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-lime-500/20">
                    {gamerProfile?.likedGenres?.map((g, gIdx) => (
                      <span key={`g-${g}-${gIdx}`} className="text-[10px] font-sketch px-1.5 py-0.5 bg-[#010602] border border-lime-500/30 text-lime-200 rounded">
                        {g}
                      </span>
                    ))}
                    {gamerProfile?.likedGames?.map((g, gIdx) => (
                      <span key={`game-${g}-${gIdx}`} className="text-[10px] font-sketch px-1.5 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded">
                        🎮 {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {allActivePlayers.length === 0 && !userMatchesSearch ? (
              <div
                className="p-12 text-center rounded bg-[#030904] border border-green-500/30 flex flex-col items-center justify-center"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <Users className="w-12 h-12 text-green-400/50 mb-3" />
                <h3 className="text-lg font-bold font-display text-white mb-1">
                  Map Is Clean · No Squads Deployed
                </h3>
                <p className="text-xs font-sketch text-slate-400 max-w-sm mb-4">
                  All markers have been cleared. Deploy the first squad beacon on the map!
                </p>
                <button
                  onClick={() => {
                    playSketchClick();
                    onOpenCreateSquad();
                  }}
                  className="px-4 py-2 text-xs font-bold font-display text-green-100 bg-green-900/80 hover:bg-green-800 border border-green-400 rounded cursor-pointer transition-all shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  Deploy First Squad Beacon
                </button>
              </div>
            ) : (
              allActivePlayers.map(({ squad, member }, idx) => (
                <div
                  key={`${squad.id}-${member.id}-${idx}`}
                  onClick={() => {
                    handleSquadPinClick(squad);
                    setActiveTab('map');
                  }}
                  className={`p-3.5 rounded bg-[#030904] border cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    selectedSquad?.id === squad.id
                      ? 'border-green-400 shadow-[0_0_16px_rgba(34,197,94,0.45)]'
                      : 'border-green-500/20 hover:border-green-500/50'
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  <div className="flex items-center gap-3">
                    {member.photoUrl || (member.isLeader && squad.photoUrl) ? (
                      <img
                        src={member.photoUrl || squad.photoUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-green-400/80 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-green-400/70 bg-[#061408] flex items-center justify-center font-display font-bold text-xs text-green-300">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold font-display text-white">{member.name}</h4>
                        {member.isLeader && (
                          <span className="text-[10px] text-amber-400 font-sketch">(Captain)</span>
                        )}
                        <span className="text-[10px] text-emerald-400 font-mono-num bg-green-950/80 px-1.5 py-0.5 rounded border border-green-500/30">
                          {squad.formattedDistance}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-sketch mt-0.5">
                        Role: <span className="text-green-300 font-semibold">{member.role}</span> · Rank: <span className="text-amber-300">{member.rank}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-right text-xs font-sketch gap-1.5 flex-shrink-0">
                    <span className="text-green-400 font-bold block">{squad.game}</span>
                    <span className="text-slate-400 text-[11px]">{squad.name} ({squad.currentMembers}/{squad.maxMembers})</span>
                    {squad.photos && squad.photos.length > 0 && (
                      <span className="text-[10px] text-lime-300 font-sketch">
                        📷 {squad.photos.length} photos
                      </span>
                    )}

                    {/* Direct Add Friend action on all player profiles in the list */}
                    {(() => {
                      if (isEventBeacon(squad)) {
                        return (
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-400/50">
                            🏛️ EVENT
                          </span>
                        );
                      }
                      if (squad.beaconType === 'store') {
                        return (
                          <span className="text-[10px] font-mono font-bold text-pink-300 bg-pink-950/80 px-2 py-0.5 rounded border border-pink-400/50">
                            🏬 STORE
                          </span>
                        );
                      }

                      const targetUid = squad.ownerId || squad.id;
                      const status = getPlayerFriendStatus(targetUid);
                      const incomingReq = incomingFriendRequests.find(
                        (r) => r.senderId === targetUid && r.status === 'pending'
                      );

                      if (status === 'self') {
                        return (
                          <span className="text-[10px] font-mono text-lime-400 bg-lime-950/80 px-2 py-0.5 rounded border border-lime-500/40">
                            YOU
                          </span>
                        );
                      }

                      if (status === 'friends') {
                        return (
                          <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-400/50 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>Friends ✓</span>
                          </span>
                        );
                      }

                      if (status === 'pending_sent') {
                        return (
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-400/50 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Pending</span>
                          </span>
                        );
                      }

                      if (status === 'pending_received' && incomingReq) {
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSketchClick();
                              handleAcceptFriendRequest(incomingReq);
                            }}
                            className="px-2.5 py-1 text-xs font-display font-bold text-black bg-lime-400 hover:bg-lime-300 rounded shadow-[0_0_10px_rgba(163,230,53,0.5)] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3 text-black" />
                            <span>Accept</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSketchClick();
                            handleAddFriendClick(squad);
                          }}
                          className="px-2.5 py-1 text-xs font-display font-bold text-black bg-lime-400 hover:bg-lime-300 rounded shadow-[0_0_10px_rgba(163,230,53,0.5)] flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <UserPlus className="w-3 h-3 text-black" />
                          <span>Add Friend</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Clean quiet footer */}
        <footer className="mt-8 mb-6 text-center text-xs text-slate-500 font-sketch flex flex-col sm:flex-row items-center justify-center gap-2 select-none">
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
      </main>

      {/* Join Request Modal */}
      {joinModalOpen && selectedSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="w-full max-w-md bg-[#030a05] text-slate-100 p-6 relative border"
            style={{
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              borderColor: '#22c55e',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)',
              filter: 'url(#sketch-glow)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-green-500/20 mb-4">
              <h3 className="text-base font-bold font-display text-white">
                Join {selectedSquad.name}
              </h3>
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-sketch text-slate-300 mb-1">
                  Your Gamer Tag / Riot ID / Steam ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phoenix#NA1"
                  value={applicantTag}
                  onChange={(e) => setApplicantTag(e.target.value)}
                  className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none focus:border-green-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sketch text-slate-300 mb-1">
                  Preferred Role / Main Agent / Weapon
                </label>
                <input
                  type="text"
                  placeholder="e.g. Controller (Omen), Awper, Support"
                  value={applicantRole}
                  onChange={(e) => setApplicantRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none focus:border-green-400"
                />
              </div>

              <div className="p-3 rounded bg-[#010502] border border-green-500/20 text-xs font-sketch text-slate-400">
                <p>
                  Game: <span className="text-green-300">{selectedSquad.game}</span> · Target: <span className="text-green-300">{selectedSquad.rank}</span>
                </p>
                <p className="mt-1">
                  Voice: <span className="text-slate-200">{selectedSquad.micRequired ? 'Mic Required' : 'Mic Optional'}</span>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 text-xs font-sketch text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold font-display tracking-wider text-green-100 bg-green-900/60 hover:bg-green-800/80 border border-green-400 rounded cursor-pointer transition-colors shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  Confirm & Join Fireteam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Permission & Universal Location Selector Modal */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationGranted={() => {
          setShowLocationModal(false);
          playRadarPing();
        }}
        onOpenPinDropMode={() => {
          setShowLocationModal(false);
          setIsRelocatingPin(true);
          setActiveTab('map');
        }}
      />

      {/* Create Event Modal (No account or sign-in required) */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onEventCreated={(eventBeacon) => {
          setActiveFilter('Events');
          if (onEventCreated) {
            onEventCreated(eventBeacon);
          }
          onSelectSquad(eventBeacon);
        }}
      />

      {/* Photo Lightbox Full-Size Viewer */}
      <PhotoLightbox
        photoUrl={selectedLightboxPhoto?.url || null}
        caption={selectedLightboxPhoto?.caption}
        price={selectedLightboxPhoto?.price}
        priceType={selectedLightboxPhoto?.priceType}
        intent={selectedLightboxPhoto?.intent}
        condition={selectedLightboxPhoto?.condition}
        description={selectedLightboxPhoto?.description}
        onClose={() => setSelectedLightboxPhoto(null)}
      />

      {/* Friend Requests & Friends Modal */}
      <FriendRequestsModal
        isOpen={isFriendRequestsModalOpen}
        onClose={() => setIsFriendRequestsModalOpen(false)}
        incomingRequests={incomingFriendRequests}
        friends={userFriends}
        currentUserId={activeUserId}
        onAcceptRequest={handleAcceptFriendRequest}
        onDeclineRequest={handleDeclineFriendRequest}
        onRemoveFriend={handleRemoveFriend}
        onOpenDirectMessages={onOpenDirectMessages}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Create Chat Room Modal */}
      <CreateChatRoomModal
        isOpen={isCreateChatRoomModalOpen}
        onClose={() => setIsCreateChatRoomModalOpen(false)}
        existingRoom={existingUserChatRoom}
        onSelectExistingRoom={(room) => {
          setIsCreateChatRoomModalOpen(false);
          onSelectSquad(room);
          setActiveFilter('ChatRooms');
        }}
        onDeleteExistingRoom={(roomId) => {
          if (onDeleteChatRoom) {
            onDeleteChatRoom(roomId);
          }
        }}
        onDeployChatRoom={(newRoom) => {
          if (onDeployChatRoom) {
            onDeployChatRoom(newRoom);
          }
          onSelectSquad(newRoom);
          setActiveFilter('ChatRooms');
        }}
        onOpenAuthModal={onOpenAuthModal || (() => {})}
      />

      {/* Live Chat Room Modal when a chat room pin is selected */}
      {selectedSquad && selectedSquad.beaconType === 'chat_room' && (
        <ChatRoomModal
          room={selectedSquad}
          isOpen={true}
          onClose={() => onSelectSquad(null)}
          onDeleteRoom={onDeleteChatRoom}
          onOpenSocialProfile={onOpenSocialProfile}
          onOpenAuthModal={onOpenAuthModal}
        />
      )}

      {/* Live Squadron Airship Billboard Modal */}
      <AirshipBillboardModal
        isOpen={showAirshipModal}
        onClose={() => setShowAirshipModal(false)}
        billboardId="radar-tijuana"
        billboardName="Tijuana Skyport Radar Airship"
        activeBillboard={activeBillboard}
        onBillboardUpdated={(data) => setActiveBillboard(data)}
      />

      {/* Tactical Floating Toast Notification */}
      {friendToast && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-[#031306]/95 border-2 border-lime-400 text-lime-200 text-xs font-sketch shadow-[0_0_30px_rgba(163,230,53,0.4)] flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-lime-400" />
          <span>{friendToast}</span>
        </div>
      )}
    </div>
  );
}
