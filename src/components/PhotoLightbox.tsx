import React from 'react';
import { X, Tag, RefreshCw } from 'lucide-react';

interface PhotoLightboxProps {
  photoUrl: string | null;
  caption?: string;
  price?: string;
  priceType?: 'firm' | 'negotiable';
  intent?: 'sell' | 'trade' | 'both';
  condition?: string;
  description?: string;
  onClose: () => void;
}

export function PhotoLightbox({
  photoUrl,
  caption,
  price,
  priceType,
  intent,
  condition,
  description,
  onClose,
}: PhotoLightboxProps) {
  // Escape key listener
  React.useEffect(() => {
    if (!photoUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoUrl, onClose]);

  if (!photoUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/92 backdrop-blur-md cursor-zoom-out select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#030904] border-2 border-green-400 p-4 sm:p-6 rounded-2xl shadow-2xl flex flex-col items-center cursor-default overflow-y-auto"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
      >
        {/* Simple outline smaller X close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-50 p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
          title="Close [Esc]"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[1.75]" />
        </button>

        {/* Screenshot Image Container */}
        <div className="w-full flex justify-center pt-2 sm:pt-1">
          <img
            src={photoUrl}
            alt={caption || 'Gaming screenshot'}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg border border-green-500/30 shadow-lg"
          />
        </div>

        {/* Item Details below image if available */}
        {(price || priceType || intent || condition || description) && (
          <div className="w-full mt-3 p-3 bg-black/70 border border-green-500/30 rounded-xl space-y-2 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {price && (
                  <span className="text-base font-mono-num font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-400/60">
                    {price}
                  </span>
                )}
                {condition && (
                  <span className="text-[11px] font-sketch font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/50">
                    {condition}
                  </span>
                )}
                {priceType && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                      priceType === 'firm'
                        ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    }`}
                  >
                    {priceType === 'firm' ? '🔒 Firm on Price' : '🤝 Negotiable / OBO'}
                  </span>
                )}
              </div>

              {intent && (
                <span
                  className={`text-[11px] font-display font-bold px-2.5 py-0.5 rounded uppercase border flex items-center gap-1 ${
                    intent === 'sell'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-400/60'
                      : intent === 'trade'
                      ? 'bg-amber-950 text-amber-300 border-amber-400/60'
                      : 'bg-lime-950 text-lime-300 border-lime-400/60'
                  }`}
                >
                  {intent === 'sell' ? '💵 Sell' : intent === 'trade' ? '🔄 Trade' : '💵+🔄 Sell or Trade'}
                </span>
              )}
            </div>

            {description && (
              <p className="text-xs sm:text-sm font-sketch text-slate-200 whitespace-pre-line leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {caption && !description && (
          <div className="w-full text-center py-2 text-xs font-sketch text-green-200 border-t border-green-500/20 mt-2">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}
