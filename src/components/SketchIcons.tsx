import React from 'react';

// Hand-drawn sketchy gaming icons with glowing outline strokes
interface IconProps {
  className?: string;
  glowColor?: 'green' | 'emerald' | 'amber' | 'lime';
}

export function SketchGamepad({ className = 'w-6 h-6', glowColor = 'green' }: IconProps) {
  const strokeColor = 
    glowColor === 'amber' ? '#f59e0b' :
    glowColor === 'lime' ? '#a3e635' :
    glowColor === 'emerald' ? '#10b981' : '#22c55e';

  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} style={{ filter: 'url(#sketch-glow)' }}>
      {/* Outer shell sketched */}
      <path
        d="M10 16 C6 18, 4 28, 7 38 C9 43, 14 44, 18 38 L22 34 C23 33, 25 33, 26 34 L30 38 C34 44, 39 43, 41 38 C44 28, 42 18, 38 16 C34 14, 14 14, 10 16 Z"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="40 1 35 1"
      />
      {/* Hand-drawn D-Pad */}
      <path
        d="M14 26 L18 26 M16 24 L16 28"
        stroke={strokeColor}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Buttons */}
      <circle cx="32" cy="24" r="1.6" stroke={strokeColor} strokeWidth="1.8" />
      <circle cx="35" cy="27" r="1.6" stroke={strokeColor} strokeWidth="1.8" />
      <circle cx="29" cy="27" r="1.6" stroke={strokeColor} strokeWidth="1.8" />
      {/* Middle sketch line */}
      <path
        d="M21 21 C23 20, 25 20, 27 21"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SketchCrosshair({ className = 'w-6 h-6', glowColor = 'green' }: IconProps) {
  const strokeColor = 
    glowColor === 'amber' ? '#f59e0b' :
    glowColor === 'lime' ? '#a3e635' :
    glowColor === 'emerald' ? '#10b981' : '#22c55e';

  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} style={{ filter: 'url(#sketch-glow)' }}>
      {/* Broken circle target */}
      <circle
        cx="24"
        cy="24"
        r="16"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeDasharray="14 8 16 7"
      />
      <circle
        cx="24"
        cy="24"
        r="6"
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeDasharray="8 4"
      />
      {/* Aim reticles */}
      <path d="M24 4 L24 14 M24 34 L24 44 M4 24 L14 24 M34 24 L44 24" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="24" r="1.5" fill={strokeColor} />
    </svg>
  );
}

export function SketchRadarIcon({ className = 'w-6 h-6', glowColor = 'green' }: IconProps) {
  const strokeColor = 
    glowColor === 'amber' ? '#f59e0b' :
    glowColor === 'lime' ? '#a3e635' :
    glowColor === 'emerald' ? '#10b981' : '#22c55e';

  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} style={{ filter: 'url(#sketch-glow)' }}>
      <circle cx="24" cy="24" r="20" stroke={strokeColor} strokeWidth="2.2" strokeDasharray="25 4 20 4" />
      <circle cx="24" cy="24" r="12" stroke={strokeColor} strokeWidth="1.8" strokeDasharray="15 3" opacity="0.8" />
      <circle cx="24" cy="24" r="4" stroke={strokeColor} strokeWidth="1.8" />
      <path d="M24 24 L38 12" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="34" cy="18" r="2.2" fill={strokeColor} />
    </svg>
  );
}

export function SketchUsers({ className = 'w-6 h-6', glowColor = 'green' }: IconProps) {
  const strokeColor = 
    glowColor === 'amber' ? '#f59e0b' :
    glowColor === 'lime' ? '#a3e635' :
    glowColor === 'emerald' ? '#10b981' : '#22c55e';

  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} style={{ filter: 'url(#sketch-glow)' }}>
      <circle cx="24" cy="15" r="7" stroke={strokeColor} strokeWidth="2.2" strokeDasharray="18 2" />
      <path d="M12 38 C13 30, 18 28, 24 28 C30 28, 35 30, 36 38" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="11" cy="18" r="5" stroke={strokeColor} strokeWidth="1.8" opacity="0.65" strokeDasharray="12 2" />
      <path d="M4 36 C5 31, 8 30, 12 30" stroke={strokeColor} strokeWidth="1.8" opacity="0.65" strokeLinecap="round" />
      <circle cx="37" cy="18" r="5" stroke={strokeColor} strokeWidth="1.8" opacity="0.65" strokeDasharray="12 2" />
      <path d="M36 30 C40 30, 43 31, 44 36" stroke={strokeColor} strokeWidth="1.8" opacity="0.65" strokeLinecap="round" />
    </svg>
  );
}

// Hand-sketched button with glowing outline
export function SketchButton({
  children,
  onClick,
  variant = 'green',
  size = 'md',
  className = '',
  type = 'button',
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'green' | 'emerald' | 'amber' | 'lime' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}) {
  const styles = {
    green: {
      border: '#22c55e',
      text: 'text-green-300',
      hoverBg: 'hover:bg-green-500/15',
      glow: '0 0 16px rgba(34, 197, 94, 0.6)',
    },
    emerald: {
      border: '#10b981',
      text: 'text-emerald-300',
      hoverBg: 'hover:bg-emerald-500/15',
      glow: '0 0 16px rgba(16, 185, 129, 0.6)',
    },
    amber: {
      border: '#f59e0b',
      text: 'text-amber-300',
      hoverBg: 'hover:bg-amber-500/15',
      glow: '0 0 16px rgba(245, 158, 11, 0.6)',
    },
    lime: {
      border: '#a3e635',
      text: 'text-lime-300',
      hoverBg: 'hover:bg-lime-500/15',
      glow: '0 0 16px rgba(163, 230, 53, 0.6)',
    },
    ghost: {
      border: '#475569',
      text: 'text-slate-300',
      hoverBg: 'hover:bg-slate-800/40',
      glow: 'none',
    },
  };

  const sizeClass = 
    size === 'hero' ? 'px-8 py-4 text-xl tracking-wider font-semibold' :
    size === 'lg' ? 'px-6 py-3 text-base font-semibold' :
    size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm font-medium';

  const cur = styles[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-95 whitespace-nowrap ${cur.text} ${cur.hoverBg} ${sizeClass} ${className}`}
      style={{
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        border: `2px solid ${cur.border}`,
        boxShadow: cur.glow,
        filter: 'url(#sketch-glow)',
        backgroundColor: 'rgba(5, 14, 8, 0.9)',
      }}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="font-display tracking-wide">{children}</span>
    </button>
  );
}
