import React from 'react';

interface SquadUpLogoProps {
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  textSize?: string;
}

export function SquadUpLogo({
  className = '',
  iconSize = 'sm',
  showIcon = false,
  showText = true,
  textSize = 'text-xl sm:text-2xl',
}: SquadUpLogoProps) {
  const iconDimensions =
    iconSize === 'lg'
      ? 'w-24 h-24 sm:w-32 sm:h-32'
      : iconSize === 'md'
      ? 'w-12 h-12 sm:w-14 sm:h-14'
      : 'w-9 h-9 sm:w-10 sm:h-10';

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {/* Tactical Gamer Controller Emblem from Splash */}
      {showIcon && (
        <div className="relative flex-shrink-0">
        <svg
          className={`${iconDimensions} drop-shadow-[0_0_15px_rgba(34,197,94,0.85)]`}
          viewBox="0 0 160 160"
          fill="none"
          style={{ filter: 'url(#sketch-glow)' }}
        >
          <defs>
            <linearGradient id="navNeonGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="navCyberLimeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="navShieldFillGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#052e16" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#02140a" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Ambient radar sonar sweep ring */}
          <circle
            cx="80"
            cy="80"
            r="76"
            stroke="#22c55e"
            strokeWidth="1"
            strokeDasharray="4 8"
            strokeOpacity="0.4"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="#4ade80"
            strokeWidth="1.2"
            strokeDasharray="18 6 4 6"
            strokeOpacity="0.6"
          />

          {/* Tactical Outer Shield Crest */}
          <polygon
            points="80,12 138,36 146,84 126,128 80,152 34,128 14,84 22,36"
            fill="url(#navShieldFillGrad)"
            stroke="url(#navNeonGlowGrad)"
            strokeWidth="2.8"
            strokeLinejoin="round"
            strokeDasharray="160 4 150 4"
          />

          {/* Second inner cybernetic chamfer frame */}
          <polygon
            points="80,20 130,42 136,82 120,120 80,142 40,120 24,82 30,42"
            stroke="#a3e635"
            strokeWidth="1.2"
            strokeOpacity="0.75"
            strokeDasharray="40 4 30 3"
            strokeLinejoin="round"
          />

          {/* Tactical Corner Chevrons / Armor Notches */}
          <path
            d="M38 46 L30 42 L26 70"
            stroke="#22c55e"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M122 46 L130 42 L134 70"
            stroke="#22c55e"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44 116 L36 124 L56 136"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M116 116 L124 124 L104 136"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* High-Tech Tactical Esports Controller Silhouette */}
          {/* Top trigger / bumper bar (LB / RB) */}
          <path
            d="M52 48 Q 80 43 108 48 L114 54 Q 80 49 46 54 Z"
            fill="#064e3b"
            stroke="#4ade80"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />

          {/* Main Controller Body with Aggressive Contoured Grips */}
          <path
            d="M46 56 C34 60, 26 76, 32 98 C36 110, 48 114, 56 102 L64 90 C68 84, 92 84, 96 90 L104 102 C112 114, 124 110, 128 98 C134 76, 126 60, 114 56 C104 52, 56 52, 46 56 Z"
            fill="#031f0d"
            stroke="url(#navNeonGlowGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Stylized Cyber D-Pad (Left Side) */}
          <path
            d="M48 68 L54 68 L54 62 L58 62 L58 68 L64 68 L64 72 L58 72 L58 78 L54 78 L54 72 L48 72 Z"
            fill="#14532d"
            stroke="#a3e635"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="56" cy="70" r="1.2" fill="#facc15" />

          {/* Stylized Action Buttons (Right Side) Diamond Array */}
          <circle cx="104" cy="64" r="2.8" fill="#15803d" stroke="#4ade80" strokeWidth="1.4" />
          <circle cx="112" cy="70" r="2.8" fill="#15803d" stroke="#a3e635" strokeWidth="1.4" />
          <circle cx="96" cy="70" r="2.8" fill="#15803d" stroke="#22c55e" strokeWidth="1.4" />
          <circle cx="104" cy="76" r="2.8" fill="#15803d" stroke="#86efac" strokeWidth="1.4" />

          {/* Left Thumbstick with Precision Crosshair Reticle */}
          <circle cx="68" cy="85" r="7.5" fill="#022c14" stroke="#22c55e" strokeWidth="1.6" />
          <circle cx="68" cy="85" r="4.2" stroke="#a3e635" strokeWidth="1.2" strokeDasharray="3 1.5" />
          <circle cx="68" cy="85" r="1.5" fill="#86efac" />

          {/* Right Thumbstick with Precision Crosshair Reticle */}
          <circle cx="92" cy="85" r="7.5" fill="#022c14" stroke="#22c55e" strokeWidth="1.6" />
          <circle cx="92" cy="85" r="4.2" stroke="#a3e635" strokeWidth="1.2" strokeDasharray="3 1.5" />
          <circle cx="92" cy="85" r="1.5" fill="#86efac" />

          {/* Center SquadUp Tactical V-Apex Neon Power Crest */}
          <path
            d="M72 65 L80 75 L88 65"
            stroke="#facc15"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M75 62 L80 69 L85 62"
            stroke="#a3e635"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precision HUD Crosshair Overlays */}
          <line x1="80" y1="22" x2="80" y2="34" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
          <line x1="80" y1="128" x2="80" y2="140" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="80" x2="36" y2="80" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
          <line x1="124" y1="80" x2="136" y2="80" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />

          {/* Center HUD reticle target */}
          <circle cx="80" cy="80" r="16" stroke="#4ade80" strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.7" />
          <circle cx="80" cy="80" r="2.5" fill="#22c55e" />

          {/* Tactical Optical Glint */}
          <path
            d="M40 28 L42 34 L48 36 L42 38 L40 44 L38 38 L32 36 L38 34 Z"
            fill="#ffffff"
            opacity="0.9"
          />
        </svg>
      </div>
      )}

      {/* Styled SquadUp Text with Neon Glow & Underline */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={`${textSize} font-black font-display tracking-tight text-white select-none leading-none`}
            style={{
              textShadow:
                '0 0 10px rgba(34, 197, 94, 0.9), 0 0 22px rgba(34, 197, 94, 0.55)',
              filter: 'url(#sketch-glow)',
            }}
          >
            <span className="text-green-400">Squad</span>
            <span className="text-lime-400">Up</span>
          </span>
          <svg
            className="w-20 sm:w-24 h-2 mt-0.5 text-green-400 pointer-events-none"
            viewBox="0 0 380 24"
            fill="none"
            style={{ filter: 'url(#sketch-glow)' }}
          >
            <path
              d="M8 12 Q 100 4, 190 14 T 372 10"
              stroke="#22c55e"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M12 16 Q 120 8, 210 16 T 366 14"
              stroke="#a3e635"
              strokeWidth="2.5"
              strokeOpacity="0.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
