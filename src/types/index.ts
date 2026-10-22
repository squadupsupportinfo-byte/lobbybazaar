export type GameGenre = 'FPS' | 'Battle Royale' | 'MOBA' | 'Co-op' | 'Fighting' | 'Action' | 'RPG' | 'Sports' | 'Strategy' | 'Other';

export interface GamerSocialLinks {
  discord?: string;
  twitch?: string;
  steam?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  instagram?: string;
  facebook?: string;
}

export type PhotoPriceType = 'firm' | 'negotiable';
export type PhotoIntentType = 'sell' | 'trade' | 'both';

export interface GamerPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
  price?: string;
  priceType?: PhotoPriceType;
  intent?: PhotoIntentType;
  condition?: string;
  description?: string;
}

export interface StorePhotoItem {
  id: string;
  url: string;
  price?: string;
  priceType?: PhotoPriceType;
  intent?: PhotoIntentType;
  condition?: string;
  description?: string;
}

export interface GamerPlaySchedule {
  days?: string[];
  timeSlot?: string;
  customHours?: string;
}

export interface SquadMember {
  id: string;
  name: string;
  avatarSeed: string;
  role: string;
  rank?: string;
  isLeader?: boolean;
  photoUrl?: string;
  bio?: string;
  likedGames?: string[];
  likedGenres?: string[];
  playSchedule?: GamerPlaySchedule;
  socialLinks?: GamerSocialLinks;
  photos?: GamerPhoto[];
}

export type BuildingType = 'boutique' | 'arcade' | 'spooky_shop' | 'girly_spooky' | 'girly_kiosk' | 'boy_kiosk' | 'grand_event' | 'medium_store' | 'sketch_store' | 'cyber_tower';
export type StoreActionType = 'selling' | 'trading';

export interface EventData {
  name: string;
  durationDays: number;
  locationAddress: string;
  mainAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  socialLinks?: GamerSocialLinks;
  description: string;
  lat: number;
  lng: number;
  cityName?: string;
  zipCode?: string;
  createdAt: string;
  expiresAt: string;
  buildingType: 'grand_event';
}

export interface StoreData {
  buildingType: BuildingType;
  actionTypes: StoreActionType[];
  storeName: string;
  category: string;
  condition?: string;
  price?: string;
  tradeLookingFor?: string;
  budget?: string;
  description: string;
  photos: string[]; // Up to 15 photos!
  photoItems?: StorePhotoItem[];
  zipCode?: string;
  cityName: string;
  lat: number;
  lng: number;
  contactDiscord?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactSteam?: string;
  sellerGamerTag: string;
  createdAt: string;
}

export type CharacterAvatarType =
  | 'waving'
  | 'classic'
  | 'pumpkin'
  | 'girly_pumpkin'
  | 'jason'
  | 'ghostface'
  | 'michael_myers'
  | 'freddy'
  | 'cyber_soccer_girl'
  | 'cyber_soccer_boy'
  | 'purple_anime_girl'
  | 'mexican_traveler'
  | 'alien_girl'
  | 'alien_boy'
  | 'moon_demon_noble'
  | 'demon_dog_warrior'
  | 'celestial_moon_guardian'
  | 'sacred_shrine_priestess';

export interface ChatRoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  senderAvatar?: CharacterAvatarType;
  text: string;
  createdAt: string;
  likes?: number;
}

export interface ChatRoomData {
  roomId: string;
  roomName: string;
  topic?: string;
  game?: string;
  description: string;
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  hostAvatar?: CharacterAvatarType;
  icon?: string;
  micRequired?: boolean;
  activeUsersCount?: number;
  tags?: string[];
  zipCode?: string;
  cityName?: string;
  lat?: number;
  lng?: number;
  discordServer?: string;
  createdAt: string;
}

export interface SquadBeacon {
  id: string;
  ownerId?: string;
  name: string;
  game: string;
  genre: GameGenre;
  rank: string;
  currentMembers: number;
  maxMembers: number;
  sector: string;
  locationName: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
  x: number; // percentage on map (10 - 90)
  y: number; // percentage on map (10 - 90)
  micRequired: boolean;
  playstyle: 'Competitive' | 'Casual' | 'Tournament' | 'LAN Hub';
  description: string;
  lookingFor: string[];
  discordServer?: string;
  pingMs: number;
  members: SquadMember[];
  accentColor: 'green' | 'emerald' | 'amber' | 'lime';
  beaconType?: 'console' | 'tournament' | 'other_event' | 'store' | 'chat_room';
  buildingType?: BuildingType;
  storeData?: StoreData;
  eventData?: EventData;
  chatRoomData?: ChatRoomData;
  expiresAt?: string;
  durationDays?: number;
  locationAddress?: string;
  mainAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  console?: string;
  eventDate?: string;
  prizePool?: string;
  photoUrl?: string;
  bio?: string;
  likedGenres?: string[];
  likedGames?: string[];
  socialLinks?: GamerSocialLinks;
  photos?: GamerPhoto[];
  playSchedule?: GamerPlaySchedule;
  characterAvatar?: CharacterAvatarType;
}

export interface GameFilter {
  game: string;
  playstyle: string;
  searchQuery: string;
}

export interface FollowRelation {
  id: string; // `${followerId}_${followingId}`
  followerId: string;
  followingId: string;
  followerGamerTag: string;
  followerPhotoUrl?: string;
  followerAvatar?: CharacterAvatarType;
  followingGamerTag: string;
  followingPhotoUrl?: string;
  followingAvatar?: CharacterAvatarType;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  participantIds: string[];
  senderId: string;
  senderGamerTag: string;
  senderPhotoUrl?: string;
  receiverId: string;
  receiverGamerTag?: string;
  receiverPhotoUrl?: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface ConversationThread {
  id: string; // sorted [uid1, uid2].join('_')
  participantIds: string[];
  participantTags: Record<string, string>;
  participantPhotos?: Record<string, string>;
  participantAvatars?: Record<string, CharacterAvatarType>;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSenderId?: string;
  unreadCounts?: Record<string, number>;
  updatedAt: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string; // `${senderId}_${receiverId}`
  senderId: string;
  senderGamerTag: string;
  senderPhotoUrl?: string;
  senderAvatar?: CharacterAvatarType;
  receiverId: string;
  receiverGamerTag: string;
  receiverPhotoUrl?: string;
  receiverAvatar?: CharacterAvatarType;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRelation {
  id: string; // sorted [uid1, uid2].join('_')
  user1Id: string;
  user2Id: string;
  user1Tag: string;
  user2Tag: string;
  user1PhotoUrl?: string;
  user2PhotoUrl?: string;
  user1Avatar?: CharacterAvatarType;
  user2Avatar?: CharacterAvatarType;
  createdAt: string;
}
