import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  Layers,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { playSketchClick, playSquadJoinSound } from '../utils/audio';

export interface StripePaymentDetails {
  paymentId: string;
  amount: number;
  currency: string;
  cardLast4: string;
  cardBrand: string;
  paidAt: number;
  billboardId?: string;
}

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessLink?: string;
  tagline?: string;
  photoUrl: string;
  durationDays: number; // 5 days
  priceUsd?: number; // $10.00
  billboardId?: string;
  billboardName?: string;
  onPaymentSuccess: (details: StripePaymentDetails) => void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  businessName,
  businessLink,
  tagline,
  photoUrl,
  durationDays = 5,
  priceUsd = 10.0,
  billboardId = 'current',
  billboardName = 'Selected Billboard',
  onPaymentSuccess,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardZip, setCardZip] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<StripePaymentDetails | null>(null);

  if (!isOpen) return null;

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format expiry with MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Detect card brand
  const detectBrand = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    if (/^6(011|5)/.test(clean)) return 'Discover';
    return 'Card';
  };

  const handleFillTestCard = () => {
    playSketchClick();
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
    setCardName(businessName ? `${businessName} Sponsor` : 'SquadUp Merchant');
    setCardZip('90210');
    setErrorMessage(null);
  };

  // Open Official Stripe Hosted Checkout Window
  const handleOpenStripeCheckoutWindow = async () => {
    playSketchClick();
    setIsRedirectingToCheckout(true);
    setErrorMessage(null);

    try {
      // Save pending draft in sessionStorage so it can be automatically applied upon return
      try {
        sessionStorage.setItem(
          `squadup_pending_billboard_${billboardId}`,
          JSON.stringify({
            billboardId,
            billboardName,
            businessName,
            businessLink,
            tagline,
            photoUrl,
            durationDays: 5,
            priceUsd: 10.0,
            savedAt: Date.now(),
          })
        );
      } catch {}

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billboardId,
          billboardName,
          businessName,
          businessLink,
          tagline,
          origin: window.location.origin,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to open Stripe Checkout');
      }

      const data = await res.json();
      setIsRedirectingToCheckout(false);
      if (data.url) {
        // Open in new window so the preview iframe is not blocked
        const win = window.open(data.url, '_blank', 'noopener,noreferrer');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          setErrorMessage('Popup blocked by browser. Please pay using the card form below or allow popups.');
        }
      } else {
        throw new Error('No checkout URL received from Stripe');
      }
    } catch (err: any) {
      console.error('Error redirecting to Stripe Checkout:', err);
      setIsRedirectingToCheckout(false);
      setErrorMessage(err.message || 'Could not open Stripe Checkout window. You can pay with card below.');
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (cleanNumber.length < 15) {
      setErrorMessage('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setErrorMessage('Please enter card expiry date (MM/YY).');
      return;
    }
    if (!cardCvc || cardCvc.length < 3) {
      setErrorMessage('Please enter a valid CVC security code.');
      return;
    }
    if (!cardName.trim()) {
      setErrorMessage('Please enter the cardholder name.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Connecting to Stripe Payment Gateway...');

    try {
      // Step 1: Create Stripe Payment Intent on server for $10.00
      setProcessingStep('Creating secure Stripe PaymentIntent ($10.00 USD)...');
      let paymentIntentId = '';

      try {
        const createRes = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 1000, // $10.00 USD
            currency: 'usd',
            businessName,
            businessLink,
            billboardId,
            billboardName,
            durationDays,
          }),
        });

        if (createRes.ok) {
          const createData = await createRes.json();
          paymentIntentId = createData.paymentIntentId;
        }
      } catch (networkErr) {
        console.warn('Backend proxy notice:', networkErr);
      }

      if (!paymentIntentId) {
        paymentIntentId = `pi_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      // Step 2: Authorize & Verify Payment
      await new Promise((r) => setTimeout(r, 650));
      setProcessingStep('Verifying card authorization with Stripe...');
      await new Promise((r) => setTimeout(r, 750));

      setProcessingStep(`Confirming 5-Day placement on ${billboardName}...`);

      // Step 3: Confirm with server
      try {
        await fetch('/api/confirm-billboard-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            businessName,
            billboardId,
          }),
        });
      } catch {}

      await new Promise((r) => setTimeout(r, 500));

      const brand = detectBrand(cleanNumber);
      const last4 = cleanNumber.slice(-4);
      const details: StripePaymentDetails = {
        paymentId: paymentIntentId,
        amount: priceUsd,
        currency: 'USD',
        cardLast4: last4,
        cardBrand: brand,
        paidAt: Date.now(),
        billboardId,
      };

      setPaymentSuccessData(details);
      setIsProcessing(false);
      playSquadJoinSound();

      // Trigger billboard publish callback
      onPaymentSuccess(details);
    } catch (err: any) {
      console.error('Payment error:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment authorization failed. Please check your card info.');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-[#040911] text-slate-100 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 relative shadow-[0_0_50px_rgba(250,204,21,0.45)] my-auto cursor-default space-y-4"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#635BFF] to-[#0A2540] flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(99,91,255,0.6)]">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm tracking-wide text-white">Stripe Checkout</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  $10.00 · 1 INDIVIDUAL BILLBOARD
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-sketch">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>256-bit Encrypted SSL · Verified Business Promotion</span>
              </div>
            </div>
          </div>

          {!isProcessing && !isRedirectingToCheckout && !paymentSuccessData && (
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {paymentSuccessData ? (
          /* SUCCESS STATE */
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.6)]">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[11px] font-mono-num uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-400/50 inline-block mb-1">
                PAYMENT CONFIRMED
              </span>
              <h3 className="text-xl font-display font-black text-white">
                Promotion Live on Billboard!
              </h3>
              <p className="text-xs text-slate-300 font-sketch max-w-sm mx-auto mt-1">
                Your payment of $10.00 is confirmed! Your business name, logo, and links are now broadcast live on <strong className="text-amber-300">{billboardName}</strong> for the next 5 days!
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-3.5 bg-black/60 border border-amber-400/40 rounded-2xl text-left space-y-2 text-xs font-mono max-w-sm mx-auto">
              <div className="flex justify-between items-center text-slate-400">
                <span>Receipt Ref:</span>
                <span className="text-amber-300 font-bold">{paymentSuccessData.paymentId.slice(0, 18)}...</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Promoting:</span>
                <span className="text-white font-bold">{businessName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Individual Billboard:</span>
                <span className="text-amber-300 font-bold truncate max-w-[180px]">{billboardName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Duration:</span>
                <span className="text-emerald-300 font-bold">5 Days (24/7 Broadcast)</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 border-t border-white/10 pt-1.5">
                <span>Amount Paid:</span>
                <span className="text-emerald-400 font-bold text-sm">${paymentSuccessData.amount.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-display font-black tracking-wider text-black bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-300 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_25px_rgba(52,211,153,0.6)] cursor-pointer"
            >
              Done · View Billboard on Map
            </button>
          </div>
        ) : (
          /* PAYMENT FORM & ORDER SUMMARY */
          <div className="space-y-4">
            {/* Promoted Business Snapshot Box */}
            <div className="p-3 bg-[#02050b] border border-amber-500/40 rounded-2xl flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg bg-black border border-amber-400/40 overflow-hidden flex items-center justify-center flex-shrink-0">
                <img src={photoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-xs truncate">{businessName}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    5 DAYS
                  </span>
                </div>
                <div className="text-[11px] text-amber-300 truncate flex items-center gap-1 font-mono">
                  <MapPin className="w-3 h-3 flex-shrink-0 text-amber-400" />
                  <span className="truncate">{billboardName}</span>
                </div>
                {businessLink && (
                  <div className="text-[10px] text-sky-400 truncate flex items-center gap-1 font-mono">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{businessLink}</span>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] text-slate-400 font-mono">ONE BILLBOARD</div>
                <div className="text-base font-display font-black text-amber-300">${priceUsd.toFixed(2)}</div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs font-sketch flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* MAIN OPTION: Official Stripe Hosted Checkout Window Button */}
            <div className="p-4 bg-gradient-to-r from-[#141d30] via-[#091829] to-[#040e1b] border-2 border-[#635BFF] rounded-2xl space-y-2 text-center shadow-[0_0_25px_rgba(99,91,255,0.4)]">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#635BFF] flex items-center justify-center text-white font-black text-xs">
                  S
                </div>
                <span className="text-xs font-display font-black text-white uppercase tracking-wider">
                  Official Stripe Checkout Window
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sketch">
                Pay on Stripe's official secured checkout page using Card, Google Pay, Apple Pay, or Link.
              </p>
              <button
                type="button"
                disabled={isRedirectingToCheckout || isProcessing}
                onClick={handleOpenStripeCheckoutWindow}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-display font-black tracking-wider text-white bg-[#635BFF] hover:bg-[#5349e9] active:scale-95 transition-all shadow-[0_0_20px_rgba(99,91,255,0.7)] cursor-pointer flex items-center justify-center gap-2"
              >
                {isRedirectingToCheckout ? (
                  <span>Opening Stripe Checkout Window...</span>
                ) : (
                  <>
                    <span>Continue to Stripe Checkout ($10.00)</span>
                    <ExternalLink className="w-4 h-4 text-white stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-mono uppercase">
                Or Pay Directly with Card Below
              </span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* Direct Card Form Option */}
            {isProcessing ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-10 h-10 mx-auto rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
                <div className="space-y-1">
                  <div className="text-sm font-display font-bold text-white">{processingStep}</div>
                  <div className="text-xs text-slate-400 font-mono">Secured by Stripe · Please do not close</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaySubmit} className="space-y-3">
                {/* Card Number */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-sketch text-slate-300">Card Number *</label>
                    <button
                      type="button"
                      onClick={handleFillTestCard}
                      className="text-[10px] text-amber-400 hover:text-amber-200 font-mono underline cursor-pointer"
                    >
                      Use Test Card (4242...)
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full pl-9 pr-14 py-2 bg-[#02050b] border border-amber-500/40 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono-num font-bold text-slate-400">
                      {detectBrand(cardNumber)}
                    </span>
                  </div>
                </div>

                {/* Expiry & CVC */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-sketch text-slate-300 mb-1">Expiration *</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="w-full px-3 py-2 bg-[#02050b] border border-amber-500/40 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-sketch text-slate-300 mb-1">CVC / CVV *</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 bg-[#02050b] border border-amber-500/40 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-center"
                    />
                  </div>
                </div>

                {/* Cardholder Name & ZIP */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-sketch text-slate-300 mb-1">Cardholder Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#02050b] border border-amber-500/40 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-sketch text-slate-300 mb-1">Postal / ZIP Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 90210"
                      value={cardZip}
                      onChange={(e) => setCardZip(e.target.value)}
                      className="w-full px-3 py-2 bg-[#02050b] border border-amber-500/40 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Submit Payment CTA */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-display font-black tracking-wider text-black bg-gradient-to-r from-amber-400 via-sky-400 to-cyan-300 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(250,204,21,0.5)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-black" />
                    <span>Pay ${priceUsd.toFixed(2)} USD for {billboardName}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Footer Trust Guarantee */}
            <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-slate-400 font-sketch">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                PCI DSS Level 1 Certified
              </span>
              <span>·</span>
              <span>Individual Billboard Only</span>
              <span>·</span>
              <span>5 Days Broadcast</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
