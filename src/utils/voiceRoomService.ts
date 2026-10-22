import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface RoomPeer {
  id: string; // doc id: `${roomId}_${peerId}`
  roomId: string;
  peerId: string;
  userId: string;
  gamerTag: string;
  photoUrl?: string;
  isMicOn: boolean;
  isSpeaking: boolean;
  joinedAt: number;
  lastSeen: number;
}

export interface VoiceSignal {
  id: string;
  roomId: string;
  fromPeerId: string;
  toPeerId: string;
  type: 'offer' | 'answer' | 'candidate';
  payload: string; // JSON stringified RTCSessionDescriptionInit or RTCIceCandidateInit
  createdAt: number;
}

// Multi-provider STUN fleet across Google, Cloudflare, Mozilla, and SIPgate for maximum NAT traversal on mobile cellular (4G/5G) & home networks
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
    { urls: 'stun:stun.sipgate.net:3478' },
  ],
  iceCandidatePoolSize: 10,
};

export class VoiceRoomSession {
  private roomId: string;
  private localPeerId: string;
  private userInfo: { userId: string; gamerTag: string; photoUrl?: string };
  private localStream: MediaStream | null = null;
  private isMicOn: boolean = false;
  private isSpeaking: boolean = false;
  private isClosed: boolean = false;

  // Silent fallback track to keep initial WebRTC transceivers active in both directions
  private silentTrack: MediaStreamTrack | null = null;

  // Speaker playback settings
  private speakerVolume: number = 1.0;
  private isSpeakerMuted: boolean = false;
  private isAutoplayBlocked: boolean = false;

  // PeerConnections keyed by remotePeerId
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  // Perfect Negotiation state trackers per peer
  private isMakingOffer: Map<string, boolean> = new Map();
  private ignoreOffer: Map<string, boolean> = new Map();
  // Pending candidates if remote description not yet set
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  // Remote audio elements to play remote audio streams
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  // Remote audio streams
  private remoteStreams: Map<string, MediaStream> = new Map();
  // Processed signal IDs to prevent duplicate execution
  private processedSignalIds: Set<string> = new Set();
  // Per-peer promise queue for sequential signal execution
  private signalQueues: Map<string, Promise<void>> = new Map();

  // Web Audio destination pipeline for mobile devices (iOS Safari & Android)
  private remoteAudioSources: Map<string, MediaStreamAudioSourceNode> = new Map();
  private remoteGainNodes: Map<string, GainNode> = new Map();

  // Firestore listeners
  private unsubPeers: (() => void) | null = null;
  private unsubSignals: (() => void) | null = null;
  private heartbeatInterval: any = null;
  private audioContext: AudioContext | null = null;

  // Global capture listener to unlock audio on any user gesture
  private userGestureHandler: (() => void) | null = null;

  public getOrCreateAudioContext(): AudioContext | null {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      return this.audioContext;
    }
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx({ latencyHint: 'interactive' });
        return this.audioContext;
      }
    } catch {}
    return null;
  }

  public connectRemoteWebAudio(peerId: string, stream: MediaStream) {
    try {
      const ctx = this.getOrCreateAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (!this.remoteAudioSources.has(peerId)) {
        const source = ctx.createMediaStreamSource(stream);
        const gain = ctx.createGain();
        gain.gain.value = this.isSpeakerMuted ? 0 : this.speakerVolume;
        source.connect(gain);
        gain.connect(ctx.destination);
        this.remoteAudioSources.set(peerId, source);
        this.remoteGainNodes.set(peerId, gain);
      }
    } catch (err) {
      console.warn(`Web Audio connect error for peer ${peerId}:`, err);
    }
  }

  public disconnectRemoteWebAudio(peerId: string) {
    try {
      const src = this.remoteAudioSources.get(peerId);
      if (src) {
        src.disconnect();
        this.remoteAudioSources.delete(peerId);
      }
      const gain = this.remoteGainNodes.get(peerId);
      if (gain) {
        gain.disconnect();
        this.remoteGainNodes.delete(peerId);
      }
    } catch {}
  }

  // Event callbacks
  private onPeersChangeCallbacks: Set<(peers: RoomPeer[]) => void> = new Set();
  private onRemoteSpeakingCallbacks: Set<(status: Record<string, boolean>) => void> = new Set();
  private onAutoplayBlockedCallbacks: Set<(blocked: boolean) => void> = new Set();
  private onSpeakerVolumeCallbacks: Set<(vol: number, muted: boolean) => void> = new Set();

  constructor(
    roomId: string,
    localPeerId: string,
    userInfo: { userId: string; gamerTag: string; photoUrl?: string }
  ) {
    this.roomId = roomId;
    this.localPeerId = localPeerId;
    this.userInfo = userInfo;
  }

  public getPeerId() {
    return this.localPeerId;
  }

  public getRoomId() {
    return this.roomId;
  }

  public getRemoteStreams() {
    return this.remoteStreams;
  }

  public getSpeakerVolume() {
    return this.speakerVolume;
  }

  public getIsSpeakerMuted() {
    return this.isSpeakerMuted;
  }

  public getIsAutoplayBlocked() {
    return this.isAutoplayBlocked;
  }

  public onPeersChange(cb: (peers: RoomPeer[]) => void) {
    this.onPeersChangeCallbacks.add(cb);
    return () => this.onPeersChangeCallbacks.delete(cb);
  }

  public onRemoteSpeakingChange(cb: (status: Record<string, boolean>) => void) {
    this.onRemoteSpeakingCallbacks.add(cb);
    return () => this.onRemoteSpeakingCallbacks.delete(cb);
  }

  public onAutoplayBlockedChange(cb: (blocked: boolean) => void) {
    this.onAutoplayBlockedCallbacks.add(cb);
    cb(this.isAutoplayBlocked);
    return () => this.onAutoplayBlockedCallbacks.delete(cb);
  }

  public onSpeakerVolumeChange(cb: (vol: number, muted: boolean) => void) {
    this.onSpeakerVolumeCallbacks.add(cb);
    cb(this.speakerVolume, this.isSpeakerMuted);
    return () => this.onSpeakerVolumeCallbacks.delete(cb);
  }

  private notifyAutoplayBlocked(blocked: boolean) {
    if (this.isAutoplayBlocked !== blocked) {
      this.isAutoplayBlocked = blocked;
      this.onAutoplayBlockedCallbacks.forEach((cb) => cb(blocked));
    }
  }

  private notifySpeakerVolume() {
    this.onSpeakerVolumeCallbacks.forEach((cb) =>
      cb(this.speakerVolume, this.isSpeakerMuted)
    );
  }

  // Adjust incoming speaker volume (0.0 to 1.0)
  public setSpeakerVolume(vol: number) {
    this.speakerVolume = Math.max(0, Math.min(1, vol));
    for (const [, audioEl] of this.remoteAudioElements) {
      audioEl.volume = this.isSpeakerMuted ? 0 : this.speakerVolume;
    }
    for (const [, gainNode] of this.remoteGainNodes) {
      try {
        gainNode.gain.value = this.isSpeakerMuted ? 0 : this.speakerVolume;
      } catch {}
    }
    this.notifySpeakerVolume();
  }

  // Toggle incoming speaker mute
  public toggleSpeakerMute(): boolean {
    this.isSpeakerMuted = !this.isSpeakerMuted;
    for (const [, audioEl] of this.remoteAudioElements) {
      audioEl.muted = this.isSpeakerMuted;
      audioEl.volume = this.isSpeakerMuted ? 0 : this.speakerVolume;
    }
    for (const [, gainNode] of this.remoteGainNodes) {
      try {
        gainNode.gain.value = this.isSpeakerMuted ? 0 : this.speakerVolume;
      } catch {}
    }
    this.notifySpeakerVolume();
    return this.isSpeakerMuted;
  }

  // Generate an inert silent track so browsers immediately negotiate sendrecv Opus media lines upfront
  private getSilentTrack(): MediaStreamTrack | null {
    if (this.silentTrack && this.silentTrack.readyState === 'live') {
      return this.silentTrack;
    }
    try {
      const ctx = this.getOrCreateAudioContext();
      if (ctx) {
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        const track = dst.stream.getAudioTracks()[0];
        track.enabled = false;
        this.silentTrack = track;
        return track;
      }
    } catch {}
    return null;
  }

  // Play a quick test tone through device speakers to verify speaker output and unlock browser audio
  public async testSpeakerTone(): Promise<boolean> {
    try {
      await this.ensureAudioPlayback();
      const ctx = this.getOrCreateAudioContext();
      if (!ctx) return false;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.25 * this.speakerVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
      return true;
    } catch (err) {
      console.warn('Test speaker tone error:', err);
      return false;
    }
  }

  // Ensure all remote audio elements are playing and Web Audio is unblocked across mobile browsers
  public async ensureAudioPlayback(): Promise<void> {
    try {
      // 1. Silent HTML5 audio element activation for mobile Safari / Chrome
      try {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silentAudio.volume = 0.0001;
        silentAudio.play().then(() => silentAudio.remove()).catch(() => {});
      } catch {}

      // 2. Resume Web Audio Context (unblocks audio hardware on iOS Safari and Android)
      const ctx = this.getOrCreateAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      // 3. Unmute and play all remote HTMLAudio elements, using Web Audio destination as mobile fallback
      let allSucceeded = true;
      for (const [peerId, audioEl] of this.remoteAudioElements) {
        audioEl.muted = this.isSpeakerMuted;
        audioEl.volume = this.isSpeakerMuted ? 0 : this.speakerVolume;

        if (!this.isSpeakerMuted) {
          try {
            await audioEl.play();
            // Audio element is playing smoothly: disconnect duplicate Web Audio pipe
            this.disconnectRemoteWebAudio(peerId);
          } catch {
            allSucceeded = false;
            // HTML5 audio paused or blocked by mobile autoplay: route through Web Audio destination
            const stream = this.remoteStreams.get(peerId);
            if (stream) {
              this.connectRemoteWebAudio(peerId, stream);
            }
          }
        }
      }

      // 4. Ensure Web Audio destination pipeline is active for any stream where HTML element is not playing
      if (ctx && ctx.state === 'running') {
        for (const [peerId, stream] of this.remoteStreams) {
          const audioEl = this.remoteAudioElements.get(peerId);
          if (audioEl && (audioEl.paused || audioEl.muted) && !this.isSpeakerMuted) {
            this.connectRemoteWebAudio(peerId, stream);
          }
        }
      }

      if (allSucceeded && this.remoteAudioElements.size > 0) {
        this.notifyAutoplayBlocked(false);
      }
    } catch (err) {
      console.warn('ensureAudioPlayback notice:', err);
    }
  }

  // Initialize presence, signaling, and global user gesture unlock in Firestore
  public async init() {
    const joinedAt = Date.now();

    // 1. Announce presence in room_peers
    await this.updatePresence(false, false);

    // 2. Set up heartbeat to keep presence fresh
    this.heartbeatInterval = setInterval(() => {
      if (!this.isClosed) {
        this.updatePresence(this.isMicOn, this.isSpeaking).catch(() => {});
      }
    }, 15000);

    // 3. Global capture-phase user gesture listener
    this.userGestureHandler = () => {
      this.ensureAudioPlayback().catch(() => {});
    };
    document.addEventListener('click', this.userGestureHandler, true);
    document.addEventListener('touchstart', this.userGestureHandler, true);
    document.addEventListener('keydown', this.userGestureHandler, true);

    // 4. Listen to peers in the room
    const peersQuery = query(
      collection(db, 'room_peers'),
      where('roomId', '==', this.roomId)
    );

    this.unsubPeers = onSnapshot(
      peersQuery,
      async (snapshot) => {
        if (this.isClosed) return;
        const peers: RoomPeer[] = [];
        const currentRemoteIds = new Set<string>();

        snapshot.forEach((d) => {
          const peer = d.data() as RoomPeer;
          if (peer && peer.peerId) {
            peers.push(peer);
            if (peer.peerId !== this.localPeerId) {
              currentRemoteIds.add(peer.peerId);
            }
          }
        });

        // Notify UI about peers
        this.onPeersChangeCallbacks.forEach((cb) => cb(peers));

        // Connect to any new peers
        for (const remotePeer of peers) {
          if (remotePeer.peerId === this.localPeerId) continue;
          if (!this.peerConnections.has(remotePeer.peerId)) {
            await this.handleNewPeer(remotePeer.peerId);
          }
        }

        // Clean up peers that left
        for (const [remotePeerId] of this.peerConnections) {
          if (!currentRemoteIds.has(remotePeerId)) {
            this.handlePeerLeft(remotePeerId);
          }
        }
      },
      (err) => {
        console.warn('VoiceRoomSession peers listener notice:', err);
      }
    );

    // 5. Listen to WebRTC signals targeted to this local peer
    const signalsQuery = query(
      collection(db, 'room_signals'),
      where('roomId', '==', this.roomId),
      where('toPeerId', '==', this.localPeerId)
    );

    this.unsubSignals = onSnapshot(
      signalsQuery,
      async (snapshot) => {
        if (this.isClosed) return;
        for (const docChange of snapshot.docChanges()) {
          if (docChange.type === 'added') {
            const signal = docChange.doc.data() as VoiceSignal;
            if (!signal || this.processedSignalIds.has(docChange.doc.id)) continue;
            this.processedSignalIds.add(docChange.doc.id);

            // Allow 60 seconds grace window for cross-device clock skew
            if (signal.createdAt && signal.createdAt < joinedAt - 60000) {
              deleteDoc(doc(db, 'room_signals', docChange.doc.id)).catch(() => {});
              continue;
            }

            // Route through per-peer sequential queue to prevent async race conditions
            this.enqueueSignal(signal.fromPeerId, signal);

            // Clean up consumed signal doc
            deleteDoc(doc(db, 'room_signals', docChange.doc.id)).catch(() => {});
          }
        }
      },
      (err) => {
        console.warn('VoiceRoomSession signals listener notice:', err);
      }
    );
  }

  // Sequential per-peer queue for processing WebRTC signals
  private enqueueSignal(peerId: string, signal: VoiceSignal) {
    const currentQueue = this.signalQueues.get(peerId) || Promise.resolve();
    const nextQueue = currentQueue
      .then(async () => {
        if (!this.isClosed) {
          await this.handleIncomingSignal(signal);
        }
      })
      .catch((err) => {
        console.warn(`Signal queue error for peer ${peerId}:`, err);
      });

    this.signalQueues.set(peerId, nextQueue);
  }

  // Update presence doc in Firestore
  private async updatePresence(isMicOn: boolean, isSpeaking: boolean) {
    if (this.isClosed) return;
    try {
      const docRef = doc(db, 'room_peers', `${this.roomId}_${this.localPeerId}`);
      await setDoc(
        docRef,
        {
          id: `${this.roomId}_${this.localPeerId}`,
          roomId: this.roomId,
          peerId: this.localPeerId,
          userId: this.userInfo.userId,
          gamerTag: this.userInfo.gamerTag,
          photoUrl: this.userInfo.photoUrl || null,
          isMicOn,
          isSpeaking,
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Presence update notice:', err);
    }
  }

  // Supply or update local audio stream (instant zero-delay track replacement)
  public async setLocalStream(stream: MediaStream | null, isMicOn: boolean) {
    this.localStream = stream;
    this.isMicOn = isMicOn;

    const audioTrack = stream ? stream.getAudioTracks()[0] : null;
    if (audioTrack) {
      audioTrack.enabled = true;
      audioTrack.onunmute = () => {
        audioTrack.enabled = true;
      };
    }

    const trackToSend = audioTrack || this.getSilentTrack();

    // Instant seamless track replacement across all active peer connections
    for (const [remotePeerId, pc] of this.peerConnections) {
      try {
        const transceivers = pc.getTransceivers();
        const audioTransceiver =
          transceivers.find(
            (t) =>
              t.receiver.track.kind === 'audio' ||
              t.sender.track?.kind === 'audio'
          ) || transceivers[0];

        if (audioTransceiver && audioTransceiver.sender) {
          let needsRenegotiate = false;
          if (audioTransceiver.direction !== 'sendrecv') {
            audioTransceiver.direction = 'sendrecv';
            needsRenegotiate = true;
          }
          await audioTransceiver.sender.replaceTrack(trackToSend);
          if (needsRenegotiate && pc.signalingState === 'stable') {
            this.renegotiatePeer(remotePeerId).catch(() => {});
          }
        } else {
          const senders = pc.getSenders();
          const audioSender =
            senders.find((s) => s.track?.kind === 'audio') || senders[0];
          if (audioSender) {
            await audioSender.replaceTrack(trackToSend);
          } else if (audioTrack) {
            pc.addTrack(audioTrack, stream!);
            if (pc.signalingState === 'stable') {
              this.renegotiatePeer(remotePeerId).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn(`Track update error for peer ${remotePeerId}:`, err);
      }
    }

    await this.updatePresence(isMicOn, this.isSpeaking);

    // Unblock audio playback for incoming peers on mic activation
    this.ensureAudioPlayback().catch(() => {});
  }

  public async setSpeakingStatus(isSpeaking: boolean) {
    if (this.isSpeaking !== isSpeaking) {
      this.isSpeaking = isSpeaking;
      await this.updatePresence(this.isMicOn, isSpeaking);
    }
  }

  private isPolite(remotePeerId: string): boolean {
    return this.localPeerId < remotePeerId;
  }

  private shouldInitiateOffer(remotePeerId: string): boolean {
    return this.localPeerId > remotePeerId;
  }

  private async handleNewPeer(remotePeerId: string) {
    const pc = this.createPeerConnection(remotePeerId);
    this.peerConnections.set(remotePeerId, pc);

    // Initial offer initiated by the designated initiator
    if (this.shouldInitiateOffer(remotePeerId)) {
      await this.renegotiatePeer(remotePeerId);
    }
  }

  private createPeerConnection(remotePeerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add audio transceiver upfront with an active or silent track so SDP negotiation establishes bidirectional media lines
    const trackToSend =
      (this.localStream && this.localStream.getAudioTracks()[0]) ||
      this.getSilentTrack();

    const transceiver = trackToSend
      ? pc.addTransceiver(trackToSend, { direction: 'sendrecv' })
      : pc.addTransceiver('audio', { direction: 'sendrecv' });

    if (trackToSend && transceiver.sender && !transceiver.sender.track) {
      transceiver.sender.replaceTrack(trackToSend).catch(() => {});
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(
          remotePeerId,
          'candidate',
          JSON.stringify(event.candidate.toJSON())
        );
      }
    };

    // Remote audio track handler
    pc.ontrack = (event) => {
      if (event.track.kind !== 'audio') return;
      event.track.enabled = true;

      const [remoteStream] = event.streams;
      const stream = remoteStream || new MediaStream([event.track]);
      this.remoteStreams.set(remotePeerId, stream);

      // Create / update remote audio playback element
      let audioEl = this.remoteAudioElements.get(remotePeerId);
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.setAttribute('data-peer-id', remotePeerId);
        audioEl.autoplay = true;
        (audioEl as any).playsInline = true;
        audioEl.setAttribute('playsinline', 'true');
        audioEl.setAttribute('webkit-playsinline', 'true');
        audioEl.volume = this.isSpeakerMuted ? 0 : this.speakerVolume;
        audioEl.muted = false;

        // Position off-screen in DOM to prevent browser pausing
        audioEl.style.position = 'fixed';
        audioEl.style.bottom = '0';
        audioEl.style.left = '0';
        audioEl.style.width = '1px';
        audioEl.style.height = '1px';
        audioEl.style.opacity = '0.001';
        audioEl.style.pointerEvents = 'none';
        audioEl.style.zIndex = '-9999';

        document.body.appendChild(audioEl);
        this.remoteAudioElements.set(remotePeerId, audioEl);
      }

      audioEl.srcObject = stream;
      audioEl.muted = false;
      audioEl.volume = this.isSpeakerMuted ? 0 : this.speakerVolume;

      const tryPlay = async () => {
        if (!audioEl) return;
        audioEl.muted = this.isSpeakerMuted;
        audioEl.volume = this.isSpeakerMuted ? 0 : this.speakerVolume;

        try {
          await audioEl.play();
          this.notifyAutoplayBlocked(false);
          this.disconnectRemoteWebAudio(remotePeerId);
        } catch (playErr) {
          console.warn(`HTML audio play blocked for peer ${remotePeerId}, using Web Audio destination:`, playErr);
          this.connectRemoteWebAudio(remotePeerId, stream);
          const ctx = this.getOrCreateAudioContext();
          if (ctx && ctx.state === 'running') {
            this.notifyAutoplayBlocked(false);
          } else {
            this.notifyAutoplayBlocked(true);
          }
        }
      };

      tryPlay();
      event.track.onunmute = tryPlay;
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === 'failed' ||
        pc.iceConnectionState === 'disconnected'
      ) {
        if (this.shouldInitiateOffer(remotePeerId)) {
          this.renegotiatePeer(remotePeerId, true).catch(() => {});
        }
      }
    };

    return pc;
  }

  // Renegotiate peer connection (Perfect Negotiation compliant)
  private async renegotiatePeer(remotePeerId: string, iceRestart: boolean = false) {
    const pc = this.peerConnections.get(remotePeerId);
    if (!pc) return;

    try {
      this.isMakingOffer.set(remotePeerId, true);
      const offer = await pc.createOffer({
        iceRestart,
        offerToReceiveAudio: true,
      });

      if (pc.signalingState !== 'stable') {
        return;
      }

      await pc.setLocalDescription(offer);
      await this.sendSignal(
        remotePeerId,
        'offer',
        JSON.stringify(pc.localDescription)
      );
    } catch (err) {
      console.warn(`[WebRTC] Renegotiate error with ${remotePeerId}:`, err);
    } finally {
      this.isMakingOffer.set(remotePeerId, false);
    }
  }

  // W3C Perfect Negotiation signal dispatcher
  private async handleIncomingSignal(signal: VoiceSignal) {
    const { fromPeerId, type, payload } = signal;

    let pc = this.peerConnections.get(fromPeerId);
    if (!pc) {
      pc = this.createPeerConnection(fromPeerId);
      this.peerConnections.set(fromPeerId, pc);
    }

    try {
      const data = JSON.parse(payload);

      if (type === 'offer') {
        const desc = new RTCSessionDescription(data);
        const isPolite = this.isPolite(fromPeerId);
        const isMakingOffer = Boolean(this.isMakingOffer.get(fromPeerId));
        const offerCollision = isMakingOffer && pc.signalingState !== 'stable';

        this.ignoreOffer.set(fromPeerId, !isPolite && offerCollision);
        if (this.ignoreOffer.get(fromPeerId)) {
          return;
        }

        // Polite peer rolls back its own uncommitted offer if colliding
        if (offerCollision && isPolite) {
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch {}
        }

        await pc.setRemoteDescription(desc);

        // Apply queued candidates for this peer
        const queued = this.pendingCandidates.get(fromPeerId) || [];
        for (const c of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch {}
        }
        this.pendingCandidates.delete(fromPeerId);

        // Create and return answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await this.sendSignal(fromPeerId, 'answer', JSON.stringify(pc.localDescription));

        // Unlock audio playback
        this.ensureAudioPlayback().catch(() => {});
      } else if (type === 'answer') {
        if (pc.signalingState === 'have-local-offer') {
          const desc = new RTCSessionDescription(data);
          await pc.setRemoteDescription(desc);

          // Apply queued candidates for this peer
          const queued = this.pendingCandidates.get(fromPeerId) || [];
          for (const c of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch {}
          }
          this.pendingCandidates.delete(fromPeerId);

          // Unlock audio playback
          this.ensureAudioPlayback().catch(() => {});
        }
      } else if (type === 'candidate') {
        try {
          const candidate = new RTCIceCandidate(data);
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(candidate);
          } else {
            const list = this.pendingCandidates.get(fromPeerId) || [];
            list.push(data);
            this.pendingCandidates.set(fromPeerId, list);
          }
        } catch (candErr) {
          if (!this.ignoreOffer.get(fromPeerId)) {
            console.warn('addIceCandidate notice:', candErr);
          }
        }
      }
    } catch (err) {
      console.warn(`Error handling signal ${type} from ${fromPeerId}:`, err);
    }
  }

  private async sendSignal(
    toPeerId: string,
    type: 'offer' | 'answer' | 'candidate',
    payload: string
  ) {
    if (this.isClosed) return;
    try {
      const signalId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(db, 'room_signals', signalId);
      await setDoc(docRef, {
        id: signalId,
        roomId: this.roomId,
        fromPeerId: this.localPeerId,
        toPeerId,
        type,
        payload,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn(`Failed to send signal ${type} to ${toPeerId}:`, err);
    }
  }

  private handlePeerLeft(remotePeerId: string) {
    const pc = this.peerConnections.get(remotePeerId);
    if (pc) {
      try {
        pc.close();
      } catch {}
      this.peerConnections.delete(remotePeerId);
    }

    const audioEl = this.remoteAudioElements.get(remotePeerId);
    if (audioEl) {
      try {
        audioEl.srcObject = null;
        audioEl.remove();
      } catch {}
      this.remoteAudioElements.delete(remotePeerId);
    }

    this.remoteStreams.delete(remotePeerId);
    this.pendingCandidates.delete(remotePeerId);
    this.isMakingOffer.delete(remotePeerId);
    this.ignoreOffer.delete(remotePeerId);
    this.signalQueues.delete(remotePeerId);
  }

  // Leave room and completely tear down audio and connections
  public async leave() {
    if (this.isClosed) return;
    this.isClosed = true;

    if (this.userGestureHandler) {
      document.removeEventListener('click', this.userGestureHandler, true);
      document.removeEventListener('touchstart', this.userGestureHandler, true);
      document.removeEventListener('keydown', this.userGestureHandler, true);
      this.userGestureHandler = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.unsubPeers) {
      this.unsubPeers();
      this.unsubPeers = null;
    }

    if (this.unsubSignals) {
      this.unsubSignals();
      this.unsubSignals = null;
    }

    for (const [, pc] of this.peerConnections) {
      try {
        pc.close();
      } catch {}
    }
    this.peerConnections.clear();

    for (const [, audioEl] of this.remoteAudioElements) {
      try {
        audioEl.srcObject = null;
        audioEl.remove();
      } catch {}
    }
    this.remoteAudioElements.clear();

    if (this.silentTrack) {
      try {
        this.silentTrack.stop();
      } catch {}
      this.silentTrack = null;
    }

    this.remoteStreams.clear();
    this.pendingCandidates.clear();
    this.isMakingOffer.clear();
    this.ignoreOffer.clear();
    this.signalQueues.clear();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    try {
      await deleteDoc(doc(db, 'room_peers', `${this.roomId}_${this.localPeerId}`));
    } catch {}
  }
}
