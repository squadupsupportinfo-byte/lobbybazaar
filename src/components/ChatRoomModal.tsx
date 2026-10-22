import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Users,
  Radio,
  MapPin,
  Mic,
  MicOff,
  ExternalLink,
  Shield,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Lock,
} from 'lucide-react';
import { SquadBeacon, ChatRoomMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { subscribeRoomMessages, sendRoomMessage, getSavedLocalChatRooms } from '../utils/chatRoomService';
import { playSketchClick, playMessagePopSound, playRadarPing } from '../utils/audio';
import { GameRoomBuilding3D } from './GameRoomBuilding3D';
import { VoiceRoomSession, RoomPeer } from '../utils/voiceRoomService';
import { acquireCrossDeviceMicrophone, getPlatformMicErrorMessage } from '../utils/microphoneService';

interface ChatRoomModalProps {
  room: SquadBeacon | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteRoom?: (roomId: string) => void;
  onOpenSocialProfile?: (target: any) => void;
  onOpenAuthModal?: (mode: 'signup' | 'signin') => void;
}

export function ChatRoomModal({
  room,
  isOpen,
  onClose,
  onDeleteRoom,
  onOpenSocialProfile,
  onOpenAuthModal,
}: ChatRoomModalProps) {
  const { user, gamerProfile } = useAuth();
  const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isTestVoice, setIsTestVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  // WebRTC Real-Time Voice Chat & Peer Presence
  const [voicePeers, setVoicePeers] = useState<RoomPeer[]>([]);
  const [remoteSpeaking, setRemoteSpeaking] = useState<Record<string, boolean>>({});
  const [speakerVolume, setSpeakerVolume] = useState<number>(1.0);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);
  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);
  const voiceSessionRef = useRef<VoiceRoomSession | null>(null);
  const localPeerIdRef = useRef<string>('');

  // Persistent guest identity if user is browsing without sign-in
  if (!localPeerIdRef.current) {
    if (user?.uid) {
      localPeerIdRef.current = user.uid;
    } else {
      let stored = localStorage.getItem('squadup_guest_id');
      if (!stored) {
        stored = `guest_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('squadup_guest_id', stored);
      }
      localPeerIdRef.current = stored;
    }
  } else if (user?.uid && localPeerIdRef.current !== user.uid) {
    localPeerIdRef.current = user.uid;
  }

  const effectiveUserId = localPeerIdRef.current;
  const effectiveGamerTag =
    gamerProfile?.gamerTag ||
    user?.displayName ||
    localStorage.getItem('squadup_guest_tag') ||
    `Gamer_${effectiveUserId.slice(-4)}`;
  const effectivePhotoUrl = gamerProfile?.photoUrl || user?.photoURL || undefined;
  const effectiveAvatar = gamerProfile?.characterAvatar || 'waving';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Turn off microphone and clean up audio tracks
  const turnOffMic = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (analyserSourceRef.current) {
      try {
        analyserSourceRef.current.disconnect();
      } catch {}
      analyserSourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }

    // Notify WebRTC voice session that mic is turned off
    if (voiceSessionRef.current) {
      voiceSessionRef.current.setLocalStream(null, false).catch(() => {});
      voiceSessionRef.current.setSpeakingStatus(false).catch(() => {});
    }

    setIsMicOn(false);
    setIsTestVoice(false);
    setIsSpeaking(false);
  };

  const enableTestVoiceMode = () => {
    setMicError(null);
    setIsMicOn(true);
    setIsTestVoice(true);
    setIsSpeaking(true);
    if (voiceSessionRef.current) {
      voiceSessionRef.current.setSpeakingStatus(true).catch(() => {});
    }
    setTimeout(() => {
      setIsSpeaking(false);
      voiceSessionRef.current?.setSpeakingStatus(false).catch(() => {});
    }, 1200);
    playSketchClick();
  };

  // Turn on microphone with universal cross-device acquisition, WebRTC streaming & voice dictation
  const turnOnMic = async () => {
    setMicError(null);
    playSketchClick();

    if (isRoomFull && !isOwner && !voicePeers.some((p) => p.userId === effectiveUserId)) {
      setMicError('This room is at maximum capacity (5 gamers - host included). You can listen in or wait for a spot to open.');
      return;
    }

    try {
      // Universal cross-device microphone acquisition with fallback for iOS Safari and mobile
      const { stream } = await acquireCrossDeviceMicrophone();
      mediaStreamRef.current = stream;
      setIsMicOn(true);
      setIsTestVoice(false);

      // CRITICAL: Transmit real microphone audio stream to all peers in the room via WebRTC!
      if (voiceSessionRef.current) {
        await voiceSessionRef.current.setLocalStream(stream, true);
        await voiceSessionRef.current.ensureAudioPlayback();
      }

      // Real-time audio analyser for speaking wave indicator
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx =
            voiceSessionRef.current?.getOrCreateAudioContext() ||
            audioContextRef.current ||
            new AudioCtx({ latencyHint: 'interactive' });
          audioContextRef.current = audioCtx;
          // Crucial on iOS Safari & mobile browsers: AudioContext starts suspended until resumed on user gesture
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume().catch(() => {});
          }
          // Direct audio source connection without cloning (track cloning on iOS can kill mic input)
          const source = audioCtx.createMediaStreamSource(stream);
          analyserSourceRef.current = source;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!mediaStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            // Calibrated speaking threshold sensitive across all device mics
            const speakingNow = avg > 11;
            setIsSpeaking(speakingNow);
            if (voiceSessionRef.current) {
              voiceSessionRef.current.setSpeakingStatus(speakingNow).catch(() => {});
            }
            animationFrameRef.current = requestAnimationFrame(checkVolume);
          };
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        }
      } catch (err) {
        console.warn('Audio analyser notice:', err);
      }
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setIsMicOn(false);
      const friendlyMsg = getPlatformMicErrorMessage(err);
      setMicError(friendlyMsg);
    }
  };

  const toggleMic = () => {
    if (isMicOn) {
      turnOffMic();
    } else {
      turnOnMic();
    }
  };

  // WebRTC Voice Session Lifecycle: Automatically connect when entering room, cleanup on leave
  useEffect(() => {
    if (!room || !isOpen) {
      if (voiceSessionRef.current) {
        voiceSessionRef.current.leave();
        voiceSessionRef.current = null;
      }
      setVoicePeers([]);
      setRemoteSpeaking({});
      return;
    }

    const session = new VoiceRoomSession(room.id, effectiveUserId, {
      userId: effectiveUserId,
      gamerTag: effectiveGamerTag,
      photoUrl: effectivePhotoUrl,
    });
    voiceSessionRef.current = session;

    const unsubPeers = session.onPeersChange((peers) => {
      setVoicePeers(peers);
    });

    const unsubSpeaking = session.onRemoteSpeakingChange((status) => {
      setRemoteSpeaking(status);
    });

    const unsubBlocked = session.onAutoplayBlockedChange((blocked) => {
      setIsAutoplayBlocked(blocked);
    });

    const unsubVol = session.onSpeakerVolumeChange((vol, muted) => {
      setSpeakerVolume(vol);
      setIsSpeakerMuted(muted);
    });

    session.init().catch((err) => {
      console.warn('Voice session init notice:', err);
    });
    // Immediately unlock audio during the opening user click/tap
    session.ensureAudioPlayback().catch(() => {});

    return () => {
      unsubPeers();
      unsubSpeaking();
      unsubBlocked();
      unsubVol();
      session.leave();
      if (voiceSessionRef.current === session) {
        voiceSessionRef.current = null;
      }
    };
  }, [room?.id, isOpen, effectiveUserId, effectiveGamerTag, effectivePhotoUrl]);

  const handleToggleSpeakerMute = () => {
    playSketchClick();
    if (voiceSessionRef.current) {
      voiceSessionRef.current.toggleSpeakerMute();
      voiceSessionRef.current.ensureAudioPlayback().catch(() => {});
    }
  };

  const handleSpeakerVolumeChange = (newVol: number) => {
    if (voiceSessionRef.current) {
      voiceSessionRef.current.setSpeakerVolume(newVol);
      voiceSessionRef.current.ensureAudioPlayback().catch(() => {});
    }
  };

  const handleTestSpeakerSound = async () => {
    setIsTestingSound(true);
    if (voiceSessionRef.current) {
      await voiceSessionRef.current.testSpeakerTone();
      await voiceSessionRef.current.ensureAudioPlayback();
    }
    setTimeout(() => setIsTestingSound(false), 500);
  };

  const handleEnableAudio = async () => {
    playSketchClick();
    if (voiceSessionRef.current) {
      await voiceSessionRef.current.ensureAudioPlayback();
      await voiceSessionRef.current.testSpeakerTone();
    }
  };

  // CRITICAL REQUIREMENT: Automatically turn off mic when user leaves the chat room or modal closes
  useEffect(() => {
    return () => {
      turnOffMic();
      if (voiceSessionRef.current) {
        voiceSessionRef.current.leave();
        voiceSessionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      turnOffMic();
      if (voiceSessionRef.current) {
        voiceSessionRef.current.leave();
        voiceSessionRef.current = null;
      }
    }
  }, [isOpen]);

  const handleCloseRoom = () => {
    playSketchClick();
    turnOffMic();
    if (voiceSessionRef.current) {
      voiceSessionRef.current.leave();
      voiceSessionRef.current = null;
    }
    onClose();
  };

  // Subscribe to real-time room messages
  useEffect(() => {
    if (!room || !isOpen) {
      setMessages([]);
      return;
    }

    const unsub = subscribeRoomMessages(room.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsub();
  }, [room?.id, isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseRoom();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');
    playMessagePopSound();

    const senderId = effectiveUserId;
    const senderName = effectiveGamerTag;
    const senderPhoto = effectivePhotoUrl;
    const senderAvatar = effectiveAvatar;

    await sendRoomMessage(room.id, {
      senderId,
      senderName,
      senderPhoto,
      senderAvatar,
      text,
    });

    // User gesture ensures audio output continues uninterrupted
    voiceSessionRef.current?.ensureAudioPlayback().catch(() => {});
  };

  const handleCopyLink = () => {
    playSketchClick();
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!isOpen || !room) return null;

  const MAX_ROOM_CAPACITY = 5;
  const isOwner = Boolean(
    (user && room.ownerId && user.uid === room.ownerId) ||
    (user && room.chatRoomData?.hostId && user.uid === room.chatRoomData?.hostId) ||
    (getSavedLocalChatRooms().some((r) => r.id === room.id))
  );
  const roomData = room.chatRoomData;
  const currentMembersCount = Math.min(
    MAX_ROOM_CAPACITY,
    Math.max(voicePeers.length, roomData?.activeUsersCount || room.currentMembers || room.members?.length || 1, 1)
  );
  const isRoomFull = currentMembersCount >= MAX_ROOM_CAPACITY;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        voiceSessionRef.current?.ensureAudioPlayback().catch(() => {});
        if (e.target === e.currentTarget) {
          handleCloseRoom();
        }
      }}
      className="fixed inset-0 z-[105] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          voiceSessionRef.current?.ensureAudioPlayback().catch(() => {});
        }}
        className="relative w-full max-w-2xl bg-[#030c07] text-slate-100 rounded-2xl border-2 border-cyan-400 p-4 sm:p-6 shadow-[0_0_55px_rgba(6,182,212,0.5)] my-auto flex flex-col max-h-[92vh] select-none cursor-default"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Close Button - Automatically turns off microphone */}
        <button
          type="button"
          onClick={handleCloseRoom}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer z-10"
          title="Leave Room [Esc] (Turns off mic)"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Room Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/30 pr-8">
          <div className="flex items-center gap-3">
            <div className="relative p-1.5 rounded-xl bg-gradient-to-b from-slate-900 via-indigo-950/70 to-slate-900 border-2 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)] ring-1 ring-cyan-400/40 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {/* Radial backlight spotlight to illuminate 3D building silhouette */}
              <div
                className="absolute inset-0 pointer-events-none opacity-80"
                style={{
                  background:
                    'radial-gradient(circle at 50% 55%, rgba(6,182,212,0.35) 0%, rgba(147,51,234,0.2) 50%, transparent 85%)',
                }}
              />
              <GameRoomBuilding3D roomTitle={room.name} width={100} height={84} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black font-display text-white tracking-wide truncate">
                  {room.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-black font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block" />
                  <span>LIVE CHAT</span>
                </span>
                {/* 5 Users Capacity Limit Badge (Host Included) */}
                <span
                  className={`px-2 py-0.5 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 border shadow ${
                    isRoomFull
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500/60'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  <Users className="w-2.5 h-2.5" />
                  <span>{currentMembersCount} / 5 GAMERS (HOST INCL.)</span>
                  {isRoomFull && <span className="text-amber-400 font-extrabold">(FULL)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-sketch text-cyan-200/90 mt-0.5 flex-wrap">
                <span className="text-slate-300">
                  Host: <strong className="text-white font-bold">{roomData?.hostName || room.name}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{room.sector || 'Global Sector'}</span>
                </span>
                {/* Voice Status Indicator in Header */}
                {isMicOn ? (
                  <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-400 text-[10px] font-mono font-bold animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    <Mic className="w-2.5 h-2.5 text-emerald-300" />
                    <span>MIC LIVE ON {isSpeaking && '· SPEAKING'}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700 text-[10px] font-mono">
                    <MicOff className="w-2.5 h-2.5 text-slate-400" />
                    <span>MIC OFF</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0 flex-wrap">
            {/* Interactive Mic On / Mic Off Button for all participants */}
            <button
              type="button"
              onClick={toggleMic}
              className={`px-3 py-1.5 rounded-lg text-xs font-sketch flex items-center gap-1.5 transition-all cursor-pointer border shadow ${
                isMicOn
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.8)] font-bold animate-pulse'
                  : 'bg-black/70 hover:bg-white/10 text-slate-300 hover:text-white border-white/20'
              }`}
              title={isMicOn ? 'Turn Off Mic (Leaving room also turns off mic)' : 'Turn On Mic (Talk via voice or chat)'}
            >
              {isMicOn ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-black" />
                  <span>Mic On {isSpeaking && '🎙️'}</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mic Off</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 bg-black/60 hover:bg-white/10 text-slate-300 hover:text-white border border-white/20 rounded-lg text-xs font-sketch flex items-center gap-1 transition-colors cursor-pointer"
              title="Share Room link"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
              <span>{isCopied ? 'Copied!' : 'Share'}</span>
            </button>

            {isOwner && onDeleteRoom && (
              <button
                type="button"
                onClick={() => {
                  playRadarPing();
                  turnOffMic();
                  onDeleteRoom(room.id);
                  onClose();
                }}
                className="px-2.5 py-1.5 border border-red-500 rounded-lg text-xs font-sketch flex items-center gap-1 transition-all cursor-pointer bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] active:scale-95"
                title="Close and remove this room from the map"
              >
                <Trash2 className="w-3 h-3" />
                <span>Close Room</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Voice Active Notification Banner */}
        {isMicOn && (
          <div className="my-2 p-2 px-3 rounded-xl bg-emerald-950/80 border border-emerald-400/60 flex items-center justify-between text-xs font-mono text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-in fade-in duration-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="font-bold text-white">
                🎙️ {isTestVoice ? 'Voice Active (Broadcasting)' : 'Voice Live'}: You can talk through voice or chat
              </span>
              {isSpeaking && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-black font-extrabold text-[10px] animate-pulse">
                  SPEAKING...
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={turnOffMic}
              className="text-[11px] underline text-emerald-300 hover:text-white cursor-pointer ml-2 flex-shrink-0"
            >
              Turn Off
            </button>
          </div>
        )}

        {/* Room Full Notification Banner (5 Users Max - Host Included) */}
        {isRoomFull && !isOwner && !voicePeers.some((p) => p.userId === effectiveUserId) && (
          <div className="my-2 p-2.5 px-3 rounded-xl bg-amber-950/90 border-2 border-amber-500/80 flex items-center justify-between text-xs font-mono text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="text-[11px] leading-tight">
                <strong className="text-amber-300">Room at Capacity (5/5 Gamers - Host Included):</strong> You are currently listening in. You can speak once another member leaves.
              </span>
            </div>
          </div>
        )}

        {/* Mic Error Notice with Direct Recovery Action */}
        {micError && (
          <div className="my-2 p-3 rounded-xl bg-amber-950/90 border-2 border-amber-500 text-xs font-sketch text-amber-100 flex flex-col gap-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0">🎙️</span>
                <div>
                  <strong className="text-amber-300 font-bold block">Microphone Notice</strong>
                  <p className="text-slate-200 text-[11px] leading-relaxed mt-0.5">{micError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMicError(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 flex-shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-amber-500/30 flex-wrap">
              <button
                type="button"
                onClick={turnOnMic}
                className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-black font-bold font-mono text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>🔄 Retry Mic</span>
              </button>
              <button
                type="button"
                onClick={enableTestVoiceMode}
                className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Mic className="w-3 h-3 text-black" />
                <span>🎙️ Use Voice Mode</span>
              </button>
              <span className="text-[10px] text-amber-200/80 font-mono">
                (Tip: Check the 🔒 URL lock icon in your browser address bar)
              </span>
            </div>
          </div>
        )}

        {/* Room Description & Topic Header Banner */}
        <div className="my-2 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-2.5 text-xs">
          <div className="text-cyan-400 mt-0.5 flex-shrink-0">📢</div>
          <div className="flex-1 min-w-0">
            <div className="text-cyan-300 font-bold font-display text-[11px] uppercase tracking-wider">
              {roomData?.topic || room.game}
            </div>
            <p className="text-slate-300 font-sketch text-xs mt-0.5">
              {room.description || 'Welcome to the live chat room! Connect with nearby gamers.'}
            </p>
          </div>
          <div className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-500/30 flex-shrink-0">
            <span>Limit: 5 Gamers (Host Included)</span>
          </div>
          {room.discordServer && (
            <a
              href={room.discordServer.startsWith('http') ? room.discordServer : `https://${room.discordServer}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-400 text-indigo-200 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <span>Discord</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        {/* Real-Time WebRTC Voice Room Participants & Speaking Status */}
        <div className="my-1.5 p-2 px-3 rounded-xl bg-gradient-to-r from-slate-950 via-[#04130d] to-slate-950 border border-cyan-500/30 flex flex-col gap-2 text-xs shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="font-bold uppercase tracking-wider">
                  Voice Room ({Math.max(1, voicePeers.length)} in Voice)
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>WebRTC 2-Way Audio</span>
              </div>
            </div>

            {/* Device Speaker & Volume Controls */}
            <div className="flex items-center gap-2 bg-black/60 px-2 py-1 rounded-lg border border-cyan-500/20 text-[11px] font-mono">
              <button
                type="button"
                onClick={handleToggleSpeakerMute}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isSpeakerMuted
                    ? 'text-red-400 hover:text-red-300 bg-red-950/60'
                    : 'text-cyan-300 hover:text-white hover:bg-white/10'
                }`}
                title={isSpeakerMuted ? 'Unmute Incoming Audio' : 'Mute Incoming Audio'}
              >
                {isSpeakerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isSpeakerMuted ? 0 : speakerVolume}
                  onChange={(e) => handleSpeakerVolumeChange(parseFloat(e.target.value))}
                  className="w-14 sm:w-20 h-1 accent-cyan-400 cursor-pointer bg-slate-800 rounded-lg"
                  title={`Speaker Volume: ${Math.round(speakerVolume * 100)}%`}
                />
                <span className="text-[9px] text-slate-400 w-6 text-right">
                  {isSpeakerMuted ? 'OFF' : `${Math.round(speakerVolume * 100)}%`}
                </span>
              </div>

              {/* Sound Check / Test Speaker Output Button */}
              <button
                type="button"
                onClick={handleTestSpeakerSound}
                disabled={isTestingSound}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  isTestingSound
                    ? 'bg-emerald-400 text-black border-emerald-300 scale-95'
                    : 'bg-cyan-950/70 hover:bg-cyan-900 text-cyan-200 border-cyan-400/40'
                }`}
                title="Play a test chime to verify your device speakers/headphones can output audio"
              >
                <span>{isTestingSound ? '🔊 Testing...' : '🔊 Test Sound'}</span>
              </button>
            </div>
          </div>

          {/* Autoplay Pause / Browser Block Alert Banner */}
          {isAutoplayBlocked && (
            <div className="p-2 px-3 bg-amber-950/90 border-2 border-amber-400 rounded-lg flex items-center justify-between gap-2 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse">
              <div className="flex items-center gap-2">
                <VolumeX className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
                <span className="text-[11px] leading-tight">
                  <strong className="text-amber-300">Browser paused incoming sound!</strong> Click here to hear other gamers:
                </span>
              </div>
              <button
                type="button"
                onClick={handleEnableAudio}
                className="px-3 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs shadow-md cursor-pointer flex-shrink-0 transition-transform active:scale-95"
              >
                🔊 Hear Others Now
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {/* Local User Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono flex-shrink-0 transition-all ${
                isMicOn
                  ? isSpeaking
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-1 ring-emerald-300'
                    : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950/90 border-slate-700/60 text-slate-400'
              }`}
            >
              <div className="relative flex-shrink-0">
                {effectivePhotoUrl ? (
                  <img
                    src={effectivePhotoUrl}
                    alt="You"
                    className="w-5 h-5 rounded-full object-cover border border-cyan-400/60"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-200 text-[10px] flex items-center justify-center font-bold">
                    {effectiveGamerTag.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {isMicOn && isSpeaking && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <span className="font-bold max-w-[90px] truncate">
                {effectiveGamerTag} (You)
              </span>
              {isMicOn ? (
                <span className="flex items-center gap-0.5 text-emerald-300">
                  <Mic className={`w-3 h-3 ${isSpeaking ? 'text-emerald-300 animate-bounce' : 'text-emerald-400'}`} />
                  {isSpeaking && <span className="text-[9px] font-extrabold uppercase">TALKING</span>}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-slate-500">
                  <MicOff className="w-3 h-3" />
                  <span className="text-[9px]">Muted</span>
                </span>
              )}
            </div>

            {/* Remote Participants */}
            {voicePeers
              .filter((p) => p.peerId !== effectiveUserId)
              .map((p) => {
                const isRemoteSpk = Boolean(remoteSpeaking[p.peerId] || p.isSpeaking);
                return (
                  <div
                    key={p.peerId}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono flex-shrink-0 transition-all ${
                      p.isMicOn
                        ? isRemoteSpk
                          ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-1 ring-emerald-300 animate-pulse'
                          : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/90 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.gamerTag}
                          className="w-5 h-5 rounded-full object-cover border border-cyan-400/50"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-800 text-cyan-200 text-[10px] flex items-center justify-center font-bold">
                          {p.gamerTag.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {p.isMicOn && isRemoteSpk && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>
                    <span className="font-bold max-w-[90px] truncate">{p.gamerTag}</span>
                    {p.isMicOn ? (
                      <span className="flex items-center gap-0.5 text-emerald-400">
                        <Mic className={`w-3 h-3 ${isRemoteSpk ? 'text-emerald-300 animate-bounce' : 'text-emerald-400'}`} />
                        {isRemoteSpk ? (
                          <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-300">
                            <Volume2 className="w-3 h-3 animate-pulse" />
                            <span>SPEAKING</span>
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-400/80">Live</span>
                        )}
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-slate-500">
                        <MicOff className="w-3 h-3" />
                        <span className="text-[9px]">Muted</span>
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Live Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-black/60 rounded-xl border border-cyan-500/20 min-h-[200px] max-h-[360px] scrollbar-thin scrollbar-thumb-cyan-500/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs font-sketch space-y-2">
              <MessageSquare className="w-8 h-8 text-cyan-400/60 animate-bounce" />
              <p>No messages in this chat room yet.</p>
              <p className="text-[11px] text-cyan-300">Turn on mic or type below to chat!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = Boolean(msg.senderId === effectiveUserId);
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* Sender Avatar */}
                  <div className="relative flex-shrink-0">
                    {msg.senderPhoto ? (
                      <img
                        src={msg.senderPhoto}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full object-cover border border-cyan-400"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center font-bold text-xs text-cyan-300">
                        {msg.senderName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] rounded-2xl p-2.5 ${
                      isCurrentUser
                        ? 'bg-cyan-950/90 text-white border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-[#06140b] text-slate-200 border border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-cyan-400 mb-0.5">
                      <span className="font-bold truncate">{msg.senderName}</span>
                      <span className="text-slate-400 text-[9px]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-sketch leading-relaxed break-words whitespace-pre-wrap select-text">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Live Message Input & Mic Controls */}
        <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2">
          {/* Quick Mic On/Off Button inside input row */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center flex-shrink-0 ${
              isMicOn
                ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-pulse'
                : 'bg-black/80 text-slate-400 hover:text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
            }`}
            title={isMicOn ? 'Turn Off Mic' : 'Turn On Mic (Talk via voice or chat)'}
          >
            {isMicOn ? <Mic className="w-4 h-4 text-black" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isMicOn
                ? 'Mic is ON · Speak into mic or type message...'
                : `Chat live in ${room.name}...`
            }
            maxLength={300}
            className="flex-1 px-3.5 py-2.5 bg-black/80 border border-cyan-500/50 focus:border-cyan-400 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-sketch"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:hover:bg-cyan-400 text-black font-bold font-display text-xs rounded-xl shadow-[0_0_14px_rgba(6,182,212,0.5)] transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
