import React from 'react';
import { UserPlus, LogOut, Users, Mail } from 'lucide-react';
import { playSketchClick } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

interface TopNavProps {
  currentView: 'welcome' | 'map';
  onNavigate: (view: 'welcome' | 'map') => void;
  onCreateSquadClick?: () => void;
  onReplaySplash?: () => void;
  onOpenAuthModal: (mode: 'signup' | 'signin') => void;
  onOpenEditProfile?: () => void;
  onOpenSocialProfile?: () => void;
  onOpenMessages?: () => void;
  onOpenFriendRequests?: () => void;
  unreadMessagesCount?: number;
  incomingRequestsCount?: number;
  onOpenSellTradeModal?: () => void;
  onOpenEditStore?: () => void;
  onOpenTerms?: () => void;
  onOpenSupport?: () => void;
}

export function TopNav({
  currentView,
  onNavigate,
  onCreateSquadClick,
  onReplaySplash,
  onOpenAuthModal,
  onOpenEditProfile,
  onOpenSocialProfile,
  onOpenMessages,
  onOpenFriendRequests,
  unreadMessagesCount = 0,
  incomingRequestsCount = 0,
  onOpenSupport,
}: TopNavProps) {
  const { user, gamerProfile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-green-500/20 bg-[#020703]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Navigation */}
        <nav className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-sketch tracking-wide text-slate-300">
          <button
            onClick={() => {
              playSketchClick();
              onNavigate(currentView === 'map' ? 'welcome' : 'map');
            }}
            className="flex items-center gap-1.5 font-display font-black text-xs sm:text-sm tracking-wider text-green-300 hover:text-green-200 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span><span className="text-green-400">Lobby</span><span className="text-lime-400">Bazaar</span></span>
          </button>

          {/* Support Link */}
          {onOpenSupport && (
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onOpenSupport();
              }}
              title="Contact Support & Report"
              className="hidden md:flex items-center gap-1 px-2.5 py-1 text-[11px] sm:text-xs font-sketch text-cyan-300 hover:text-cyan-200 bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 rounded transition-all cursor-pointer"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Support</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Account / Profile CTA & Live Comms Badges */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Account status: Logged in profile badge vs Sign Up button */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Friends & Friend Requests Notification Button */}
              {onOpenFriendRequests && (
                <button
                  onClick={() => {
                    playSketchClick();
                    onOpenFriendRequests();
                  }}
                  title="Friend Requests & Squad Connections"
                  className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-10 sm:h-11 md:h-12 bg-[#020c06] hover:bg-[#071d0e] border-2 border-lime-500/60 hover:border-lime-400 rounded-xl text-xs sm:text-sm font-sketch font-bold text-lime-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(163,230,53,0.3)] hover:scale-105 active:scale-95"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-lime-400" />
                  <span className="hidden sm:inline">Friends</span>
                  {incomingRequestsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-lime-400 text-black text-[11px] font-mono font-bold animate-pulse shadow-[0_0_8px_#a3e635]">
                      {incomingRequestsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Profile Badge / Social Card (Mrg name UI - click to view/edit profile) */}
              <button
                onClick={() => {
                  playSketchClick();
                  if (onOpenSocialProfile) {
                    onOpenSocialProfile();
                  } else if (onOpenEditProfile) {
                    onOpenEditProfile();
                  }
                }}
                title="View & Edit Gamer Profile (Avatar, Bio, Followers & Settings)"
                className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 h-10 sm:h-11 md:h-12 bg-gradient-to-r from-[#031508] to-[#072510] hover:from-[#06240d] hover:to-[#0c3517] border-2 border-green-400/80 hover:border-green-300 rounded-xl text-green-200 shadow-[0_0_16px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] transition-all cursor-pointer group hover:scale-105 active:scale-95"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {gamerProfile?.photoUrl ? (
                  <img
                    src={gamerProfile.photoUrl}
                    alt="Avatar"
                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover border-2 border-green-400 flex-shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                  />
                ) : (
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-green-400 animate-pulse flex-shrink-0 shadow-[0_0_8px_#22c55e]" />
                )}
                <span className="font-black font-display tracking-wider group-hover:text-green-300 max-w-[110px] sm:max-w-none truncate text-xs sm:text-sm md:text-base">
                  {gamerProfile?.gamerTag || user.displayName || 'Gamer'}
                </span>
                {unreadMessagesCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-black text-[11px] font-mono font-bold animate-pulse shadow-[0_0_8px_#10b981]"
                    title={`${unreadMessagesCount} unread message(s)`}
                  >
                    {unreadMessagesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => logout()}
                title="Log Out"
                className="p-1.5 h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 flex items-center justify-center text-slate-400 hover:text-red-400 cursor-pointer border border-slate-700/80 hover:border-red-400/70 rounded-xl transition-all hover:bg-red-950/20 hover:scale-105 active:scale-95"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  playSketchClick();
                  onOpenAuthModal('signin');
                }}
                className="px-2.5 sm:px-3 py-1 h-8 sm:h-9 text-xs sm:text-sm font-sketch text-slate-300 hover:text-green-200 cursor-pointer whitespace-nowrap flex items-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  playSketchClick();
                  onOpenAuthModal('signup');
                }}
                className="px-3 sm:px-4 py-1 h-8 sm:h-9 text-xs sm:text-sm font-semibold font-display tracking-wider text-green-100 bg-green-950/60 hover:bg-green-900/80 border border-green-400 rounded-xl cursor-pointer transition-all duration-200 shadow-[0_0_12px_rgba(34,197,94,0.4)] whitespace-nowrap flex items-center gap-1.5 hover:scale-105 active:scale-95"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <UserPlus className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span className="hidden sm:inline">Create </span>
                <span>Account</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
