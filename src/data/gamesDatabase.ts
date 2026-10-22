export interface GameEntry {
  id: string;
  name: string;
  genre: string;
  category: 'Shooter' | 'Battle Royale' | 'MOBA' | 'RPG' | 'Sports' | 'Fighting' | 'Strategy' | 'Co-op / Survival' | 'Other';
  aliases: string[];
  popular?: boolean;
}

export const GAMES_DATABASE: GameEntry[] = [
  // --- Call of Duty Franchise (Top Request) ---
  {
    id: 'cod-warzone',
    name: 'Call of Duty: Warzone',
    genre: 'Battle Royale',
    category: 'Battle Royale',
    aliases: ['call of duty', 'cod', 'warzone', 'cod warzone', 'wz', 'cal of duty', 'call of duty warzone'],
    popular: true,
  },
  {
    id: 'cod-bo6',
    name: 'Call of Duty: Black Ops 6',
    genre: 'FPS / Shooter',
    category: 'Shooter',
    aliases: ['call of duty', 'cod', 'bo6', 'black ops 6', 'black ops', 'cod bo6', 'zombies', 'cal of duty'],
    popular: true,
  },
  {
    id: 'cod-mw3',
    name: 'Call of Duty: Modern Warfare III',
    genre: 'FPS / Shooter',
    category: 'Shooter',
    aliases: ['call of duty', 'cod', 'mw3', 'modern warfare 3', 'mwiii', 'cal of duty', 'cod mw3'],
    popular: true,
  },
  {
    id: 'cod-mw2',
    name: 'Call of Duty: Modern Warfare II',
    genre: 'FPS / Shooter',
    category: 'Shooter',
    aliases: ['call of duty', 'cod', 'mw2', 'modern warfare 2', 'cal of duty'],
  },
  {
    id: 'cod-general',
    name: 'Call of Duty',
    genre: 'FPS / Shooter',
    category: 'Shooter',
    aliases: ['cod', 'call of duty', 'cal of duty', 'call duty', 'callofduty'],
    popular: true,
  },

  // --- Major Competitive Shooters & Battle Royales ---
  {
    id: 'fortnite',
    name: 'Fortnite',
    genre: 'Battle Royale',
    category: 'Battle Royale',
    aliases: ['fn', 'zero build', 'battle royale', 'fort', 'fortnite zero build'],
    popular: true,
  },
  {
    id: 'apex-legends',
    name: 'Apex Legends',
    genre: 'Battle Royale',
    category: 'Battle Royale',
    aliases: ['apex', 'algs', 'apex legends'],
    popular: true,
  },
  {
    id: 'valorant',
    name: 'Valorant',
    genre: 'Tactical Shooter',
    category: 'Shooter',
    aliases: ['val', 'vct', 'riot valorant'],
    popular: true,
  },
  {
    id: 'counter-strike-2',
    name: 'Counter-Strike 2',
    genre: 'Tactical Shooter',
    category: 'Shooter',
    aliases: ['cs2', 'csgo', 'counter strike', 'cs', 'counter strike 2'],
    popular: true,
  },
  {
    id: 'overwatch-2',
    name: 'Overwatch 2',
    genre: 'Hero Shooter',
    category: 'Shooter',
    aliases: ['ow2', 'ow', 'overwatch'],
    popular: true,
  },
  {
    id: 'rainbow-six-siege',
    name: 'Rainbow Six Siege',
    genre: 'Tactical Shooter',
    category: 'Shooter',
    aliases: ['r6', 'siege', 'rainbow 6', 'rainbow six', 'r6s'],
    popular: true,
  },
  {
    id: 'pubg',
    name: 'PUBG: Battlegrounds',
    genre: 'Battle Royale',
    category: 'Battle Royale',
    aliases: ['pubg', 'battlegrounds', 'playerunknown'],
    popular: true,
  },
  {
    id: 'battlefield-2042',
    name: 'Battlefield 2042',
    genre: 'FPS / Shooter',
    category: 'Shooter',
    aliases: ['bf', 'battlefield', 'bf2042'],
  },
  {
    id: 'the-finals',
    name: 'The Finals',
    genre: 'FPS / Shooter',
    category: 'Shooter',
    aliases: ['finals', 'the finals', 'embark'],
    popular: true,
  },
  {
    id: 'destiny-2',
    name: 'Destiny 2',
    genre: 'Action MMO / Shooter',
    category: 'Shooter',
    aliases: ['d2', 'destiny', 'bungie'],
    popular: true,
  },
  {
    id: 'halo-infinite',
    name: 'Halo Infinite',
    genre: 'FPS / Shooter',
    category: 'Shooter',
    aliases: ['halo', 'halo infinite', 'master chief'],
  },
  {
    id: 'escape-from-tarkov',
    name: 'Escape from Tarkov',
    genre: 'Extraction Shooter',
    category: 'Shooter',
    aliases: ['eft', 'tarkov'],
    popular: true,
  },
  {
    id: 'rust',
    name: 'Rust',
    genre: 'Survival / Shooter',
    category: 'Co-op / Survival',
    aliases: ['facepunch rust'],
    popular: true,
  },
  {
    id: 'marvel-rivals',
    name: 'Marvel Rivals',
    genre: 'Hero Shooter',
    category: 'Shooter',
    aliases: ['marvel', 'rivals', 'marvel rivals'],
    popular: true,
  },
  {
    id: 'deadlock',
    name: 'Deadlock',
    genre: 'Hero Shooter / MOBA',
    category: 'Shooter',
    aliases: ['valve deadlock'],
    popular: true,
  },
  {
    id: 'xdefiant',
    name: 'XDefiant',
    genre: 'FPS / Shooter',
    category: 'Shooter',
    aliases: ['ubisoft xdefiant'],
  },
  {
    id: 'hunt-showdown',
    name: 'Hunt: Showdown 1896',
    genre: 'Extraction Shooter',
    category: 'Shooter',
    aliases: ['hunt', 'showdown', 'hunt showdown'],
  },
  {
    id: 'team-fortress-2',
    name: 'Team Fortress 2',
    genre: 'Hero Shooter',
    category: 'Shooter',
    aliases: ['tf2', 'team fortress'],
  },

  // --- MOBAs & Strategy ---
  {
    id: 'league-of-legends',
    name: 'League of Legends',
    genre: 'MOBA',
    category: 'MOBA',
    aliases: ['lol', 'league', 'riot games', 'summoners rift'],
    popular: true,
  },
  {
    id: 'dota-2',
    name: 'Dota 2',
    genre: 'MOBA',
    category: 'MOBA',
    aliases: ['dota', 'defense of the ancients'],
    popular: true,
  },
  {
    id: 'smite-2',
    name: 'Smite 2',
    genre: 'Third-Person MOBA',
    category: 'MOBA',
    aliases: ['smite', 'hi-rez'],
  },
  {
    id: 'tft',
    name: 'Teamfight Tactics',
    genre: 'Auto Battler / Strategy',
    category: 'Strategy',
    aliases: ['tft', 'team fight tactics'],
  },
  {
    id: 'starcraft-2',
    name: 'StarCraft II',
    genre: 'RTS / Strategy',
    category: 'Strategy',
    aliases: ['sc2', 'starcraft'],
  },

  // --- Co-op, Survival & Open World ---
  {
    id: 'helldivers-2',
    name: 'Helldivers 2',
    genre: 'Co-op PvE Shooter',
    category: 'Co-op / Survival',
    aliases: ['hd2', 'helldivers', 'super earth'],
    popular: true,
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    genre: 'Sandbox / Survival',
    category: 'Co-op / Survival',
    aliases: ['mc', 'bedrock', 'java', 'minecraft java'],
    popular: true,
  },
  {
    id: 'gta-online',
    name: 'Grand Theft Auto V / GTA Online',
    genre: 'Open World / Action',
    category: 'Other',
    aliases: ['gta', 'gta 5', 'gta v', 'gta online', 'fivem', 'rockstar'],
    popular: true,
  },
  {
    id: 'roblox',
    name: 'Roblox',
    genre: 'Sandbox / Social',
    category: 'Other',
    aliases: ['blox', 'bloxfruits'],
    popular: true,
  },
  {
    id: 'dead-by-daylight',
    name: 'Dead by Daylight',
    genre: 'Asymmetrical Horror',
    category: 'Co-op / Survival',
    aliases: ['dbd', 'dead by daylight'],
    popular: true,
  },
  {
    id: 'palworld',
    name: 'Palworld',
    genre: 'Open World / Survival',
    category: 'Co-op / Survival',
    aliases: ['pals', 'palworld'],
    popular: true,
  },
  {
    id: 'lethal-company',
    name: 'Lethal Company',
    genre: 'Co-op Horror',
    category: 'Co-op / Survival',
    aliases: ['lethal', 'scrap'],
    popular: true,
  },
  {
    id: 'phasmophobia',
    name: 'Phasmophobia',
    genre: 'Co-op Ghost Hunting',
    category: 'Co-op / Survival',
    aliases: ['phasmo', 'phasmophobia'],
  },
  {
    id: 'deep-rock-galactic',
    name: 'Deep Rock Galactic',
    genre: 'Co-op Mining Shooter',
    category: 'Co-op / Survival',
    aliases: ['drg', 'rock and stone'],
  },
  {
    id: 'sea-of-thieves',
    name: 'Sea of Thieves',
    genre: 'Pirate Adventure / Co-op',
    category: 'Co-op / Survival',
    aliases: ['sot', 'sea of thieves'],
  },
  {
    id: 'valheim',
    name: 'Valheim',
    genre: 'Viking Survival',
    category: 'Co-op / Survival',
    aliases: ['valheim vikings'],
  },
  {
    id: 'left-4-dead-2',
    name: 'Left 4 Dead 2',
    genre: 'Zombie Co-op Shooter',
    category: 'Co-op / Survival',
    aliases: ['l4d2', 'left 4 dead'],
  },
  {
    id: 'space-marine-2',
    name: 'Warhammer 40,000: Space Marine 2',
    genre: 'Action / Co-op',
    category: 'Shooter',
    aliases: ['space marine 2', 'warhammer', '40k', 'space marine'],
    popular: true,
  },

  // --- Resident Evil Franchise ---
  {
    id: 'resident-evil-6',
    name: 'Resident Evil 6',
    genre: 'Co-op Action Horror',
    category: 'Co-op / Survival',
    aliases: ['re6', 're 6', 'resident evil vi', 'resident evil 6', 'biohazard 6', 're-6'],
    popular: true,
  },
  {
    id: 'resident-evil-5',
    name: 'Resident Evil 5',
    genre: 'Co-op Action Horror',
    category: 'Co-op / Survival',
    aliases: ['re5', 're 5', 'resident evil v', 'resident evil 5', 'biohazard 5'],
    popular: true,
  },
  {
    id: 'resident-evil-4',
    name: 'Resident Evil 4 (Remake)',
    genre: 'Survival Horror',
    category: 'Other',
    aliases: ['re4', 're 4', 'resident evil iv', 'resident evil 4', 're4 remake', 'biohazard 4'],
    popular: true,
  },
  {
    id: 'resident-evil-2',
    name: 'Resident Evil 2 (Remake)',
    genre: 'Survival Horror',
    category: 'Other',
    aliases: ['re2', 're 2', 'resident evil ii', 'resident evil 2', 're2 remake', 'biohazard 2'],
  },
  {
    id: 'resident-evil-3',
    name: 'Resident Evil 3 (Remake)',
    genre: 'Survival Horror',
    category: 'Other',
    aliases: ['re3', 're 3', 'resident evil iii', 'resident evil 3', 're3 remake', 'biohazard 3'],
  },
  {
    id: 'resident-evil-7',
    name: 'Resident Evil 7: Biohazard',
    genre: 'Survival Horror',
    category: 'Co-op / Survival',
    aliases: ['re7', 're 7', 'resident evil 7', 'biohazard 7', 'resident evil vii'],
    popular: true,
  },
  {
    id: 'resident-evil-village',
    name: 'Resident Evil Village',
    genre: 'Survival Horror',
    category: 'Other',
    aliases: ['re8', 're 8', 'resident evil 8', 'village', 'resident evil viii', 'resident evil village'],
    popular: true,
  },
  {
    id: 'resident-evil-general',
    name: 'Resident Evil',
    genre: 'Survival Horror / Co-op',
    category: 'Co-op / Survival',
    aliases: ['resident evil', 're', 'biohazard', 'resident evil franchise'],
    popular: true,
  },

  // --- RPGs & MMORPGs ---
  {
    id: 'elden-ring',
    name: 'Elden Ring',
    genre: 'Action RPG / Souls',
    category: 'RPG',
    aliases: ['er', 'shadow of the erdtree', 'fromsoftware', 'souls'],
    popular: true,
  },
  {
    id: 'world-of-warcraft',
    name: 'World of Warcraft',
    genre: 'MMORPG',
    category: 'RPG',
    aliases: ['wow', 'warcraft', 'the war within', 'blizzard'],
    popular: true,
  },
  {
    id: 'final-fantasy-14',
    name: 'Final Fantasy XIV',
    genre: 'MMORPG',
    category: 'RPG',
    aliases: ['ffxiv', 'ff14', 'dawntrail', 'square enix'],
    popular: true,
  },
  {
    id: 'diablo-4',
    name: 'Diablo IV',
    genre: 'Action RPG',
    category: 'RPG',
    aliases: ['d4', 'diablo 4', 'diablo', 'vessel of hatred'],
    popular: true,
  },
  {
    id: 'path-of-exile',
    name: 'Path of Exile / PoE 2',
    genre: 'Action RPG',
    category: 'RPG',
    aliases: ['poe', 'poe 2', 'path of exile 2'],
    popular: true,
  },
  {
    id: 'genshin-impact',
    name: 'Genshin Impact',
    genre: 'Action RPG',
    category: 'RPG',
    aliases: ['genshin', 'hoyoverse'],
    popular: true,
  },
  {
    id: 'honkai-star-rail',
    name: 'Honkai: Star Rail',
    genre: 'Turn-Based RPG',
    category: 'RPG',
    aliases: ['hsr', 'star rail', 'honkai'],
  },
  {
    id: 'monster-hunter-wilds',
    name: 'Monster Hunter Wilds',
    genre: 'Action Hunting RPG',
    category: 'RPG',
    aliases: ['mh', 'monster hunter', 'mhw', 'mh wilds'],
    popular: true,
  },
  {
    id: 'monster-hunter-world',
    name: 'Monster Hunter: World',
    genre: 'Action Hunting RPG',
    category: 'RPG',
    aliases: ['mhw', 'iceborne', 'monster hunter'],
  },
  {
    id: 'baldurs-gate-3',
    name: 'Baldur’s Gate 3',
    genre: 'CRPG',
    category: 'RPG',
    aliases: ['bg3', 'baldurs gate', 'dnd'],
    popular: true,
  },
  {
    id: 'black-myth-wukong',
    name: 'Black Myth: Wukong',
    genre: 'Action RPG',
    category: 'RPG',
    aliases: ['wukong', 'black myth'],
    popular: true,
  },
  {
    id: 'cyberpunk-2077',
    name: 'Cyberpunk 2077',
    genre: 'Action RPG',
    category: 'RPG',
    aliases: ['cyberpunk', 'cp2077', 'phantom liberty'],
  },

  // --- Sports & Racing ---
  {
    id: 'rocket-league',
    name: 'Rocket League',
    genre: 'Vehicular Soccer',
    category: 'Sports',
    aliases: ['rl', 'rocket league', 'soccar'],
    popular: true,
  },
  {
    id: 'ea-fc-25',
    name: 'EA Sports FC 25 (FIFA)',
    genre: 'Sports / Soccer',
    category: 'Sports',
    aliases: ['fifa', 'fc 25', 'ea fc', 'fifa 25', 'fut', 'soccer', 'football'],
    popular: true,
  },
  {
    id: 'nba-2k25',
    name: 'NBA 2K25',
    genre: 'Sports / Basketball',
    category: 'Sports',
    aliases: ['2k', '2k25', 'nba', 'nba 2k', 'basketball', 'park', 'rec'],
    popular: true,
  },
  {
    id: 'madden-25',
    name: 'Madden NFL 25',
    genre: 'Sports / Football',
    category: 'Sports',
    aliases: ['madden', 'nfl', 'football'],
    popular: true,
  },
  {
    id: 'mlb-the-show-24',
    name: 'MLB The Show 24',
    genre: 'Sports / Baseball',
    category: 'Sports',
    aliases: ['mlb', 'the show', 'baseball'],
  },
  {
    id: 'forza-horizon-5',
    name: 'Forza Horizon 5',
    genre: 'Racing',
    category: 'Sports',
    aliases: ['forza', 'horizon 5'],
  },
  {
    id: 'gran-turismo-7',
    name: 'Gran Turismo 7',
    genre: 'Racing Sim',
    category: 'Sports',
    aliases: ['gt7', 'gran turismo'],
  },
  {
    id: 'f1-24',
    name: 'EA Sports F1 24',
    genre: 'Racing Sim',
    category: 'Sports',
    aliases: ['f1', 'formula 1'],
  },

  // --- Fighting Games ---
  {
    id: 'smash-ultimate',
    name: 'Super Smash Bros. Ultimate',
    genre: 'Platform Fighter',
    category: 'Fighting',
    aliases: ['smash', 'ssbu', 'smash ultimate', 'smash bros'],
    popular: true,
  },
  {
    id: 'street-fighter-6',
    name: 'Street Fighter 6',
    genre: 'Fighting',
    category: 'Fighting',
    aliases: ['sf6', 'street fighter', 'capcom'],
    popular: true,
  },
  {
    id: 'tekken-8',
    name: 'Tekken 8',
    genre: '3D Fighter',
    category: 'Fighting',
    aliases: ['t8', 'tekken', 'bandai'],
    popular: true,
  },
  {
    id: 'mortal-kombat-1',
    name: 'Mortal Kombat 1',
    genre: 'Fighting',
    category: 'Fighting',
    aliases: ['mk1', 'mortal kombat'],
    popular: true,
  },
  {
    id: 'sparking-zero',
    name: 'Dragon Ball: Sparking! ZERO',
    genre: 'Arena Fighter',
    category: 'Fighting',
    aliases: ['sparking zero', 'dragon ball', 'budokai tenkaichi', 'dbz'],
    popular: true,
  },
  {
    id: 'brawlhalla',
    name: 'Brawlhalla',
    genre: 'Platform Fighter',
    category: 'Fighting',
    aliases: ['brawl'],
  },

  // --- Casual & Social ---
  {
    id: 'among-us',
    name: 'Among Us',
    genre: 'Social Deduction',
    category: 'Other',
    aliases: ['sus', 'amongus', 'impostor'],
  },
  {
    id: 'fall-guys',
    name: 'Fall Guys',
    genre: 'Party / Platformer',
    category: 'Other',
    aliases: ['fall guys'],
  },
  {
    id: 'mario-kart-8',
    name: 'Mario Kart 8 Deluxe',
    genre: 'Kart Racing',
    category: 'Sports',
    aliases: ['mario kart', 'mk8', 'nintendo'],
    popular: true,
  },
];

/**
 * Searches the games database using fuzzy matching against title and aliases.
 */
export function searchGames(query: string, maxResults: number = 8): GameEntry[] {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return GAMES_DATABASE.filter((g) => g.popular).slice(0, maxResults);
  }

  // Exact starts-with or alias matches first
  const exactMatches: GameEntry[] = [];
  const partialMatches: GameEntry[] = [];

  for (const game of GAMES_DATABASE) {
    const nameLower = game.name.toLowerCase();
    if (nameLower.startsWith(clean)) {
      exactMatches.push(game);
      continue;
    }

    const matchesAlias = game.aliases.some((a) => a.toLowerCase().startsWith(clean));
    if (matchesAlias) {
      exactMatches.push(game);
      continue;
    }

    if (nameLower.includes(clean) || game.aliases.some((a) => a.toLowerCase().includes(clean))) {
      partialMatches.push(game);
    }
  }

  return [...exactMatches, ...partialMatches].slice(0, maxResults);
}

/**
 * Normalizes a game string for comparison:
 * - lowercase
 * - replaces common roman numerals with digits (vi -> 6, iv -> 4, etc.)
 * - removes punctuation
 * - collapses spaces
 */
export function normalizeGameTitle(str: string): string {
  return str
    .toLowerCase()
    .replace(/\bviii\b/g, '8')
    .replace(/\bvii\b/g, '7')
    .replace(/\bvi\b/g, '6')
    .replace(/\biv\b/g, '4')
    .replace(/\bv\b/g, '5')
    .replace(/\biii\b/g, '3')
    .replace(/\bii\b/g, '2')
    .replace(/\bi\b/g, '1')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a game/squad/player matches a searched game string.
 * Strictly verifies sequel numbers and editions:
 * e.g., searching "resident evil 6" will ONLY match profiles playing "Resident Evil 6",
 * and will NOT match generic "Resident Evil" or "Resident Evil 4".
 */
export function matchesGameSearch(targetGame: string | undefined, searchQuery: string): boolean {
  if (!targetGame) return false;
  const rawTarget = targetGame.trim();
  const rawQuery = searchQuery.trim();
  if (!rawQuery) return true;

  const targetNorm = normalizeGameTitle(rawTarget);
  const queryNorm = normalizeGameTitle(rawQuery);

  // Exact normalized match
  if (targetNorm === queryNorm) return true;

  // Extract numeric tokens (sequel/version numbers like '6', '4', '2', etc.)
  const queryNumbers: string[] = (queryNorm.match(/\b\d+\b/g) as string[]) || [];
  const targetNumbers: string[] = (targetNorm.match(/\b\d+\b/g) as string[]) || [];

  // If query specifies edition number(s) (e.g. "6" in "resident evil 6"):
  if (queryNumbers.length > 0) {
    // Target MUST contain all specified numbers
    const hasAllNumbers = queryNumbers.every((num) => targetNumbers.includes(num));
    if (!hasAllNumbers) {
      // Check if an alias explicitly bridges them
      const queryMatchingEntries = GAMES_DATABASE.filter((g) => {
        const gNorm = normalizeGameTitle(g.name);
        return (
          gNorm === queryNorm ||
          g.aliases.some((a) => normalizeGameTitle(a) === queryNorm)
        );
      });

      const bridgesViaAlias = queryMatchingEntries.some((g) => {
        const gNorm = normalizeGameTitle(g.name);
        return (
          targetNorm === gNorm ||
          g.aliases.some((a) => normalizeGameTitle(a) === targetNorm)
        );
      });

      if (!bridgesViaAlias) {
        return false;
      }
    }
  }

  // If target contains the full query string (e.g. target is "Resident Evil 6 (Steam)", query is "Resident Evil 6")
  if (targetNorm.includes(queryNorm)) {
    // If target has extra numbers not in query, check if query was a generic parent search
    // If query has numbers, we already verified hasAllNumbers above
    return true;
  }

  // Check alias matching in database
  const matchingGames = GAMES_DATABASE.filter((g) => {
    const gNorm = normalizeGameTitle(g.name);
    return (
      gNorm.includes(queryNorm) ||
      g.aliases.some((a) => {
        const aNorm = normalizeGameTitle(a);
        return aNorm === queryNorm || aNorm.includes(queryNorm);
      })
    );
  });

  for (const g of matchingGames) {
    const gNorm = normalizeGameTitle(g.name);
    // If query specified a number, make sure this game entry matches that number
    if (queryNumbers.length > 0) {
      const gNumbers: string[] = (gNorm.match(/\b\d+\b/g) as string[]) || [];
      if (!queryNumbers.every((n) => gNumbers.includes(n))) {
        continue;
      }
    }

    if (targetNorm === gNorm || targetNorm.includes(gNorm)) {
      if (queryNumbers.length > 0) {
        if (queryNumbers.every((num) => targetNumbers.includes(num))) {
          return true;
        }
      } else {
        return true;
      }
    }

    if (
      g.aliases.some((a) => {
        const aNorm = normalizeGameTitle(a);
        return targetNorm === aNorm || targetNorm.includes(aNorm);
      })
    ) {
      if (queryNumbers.length > 0) {
        if (queryNumbers.every((num) => targetNumbers.includes(num))) {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  return false;
}
