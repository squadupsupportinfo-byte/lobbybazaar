import React from 'react';
import { Instagram, Youtube, Facebook } from 'lucide-react';

export function TikTokIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
    </svg>
  );
}

export function formatSocialUrl(platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'twitch' | 'steam' | 'twitter', handle: string): string {
  const clean = handle.trim();
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  switch (platform) {
    case 'tiktok':
      return `https://www.tiktok.com/@${clean.replace(/^@/, '')}`;
    case 'instagram':
      return `https://www.instagram.com/${clean.replace(/^@/, '')}`;
    case 'youtube':
      return clean.startsWith('@') ? `https://www.youtube.com/${clean}` : `https://www.youtube.com/@${clean}`;
    case 'facebook':
      return `https://www.facebook.com/${clean.replace(/^@/, '')}`;
    case 'twitch':
      return `https://www.twitch.tv/${clean.replace(/^@/, '')}`;
    case 'steam':
      return `https://steamcommunity.com/id/${clean}`;
    case 'twitter':
      return `https://x.com/${clean.replace(/^@/, '')}`;
    default:
      return clean;
  }
}
