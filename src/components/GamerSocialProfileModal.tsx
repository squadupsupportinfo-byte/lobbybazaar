import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  MessageSquare,
  Users,
  Heart,
  Grid,
  Calendar,
  Shield,
  Gamepad2,
  Share2,
  Clock,
  Sparkles,
  ExternalLink,
  Edit3,
  Camera,
  Check,
  Store,
  Send,
  CheckCircle,
  UserX,
} from 'lucide-react';
import { useAuth, GamerProfile } from '../context/AuthContext';
import { SquadBeacon, FollowRelation, FriendRequest, FriendRelation } from '../types';
import { RecipientInfo } from './DirectMessagesModal';
import { BlockyCharacter3D, CharacterVariant } from './BlockyCharacter3D';
import {
  subscribeFollowers,
  subscribeFollowing,
  toggleFollowUser,
  checkIsFollowing,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  subscribeIncomingFriendRequests,
  subscribeSentFriendRequests,
  subscribeUserFriends,
} from '../utils/socialService';
import { playSketchClick, playSquadJoinSound } from '../utils/audio';

export type SocialProfileTarget =
  | GamerProfile
  | SquadBeacon
  | RecipientInfo
  | {
      uid: string;
      gamerTag: string;
      photoUrl?: string;
      bio?: string;
      characterAvatar?: CharacterVariant;
      role?: string;
      rank?: string;
      favoriteGame?: string;
      likedGames?: string[];
      likedGenres?: string[];
      photos?: { id: string; url: string; caption?: string }[];
      socialLinks?: Record<string, string>;
      locationName?: string;
    };

interface GamerSocialProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: SocialProfileTarget | null;
  onOpenDirectMessages?: (recipient?: RecipientInfo | null) => void;
  onOpenEditProfile?: () => void;
  onOpenEditStore?: () => void;
  onOpenAuthModal?: (mode: 'signup' | 'signin') => void;
  onSelectPhoto?: (photo: { url: string; caption?: string }) => void;
  onNavigateToUser?: (user: RecipientInfo) => void;
  unreadMessagesCount?: number;
}

export function GamerSocialProfileModal({
  isOpen,
  onClose,
  targetUser,
  onOpenDirectMessages,
  onOpenEditProfile,
  onOpenEditStore,
  onOpenAuthModal,
  onSelectPhoto,
  onNavigateToUser,
  unreadMessagesCount = 0,
}: GamerSocialProfileModalProps) {
  const { user, gamerProfile } = useAuth();

  const guestId = useMemo(() => {
    try {
      let gid = localStorage.getItem('squadup_guest_uid');
      if (!gid) {
        gid = `guest_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('squadup_guest_uid', gid);
      }
      return gid;
    } catch {
      return 'guest_user';
    }
  }, []);

  const activeUserId = user?.uid || guestId;
  const activeGamerTag = gamerProfile?.gamerTag || user?.displayName || 'You';

  const [activeTab, setActiveTab] = useState<'overview' | 'followers' | 'following'>('overview');
  const [followers, setFollowers] = useState<FollowRelation[]>([]);
  const [following, setFollowing] = useState<FollowRelation[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Real-time friend status
  const [userFriends, setUserFriends] = useState<FriendRelation[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequest[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequest[]>([]);
  const [isProcessingFriend, setIsProcessingFriend] = useState(false);

  // Subscribe to user friends & requests for active user
  useEffect(() => {
    if (!activeUserId) return;
    const unsubIn = subscribeIncomingFriendRequests(activeUserId, setIncomingFriendRequests);
    const unsubSent = subscribeSentFriendRequests(activeUserId, setSentFriendRequests);
    const unsubFr = subscribeUserFriends(activeUserId, setUserFriends);
    return () => {
      unsubIn();
      unsubSent();
      unsubFr();
    };
  }, [activeUserId]);

  // Derive target fields safely
  const targetUid =
    (targetUser as GamerProfile)?.uid ||
    (targetUser as SquadBeacon)?.ownerId ||
    (targetUser as RecipientInfo)?.uid ||
    '';

  const targetGamerTag =
    (targetUser as GamerProfile)?.gamerTag ||
    (targetUser as SquadBeacon)?.name ||
    (targetUser as RecipientInfo)?.gamerTag ||
    'Gamer';

  const targetPhotoUrl =
    (targetUser as GamerProfile)?.photoUrl ||
    (targetUser as SquadBeacon)?.photoUrl ||
    (targetUser as RecipientInfo)?.photoUrl ||
    '';

  const targetAvatar =
    ((targetUser as GamerProfile)?.characterAvatar as CharacterVariant) ||
    ((targetUser as SquadBeacon)?.characterAvatar as CharacterVariant) ||
    ((targetUser as RecipientInfo)?.avatar as CharacterVariant) ||
    'classic';

  const targetBio =
    (targetUser as GamerProfile)?.bio ||
    (targetUser as SquadBeacon)?.bio ||
    (targetUser as any)?.description ||
    'Tactical gamer on LobbyBazaar radar.';

  const targetRank =
    (targetUser as GamerProfile)?.rank ||
    (targetUser as SquadBeacon)?.rank ||
    'Competitive';

  const targetRole =
    (targetUser as GamerProfile)?.role ||
    'Flex Operative';

  const targetFavoriteGame =
    (targetUser as GamerProfile)?.favoriteGame ||
    (targetUser as SquadBeacon)?.game ||
    'Tactical Squad';

  const targetLikedGames =
    (targetUser as GamerProfile)?.likedGames ||
    (targetUser as SquadBeacon)?.likedGames ||
    [];

  const targetLikedGenres =
    (targetUser as GamerProfile)?.likedGenres ||
    (targetUser as SquadBeacon)?.likedGenres ||
    [];

  const targetPhotos =
    (targetUser as GamerProfile)?.photos ||
    (targetUser as SquadBeacon)?.photos ||
    [];

  const targetSocialLinks =
    (targetUser as GamerProfile)?.socialLinks ||
    (targetUser as SquadBeacon)?.socialLinks ||
    {};

  const isMe = user?.uid && targetUid === user.uid;

  const isTargetEvent = Boolean(
    targetUser &&
    (('beaconType' in targetUser && (targetUser.beaconType === 'other_event' || targetUser.buildingType === 'grand_event')) ||
      ('buildingType' in targetUser && targetUser.buildingType === 'grand_event') ||
      Boolean((targetUser as any)?.eventData) ||
      ('id' in targetUser && typeof targetUser.id === 'string' && targetUser.id.startsWith('event-')) ||
      ('uid' in targetUser && typeof targetUser.uid === 'string' && targetUser.uid.startsWith('event-')))
  );

  const isTargetStore = Boolean(
    targetUser &&
    ('beaconType' in targetUser && targetUser.beaconType === 'store')
  );

  // Real-time followers and following subscription
  const [targetFriends, setTargetFriends] = useState<FriendRelation[]>([]);

  useEffect(() => {
    if (!targetUid) return;

    const unsubFollowers = subscribeFollowers(targetUid, (list) => {
      setFollowers(list);
    });

    const unsubFollowing = subscribeFollowing(targetUid, (list) => {
      setFollowing(list);
    });

    const unsubTargetFriends = subscribeUserFriends(targetUid, (list) => {
      setTargetFriends(list);
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
      unsubTargetFriends();
    };
  }, [targetUid]);

  // Combine followers with mutual friends so users see both followers and friends
  const displayFollowers = useMemo(() => {
    const map = new Map<string, {
      id: string;
      uid: string;
      gamerTag: string;
      photoUrl?: string;
      avatar?: CharacterVariant;
      createdAt?: string;
      isFriend: boolean;
    }>();

    // 1. Add direct followers
    followers.forEach((f) => {
      const isFriend = targetFriends.some(
        (tf) => tf.user1Id === f.followerId || tf.user2Id === f.followerId
      );
      map.set(f.followerId, {
        id: f.id || `f_${f.followerId}`,
        uid: f.followerId,
        gamerTag: f.followerGamerTag || 'Gamer',
        photoUrl: f.followerPhotoUrl,
        avatar: f.followerAvatar,
        createdAt: f.createdAt,
        isFriend,
      });
    });

    // 2. Include all friends as mutual followers
    targetFriends.forEach((tf) => {
      const otherId = tf.user1Id === targetUid ? tf.user2Id : tf.user1Id;
      const otherTag = tf.user1Id === targetUid ? tf.user2Tag : tf.user1Tag;
      const otherPhoto = tf.user1Id === targetUid ? tf.user2PhotoUrl : tf.user1PhotoUrl;
      const otherAvatar = (tf.user1Id === targetUid ? tf.user2Avatar : tf.user1Avatar) as CharacterVariant;

      if (!map.has(otherId)) {
        map.set(otherId, {
          id: tf.id || `friend_${otherId}`,
          uid: otherId,
          gamerTag: otherTag || 'Squad Friend',
          photoUrl: otherPhoto,
          avatar: otherAvatar,
          createdAt: tf.createdAt,
          isFriend: true,
        });
      } else {
        const existing = map.get(otherId)!;
        existing.isFriend = true;
      }
    });

    return Array.from(map.values());
  }, [followers, targetFriends, targetUid]);

  // Combine following with squad friends
  const displayFollowing = useMemo(() => {
    const map = new Map<string, {
      id: string;
      uid: string;
      gamerTag: string;
      photoUrl?: string;
      avatar?: CharacterVariant;
      createdAt?: string;
      isFriend: boolean;
    }>();

    // 1. Add direct following
    following.forEach((f) => {
      const isFriend = targetFriends.some(
        (tf) => tf.user1Id === f.followingId || tf.user2Id === f.followingId
      );
      map.set(f.followingId, {
        id: f.id || `f_${f.followingId}`,
        uid: f.followingId,
        gamerTag: f.followingGamerTag || 'Gamer',
        photoUrl: f.followingPhotoUrl,
        avatar: f.followingAvatar,
        createdAt: f.createdAt,
        isFriend,
      });
    });

    // 2. Include all friends as following friends
    targetFriends.forEach((tf) => {
      const otherId = tf.user1Id === targetUid ? tf.user2Id : tf.user1Id;
      const otherTag = tf.user1Id === targetUid ? tf.user2Tag : tf.user1Tag;
      const otherPhoto = tf.user1Id === targetUid ? tf.user2PhotoUrl : tf.user1PhotoUrl;
      const otherAvatar = (tf.user1Id === targetUid ? tf.user2Avatar : tf.user1Avatar) as CharacterVariant;

      if (!map.has(otherId)) {
        map.set(otherId, {
          id: tf.id || `friend_${otherId}`,
          uid: otherId,
          gamerTag: otherTag || 'Squad Friend',
          photoUrl: otherPhoto,
          avatar: otherAvatar,
          createdAt: tf.createdAt,
          isFriend: true,
        });
      } else {
        const existing = map.get(otherId)!;
        existing.isFriend = true;
      }
    });

    return Array.from(map.values());
  }, [following, targetFriends, targetUid]);

  // Check if current user is following target user
  useEffect(() => {
    if (!user || !targetUid || isMe) {
      setIsFollowing(false);
      return;
    }

    checkIsFollowing(user.uid, targetUid).then((status) => {
      setIsFollowing(status);
    });
  }, [user?.uid, targetUid, isMe]);

  if (!isOpen || !targetUser) return null;

  const handleToggleFollow = async () => {
    if (!user) {
      onOpenAuthModal?.('signup');
      return;
    }
    if (isMe || !targetUid || isTogglingFollow) return;

    playSketchClick();
    setIsTogglingFollow(true);
    const newStatus = !isFollowing;
    setIsFollowing(newStatus); // Optimistic UI

    try {
      if (newStatus) {
        playSquadJoinSound();
      }
      await toggleFollowUser({
        followerId: user.uid,
        followerGamerTag: gamerProfile?.gamerTag || user.displayName || 'Gamer',
        followerPhotoUrl: gamerProfile?.photoUrl || '',
        followerAvatar: gamerProfile?.characterAvatar || 'classic',
        followingId: targetUid,
        followingGamerTag: targetGamerTag,
        followingPhotoUrl: targetPhotoUrl,
        followingAvatar: targetAvatar,
        isCurrentlyFollowing: !newStatus,
      });
    } catch (err) {
      console.error('Failed to update follow status:', err);
      setIsFollowing(!newStatus); // Rollback on error
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const handleSendMessage = () => {
    playSketchClick();
    if (!user) {
      onOpenAuthModal?.('signin');
      return;
    }
    if (onOpenDirectMessages) {
      onOpenDirectMessages({
        uid: targetUid,
        gamerTag: targetGamerTag,
        photoUrl: targetPhotoUrl,
        avatar: targetAvatar,
      });
      onClose();
    }
  };

  const handleCopyProfileLink = () => {
    playSketchClick();
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#020703] text-slate-100 border border-green-500/40 shadow-[0_0_60px_rgba(34,197,94,0.35)] rounded-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden cursor-default relative"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Cover Banner with Cyber Grid Accent */}
        <div className="h-28 sm:h-36 w-full bg-gradient-to-r from-emerald-950 via-lime-950/80 to-slate-950 relative border-b border-green-500/30 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Tactical Corner Details */}
          <div className="absolute top-3 left-4 flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/70 text-lime-300 border border-lime-500/40">
              CALLSIGN: {targetGamerTag.toUpperCase()}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white bg-black/70 hover:bg-white/10 border border-white/20 rounded-lg transition-colors cursor-pointer select-none z-10"
            title="Close [Esc]"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Profile Card Header Info */}
        <div className="px-5 sm:px-8 pb-3 relative flex-shrink-0">
          {/* Avatar (Overlapping Cover) */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-14 sm:-mt-16 mb-4 gap-4">
            <div className="relative group">
              {targetPhotoUrl ? (
                <div className="relative rounded-full p-1 bg-gradient-to-tr from-lime-500 via-emerald-400 to-green-300 shadow-[0_0_25px_rgba(163,230,53,0.5)]">
                  <img
                    src={targetPhotoUrl}
                    alt={targetGamerTag}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-black"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-lime-950 border-2 border-lime-400 shadow-[0_0_25px_rgba(163,230,53,0.5)] flex items-center justify-center font-display font-bold text-3xl sm:text-4xl text-lime-300">
                  {targetGamerTag.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Online Beacon Indicator */}
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-lime-400 border-2 border-black shadow-[0_0_8px_#a3e635] animate-pulse" />
            </div>

            {/* Action Buttons: Follow, Message, Edit Store, Received Messages */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              {isMe ? (
                <>
                  {/* Edit Store Button */}
                  {onOpenEditStore && (
                    <button
                      onClick={() => {
                        playSketchClick();
                        onClose();
                        onOpenEditStore();
                      }}
                      className="px-3.5 py-2 text-xs font-bold font-display text-pink-200 bg-pink-950/80 hover:bg-pink-900 border border-pink-400/90 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.35)] hover:scale-105 active:scale-95"
                      title="Edit your live 3D storefront and items"
                    >
                      <Store className="w-3.5 h-3.5 text-pink-400" />
                      <span>Edit Store</span>
                    </button>
                  )}

                  {/* Messages & Comms (Sent & Received Messages) */}
                  <button
                    onClick={() => {
                      if (!user) {
                        onOpenAuthModal?.('signin');
                        return;
                      }
                      playSketchClick();
                      onClose();
                      onOpenDirectMessages?.(null);
                    }}
                    className="relative px-3.5 py-2 text-xs font-bold font-display text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/80 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95"
                    title="Open Direct Messages & Comms (Sent and Received)"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Messages / Inbox</span>
                    {unreadMessagesCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-black text-[10px] font-mono font-bold animate-pulse shadow-[0_0_10px_#10b981]">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </button>

                  {/* Edit Dossier */}
                  <button
                    onClick={() => {
                      playSketchClick();
                      onOpenEditProfile?.();
                    }}
                    className="px-3.5 py-2 text-xs font-bold font-display text-lime-300 bg-lime-950/70 hover:bg-lime-900 border border-lime-400/80 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(163,230,53,0.3)] hover:scale-105 active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-lime-400" />
                    <span>Edit Dossier</span>
                  </button>
                </>
              ) : isTargetEvent ? (
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-2 text-xs font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-400/60 rounded-xl flex items-center gap-1.5 shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                    <span>🏛️ Public Community Event</span>
                  </span>
                </div>
              ) : isTargetStore ? (
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-2 text-xs font-mono font-bold text-pink-300 bg-pink-950/80 border border-pink-400/60 rounded-xl flex items-center gap-1.5 shadow-[0_0_12px_rgba(236,72,153,0.4)]">
                    <span>🏬 Store / Venue · Direct Contact via Email/Phone/Socials</span>
                  </span>
                </div>
              ) : (
                <>
                  {/* Add Friend / Friendship Status Button */}
                  {(() => {
                    const isFriend = userFriends.some(
                      (f) => f.user1Id === targetUid || f.user2Id === targetUid
                    );
                    if (isFriend) {
                      return (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user) {
                              onOpenAuthModal?.('signin');
                              return;
                            }
                            playSketchClick();
                            setIsProcessingFriend(true);
                            try {
                              await removeFriend(activeUserId, targetUid);
                            } finally {
                              setIsProcessingFriend(false);
                            }
                          }}
                          disabled={isProcessingFriend}
                          className="px-3.5 py-2 text-xs font-bold font-display rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95"
                          title="You are friends! Click to remove friendship"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Friends ✓</span>
                        </button>
                      );
                    }

                    const hasSent = sentFriendRequests.some(
                      (r) => r.receiverId === targetUid && r.status === 'pending'
                    );
                    if (hasSent) {
                      return (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user) {
                              onOpenAuthModal?.('signin');
                              return;
                            }
                            playSketchClick();
                            setIsProcessingFriend(true);
                            try {
                              await cancelFriendRequest(activeUserId, targetUid);
                            } finally {
                              setIsProcessingFriend(false);
                            }
                          }}
                          disabled={isProcessingFriend}
                          className="px-3.5 py-2 text-xs font-bold font-display rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95"
                          title="Friend request sent! Click to cancel"
                        >
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Request Sent</span>
                        </button>
                      );
                    }

                    const incoming = incomingFriendRequests.find(
                      (r) => r.senderId === targetUid && r.status === 'pending'
                    );
                    if (incoming) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!user) {
                                onOpenAuthModal?.('signin');
                                return;
                              }
                              playSquadJoinSound();
                              setIsProcessingFriend(true);
                              try {
                                await acceptFriendRequest({
                                  requestId: incoming.id,
                                  senderId: incoming.senderId,
                                  senderGamerTag: incoming.senderGamerTag,
                                  senderPhotoUrl: incoming.senderPhotoUrl,
                                  senderAvatar: incoming.senderAvatar,
                                  receiverId: activeUserId,
                                  receiverGamerTag: activeGamerTag,
                                  receiverPhotoUrl: gamerProfile?.photoUrl || user?.photoURL || '',
                                  receiverAvatar: gamerProfile?.characterAvatar || 'classic',
                                });
                              } finally {
                                setIsProcessingFriend(false);
                              }
                            }}
                            disabled={isProcessingFriend}
                            className="px-3.5 py-2 text-xs font-bold font-display rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-lime-400 hover:bg-lime-300 text-black shadow-[0_0_15px_rgba(163,230,53,0.6)] active:scale-95"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Accept Request</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!user) {
                                onOpenAuthModal?.('signin');
                                return;
                              }
                              playSketchClick();
                              setIsProcessingFriend(true);
                              try {
                                await declineFriendRequest(incoming.id, activeUserId);
                              } finally {
                                setIsProcessingFriend(false);
                              }
                            }}
                            disabled={isProcessingFriend}
                            className="px-2.5 py-2 text-xs font-display font-bold text-slate-300 hover:text-red-300 bg-black/60 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/50 rounded-xl transition-colors cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user) {
                            onOpenAuthModal?.('signin');
                            return;
                          }
                          playSketchClick();
                          setIsProcessingFriend(true);
                          try {
                            await sendFriendRequest({
                              senderId: activeUserId,
                              senderGamerTag: activeGamerTag,
                              senderPhotoUrl: gamerProfile?.photoUrl || user?.photoURL || '',
                              senderAvatar: gamerProfile?.characterAvatar || 'classic',
                              receiverId: targetUid,
                              receiverGamerTag: targetGamerTag,
                              receiverPhotoUrl: targetPhotoUrl,
                              receiverAvatar: targetAvatar,
                            });

                            if (targetUid.startsWith('squad-') || targetUid.length < 15) {
                              setTimeout(async () => {
                                try {
                                  await acceptFriendRequest({
                                    requestId: `${activeUserId}_${targetUid}`,
                                    senderId: activeUserId,
                                    senderGamerTag: activeGamerTag,
                                    senderPhotoUrl: gamerProfile?.photoUrl || user?.photoURL || '',
                                    senderAvatar: gamerProfile?.characterAvatar || 'classic',
                                    receiverId: targetUid,
                                    receiverGamerTag: targetGamerTag,
                                    receiverPhotoUrl: targetPhotoUrl,
                                    receiverAvatar: targetAvatar,
                                  });
                                  playSquadJoinSound();
                                } catch {}
                              }, 2000);
                            }
                          } finally {
                            setIsProcessingFriend(false);
                          }
                        }}
                        disabled={isProcessingFriend}
                        className="px-3.5 py-2 text-xs font-bold font-display rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-lime-400 hover:bg-lime-300 text-black shadow-[0_0_15px_rgba(163,230,53,0.6)] hover:scale-105 active:scale-95"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Friend</span>
                      </button>
                    );
                  })()}

                  {/* Instagram-style Follow Button */}
                  <button
                    onClick={handleToggleFollow}
                    disabled={isTogglingFollow}
                    className={`px-4 py-2 text-xs font-bold font-display rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isFollowing
                        ? 'bg-black/60 text-slate-200 border border-slate-600 hover:border-red-400 hover:text-red-300'
                        : 'bg-lime-400 hover:bg-lime-300 text-black shadow-[0_0_20px_rgba(163,230,53,0.6)] hover:scale-105'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-lime-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {/* Send Direct Message Button */}
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 text-xs font-bold font-display text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/80 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95"
                    title={`Send private message to ${targetGamerTag}`}
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Send Message</span>
                  </button>

                  {/* View All Messages / Inbox */}
                  <button
                    onClick={() => {
                      if (!user) {
                        onOpenAuthModal?.('signin');
                        return;
                      }
                      playSketchClick();
                      onClose();
                      onOpenDirectMessages?.(null);
                    }}
                    className="px-3 py-2 text-xs font-bold font-display text-slate-300 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Open all messages & comms inbox"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-lime-400" />
                    <span className="hidden sm:inline">Messages</span>
                  </button>
                </>
              )}

              {/* Share link button */}
              <button
                onClick={handleCopyProfileLink}
                className="p-2 text-slate-300 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 rounded-xl transition-colors cursor-pointer"
                title="Copy profile link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-lime-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Gamer Identity & Role */}
          <div className="text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide">
                {targetGamerTag}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-lime-950 text-lime-300 border border-lime-500/40">
                  {targetRank}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  {targetRole}
                </span>
              </div>
            </div>
            <p className="text-xs font-sketch text-slate-400 mt-1 max-w-lg line-clamp-2">
              {targetBio}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 mt-4 border-b border-green-500/20 text-xs font-display">
            <button
              onClick={() => {
                playSketchClick();
                setActiveTab('overview');
              }}
              className={`pb-2 font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'text-lime-300 border-b-2 border-lime-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Dossier & Photos</span>
            </button>

            <button
              onClick={() => {
                playSketchClick();
                setActiveTab('followers');
              }}
              className={`pb-2 font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'followers'
                  ? 'text-lime-300 border-b-2 border-lime-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Followers ({displayFollowers.length})</span>
            </button>

            <button
              onClick={() => {
                playSketchClick();
                setActiveTab('following');
              }}
              className={`pb-2 font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'following'
                  ? 'text-lime-300 border-b-2 border-lime-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Following ({displayFollowing.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Tactical Games & Genres */}
              <div className="p-3.5 bg-[#030c05] rounded-xl border border-green-500/20">
                <h4 className="text-xs font-bold font-display text-lime-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Favorite Title & Genres</span>
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-lime-950/80 border border-lime-400/60 text-lime-200 rounded-lg">
                    🎯 {targetFavoriteGame}
                  </span>
                  {targetLikedGames.map((g, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[11px] font-sketch bg-black/60 border border-slate-700 text-slate-300 rounded"
                    >
                      {g}
                    </span>
                  ))}
                  {targetLikedGenres.map((gn, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] font-sketch bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded"
                    >
                      #{gn}
                    </span>
                  ))}
                </div>
              </div>

              {/* Photos Gallery (Instagram Grid) */}
              {targetPhotos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold font-display text-white uppercase tracking-wider flex items-center gap-2 mb-2.5">
                    <Camera className="w-3.5 h-3.5 text-lime-400" />
                    <span>Gaming Setup & Battle Shots ({targetPhotos.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {targetPhotos.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        onClick={() => {
                          playSketchClick();
                          onSelectPhoto?.({
                            url: p.url,
                            caption: p.caption || `${targetGamerTag}'s photo`,
                          });
                        }}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-green-500/30 bg-black cursor-pointer shadow-md hover:border-lime-400 transition-colors"
                      >
                        <img
                          src={p.url}
                          alt={p.caption || 'Gamer Photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-[10px] font-mono font-bold text-lime-300 bg-black/80 px-2 py-1 rounded border border-lime-400/50">
                            INSPECT
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Channels */}
              {Object.keys(targetSocialLinks).some((k) => (targetSocialLinks as any)[k]) && (
                <div className="p-3.5 bg-[#030c05] rounded-xl border border-green-500/20">
                  <h4 className="text-xs font-bold font-display text-slate-300 uppercase tracking-wider mb-2">
                    Social & Voice Links
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {Object.entries(targetSocialLinks).map(([k, val]) => {
                      if (!val) return null;
                      return (
                        <div
                          key={k}
                          className="px-2.5 py-1 rounded bg-black/70 border border-slate-700 text-slate-300 flex items-center gap-1.5"
                        >
                          <span className="text-lime-400 font-bold uppercase">{k}:</span>
                          <span>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Followers Tab */}
          {activeTab === 'followers' && (
            <div className="space-y-2.5">
              {displayFollowers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-sketch">
                  <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="font-bold text-slate-300">No followers yet</p>
                  <p className="mt-1 text-slate-500">
                    Squadmates and friends who follow {targetGamerTag} will appear right here!
                  </p>
                </div>
              ) : (
                displayFollowers.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#030d05] border border-green-500/20 flex items-center justify-between gap-3 hover:border-lime-500/50 transition-all shadow-[0_0_12px_rgba(34,197,94,0.1)]"
                  >
                    <div
                      onClick={() => {
                        playSketchClick();
                        onNavigateToUser?.({
                          uid: item.uid,
                          gamerTag: item.gamerTag,
                          photoUrl: item.photoUrl,
                          avatar: item.avatar,
                        });
                      }}
                      className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                    >
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.gamerTag}
                          className="w-10 h-10 rounded-full object-cover border border-lime-400/60 shadow-[0_0_8px_rgba(163,230,53,0.3)]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-lime-950 border border-lime-400 flex items-center justify-center font-display font-bold text-lime-300 text-xs shadow-[0_0_8px_rgba(163,230,53,0.3)]">
                          {item.gamerTag.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold font-display text-white group-hover:text-lime-300 transition-colors truncate">
                            {item.gamerTag}
                          </h4>
                          {item.isFriend ? (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Squad Friend ✓</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lime-950/60 text-lime-400 border border-lime-500/30">
                              Follower
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.createdAt ? `Connected ${new Date(item.createdAt).toLocaleDateString()}` : 'Active connection'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          playSketchClick();
                          onOpenDirectMessages?.({
                            uid: item.uid,
                            gamerTag: item.gamerTag,
                            photoUrl: item.photoUrl,
                            avatar: item.avatar,
                          });
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-sketch text-lime-300 hover:text-white bg-lime-950/70 hover:bg-lime-900 border border-lime-500/40 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_8px_rgba(163,230,53,0.2)] hover:scale-105 active:scale-95"
                      >
                        <MessageSquare className="w-3 h-3 text-lime-400" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div className="space-y-2.5">
              {displayFollowing.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-sketch">
                  <Heart className="w-10 h-10 mx-auto text-pink-500/60 mb-2" />
                  <p className="font-bold text-slate-300">Not following anyone yet</p>
                  <p className="mt-1 text-slate-500">
                    Squadmates and friends {targetGamerTag} follows will appear right here!
                  </p>
                </div>
              ) : (
                displayFollowing.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#030d05] border border-green-500/20 flex items-center justify-between gap-3 hover:border-lime-500/50 transition-all shadow-[0_0_12px_rgba(34,197,94,0.1)]"
                  >
                    <div
                      onClick={() => {
                        playSketchClick();
                        onNavigateToUser?.({
                          uid: item.uid,
                          gamerTag: item.gamerTag,
                          photoUrl: item.photoUrl,
                          avatar: item.avatar,
                        });
                      }}
                      className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                    >
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.gamerTag}
                          className="w-10 h-10 rounded-full object-cover border border-lime-400/60 shadow-[0_0_8px_rgba(163,230,53,0.3)]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-lime-950 border border-lime-400 flex items-center justify-center font-display font-bold text-lime-300 text-xs shadow-[0_0_8px_rgba(163,230,53,0.3)]">
                          {item.gamerTag.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold font-display text-white group-hover:text-lime-300 transition-colors truncate">
                            {item.gamerTag}
                          </h4>
                          {item.isFriend ? (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Squad Friend ✓</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lime-950/60 text-lime-400 border border-lime-500/30">
                              Following
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.createdAt ? `Connected ${new Date(item.createdAt).toLocaleDateString()}` : 'Active connection'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          playSketchClick();
                          onOpenDirectMessages?.({
                            uid: item.uid,
                            gamerTag: item.gamerTag,
                            photoUrl: item.photoUrl,
                            avatar: item.avatar,
                          });
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-sketch text-lime-300 hover:text-white bg-lime-950/70 hover:bg-lime-900 border border-lime-500/40 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_8px_rgba(163,230,53,0.2)] hover:scale-105 active:scale-95"
                      >
                        <MessageSquare className="w-3 h-3 text-lime-400" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
