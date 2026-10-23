import React, { useState } from 'react';
import {
  ShieldAlert,
  Handshake,
  DollarSign,
  AlertTriangle,
  MapPin,
  Lock,
  Scale,
  CheckCircle2,
  X,
  FileText,
  UserCheck,
  Mail,
} from 'lucide-react';
import { playSketchClick } from '../utils/audio';

interface TermsModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  onAccept: () => void;
  onClose?: () => void;
}

export function TermsModal({
  isOpen,
  isMandatory = false,
  onAccept,
  onClose,
}: TermsModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMandatory && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMandatory, onClose]);

  if (!isOpen) return null;

  const handleAgreeAndProceed = () => {
    playSketchClick();
    onAccept();
  };

  return (
    <div
      onClick={(e) => {
        if (!isMandatory && onClose && e.target === e.currentTarget) {
          playSketchClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/95 backdrop-blur-xl overflow-y-auto select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#030a05] text-slate-100 p-5 sm:p-8 relative border-2 border-amber-400/90 my-auto max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(245,158,11,0.35)] cursor-default rounded-3xl"
        style={{
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white tracking-wide flex items-center gap-2">
                <span>Terms of Service & Liability Disclaimer</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-amber-300 border border-amber-400/50">
                  18+ REQUIRED
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-400/50 hidden sm:inline-block">
                  LEGAL NOTICE
                </span>
              </h2>
              <p className="text-xs font-sketch text-amber-200/80">
                You must be 18 years or older and agree to peer-to-peer terms before browsing the map.
              </p>
            </div>
          </div>

          {/* Close button only available if NOT mandatory initial prompt */}
          {!isMandatory && onClose && (
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
              title="Close [Esc]"
              aria-label="Close"
            >
              <X className="w-4 h-4 stroke-[1.75]" />
            </button>
          )}
        </div>

        {/* Scrollable Terms Content */}
        <div
          className="flex-1 overflow-y-auto space-y-4 my-4 pr-2 text-xs sm:text-sm text-slate-300 font-sans leading-relaxed custom-scrollbar"
        >
          {/* Highlight Banner */}
          <div className="p-3.5 bg-amber-950/40 border border-amber-400/50 rounded-xl flex items-start gap-3 text-amber-100">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-300 uppercase tracking-wide">
                Summary in Plain Language (18+ Requirement):
              </p>
              <p>
                LobbyBazaar is strictly for users <strong>18 years of age and older</strong>. We exist solely to connect adult gamers and facilitate discovery. We do not broker deals, process payments, or guarantee trades. You trade and meet at your own discretion and risk. We take $0 from transactions, charge zero fees, and are not liable for user actions.
              </p>
            </div>
          </div>

          {/* Section 1: Connection Platform Only */}
          <div className="p-3.5 bg-[#020703] border border-green-500/25 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-green-300 font-bold font-display text-sm">
              <Handshake className="w-4 h-4 text-green-400" />
              <span>1. Peer-to-Peer Directory Only (We Just Connect People)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sketch">
              LobbyBazaar is an interactive map and directory service designed to help local players find fireteams,
              gaming friends, local shops, and tournaments. LobbyBazaar is NOT an employer, agent, broker,
              auctioneer, or commercial merchant. We do not employ players, host events ourselves, or direct user
              activities.
            </p>
          </div>

          {/* Section 2: Zero Fees & No Financial Involvement */}
          <div className="p-3.5 bg-[#020703] border border-green-500/25 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold font-display text-sm">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>2. Zero Fees & No Financial Involvement ($0 Taken)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sketch">
              LobbyBazaar takes <strong>$0 in fees</strong> and <strong>0% commission</strong> from any item sales,
              purchases, or trades arranged between users. LobbyBazaar does NOT handle, process, receive, or escrow
              funds. Any monetary or trade transaction is conducted strictly between consenting individuals through
              their own chosen methods.
            </p>
          </div>

          {/* Section 3: Marketplace & Trading At Your Own Risk */}
          <div className="p-3.5 bg-[#020703] border border-green-500/25 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-pink-300 font-bold font-display text-sm">
              <Scale className="w-4 h-4 text-pink-400" />
              <span>3. Marketplace, Sales & Trades: 100% Up To Users</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sketch">
              Any agreement to buy, sell, barter, or trade video games, consoles, hardware, collectibles, or
              services is solely between the buyer and the seller. LobbyBazaar makes no guarantees regarding the
              authenticity, working condition, legality, safety, or quality of listed items. We do not provide
              warranties, return policies, or dispute arbitration.
            </p>
          </div>

          {/* Section 4: In-Person Meetup Safety & Assumption of Risk */}
          <div className="p-3.5 bg-[#020703] border border-green-500/25 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-display text-sm">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>4. Assumption of Risk & In-Person Safety</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sketch">
              You assume total personal responsibility for your safety and property when meeting other users or
              attending events. Always exercise caution: meet in well-lit, crowded public spaces (e.g. public hobby
              game centers, retail stores, police safe-trade zones), bring a friend, and never invite strangers to
              your private home or disclose private financial credentials.
            </p>
          </div>

          {/* Section 5: Minimal Information & User Privacy */}
          <div className="p-3.5 bg-[#020703] border border-green-500/25 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-sky-300 font-bold font-display text-sm">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>5. Information Shared by Users</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sketch">
              Users control what information they share on their gamer profile (such as gamer tags, favorite games,
              and optional screenshots). Never share sensitive information such as government IDs, passwords, bank
              account numbers, or precise residential addresses.
            </p>
          </div>

          {/* Section 6: Limitation of Liability & Hold Harmless */}
          <div className="p-3.5 bg-[#020703] border border-amber-500/30 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-display text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>6. Limitation of Liability & Hold Harmless</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              TO THE FULLEST EXTENT PERMITTED BY LAW, LOBBYBAZAAR, ITS CREATORS, DEVELOPERS, OPERATORS, AND
              AFFILIATES SHALL NOT BE LIABLE FOR ANY CLAIMS, DAMAGES, FRAUD, THEFT, INJURIES, DISPUTES, OR LOSSES
              ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE APP OR INTERACTIONS WITH OTHER USERS. YOU AGREE
              TO INDEMNIFY AND HOLD HARMLESS LOBBYBAZAAR AND ITS CREATORS FROM ANY THIRD-PARTY LIABILITIES.
            </p>
          </div>

          {/* Section 7: Prohibited Content & Age Requirement */}
          <div className="p-3.5 bg-[#020703] border border-amber-500/40 rounded-xl space-y-1.5 bg-amber-950/10">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-display text-sm">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>7. Age Requirement (Strictly 18 Years and Older) & Community Rules</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sketch">
              <strong className="text-amber-300">You must be at least 18 years old to access or use LobbyBazaar.</strong> Browsing the radar map, discovering players, contacting members, creating squads, or deploying stores is strictly reserved for individuals aged 18 and older. By using this platform, you affirm, warrant, and certify that you are 18 years of age or older. Illegal items (pirated software, stolen goods, weapons, illegal substances) and abusive behavior (harassment, hate speech, threats) are strictly prohibited and subject to immediate account termination.
            </p>
          </div>

          {/* Section 8: Support & Reporting */}
          <div className="p-3.5 bg-[#020703] border border-cyan-500/40 rounded-xl space-y-1.5 bg-cyan-950/10">
            <div className="flex items-center gap-2 text-cyan-300 font-bold font-display text-sm">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>8. Support, Questions & Content Reporting</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sketch">
              For any questions, safety concerns, or to report inappropriate user behavior, harassment, fraudulent listings, or offensive content, contact our team directly at <a href="mailto:lobbybazaar6@gmail.com" className="text-cyan-300 underline font-mono font-bold">lobbybazaar6@gmail.com</a>. Reports are reviewed promptly by our moderation team.
            </p>
          </div>
        </div>

        {/* Action & Agreement Footer */}
        <div className="pt-3 border-t border-amber-500/30 flex-shrink-0 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col text-left">
              <span className="text-xs text-amber-300 font-semibold font-sketch">
                Terms of Service & 18+ Peer-to-Peer Agreement
              </span>
              <span className="text-[11px] text-slate-400 font-sketch">
                LobbyBazaar © 2026 · All rights reserved. Verified for adult users 18+.
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {!isMandatory && onClose && (
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-sketch text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              )}
              <button
                type="button"
                onClick={handleAgreeAndProceed}
                className="w-full sm:w-auto px-6 py-2.5 font-display font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-lime-500 to-emerald-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95"
                style={{
                  borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Continue to Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
