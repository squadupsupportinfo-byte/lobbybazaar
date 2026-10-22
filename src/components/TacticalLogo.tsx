import React from 'react';

interface TacticalLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showHUD?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const TacticalLogo: React.FC<TacticalLogoProps> = ({
  size = 'md',
  showHUD = true,
  animated = true,
  className = '',
  onClick,
}) => {
  // Dimension mapping
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 48
      : size === 'md'
      ? 96
      : size === 'lg'
      ? 160
      : size === 'xl'
      ? 240
      : 340; // 'hero'

  // Unique ID prefix for gradients and filters
  const id = React.useId().replace(/:/g, '');

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none max-w-full aspect-square ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
      style={{ width: pixelSize, height: pixelSize, maxWidth: 'min(100%, 85vw)', maxHeight: '85vw' }}
    >
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full overflow-visible ${
          animated ? 'drop-shadow-[0_0_25px_rgba(34,197,94,0.45)]' : ''
        }`}
      >
        <defs>
          {/* Neon Glow Filter */}
          <filter id={`tactical-glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`cyan-glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id={`limeNeon-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>

          <linearGradient id={`emeraldGrad-${id}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          <linearGradient id={`shieldBackdrop-${id}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#04210e" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#010e05" stopOpacity="0.96" />
          </linearGradient>

          <linearGradient id={`cyanLaser-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* ================================================================= */}
        {/* ZONE 1: TACTICAL RADAR BACKGROUND HUD & CONCENTRIC RINGS (when HUD on) */}
        {/* ================================================================= */}
        {showHUD && (
          <g className="hud-layer" opacity="0.88">
            {/* Fine radar grid background circle */}
            <circle
              cx="250"
              cy="250"
              r="220"
              stroke="#22c55e"
              strokeWidth="0.8"
              strokeDasharray="4 8"
              strokeOpacity="0.25"
            />
            <circle
              cx="250"
              cy="250"
              r="190"
              stroke="#4ade80"
              strokeWidth="1.2"
              strokeDasharray="16 6 4 6"
              strokeOpacity="0.4"
              className={animated ? 'animate-[spin_40s_linear_infinite]' : ''}
              style={{ transformOrigin: 'center' }}
            />
            <circle
              cx="250"
              cy="250"
              r="140"
              stroke="#86efac"
              strokeWidth="1"
              strokeDasharray="8 6"
              strokeOpacity="0.3"
            />

            {/* Radar arc telemetry segments */}
            <path
              d="M 120 120 A 185 185 0 0 1 380 120"
              stroke="#22c55e"
              strokeWidth="1.2"
              strokeDasharray="6 4"
              strokeOpacity="0.4"
            />
            <path
              d="M 100 320 A 185 185 0 0 0 400 320"
              stroke="#22c55e"
              strokeWidth="1.2"
              strokeDasharray="12 8"
              strokeOpacity="0.35"
            />

            {/* Tactical 4 Corner Brackets */}
            {/* Top-Left Bracket (Cyan) */}
            <path
              d="M 160 110 L 140 110 L 140 145"
              stroke="#38bdf8"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#cyan-glow-${id})`}
            />
            {/* Top-Right Bracket (Cyan) */}
            <path
              d="M 340 110 L 360 110 L 360 145"
              stroke="#38bdf8"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#cyan-glow-${id})`}
            />
            {/* Bottom-Left Bracket (Lime) */}
            <path
              d="M 160 390 L 140 390 L 140 355"
              stroke="#a3e635"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#tactical-glow-${id})`}
            />
            {/* Bottom-Right Bracket (Lime) */}
            <path
              d="M 340 390 L 360 390 L 360 355"
              stroke="#a3e635"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#tactical-glow-${id})`}
            />

            {/* HUD Status Text Annotations */}
            <text
              x="170"
              y="126"
              fill="#38bdf8"
              fontFamily="monospace, monospace"
              fontSize="12"
              fontWeight="bold"
              letterSpacing="1.5"
              opacity="0.95"
              filter={`url(#cyan-glow-${id})`}
            >
              SYS: ONLINE
            </text>

            <text
              x="278"
              y="126"
              fill="#a3e635"
              fontFamily="monospace, monospace"
              fontSize="12"
              fontWeight="bold"
              letterSpacing="1.5"
              opacity="0.9"
            >
              LOCK: RADAR
            </text>

            <text
              x="250"
              y="382"
              textAnchor="middle"
              fill="#4ade80"
              fontFamily="monospace, monospace"
              fontSize="11"
              fontWeight="bold"
              letterSpacing="3"
              opacity="0.85"
            >
              RADAR · COMBAT · SQUAD
            </text>
          </g>
        )}

        {/* ================================================================= */}
        {/* ZONE 2: TACTICAL SHIELD CREST & APEX CHEVRONS */}
        {/* ================================================================= */}
        <g id="shield-group" filter={`url(#tactical-glow-${id})`}>
          {/* Outer Hand-Sketched Faceted Shield */}
          <polygon
            points="250,115 335,160 345,260 295,340 250,365 205,340 155,260 165,160"
            fill={`url(#shieldBackdrop-${id})`}
            stroke="#4ade80"
            strokeWidth="3.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Inner Contoured Neon Ring Edge */}
          <polygon
            points="250,128 324,168 332,252 288,326 250,348 212,326 168,252 176,168"
            stroke="#a3e635"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeDasharray="60 4 50 4"
            opacity="0.75"
          />

          {/* Top Apex Arrow (▲ pointing up) */}
          <path
            d="M 250 96 L 268 120 L 250 114 L 232 120 Z"
            fill="url(#limeNeon-)"
            fillOpacity="0.9"
            stroke="#a3e635"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M 250 108 L 260 124 L 250 120 L 240 124 Z"
            fill="#38bdf8"
            opacity="0.8"
          />

          {/* Left Outward Arrow Chevron (◀) */}
          <path
            d="M 132 250 L 158 234 L 154 250 L 158 266 Z"
            fill="#4ade80"
            stroke="#86efac"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Right Outward Arrow Chevron (▶) */}
          <path
            d="M 368 250 L 342 234 L 346 250 L 342 266 Z"
            fill="#4ade80"
            stroke="#86efac"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Bottom Downward Point Notch (▼) */}
          <path
            d="M 250 365 L 250 380"
            stroke="#a3e635"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </g>

        {/* ================================================================= */}
        {/* ZONE 3: AGGRESSIVE GAMING CONTROLLER BODY */}
        {/* ================================================================= */}
        <g id="controller-body" filter={`url(#tactical-glow-${id})`}>
          {/* Top Trigger Arcs */}
          <path
            d="M 195 186 C 220 180, 280 180, 305 186"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M 188 198 C 215 190, 285 190, 312 198"
            stroke="#4ade80"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Main Ergonomic Controller Silhouette */}
          <path
            d="M 182 200
               C 165 210, 160 250, 172 290
               C 180 315, 202 320, 218 296
               L 228 278
               C 236 266, 264 266, 272 278
               L 282 296
               C 298 320, 320 315, 328 290
               C 340 250, 335 210, 318 200
               C 295 188, 205 188, 182 200 Z"
            fill="#021408"
            stroke="#4ade80"
            strokeWidth="3.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Inner Accent Grip Lining */}
          <path
            d="M 186 215
               C 174 235, 175 265, 186 288"
            stroke="#a3e635"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="14 5"
            opacity="0.8"
          />
          <path
            d="M 314 215
               C 326 235, 325 265, 314 288"
            stroke="#a3e635"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="14 5"
            opacity="0.8"
          />

          {/* Sketched Grip Hatch Lines (Left & Right Handles) */}
          <line x1="184" y1="272" x2="198" y2="290" stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="178" y1="282" x2="192" y2="300" stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" />

          <line x1="316" y1="272" x2="302" y2="290" stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="322" y1="282" x2="308" y2="300" stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* ================================================================= */}
        {/* ZONE 4: CONTROLLER INPUTS (D-PAD, BUTTONS, THUMBSTICKS, RETICLE) */}
        {/* ================================================================= */}

        {/* --- D-PAD (LEFT SIDE) --- */}
        <g id="d-pad" filter={`url(#tactical-glow-${id})`}>
          {/* Up Arrow */}
          <polygon points="205,218 211,228 199,228" fill="#a3e635" stroke="#86efac" strokeWidth="1.2" />
          {/* Down Arrow */}
          <polygon points="205,248 211,238 199,238" fill="#a3e635" stroke="#86efac" strokeWidth="1.2" />
          {/* Left Arrow */}
          <polygon points="190,233 200,227 200,239" fill="#a3e635" stroke="#86efac" strokeWidth="1.2" />
          {/* Right Arrow */}
          <polygon points="220,233 210,227 210,239" fill="#a3e635" stroke="#86efac" strokeWidth="1.2" />
          {/* Center Square / Dot */}
          <rect x="202.5" y="230.5" width="5" height="5" fill="#facc15" />
        </g>

        {/* --- 4 COLORED ACTION BUTTONS (RIGHT SIDE DIAMOND ARRAY) --- */}
        <g id="face-buttons">
          {/* Top Button: Sky Blue */}
          <circle
            cx="295"
            cy="224"
            r="5"
            fill="#38bdf8"
            stroke="#e0f2fe"
            strokeWidth="1.2"
            filter={`url(#cyan-glow-${id})`}
          />
          {/* Left Button: Indigo / Soft Blue */}
          <circle
            cx="283"
            cy="236"
            r="5"
            fill="#60a5fa"
            stroke="#dbeafe"
            strokeWidth="1.2"
            filter={`url(#cyan-glow-${id})`}
          />
          {/* Right Button: Vivid Coral Orange */}
          <circle
            cx="307"
            cy="236"
            r="5"
            fill="#fb923c"
            stroke="#ffedd5"
            strokeWidth="1.2"
            className="drop-shadow-[0_0_6px_rgba(251,146,60,0.8)]"
          />
          {/* Bottom Button: Vibrant Emerald */}
          <circle
            cx="295"
            cy="248"
            r="5"
            fill="#4ade80"
            stroke="#f0fdf4"
            strokeWidth="1.2"
            filter={`url(#tactical-glow-${id})`}
          />
        </g>

        {/* --- DUAL THUMBSTICKS WITH RADAR CROSSHAIRS (BOTTOM) --- */}
        {/* Left Thumbstick */}
        <g id="left-stick" filter={`url(#tactical-glow-${id})`}>
          <circle cx="218" cy="270" r="10" fill="#03200d" stroke="#a3e635" strokeWidth="2" />
          <circle cx="218" cy="270" r="6" stroke="#4ade80" strokeWidth="1.2" strokeDasharray="3 2" />
          {/* Precision + Crosshair */}
          <line x1="218" y1="264" x2="218" y2="276" stroke="#fef08a" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="212" y1="270" x2="224" y2="270" stroke="#fef08a" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="218" cy="270" r="1.5" fill="#ffffff" />
        </g>

        {/* Right Thumbstick */}
        <g id="right-stick" filter={`url(#tactical-glow-${id})`}>
          <circle cx="282" cy="270" r="10" fill="#03200d" stroke="#a3e635" strokeWidth="2" />
          <circle cx="282" cy="270" r="6" stroke="#4ade80" strokeWidth="1.2" strokeDasharray="3 2" />
          {/* Precision + Crosshair */}
          <line x1="282" y1="264" x2="282" y2="276" stroke="#fef08a" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="276" y1="270" x2="288" y2="270" stroke="#fef08a" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="282" cy="270" r="1.5" fill="#ffffff" />
        </g>

        {/* ================================================================= */}
        {/* ZONE 5: CENTER TARGET RETICLE & CYAN VECTOR TARGETING LOCK */}
        {/* ================================================================= */}
        <g id="targeting-lock">
          {/* Outer Reticle Circle with 4 Tick Marks */}
          <circle
            cx="250"
            cy="234"
            r="16"
            stroke="#a3e635"
            strokeWidth="2.2"
            fill="none"
            filter={`url(#tactical-glow-${id})`}
          />
          {/* Crosshair 4 Ticks */}
          <line x1="250" y1="214" x2="250" y2="220" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="250" y1="248" x2="250" y2="254" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="230" y1="234" x2="236" y2="234" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="264" y1="234" x2="270" y2="234" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />

          {/* Inner concentric fine reticle */}
          <circle cx="250" cy="234" r="8" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />

          {/* Center Glowing Cyan Diamond/Square Target Core */}
          <rect
            x="246"
            y="230"
            width="8"
            height="8"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="1.2"
            transform="rotate(45 250 234)"
            filter={`url(#cyan-glow-${id})`}
            className={animated ? 'animate-pulse' : ''}
          />
          <circle cx="250" cy="234" r="2" fill="#ffffff" />

          {/* Tactical Vector Line extending to Top-Right Waypoint Node */}
          <line
            x1="255"
            y1="229"
            x2="325"
            y2="175"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            filter={`url(#cyan-glow-${id})`}
          />

          {/* Top-Right Target Node Circle */}
          <circle
            cx="326"
            cy="174"
            r="4.5"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="1.5"
            filter={`url(#cyan-glow-${id})`}
          />
          <circle
            cx="326"
            cy="174"
            r="8"
            stroke="#38bdf8"
            strokeWidth="0.9"
            strokeDasharray="2 3"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
};

export default TacticalLogo;
