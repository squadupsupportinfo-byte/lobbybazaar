import React from 'react';
import { UserPlus, LogOut, ShieldAlert, Users, Mail } from 'lucide-react';
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
  onOpenTerms,
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

          {/* Button to read Terms and Conditions */}
          {onOpenTerms && (
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onOpenTerms();
              }}
              title="Read Terms of Service & 18+ Peer-to-Peer Agreement"
              className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-sketch text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/80 border border-amber-500/40 hover:border-amber-400 rounded transition-all cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.2)]"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="hidden xs:inline">Terms & Conditions</span>
              <span className="xs:hidden">Terms</span>
            </button>
          )}

          {/* Support Link */}
          {onOpenSupport && (
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onOpenSupport();
              }}
              title="Contact Support & Report"
              className="hidden md:flex items-center gap-1 px-2 py-0.5 text-[11px] sm:text-xs font-sketch text-cyan-300 hover:text-cyan-200 bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 rounded transition-all cursor-pointer"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Support</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Account / Profile CTA & Live Comms Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Account status: Logged in profile badge vs Sign Up button */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Friends & Friend Requests Notification Button */}
              {onOpenFriendRequests && (
                <button
                  onClick={() => {
                    playSketchClick();
                    onOpenFriendRequests();
                  }}
                  title="Friend Requests & Squad Connections"
                  className="relative flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 h-6 sm:h-7 bg-[#020c06] hover:bg-[#071d0e] border border-lime-500/50 rounded text-[11px] sm:text-xs font-sketch text-lime-300 transition-all cursor-pointer shadow-[0_0_8px_rgba(163,230,53,0.25)] hover:scale-105 active:scale-95"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >
                  <Users className="w-3 h-3 text-lime-400" />
                  <span className="hidden sm:inline">Friends</span>
                  {incomingRequestsCount > 0 && (
                    <span className="px-1 py-0.1 rounded-full bg-lime-400 text-black text-[9px] font-mono font-bold animate-pulse shadow-[0_0_8px_#a3e635]">
                      {incomingRequestsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Profile Badge */}
              <button
                onClick={() => {
                  playSketchClick();
                  if (onOpenSocialProfile) {
                    onOpenSocialProfile();
                  } else if (onOpenEditProfile) {
                    onOpenEditProfile();
                  }
                }}
                title="View Social Profile (Followers & Following)"
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 h-6 sm:h-7 bg-[#030d06] hover:bg-[#07190d] border border-green-400/60 rounded text-[11px] sm:text-xs font-sketch text-green-200 shadow-[0_0_8px_rgba(34,197,94,0.3)] transition-all cursor-pointer group"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                {gamerProfile?.photoUrl ? (
                  <img
                    src={gamerProfile.photoUrl}
                    alt="Avatar"
                    className="w-4 h-4 rounded-full object-cover border border-green-400"
                  />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
                <span className="font-bold font-display group-hover:text-green-300 max-w-[70px] sm:max-w-none truncate text-[11px] sm:text-xs">
                  {gamerProfile?.gamerTag || user.displayName || 'Gamer'}
                </span>
                <span className="hidden sm:inline text-[9px] text-green-400 bg-green-950 px-1 rounded border border-green-500/30 font-mono">
                  PROFILE
                </span>
                {unreadMessagesCount > 0 && (
                  <span
                    className="px-1 py-0.1 rounded-full bg-emerald-400 text-black text-[9px] font-mono font-bold animate-pulse shadow-[0_0_8px_#10b981]"
                    title={`${unreadMessagesCount} unread message(s)`}
                  >
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => logout()}
                title="Log Out"
                className="p-1 h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-slate-400 hover:text-red-400 cursor-pointer border border-slate-700/60 rounded transition-colors"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <button
                onClick={() => {
                  playSketchClick();
                  onOpenAuthModal('signin');
                }}
                className="px-1.5 sm:px-2 py-0.5 h-6 sm:h-7 text-[11px] sm:text-xs font-sketch text-slate-300 hover:text-green-200 cursor-pointer whitespace-nowrap flex items-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  playSketchClick();
                  onOpenAuthModal('signup');
                }}
                className="px-2 sm:px-2.5 py-0.5 h-6 sm:h-7 text-[11px] sm:text-xs font-semibold font-display tracking-wider text-green-100 bg-green-950/60 hover:bg-green-900/80 border border-green-400 rounded cursor-pointer transition-all duration-200 shadow-[0_0_8px_rgba(34,197,94,0.4)] whitespace-nowrap flex items-center gap-1"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <UserPlus className="w-3 h-3 text-green-400 flex-shrink-0" />
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
