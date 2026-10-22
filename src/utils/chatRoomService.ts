import { SquadBeacon, ChatRoomData, ChatRoomMessage, CharacterAvatarType } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, query, where, onSnapshot, orderBy, limit, deleteDoc } from 'firebase/firestore';

export function getSavedLocalChatRooms(): SquadBeacon[] {
  try {
    const raw = localStorage.getItem('squadup_deployed_chat_rooms');
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    // Only keep real user-created chat rooms (purge any legacy mock demo rooms or deleted rooms)
    const valid = parsed
      .filter(
        (r) =>
          r &&
          r.id &&
          !r.id.startsWith('room-sd-') &&
          r.id !== 'room-chill-night-gamers' &&
          r.id !== 'room-1791474844673-oiwxk'
      )
      .map((r) => ({ ...r, maxMembers: 5 }));
    if (valid.length !== parsed.length) {
      localStorage.setItem('squadup_deployed_chat_rooms', JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

export function saveLocalChatRoom(room: SquadBeacon) {
  try {
    const existing = getSavedLocalChatRooms();
    const updated = [room, ...existing.filter((r) => r.id !== room.id)];
    localStorage.setItem('squadup_deployed_chat_rooms', JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save chat room to localStorage:', err);
  }
}

export function deleteLocalChatRoom(roomId: string) {
  try {
    const existing = getSavedLocalChatRooms();
    const updated = existing.filter((r) => r.id !== roomId);
    localStorage.setItem('squadup_deployed_chat_rooms', JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not delete chat room from localStorage:', err);
  }
}

function getLocalRoomMessages(roomId: string): ChatRoomMessage[] {
  try {
    const raw = localStorage.getItem(`squadup_chat_messages_${roomId}`);
    if (raw) {
      return JSON.parse(raw);
    }
    return [];
  } catch {
    return [];
  }
}

function saveLocalRoomMessage(roomId: string, message: ChatRoomMessage) {
  try {
    const list = getLocalRoomMessages(roomId);
    const updated = [...list.filter((m) => m.id !== message.id), message];
    localStorage.setItem(`squadup_chat_messages_${roomId}`, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save room message locally:', err);
  }
}

export function subscribeRoomMessages(
  roomId: string,
  callback: (messages: ChatRoomMessage[]) => void
): () => void {
  // First fire with local cached messages immediately
  const localMsgs = getLocalRoomMessages(roomId);
  callback(localMsgs);

  // Firestore real-time listener for live sync
  try {
    const q = query(
      collection(db, 'room_messages'),
      where('roomId', '==', roomId)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ChatRoomMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ChatRoomMessage;
            if (data && data.text) {
              list.push({ ...data, id: docSnap.id });
            }
          });
          // Merge with any local seeded messages
          const map = new Map<string, ChatRoomMessage>();
          localMsgs.forEach((m) => map.set(m.id, m));
          list.forEach((m) => map.set(m.id, m));
          const sorted = Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          callback(sorted);
        }
      },
      (err) => {
        console.warn('Firestore room_messages snapshot notice:', err);
        // Fallback to local
        callback(getLocalRoomMessages(roomId));
      }
    );

    return unsub;
  } catch (err) {
    console.warn('Could not attach Firestore listener for room_messages:', err);
    return () => {};
  }
}

export async function sendRoomMessage(
  roomId: string,
  messageData: {
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    senderAvatar?: CharacterAvatarType;
    text: string;
  }
): Promise<ChatRoomMessage> {
  const newMsg: ChatRoomMessage = {
    id: `msg_${roomId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    roomId,
    senderId: messageData.senderId,
    senderName: messageData.senderName,
    senderPhoto: messageData.senderPhoto,
    senderAvatar: messageData.senderAvatar,
    text: messageData.text.trim(),
    createdAt: new Date().toISOString(),
  };

  // Cache locally
  saveLocalRoomMessage(roomId, newMsg);

  // Persist to Firestore
  try {
    await setDoc(doc(db, 'room_messages', newMsg.id), newMsg);
  } catch (err) {
    console.warn('Could not persist message to Firestore (cached locally):', err);
  }

  return newMsg;
}
