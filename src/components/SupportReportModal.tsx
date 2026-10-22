import React, { useState } from 'react';
import { Mail, ShieldAlert, Copy, Check, ExternalLink, HelpCircle, X, MessageSquare, AlertTriangle } from 'lucide-react';
import { playSketchClick, playMessagePopSound } from '../utils/audio';

interface SupportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'report' | 'question';
}

export const SUPPORT_EMAIL = 'squadupgaming6@gmail.com';

export const SupportReportModal: React.FC<SupportReportModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'question',
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<'question' | 'report'>(defaultCategory);

  if (!isOpen) return null;

  const handleCopy = () => {
    playMessagePopSound();
    navigator.clipboard?.writeText(SUPPORT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailSubject = encodeURIComponent(
    selectedTopic === 'report' ? 'SquadUp - User Report / Moderation Issue' : 'SquadUp - Support Question / Inquiry'
  );
  const mailBody = encodeURIComponent(
    selectedTopic === 'report'
      ? `Hello SquadUp Support Team,\n\nI would like to report an issue or user:\n\n• Your GamerTag (optional):\n• Reported User/Store/Billboard (if applicable):\n• Description of the issue or violation:\n• Date/Time:\n• Additional details or links:\n\nThank you!`
      : `Hello SquadUp Support Team,\n\nI have a question regarding SquadUp:\n\n• Your GamerTag (optional):\n• Question / Feedback:\n\nThank you!`
  );

  const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#030c05] text-slate-100 border-2 border-cyan-400/80 shadow-[0_0_40px_rgba(34,211,238,0.45)] rounded-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] overflow-y-auto"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-cyan-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              <Mail className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-wide">
                Help, Questions & Reports
              </h3>
              <p className="text-xs font-sketch text-cyan-200">
                Direct communication with the SquadUp operations team
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topic Toggle Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-2 bg-[#020703] p-1 rounded-xl border border-white/10 text-xs font-display font-bold">
          <button
            type="button"
            onClick={() => {
              playSketchClick();
              setSelectedTopic('question');
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedTopic === 'question'
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Questions & Help</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playSketchClick();
              setSelectedTopic('report');
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedTopic === 'report'
                ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Issue / User</span>
          </button>
        </div>

        {/* Email Box Banner */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-[#04160d] to-emerald-950/40 border border-cyan-500/40">
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 mb-1 flex items-center justify-between">
            <span>Official Support Email</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              Active Monitored Inbox
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2">
            <span className="font-mono text-sm sm:text-base font-bold text-white selection:bg-cyan-500 selection:text-black break-all">
              {SUPPORT_EMAIL}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 flex-shrink-0 ${
                copied
                  ? 'bg-emerald-400 text-black shadow-[0_0_12px_#34d399]'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Email Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Direct Email Action Button */}
        <div className="mt-4">
          <a
            href={mailtoLink}
            onClick={() => playSketchClick()}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-display font-black text-sm tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.55)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            <Mail className="w-4 h-4 stroke-[2.5]" />
            <span>Open Email Client & Send Message</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>

        {/* Informational Guidance */}
        <div className="mt-4 space-y-2 text-xs font-sketch text-slate-300 bg-[#020904] p-3 rounded-xl border border-white/10">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 text-sm mt-0.5">🛡️</span>
            <div>
              <strong className="text-white font-display">Reporting Inappropriate Content:</strong>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                If you encounter offensive gamer tags, fraudulent stores, inappropriate billboard ads, or harassment, email us directly with the user’s tag or screenshot so our team can review and take immediate moderation action.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t border-white/5">
            <span className="text-emerald-400 text-sm mt-0.5">💡</span>
            <div>
              <strong className="text-white font-display">General Questions & Purchases:</strong>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                Questions about $3 character unlocks, 5-day billboard promotions, or feature requests are handled by our team. Please include your registered gamer tag or payment session ID if applicable.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-sketch text-slate-400">
          <span>SquadUp Support Team</span>
          <button
            type="button"
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="text-cyan-300 hover:text-white underline cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
