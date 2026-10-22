import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Landmark,
  ShieldCheck,
  Lock,
  ExternalLink,
  Copy,
  Check,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Key,
  Globe,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { playSketchClick, playSquadJoinSound } from '../utils/audio';

interface StripeDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StripeDestinationModal: React.FC<StripeDestinationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'payout' | 'keys' | 'destination' | 'test'>('payout');

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    playSketchClick();
    navigator.clipboard?.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/stripe-webhook` : 'https://your-app-domain.com/api/stripe-webhook';

  return (
    <div className="fixed inset-0 z-[160] bg-black/92 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-[#030914] text-slate-100 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 relative shadow-[0_0_60px_rgba(250,204,21,0.45)] my-auto cursor-default space-y-4 max-h-[92vh] overflow-y-auto"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#635BFF] via-[#0048E5] to-[#0A2540] flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(99,91,255,0.7)]">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-base tracking-wide text-white">
                  Stripe Payout Destination & Setup
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-amber-400 text-black shadow-[0_0_10px_#facc15]">
                  MERCHANT SETUP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sketch flex items-center gap-1.5 mt-0.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Configure where your $25 5-day promotion payments are deposited</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-950/80 border border-white/10 hover:border-rose-400 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/60 rounded-xl border border-sky-500/30 text-xs font-display">
          <button
            type="button"
            onClick={() => {
              playSketchClick();
              setActiveTab('payout');
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'payout'
                ? 'bg-amber-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.6)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span className="truncate">1. Bank Payout</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSketchClick();
              setActiveTab('destination');
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'destination'
                ? 'bg-amber-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.6)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="truncate">2. Ad Destination</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSketchClick();
              setActiveTab('keys');
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'keys'
                ? 'bg-amber-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.6)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="truncate">3. Stripe Keys</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSketchClick();
              setActiveTab('test');
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'test'
                ? 'bg-amber-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.6)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="truncate">4. Test Mode</span>
          </button>
        </div>

        {/* TAB 1: BANK PAYOUT DESTINATION */}
        {activeTab === 'payout' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-gradient-to-br from-[#0c1a2e] to-[#040e1b] border-2 border-amber-400/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-400" />
                  What is a Stripe Payout Destination?
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  AUTOMATIC DIRECT DEPOSIT
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sketch">
                In Stripe, your <strong className="text-white">Payout Destination</strong> is the bank account or debit card where Stripe deposits all earnings collected from customers who purchase 5-day billboard promotions ($25 USD).
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>How To Add Your Payout Destination (3 Simple Steps)</span>
              </h3>

              <div className="space-y-2 text-xs">
                {/* Step 1 */}
                <div className="p-3 bg-black/60 border border-sky-500/30 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-black font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <div className="font-display font-bold text-white">Log into Stripe Dashboard</div>
                    <p className="text-slate-400 text-[11px] font-sketch">
                      Go to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-sky-300 underline font-mono">dashboard.stripe.com</a> and sign in with your email.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-black/60 border border-sky-500/30 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-black font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <div className="font-display font-bold text-white">Navigate to Payout Destination Settings</div>
                    <p className="text-slate-400 text-[11px] font-sketch">
                      In the Stripe Dashboard, click <strong className="text-white">Settings</strong> (gear icon top right) → under <em>Business settings</em>, click <strong className="text-white">Bank accounts and scheduling</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3 bg-black/60 border border-sky-500/30 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-black font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <div className="font-display font-bold text-white">Add Bank Account or Debit Card</div>
                    <p className="text-slate-400 text-[11px] font-sketch">
                      Click <strong className="text-emerald-400">+ Add bank account</strong> (enter your Routing & Account Number) or <strong className="text-emerald-400">+ Add debit card</strong>. Choose your payout schedule (Daily or Weekly automatic rolling deposits).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Once added, every $25 payment made through the Billboard Promotion will automatically transfer to your bank payout destination!
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: PROMOTION DESTINATION LINK */}
        {activeTab === 'destination' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-gradient-to-br from-[#0c1a2e] to-[#040e1b] border-2 border-sky-400/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-black text-sky-300 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  What is the Billboard Destination Link?
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40">
                  CALL TO ACTION
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sketch">
                When gamers and visitors tap on your billboard (on the 3D Airship, Pokemon Air Balloon, or Map screens), the <strong className="text-white">Destination Link</strong> is where they are instantly taken.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-display font-bold text-white">Supported Destination Types:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-black/60 border border-sky-500/30 rounded-xl space-y-1">
                  <div className="text-amber-300 font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website / Shop</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    https://mybusiness.com
                  </div>
                </div>

                <div className="p-2.5 bg-black/60 border border-sky-500/30 rounded-xl space-y-1">
                  <div className="text-sky-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Discord / Community</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    discord.gg/yourserver
                  </div>
                </div>

                <div className="p-2.5 bg-black/60 border border-sky-500/30 rounded-xl space-y-1">
                  <div className="text-pink-300 font-bold flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Social Media / X / IG</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    instagram.com/mybrand
                  </div>
                </div>

                <div className="p-2.5 bg-black/60 border border-sky-500/30 rounded-xl space-y-1">
                  <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Store / Map Location</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    maps.google.com/...
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-black/60 border border-amber-400/40 rounded-xl space-y-2">
              <div className="text-xs font-display font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Global Fleet Destination Coverage</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sketch leading-relaxed">
                By default, your verified 5-day promotion broadcasts across <strong className="text-white">All 50 US State Skyways</strong> and global city air corridors simultaneously!
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: STRIPE API KEYS */}
        {activeTab === 'keys' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-gradient-to-br from-[#0c1a2e] to-[#040e1b] border-2 border-amber-400/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  Connecting Your Stripe API Keys
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  ENV CONFIGURATION
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sketch">
                To collect real credit card payments with live funds going straight to your bank, provide your Stripe keys in the environment variables.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Publishable Key */}
              <div className="p-3 bg-black/60 border border-sky-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-white">VITE_STRIPE_PUBLISHABLE_KEY</span>
                  <span className="text-[10px] text-slate-400 font-mono">Client-Side Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="pk_live_... (or pk_test_...)"
                    className="flex-1 px-3 py-1.5 bg-black/90 border border-sky-500/40 rounded-lg text-xs font-mono text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('VITE_STRIPE_PUBLISHABLE_KEY', 'pub')}
                    className="p-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'pub' ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'pub' ? 'Copied' : 'Copy Name'}</span>
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              <div className="p-3 bg-black/60 border border-sky-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-white">STRIPE_SECRET_KEY</span>
                  <span className="text-[10px] text-amber-400 font-mono">Backend Secure Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="sk_live_... (or sk_test_...)"
                    className="flex-1 px-3 py-1.5 bg-black/90 border border-amber-500/40 rounded-lg text-xs font-mono text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('STRIPE_SECRET_KEY', 'sec')}
                    className="p-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'sec' ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'sec' ? 'Copied' : 'Copy Name'}</span>
                  </button>
                </div>
              </div>

              {/* Webhook Endpoint Destination */}
              <div className="p-3 bg-black/60 border border-sky-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-white">Webhook Destination Endpoint</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Stripe Webhooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 px-3 py-1.5 bg-black/90 border border-sky-500/40 rounded-lg text-xs font-mono text-emerald-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookUrl, 'webhook')}
                    className="p-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'webhook' ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'webhook' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEST MODE & VERIFICATION */}
        {activeTab === 'test' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-gradient-to-br from-[#0c1a2e] to-[#040e1b] border-2 border-emerald-400/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Instant Testing With Stripe Test Cards
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  READY TO TEST
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sketch">
                You do not need real money or a live card to test! The checkout modal includes a 1-click test button with official Stripe test card details.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-black/60 border border-sky-500/30 rounded-xl space-y-2">
                <div className="font-display font-bold text-white flex items-center justify-between">
                  <span>Official Stripe Test Card Details:</span>
                  <span className="text-[10px] font-mono text-sky-400">Universal Success Card</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                  <div className="p-2 bg-black/80 border border-sky-500/30 rounded-lg">
                    <div className="text-[10px] text-slate-400">Card Number</div>
                    <div className="text-xs text-white font-bold">4242 4242 4242 4242</div>
                  </div>
                  <div className="p-2 bg-black/80 border border-sky-500/30 rounded-lg">
                    <div className="text-[10px] text-slate-400">Expiration</div>
                    <div className="text-xs text-white font-bold">12/28 (Any future)</div>
                  </div>
                  <div className="p-2 bg-black/80 border border-sky-500/30 rounded-lg">
                    <div className="text-[10px] text-slate-400">CVC Code</div>
                    <div className="text-xs text-white font-bold">123</div>
                  </div>
                  <div className="p-2 bg-black/80 border border-sky-500/30 rounded-lg">
                    <div className="text-[10px] text-slate-400">ZIP Code</div>
                    <div className="text-xs text-white font-bold">90210</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center gap-2.5 text-xs text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Whenever a payment completes in either test or live mode, the billboard immediately posts the logo, business name, and destination link for 5 full days!
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-sky-500/30 flex items-center justify-between">
          <a
            href="https://dashboard.stripe.com/settings/payouts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-300 hover:text-white flex items-center gap-1.5 font-sketch underline"
          >
            <span>Open Stripe Payout Settings</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="py-2 px-5 rounded-xl text-xs font-display font-black tracking-wider text-black bg-gradient-to-r from-amber-400 via-sky-400 to-cyan-300 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(250,204,21,0.5)] cursor-pointer"
          >
            Done & Return to Billboard
          </button>
        </div>
      </div>
    </div>
  );
};
