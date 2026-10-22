import React, { useState, useEffect } from 'react';
import { X, Mic, Radio } from 'lucide-react';
import { SquadBeacon } from '../types';
import { playSketchClick, playSquadJoinSound } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { GAMES_DATABASE } from '../data/gamesDatabase';

interface CreateSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (squad: SquadBeacon) => void;
}

export function CreateSquadModal({ isOpen, onClose, onCreate }: CreateSquadModalProps) {
  const { user, gamerProfile } = useAuth();
  const [squadName, setSquadName] = useState('');
  const [game, setGame] = useState(gamerProfile?.favoriteGame || 'Call of Duty: Warzone');
  const [rank, setRank] = useState('Platinum / Diamond');
  const [maxMembers, setMaxMembers] = useState(5);
  const [currentMembers, setCurrentMembers] = useState(1);
  const [sector, setSector] = useState('Sector 04 - Metro Core');
  const [playstyle, setPlaystyle] = useState<'Competitive' | 'Casual' | 'Tournament' | 'LAN Hub'>('Competitive');
  const [micRequired, setMicRequired] = useState(true);
  const [description, setDescription] = useState('');
  const [leaderTag, setLeaderTag] = useState('');

  useEffect(() => {
    if (gamerProfile?.gamerTag) {
      setLeaderTag(gamerProfile.gamerTag);
      if (gamerProfile.favoriteGame) {
        setGame(gamerProfile.favoriteGame);
      }
    }
  }, [gamerProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadName.trim()) return;

    playSquadJoinSound();

    const newSquad: SquadBeacon = {
      id: `squad-${Date.now()}`,
      ownerId: user?.uid,
      name: squadName.trim(),
      game,
      genre:
        game === 'Valorant' || game === 'Counter-Strike 2' ? 'FPS' :
        game === 'Apex Legends' || game === 'Fortnite' ? 'Battle Royale' :
        game === 'League of Legends' ? 'MOBA' : 'Co-op',
      rank: rank || gamerProfile?.rank || 'Any Rank',
      currentMembers: Math.min(Number(currentMembers) || 1, Number(maxMembers) || 5),
      maxMembers: Number(maxMembers) || 5,
      sector: sector || gamerProfile?.locationName || 'Sector Alpha - Metro Core',
      locationName: gamerProfile?.locationName || 'Local Sector',
      lat: gamerProfile?.coords?.lat,
      lng: gamerProfile?.coords?.lng,
      x: 35 + Math.floor(Math.random() * 30),
      y: 30 + Math.floor(Math.random() * 40),
      micRequired,
      playstyle,
      description: description.trim() || gamerProfile?.bio || 'Looking for active teammates to squad up now.',
      bio: description.trim() || gamerProfile?.bio || 'Looking for active teammates to squad up now.',
      lookingFor: ['Any Skilled Player', 'Good Comms'],
      pingMs: Math.floor(Math.random() * 20) + 10,
      accentColor: 'lime',
      photoUrl: gamerProfile?.photoUrl,
      likedGenres: gamerProfile?.likedGenres || [game],
      likedGames: gamerProfile?.likedGames || [game],
      playSchedule: gamerProfile?.playSchedule,
      socialLinks: gamerProfile?.socialLinks,
      photos: gamerProfile?.photos || [],
      members: [
        {
          id: `m-${Date.now()}`,
          name: leaderTag.trim() || gamerProfile?.gamerTag || 'SquadLeader',
          avatarSeed: leaderTag || 'Leader',
          role: gamerProfile?.role || 'Team Captain / IGL',
          rank: rank || gamerProfile?.rank || 'Unranked',
          photoUrl: gamerProfile?.photoUrl,
          isLeader: true,
        },
      ],
    };

    onCreate(newSquad);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSketchClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#030a05] text-slate-100 p-6 relative border cursor-default"
        style={{
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          borderColor: '#22c55e',
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.5), inset 0 0 15px rgba(34, 197, 94, 0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-green-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold font-display text-white tracking-wide">
              Deploy Squad Beacon
            </h2>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playSketchClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
            title="Close [Esc]"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-sketch text-slate-300 mb-1">
              Squad / Clan Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nightfall Vanguard"
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none focus:border-green-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sketch text-slate-300 mb-1">Game</label>
              <input
                type="text"
                list="modal-games-list"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                placeholder="e.g. Call of Duty: Warzone"
                className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none focus:border-green-400 font-sketch"
              />
              <datalist id="modal-games-list">
                {GAMES_DATABASE.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name} ({g.genre})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-sketch text-slate-300 mb-1">Target Rank / Tier</label>
              <input
                type="text"
                placeholder="e.g. Diamond / Ascendant"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sketch text-slate-300 mb-1">Your Gamer Tag</label>
              <input
                type="text"
                placeholder="e.g. GhostRider#NA1"
                value={leaderTag}
                onChange={(e) => setLeaderTag(e.target.value)}
                className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-sketch text-slate-300 mb-1">Playstyle</label>
              <select
                value={playstyle}
                onChange={(e) => setPlaystyle(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none"
              >
                <option value="Competitive">Competitive / Ranked</option>
                <option value="Casual">Casual / Chill</option>
                <option value="Tournament">Tournament Team</option>
                <option value="LAN Hub">LAN / In-Person</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sketch text-slate-300 mb-1">Squad Capacity</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100"
                />
                <span className="text-xs text-slate-400 font-sketch whitespace-nowrap">Max Players</span>
              </div>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-sketch text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={micRequired}
                  onChange={(e) => setMicRequired(e.target.checked)}
                  className="rounded border-green-500 text-green-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-green-400" />
                  <span>Mic Required</span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-sketch text-slate-300 mb-1">
              Description / Roles Needed
            </label>
            <textarea
              rows={2}
              placeholder="What are you aiming for? What roles or heroes are you looking for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#020603] border border-green-500/40 rounded text-sm text-green-100 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-green-500/20 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onClose();
              }}
              className="px-4 py-2 text-xs font-sketch text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="max-w-full px-5 py-2 text-xs font-bold font-display tracking-wider text-green-100 bg-green-900/60 hover:bg-green-800/80 border border-green-400 rounded cursor-pointer transition-colors shadow-[0_0_12px_rgba(34,197,94,0.5)] shrink-0"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              Deploy Beacon to Radar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
