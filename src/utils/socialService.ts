import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  FollowRelation,
  DirectMessage,
  ConversationThread,
  FriendRequest,
  FriendRelation,
  FriendRequestStatus,
  CharacterAvatarType,
} from '../types';

export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export function getFriendRequestId(senderId: string, receiverId: string): string {
  return `${senderId}_${receiverId}`;
}

export function getFriendshipId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

/** Local caching helpers to ensure instantaneous UX even offline **/
export const socialEvents = new EventTarget();

export function dispatchSocialUpdate(eventName: string, detail?: any) {
  try {
    socialEvents.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch {}
}

function getLocalCache<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCache<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

/**
 * Toggle following a user.
 */
export async function toggleFollowUser(params: {
  followerId: string;
  followerGamerTag: string;
  followerPhotoUrl?: string;
  followerAvatar?: CharacterAvatarType;
  followingId: string;
  followingGamerTag: string;
  followingPhotoUrl?: string;
  followingAvatar?: CharacterAvatarType;
  isCurrentlyFollowing: boolean;
}): Promise<boolean> {
  const followId = `${params.followerId}_${params.followingId}`;
  const followRef = doc(db, 'follows', followId);

  if (params.isCurrentlyFollowing) {
    // Unfollow
    try {
      await deleteDoc(followRef);
    } catch (err) {
      console.warn('Could not delete follow from Firestore (persisting locally):', err);
    }
    // Update local cache
    try {
      const cacheKey = `follows_${params.followerId}`;
      const raw = localStorage.getItem(cacheKey);
      const set = new Set(raw ? JSON.parse(raw) : []);
      set.delete(params.followingId);
      localStorage.setItem(cacheKey, JSON.stringify(Array.from(set)));

      // Remove from following list cache
      const followingListKey = `following_list_${params.followerId}`;
      const curFollowing = getLocalCache<FollowRelation>(followingListKey);
      setLocalCache(followingListKey, curFollowing.filter((f) => f.followingId !== params.followingId));

      // Remove from target user's followers list cache
      const followersListKey = `followers_list_${params.followingId}`;
      const curFollowers = getLocalCache<FollowRelation>(followersListKey);
      setLocalCache(followersListKey, curFollowers.filter((f) => f.followerId !== params.followerId));
    } catch {
      // ignore
    }

    dispatchSocialUpdate('follows_updated', {
      followerId: params.followerId,
      followingId: params.followingId,
      action: 'unfollow',
    });
    return false;
  } else {
    // Follow
    const followData: FollowRelation = {
      id: followId,
      followerId: params.followerId,
      followingId: params.followingId,
      followerGamerTag: params.followerGamerTag,
      followerPhotoUrl: params.followerPhotoUrl || '',
      followerAvatar: params.followerAvatar || 'classic',
      followingGamerTag: params.followingGamerTag,
      followingPhotoUrl: params.followingPhotoUrl || '',
      followingAvatar: params.followingAvatar || 'classic',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(followRef, followData);
    } catch (err) {
      console.warn('Could not save follow to Firestore (persisting locally):', err);
    }

    // Update local cache
    try {
      const cacheKey = `follows_${params.followerId}`;
      const raw = localStorage.getItem(cacheKey);
      const set = new Set(raw ? JSON.parse(raw) : []);
      set.add(params.followingId);
      localStorage.setItem(cacheKey, JSON.stringify(Array.from(set)));

      // Add to following list cache
      const followingListKey = `following_list_${params.followerId}`;
      const curFollowing = getLocalCache<FollowRelation>(followingListKey);
      setLocalCache(followingListKey, [followData, ...curFollowing.filter((f) => f.followingId !== params.followingId)]);

      // Add to target user's followers list cache
      const followersListKey = `followers_list_${params.followingId}`;
      const curFollowers = getLocalCache<FollowRelation>(followersListKey);
      setLocalCache(followersListKey, [followData, ...curFollowers.filter((f) => f.followerId !== params.followerId)]);
    } catch {
      // ignore
    }

    dispatchSocialUpdate('follows_updated', {
      followerId: params.followerId,
      followingId: params.followingId,
      follow: followData,
      action: 'follow',
    });
    return true;
  }
}

/**
 * Check if follower is currently following target user.
 */
export async function checkIsFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (!followerId || !followingId) return false;
  try {
    const followId = `${followerId}_${followingId}`;
    const snap = await getDoc(doc(db, 'follows', followId));
    if (snap.exists()) return true;
  } catch {}

  // check local fallback
  try {
    const cacheKey = `follows_${followerId}`;
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const list = JSON.parse(raw);
      if (list.includes(followingId)) return true;
    }
    const followingList = getLocalCache<FollowRelation>(`following_list_${followerId}`);
    return followingList.some((f) => f.followingId === followingId);
  } catch {
    // ignore
  }
  return false;
}

/**
 * Subscribe to list of users who follow the target user.
 */
export function subscribeFollowers(
  userId: string,
  onUpdate: (followers: FollowRelation[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const emitLocal = () => {
    const local = getLocalCache<FollowRelation>(`followers_list_${userId}`);
    onUpdate(local);
  };

  emitLocal();

  const handleUpdate = () => {
    emitLocal();
  };
  socialEvents.addEventListener('follows_updated', handleUpdate);

  const q = query(
    collection(db, 'follows'),
    where('followingId', '==', userId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const remoteList: FollowRelation[] = [];
      snap.forEach((d) => {
        remoteList.push(d.data() as FollowRelation);
      });
      const local = getLocalCache<FollowRelation>(`followers_list_${userId}`);
      const map = new Map<string, FollowRelation>();
      local.forEach((f) => map.set(f.followerId, f));
      remoteList.forEach((f) => map.set(f.followerId, f));
      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLocalCache(`followers_list_${userId}`, merged);
      onUpdate(merged);
    },
    (err) => {
      console.warn('Error fetching followers:', err);
      emitLocal();
    }
  );

  return () => {
    socialEvents.removeEventListener('follows_updated', handleUpdate);
    unsub();
  };
}

/**
 * Subscribe to list of users whom the target user is following.
 */
export function subscribeFollowing(
  userId: string,
  onUpdate: (following: FollowRelation[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const emitLocal = () => {
    const local = getLocalCache<FollowRelation>(`following_list_${userId}`);
    onUpdate(local);
  };

  emitLocal();

  const handleUpdate = () => {
    emitLocal();
  };
  socialEvents.addEventListener('follows_updated', handleUpdate);

  const q = query(
    collection(db, 'follows'),
    where('followerId', '==', userId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const remoteList: FollowRelation[] = [];
      snap.forEach((d) => {
        remoteList.push(d.data() as FollowRelation);
      });
      const local = getLocalCache<FollowRelation>(`following_list_${userId}`);
      const map = new Map<string, FollowRelation>();
      local.forEach((f) => map.set(f.followingId, f));
      remoteList.forEach((f) => map.set(f.followingId, f));
      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLocalCache(`following_list_${userId}`, merged);
      onUpdate(merged);
    },
    (err) => {
      console.warn('Error fetching following:', err);
      emitLocal();
    }
  );

  return () => {
    socialEvents.removeEventListener('follows_updated', handleUpdate);
    unsub();
  };
}

/**
 * Send a direct message between two gamers.
 */
export async function sendDirectMessage(params: {
  senderId: string;
  senderGamerTag: string;
  senderPhotoUrl?: string;
  receiverId: string;
  receiverGamerTag: string;
  receiverPhotoUrl?: string;
  text: string;
}): Promise<DirectMessage> {
  if (!params.senderId || params.senderId.startsWith('guest_')) {
    throw new Error('Only users who are signed in already can send messages.');
  }
  if (params.receiverId?.startsWith('event-')) {
    throw new Error('Direct messages cannot be sent to events.');
  }
  const cleanText = params.text.trim();
  if (!cleanText) throw new Error('Message text cannot be empty');

  const convId = getConversationId(params.senderId, params.receiverId);
  const now = new Date().toISOString();
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const messageDoc: DirectMessage = {
    id: msgId,
    conversationId: convId,
    participantIds: [params.senderId, params.receiverId],
    senderId: params.senderId,
    senderGamerTag: params.senderGamerTag,
    senderPhotoUrl: params.senderPhotoUrl || '',
    receiverId: params.receiverId,
    receiverGamerTag: params.receiverGamerTag,
    receiverPhotoUrl: params.receiverPhotoUrl || '',
    text: cleanText,
    createdAt: now,
    read: false,
  };

  // 1. Cache message locally immediately for zero-latency UI
  try {
    const localMsgs = getLocalCache<DirectMessage>(`msgs_${convId}`);
    setLocalCache(`msgs_${convId}`, [...localMsgs, messageDoc]);
  } catch {}

  // Dispatch message update locally
  dispatchSocialUpdate('message_sent', { convId, message: messageDoc });

  // 2. Write message to Firestore
  try {
    await setDoc(doc(db, 'messages', msgId), messageDoc);
  } catch (err) {
    console.warn('Firestore message save error:', err);
  }

  // 3. Update / create conversation
  try {
    const convRef = doc(db, 'conversations', convId);
    let unreadCounts: Record<string, number> = {
      [params.receiverId]: 1,
      [params.senderId]: 0,
    };
    try {
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        const data = convSnap.data() as ConversationThread;
        unreadCounts = data.unreadCounts || {};
        unreadCounts[params.receiverId] = (unreadCounts[params.receiverId] || 0) + 1;
      }
    } catch {}

    const convData: ConversationThread = {
      id: convId,
      participantIds: [params.senderId, params.receiverId],
      participantTags: {
        [params.senderId]: params.senderGamerTag,
        [params.receiverId]: params.receiverGamerTag,
      },
      participantPhotos: {
        [params.senderId]: params.senderPhotoUrl || '',
        [params.receiverId]: params.receiverPhotoUrl || '',
      },
      lastMessage: cleanText,
      lastMessageAt: now,
      lastSenderId: params.senderId,
      unreadCounts,
      updatedAt: now,
    };

    // Also update local conversations cache
    try {
      const localConvs = getLocalCache<ConversationThread>('conversations_cache');
      const filtered = localConvs.filter((c) => c.id !== convId);
      setLocalCache('conversations_cache', [convData, ...filtered]);
    } catch {}

    dispatchSocialUpdate('conversations_updated', { convId, conv: convData });

    await setDoc(convRef, convData, { merge: true });
  } catch (err) {
    console.warn('Firestore conversation update error:', err);
  }

  return messageDoc;
}

/**
 * Subscribe to messages in a conversation.
 */
export function subscribeConversationMessages(
  convId: string,
  onUpdate: (messages: DirectMessage[]) => void,
  currentUserId?: string
): () => void {
  if (!convId) {
    onUpdate([]);
    return () => {};
  }

  const emitLocal = () => {
    const localList = getLocalCache<DirectMessage>(`msgs_${convId}`);
    onUpdate(localList);
  };

  emitLocal();

  const handleCustomEvent = (e: any) => {
    if (!e.detail || e.detail.convId === convId) {
      emitLocal();
    }
  };
  socialEvents.addEventListener('message_sent', handleCustomEvent);

  const q = currentUserId
    ? query(
        collection(db, 'messages'),
        where('conversationId', '==', convId),
        where('participantIds', 'array-contains', currentUserId)
      )
    : query(collection(db, 'messages'), where('conversationId', '==', convId));

  const unsub = onSnapshot(
    q,
    (snap) => {
      const remoteList: DirectMessage[] = [];
      snap.forEach((d) => {
        remoteList.push(d.data() as DirectMessage);
      });
      // Merge with local list to guarantee no lost sent messages
      const localList = getLocalCache<DirectMessage>(`msgs_${convId}`);
      const map = new Map<string, DirectMessage>();
      localList.forEach((m) => map.set(m.id, m));
      remoteList.forEach((m) => map.set(m.id, m));
      const combined = Array.from(map.values());
      combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setLocalCache(`msgs_${convId}`, combined);
      onUpdate(combined);
    },
    (err) => {
      console.warn('Error fetching messages from Firestore (using local):', err);
      emitLocal();
    }
  );

  return () => {
    socialEvents.removeEventListener('message_sent', handleCustomEvent);
    unsub();
  };
}

/**
 * Subscribe to all conversations for current user.
 */
export function subscribeUserConversations(
  userId: string,
  onUpdate: (conversations: ConversationThread[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const emitLocal = () => {
    const localConvs = getLocalCache<ConversationThread>('conversations_cache').filter((c) =>
      c.participantIds?.includes(userId)
    );
    onUpdate(localConvs);
  };

  emitLocal();

  const handleCustomEvent = () => {
    emitLocal();
  };
  socialEvents.addEventListener('conversations_updated', handleCustomEvent);

  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const remoteList: ConversationThread[] = [];
      snap.forEach((d) => {
        remoteList.push(d.data() as ConversationThread);
      });
      const localConvs = getLocalCache<ConversationThread>('conversations_cache');
      const map = new Map<string, ConversationThread>();
      localConvs.forEach((c) => map.set(c.id, c));
      remoteList.forEach((c) => map.set(c.id, c));
      const combined = Array.from(map.values());
      combined.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setLocalCache('conversations_cache', combined);
      onUpdate(combined.filter((c) => c.participantIds?.includes(userId)));
    },
    (err) => {
      console.warn('Error fetching conversations:', err);
      emitLocal();
    }
  );

  return () => {
    socialEvents.removeEventListener('conversations_updated', handleCustomEvent);
    unsub();
  };
}

/**
 * Mark a conversation as read by the current user.
 */
export async function markConversationRead(convId: string, userId: string) {
  if (!convId || !userId) return;
  try {
    const convRef = doc(db, 'conversations', convId);
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      const data = snap.data() as ConversationThread;
      if (data.unreadCounts && data.unreadCounts[userId]) {
        const updated = { ...data.unreadCounts, [userId]: 0 };
        await updateDoc(convRef, { unreadCounts: updated });
      }
    }
  } catch (err) {
    console.warn('Error marking conversation read:', err);
  }
}

/* =========================================================================
   FRIEND REQUESTS & MUTUAL FRIENDSHIPS SYSTEM
   ========================================================================= */

/**
 * Send a friend request from sender to receiver.
 */
export async function sendFriendRequest(params: {
  senderId: string;
  senderGamerTag: string;
  senderPhotoUrl?: string;
  senderAvatar?: CharacterAvatarType;
  receiverId: string;
  receiverGamerTag: string;
  receiverPhotoUrl?: string;
  receiverAvatar?: CharacterAvatarType;
}): Promise<FriendRequest> {
  if (!params.senderId || params.senderId.startsWith('guest_')) {
    throw new Error('Only users who are signed in already can add friends.');
  }
  if (params.receiverId?.startsWith('event-')) {
    throw new Error('Events cannot be added as friends.');
  }
  if (params.senderId === params.receiverId) {
    throw new Error('You cannot send a friend request to yourself');
  }

  const reqId = getFriendRequestId(params.senderId, params.receiverId);
  const now = new Date().toISOString();

  const requestDoc: FriendRequest = {
    id: reqId,
    senderId: params.senderId,
    senderGamerTag: params.senderGamerTag,
    senderPhotoUrl: params.senderPhotoUrl || '',
    senderAvatar: params.senderAvatar || 'classic',
    receiverId: params.receiverId,
    receiverGamerTag: params.receiverGamerTag,
    receiverPhotoUrl: params.receiverPhotoUrl || '',
    receiverAvatar: params.receiverAvatar || 'classic',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  // 1. Local storage cache for sender
  try {
    const cacheKey = `sent_requests_${params.senderId}`;
    const sent = getLocalCache<FriendRequest>(cacheKey);
    setLocalCache(cacheKey, [requestDoc, ...sent.filter((r) => r.id !== reqId)]);
  } catch {}

  // 2. Local storage cache for receiver so it immediately shows in their incoming list
  try {
    const inKey = `incoming_requests_${params.receiverId}`;
    const inList = getLocalCache<FriendRequest>(inKey);
    setLocalCache(inKey, [requestDoc, ...inList.filter((r) => r.id !== reqId)]);
  } catch {}

  // 3. Notify local listeners instantly
  dispatchSocialUpdate('friend_requests_updated', {
    senderId: params.senderId,
    receiverId: params.receiverId,
    request: requestDoc,
  });

  // 4. Firestore save with silent fallback
  try {
    await setDoc(doc(db, 'friend_requests', reqId), requestDoc);
  } catch (err) {
    console.warn('Could not save friend request to Firestore (persisted locally):', err);
  }

  return requestDoc;
}

/**
 * Accept an incoming friend request and establish mutual friendship.
 */
export async function acceptFriendRequest(params: {
  requestId: string;
  senderId: string;
  senderGamerTag: string;
  senderPhotoUrl?: string;
  senderAvatar?: CharacterAvatarType;
  receiverId: string;
  receiverGamerTag: string;
  receiverPhotoUrl?: string;
  receiverAvatar?: CharacterAvatarType;
}): Promise<FriendRelation> {
  if (!params.receiverId || params.receiverId.startsWith('guest_')) {
    throw new Error('Only users who are signed in already can accept friend requests.');
  }
  const now = new Date().toISOString();
  const friendId = getFriendshipId(params.senderId, params.receiverId);
  const [u1, u2] = [params.senderId, params.receiverId].sort();

  const isU1Sender = u1 === params.senderId;

  const friendDoc: FriendRelation = {
    id: friendId,
    user1Id: u1,
    user2Id: u2,
    user1Tag: isU1Sender ? params.senderGamerTag : params.receiverGamerTag,
    user2Tag: isU1Sender ? params.receiverGamerTag : params.senderGamerTag,
    user1PhotoUrl: isU1Sender ? params.senderPhotoUrl || '' : params.receiverPhotoUrl || '',
    user2PhotoUrl: isU1Sender ? params.receiverPhotoUrl || '' : params.senderPhotoUrl || '',
    user1Avatar: isU1Sender ? params.senderAvatar || 'classic' : params.receiverAvatar || 'classic',
    user2Avatar: isU1Sender ? params.receiverAvatar || 'classic' : params.senderAvatar || 'classic',
    createdAt: now,
  };

  // 1. Cache friendship locally for BOTH users
  try {
    // For receiver
    const cacheKey = `friends_${params.receiverId}`;
    const friends = getLocalCache<FriendRelation>(cacheKey);
    setLocalCache(cacheKey, [friendDoc, ...friends.filter((f) => f.id !== friendId)]);

    // For sender
    const senderCacheKey = `friends_${params.senderId}`;
    const senderFriends = getLocalCache<FriendRelation>(senderCacheKey);
    setLocalCache(senderCacheKey, [friendDoc, ...senderFriends.filter((f) => f.id !== friendId)]);

    // Remove from receiver's incoming requests cache
    const incomingKey = `incoming_requests_${params.receiverId}`;
    const incoming = getLocalCache<FriendRequest>(incomingKey);
    setLocalCache(
      incomingKey,
      incoming.filter((r) => r.id !== params.requestId && r.senderId !== params.senderId)
    );

    // Remove from sender's sent requests cache
    const sentKey = `sent_requests_${params.senderId}`;
    const sent = getLocalCache<FriendRequest>(sentKey);
    setLocalCache(
      sentKey,
      sent.filter((r) => r.id !== params.requestId && r.receiverId !== params.receiverId)
    );
  } catch {}

  // 2. Dispatch local event for instant UI update
  dispatchSocialUpdate('friends_updated', {
    user1Id: u1,
    user2Id: u2,
    friend: friendDoc,
  });

  // 3. Update Firestore friend request to accepted
  try {
    await updateDoc(doc(db, 'friend_requests', params.requestId), {
      status: 'accepted',
      updatedAt: now,
    });
  } catch (err) {
    console.warn('Could not update friend request doc:', err);
  }

  // 4. Establish mutual friend record in Firestore
  try {
    await setDoc(doc(db, 'friends', friendId), friendDoc);
  } catch (err) {
    console.warn('Could not save friend to Firestore (saved locally):', err);
  }

  // 5. Automatically establish mutual follow records so friends appear in Followers & Following tabs
  try {
    await toggleFollowUser({
      followerId: params.senderId,
      followerGamerTag: params.senderGamerTag,
      followerPhotoUrl: params.senderPhotoUrl || '',
      followerAvatar: params.senderAvatar || 'classic',
      followingId: params.receiverId,
      followingGamerTag: params.receiverGamerTag,
      followingPhotoUrl: params.receiverPhotoUrl || '',
      followingAvatar: params.receiverAvatar || 'classic',
      isCurrentlyFollowing: false,
    });
    await toggleFollowUser({
      followerId: params.receiverId,
      followerGamerTag: params.receiverGamerTag,
      followerPhotoUrl: params.receiverPhotoUrl || '',
      followerAvatar: params.receiverAvatar || 'classic',
      followingId: params.senderId,
      followingGamerTag: params.senderGamerTag,
      followingPhotoUrl: params.senderPhotoUrl || '',
      followingAvatar: params.senderAvatar || 'classic',
      isCurrentlyFollowing: false,
    });
  } catch (followSyncErr) {
    console.warn('Notice establishing mutual follow for friends:', followSyncErr);
  }

  return friendDoc;
}

/**
 * Decline an incoming friend request.
 */
export async function declineFriendRequest(requestId: string, currentUserId: string): Promise<void> {
  if (!currentUserId || currentUserId.startsWith('guest_')) {
    throw new Error('Only users who are signed in already can decline friend requests.');
  }
  const now = new Date().toISOString();

  // Update local cache
  try {
    const incomingKey = `incoming_requests_${currentUserId}`;
    const incoming = getLocalCache<FriendRequest>(incomingKey);
    setLocalCache(
      incomingKey,
      incoming.filter((r) => r.id !== requestId)
    );
  } catch {}

  dispatchSocialUpdate('friend_requests_updated', { userId: currentUserId });

  try {
    await updateDoc(doc(db, 'friend_requests', requestId), {
      status: 'declined',
      updatedAt: now,
    });
  } catch (err) {
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
    } catch {}
  }
}

/**
 * Cancel a pending friend request sent by current user.
 */
export async function cancelFriendRequest(senderId: string, receiverId: string): Promise<void> {
  const reqId = getFriendRequestId(senderId, receiverId);

  try {
    const cacheKey = `sent_requests_${senderId}`;
    const sent = getLocalCache<FriendRequest>(cacheKey);
    setLocalCache(
      cacheKey,
      sent.filter((r) => r.id !== reqId && r.receiverId !== receiverId)
    );

    // Also remove from receiver's incoming requests cache
    const inKey = `incoming_requests_${receiverId}`;
    const inList = getLocalCache<FriendRequest>(inKey);
    setLocalCache(
      inKey,
      inList.filter((r) => r.id !== reqId && r.senderId !== senderId)
    );
  } catch {}

  dispatchSocialUpdate('friend_requests_updated', { senderId, receiverId });

  try {
    await deleteDoc(doc(db, 'friend_requests', reqId));
  } catch {}
}

/**
 * Remove an established friend.
 */
export async function removeFriend(userId1: string, userId2: string): Promise<void> {
  const friendId = getFriendshipId(userId1, userId2);

  try {
    const cacheKey1 = `friends_${userId1}`;
    const friends1 = getLocalCache<FriendRelation>(cacheKey1);
    setLocalCache(
      cacheKey1,
      friends1.filter((f) => f.id !== friendId)
    );

    const cacheKey2 = `friends_${userId2}`;
    const friends2 = getLocalCache<FriendRelation>(cacheKey2);
    setLocalCache(
      cacheKey2,
      friends2.filter((f) => f.id !== friendId)
    );
  } catch {}

  dispatchSocialUpdate('friends_updated', { userId1, userId2 });

  try {
    await deleteDoc(doc(db, 'friends', friendId));
  } catch {}
}

/**
 * Real-time subscription to incoming pending friend requests for a user.
 */
export function subscribeIncomingFriendRequests(
  userId: string,
  onUpdate: (requests: FriendRequest[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const emitLocal = () => {
    const localCache = getLocalCache<FriendRequest>(`incoming_requests_${userId}`).filter(
      (r) => r.status === 'pending'
    );
    onUpdate(localCache);
  };

  emitLocal();

  const handleCustomEvent = () => {
    emitLocal();
  };
  socialEvents.addEventListener('friend_requests_updated', handleCustomEvent);

  const q = query(
    collection(db, 'friend_requests'),
    where('receiverId', '==', userId),
    where('status', '==', 'pending')
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const list: FriendRequest[] = [];
      snap.forEach((d) => {
        list.push(d.data() as FriendRequest);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLocalCache(`incoming_requests_${userId}`, list);
      onUpdate(list);
    },
    (err) => {
      console.warn('Error fetching incoming friend requests:', err);
      emitLocal();
    }
  );

  return () => {
    socialEvents.removeEventListener('friend_requests_updated', handleCustomEvent);
    unsub();
  };
}

/**
 * Real-time subscription to sent friend requests by a user.
 */
export function subscribeSentFriendRequests(
  userId: string,
  onUpdate: (requests: FriendRequest[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const emitLocal = () => {
    const localCache = getLocalCache<FriendRequest>(`sent_requests_${userId}`);
    onUpdate(localCache);
  };

  emitLocal();

  const handleCustomEvent = () => {
    emitLocal();
  };
  socialEvents.addEventListener('friend_requests_updated', handleCustomEvent);

  const q = query(
    collection(db, 'friend_requests'),
    where('senderId', '==', userId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const list: FriendRequest[] = [];
      snap.forEach((d) => {
        list.push(d.data() as FriendRequest);
      });
      setLocalCache(`sent_requests_${userId}`, list);
      onUpdate(list);
    },
    (err) => {
      console.warn('Error fetching sent friend requests:', err);
      emitLocal();
    }
  );

  return () => {
    socialEvents.removeEventListener('friend_requests_updated', handleCustomEvent);
    unsub();
  };
}

/**
 * Real-time subscription to all friends of a user.
 */
export function subscribeUserFriends(
  userId: string,
  onUpdate: (friends: FriendRelation[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const emitLocal = () => {
    const localCache = getLocalCache<FriendRelation>(`friends_${userId}`);
    onUpdate(localCache);
  };

  emitLocal();

  const handleCustomEvent = () => {
    emitLocal();
  };
  socialEvents.addEventListener('friends_updated', handleCustomEvent);

  // Query as user1Id
  const q1 = query(collection(db, 'friends'), where('user1Id', '==', userId));
  // Query as user2Id
  const q2 = query(collection(db, 'friends'), where('user2Id', '==', userId));

  let list1: FriendRelation[] = [];
  let list2: FriendRelation[] = [];

  const mergeAndEmit = () => {
    const localCache = getLocalCache<FriendRelation>(`friends_${userId}`);
    const map = new Map<string, FriendRelation>();
    localCache.forEach((f) => map.set(f.id, f));
    list1.forEach((f) => map.set(f.id, f));
    list2.forEach((f) => map.set(f.id, f));
    const combined = Array.from(map.values());
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setLocalCache(`friends_${userId}`, combined);
    onUpdate(combined);
  };

  const unsub1 = onSnapshot(
    q1,
    (snap) => {
      list1 = [];
      snap.forEach((d) => list1.push(d.data() as FriendRelation));
      mergeAndEmit();
    },
    (err) => {
      console.warn('Friends query 1 error:', err);
      emitLocal();
    }
  );

  const unsub2 = onSnapshot(
    q2,
    (snap) => {
      list2 = [];
      snap.forEach((d) => list2.push(d.data() as FriendRelation));
      mergeAndEmit();
    },
    (err) => {
      console.warn('Friends query 2 error:', err);
      emitLocal();
    }
  );

  return () => {
    socialEvents.removeEventListener('friends_updated', handleCustomEvent);
    unsub1();
    unsub2();
  };
}
