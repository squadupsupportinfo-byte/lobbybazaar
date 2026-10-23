import React, { useState } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  Users,
  Check,
  Shield,
  Sparkles,
} from 'lucide-react';
import { FriendRequest, FriendRelation } from '../types';
import { playSketchClick, playSquadJoinSound } from '../utils/audio';
import { sendFriendRequest } from '../utils/socialService';
import { useAuth } from '../context/AuthContext';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomingRequests: FriendRequest[];
  friends: FriendRelation[];
  currentUserId?: string;
  onAcceptRequest: (request: FriendRequest) => void;
  onDeclineRequest: (request: FriendRequest) => void;
  onRemoveFriend: (targetUserId: string, targetTag: string) => void;
  onOpenDirectMessages?: (recipient: {
    uid: string;
    gamerTag: string;
    photoUrl?: string;
  }) => void;
  onOpenAuthModal?: (mode: 'signup' | 'signin') => void;
}

export function FriendRequestsModal({
  isOpen,
  onClose,
  incomingRequests,
  friends,
  currentUserId,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onOpenDirectMessages,
  onOpenAuthModal,
}: FriendRequestsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'friends'>(
    incomingRequests.length > 0 ? 'requests' : 'friends'
  );

  const handleSimulateTestRequest = async () => {
    if (!currentUserId) return;
    const testSenders = [
      { tag: 'Valkyrie_Air', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop' },
      { tag: 'Ghost_Recon_7', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
      { tag: 'CyberSamurai_X', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop' },
    ];
    const pick = testSenders[Math.floor(Math.random() * testSenders.length)];
    const mockId = `mock_${Date.now()}`;
    playSquadJoinSound();
    await sendFriendRequest({
      senderId: mockId,
      senderGamerTag: pick.tag,
      senderPhotoUrl: pick.photo,
      receiverId: currentUserId,
      receiverGamerTag: 'You',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#020703] text-slate-100 border border-green-500/40 shadow-[0_0_50px_rgba(34,197,94,0.3)] rounded-2xl flex flex-col overflow-hidden cursor-default max-h-[85vh]"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-green-500/30 flex items-center justify-between bg-[#040e06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-950/80 border border-lime-400 flex items-center justify-center shadow-[0_0_12px_rgba(163,230,53,0.4)]">
              <Users className="w-5 h-5 text-lime-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-display text-white tracking-wide">
                  Squad Friends & Requests
                </h3>
                {incomingRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono-num font-bold bg-lime-400 text-black rounded-full animate-pulse shadow-[0_0_8px_rgba(163,230,53,0.6)]">
                    {incomingRequests.length} Pending
                  </span>
                )}
              </div>
              <p className="text-[11px] font-sketch text-slate-400">
                Accept or decline friend requests and coordinate with squadmates
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 rounded-lg transition-colors cursor-pointer"
            title="Close [Esc]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-3 px-5 pt-3 border-b border-green-500/20 bg-[#020904]">
          <button
            onClick={() => {
              playSketchClick();
              setActiveTab('requests');
            }}
            className={`pb-2.5 font-display text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'requests'
                ? 'text-lime-300 border-b-2 border-lime-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Incoming Requests ({incomingRequests.length})</span>
          </button>

          <button
            onClick={() => {
              playSketchClick();
              setActiveTab('friends');
            }}
            className={`pb-2.5 font-display text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'friends'
                ? 'text-lime-300 border-b-2 border-lime-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Friends List ({friends.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {activeTab === 'requests' && (
            <>
              {incomingRequests.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-green-500/20 rounded-xl bg-black/40">
                  <div className="w-12 h-12 rounded-full bg-lime-950/40 border border-lime-500/30 flex items-center justify-center mx-auto mb-3 text-lime-400">
                    <UserPlus className="w-6 h-6 opacity-60" />
                  </div>
                  <h4 className="text-sm font-display font-bold text-white mb-1">
                    No Pending Requests
                  </h4>
                  <p className="text-xs font-sketch text-slate-400 max-w-sm mx-auto mb-3">
                    When other players click "Add Friend" on your beacon or profile, their requests will appear here for you to accept or decline.
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateTestRequest}
                    className="px-3.5 py-1.5 bg-lime-400 hover:bg-lime-300 text-black font-display font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(163,230,53,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    + Simulate Incoming Friend Request
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-mono text-lime-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Review and decide:</span>
                    <button
                      type="button"
                      onClick={handleSimulateTestRequest}
                      className="text-[10px] text-lime-400 hover:text-lime-300 underline cursor-pointer"
                    >
                      + Test Another Request
                    </button>
                  </div>
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl border border-lime-400/50 bg-[#030d06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                    >
                      <div className="flex items-center gap-3">
                        {req.senderPhotoUrl ? (
                          <img
                            src={req.senderPhotoUrl}
                            alt={req.senderGamerTag}
                            className="w-10 h-10 rounded-full object-cover border border-lime-400 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-lime-950 border border-lime-400 flex items-center justify-center font-display font-bold text-lime-300 flex-shrink-0">
                            {req.senderGamerTag.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-display font-bold text-white">
                            {req.senderGamerTag}
                          </div>
                          <div className="text-[11px] font-sketch text-slate-400">
                            Wants to connect as a squad friend
                          </div>
                        </div>
                      </div>

                      {/* Accept & Decline Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (!user) {
                              onOpenAuthModal?.('signin');
                              return;
                            }
                            playSquadJoinSound();
                            onAcceptRequest(req);
                          }}
                          className="px-3.5 py-1.5 text-xs font-display font-bold text-black bg-lime-400 hover:bg-lime-300 rounded-lg shadow-[0_0_12px_rgba(163,230,53,0.6)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!user) {
                              onOpenAuthModal?.('signin');
                              return;
                            }
                            playSketchClick();
                            onDeclineRequest(req);
                          }}
                          className="px-3 py-1.5 text-xs font-display font-bold text-slate-300 hover:text-red-300 bg-black/60 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'friends' && (
            <>
              {friends.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-green-500/20 rounded-xl bg-black/40">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                    <UserCheck className="w-6 h-6 opacity-60" />
                  </div>
                  <h4 className="text-sm font-display font-bold text-white mb-1">
                    No Friends Added Yet
                  </h4>
                  <p className="text-xs font-sketch text-slate-400 max-w-sm mx-auto">
                    Click on any player's beacon on the map and hit <strong>Add Friend</strong> to start connecting with other gamers!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {friends.map((friend) => {
                    const isUser1Me = currentUserId && friend.user1Id === currentUserId;
                    const otherTag = isUser1Me ? friend.user2Tag : friend.user1Tag;
                    const otherUid = isUser1Me ? friend.user2Id : friend.user1Id;
                    const otherPhoto = isUser1Me ? friend.user2PhotoUrl : friend.user1PhotoUrl;

                    return (
                      <div
                        key={friend.id}
                        className="p-3 rounded-xl border border-green-500/30 bg-[#030d06] flex items-center justify-between gap-3 hover:border-lime-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {otherPhoto ? (
                            <img
                              src={otherPhoto}
                              alt={otherTag}
                              className="w-10 h-10 rounded-full object-cover border border-green-400"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center font-display font-bold text-emerald-300">
                              {otherTag.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-display font-bold text-white flex items-center gap-2">
                              <span>{otherTag}</span>
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40">
                                FRIEND
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              Connected on LobbyBazaar
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {onOpenDirectMessages && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!user) {
                                  onOpenAuthModal?.('signin');
                                  return;
                                }
                                playSketchClick();
                                onClose();
                                onOpenDirectMessages({
                                  uid: otherUid,
                                  gamerTag: otherTag,
                                  photoUrl: otherPhoto,
                                });
                              }}
                              className="px-3 py-1.5 text-xs font-display font-bold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/80 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                              title={`Direct message ${otherTag}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Message</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (!user) {
                                onOpenAuthModal?.('signin');
                                return;
                              }
                              playSketchClick();
                              onRemoveFriend(otherUid, otherTag);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 bg-black/60 hover:bg-white/5 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Remove friend"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
