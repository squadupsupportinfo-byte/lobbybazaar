import React, { useEffect, useState } from 'react';
import { playSketchClick, playRadarPing } from '../utils/audio';
import { TacticalLogo } from './TacticalLogo';

interface SplashTitleProps {
  onComplete: () => void;
}

export function SplashTitle({ onComplete }: SplashTitleProps) {
  const [timeLeftMs, setTimeLeftMs] = useState(3000);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Play an atmospheric radar ping when splash starts
    playRadarPing();

    const interval = 50; // update timer every 50ms for smooth progress
    const timer = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= interval) {
          clearInterval(timer);
          triggerFade();
          return 0;
        }
        return prev - interval;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const triggerFade = () => {
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 700); // 700ms smooth fade transition
  };

  const handleSkip = () => {
    playSketchClick();
    triggerFade();
  };

  const progressPercent = Math.max(0, Math.min(100, ((3000 - timeLeftMs) / 3000) * 100));

  return (
    <div
      className={`fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#020703] bg-sketch-grid transition-opacity duration-700 select-none overflow-hidden ${
        isFading ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Hand-drawn blueprint background radar circles in glowing green */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <svg
          className="w-[800px] h-[800px] max-w-full max-h-full animate-radar"
          viewBox="0 0 600 600"
          fill="none"
          style={{ filter: 'url(#sketch-glow)' }}
        >
          <circle cx="300" cy="300" r="260" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="16 8 8 8" />
          <circle cx="300" cy="300" r="180" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="12 6" />
          <circle cx="300" cy="300" r="100" stroke="#22c55e" strokeWidth="1" strokeDasharray="8 4" />
          <line x1="300" y1="20" x2="300" y2="580" stroke="#22c55e" strokeWidth="1" strokeDasharray="6 6" />
          <line x1="20" y1="300" x2="580" y2="300" stroke="#22c55e" strokeWidth="1" strokeDasharray="6 6" />
        </svg>
      </div>

      {/* Main Title Badge Area */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        {/* Tactical Logo matching exact user reference emblem */}
        <div className="relative mb-3 group cursor-default">
          <TacticalLogo size="hero" showHUD={true} animated={true} />
        </div>

        {/* Title: LobbyBazaar */}
        <h1
          className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-white select-none"
          style={{
            textShadow:
              '0 0 10px rgba(34, 197, 94, 0.9), 0 0 25px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.3)',
            filter: 'url(#sketch-glow)',
          }}
        >
          <span className="text-green-400">Lobby</span>
          <span className="text-lime-400">Bazaar</span>
        </h1>

        {/* Sketched Underline Accent */}
        <svg
          className="w-60 sm:w-80 md:w-96 max-w-full h-5 sm:h-6 my-2 text-green-400"
          viewBox="0 0 380 24"
          fill="none"
          style={{ filter: 'url(#sketch-glow)' }}
        >
          <path
            d="M8 12 Q 100 4, 190 14 T 372 10"
            stroke="#22c55e"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M12 16 Q 120 8, 210 16 T 366 14"
            stroke="#a3e635"
            strokeWidth="1.8"
            strokeOpacity="0.8"
            strokeLinecap="round"
          />
        </svg>

        {/* Subtitle / Gamer Mission */}
        <p className="mt-2 text-sm sm:text-base font-sketch tracking-wider text-slate-300">
          CONNECT ALL GAMERS <span className="text-green-400">·</span> ASSEMBLE YOUR FIRETEAM
        </p>

        {/* 3-Second Countdown Indicator */}
        <div className="mt-8 flex flex-col items-center gap-2">
          {/* Hand-sketched glowing timer bar */}
          <div
            className="w-64 h-3.5 p-0.5 relative rounded"
            style={{
              backgroundColor: 'rgba(4, 16, 7, 0.85)',
              border: '1.8px solid #22c55e',
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              boxShadow: '0 0 12px rgba(34, 197, 94, 0.45)',
              filter: 'url(#sketch-glow)',
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-green-400 via-lime-400 to-emerald-300 rounded transition-all duration-75"
              style={{
                width: `${progressPercent}%`,
                boxShadow: '0 0 8px #22c55e',
              }}
            />
          </div>

          <div className="flex items-center justify-between w-64 text-xs font-mono-num text-slate-400 px-1">
            <span>STARTING ENGINE</span>
            <span className="text-green-300 font-semibold">{((timeLeftMs / 1000)).toFixed(1)}s</span>
          </div>
        </div>

        {/* Skip button for gamer speed */}
        <button
          onClick={handleSkip}
          className="mt-6 text-xs font-sketch text-slate-400 hover:text-green-300 tracking-wider underline underline-offset-4 cursor-pointer transition-colors"
        >
          Skip Intro (Click to Enter)
        </button>
      </div>

      {/* Sketched corner coordinates */}
      <div className="absolute top-4 left-6 text-xs font-mono-num text-green-400/60 hidden sm:block">
        RADAR_FREQ: 2.4GHz // TACTICAL_GRID
      </div>
      <div className="absolute bottom-4 right-6 text-xs font-mono-num text-slate-500 hidden sm:block">
        BUILD: LOBBYBAZAAR_ALPHA // GLOW_OUTLINE
      </div>
    </div>
  );
}
