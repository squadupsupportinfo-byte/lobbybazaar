import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Send,
  MessageSquare,
  User,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  Lock,
  ArrowLeft,
  Users,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConversationThread, DirectMessage, FriendRelation, CharacterAvatarType } from '../types';
import {
  subscribeUserConversations,
  subscribeConversationMessages,
  subscribeUserFriends,
  sendDirectMessage,
  getConversationId,
  markConversationRead,
} from '../utils/socialService';
import { playSketchClick, playMessagePopSound } from '../utils/audio';

export interface RecipientInfo {
  uid: string;
  gamerTag: string;
  photoUrl?: string;
  avatar?: CharacterAvatarType;
}

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipient?: RecipientInfo | null;
  friends?: FriendRelation[];
  onOpenSocialProfile?: (user: RecipientInfo) => void;
  onOpenAuthModal?: (mode: 'signup' | 'signin') => void;
}

export function DirectMessagesModal({
  isOpen,
  onClose,
  initialRecipient,
  friends: initialFriends,
  onOpenSocialProfile,
  onOpenAuthModal,
}: DirectMessagesModalProps) {
  const { user, gamerProfile } = useAuth();

  // Guest ID fallback so users can immediately start typing and send messages without auth blocker
  const guestId = useMemo(() => {
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
  }, []);

  const currentUserId = user?.uid || guestId;
  const currentGamerTag =
    gamerProfile?.gamerTag || user?.displayName || localStorage.getItem('squadup_guest_tag') || 'You';
  const currentPhotoUrl = gamerProfile?.photoUrl || user?.photoURL || '';

  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [friendsList, setFriendsList] = useState<FriendRelation[]>(initialFriends || []);
  const [activeRecipient, setActiveRecipient] = useState<RecipientInfo | null>(
    initialRecipient || null
  );
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync initialRecipient when modal opens
  useEffect(() => {
    if (initialRecipient) {
      setActiveRecipient(initialRecipient);
    } else {
      setActiveRecipient(null);
    }
  }, [initialRecipient, isOpen]);

  // Sync initialFriends if provided
  useEffect(() => {
    if (initialFriends && initialFriends.length > 0) {
      setFriendsList(initialFriends);
    }
  }, [initialFriends]);

  // Auto-focus the input window immediately upon opening if an active recipient is set
  useEffect(() => {
    if (isOpen && activeRecipient) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeRecipient]);

  // Subscribe to all conversations for active user
  useEffect(() => {
    const unsub = subscribeUserConversations(currentUserId, (list) => {
      setConversations(list);
    });
    return () => unsub();
  }, [currentUserId]);

  // Subscribe to friends for active user
  useEffect(() => {
    if (!currentUserId) return;
    const unsub = subscribeUserFriends(currentUserId, (list) => {
      setFriendsList(list);
    });
    return () => unsub();
  }, [currentUserId]);

  // Subscribe to messages for the active conversation
  useEffect(() => {
    if (!activeRecipient) {
      setMessages([]);
      return;
    }

    const convId = getConversationId(currentUserId, activeRecipient.uid);
    markConversationRead(convId, currentUserId);

    const unsub = subscribeConversationMessages(
      convId,
      (msgs) => {
        setMessages(msgs);
      },
      currentUserId
    );

    return () => unsub();
  }, [currentUserId, activeRecipient]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      onOpenAuthModal?.('signin');
      return;
    }
    if (!inputText.trim() || !activeRecipient || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      playMessagePopSound();
      await sendDirectMessage({
        senderId: currentUserId,
        senderGamerTag: currentGamerTag,
        senderPhotoUrl: currentPhotoUrl,
        receiverId: activeRecipient.uid,
        receiverGamerTag: activeRecipient.gamerTag,
        receiverPhotoUrl: activeRecipient.photoUrl || '',
        text: textToSend,
      });

      // Quick focus back to input so user can seamlessly type next message
      setTimeout(() => inputRef.current?.focus(), 60);

      // If messaging a map squad or demo player, simulate a realistic squad comms reply
      const isBotOrSquad =
        activeRecipient.uid.startsWith('squad-') ||
        activeRecipient.uid.includes('phantom') ||
        activeRecipient.uid.includes('recon') ||
        activeRecipient.uid.includes('sniper') ||
        activeRecipient.uid.length < 15;

      if (isBotOrSquad) {
        setTimeout(async () => {
          const replies = [
            `Copy that, ${currentGamerTag}! We're ready for the next match. 🎮`,
            `Lobby open! Jump in whenever you're ready.`,
            `GG! Added you to our squad notes. Let's run it. ⚔️`,
            `Roger that! High comms and good vibes only.`,
            `Sounds like a plan! Ping me when you're jumping on.`,
          ];
          const reply = replies[Math.floor(Math.random() * replies.length)];
          try {
            await sendDirectMessage({
              senderId: activeRecipient.uid,
              senderGamerTag: activeRecipient.gamerTag,
              senderPhotoUrl: activeRecipient.photoUrl || '',
              receiverId: currentUserId,
              receiverGamerTag: currentGamerTag,
              receiverPhotoUrl: currentPhotoUrl,
              text: reply,
            });
            playMessagePopSound();
          } catch {}
        }, 1200);
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const quickPills = ['🎮 Ready to Squad Up?', '⚔️ GG!', 'Available to trade?', 'Sent you a friend request!'];

  const filteredConversations = conversations.filter((c) => {
    const otherId = c.participantIds.find((id) => id !== currentUserId) || '';
    const otherTag = c.participantTags?.[otherId] || '';
    return otherTag.toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md cursor-pointer animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[92vh] max-h-[780px] bg-[#020703] text-slate-100 border border-green-500/40 shadow-[0_0_60px_rgba(34,197,94,0.3)] rounded-2xl flex flex-col overflow-hidden cursor-default"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 sm:px-6 border-b border-green-500/30 flex items-center justify-between bg-[#040e06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-950/80 border border-lime-400 flex items-center justify-center shadow-[0_0_12px_rgba(163,230,53,0.5)]">
              <MessageSquare className="w-5 h-5 text-lime-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-display text-white tracking-wide">
                  Gamer Direct Comms
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-lime-950 text-lime-300 border border-lime-500/40">
                  REAL-TIME
                </span>
              </div>
              <p className="text-[11px] font-sketch text-slate-400">
                End-to-end gamer private messaging & squad coordinating
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 rounded-lg transition-colors cursor-pointer select-none"
            title="Close [Esc]"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Content Body: Conversations List + Chat Window */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Conversations list */}
          <div
            className={`w-full sm:w-80 border-r border-green-500/20 bg-[#010502] flex flex-col flex-shrink-0 ${
              activeRecipient ? 'hidden sm:flex' : 'flex'
            }`}
          >
            {/* Header above search */}
            <div className="px-3.5 py-2.5 border-b border-green-500/20 bg-[#020b04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-lime-400" />
                <span className="text-xs font-bold font-display text-white">
                  Conversations ({conversations.length})
                </span>
              </div>
              <span className="text-[10px] font-mono text-lime-300 bg-lime-950/80 px-1.5 py-0.2 rounded border border-lime-500/30">
                INDIVIDUAL
              </span>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-green-500/20">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter conversations..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#030d05] border border-green-500/30 rounded-lg text-xs font-sketch text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>
            </div>

            {/* Conversation Threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-green-500/10">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-sketch">
                  <p>No active conversations yet.</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Find gamers on the map or in your follower list and click "Send Message" to start chatting!
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const otherId = c.participantIds.find((id) => id !== currentUserId) || '';
                  const otherTag = c.participantTags?.[otherId] || 'Gamer';
                  const otherPhoto = c.participantPhotos?.[otherId];
                  const isSelected = activeRecipient?.uid === otherId;
                  const unread = c.unreadCounts?.[currentUserId] || 0;

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        playSketchClick();
                        setActiveRecipient({
                          uid: otherId,
                          gamerTag: otherTag,
                          photoUrl: otherPhoto,
                        });
                      }}
                      className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-lime-950/40 border-l-4 border-lime-400'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {otherPhoto ? (
                          <img
                            src={otherPhoto}
                            alt={otherTag}
                            className="w-10 h-10 rounded-full object-cover border border-green-500/40"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-lime-950 border border-lime-400 flex items-center justify-center font-display font-bold text-lime-300 text-sm">
                            {otherTag.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lime-400 text-black text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                            {unread}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold font-display text-white truncate">
                            {otherTag}
                          </h4>
                          {c.lastMessageAt && (
                            <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                              {new Date(c.lastMessageAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-sketch text-slate-400 truncate mt-0.5">
                          {c.lastMessage || 'Start a conversation'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Chat Window */}
          <div className="flex-1 flex flex-col bg-[#020904] overflow-hidden">
            {activeRecipient ? (
              <>
                {/* Chat Partner Header */}
                <div className="p-3 sm:px-5 border-b border-green-500/20 bg-[#030f06] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {activeRecipient.photoUrl ? (
                        <img
                          src={activeRecipient.photoUrl}
                          alt={activeRecipient.gamerTag}
                          className="w-9 h-9 rounded-full object-cover border border-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-lime-950 border border-lime-400 flex items-center justify-center font-display font-bold text-lime-300 text-xs">
                          {activeRecipient.gamerTag.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-lime-400 border border-black animate-pulse" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold font-display text-white">
                          {activeRecipient.gamerTag}
                        </h3>
                        <span className="text-[9px] font-mono text-lime-300 bg-lime-950/80 px-1.5 py-0.2 rounded border border-lime-500/40">
                          ONLINE
                        </span>
                      </div>
                      <p className="text-[10px] font-sketch text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Squadmate comms link active</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        playSketchClick();
                        setActiveRecipient(null);
                      }}
                      className="px-2.5 py-1 text-xs font-sketch text-slate-300 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Back to all people you're messaging with"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-lime-400" />
                      <span className="hidden sm:inline">All Conversations</span>
                    </button>

                    {onOpenSocialProfile && (
                      <button
                        onClick={() => {
                          playSketchClick();
                          onOpenSocialProfile(activeRecipient);
                        }}
                        className="px-2.5 py-1 text-xs font-sketch text-lime-300 hover:text-white bg-lime-950/60 hover:bg-lime-900 border border-lime-500/40 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="View full Instagram-style gamer profile"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">View Profile</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-lime-950/60 border border-lime-500/30 flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6 text-lime-300" />
                      </div>
                      <h4 className="text-sm font-bold font-display text-white">
                        Direct channel with {activeRecipient.gamerTag} opened!
                      </h4>
                      <p className="text-xs font-sketch text-slate-400 mt-1 max-w-sm">
                        Say hello, coordinate game sessions, share setups, or discuss item trades.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === currentUserId;

                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <div className="flex-shrink-0 mb-1">
                              {m.senderPhotoUrl ? (
                                <img
                                  src={m.senderPhotoUrl}
                                  alt={m.senderGamerTag}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-700"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                  {m.senderGamerTag.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}

                          <div
                            className={`max-w-[80%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-sketch relative shadow-lg ${
                              isMe
                                ? 'bg-[#0f3017] text-green-100 border border-lime-400/50 rounded-br-none shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                                : 'bg-[#0a110d] text-slate-200 border border-slate-700/80 rounded-bl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                            <div className="mt-1 flex items-center justify-end gap-1 text-[9px] font-mono text-slate-400">
                              <span>
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe && <CheckCheck className="w-3 h-3 text-lime-400 inline" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {!user ? (
                  <div className="p-4 border-t border-green-500/20 bg-[#020b05] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs font-sketch text-amber-300">
                      <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Only users who are signed in already can send messages.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenAuthModal?.('signin')}
                      className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-bold font-display text-xs cursor-pointer shadow-[0_0_12px_rgba(163,230,53,0.5)] transition-all whitespace-nowrap"
                    >
                      Sign In to Send Messages
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Quick Gamer Phrases */}
                    <div className="px-3 py-1.5 border-t border-green-500/10 bg-[#010603] flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
                      {quickPills.map((pill, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            playSketchClick();
                            setInputText(pill);
                          }}
                          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-lime-950/50 hover:bg-lime-900/60 border border-lime-500/30 text-[10px] font-sketch text-lime-300 transition-colors flex-shrink-0 cursor-pointer"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>

                    {/* Input Form Bar */}
                    <form
                      onSubmit={handleSend}
                      className="p-3 border-t border-green-500/20 bg-[#020b05] flex items-center gap-2 flex-shrink-0"
                    >
                      <input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Message ${activeRecipient.gamerTag}...`}
                        className="flex-1 px-4 py-2 bg-[#010502] border border-green-500/40 rounded-xl text-xs sm:text-sm font-sketch text-white placeholder:text-slate-500 focus:outline-none focus:border-lime-400 shadow-inner transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!inputText.trim() || isSending}
                        className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold font-display text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(163,230,53,0.5)] transition-all cursor-pointer disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      >
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : (
              /* All People You're Messaging With Individually Directory */
              <div className="flex-1 flex flex-col bg-[#020904] overflow-hidden">
                <div className="p-3.5 sm:p-5 border-b border-green-500/20 bg-[#030f06] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime-950/80 border border-lime-400 flex items-center justify-center shadow-[0_0_12px_rgba(163,230,53,0.4)]">
                      <Users className="w-5 h-5 text-lime-300" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold font-display text-white">
                        All People You're Messaging With
                      </h3>
                      <p className="text-xs font-sketch text-slate-400">
                        Individual 1-on-1 private messaging channels
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-lime-300 bg-lime-950/80 px-2.5 py-1 rounded border border-lime-500/30">
                    {conversations.length} {conversations.length === 1 ? 'Person' : 'People'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {/* Grid of Individual Contacts */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-lime-400 font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-lime-400" />
                        <span>Individual Conversations ({conversations.length})</span>
                      </h4>
                      <span className="text-[10px] font-sketch text-slate-400">
                        Click any person to message them directly
                      </span>
                    </div>

                    {filteredConversations.length === 0 ? (
                      <div className="p-6 rounded-xl bg-[#010603] border border-green-500/20 text-center text-slate-400 font-sketch">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-bold font-display text-slate-300">
                          No direct conversations started yet.
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Select any friend or squadmate below to open an individual 1-on-1 direct channel!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredConversations.map((c) => {
                          const otherId = c.participantIds.find((id) => id !== currentUserId) || '';
                          const otherTag = c.participantTags?.[otherId] || 'Gamer';
                          const otherPhoto = c.participantPhotos?.[otherId];
                          const unread = c.unreadCounts?.[currentUserId] || 0;

                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                playSketchClick();
                                setActiveRecipient({
                                  uid: otherId,
                                  gamerTag: otherTag,
                                  photoUrl: otherPhoto,
                                });
                              }}
                              className="p-4 rounded-xl bg-[#010803] hover:bg-[#031407] border border-green-500/30 hover:border-lime-400/80 transition-all cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.1)] group flex flex-col justify-between gap-3"
                              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative flex-shrink-0">
                                  {otherPhoto ? (
                                    <img
                                      src={otherPhoto}
                                      alt={otherTag}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.4)]"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-lime-950 border-2 border-lime-400 flex items-center justify-center font-display font-bold text-lime-300 text-base">
                                      {otherTag.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-lime-400 border-2 border-black animate-pulse" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h5 className="text-sm font-bold font-display text-white group-hover:text-lime-300 truncate transition-colors">
                                      {otherTag}
                                    </h5>
                                    {unread > 0 && (
                                      <span className="px-2 py-0.5 rounded-full bg-lime-400 text-black text-[10px] font-mono font-bold animate-pulse shadow-[0_0_8px_#a3e635]">
                                        {unread} New
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    <span>Individual Direct Channel</span>
                                  </span>
                                  <p className="text-xs font-sketch text-slate-300 truncate mt-1.5 italic bg-black/40 px-2 py-1 rounded border border-green-500/20">
                                    "{c.lastMessage || 'Say hello...'}"
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-green-500/20 text-[11px] font-mono text-slate-400">
                                <span>
                                  {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }) : 'Recently active'}
                                </span>
                                <span className="text-lime-300 font-bold group-hover:underline flex items-center gap-1 font-display">
                                  <span>Message Individually</span>
                                  <span>→</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Friends & Squadmates you can message individually */}
                  {friendsList.length > 0 && (
                    <div className="pt-4 border-t border-green-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Friends Available for Individual Chat ({friendsList.length})</span>
                        </h4>
                        <span className="text-[10px] font-sketch text-slate-400">
                          Start a new 1-on-1 direct channel
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {friendsList.map((f) => {
                          const friendUid = f.user1Id === currentUserId ? f.user2Id : f.user1Id;
                          const friendTag = f.user1Id === currentUserId ? f.user2Tag : f.user1Tag;
                          const friendPhoto = f.user1Id === currentUserId ? f.user2PhotoUrl : f.user1PhotoUrl;

                          return (
                            <div
                              key={f.id}
                              className="p-3 rounded-xl bg-[#010703] border border-green-500/30 flex items-center justify-between gap-2.5"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {friendPhoto ? (
                                  <img
                                    src={friendPhoto}
                                    alt={friendTag}
                                    className="w-9 h-9 rounded-full object-cover border border-emerald-400 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center font-display font-bold text-xs text-emerald-300 flex-shrink-0">
                                    {friendTag.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold font-display text-white truncate">
                                    {friendTag}
                                  </p>
                                  <span className="text-[10px] font-mono text-emerald-400">Squad Friend</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  playSketchClick();
                                  setActiveRecipient({
                                    uid: friendUid,
                                    gamerTag: friendTag,
                                    photoUrl: friendPhoto,
                                  });
                                }}
                                className="px-2.5 py-1 text-xs font-display font-bold bg-lime-400 hover:bg-lime-300 text-black rounded-lg shadow-[0_0_10px_rgba(163,230,53,0.5)] cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                              >
                                Chat 1-on-1
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
