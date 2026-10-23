import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Building2,
  Globe,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  AirshipBillboardData,
  saveAirshipBillboard,
  clearAirshipBillboard,
  AerialCraftType,
} from '../utils/airshipFlight';
import { playSketchClick, playSquadJoinSound } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { Airship3D, AirshipSceneController } from './Airship3D';
import { StripePaymentModal, StripePaymentDetails } from './StripePaymentModal';

interface AirshipBillboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  billboardId?: string;
  billboardName?: string;
  activeBillboard: AirshipBillboardData | null;
  onBillboardUpdated?: (data: AirshipBillboardData | null) => void;
  initialCraftType?: AerialCraftType;
  initialOpenDrawer?: boolean;
}

export const AirshipBillboardModal: React.FC<AirshipBillboardModalProps> = ({
  isOpen,
  onClose,
  billboardId = 'current',
  billboardName = 'Selected Billboard',
  activeBillboard,
  onBillboardUpdated,
  initialCraftType = 'airship',
  initialOpenDrawer = false,
}) => {
  const { user, gamerProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const airshipCtrlRef = useRef<AirshipSceneController | null>(null);

  // Form states for business promotion
  const [businessName, setBusinessName] = useState<string>('');
  const [businessLink, setBusinessLink] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null);

  // Locked strictly to 5 Days Promotion for ONE individual billboard at $10.00
  const promotionDays = 5;
  const promotionPrice = 10.0; // $10.00 USD for one individual billboard
  const [isOpeningCheckout, setIsOpeningCheckout] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showUploadDrawer, setShowUploadDrawer] = useState<boolean>(false);
  const [isStripeModalOpen, setIsStripeModalOpen] = useState<boolean>(false);
  const [directStripeUrl, setDirectStripeUrl] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(0.8);
  const [currentCraftType, setCurrentCraftType] = useState<AerialCraftType>(initialCraftType);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImageDataUrl(activeBillboard?.imageUrl || null);
      setBusinessName(activeBillboard?.businessName || '');
      setBusinessLink(activeBillboard?.businessLink || '');
      setTagline(activeBillboard?.tagline || '');
      setErrorMsg(null);
      setSuccessMsg(null);
      // If user clicked Promote on Billboards, open drawer immediately!
      setShowUploadDrawer(initialOpenDrawer || !activeBillboard?.businessName);
      setIsStripeModalOpen(false);
      setCurrentZoom(0.8);
      setCurrentCraftType(initialCraftType || 'airship');
    }
  }, [isOpen, activeBillboard, initialCraftType, initialOpenDrawer]);

  // Real-time 5-day expiration checker: deletes billboard as soon as 5 days end so new users can promote
  useEffect(() => {
    if (!isOpen || !activeBillboard?.expireTimestamp) return;

    const checkExpiration = () => {
      if (Date.now() >= activeBillboard.expireTimestamp) {
        clearAirshipBillboard(billboardId);
        if (onBillboardUpdated) {
          onBillboardUpdated(null);
        }
        airshipCtrlRef.current?.updateBillboardImage(null, null, null);
        setSelectedImageDataUrl(null);
        setBusinessName('');
        setBusinessLink('');
        setTagline('');
        setShowUploadDrawer(true);
        setSuccessMsg(
          'Previous 5-day promotion has completed and been cleared! This billboard is now available for new sponsors.'
        );
      }
    };

    checkExpiration();
    const timer = setInterval(checkExpiration, 10000);
    return () => clearInterval(timer);
  }, [isOpen, activeBillboard, billboardId, onBillboardUpdated]);

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isStripeModalOpen) {
        if (showUploadDrawer) {
          setShowUploadDrawer(false);
        } else {
          playSketchClick();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showUploadDrawer, isStripeModalOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file type. Please select a JPG, PNG, or WEBP logo/image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const maxW = 1200;
        const maxH = 600;

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.88);
          setSelectedImageDataUrl(compressedUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Open Official Stripe Hosted Checkout Window
  const handleOpenStripeCheckoutWindow = async () => {
    setErrorMsg(null);
    if (!selectedImageDataUrl) {
      setErrorMsg('Please upload your business logo or promotional photo first.');
      return;
    }
    if (!businessName.trim()) {
      setErrorMsg('Please enter your business or brand name.');
      return;
    }

    setIsOpeningCheckout(true);
    playSketchClick();

    // Open a blank tab synchronously on click to avoid browser popup blockers
    let checkoutTab: Window | null = null;
    try {
      checkoutTab = window.open('about:blank', '_blank');
    } catch (_) {}

    try {
      // Save draft in sessionStorage for recovery upon payment return
      try {
        sessionStorage.setItem(
          `squadup_pending_billboard_${billboardId}`,
          JSON.stringify({
            billboardId,
            billboardName,
            businessName: businessName.trim(),
            businessLink: businessLink.trim(),
            tagline: tagline.trim(),
            photoUrl: selectedImageDataUrl,
            durationDays: promotionDays,
            priceUsd: promotionPrice,
            savedAt: Date.now(),
          })
        );
      } catch {}

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          billboardId,
          billboardName,
          businessName: businessName.trim(),
          businessLink: businessLink.trim(),
          tagline: tagline.trim(),
          origin: window.location.origin,
        }),
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please complete payment using the card form below.');
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create Stripe checkout session');
      }

      const data = await res.json();
      setIsOpeningCheckout(false);

      if (data.url) {
        setDirectStripeUrl(data.url);
        if (checkoutTab && !checkoutTab.closed) {
          checkoutTab.location.href = data.url;
        }
        // Always open in-app modal as seamless companion with link and card form
        setIsStripeModalOpen(true);
      } else {
        if (checkoutTab) checkoutTab.close();
        setIsStripeModalOpen(true);
      }
    } catch (err: any) {
      console.error('Error opening checkout window:', err);
      if (checkoutTab) {
        try { checkoutTab.close(); } catch (_) {}
      }
      setIsOpeningCheckout(false);
      // Fallback: Open in-app modal so user can pay right away
      setIsStripeModalOpen(true);
    }
  };

  // Step 1B: Open In-App Card Modal
  const handleProceedToPayment = () => {
    setErrorMsg(null);
    if (!selectedImageDataUrl) {
      setErrorMsg('Please upload your business logo or promotional photo first.');
      return;
    }
    if (!businessName.trim()) {
      setErrorMsg('Please enter your business or brand name.');
      return;
    }

    // Open Stripe Card Modal
    playSketchClick();
    setIsStripeModalOpen(true);
  };

  // Step 2: Payment Verified & Confirmed by Stripe
  const handlePaymentConfirmed = async (details: StripePaymentDetails) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const now = Date.now();
      const expireTimestamp = now + promotionDays * 24 * 60 * 60 * 1000;

      const payload: AirshipBillboardData = {
        billboardId,
        billboardName,
        imageUrl: selectedImageDataUrl!,
        businessName: businessName.trim(),
        businessLink: businessLink.trim() || undefined,
        tagline: tagline.trim() || undefined,
        uploadedAt: now,
        expireTimestamp,
        durationDays: promotionDays,
        uploaderName: gamerProfile?.gamerTag || user?.displayName || businessName.trim(),
        uploaderUid: user?.uid,
        paymentConfirmed: true,
        paymentId: details.paymentId,
        amountCents: Math.round(details.amount * 100),
        currency: details.currency,
      };

      await saveAirshipBillboard(payload, billboardId);
      if (onBillboardUpdated) {
        onBillboardUpdated(payload);
      }

      // Update active 3D model
      airshipCtrlRef.current?.updateBillboardImage(
        payload.imageUrl,
        payload.businessName,
        payload.businessLink
      );

      setSuccessMsg(`Payment confirmed! Your 5-day promotion is now broadcast live on ${billboardName}!`);
      setShowUploadDrawer(false);
    } catch (err: any) {
      console.warn('Error saving billboard promotion:', err);
      setErrorMsg(err.message || 'Payment confirmed, but failed to save billboard. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearBillboard = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await clearAirshipBillboard(billboardId);
      setSelectedImageDataUrl(null);
      setBusinessName('');
      setBusinessLink('');
      setTagline('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onBillboardUpdated) {
        onBillboardUpdated(null);
      }
      airshipCtrlRef.current?.updateBillboardImage(null, null, null);
      playSketchClick();
      setSuccessMsg(`Billboard on ${billboardName} reset to default equalizer.`);
      setTimeout(() => {
        setShowUploadDrawer(false);
      }, 800);
    } catch (err: any) {
      console.warn('Error clearing billboard:', err);
      setErrorMsg(err.message || 'Failed to clear billboard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDisplayImage = selectedImageDataUrl || activeBillboard?.imageUrl;
  const currentBusinessName = businessName || activeBillboard?.businessName;
  const currentBusinessLink = businessLink || activeBillboard?.businessLink;

  // Calculate time remaining for active promotion
  const calculateRemaining = () => {
    if (!activeBillboard?.expireTimestamp) return null;
    const diff = activeBillboard.expireTimestamp - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days}d ${hours}h remaining`;
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#02050b]/98 backdrop-blur-2xl flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Full-Screen 3D Airship & Air Balloon Theater */}
      <main className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Subtle Cyber Aerial Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px]" />

        {/* Top-Left: Active Sponsor Card (Promotes business name, logo & clickable link!) */}
        {activeBillboard?.businessName && (
          <div className="absolute top-4 left-4 sm:top-5 sm:left-6 z-50 max-w-sm sm:max-w-md bg-[#030c17]/95 border-2 border-amber-400 rounded-2xl p-3 sm:p-4 shadow-[0_0_30px_rgba(251,191,36,0.5)] backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              {activeBillboard.imageUrl && (
                <div className="w-14 h-11 rounded-lg bg-black/80 border border-amber-400/50 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                  <img
                    src={activeBillboard.imageUrl}
                    alt={activeBillboard.businessName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-num font-black bg-amber-400 text-black shadow-[0_0_8px_#facc15]">
                    ★ 5-DAY SPONSOR
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{calculateRemaining()}</span>
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-display font-black text-white truncate mt-0.5">
                  {activeBillboard.businessName}
                </h2>
                {activeBillboard.tagline && (
                  <p className="text-[11px] text-slate-300 italic truncate font-sketch">
                    {activeBillboard.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Clickable Business Link */}
            {activeBillboard.businessLink && (
              <div className="mt-2.5 pt-2 border-t border-amber-400/20 flex items-center justify-between">
                <a
                  href={
                    activeBillboard.businessLink.startsWith('http')
                      ? activeBillboard.businessLink
                      : `https://${activeBillboard.businessLink}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-sky-400 to-cyan-300 hover:brightness-110 text-black font-display font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(56,189,248,0.5)] cursor-pointer"
                >
                  <span>Visit {activeBillboard.businessName}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* 3D Airship / Pokemon Air Balloon Canvas Rendered Big Across The Entire Screen */}
        <div className="w-full h-full relative flex items-center justify-center">
          <Airship3D
            width="100%"
            height="100%"
            className="w-full h-full"
            imageUrl={currentDisplayImage}
            businessName={currentBusinessName}
            businessLink={currentBusinessLink}
            modelScale={0.72}
            initialZoom={0.8}
            enableZoom={true}
            craftType={currentCraftType}
            onZoomChange={(z) => setCurrentZoom(z)}
            onControllerReady={(ctrl) => {
              airshipCtrlRef.current = ctrl;
            }}
            autoRotate={true}
            interactiveOrbit={true}
          />
        </div>

        {/* Clean Top-Right Corner Controls: Promote Business Button, Closed X */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-50 flex items-center flex-wrap justify-end gap-2">

          {/* Promote Your Business Button */}
          <button
            type="button"
            onClick={() => {
              playSketchClick();
              setShowUploadDrawer((prev) => !prev);
            }}
            className={`px-3 sm:px-4 py-2 text-xs font-display font-black tracking-wider rounded-xl border flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:scale-105 active:scale-95 ${
              showUploadDrawer
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_30px_rgba(250,204,21,0.9)]'
                : 'bg-[#0f1d2e] text-amber-300 border-amber-400 hover:bg-[#162a42]'
            }`}
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            title="Promote your business on our billboards"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Promote Business (5 Days)</span>
          </button>

          {/* Closed X on the Corner */}
          <button
            type="button"
            onClick={() => {
              playSketchClick();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-[#040e1a]/90 hover:bg-rose-950/90 border border-sky-400/50 hover:border-rose-400 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:scale-105 active:scale-95 backdrop-blur-md"
            title="Close View (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Promotion Details & Upload Drawer (Step 1) */}
        {showUploadDrawer && (
          <div className="absolute top-16 sm:top-20 right-4 sm:right-6 z-50 w-[94vw] max-w-md bg-[#030b14]/98 border-2 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-[0_0_45px_rgba(250,204,21,0.55)] backdrop-blur-2xl text-left space-y-3.5 animate-in slide-in-from-top-3 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-white tracking-wide">
                    Promote Your Business
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Airship · Air Balloon · Dragon · Map Billboards
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadDrawer(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Logo / Photo Upload Area */}
            <div>
              <label className="block text-xs font-sketch text-slate-200 mb-1">
                Business Logo or Promotional Photo *
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-sky-500/50 hover:border-amber-400 rounded-xl p-3 text-center cursor-pointer transition-colors bg-black/60 group"
              >
                {!selectedImageDataUrl ? (
                  <div className="py-2.5 space-y-1">
                    <Upload className="w-7 h-7 mx-auto text-amber-400 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white font-display">
                      Tap to Upload Logo / Photo
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      PNG, JPG, WEBP · Fits 3D billboards & map screens
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-28 rounded-lg overflow-hidden bg-black/90 flex items-center justify-center">
                    <img
                      src={selectedImageDataUrl}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <span className="absolute top-1.5 right-1.5 bg-black/80 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-400/40">
                      Promotional Graphic
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="absolute bottom-1.5 right-1.5 bg-amber-950/90 text-amber-200 text-[10px] font-sketch px-2 py-0.5 rounded border border-amber-400/50"
                    >
                      Change Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Business Name Input */}
            <div>
              <label className="block text-xs font-sketch text-slate-200 mb-1">
                Business or Brand Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Gaming Cafe, Pixel Coffee"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-black/80 border border-sky-500/40 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none font-display font-medium"
                />
                <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Business Link Input */}
            <div>
              <label className="block text-xs font-sketch text-slate-200 mb-1">
                Website or Social Media Link
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. https://mybusiness.com or twitter.com/brand"
                  value={businessLink}
                  onChange={(e) => setBusinessLink(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-black/80 border border-sky-500/40 focus:border-amber-400 rounded-xl text-xs text-sky-200 placeholder-slate-600 focus:outline-none font-mono"
                />
                <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Short Tagline or Offer */}
            <div>
              <label className="block text-xs font-sketch text-slate-200 mb-1">
                Headline / Offer (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 20% off with code SQUAD! Open 24/7"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-black/80 border border-sky-500/40 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            {/* Duration: LOCKED STRICTLY TO 5 DAYS PROMOTION FOR 1 INDIVIDUAL BILLBOARD */}
            <div className="p-3 bg-gradient-to-br from-[#0c1829] to-[#040e1b] border-2 border-amber-400/70 rounded-2xl space-y-1.5 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-display font-black text-amber-300 uppercase tracking-wider">
                    5-Day Promotion · 1 Billboard
                  </span>
                </div>
                <div className="text-sm font-display font-black text-white bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/40">
                  ${promotionPrice.toFixed(2)} USD
                </div>
              </div>
              <p className="text-[11px] text-slate-300 font-sketch leading-relaxed">
                The payment of $10.00 is strictly for <strong className="text-amber-300">{billboardName}</strong>. Your business logo, name, and links will rotate 24/7 on this billboard for 5 full days.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2 text-xs text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2 text-xs text-lime-300 bg-lime-950/60 border border-lime-500/40 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-2 pt-1">
              {/* Official Stripe Checkout Window Button */}
              <button
                type="button"
                onClick={handleOpenStripeCheckoutWindow}
                disabled={isSubmitting || isOpeningCheckout}
                className="w-full py-3 px-4 rounded-xl text-xs font-display font-black tracking-wider cursor-pointer transition-all shadow-[0_0_25px_rgba(99,91,255,0.7)] flex items-center justify-center gap-2 bg-[#635BFF] hover:bg-[#5248e8] text-white hover:scale-[1.02] active:scale-95"
              >
                <span>{isOpeningCheckout ? 'Opening Stripe Checkout...' : 'Open Stripe Checkout Window ($10.00)'}</span>
                <ExternalLink className="w-4 h-4 text-white stroke-[2.5]" />
              </button>

              {activeBillboard?.imageUrl && (
                <button
                  type="button"
                  onClick={handleClearBillboard}
                  disabled={isSubmitting || isOpeningCheckout}
                  className="w-full py-2 px-3 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-display font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset / Clear Billboard</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-sketch pt-0.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Stripe verifies payment before publishing your 5-day promotion</span>
            </div>
          </div>
        )}
      </main>

      {/* Stripe Payment Modal (Step 2) */}
      <StripePaymentModal
        isOpen={isStripeModalOpen}
        onClose={() => setIsStripeModalOpen(false)}
        billboardId={billboardId}
        billboardName={billboardName}
        businessName={businessName}
        businessLink={businessLink}
        tagline={tagline}
        photoUrl={selectedImageDataUrl || ''}
        durationDays={promotionDays}
        priceUsd={promotionPrice}
        initialDirectUrl={directStripeUrl || undefined}
        onPaymentSuccess={handlePaymentConfirmed}
      />
    </div>
  );
};
