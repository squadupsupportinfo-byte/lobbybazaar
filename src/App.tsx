import React, { useState, useEffect, useRef } from 'react';
import { SplashTitle } from './components/SplashTitle';
import { TopNav } from './components/TopNav';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GamerMap } from './components/GamerMap';
import { CreateSquadModal } from './components/CreateSquadModal';
import { AuthModal } from './components/AuthModal';
import { EditProfileModal } from './components/EditProfileModal';
import { GamerSocialProfileModal, SocialProfileTarget } from './components/GamerSocialProfileModal';
import { DirectMessagesModal, RecipientInfo } from './components/DirectMessagesModal';
import { FriendRequestsModal } from './components/FriendRequestsModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { SellTradeBuyModal } from './components/SellTradeBuyModal';
import { TermsModal } from './components/TermsModal';
import { SupportReportModal } from './components/SupportReportModal';
import { AuthProvider, useAuth, GamerProfile } from './context/AuthContext';
import { LocationProvider, useLocation } from './context/LocationContext';
import { SquadBeacon, FriendRequest, FriendRelation } from './types';
import { db } from './lib/firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getZipCoordinatesSync } from './utils/zipLookup';
import { isEventExpired, filterActiveEvents } from './utils/eventExpiration';
import {
  getSavedLocalChatRooms,
  saveLocalChatRoom,
  deleteLocalChatRoom,
} from './utils/chatRoomService';
import {
  subscribeIncomingFriendRequests,
  subscribeUserConversations,
  subscribeUserFriends,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from './utils/socialService';
import { playSquadJoinSound, playMessagePopSound, playSketchClick } from './utils/audio';
import { saveAirshipBillboard, AirshipBillboardData, cleanExpiredBillboards } from './utils/airshipFlight';
import { Check, X, Bell, MessageSquare, Users, Sparkles } from 'lucide-react';

function getSavedLocalStores(): SquadBeacon[] {
  try {
    const raw = localStorage.getItem('squadup_deployed_stores');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalStore(store: SquadBeacon) {
  try {
    const existing = getSavedLocalStores();
    const updated = [store, ...existing.filter((s) => s.id !== store.id)];
    localStorage.setItem('squadup_deployed_stores', JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save store to localStorage:', err);
  }
}

function deleteLocalStore(storeId: string) {
  try {
    const existing = getSavedLocalStores();
    const updated = existing.filter((s) => s.id !== storeId);
    localStorage.setItem('squadup_deployed_stores', JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not delete store from localStorage:', err);
  }
}

function getSavedLocalEvents(): SquadBeacon[] {
  try {
    const raw = localStorage.getItem('squadup_deployed_events');
    if (!raw) return [];
    const list: SquadBeacon[] = JSON.parse(raw);
    const now = Date.now();
    // Only keep real events created by the user and strip out expired ones automatically
    const valid = filterActiveEvents(
      list.filter((e) => !e.id.startsWith('event-grand-') && e.id !== 'event-1' && e.id !== 'event-2'),
      now
    );
    if (valid.length !== list.length) {
      localStorage.setItem('squadup_deployed_events', JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

function saveLocalEvent(event: SquadBeacon) {
  try {
    const existing = getSavedLocalEvents();
    const updated = [event, ...existing.filter((e) => e.id !== event.id)];
    localStorage.setItem('squadup_deployed_events', JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save event to localStorage:', err);
  }
}

function SquadUpApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<'welcome' | 'map'>('map');
  // Real squads, stores, events, chat rooms and players only - NO fake mock profiles
  const [squads, setSquads] = useState<SquadBeacon[]>(() => [
    ...getSavedLocalStores(),
    ...getSavedLocalEvents(),
    ...getSavedLocalChatRooms(),
  ]);
  const [selectedSquad, setSelectedSquad] = useState<SquadBeacon | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'signin'>('signup');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSellTradeModalOpen, setIsSellTradeModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<SquadBeacon | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Social Profile & Direct Messaging State
  const [isSocialProfileOpen, setIsSocialProfileOpen] = useState(false);
  const [socialProfileTarget, setSocialProfileTarget] = useState<SocialProfileTarget | null>(null);
  const [isDirectMessagesOpen, setIsDirectMessagesOpen] = useState(false);
  const [directMessagesRecipient, setDirectMessagesRecipient] = useState<RecipientInfo | null>(null);
  const [activePhotoLightbox, setActivePhotoLightbox] = useState<{ url: string; caption?: string } | null>(null);

  // Friend Requests & Real-Time Notification Alerts State
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequest[]>([]);
  const [userFriends, setUserFriends] = useState<FriendRelation[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [isFriendRequestsModalOpen, setIsFriendRequestsModalOpen] = useState(false);
  const [appNotification, setAppNotification] = useState<{
    id: string;
    type: 'friend_request' | 'message';
    title: string;
    message: string;
    photoUrl?: string;
    tag?: string;
    data?: any;
  } | null>(null);
  const [billboardPaymentToast, setBillboardPaymentToast] = useState<string | null>(null);
  const [storeUnlockToast, setStoreUnlockToast] = useState<string | null>(null);

  const { user, gamerProfile, updateGamerProfile } = useAuth();
  const { coords, setManualLocation, requestLocation } = useLocation();

  // Track previous request IDs and conversation message timestamps for real-time notification alerts
  const prevReqIdsRef = useRef<Set<string>>(new Set());
  const initialReqLoadRef = useRef(true);
  const prevConvMapRef = useRef<Map<string, { lastMessageAt: string; unread: number }>>(new Map());
  const initialConvLoadRef = useRef(true);

  // Auto-dismiss in-app notification after 7 seconds
  useEffect(() => {
    if (!appNotification) return;
    const timer = setTimeout(() => {
      setAppNotification(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [appNotification]);

  // Request browser notification permission once gracefully upon sign in
  useEffect(() => {
    if (user && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [user]);

  // Real-time subscriptions for incoming friend requests, mutual friends, and direct message notifications
  useEffect(() => {
    if (!user) {
      setIncomingFriendRequests([]);
      setUserFriends([]);
      setUnreadMessagesCount(0);
      prevReqIdsRef.current = new Set();
      prevConvMapRef.current = new Map();
      initialReqLoadRef.current = true;
      initialConvLoadRef.current = true;
      return;
    }

    // 1. Friend Requests subscription
    const unsubIn = subscribeIncomingFriendRequests(user.uid, (requests) => {
      setIncomingFriendRequests(requests);

      const currentIds = new Set(requests.map((r) => r.id));
      if (!initialReqLoadRef.current) {
        // Detect new incoming friend request
        const newReq = requests.find((r) => !prevReqIdsRef.current.has(r.id));
        if (newReq) {
          playSquadJoinSound();
          setAppNotification({
            id: `freq_${newReq.id}_${Date.now()}`,
            type: 'friend_request',
            title: `Friend Request from ${newReq.senderGamerTag}`,
            message: `${newReq.senderGamerTag} sent you a friend request to squad up!`,
            photoUrl: newReq.senderPhotoUrl,
            tag: newReq.senderGamerTag,
            data: newReq,
          });

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`Friend Request from ${newReq.senderGamerTag}`, {
                body: `${newReq.senderGamerTag} sent you a friend request to squad up!`,
                icon: newReq.senderPhotoUrl || '/favicon.ico',
              });
            } catch {}
          }
        }
      } else {
        initialReqLoadRef.current = false;
      }
      prevReqIdsRef.current = currentIds;
    });

    // 2. Mutual Friends subscription
    const unsubFriends = subscribeUserFriends(user.uid, (friends) => {
      setUserFriends(friends);
    });

    // 3. User Conversations subscription (unread badge & instant message alerts)
    const unsubConvs = subscribeUserConversations(user.uid, (convs) => {
      let totalUnread = 0;
      convs.forEach((c) => {
        if (c.unreadCounts && c.unreadCounts[user.uid]) {
          totalUnread += c.unreadCounts[user.uid];
        }
      });
      setUnreadMessagesCount(totalUnread);

      if (!initialConvLoadRef.current) {
        // Detect new incoming message from someone else
        for (const c of convs) {
          const otherId = c.participantIds.find((id) => id !== user.uid) || '';
          const otherTag = c.participantTags?.[otherId] || 'Gamer';
          const otherPhoto = c.participantPhotos?.[otherId];
          const prev = prevConvMapRef.current.get(c.id);

          if (
            c.lastSenderId &&
            c.lastSenderId !== user.uid &&
            c.lastMessageAt &&
            (!prev || prev.lastMessageAt !== c.lastMessageAt)
          ) {
            // Only trigger alert if user isn't currently active in that conversation
            if (!isDirectMessagesOpen || directMessagesRecipient?.uid !== otherId) {
              playMessagePopSound();
              setAppNotification({
                id: `msg_${c.id}_${c.lastMessageAt}`,
                type: 'message',
                title: `New Message from ${otherTag}`,
                message: c.lastMessage || 'Sent you a direct message',
                photoUrl: otherPhoto,
                tag: otherTag,
                data: {
                  uid: otherId,
                  gamerTag: otherTag,
                  photoUrl: otherPhoto,
                },
              });

              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(`Message from ${otherTag}`, {
                    body: c.lastMessage || 'Sent you a message',
                    icon: otherPhoto || '/favicon.ico',
                  });
                } catch {}
              }
            }
          }
        }
      } else {
        initialConvLoadRef.current = false;
      }

      const newConvMap = new Map<string, { lastMessageAt: string; unread: number }>();
      convs.forEach((c) => {
        newConvMap.set(c.id, {
          lastMessageAt: c.lastMessageAt || '',
          unread: c.unreadCounts?.[user.uid] || 0,
        });
      });
      prevConvMapRef.current = newConvMap;
    });

    return () => {
      unsubIn();
      unsubFriends();
      unsubConvs();
    };
  }, [user, isDirectMessagesOpen, directMessagesRecipient]);

  // Clean any expired 5-day billboards on app launch so new users can promote immediately
  useEffect(() => {
    cleanExpiredBillboards().catch((err) => {
      console.warn('Billboard cleanup on mount:', err);
    });
  }, []);

  // Handle return from official Stripe Checkout window (Billboard $10.00, Store Building $5.00, Character Unlock $3.00)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = urlParams.get('stripe_checkout_success');
    const storeUnlockSuccess = urlParams.get('stripe_store_unlock_success');
    const unlockedBuildingType = urlParams.get('building_type') || 'medium_store';
    const characterUnlockSuccess = urlParams.get('stripe_character_unlock_success');
    const unlockedCharacterId = urlParams.get('character_id') || 'moon_demon_noble';
    const sessionId = urlParams.get('session_id');
    const billboardId = urlParams.get('billboard_id');

    // 0. Character Unlock ($3.00) -> Permanently unlocks new 3D character avatar
    if (characterUnlockSuccess === 'true' && sessionId) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      fetch('/api/verify-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.verified && data.status === 'paid') {
            playSquadJoinSound();
            const charId = data.metadata?.characterId || unlockedCharacterId;
            localStorage.setItem(`squadup_character_unlocked_${charId}`, 'true');

            // Broadcast real-time unlock event across all components
            window.dispatchEvent(
              new CustomEvent('squadup_character_unlocked', { detail: { characterId: charId } })
            );

            // Update in-memory gamerProfile immediately
            if (updateGamerProfile) {
              const currentUnlocked = gamerProfile?.unlockedCharacters || [];
              const nextUnlocked = Array.from(new Set([...currentUnlocked, charId]));
              updateGamerProfile({
                unlockedCharacters: nextUnlocked,
                characterAvatar: charId as any,
              }).catch((e) => console.warn('Character unlock profile sync note:', e));
            }

            // Sync with Firestore
            if (user && db) {
              try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                const currentUnlocked = (userSnap.exists() && userSnap.data()?.unlockedCharacters) || [];
                const nextUnlocked = Array.from(new Set([...currentUnlocked, charId]));
                await setDoc(
                  userRef,
                  {
                    unlockedCharacters: nextUnlocked,
                    characterAvatar: charId,
                  },
                  { merge: true }
                );
              } catch (err) {
                console.warn('Character unlock Firestore write note:', err);
              }
            }

            const charName =
              charId === 'moon_demon_noble'
                ? 'Moon Demon Noble'
                : charId === 'demon_dog_warrior'
                ? 'Demon Dog Warrior'
                : charId === 'celestial_moon_guardian'
                ? 'Celestial Moon Guardian'
                : charId === 'sacred_shrine_priestess'
                ? 'Sacred Shrine Priestess'
                : 'Premium 3D Character';

            setStoreUnlockToast(
              `🎉 Payment of $3.00 confirmed! ${charName} permanently unlocked & equipped! Enjoy your new 3D avatar.`
            );
            setTimeout(() => setStoreUnlockToast(null), 10000);
            setIsEditProfileOpen(true);
          }
        })
        .catch((err) => {
          console.warn('Character unlock checkout verification notice:', err);
        });
      return;
    }

    // 1. Store Building Unlock ($5.00) -> Grants access to upgraded store building + 5 extra item spaces (15 total)
    if (storeUnlockSuccess === 'true' && sessionId) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      fetch('/api/verify-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.verified && data.status === 'paid') {
            playSquadJoinSound();
            localStorage.setItem(`squadup_unlocked_${unlockedBuildingType}`, 'true');
            if (user && db) {
              try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                const currentUnlocked = (userSnap.exists() && userSnap.data()?.unlockedBuildings) || [];
                const nextUnlocked = Array.from(new Set([...currentUnlocked, unlockedBuildingType]));
                await setDoc(
                  userRef,
                  {
                    unlockedBuildings: nextUnlocked,
                  },
                  { merge: true }
                );
              } catch (err) {
                console.warn('Store unlock profile sync note:', err);
              }
            }

            const buildingName =
              unlockedBuildingType === 'sketch_store'
                ? 'Sketch Corner Store'
                : unlockedBuildingType === 'cyber_tower'
                ? '3-Floor Cyber Megastore'
                : 'Medium Format Store';

            setStoreUnlockToast(
              `Payment of $5.00 confirmed! ${buildingName} unlocked with 5 extra spaces (15 items total available to sell or trade)!`
            );
            setTimeout(() => setStoreUnlockToast(null), 10000);
            setIsSellTradeModalOpen(true);
          }
        })
        .catch((err) => {
          console.warn('Store unlock checkout verification notice:', err);
        });
      return;
    }

    // 2. Billboard Promotion ($10.00)
    if (checkoutSuccess === 'true' && sessionId) {
      // Clean query parameters from URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Verify session with server
      fetch('/api/verify-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.verified && data.status === 'paid') {
            playSquadJoinSound();
            const targetId = billboardId || data.metadata?.billboardId || 'current';
            const bName = data.metadata?.billboardName || 'Selected Billboard';

            // Retrieve draft payload from sessionStorage if present
            let draftData: any = null;
            try {
              const rawDraft = sessionStorage.getItem(`squadup_pending_billboard_${targetId}`);
              if (rawDraft) {
                draftData = JSON.parse(rawDraft);
                sessionStorage.removeItem(`squadup_pending_billboard_${targetId}`);
              }
            } catch {}

            const now = Date.now();
            const expireTimestamp = now + 5 * 24 * 60 * 60 * 1000;

            const payload: AirshipBillboardData = {
              billboardId: targetId,
              billboardName: bName,
              imageUrl: draftData?.photoUrl || '',
              businessName: data.metadata?.businessName || draftData?.businessName || 'Verified Sponsor',
              businessLink: data.metadata?.businessLink || draftData?.businessLink || undefined,
              tagline: data.metadata?.tagline || draftData?.tagline || undefined,
              uploadedAt: now,
              expireTimestamp,
              durationDays: 5,
              uploaderName: gamerProfile?.gamerTag || user?.displayName || data.metadata?.businessName,
              uploaderUid: user?.uid,
              paymentConfirmed: true,
              paymentId: sessionId,
              amountCents: 1000,
              currency: 'usd',
            };

            if (payload.imageUrl) {
              await saveAirshipBillboard(payload, targetId);
            }

            setBillboardPaymentToast(
              `Payment of $10.00 confirmed! Your 5-day promotion is now LIVE on ${bName}!`
            );
            setTimeout(() => setBillboardPaymentToast(null), 10000);
          }
        })
        .catch((err) => {
          console.warn('Checkout return verification notice:', err);
        });
    }
  }, [user, gamerProfile]);

  const handleAcceptFriendRequest = async (request: FriendRequest) => {
    if (!user) {
      handleOpenAuth('signin');
      return;
    }
    playSquadJoinSound();
    try {
      await acceptFriendRequest({
        requestId: request.id,
        senderId: request.senderId,
        senderGamerTag: request.senderGamerTag,
        senderPhotoUrl: request.senderPhotoUrl,
        senderAvatar: request.senderAvatar,
        receiverId: user.uid,
        receiverGamerTag: gamerProfile?.gamerTag || user.displayName || 'You',
        receiverPhotoUrl: gamerProfile?.photoUrl || user.photoURL || '',
        receiverAvatar: gamerProfile?.characterAvatar || 'classic',
      });
      setAppNotification({
        id: `accepted_${request.id}`,
        type: 'friend_request',
        title: `Friend Added! ✓`,
        message: `You and ${request.senderGamerTag} are now friends! You can message each other directly.`,
        photoUrl: request.senderPhotoUrl,
        tag: request.senderGamerTag,
      });
    } catch (err: any) {
      console.warn('Accept friend request error:', err);
    }
  };

  const handleDeclineFriendRequest = async (request: FriendRequest) => {
    if (!user) {
      handleOpenAuth('signin');
      return;
    }
    try {
      await declineFriendRequest(request.id, user.uid);
      if (appNotification?.data?.id === request.id) {
        setAppNotification(null);
      }
    } catch (err: any) {
      console.warn('Decline friend request error:', err);
    }
  };

  const handleRemoveFriend = async (targetUserId: string, targetTag: string) => {
    if (!user) {
      handleOpenAuth('signin');
      return;
    }
    try {
      await removeFriend(user.uid, targetUserId);
    } catch (err: any) {
      console.warn('Remove friend error:', err);
    }
  };

  const handleOpenSocialProfile = (target: SocialProfileTarget) => {
    setSocialProfileTarget(target);
    setIsSocialProfileOpen(true);
  };

  const handleOpenDirectMessages = (recipient?: RecipientInfo | null) => {
    if (!user) {
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }
    setDirectMessagesRecipient(recipient || null);
    setIsDirectMessagesOpen(true);
  };

  const [termsAgreed, setTermsAgreed] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('squadup_terms_18plus_agreed') === 'true' &&
        localStorage.getItem('squadup_terms_agreed') === 'true'
      );
    } catch {
      return false;
    }
  });
  // Must be false initially so user sees the loading page with title first, then terms, then map!
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);

  // Critical: When user logs out (user transitions from truthy to null),
  // immediately close all open modals (profile, auth, store, DMs) so NO email, password, or account data lingers on screen!
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user) {
      setIsAuthModalOpen(false);
      setIsEditProfileOpen(false);
      setIsSellTradeModalOpen(false);
      setIsSocialProfileOpen(false);
      setIsDirectMessagesOpen(false);
      setIsFriendRequestsModalOpen(false);
      setSelectedSquad(null);
      setEditingStore(null);
      const deletedUid = prevUserRef.current?.uid;
      try {
        localStorage.removeItem('squadup_saved_profile');
        localStorage.removeItem('squadup_user_email');
        localStorage.removeItem('squadup_deployed_stores');
        sessionStorage.clear();
      } catch {
        // ignore
      }
      // Immediately purge any stores or beacons owned by the deleted/logged-out user from in-memory state
      if (deletedUid) {
        setSquads((prev) =>
          prev.filter((s) => s.ownerId !== deletedUid && s.id !== `store-${deletedUid}`)
        );
      }
    }
    prevUserRef.current = user;
  }, [user]);

  // 1 store per user: find current user's existing store
  const userStore = user
    ? squads.find((s) => (s.beaconType === 'store' || !!s.storeData) && s.ownerId === user.uid) ||
      getSavedLocalStores().find((s) => s.ownerId === user.uid) ||
      null
    : null;

  const handleOpenEditStore = (storeToEdit?: SquadBeacon) => {
    const myStore =
      storeToEdit ||
      userStore ||
      (user ? squads.find((s) => (s.beaconType === 'store' || !!s.storeData) && s.ownerId === user.uid) : null) ||
      null;

    setEditingStore(myStore);
    setIsSellTradeModalOpen(true);
  };

  const handleOpenSellTradeModal = () => {
    // 1 store per user rule: if user already has a store, open it in edit mode
    setEditingStore(userStore);
    setIsSellTradeModalOpen(true);
  };

  // Listen to all real squads AND all real live users from Firestore
  useEffect(() => {
    let firestoreSquads: SquadBeacon[] = [];
    let firestoreUsers: SquadBeacon[] = [];

    const syncAllBeacons = () => {
      const activeUid = user?.uid || gamerProfile?.uid;
      const activeTag = (gamerProfile?.gamerTag || user?.displayName || '').trim().toLowerCase();

      // Exclude current user's remote mirror so their personal interactive pin is unique
      const remoteUsers = firestoreUsers.filter((u) => {
        if (activeUid && (u.ownerId === activeUid || u.id === `user_${activeUid}`)) return false;
        if (activeTag && u.name && u.name.trim().toLowerCase() === activeTag) return false;
        return true;
      });

      // Merge firestoreSquads with locally cached stores, events, and chat rooms
      const localStores = getSavedLocalStores();
      const localEvents = filterActiveEvents(getSavedLocalEvents());
      const localChatRooms = getSavedLocalChatRooms();
      const combinedSquadsMap = new Map<string, SquadBeacon>();

      // Add local stores, active events, and chat rooms first
      localStores.forEach((st) => combinedSquadsMap.set(st.id, st));
      localEvents.forEach((ev) => combinedSquadsMap.set(ev.id, ev));
      localChatRooms.forEach((cr) => combinedSquadsMap.set(cr.id, cr));
      // Add firestore squads (authoritative)
      firestoreSquads.forEach((sq) => {
        if (!isEventExpired(sq)) {
          // If this is a personal player/character pin belonging to current user (not a store/event/chatroom), don't mirror it as an extra pin
          const isBuilding =
            sq.beaconType === 'store' ||
            sq.beaconType === 'other_event' ||
            sq.beaconType === 'chat_room' ||
            sq.buildingType === 'grand_event';
          if (!isBuilding) {
            if (activeUid && (sq.ownerId === activeUid || sq.id === `user_${activeUid}`)) return;
            if (activeTag && sq.name && sq.name.trim().toLowerCase() === activeTag) return;
          }
          combinedSquadsMap.set(sq.id, sq);
        }
      });

      setSquads([...remoteUsers, ...filterActiveEvents(Array.from(combinedSquadsMap.values()))]);
    };

    // 1. Listen to squads collection
    const unsubSquads = onSnapshot(
      collection(db, 'squads'),
      (snapshot) => {
        const list: SquadBeacon[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as SquadBeacon;
          if (data && data.name) {
            // Auto-delete expired events from Firestore automatically
            if (isEventExpired(data)) {
              deleteDoc(doc(db, 'squads', docSnap.id)).catch(() => {});
              return;
            }
            const zipMatch = getZipCoordinatesSync(data.zipCode);
            const lat = data.lat || zipMatch?.lat;
            const lng = data.lng || zipMatch?.lng;
            const maxMembers = data.beaconType === 'chat_room' ? 5 : (data.maxMembers || 4);
            list.push({ ...data, id: docSnap.id, lat, lng, maxMembers });
          }
        });
        firestoreSquads = list;
        syncAllBeacons();
      },
      (err) => {
        console.warn('Real squads sync notice:', err);
      }
    );

    // 2. Listen to all registered gamer accounts with location/zipcode in users collection
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: SquadBeacon[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.gamerTag && (data.coords || data.zipCode)) {
            const zipMatch = getZipCoordinatesSync(data.zipCode);
            const lat = data.coords?.lat || zipMatch?.lat || 32.7139;
            const lng = data.coords?.lng || zipMatch?.lng || -117.1219;
            list.push({
              id: `user_${docSnap.id}`,
              ownerId: docSnap.id,
              name: data.gamerTag,
              game: data.favoriteGame || 'Valorant',
              genre: 'Action',
              rank: data.rank || 'Unranked',
              currentMembers: 1,
              maxMembers: 1,
              sector: data.locationName || 'Global Sector',
              locationName: data.locationName || 'Global Sector',
              zipCode: data.zipCode,
              lat,
              lng,
              x: 50 + (((lng * 100) % 50) - 25),
              y: 50 + (((lat * 100) % 50) - 25),
              micRequired: false,
              playstyle: 'Casual',
              description: data.bio || `Live Gamer deployed at ${data.locationName || 'Global Sector'}!`,
              lookingFor: ['Teammates', 'Duo', 'Squad'],
              pingMs: 18,
              members: [
                {
                  id: docSnap.id,
                  name: data.gamerTag,
                  avatarSeed: data.gamerTag,
                  role: data.role || data.favoriteConsole || 'Gamer',
                  rank: data.rank,
                  isLeader: true,
                  photoUrl: data.photoUrl,
                  bio: data.bio,
                  likedGames: data.likedGames,
                  likedGenres: data.likedGenres,
                  socialLinks: data.socialLinks,
                  photos: data.photos,
                  playSchedule: data.playSchedule,
                },
              ],
              accentColor: 'lime',
              photoUrl: data.photoUrl,
              bio: data.bio,
              likedGenres: data.likedGenres,
              likedGames: data.likedGames,
              socialLinks: data.socialLinks,
              photos: data.photos,
              playSchedule: data.playSchedule,
              console: data.favoriteConsole || data.role,
              characterAvatar: data.characterAvatar || 'waving',
            });
          }
        });
        firestoreUsers = list;
        syncAllBeacons();
      },
      (err) => {
        console.warn('Real users sync notice:', err);
      }
    );

    return () => {
      unsubSquads();
      unsubUsers();
    };
  }, [user?.uid, gamerProfile?.uid, gamerProfile?.gamerTag]);

  // Periodic automatic purge of expired events from the map, local state, and Firestore
  useEffect(() => {
    const purgeExpiredEvents = () => {
      const now = Date.now();
      setSquads((prev) => {
        let hasExpired = false;
        for (const s of prev) {
          if (isEventExpired(s, now)) {
            hasExpired = true;
            deleteDoc(doc(db, 'squads', s.id)).catch(() => {});
          }
        }
        return hasExpired ? filterActiveEvents(prev, now) : prev;
      });
      // Purge local storage cache
      getSavedLocalEvents();
    };

    purgeExpiredEvents();
    const intervalId = setInterval(purgeExpiredEvents, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Auto-deploy user to their saved location on map
  useEffect(() => {
    if (gamerProfile?.coords) {
      if (!coords || coords.lat !== gamerProfile.coords.lat || coords.lng !== gamerProfile.coords.lng) {
        setManualLocation(
          gamerProfile.locationName || 'Global Sector',
          gamerProfile.coords.lat,
          gamerProfile.coords.lng
        );
      }
    }
  }, [gamerProfile?.coords, gamerProfile?.locationName]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Ask user for phone access permission right after loading page finishes loading
    if (!coords) {
      requestLocation().catch(() => {});
    }
    setCurrentView('map');
  };

  // Directly ask user for phone location access permission right after loading finishes
  useEffect(() => {
    if (!showSplash) {
      if (!coords) {
        requestLocation().catch(() => {});
      }
    }
  }, [showSplash, coords, requestLocation]);

  const handleAcceptTerms = () => {
    try {
      localStorage.setItem('squadup_terms_agreed', 'true');
      localStorage.setItem('squadup_terms_18plus_agreed', 'true');
      localStorage.setItem('squadup_terms_agreed_date', new Date().toISOString());
    } catch (err) {
      console.warn('Could not save terms agreement:', err);
    }
    setTermsAgreed(true);
    setIsTermsModalOpen(false);
    if (!coords) {
      requestLocation().catch(() => {});
    }
  };

  const handleReplaySplash = () => {
    setShowSplash(true);
  };

  const handleSearchMap = () => {
    setSelectedSquad(null);
    setCurrentView('map');
  };

  const handleOpenAuth = (mode: 'signup' | 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleCreateSquad = async (newSquad: SquadBeacon) => {
    // Save to Firestore if user is authenticated or persist locally
    try {
      if (user) {
        await setDoc(doc(db, 'squads', newSquad.id), {
          ...newSquad,
          ownerId: user.uid,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Could not persist squad to Firestore:', err);
    }
    setSquads((prev) => [newSquad, ...prev]);
    setSelectedSquad(newSquad);
    setCurrentView('map');
  };

  const handleDeployStore = async (storeBeacon: SquadBeacon) => {
    const ownerId = user?.uid || storeBeacon.ownerId;

    // STRICT 1 STORE PER USER ENFORCEMENT:
    // If the user already owns another store with a different ID, delete that previous store
    if (ownerId) {
      const existingStores = squads.filter(
        (s) => (s.beaconType === 'store' || !!s.storeData) && s.ownerId === ownerId && s.id !== storeBeacon.id
      );
      for (const oldStore of existingStores) {
        deleteLocalStore(oldStore.id);
        try {
          await deleteDoc(doc(db, 'squads', oldStore.id));
        } catch (err) {
          console.warn('Could not remove previous store from Firestore:', err);
        }
      }
    }

    // 1. Immediately cache in localStorage (filter out any other store owned by this user)
    try {
      const existing = getSavedLocalStores();
      const updated = [
        storeBeacon,
        ...existing.filter((s) => s.id !== storeBeacon.id && (!ownerId || s.ownerId !== ownerId)),
      ];
      localStorage.setItem('squadup_deployed_stores', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save store to localStorage:', err);
    }

    // 2. Persist to Firestore with sanitized payload (strips all undefined fields)
    try {
      const cleanPayload = JSON.parse(
        JSON.stringify(
          {
            ...storeBeacon,
            ownerId,
            createdAt: new Date().toISOString(),
          },
          (_key, val) => (val === undefined ? null : val)
        )
      );

      if (user) {
        await setDoc(doc(db, 'squads', storeBeacon.id), cleanPayload);
        console.log('Successfully deployed and persisted store to Firestore:', storeBeacon.id);
      }
    } catch (err) {
      console.warn('Could not persist store to Firestore (saved locally):', err);
    }

    // Keep only this 1 store for this user in in-memory state
    setSquads((prev) => [
      storeBeacon,
      ...prev.filter(
        (s) => s.id !== storeBeacon.id && (!ownerId || (s.beaconType !== 'store' && !s.storeData) || s.ownerId !== ownerId)
      ),
    ]);
    setSelectedSquad(storeBeacon);
    setCurrentView('map');
  };

  const handleDeleteStore = async (storeId: string) => {
    deleteLocalStore(storeId);
    try {
      await deleteDoc(doc(db, 'squads', storeId));
    } catch (err) {
      console.warn('Could not delete store from Firestore:', err);
    }
    setSquads((prev) => prev.filter((s) => s.id !== storeId));
    if (selectedSquad?.id === storeId) {
      setSelectedSquad(null);
    }
    if (editingStore?.id === storeId) {
      setEditingStore(null);
    }
    setIsSellTradeModalOpen(false);
  };

  const handleEventCreated = async (eventBeacon: SquadBeacon) => {
    saveLocalEvent(eventBeacon);

    try {
      const cleanPayload = JSON.parse(
        JSON.stringify(
          {
            ...eventBeacon,
            createdAt: new Date().toISOString(),
          },
          (_key, val) => (val === undefined ? null : val)
        )
      );

      await setDoc(doc(db, 'squads', eventBeacon.id), cleanPayload);
      console.log('Successfully deployed and persisted event to Firestore:', eventBeacon.id);
    } catch (err) {
      console.warn('Could not persist event to Firestore (saved locally):', err);
    }

    setSquads((prev) => [eventBeacon, ...prev.filter((s) => s.id !== eventBeacon.id)]);
    setSelectedSquad(null);
    setCurrentView('map');
  };

  const handleDeployChatRoom = async (roomBeacon: SquadBeacon) => {
    // Enforce 1 chat room per user account limit ("Users with accounts can only create one chat room, not two")
    if (user) {
      const oldRooms = squads.filter(
        (s) =>
          s.beaconType === 'chat_room' &&
          (s.ownerId === user.uid || s.chatRoomData?.hostId === user.uid) &&
          s.id !== roomBeacon.id
      );
      for (const oldRoom of oldRooms) {
        deleteLocalChatRoom(oldRoom.id);
        try {
          await deleteDoc(doc(db, 'squads', oldRoom.id));
        } catch {}
      }
    }

    saveLocalChatRoom(roomBeacon);

    try {
      const cleanPayload = JSON.parse(
        JSON.stringify(
          {
            ...roomBeacon,
            ownerId: user?.uid || roomBeacon.ownerId,
            createdAt: new Date().toISOString(),
          },
          (_key, val) => (val === undefined ? null : val)
        )
      );

      if (user) {
        await setDoc(doc(db, 'squads', roomBeacon.id), cleanPayload);
        console.log('Successfully deployed and persisted chat room to Firestore:', roomBeacon.id);
      }
    } catch (err) {
      console.warn('Could not persist chat room to Firestore (saved locally):', err);
    }

    setSquads((prev) => [
      roomBeacon,
      ...prev.filter(
        (s) =>
          !(
            s.beaconType === 'chat_room' &&
            user &&
            (s.ownerId === user.uid || s.chatRoomData?.hostId === user.uid) &&
            s.id !== roomBeacon.id
          ) && s.id !== roomBeacon.id
      ),
    ]);
    setSelectedSquad(roomBeacon);
    setCurrentView('map');
  };

  const handleDeleteChatRoom = async (roomId: string) => {
    deleteLocalChatRoom(roomId);
    try {
      await deleteDoc(doc(db, 'squads', roomId));
    } catch (err) {
      console.warn('Could not delete chat room from Firestore:', err);
    }
    setSquads((prev) => prev.filter((s) => s.id !== roomId));
    if (selectedSquad?.id === roomId) {
      setSelectedSquad(null);
    }
  };

  // Periodic automatic purge of expired events (runs every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setSquads((prev) => {
        let hasExpired = false;
        const valid = prev.filter((s) => {
          if (s.expiresAt && new Date(s.expiresAt).getTime() <= now) {
            hasExpired = true;
            deleteDoc(doc(db, 'squads', s.id)).catch(() => {});
            return false;
          }
          return true;
        });
        if (hasExpired) {
          getSavedLocalEvents();
          return valid;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleClearAllMarkers = () => {
    setSquads([]);
    setSelectedSquad(null);
  };

  const handleJoinSquadSuccess = (squadId: string, applicantName: string, applicantRole: string) => {
    setSquads((prev) =>
      prev.map((s) => {
        if (s.id === squadId) {
          const updatedMembers = [
            ...s.members,
            {
              id: `member-${Date.now()}`,
              name: applicantName,
              avatarSeed: applicantName,
              role: applicantRole,
              rank: s.rank,
            },
          ];
          const updatedSquad = {
            ...s,
            currentMembers: Math.min(s.currentMembers + 1, s.maxMembers),
            members: updatedMembers,
          };
          if (selectedSquad?.id === squadId) {
            setSelectedSquad(updatedSquad);
          }
          return updatedSquad;
        }
        return s;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#020703] text-slate-100 flex flex-col font-sans selection:bg-green-500/30 selection:text-green-200">
      {/* Page 1: Title that lasts 3 seconds then fades away */}
      {showSplash && <SplashTitle onComplete={handleSplashComplete} />}

      {/* Real-time In-App Notification Toast for Friend Requests and Direct Messages */}
      {appNotification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-20 right-3 sm:right-6 z-[120] max-w-sm sm:max-w-md w-full bg-[#020b05]/98 text-white border-2 border-lime-400 shadow-[0_0_35px_rgba(163,230,53,0.5)] rounded-2xl p-3.5 backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 select-none"
          style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        >
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              {appNotification.photoUrl ? (
                <img
                  src={appNotification.photoUrl}
                  alt={appNotification.tag || 'Avatar'}
                  className="w-11 h-11 rounded-full object-cover border-2 border-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-lime-950 border-2 border-lime-400 flex items-center justify-center font-display font-bold text-base text-lime-300">
                  {appNotification.type === 'friend_request' ? '👥' : '💬'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-lime-400 text-black text-[9px] font-bold flex items-center justify-center shadow">
                {appNotification.type === 'friend_request' ? '🤝' : '✉️'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold font-display text-lime-300 truncate">
                  {appNotification.title}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">Just now</span>
              </div>
              <p className="text-xs font-sketch text-slate-200 mt-0.5 line-clamp-2">
                {appNotification.message}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                {appNotification.type === 'friend_request' && appNotification.data && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleAcceptFriendRequest(appNotification.data);
                        setAppNotification(null);
                      }}
                      className="px-3 py-1 bg-lime-400 hover:bg-lime-300 text-black font-display font-bold text-xs rounded-lg shadow-[0_0_10px_rgba(163,230,53,0.5)] cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSketchClick();
                        setAppNotification(null);
                        setIsFriendRequestsModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-black/60 hover:bg-white/10 text-slate-200 hover:text-white border border-white/20 text-xs font-sketch rounded-lg transition-colors cursor-pointer"
                    >
                      View Requests
                    </button>
                  </>
                )}

                {appNotification.type === 'message' && appNotification.data && (
                  <button
                    type="button"
                    onClick={() => {
                      playSketchClick();
                      const recip = appNotification.data;
                      setAppNotification(null);
                      handleOpenDirectMessages(recip);
                    }}
                    className="px-3 py-1 bg-lime-400 hover:bg-lime-300 text-black font-display font-bold text-xs rounded-lg shadow-[0_0_10px_rgba(163,230,53,0.5)] cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply & Chat</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAppNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* Top Navigation Bar with strict 3-zone contract */}
      <TopNav
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'map') {
            setSelectedSquad(null);
          }
          setCurrentView(view);
        }}
        onCreateSquadClick={() => setIsCreateModalOpen(true)}
        onReplaySplash={handleReplaySplash}
        onOpenAuthModal={handleOpenAuth}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenSocialProfile={() => {
          if (gamerProfile) {
            handleOpenSocialProfile(gamerProfile);
          } else {
            setIsEditProfileOpen(true);
          }
        }}
        onOpenMessages={() => handleOpenDirectMessages(null)}
        onOpenFriendRequests={() => setIsFriendRequestsModalOpen(true)}
        unreadMessagesCount={unreadMessagesCount}
        incomingRequestsCount={incomingFriendRequests.length}
        onOpenSellTradeModal={handleOpenSellTradeModal}
        onOpenEditStore={handleOpenEditStore}
        onOpenSupport={() => setIsSupportModalOpen(true)}
      />

      {/* View routing: Page 2 (Welcome) or Page 3 (Map & Players) */}
      {currentView === 'welcome' ? (
        <WelcomeScreen
          onSearchMap={handleSearchMap}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
          onOpenSellTradeModal={handleOpenSellTradeModal}
          onOpenTerms={() => setIsTermsModalOpen(true)}
          onOpenSupport={() => setIsSupportModalOpen(true)}
        />
      ) : (
        <GamerMap
          squads={squads}
          selectedSquad={selectedSquad}
          onSelectSquad={setSelectedSquad}
          onBackToWelcome={() => setCurrentView('welcome')}
          onOpenCreateSquad={() => setIsCreateModalOpen(true)}
          onClearAllMarkers={handleClearAllMarkers}
          onJoinSquadSuccess={handleJoinSquadSuccess}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
          onOpenSocialProfile={handleOpenSocialProfile}
          onOpenDirectMessages={handleOpenDirectMessages}
          onOpenSellTradeModal={handleOpenSellTradeModal}
          onOpenEditStore={handleOpenEditStore}
          onDeleteStore={handleDeleteStore}
          onOpenAuthModal={handleOpenAuth}
          onEventCreated={handleEventCreated}
          onDeployChatRoom={handleDeployChatRoom}
          onDeleteChatRoom={handleDeleteChatRoom}
          termsAgreed={termsAgreed}
          onOpenTerms={() => setIsTermsModalOpen(true)}
          onOpenSupport={() => setIsSupportModalOpen(true)}
        />
      )}

      {/* Deploy Squad Beacon Modal */}
      <CreateSquadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateSquad}
      />

      {/* Sell or Trade Store Modal */}
      <SellTradeBuyModal
        isOpen={isSellTradeModalOpen}
        onClose={() => {
          setIsSellTradeModalOpen(false);
          setEditingStore(null);
        }}
        onDeployStore={handleDeployStore}
        onDeleteStore={handleDeleteStore}
        initialStore={editingStore}
        existingUserStore={userStore}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Sign Up / Create Account / Sign In Modal */}
      <AuthModal
        key={user ? `auth-${user.uid}` : 'auth-logged-out'}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
        onSignUpSuccess={() => {
          setIsEditProfileOpen(true);
        }}
      />

      {/* Tactical Gamer Dossier / Edit Profile Page */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        activeChatRooms={
          user
            ? squads.filter(
                (s) =>
                  s.beaconType === 'chat_room' &&
                  (s.ownerId === user.uid || s.chatRoomData?.hostId === user.uid)
              )
            : []
        }
        onCloseChatRoom={handleDeleteChatRoom}
        onUpdateChatRoom={(updatedRoom) => {
          setSquads((prev) => prev.map((s) => (s.id === updatedRoom.id ? updatedRoom : s)));
        }}
      />

      {/* Instagram-Style Gamer Social Profile (Followers, Following, Direct Comms) */}
      <GamerSocialProfileModal
        isOpen={isSocialProfileOpen}
        onClose={() => {
          setIsSocialProfileOpen(false);
          setSocialProfileTarget(null);
        }}
        targetUser={socialProfileTarget}
        onOpenDirectMessages={(recipient) => {
          setIsSocialProfileOpen(false);
          handleOpenDirectMessages(recipient);
        }}
        onOpenEditProfile={() => {
          setIsSocialProfileOpen(false);
          setIsEditProfileOpen(true);
        }}
        onOpenEditStore={handleOpenEditStore}
        onOpenAuthModal={handleOpenAuth}
        onSelectPhoto={(photo) => setActivePhotoLightbox(photo)}
        onNavigateToUser={(recip) => {
          setSocialProfileTarget(recip);
        }}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Direct Gamer Comms / Messages Modal */}
      <DirectMessagesModal
        isOpen={isDirectMessagesOpen}
        onClose={() => {
          setIsDirectMessagesOpen(false);
          setDirectMessagesRecipient(null);
        }}
        initialRecipient={directMessagesRecipient}
        friends={userFriends}
        onOpenSocialProfile={(recip) => {
          setIsDirectMessagesOpen(false);
          handleOpenSocialProfile(recip);
        }}
        onOpenAuthModal={handleOpenAuth}
      />

      {/* Squad Friend Requests & Friends Manager Modal */}
      <FriendRequestsModal
        isOpen={isFriendRequestsModalOpen}
        onClose={() => setIsFriendRequestsModalOpen(false)}
        incomingRequests={incomingFriendRequests}
        friends={userFriends}
        currentUserId={user?.uid}
        onAcceptRequest={handleAcceptFriendRequest}
        onDeclineRequest={handleDeclineFriendRequest}
        onRemoveFriend={handleRemoveFriend}
        onOpenDirectMessages={(recip) => {
          setIsFriendRequestsModalOpen(false);
          handleOpenDirectMessages(recip);
        }}
        onOpenAuthModal={handleOpenAuth}
      />

      {/* Global Photo Lightbox Zoom */}
      {activePhotoLightbox && (
        <PhotoLightbox
          photoUrl={activePhotoLightbox.url}
          caption={activePhotoLightbox.caption}
          onClose={() => setActivePhotoLightbox(null)}
        />
      )}

      {/* Terms of Service & Liability Disclaimer Modal */}
      <TermsModal
        isOpen={isTermsModalOpen && !showSplash}
        isMandatory={false}
        onAccept={handleAcceptTerms}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* Help, Questions & User Reports Modal */}
      <SupportReportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Billboard Stripe Payment Confirmation Toast */}
      {billboardPaymentToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[200] max-w-sm p-4 bg-[#030e17]/95 border-2 border-amber-400 rounded-2xl shadow-[0_0_35px_rgba(250,204,21,0.6)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono-num font-bold text-amber-300 uppercase tracking-wider">
                STRIPE PAYMENT CONFIRMED · $10.00
              </div>
              <p className="text-xs font-sketch text-white mt-0.5 leading-relaxed">
                {billboardPaymentToast}
              </p>
            </div>
            <button
              onClick={() => setBillboardPaymentToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Store Building Unlock Stripe Payment Confirmation Toast */}
      {storeUnlockToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[200] max-w-sm p-4 bg-[#020d06]/95 border-2 border-emerald-400 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.6)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono-num font-bold text-emerald-300 uppercase tracking-wider">
                STRIPE PAYMENT CONFIRMED · $5.00
              </div>
              <p className="text-xs font-sketch text-white mt-0.5 leading-relaxed">
                {storeUnlockToast}
              </p>
            </div>
            <button
              onClick={() => setStoreUnlockToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <SquadUpApp />
      </LocationProvider>
    </AuthProvider>
  );
}
