import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Trash2,
  MapPin,
  Tag,
  RefreshCw,
  DollarSign,
  Image as ImageIcon,
  Sparkles,
  Check,
  AlertCircle,
  Store,
  ChevronRight,
  Lock,
  ExternalLink,
  Mail,
  Phone,
  UserPlus,
  ShieldAlert,
  Navigation,
  Search,
} from 'lucide-react';
import { BuildingType, StoreActionType, StoreData, SquadBeacon, StorePhotoItem } from '../types';
import { StoreBuilding3D } from './StoreBuilding3D';
import { searchGlobalLocation, POPULAR_WORLD_CITIES } from '../utils/locationService';
import { compressImage } from '../utils/imageCompressor';
import { playSketchClick, playSquadJoinSound, playRadarPing } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

interface SellTradeBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployStore: (storeBeacon: SquadBeacon) => void;
  onDeleteStore?: (storeId: string) => void;
  onOpenAuthModal?: (mode: 'signup' | 'signin') => void;
  initialStore?: SquadBeacon | null;
  existingUserStore?: SquadBeacon | null;
}

export const getMaxItemsForBuilding = (building: BuildingType): number => {
  if (building === 'medium_store' || building === 'sketch_store' || building === 'cyber_tower') {
    return 15;
  }
  if (building === 'girly_kiosk' || building === 'boy_kiosk') {
    return 5;
  }
  // Store buildings (boutique, arcade) and Halloween buildings (girly_spooky, spooky_shop) = 10 items
  return 10;
};

export function SellTradeBuyModal({
  isOpen,
  onClose,
  onDeployStore,
  onDeleteStore,
  onOpenAuthModal,
  initialStore,
  existingUserStore,
}: SellTradeBuyModalProps) {
  const { user, gamerProfile } = useAuth();
  const { coords } = useLocation();

  // Active store resolution (Enforce 1 store per user)
  const activeStore = initialStore || (user && existingUserStore?.ownerId === user.uid ? existingUserStore : null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Step 1: Building Choice
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType>('boutique');

  // Step 2: Item & Store Info
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('Video Games (Physical)');
  const [condition, setCondition] = useState('Like New / Mint');
  const [description, setDescription] = useState('');

  // Step 3: Photos & Item Details (Kiosk: 5, Store & Halloween: 10, Upgraded Buildings: 15)
  const [photoItems, setPhotoItems] = useState<StorePhotoItem[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const maxItems = getMaxItemsForBuilding(selectedBuilding);

  const [isMediumStoreUnlocked, setIsMediumStoreUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('squadup_unlocked_medium_store') === 'true' ||
      (gamerProfile?.unlockedBuildings?.includes('medium_store') ?? false)
    );
  });

  const [isSketchStoreUnlocked, setIsSketchStoreUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('squadup_unlocked_sketch_store') === 'true' ||
      (gamerProfile?.unlockedBuildings?.includes('sketch_store') ?? false)
    );
  });

  const [isCyberTowerUnlocked, setIsCyberTowerUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('squadup_unlocked_cyber_tower') === 'true' ||
      (gamerProfile?.unlockedBuildings?.includes('cyber_tower') ?? false)
    );
  });

  const [isUnlockingBuilding, setIsUnlockingBuilding] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const profileUnlocked = gamerProfile?.unlockedBuildings || [];
    if (
      localStorage.getItem('squadup_unlocked_medium_store') === 'true' ||
      profileUnlocked.includes('medium_store')
    ) {
      setIsMediumStoreUnlocked(true);
    }
    if (
      localStorage.getItem('squadup_unlocked_sketch_store') === 'true' ||
      profileUnlocked.includes('sketch_store')
    ) {
      setIsSketchStoreUnlocked(true);
    }
    if (
      localStorage.getItem('squadup_unlocked_cyber_tower') === 'true' ||
      profileUnlocked.includes('cyber_tower')
    ) {
      setIsCyberTowerUnlocked(true);
    }
  }, [isOpen, gamerProfile]);

  const isBuildingUnlocked = (b: BuildingType) => {
    if (b === 'medium_store') return isMediumStoreUnlocked;
    if (b === 'sketch_store') return isSketchStoreUnlocked;
    if (b === 'cyber_tower') return isCyberTowerUnlocked;
    return true;
  };

  const handleBuyBuilding = async (bType: 'medium_store' | 'sketch_store' | 'cyber_tower', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsUnlockingBuilding(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseType: 'store_building',
          buildingType: bType,
          userId: user?.uid || '',
          gamerTag: sellerGamerTag || user?.displayName || 'Gamer Seller',
          origin: window.location.origin,
        }),
      });
      if (!res.ok) throw new Error('Could not initialize checkout');
      const data = await res.json();
      if (data.url) {
        // Send users directly to Stripe hosted checkout (bypass iframe restrictions)
        let redirected = false;
        try {
          if (window.top && window.top !== window) {
            window.top.location.href = data.url;
            redirected = true;
          }
        } catch (_) {}

        if (!redirected) {
          const win = window.open(data.url, '_blank', 'noopener,noreferrer');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = data.url;
          }
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not initiate Stripe checkout for this store building. Please try again.');
    } finally {
      setIsUnlockingBuilding(false);
    }
  };

  const handleSelectBuilding = (b: BuildingType) => {
    playSketchClick();
    setSelectedBuilding(b);
    const newMax = getMaxItemsForBuilding(b);
    if (photoItems.length > newMax) {
      setPhotoItems((prev) => prev.slice(0, newMax));
      setErrorMessage(`Switched to ${b.includes('kiosk') ? 'Kiosk (5 items limit)' : 'Building (10 items limit)'}. Item list adjusted to ${newMax} items.`);
    }
  };

  // Step 5: Location / Global City / GPS
  const [cityInput, setCityInput] = useState('');
  const [resolvedLocation, setResolvedLocation] = useState<{
    cityName: string;
    lat: number;
    lng: number;
    country?: string;
  } | null>(null);
  const [isLookingUpLocation, setIsLookingUpLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Step 6: Seller Contact (Email, Phone/Text, Discord are all optional)
  const [sellerGamerTag, setSellerGamerTag] = useState('');
  const [contactDiscord, setContactDiscord] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Form error & loading
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lookup Global Location
  const handleLookupLocation = async (queryToLookup?: string) => {
    const target = (queryToLookup || cityInput).trim();
    if (!target) return;
    setIsLookingUpLocation(true);
    setLocationError(null);
    try {
      const res = await searchGlobalLocation(target);
      if (res) {
        setResolvedLocation({
          cityName: res.cityName,
          lat: res.lat,
          lng: res.lng,
          country: res.country,
        });
        setCityInput(res.cityName);
        playRadarPing();
      } else {
        setLocationError(`Could not pinpoint city "${target}". Please check spelling.`);
      }
    } catch {
      setLocationError('Error locating city.');
    } finally {
      setIsLookingUpLocation(false);
    }
  };

  const handleUseGPS = () => {
    playSketchClick();
    if (coords) {
      setCityInput(coords.cityName || 'Current GPS Sector');
      setResolvedLocation({
        cityName: coords.cityName || 'Current GPS Sector',
        lat: coords.lat,
        lng: coords.lng,
        country: coords.country,
      });
      playRadarPing();
    }
  };

  // Multi-photo upload (Kiosk: 5, Store & Halloween: 10)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxItems - photoItems.length;
    if (remainingSlots <= 0) {
      setErrorMessage(`Maximum of ${maxItems} items reached for this ${selectedBuilding.includes('kiosk') ? 'kiosk' : 'building'}.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsCompressing(true);
    setErrorMessage(null);

    try {
      const newItems: StorePhotoItem[] = [];
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const compressed = await compressImage(file, 480, 0.65);
        newItems.push({
          id: `p-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          url: compressed,
          price: '',
          priceType: 'negotiable',
          intent: 'sell',
          condition: 'Very Good (Tested)',
          description: '',
        });
      }
      playSketchClick();
      setPhotoItems((prev) => [...prev, ...newItems].slice(0, maxItems));
    } catch (err) {
      console.error('Error processing photos:', err);
      setErrorMessage('Could not process some photos. Please try again.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleUpdatePhotoItem = (index: number, field: keyof StorePhotoItem, value: any) => {
    setPhotoItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemovePhoto = (index: number) => {
    playSketchClick();
    setPhotoItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Finish and Deploy Store
  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('You must have an account to open a store for selling or trading.');
      return;
    }

    if (!storeName.trim()) {
      setErrorMessage('Please give your store or listing a title.');
      return;
    }

    if (!isBuildingUnlocked(selectedBuilding)) {
      setErrorMessage('The selected store building requires unlocking for $5.00 (+5 extra item spaces, 15 items total). Please click "Buy Building for $5.00" on the building card to unlock with Stripe.');
      return;
    }

    if (!resolvedLocation) {
      setErrorMessage('Please verify your store location before deploying.');
      return;
    }

    // Derive action types directly from uploaded photo items
    const hasSelling = photoItems.some((p) => p.intent === 'sell' || p.intent === 'both');
    const hasTrading = photoItems.some((p) => p.intent === 'trade' || p.intent === 'both');
    const actionTypes: StoreActionType[] = [];
    if (hasSelling) actionTypes.push('selling');
    if (hasTrading) actionTypes.push('trading');
    if (actionTypes.length === 0) actionTypes.push('selling', 'trading');

    const firstPriceItem = photoItems.find((p) => p.price && p.price.trim().length > 0);
    const firstTradeItem = photoItems.find((p) => p.description && (p.intent === 'trade' || p.intent === 'both'));
    const finalPrice = firstPriceItem?.price || '';
    const finalTrade = firstTradeItem?.description || '';

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1 Store Per User Rule:
      // If user already owns a store, retain that store's ID, or create a deterministic ID for user
      const storeId = activeStore?.id || (user ? `store-${user.uid}` : `store-${Date.now()}`);
      const storeData: StoreData = {
        buildingType: selectedBuilding,
        actionTypes,
        storeName: storeName.trim(),
        category,
        condition,
        price: finalPrice,
        tradeLookingFor: finalTrade,
        description: description.trim() || `${actionTypes.join(' & ')} items in ${resolvedLocation.cityName}`,
        photos: photoItems.map((p) => p.url),
        photoItems,
        cityName: resolvedLocation.cityName,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
        contactDiscord: contactDiscord.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        sellerGamerTag: sellerGamerTag.trim() || user.displayName || 'Gamer Seller',
        createdAt: new Date().toISOString(),
      };

      const storeBeacon: SquadBeacon = {
        id: storeId,
        ownerId: user.uid,
        name: storeName.trim(),
        game: `${actionTypes.map((a) => a.toUpperCase()).join(' & ')}: ${category}`,
        genre: 'Other',
        rank: condition,
        currentMembers: 1,
        maxMembers: 1,
        sector: resolvedLocation.cityName,
        locationName: resolvedLocation.cityName,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
        x: 50 + (((resolvedLocation.lng * 100) % 50) - 25),
        y: 50 + (((resolvedLocation.lat * 100) % 50) - 25),
        micRequired: false,
        playstyle: 'LAN Hub',
        description: description.trim() || `Sell & Trade Store: ${actionTypes.join(' & ')} in ${resolvedLocation.cityName}`,
        lookingFor: actionTypes.includes('trading') && finalTrade ? [finalTrade] : ['Traders', 'Buyers'],
        pingMs: 12,
        accentColor: selectedBuilding === 'boutique' ? 'amber' : 'lime',
        beaconType: 'store',
        buildingType: selectedBuilding,
        storeData,
        photoUrl: photoItems[0]?.url || (selectedBuilding === 'boutique' ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&fit=crop' : 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&fit=crop'),
        photos: photoItems.map((p, idx) => ({
          id: p.id || `p-${idx}`,
          url: p.url,
          uploadedAt: new Date().toISOString(),
          price: p.price || '',
          priceType: p.priceType || 'negotiable',
          intent: p.intent || 'sell',
          condition: p.condition || 'Very Good (Tested)',
          description: p.description || '',
          caption: p.description || p.price ? `${p.price ? `${p.price} (${p.priceType === 'firm' ? 'Firm' : 'Negotiable'})` : ''} ${p.condition ? `[${p.condition}]` : ''} ${p.intent ? `• ${p.intent.toUpperCase()}` : ''}`.trim() : '',
        })),
        socialLinks: {
          discord: contactDiscord.trim() || '',
        },
        members: [
          {
            id: user.uid,
            name: sellerGamerTag.trim() || user.displayName || 'Store Operator',
            avatarSeed: sellerGamerTag.trim() || 'Store',
            role: 'Shop Owner / Trader',
            isLeader: true,
          },
        ],
      };

      playSquadJoinSound();
      onDeployStore(storeBeacon);
      onClose();
    } catch (err: any) {
      console.error('Error deploying store:', err);
      setErrorMessage(err.message || 'Failed to deploy store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize from activeStore or user / location context
  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      if (activeStore) {
        setSelectedBuilding(activeStore.buildingType || activeStore.storeData?.buildingType || 'boutique');
        setStoreName(activeStore.storeData?.storeName || activeStore.name || '');
        setCategory(activeStore.storeData?.category || 'Video Games (Physical)');
        setCondition(activeStore.storeData?.condition || activeStore.rank || 'Like New / Mint');
        setDescription(activeStore.storeData?.description || activeStore.description || '');

        if (activeStore.storeData?.photoItems && activeStore.storeData.photoItems.length > 0) {
          setPhotoItems(activeStore.storeData.photoItems);
        } else if (activeStore.photos && activeStore.photos.length > 0) {
          setPhotoItems(
            activeStore.photos.map((p, idx) => ({
              id: p.id || `p-${idx}`,
              url: p.url,
              price: p.price || '',
              priceType: p.priceType || 'negotiable',
              intent: p.intent || 'sell',
              condition: p.condition || 'Very Good (Tested)',
              description: p.caption || p.description || '',
            }))
          );
        } else {
          setPhotoItems([]);
        }

        const storeCity = activeStore.storeData?.cityName || activeStore.locationName || activeStore.sector || 'Tokyo, Japan';
        setCityInput(storeCity);
        handleLookupLocation(storeCity);

        setContactDiscord(activeStore.storeData?.contactDiscord || activeStore.socialLinks?.discord || '');
        setContactEmail(activeStore.storeData?.contactEmail || user?.email || '');
        setContactPhone(activeStore.storeData?.contactPhone || '');
        setSellerGamerTag(activeStore.storeData?.sellerGamerTag || gamerProfile?.gamerTag || user?.displayName || '');
      } else {
        if (gamerProfile?.gamerTag) {
          setSellerGamerTag(gamerProfile.gamerTag);
          if (!storeName) {
            setStoreName(`${gamerProfile.gamerTag}'s Game Vault`);
          }
        } else if (user?.displayName) {
          setSellerGamerTag(user.displayName);
          if (!storeName) {
            setStoreName(`${user.displayName}'s Marketplace`);
          }
        }

        if (gamerProfile?.socialLinks?.discord) {
          setContactDiscord(gamerProfile.socialLinks.discord);
        }
        if (user?.email) {
          setContactEmail(user.email);
        } else {
          setContactEmail('');
        }

        const initialCity = gamerProfile?.locationName || coords?.cityName || 'Tokyo, Japan';
        setCityInput(initialCity);
        handleLookupLocation(initialCity);
      }
    }
  }, [isOpen, initialStore, gamerProfile, user, coords]);

  // Global Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Account Requirement Gate: Only users with accounts created can use this option
  if (!user) {
    return (
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            playSketchClick();
            onClose();
          }
        }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md p-6 sm:p-8 bg-[#020804] border-2 border-pink-400 rounded-2xl text-center shadow-[0_0_40px_rgba(236,72,153,0.45)] flex flex-col items-center select-none cursor-default"
          style={{
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playSketchClick();
              onClose();
            }}
            className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white bg-black/60 hover:bg-white/10 border border-white/20 hover:border-white/50 rounded-lg transition-colors cursor-pointer select-none"
            title="Close [Esc]"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>

          <div className="w-16 h-16 rounded-full bg-pink-950/80 border-2 border-pink-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            <Lock className="w-8 h-8 text-pink-400" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black font-display text-white mb-2 tracking-wide">
            Account Required to Open Store
          </h3>

          <p className="text-xs sm:text-sm font-sketch text-slate-300 leading-relaxed mb-6 max-w-sm">
            Only players with accounts created can deploy a 3D store for selling and trading on the radar map. Create your free account or sign in to continue!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onClose();
                onOpenAuthModal?.('signup');
              }}
              className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-white font-display font-black text-sm tracking-wide rounded-xl cursor-pointer hover:opacity-95 transition-all shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onClose();
                onOpenAuthModal?.('signin');
              }}
              className="w-full sm:flex-1 py-3 px-4 bg-[#051108] border border-green-500/50 hover:border-green-400 text-green-200 font-display font-bold text-sm rounded-xl cursor-pointer transition-all hover:bg-[#091f0f]"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSketchClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#030905] text-slate-100 p-5 sm:p-7 relative border my-auto max-h-[94vh] flex flex-col shadow-[0_0_50px_rgba(34,197,94,0.35)] cursor-default"
        style={{
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
          borderColor:
            selectedBuilding === 'boutique'
              ? '#ec4899'
              : selectedBuilding === 'girly_spooky'
              ? '#f43f5e'
              : selectedBuilding === 'girly_kiosk'
              ? '#db2777'
              : selectedBuilding === 'boy_kiosk'
              ? '#0284c7'
              : selectedBuilding === 'spooky_shop'
              ? '#f97316'
              : '#10b981',
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-green-500/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
                selectedBuilding === 'boutique'
                  ? 'bg-pink-950/80 border-pink-400 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                  : selectedBuilding === 'girly_spooky'
                  ? 'bg-rose-950/80 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                  : selectedBuilding === 'girly_kiosk'
                  ? 'bg-pink-950/80 border-pink-400 text-pink-300 shadow-[0_0_15px_rgba(219,39,119,0.5)]'
                  : selectedBuilding === 'boy_kiosk'
                  ? 'bg-sky-950/80 border-sky-400 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
                  : selectedBuilding === 'spooky_shop'
                  ? 'bg-orange-950/80 border-orange-400 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                  : 'bg-emerald-950/80 border-lime-400 text-lime-300 shadow-[0_0_15px_rgba(163,230,53,0.5)]'
              }`}
            >
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide flex items-center gap-2">
                <span>{activeStore ? 'Edit Store & Inventory' : 'Deploy Sell or Trade Store'}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-lime-950 text-lime-300 border border-lime-500/50">
                  {activeStore ? '1 STORE LIMIT · EDIT' : '1 STORE PER USER'}
                </span>
              </h2>
              <p className="text-xs font-sketch text-slate-400">
                {activeStore
                  ? 'Update your 3D storefront style, prices, inventory photos, and contact info (1 store per user).'
                  : 'Choose your 3D building, list your items or trade requests, and deploy it to your local sector!'}
              </p>
            </div>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleFinish} className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-6 py-4">
          {errorMessage && (
            <div className="p-3 bg-red-950/90 border border-red-500/80 rounded flex items-center gap-2 text-xs font-sketch text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1 Store Per User Policy Banner */}
          {activeStore ? (
            <div className="p-3 bg-pink-950/40 border border-pink-500/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sketch text-pink-200">
              <div className="flex items-start gap-2.5">
                <Store className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white uppercase tracking-wider font-mono text-[10px] block text-pink-300">
                    Active Store · 1 Store Per User Limit
                  </span>
                  <span>
                    Each user can only create and have <strong>one store</strong>. You are currently managing your active store:{' '}
                    <strong className="text-white">{storeName || activeStore.name}</strong>.
                  </span>
                </div>
              </div>
              {onDeleteStore && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    setShowDeleteConfirm(true);
                  }}
                  className="px-3 py-1.5 bg-red-950/90 hover:bg-red-900 border border-red-500/60 hover:border-red-400 text-red-200 font-mono font-bold text-[11px] rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5"
                >
                  <span>Close / Delete Store</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs font-sketch text-emerald-200">
              <Store className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <strong>Store Policy (1 Store Per User):</strong> Users can only create and have <strong>one store only</strong>. Kiosk = 5 items max | Store buildings & Halloween building = 10 items max.
              </div>
            </div>
          )}

          {/* Delete Store Confirmation Box */}
          {showDeleteConfirm && activeStore && onDeleteStore && (
            <div className="p-3.5 bg-red-950/90 border-2 border-red-500/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sketch text-red-100 shadow-[0_0_25px_rgba(239,68,68,0.5)]">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm">Delete this store?</strong>
                  <span>This permanently deletes your store and all uploaded items from the radar map. This will free your single store slot so you can create a new store.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    onDeleteStore(activeStore.id);
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-lg"
                >
                  Yes, Delete Store
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSketchClick();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Peer-to-Peer & Zero Fees Disclaimer Banner */}
          <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200 font-sketch">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">0% Fees & Peer-to-Peer Trading Notice:</strong> SquadUp takes $0 in fees and does NOT process payments. All sales, trades, and exchanges are conducted solely between you and the buyer/seller at your own risk. Always meet in safe, well-lit public locations.
            </div>
          </div>

          {/* STEP 1: Store Building Choice */}
          <div className="p-4 bg-[#010603] rounded-xl border border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold font-display text-lime-300 uppercase tracking-wider flex items-center gap-2">
                <span>1. Choose Your 3D Store Building *</span>
              </label>
              <span className="text-[11px] font-sketch text-slate-400">
                This exact 3D building will be planted on the map
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Building Option 1: Pink Pastel Boutique */}
              <div
                onClick={() => handleSelectBuilding('boutique')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${
                  selectedBuilding === 'boutique'
                    ? 'border-pink-400 bg-pink-950/30 shadow-[0_0_25px_rgba(236,72,153,0.4)] scale-[1.01]'
                    : 'border-slate-800 bg-[#020704] opacity-80 hover:opacity-100 hover:border-pink-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-display text-pink-300 flex items-center gap-1.5 truncate">
                    <span>🌸 Pink Boutique</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-pink-950/90 text-pink-300 border border-pink-400/50">
                      10 Items
                    </span>
                    {selectedBuilding === 'boutique' && (
                      <span className="text-[9px] font-mono font-bold bg-pink-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* 3D Canvas Preview of Building 1 */}
                <div className="w-full h-36 rounded-lg bg-[#0f172a] overflow-hidden flex items-center justify-center border border-pink-400/40 relative">
                  <StoreBuilding3D
                    buildingType="boutique"
                    storeTitle="PINK BOUTIQUE"
                    width={180}
                    height={140}
                    isLive={selectedBuilding === 'boutique'}
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-pink-300/80 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {selectedBuilding === 'boutique' ? '3D Interactive · Live' : 'Click to View 3D'}
                  </div>
                </div>

                <p className="mt-2 text-[10px] font-sketch text-slate-300 text-center leading-relaxed">
                  Pink & cream boutique with mansard roof, striped awning, storefront displays & sparkles. (Capacity: 10 items)
                </p>
              </div>

              {/* Building Option 2: Girly Spooky Shop */}
              <div
                onClick={() => handleSelectBuilding('girly_spooky')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${
                  selectedBuilding === 'girly_spooky'
                    ? 'border-rose-400 bg-rose-950/30 shadow-[0_0_25px_rgba(244,63,94,0.45)] scale-[1.01]'
                    : 'border-slate-800 bg-[#020704] opacity-80 hover:opacity-100 hover:border-rose-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-display text-rose-300 flex items-center gap-1.5 truncate">
                    <span>🎀 Girly Spooky Shop</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-400/50">
                      10 Items
                    </span>
                    {selectedBuilding === 'girly_spooky' && (
                      <span className="text-[9px] font-mono font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* 3D Canvas Preview of Building 2 */}
                <div className="w-full h-36 rounded-lg bg-[#12091c] overflow-hidden flex items-center justify-center border border-rose-400/40 relative">
                  <StoreBuilding3D
                    buildingType="girly_spooky"
                    storeTitle="KAWAII SPOOKY"
                    width={180}
                    height={140}
                    isLive={selectedBuilding === 'girly_spooky'}
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-rose-300/80 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {selectedBuilding === 'girly_spooky' ? '3D Interactive · Live' : 'Click to View 3D'}
                  </div>
                </div>

                <p className="mt-2 text-[10px] font-sketch text-slate-300 text-center leading-relaxed">
                  Kawaii pastel goth shop with bubbling pink cauldron, star carpet & pumpkins. (Halloween Building: 10 items)
                </p>
              </div>

              {/* Building Option 3: Girly Kiosky */}
              <div
                onClick={() => handleSelectBuilding('girly_kiosk')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${
                  selectedBuilding === 'girly_kiosk'
                    ? 'border-pink-400 bg-pink-950/30 shadow-[0_0_25px_rgba(219,39,119,0.45)] scale-[1.01]'
                    : 'border-slate-800 bg-[#020704] opacity-80 hover:opacity-100 hover:border-pink-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-display text-pink-300 flex items-center gap-1.5 truncate">
                    <span>🎀 Girly Kiosky</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-pink-950/90 text-pink-300 border border-pink-400/50">
                      5 Items
                    </span>
                    {selectedBuilding === 'girly_kiosk' && (
                      <span className="text-[9px] font-mono font-bold bg-pink-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* 3D Canvas Preview of Building 3 */}
                <div className="w-full h-36 rounded-lg bg-[#1a0c27] overflow-hidden flex items-center justify-center border border-pink-400/40 relative">
                  <StoreBuilding3D
                    buildingType="girly_kiosk"
                    storeTitle="KIOSKY"
                    width={180}
                    height={140}
                    isLive={selectedBuilding === 'girly_kiosk'}
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-pink-300/80 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {selectedBuilding === 'girly_kiosk' ? '3D Interactive · Live' : 'Click to View 3D'}
                  </div>
                </div>

                <p className="mt-2 text-[10px] font-sketch text-slate-300 text-center leading-relaxed">
                  Pastel pink boba & macaron kiosk with ribbon bow & scalloped awning. (Kiosk: 5 items max)
                </p>
              </div>

              {/* Building Option 4: Boy Kiosky */}
              <div
                onClick={() => handleSelectBuilding('boy_kiosk')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${
                  selectedBuilding === 'boy_kiosk'
                    ? 'border-sky-400 bg-sky-950/30 shadow-[0_0_25px_rgba(56,189,248,0.45)] scale-[1.01]'
                    : 'border-slate-800 bg-[#020704] opacity-80 hover:opacity-100 hover:border-sky-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-display text-sky-300 flex items-center gap-1.5 truncate">
                    <span>🧢 Boy Kiosky</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-950/90 text-sky-300 border border-sky-400/50">
                      5 Items
                    </span>
                    {selectedBuilding === 'boy_kiosk' && (
                      <span className="text-[9px] font-mono font-bold bg-sky-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* 3D Canvas Preview of Boy Kiosk */}
                <div className="w-full h-36 rounded-lg bg-[#0b0f19] overflow-hidden flex items-center justify-center border border-sky-400/40 relative">
                  <StoreBuilding3D
                    buildingType="boy_kiosk"
                    storeTitle="BOY KIOSKY"
                    width={180}
                    height={140}
                    isLive={selectedBuilding === 'boy_kiosk'}
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-sky-300/80 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {selectedBuilding === 'boy_kiosk' ? '3D Interactive · Live' : 'Click to View 3D'}
                  </div>
                </div>

                <p className="mt-2 text-[10px] font-sketch text-slate-300 text-center leading-relaxed">
                  Vibrant ice-blue gamer kiosk with burger grill, energy sodas & mini arcade. (Kiosk: 5 items max)
                </p>
              </div>

              {/* Building Option 5: Spooky Halloween Shop */}
              <div
                onClick={() => handleSelectBuilding('spooky_shop')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${
                  selectedBuilding === 'spooky_shop'
                    ? 'border-orange-400 bg-orange-950/30 shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-[1.01]'
                    : 'border-slate-800 bg-[#020704] opacity-80 hover:opacity-100 hover:border-orange-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-display text-orange-300 flex items-center gap-1.5 truncate">
                    <span>🎃 Halloween Shop</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-950/90 text-orange-300 border border-orange-400/50">
                      10 Items
                    </span>
                    {selectedBuilding === 'spooky_shop' && (
                      <span className="text-[9px] font-mono font-bold bg-orange-500 text-black px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* 3D Canvas Preview of Building 4 */}
                <div className="w-full h-36 rounded-lg bg-[#0b0716] overflow-hidden flex items-center justify-center border border-orange-400/40 relative">
                  <StoreBuilding3D
                    buildingType="spooky_shop"
                    storeTitle="SPOOKY SHOP"
                    width={180}
                    height={140}
                    isLive={selectedBuilding === 'spooky_shop'}
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-orange-300/80 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {selectedBuilding === 'spooky_shop' ? '3D Interactive · Live' : 'Click to View 3D'}
                  </div>
                </div>

                <p className="mt-2 text-[10px] font-sketch text-slate-300 text-center leading-relaxed">
                  Haunted purple timber shop with crystal ball desk, bubbling cauldron & ghosts. (Halloween Building: 10 items)
                </p>
              </div>

              {/* Building Option 6: Cyber Arcade & Game Hub */}
              <div
                onClick={() => handleSelectBuilding('arcade')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${
                  selectedBuilding === 'arcade'
                    ? 'border-emerald-400 bg-emerald-950/30 shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-[1.01]'
                    : 'border-slate-800 bg-[#020704] opacity-80 hover:opacity-100 hover:border-emerald-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-display text-emerald-300 flex items-center gap-1.5 truncate">
                    <span>⚡ Cyber Arcade</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-400/50">
                      10 Items
                    </span>
                    {selectedBuilding === 'arcade' && (
                      <span className="text-[9px] font-mono font-bold bg-emerald-500 text-black px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* 3D Canvas Preview of Building 5 */}
                <div className="w-full h-36 rounded-lg bg-[#041308] overflow-hidden flex items-center justify-center border border-emerald-400/40 relative">
                  <StoreBuilding3D
                    buildingType="arcade"
                    storeTitle="CYBER ARCADE"
                    width={180}
                    height={140}
                    isLive={selectedBuilding === 'arcade'}
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-emerald-300/80 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {selectedBuilding === 'arcade' ? '3D Interactive · Live' : 'Click to View 3D'}
                  </div>
                </div>

                <p className="mt-2 text-[10px] font-sketch text-slate-300 text-center leading-relaxed">
                  Retro cyber arcade with glowing neon marquee & gaming cabinets. (Store Building: 10 items)
                </p>
              </div>

              {/* Building Option 7: Medium Format Store (15 Items - Expanded +5 Capacity) */}
              <div
                onClick={() => handleSelectBuilding('medium_store')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${
                  selectedBuilding === 'medium_store'
                    ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_25px_rgba(245,158,11,0.45)] scale-[1.01]'
                    : 'border-slate-800 bg-[#020704] opacity-80 hover:opacity-100 hover:border-amber-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-display text-amber-300 flex items-center gap-1.5 truncate">
                    <span>🏢 Medium Format Store</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isMediumStoreUnlocked
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-400/50'
                        : 'bg-amber-950/90 text-amber-300 border-amber-400/50'
                    }`}>
                      {isMediumStoreUnlocked ? '✓ 15 Items Unlocked' : '+5 Spaces · $5.00'}
                    </span>
                    {selectedBuilding === 'medium_store' && (
                      <span className="text-[9px] font-mono font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* 3D Canvas Preview of Building 7 */}
                <div className="w-full h-36 rounded-lg bg-[#0c121d] overflow-hidden flex items-center justify-center border border-amber-400/40 relative">
                  <StoreBuilding3D
                    buildingType="medium_store"
                    storeTitle="MEDIUM STORE"
                    width={180}
                    height={140}
                    isLive={selectedBuilding === 'medium_store'}
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-amber-300/80 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {selectedBuilding === 'medium_store' ? '3D Interactive · Live' : 'Click to View 3D'}
                  </div>
                </div>

                <p className="mt-2 text-[10px] font-sketch text-slate-300 text-center leading-relaxed">
                  Voxel medium format store with brick foundation, quartz trim, camera gear & gold sign. (Capacity: 15 items)
                </p>

                {/* Direct Stripe Buy / Unlock Button */}
                {!isMediumStoreUnlocked && (
                  <button
                    type="button"
                    onClick={(e) => handleBuyBuilding('medium_store', e)}
                    disabled={isUnlockingBuilding}
                    className="mt-2.5 w-full py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>{isUnlockingBuilding ? 'Connecting to Stripe...' : 'Buy Building for $5.00 (+5 Spaces)'}</span>
                  </button>
                )}
              </div>

              {/* Building Option 8: Sketch Corner Store (15 Items - Expanded +5 Capacity) */}
              <div
                onClick={() => handleSelectBuilding('sketch_store')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${
                  selectedBuilding === 'sketch_store'
                    ? 'border-orange-300 bg-stone-900/50 shadow-[0_0_25px_rgba(251,146,60,0.45)] scale-[1.01]'
                    : 'border-slate-800 bg-[#020704] opacity-80 hover:opacity-100 hover:border-orange-400/50'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-display text-orange-200 flex items-center gap-1.5 truncate">
                    <span>🎨 Sketch Corner Store</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isSketchStoreUnlocked
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-400/50'
                        : 'bg-orange-950/90 text-orange-300 border-orange-400/50'
                    }`}>
                      {isSketchStoreUnlocked ? '✓ 15 Items Unlocked' : '+5 Spaces · $5.00'}
                    </span>
                    {selectedBuilding === 'sketch_store' && (
                      <span className="text-[9px] font-mono font-bold bg-orange-400 text-black px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* 3D Canvas Preview of Building 8 */}
                <div className="w-full h-36 rounded-lg bg-[#141210] overflow-hidden flex items-center justify-center border border-orange-300/40 relative">
                  <StoreBuilding3D
                    buildingType="sketch_store"
                    storeTitle="CORNER STORE"
                    width={180}
                    height={140}
                    isLive={selectedBuilding === 'sketch_store'}
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-orange-200/80 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {selectedBuilding === 'sketch_store' ? '3D Interactive · Live' : 'Click to View 3D'}
                  </div>
                </div>

                <p className="mt-2 text-[10px] font-sketch text-slate-300 text-center leading-relaxed">
                  Toon ink sketch 2-floor corner store with wood parquet, apparel, library books & billboard. (Capacity: 15 items)
                </p>

                {/* Direct Stripe Buy / Unlock Button */}
                {!isSketchStoreUnlocked && (
                  <button
                    type="button"
                    onClick={(e) => handleBuyBuilding('sketch_store', e)}
                    disabled={isUnlockingBuilding}
                    className="mt-2.5 w-full py-1.5 px-3 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-300 hover:to-amber-400 text-black font-display font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(251,146,60,0.4)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>{isUnlockingBuilding ? 'Connecting to Stripe...' : 'Buy Building for $5.00 (+5 Spaces)'}</span>
                  </button>
                )}
              </div>

              {/* Building Option 9: 3-Floor Cyber Megastore (15 Items - Expanded +5 Capacity) */}
              <div
                onClick={() => handleSelectBuilding('cyber_tower')}
                className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${
                  selectedBuilding === 'cyber_tower'
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.45)] scale-[1.01]'
                    : 'border-slate-800 bg-[#020704] opacity-80 hover:opacity-100 hover:border-cyan-500/50'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-display text-cyan-300 flex items-center gap-1.5 truncate">
                    <span>🏙️ Cyber Megastore</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isCyberTowerUnlocked
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-400/50'
                        : 'bg-cyan-950/90 text-cyan-300 border-cyan-400/50'
                    }`}>
                      {isCyberTowerUnlocked ? '✓ 15 Items Unlocked' : '+5 Spaces · $5.00'}
                    </span>
                    {selectedBuilding === 'cyber_tower' && (
                      <span className="text-[9px] font-mono font-bold bg-cyan-400 text-black px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> SELECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* 3D Canvas Preview of Building 9 */}
                <div className="w-full h-36 rounded-lg bg-[#070b18] overflow-hidden flex items-center justify-center border border-cyan-400/40 relative">
                  <StoreBuilding3D
                    buildingType="cyber_tower"
                    storeTitle="CYBER TOWER"
                    width={180}
                    height={140}
                    isLive={selectedBuilding === 'cyber_tower'}
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-300/80 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {selectedBuilding === 'cyber_tower' ? '3D Interactive · Live' : 'Click to View 3D'}
                  </div>
                </div>

                <p className="mt-2 text-[10px] font-sketch text-slate-300 text-center leading-relaxed">
                  3-floor cyberpunk tower with glass elevator, weapon racks, server core, drone & neon sign. (Capacity: 15 items)
                </p>

                {/* Direct Stripe Buy / Unlock Button */}
                {!isCyberTowerUnlocked && (
                  <button
                    type="button"
                    onClick={(e) => handleBuyBuilding('cyber_tower', e)}
                    disabled={isUnlockingBuilding}
                    className="mt-2.5 w-full py-1.5 px-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-display font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>{isUnlockingBuilding ? 'Connecting to Stripe...' : 'Buy Building for $5.00 (+5 Spaces)'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: Store Name & Short Description */}
          <div className="p-4 bg-[#010603] rounded-xl border border-green-500/30 space-y-4">
            <label className="text-sm font-bold font-display text-lime-300 uppercase tracking-wider flex items-center gap-2">
              <span>2. Store Name & Short Description *</span>
            </label>

            <div>
              <label className="block text-xs font-sketch text-slate-300 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Retro Nintendo & PS5 Games Exchange"
                className="w-full px-3 py-2 bg-[#020603] border border-green-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-lime-400 font-display"
              />
            </div>

            <div>
              <label className="block text-xs font-sketch text-slate-300 mb-1">
                Short Description About the Store *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your store (e.g., selling retro cartridges, open to trading PS5 titles, meetup notes, etc.)"
                className="w-full px-3 py-2 bg-[#020603] border border-green-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-lime-400 font-sketch resize-none"
              />
            </div>
          </div>

          {/* STEP 3: Photos with Item Details (Kiosk: 5, Store & Halloween: 10) */}
          <div className="p-4 bg-[#010603] rounded-xl border border-green-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold font-display text-lime-300 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-lime-400" />
                  <span>3. Item Photos & Individual Details ({selectedBuilding.includes('kiosk') ? 'Kiosk: 5 Items Max' : 'Building: 10 Items Max'})</span>
                </label>
                <p className="text-[11px] font-sketch text-slate-400 mt-0.5">
                  Set individual price, firm on price or negotiable status, sell or trade, and description under each item.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-lime-400 bg-lime-950 px-2.5 py-1 rounded border border-lime-500/40 shadow">
                {photoItems.length} / {maxItems} Items
              </span>
            </div>

            {/* Photo Upload Area */}
            {photoItems.length < maxItems ? (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-lime-500/50 hover:border-lime-400 rounded-xl bg-lime-950/15 hover:bg-lime-950/25 transition-all cursor-pointer group">
                <Upload className="w-6 h-6 text-lime-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-xs font-display font-bold text-lime-200">
                  {isCompressing ? 'Compressing & Adding Photos...' : 'Click to Upload Photos'}
                </span>
                <span className="text-[11px] font-sketch text-slate-400 mt-0.5">
                  Select up to {maxItems - photoItems.length} more {maxItems - photoItems.length === 1 ? 'item' : 'items'} (PNG, JPG, WebP) · Capacity: {maxItems} items
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isCompressing}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-2.5 bg-lime-950/30 border border-lime-500/40 rounded-lg text-center text-xs font-sketch text-lime-300">
                ✓ Maximum of {maxItems} items uploaded for this {selectedBuilding.includes('kiosk') ? 'kiosk' : 'building'}. Delete any item card below to replace.
              </div>
            )}

            {/* Photo Cards Grid with Fields Under Each Photo */}
            {photoItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {photoItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="bg-[#020904] border border-green-500/40 hover:border-lime-400/60 rounded-xl overflow-hidden flex flex-col shadow-md transition-all group"
                  >
                    {/* Photo Preview Thumbnail */}
                    <div className="relative aspect-video w-full bg-black/90 overflow-hidden flex items-center justify-center border-b border-green-500/30">
                      <img
                        src={item.url}
                        alt={`Item Photo ${idx + 1}`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 left-2 bg-black/85 text-[11px] font-mono font-bold text-lime-300 px-2 py-0.5 rounded border border-lime-500/50 shadow">
                        Photo #{idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg cursor-pointer transition-colors shadow"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Under Photo Inputs: Price, Firm/Negotiable, Sell/Trade, Description */}
                    <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                      {/* Price & Price Terms */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-display font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Price</span>
                          </label>
                          {/* Firm on Price vs Negotiable Pills */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdatePhotoItem(idx, 'priceType', 'firm')}
                              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all ${
                                item.priceType === 'firm'
                                  ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)] border border-rose-400'
                                  : 'bg-black/60 text-slate-400 hover:text-slate-200 border border-slate-700'
                              }`}
                            >
                              Firm on Price
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePhotoItem(idx, 'priceType', 'negotiable')}
                              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all ${
                                item.priceType === 'negotiable'
                                  ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-emerald-400 font-black'
                                  : 'bg-black/60 text-slate-400 hover:text-slate-200 border border-slate-700'
                              }`}
                            >
                              Negotiable
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={item.price || ''}
                          onChange={(e) => handleUpdatePhotoItem(idx, 'price', e.target.value)}
                          placeholder="e.g. $45 or $120"
                          className="w-full px-2.5 py-1.5 bg-[#010603] border border-emerald-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400 font-mono-num placeholder:text-slate-600"
                        />
                      </div>

                      {/* Individual Photo Item Condition */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-display font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-3 h-3 text-sky-400" />
                            <span>Item Condition</span>
                          </label>
                          {item.condition && (
                            <span className="text-[9px] font-mono text-sky-300 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/40">
                              {item.condition}
                            </span>
                          )}
                        </div>
                        <select
                          value={item.condition || 'Very Good (Tested)'}
                          onChange={(e) => handleUpdatePhotoItem(idx, 'condition', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#010603] border border-sky-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-sky-400 font-sketch cursor-pointer"
                        >
                          <option value="Brand New / Sealed">Brand New / Factory Sealed</option>
                          <option value="Like New / Mint">Like New / Mint Condition</option>
                          <option value="Very Good (Tested)">Very Good / Tested Working</option>
                          <option value="Good (Complete in Box)">Good (Complete in Box)</option>
                          <option value="Used / Loose">Used / Loose Cartridge or Disc</option>
                          <option value="Parts / Not Working">Parts / Repair / As-Is</option>
                        </select>
                      </div>

                      {/* Sell or Trade Option */}
                      <div>
                        <label className="block text-[11px] font-display font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-amber-400" />
                          <span>Sell or Trade</span>
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdatePhotoItem(idx, 'intent', 'sell')}
                            className={`py-1 text-[11px] font-display font-bold rounded cursor-pointer border text-center transition-all ${
                              item.intent === 'sell'
                                ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                : 'bg-black/50 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            💵 Sell
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePhotoItem(idx, 'intent', 'trade')}
                            className={`py-1 text-[11px] font-display font-bold rounded cursor-pointer border text-center transition-all ${
                              item.intent === 'trade'
                                ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                : 'bg-black/50 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            🔄 Trade
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePhotoItem(idx, 'intent', 'both')}
                            className={`py-1 text-[11px] font-display font-bold rounded cursor-pointer border text-center transition-all ${
                              item.intent === 'both'
                                ? 'bg-lime-950 border-lime-400 text-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.3)]'
                                : 'bg-black/50 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Sell / Trade
                          </button>
                        </div>
                      </div>

                      {/* Description under each photo */}
                      <div>
                        <label className="block text-[11px] font-sketch text-slate-300 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={item.description || ''}
                          onChange={(e) => handleUpdatePhotoItem(idx, 'description', e.target.value)}
                          placeholder="Condition, cords/box included, or trade wishlist..."
                          className="w-full px-2.5 py-1.5 bg-[#010603] border border-green-500/40 rounded-lg text-xs text-white focus:outline-none focus:border-lime-400 font-sketch resize-none placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 4: Global City / Region / GPS Location */}
          <div className="p-4 bg-[#010603] rounded-xl border border-lime-500/40 shadow-[0_0_15px_rgba(163,230,53,0.15)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold font-display text-lime-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-lime-400" />
                <span>4. Store Map Location · Any City, Country, or GPS *</span>
              </label>
              {coords && (
                <button
                  type="button"
                  onClick={handleUseGPS}
                  className="text-[11px] font-sketch text-lime-400 hover:text-lime-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Use My GPS</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder="Enter city or country (e.g. Tokyo, London, Dallas, Berlin)"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  if (locationError) setLocationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupLocation();
                  }
                }}
                className="flex-1 min-w-0 w-full px-3 py-2 bg-[#020603] border border-lime-500/50 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-lime-400 tracking-wide text-left"
              />
              <button
                type="button"
                onClick={() => handleLookupLocation()}
                disabled={isLookingUpLocation || !cityInput.trim()}
                className="w-full sm:w-auto shrink-0 px-4 py-2 bg-lime-400 hover:bg-lime-300 text-black font-display font-bold text-xs rounded-lg cursor-pointer transition-all shadow-[0_0_10px_rgba(163,230,53,0.4)] disabled:opacity-50 whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-black shrink-0" />
                <span>{isLookingUpLocation ? 'Locating...' : 'Pinpoint City'}</span>
              </button>
            </div>

            {locationError && (
              <p className="text-xs text-red-400 font-sketch flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{locationError}</span>
              </p>
            )}

            {resolvedLocation && (
              <div className="p-2.5 bg-lime-950/40 border border-lime-500/60 rounded-lg flex items-center gap-2.5 text-xs text-lime-300 font-sketch">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping flex-shrink-0" />
                <div>
                  <strong className="text-white font-display">{resolvedLocation.cityName}</strong>
                  <span className="ml-2 font-mono text-[11px] text-lime-400/80">
                    ({resolvedLocation.lat.toFixed(4)}°, {resolvedLocation.lng.toFixed(4)}°)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 5: Seller Contact Details */}
          <div className="p-4 bg-[#010603] rounded-xl border border-green-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold font-display text-lime-300 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4 text-lime-400" />
                <span>5. Contact Info for Buyers & Traders (All Optional)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-slate-700">
                OPTIONAL CONTACTS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-sketch text-slate-300 mb-1 flex items-center justify-between">
                  <span>Discord Handle</span>
                  <span className="text-[10px] text-slate-500 font-mono">OPTIONAL</span>
                </label>
                <input
                  type="text"
                  value={contactDiscord}
                  onChange={(e) => setContactDiscord(e.target.value)}
                  placeholder="e.g. GamerTag#1234"
                  className="w-full px-3 py-2 bg-[#020603] border border-green-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-lime-400 font-mono placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-sketch text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-lime-400" />
                    <span>Email Address</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">OPTIONAL</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. gamer@example.com"
                  className="w-full px-3 py-2 bg-[#020603] border border-green-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-lime-400 font-mono placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-sketch text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-lime-400" />
                    <span>Phone / Text / Call</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">OPTIONAL</span>
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. (555) 012-3456 (text or call)"
                  className="w-full px-3 py-2 bg-[#020603] border border-green-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-lime-400 font-mono placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-[11px] font-sketch text-slate-400 flex items-start gap-2">
              <span className="text-lime-400 mt-0.5">ℹ️</span>
              <span>
                <strong>Note:</strong> Phone (text or call) and email are completely optional. Only players with created accounts can deploy stores to ensure verified local trades.
              </span>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-green-500/30 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                playSketchClick();
                onClose();
              }}
              className="px-4 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white rounded-lg text-xs font-sketch cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !resolvedLocation}
              className="max-w-full px-5 sm:px-6 py-2.5 bg-gradient-to-r from-lime-400 via-emerald-400 to-green-400 text-black font-display font-black text-xs sm:text-sm tracking-wide rounded-xl cursor-pointer hover:opacity-95 transition-all shadow-[0_0_25px_rgba(163,230,53,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              <Store className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {isSubmitting
                  ? 'Saving Changes...'
                  : activeStore
                  ? 'Save & Update Store (1 Store Limit) 🏪'
                  : 'Finish & Put Store on Map (1 Store Limit) 🏪'}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
