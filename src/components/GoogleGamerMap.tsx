import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { SquadBeacon, CharacterAvatarType } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { AlertCircle, Plane } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { playSketchClick, playRadarPing } from '../utils/audio';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';
import { getZipCoordinatesSync } from '../utils/zipLookup';
import {
  setupClassicCharacterScene,
  setupWavingCharacterScene,
  setupPumpkinMonsterScene,
  setupGirlyPumpkinScene,
  setupJasonScene,
  setupGhostfaceScene,
  setupMichaelMyersScene,
  setupFreddyScene,
  setupCyberSoccerGirlScene,
  setupCyberSoccerBoyScene,
  setupPurpleAnimeGirlScene,
  setupMexicanTravelerScene,
  setupAlienGirlScene,
  setupAlienBoyScene,
  setupMoonDemonNobleScene,
  setupDemonDogWarriorScene,
  setupCelestialMoonGuardianScene,
  setupSacredShrinePriestessScene,
  getCharacterAuraFilter,
} from './BlockyCharacter3D';
import {
  setupBoutiqueStoreScene,
  setupArcadeStoreScene,
  setupSpookyStoreScene,
  setupGirlySpookyStoreScene,
  setupGirlyKioskStoreScene,
  setupBoyKioskStoreScene,
  setupMediumFormatStoreScene,
  setupSketchStoreScene,
  setupCyberTowerStoreScene,
} from './StoreBuilding3D';
import { setupGrandEventHallScene } from './EventBuilding3D';
import { setupGameRoomCafeScene } from './GameRoomBuilding3D';
import { isEventExpired, filterActiveEvents } from '../utils/eventExpiration';
import { setupAirshipScene, AirshipSceneController } from './Airship3D';
import {
  getAirshipFlightStatus,
  subscribeAirshipBillboard,
  subscribeAllBillboards,
  AirshipFlightStatus,
  AirshipBillboardData,
  GLOBAL_AIRSHIP_CITIES,
  GlobalAirshipCity,
  AerialCraftType,
} from '../utils/airshipFlight';
import { AirshipBillboardModal } from './AirshipBillboardModal';

function getEventRemainingBadge(expiresAt?: string): string {
  if (!expiresAt) return 'EVENT';
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'ENDING';
  const hoursTotal = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hoursTotal / 24);
  if (days >= 1) {
    return `${days}D LEFT`;
  }
  const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (hoursTotal < 1) {
    return `${mins}M LEFT`;
  }
  return `${hoursTotal}H LEFT`;
}

// Computes dynamic scale so characters, stores, and buildings shrink when zooming out and expand when zooming in
function getZoomScale(zoom: number): number {
  // Zoom 16+: Street / close-up view (1.10x) - large, detailed, close-up
  // Zoom 15: Neighborhood standard (1.00x)
  // Zoom 14: City district (0.85x)
  // Zoom 13: Citywide (0.70x)
  // Zoom 12: Metro area (0.56x)
  // Zoom 11: Regional (0.44x)
  // Zoom 10: State view (0.35x)
  // Zoom <= 9: Wide map view (0.28x)
  if (zoom >= 16) return 1.1;
  if (zoom === 15) return 1.0;
  if (zoom === 14) return 0.85;
  if (zoom === 13) return 0.70;
  if (zoom === 12) return 0.56;
  if (zoom === 11) return 0.44;
  if (zoom === 10) return 0.35;
  return 0.28;
}

// Custom Three.js 3D Grand Event Hall Google Maps Overlay Factory
function createThreeEventHallOverlay(
  id: string,
  position: google.maps.LatLng,
  eventName: string,
  remainingBadge: string,
  onClick: () => void
): google.maps.OverlayView {
  class ThreeEventOverlay extends google.maps.OverlayView {
    private position: google.maps.LatLng;
    private containerDiv: HTMLElement;
    private cleanupScene?: () => void;

    constructor() {
      super();
      this.position = position;

      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.transform = 'translate(-50%, -100%)';
      div.style.cursor = 'pointer';
      div.style.zIndex = '999';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';
      div.style.userSelect = 'none';

      // Badge above building
      const badge = document.createElement('div');
      badge.style.padding = '3px 8px';
      badge.style.fontSize = '10px';
      badge.style.fontFamily = "'Chakra Petch', sans-serif";
      badge.style.fontWeight = 'bold';
      badge.style.color = '#ffffff';
      badge.style.background = 'rgba(15, 23, 42, 0.95)';
      badge.style.border = '1.5px solid #eab308';
      badge.style.borderRadius = '6px';
      badge.style.boxShadow = '0 0 16px rgba(234, 179, 8, 0.65)';
      badge.style.whiteSpace = 'nowrap';
      badge.style.marginBottom = '2px';
      badge.innerHTML = `
        <div style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:12px;">🏛️</span>
          <span style="font-weight:900;text-transform:uppercase;">${eventName}</span>
          <span style="background:#eab308;color:#000;font-size:9px;padding:1px 4px;border-radius:3px;font-weight:bold;">${remainingBadge}</span>
        </div>
      `;

      div.appendChild(badge);

      const width = 114;
      const height = 98;

      const canvasWrap = document.createElement('div');
      canvasWrap.style.position = 'relative';
      canvasWrap.style.width = `${width}px`;
      canvasWrap.style.height = `${height}px`;

      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvasWrap.appendChild(canvas);

      // Glowing golden ground ring
      const groundRing = document.createElement('div');
      groundRing.style.position = 'absolute';
      groundRing.style.bottom = '-4px';
      groundRing.style.left = '50%';
      groundRing.style.transform = 'translateX(-50%)';
      groundRing.style.width = '68px';
      groundRing.style.height = '18px';
      groundRing.style.borderRadius = '50%';
      groundRing.style.border = '2px solid #eab308';
      groundRing.style.background = 'rgba(234, 179, 8, 0.25)';
      groundRing.style.boxShadow = '0 0 16px #eab308';
      groundRing.style.pointerEvents = 'none';
      canvasWrap.appendChild(groundRing);

      div.appendChild(canvasWrap);

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });

      this.containerDiv = div;

      const { dispose } = setupGrandEventHallScene(canvas, width, height, eventName);
      this.cleanupScene = dispose;
    }

    onAdd() {
      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(this.containerDiv);
    }

    draw() {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (point) {
        this.containerDiv.style.left = `${Math.round(point.x)}px`;
        this.containerDiv.style.top = `${Math.round(point.y)}px`;
      }
      const zoom = this.getMap()?.getZoom() ?? 14;
      const scale = getZoomScale(zoom);
      this.containerDiv.style.transform = `translate(-50%, -100%) scale(${scale.toFixed(3)})`;
      this.containerDiv.style.transformOrigin = 'bottom center';
    }

    onRemove() {
      if (this.cleanupScene) {
        this.cleanupScene();
      }
      if (this.containerDiv.parentNode) {
        this.containerDiv.parentNode.removeChild(this.containerDiv);
      }
    }
  }

  return new ThreeEventOverlay();
}

// Custom Three.js 3D Store Building Google Maps Overlay Factory
function createThreeStoreOverlay(
  id: string,
  position: google.maps.LatLng,
  storeName: string,
  buildingType: 'boutique' | 'arcade' | 'spooky_shop' | 'girly_spooky' | 'girly_kiosk' | 'boy_kiosk' | 'medium_store' | 'sketch_store' | 'cyber_tower',
  actionBadge: string,
  onClick: () => void
): google.maps.OverlayView {
  class ThreeStoreOverlay extends google.maps.OverlayView {
    private position: google.maps.LatLng;
    private containerDiv: HTMLElement;
    private cleanupScene?: () => void;

    constructor() {
      super();
      this.position = position;

      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.transform = 'translate(-50%, -100%)';
      div.style.cursor = 'pointer';
      div.style.zIndex = '999';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';
      div.style.userSelect = 'none';

      const accentColor =
        buildingType === 'boutique'
          ? '#ec4899'
          : buildingType === 'girly_spooky'
          ? '#f43f5e'
          : buildingType === 'girly_kiosk'
          ? '#db2777'
          : buildingType === 'boy_kiosk'
          ? '#0284c7'
          : buildingType === 'spooky_shop'
          ? '#f97316'
          : buildingType === 'medium_store'
          ? '#f59e0b'
          : buildingType === 'sketch_store'
          ? '#fb923c'
          : buildingType === 'cyber_tower'
          ? '#06b6d4'
          : '#10b981';

      // Label badge above building
      const badge = document.createElement('div');
      badge.style.padding = '3px 8px';
      badge.style.fontSize = '10px';
      badge.style.fontFamily = "'Chakra Petch', sans-serif";
      badge.style.fontWeight = 'bold';
      badge.style.color = '#ffffff';
      badge.style.background = 'rgba(2, 6, 4, 0.95)';
      badge.style.border = `1.5px solid ${accentColor}`;
      badge.style.borderRadius = '6px';
      badge.style.boxShadow = `0 0 14px ${accentColor}90`;
      badge.style.whiteSpace = 'nowrap';
      badge.style.marginBottom = '2px';
      badge.innerHTML = `
        <div style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:12px;">🏪</span>
          <span style="font-weight:900;text-transform:uppercase;">${storeName}</span>
          <span style="background:${accentColor};color:#000;font-size:9px;padding:1px 4px;border-radius:3px;font-weight:bold;">${actionBadge}</span>
        </div>
      `;

      div.appendChild(badge);

      const width = 114;
      const height = 98;

      const canvasWrap = document.createElement('div');
      canvasWrap.style.position = 'relative';
      canvasWrap.style.width = `${width}px`;
      canvasWrap.style.height = `${height}px`;

      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvasWrap.appendChild(canvas);

      // Glowing foundation ring
      const groundRing = document.createElement('div');
      groundRing.style.position = 'absolute';
      groundRing.style.bottom = '-4px';
      groundRing.style.left = '50%';
      groundRing.style.transform = 'translateX(-50%)';
      groundRing.style.width = '68px';
      groundRing.style.height = '18px';
      groundRing.style.borderRadius = '50%';
      groundRing.style.border = `2px solid ${accentColor}`;
      groundRing.style.background =
        buildingType === 'boutique'
          ? 'rgba(236,72,153,0.3)'
          : buildingType === 'girly_spooky'
          ? 'rgba(244,63,94,0.35)'
          : buildingType === 'girly_kiosk'
          ? 'rgba(219,39,119,0.35)'
          : buildingType === 'boy_kiosk'
          ? 'rgba(2,132,199,0.35)'
          : buildingType === 'spooky_shop'
          ? 'rgba(249,115,22,0.3)'
          : buildingType === 'medium_store'
          ? 'rgba(245,158,11,0.35)'
          : buildingType === 'sketch_store'
          ? 'rgba(251,146,60,0.35)'
          : buildingType === 'cyber_tower'
          ? 'rgba(6,182,212,0.35)'
          : 'rgba(16,185,129,0.3)';
      groundRing.style.boxShadow = `0 0 16px ${accentColor}`;
      groundRing.style.pointerEvents = 'none';
      canvasWrap.appendChild(groundRing);

      div.appendChild(canvasWrap);

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });

      this.containerDiv = div;

      const { dispose } =
        buildingType === 'sketch_store'
          ? setupSketchStoreScene(canvas, width, height, storeName)
          : buildingType === 'cyber_tower'
          ? setupCyberTowerStoreScene(canvas, width, height, storeName)
          : buildingType === 'medium_store'
          ? setupMediumFormatStoreScene(canvas, width, height, storeName)
          : buildingType === 'boy_kiosk'
          ? setupBoyKioskStoreScene(canvas, width, height, storeName)
          : buildingType === 'girly_kiosk'
          ? setupGirlyKioskStoreScene(canvas, width, height, storeName)
          : buildingType === 'girly_spooky'
          ? setupGirlySpookyStoreScene(canvas, width, height, storeName)
          : buildingType === 'spooky_shop'
          ? setupSpookyStoreScene(canvas, width, height, storeName)
          : buildingType === 'boutique'
          ? setupBoutiqueStoreScene(canvas, width, height, storeName)
          : setupArcadeStoreScene(canvas, width, height, storeName);

      this.cleanupScene = dispose;
    }

    onAdd() {
      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(this.containerDiv);
    }

    draw() {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (point) {
        this.containerDiv.style.left = `${Math.round(point.x)}px`;
        this.containerDiv.style.top = `${Math.round(point.y)}px`;
      }
      const zoom = this.getMap()?.getZoom() ?? 14;
      const scale = getZoomScale(zoom);
      this.containerDiv.style.transform = `translate(-50%, -100%) scale(${scale.toFixed(3)})`;
      this.containerDiv.style.transformOrigin = 'bottom center';
    }

    onRemove() {
      if (this.cleanupScene) {
        this.cleanupScene();
      }
      if (this.containerDiv.parentNode) {
        this.containerDiv.parentNode.removeChild(this.containerDiv);
      }
    }
  }

  return new ThreeStoreOverlay();
}

// Custom 3D Holographic Chat Room Google Maps Overlay Factory
function createThreeChatRoomOverlay(
  id: string,
  position: google.maps.LatLng,
  roomName: string,
  icon: string,
  onClick: () => void
): google.maps.OverlayView {
  class ThreeChatRoomOverlay extends google.maps.OverlayView {
    private position: google.maps.LatLng;
    private containerDiv: HTMLElement;
    private cleanupScene?: () => void;

    constructor() {
      super();
      this.position = position;

      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.transform = 'translate(-50%, -100%)';
      div.style.cursor = 'pointer';
      div.style.zIndex = '999';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';
      div.style.userSelect = 'none';

      // Badge above chat room
      const badge = document.createElement('div');
      badge.style.padding = '3px 8px';
      badge.style.fontSize = '10px';
      badge.style.fontFamily = "'Chakra Petch', sans-serif";
      badge.style.fontWeight = 'bold';
      badge.style.color = '#ffffff';
      badge.style.background = 'rgba(11, 3, 26, 0.95)';
      badge.style.border = '1.5px solid #00f0ff';
      badge.style.borderRadius = '6px';
      badge.style.boxShadow = '0 0 18px rgba(0, 240, 255, 0.75)';
      badge.style.whiteSpace = 'nowrap';
      badge.style.marginBottom = '2px';
      badge.innerHTML = `
        <div style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:12px;">${icon || '🎮'}</span>
          <span style="font-weight:900;text-transform:uppercase;">${roomName}</span>
          <span style="background:#00f0ff;color:#000;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:900;">LIVE CHAT</span>
        </div>
      `;
      div.appendChild(badge);

      const width = 120;
      const height = 104;

      const canvasWrap = document.createElement('div');
      canvasWrap.style.position = 'relative';
      canvasWrap.style.width = `${width}px`;
      canvasWrap.style.height = `${height}px`;

      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvasWrap.appendChild(canvas);

      // Glowing Neon Ground Ring
      const groundRing = document.createElement('div');
      groundRing.style.position = 'absolute';
      groundRing.style.bottom = '-4px';
      groundRing.style.left = '50%';
      groundRing.style.transform = 'translateX(-50%)';
      groundRing.style.width = '74px';
      groundRing.style.height = '18px';
      groundRing.style.borderRadius = '50%';
      groundRing.style.border = '2px solid #00f0ff';
      groundRing.style.background = 'rgba(0, 240, 255, 0.25)';
      groundRing.style.boxShadow = '0 0 18px #00f0ff';
      groundRing.style.pointerEvents = 'none';
      canvasWrap.appendChild(groundRing);

      div.appendChild(canvasWrap);

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });

      this.containerDiv = div;

      const { dispose } = setupGameRoomCafeScene(canvas, width, height, roomName);
      this.cleanupScene = dispose;
    }

    onAdd() {
      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(this.containerDiv);
    }

    draw() {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (point) {
        this.containerDiv.style.left = `${Math.round(point.x)}px`;
        this.containerDiv.style.top = `${Math.round(point.y)}px`;
      }
      const zoom = this.getMap()?.getZoom() ?? 14;
      const scale = getZoomScale(zoom);
      this.containerDiv.style.transform = `translate(-50%, -100%) scale(${scale.toFixed(3)})`;
      this.containerDiv.style.transformOrigin = 'bottom center';
    }

    onRemove() {
      if (this.cleanupScene) {
        this.cleanupScene();
      }
      if (this.containerDiv.parentNode) {
        this.containerDiv.parentNode.removeChild(this.containerDiv);
      }
    }
  }

  return new ThreeChatRoomOverlay();
}

// Custom Three.js 3D Blocky Character Google Maps Overlay Factory
function createThreeCharacterOverlay(
  id: string,
  position: google.maps.LatLng,
  userGamerTag: string,
  isLive: boolean,
  onClick: () => void,
  characterAvatar: CharacterAvatarType = 'waving',
  speechText: string = '',
  photoUrl?: string,
  accentColor: string = '#a3e635',
  isFixed: boolean = false
): google.maps.OverlayView {
  class ThreeCharacterOverlay extends google.maps.OverlayView {
    public id: string = id;
    public isDestroyed: boolean = false;
    private position: google.maps.LatLng;
    private containerDiv: HTMLElement;
    private cleanupScene?: () => void;

    constructor() {
      super();
      this.position = position;

      const div = document.createElement('div');
      div.id = `overlay-${id}`;
      div.setAttribute('data-overlay-id', id);
      div.style.position = 'absolute';
      div.style.transform = 'translate(-50%, -100%)';
      div.style.cursor = 'pointer';
      div.style.zIndex = '999';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';
      div.style.userSelect = 'none';

      // Label badge above head
      const badge = document.createElement('div');
      badge.style.padding = '2px 8px';
      badge.style.fontSize = '10px';
      badge.style.fontFamily = "'Chakra Petch', sans-serif";
      badge.style.fontWeight = 'bold';
      badge.style.letterSpacing = '0.05em';
      badge.style.color = '#f8fafc';
      badge.style.background = 'rgba(4, 18, 7, 0.92)';
      badge.style.border = `1.5px solid ${accentColor}`;
      badge.style.borderRadius = '4px';
      badge.style.boxShadow = `0 0 10px ${accentColor}80`;
      badge.style.whiteSpace = 'nowrap';
      badge.style.marginBottom = '2px';
      badge.innerHTML = `
        <div style="display:flex;align-items:center;gap:4px;">
          ${
            photoUrl
              ? `<img src="${photoUrl}" style="width:14px;height:14px;border-radius:50%;object-fit:cover;border:1px solid ${accentColor};" />`
              : `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${
                  isLive ? accentColor : '#94a3b8'
                };"></span>`
          }
          <span>${userGamerTag}</span>
        </div>
      `;

      div.appendChild(badge);

      // Character Map Pin Dimensions: 120px height
      const width = 92;
      const height = 120;

      // Canvas container - sized for selected character variant
      const canvasWrap = document.createElement('div');
      canvasWrap.style.position = 'relative';
      canvasWrap.style.width = `${width}px`;
      canvasWrap.style.height = `${height}px`;
      canvasWrap.style.filter = getCharacterAuraFilter(characterAvatar);
      canvasWrap.style.transition = 'filter 0.2s ease-in-out';

      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvasWrap.appendChild(canvas);

      // Character-specific pedestal glow ring under feet
      const ringColor =
        characterAvatar === 'freddy'
          ? '#ef4444'
          : characterAvatar === 'jason'
          ? '#f59e0b'
          : characterAvatar === 'ghostface'
          ? '#a5b4fc'
          : characterAvatar === 'michael_myers'
          ? '#60a5fa'
          : characterAvatar === 'pumpkin'
          ? '#f97316'
          : characterAvatar === 'girly_pumpkin'
          ? '#ec4899'
          : isLive
          ? '#a3e635'
          : '#22c55e';

      // Ground glow ring under character feet
      const groundRing = document.createElement('div');
      groundRing.style.position = 'absolute';
      groundRing.style.bottom = '-2px';
      groundRing.style.left = '50%';
      groundRing.style.transform = 'translateX(-50%)';
      groundRing.style.width = '44px';
      groundRing.style.height = '13px';
      groundRing.style.borderRadius = '50%';
      groundRing.style.border = `2px solid ${ringColor}`;
      groundRing.style.background = `${ringColor}40`;
      groundRing.style.boxShadow = `0 0 16px ${ringColor}, 0 0 28px ${ringColor}60`;
      groundRing.style.pointerEvents = 'none';
      canvasWrap.appendChild(groundRing);

      div.appendChild(canvasWrap);

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });

      this.containerDiv = div;

      // Initialize the selected 3D character scene (no speech balloons)
      const { dispose } =
        characterAvatar === 'moon_demon_noble'
          ? setupMoonDemonNobleScene(canvas, width, height, '')
          : characterAvatar === 'demon_dog_warrior'
          ? setupDemonDogWarriorScene(canvas, width, height, '')
          : characterAvatar === 'celestial_moon_guardian'
          ? setupCelestialMoonGuardianScene(canvas, width, height, '')
          : characterAvatar === 'sacred_shrine_priestess'
          ? setupSacredShrinePriestessScene(canvas, width, height, '')
          : characterAvatar === 'cyber_soccer_girl'
          ? setupCyberSoccerGirlScene(canvas, width, height, '')
          : characterAvatar === 'cyber_soccer_boy'
          ? setupCyberSoccerBoyScene(canvas, width, height, '')
          : characterAvatar === 'purple_anime_girl'
          ? setupPurpleAnimeGirlScene(canvas, width, height, '')
          : characterAvatar === 'mexican_traveler'
          ? setupMexicanTravelerScene(canvas, width, height, '')
          : characterAvatar === 'alien_girl'
          ? setupAlienGirlScene(canvas, width, height, '')
          : characterAvatar === 'alien_boy'
          ? setupAlienBoyScene(canvas, width, height, '')
          : characterAvatar === 'freddy'
          ? setupFreddyScene(canvas, width, height, '')
          : characterAvatar === 'jason'
          ? setupJasonScene(canvas, width, height, '')
          : characterAvatar === 'ghostface'
          ? setupGhostfaceScene(canvas, width, height, '')
          : characterAvatar === 'michael_myers'
          ? setupMichaelMyersScene(canvas, width, height, '')
          : characterAvatar === 'girly_pumpkin'
          ? setupGirlyPumpkinScene(canvas, width, height, '')
          : characterAvatar === 'pumpkin'
          ? setupPumpkinMonsterScene(canvas, width, height, '')
          : characterAvatar === 'waving'
          ? setupWavingCharacterScene(canvas, width, height, '')
          : setupClassicCharacterScene(canvas, width, height, '');

      this.cleanupScene = dispose;
    }

    onAdd() {
      if (this.isDestroyed) {
        if (this.containerDiv) this.containerDiv.remove();
        return;
      }
      const panes = this.getPanes();
      if (!panes?.overlayMouseTarget) return;

      // Forcibly clear any lingering duplicate overlay with this same ID
      const existing = panes.overlayMouseTarget.querySelector(`[data-overlay-id="${this.id}"]`);
      if (existing && existing !== this.containerDiv) {
        existing.remove();
      }

      this.containerDiv.setAttribute('data-overlay-id', this.id);
      this.containerDiv.id = `overlay-${this.id}`;
      panes.overlayMouseTarget.appendChild(this.containerDiv);
    }

    draw() {
      if (this.isDestroyed) return;
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (point) {
        this.containerDiv.style.left = `${Math.round(point.x)}px`;
        this.containerDiv.style.top = `${Math.round(point.y)}px`;
      }
      const zoom = this.getMap()?.getZoom() ?? 14;
      const scale = getZoomScale(zoom);
      this.containerDiv.style.transform = `translate(-50%, -100%) scale(${scale.toFixed(3)})`;
      this.containerDiv.style.transformOrigin = 'bottom center';
    }

    onRemove() {
      if (this.cleanupScene) {
        try {
          this.cleanupScene();
        } catch {}
        this.cleanupScene = undefined;
      }
      if (this.containerDiv) {
        this.containerDiv.remove();
      }
    }

    destroy() {
      this.isDestroyed = true;
      if (this.cleanupScene) {
        try {
          this.cleanupScene();
        } catch {}
        this.cleanupScene = undefined;
      }
      if (this.containerDiv) {
        this.containerDiv.remove();
      }
      try {
        this.setMap(null);
      } catch {}
    }
  }

  return new ThreeCharacterOverlay();
}

// Maximum concurrent active WebGL 3D scenes to prevent browser context exhaustion
const MAX_CONCURRENT_3D_AIRSHIPS = 6;
let active3DAirshipCount = 0;

// Custom 3D Voxel Airship Google Maps Overlay Factory for Global Cities Network
function createThreeAirshipOverlay(
  city: GlobalAirshipCity,
  billboardData: AirshipBillboardData | null,
  onClick: () => void
): {
  city: GlobalAirshipCity;
  overlay: google.maps.OverlayView;
  updateBillboard: (data: AirshipBillboardData | null) => void;
} {
  class ThreeAirshipOverlay extends google.maps.OverlayView {
    public city: GlobalAirshipCity;
    public position: google.maps.LatLng;
    private containerDiv: HTMLElement;
    private canvasWrap: HTMLElement;
    private canvas?: HTMLCanvasElement;
    private spriteWrap?: HTMLElement;
    private cleanupScene?: () => void;
    private controller?: AirshipSceneController;
    private currentBillboardData: AirshipBillboardData | null;
    private is3DActive: boolean = false;

    constructor() {
      super();
      this.city = city;
      this.position = new google.maps.LatLng(city.lat, city.lng);
      this.currentBillboardData = billboardData;

      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.transform = 'translate(-50%, -100%)';
      div.style.cursor = 'pointer';
      div.style.zIndex = '1200'; // Floating altitude above ground character pins
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';
      div.style.userSelect = 'none';
      const isPokemon = city.craftType === 'pokemon_balloon';
      const isDragon = city.craftType === 'portal_dragon';
      div.title = isDragon
        ? `Dimensional Portal Dragon hovering between North Pacific Ocean & USA - Click to view & promote`
        : isPokemon
        ? `Pokemon Air Balloon hovering above middle of ${city.name} (${city.country === 'United States' ? 'USA' : city.country}) - Click to view`
        : `Airship hovering above middle of ${city.name} (${city.country === 'United States' ? 'USA' : city.country}) - Click to view`;

      // Airship canvas wrapper
      const width = 170;
      const height = 125;

      const canvasWrap = document.createElement('div');
      canvasWrap.style.position = 'relative';
      canvasWrap.style.width = `${width}px`;
      canvasWrap.style.height = `${height}px`;

      // 2D Animated Voxel Craft Fallback (uses zero WebGL contexts, buttery 60 FPS)
      const spriteWrap = document.createElement('div');
      spriteWrap.style.position = 'absolute';
      spriteWrap.style.inset = '0';
      spriteWrap.style.display = 'flex';
      spriteWrap.style.flexDirection = 'column';
      spriteWrap.style.alignItems = 'center';
      spriteWrap.style.justifyContent = 'center';
      spriteWrap.style.filter = isDragon
        ? 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.95)) drop-shadow(0 0 10px rgba(6, 182, 212, 0.85))'
        : isPokemon
        ? 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.95)) drop-shadow(0 6px 14px rgba(0,0,0,0.75))'
        : 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.9)) drop-shadow(0 6px 14px rgba(0,0,0,0.75))';

      if (isDragon) {
        spriteWrap.innerHTML = `
          <div style="position:relative;width:150px;height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <!-- Swirling Liquid Dimensional Portal Ring (Background) -->
            <div style="position:absolute;top:0px;left:50%;transform:translateX(-50%);width:116px;height:72px;border-radius:50%;background:radial-gradient(ellipse, #a855f7 0%, #6b21a8 40%, #3b0764 75%, #030712 100%);border:3px solid #06b6d4;box-shadow:0 0 20px #a855f7, inset 0 0 15px #06b6d4;z-index:1;display:flex;align-items:center;justify-content:center;">
              <!-- Swirl node core -->
              <div style="width:50px;height:30px;border-radius:50%;background:radial-gradient(ellipse, #c084fc 10%, #3b0764 80%);box-shadow:0 0 12px #c084fc;"></div>
            </div>

            <!-- Dragon Head & Horns Emerging from Portal -->
            <div style="position:relative;width:96px;height:52px;z-index:3;margin-top:4px;display:flex;flex-direction:column;align-items:center;">
              <!-- Golden Dragon Horns -->
              <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:72px;display:flex;justify-content:space-between;">
                <div style="width:14px;height:18px;background:linear-gradient(135deg, #f59e0b, #b45309);clip-path:polygon(100% 0, 0 100%, 100% 100%);transform:rotate(-15deg);box-shadow:0 0 6px #f59e0b;"></div>
                <div style="width:14px;height:18px;background:linear-gradient(225deg, #f59e0b, #b45309);clip-path:polygon(0 0, 0 100%, 100% 100%);transform:rotate(15deg);box-shadow:0 0 6px #f59e0b;"></div>
              </div>

              <!-- Dragon Snout & Head Box -->
              <div style="position:relative;width:66px;height:38px;background:linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%);border-radius:8px 8px 4px 4px;border:2px solid #06b6d4;box-shadow:0 0 14px rgba(6,182,212,0.8);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:3px 4px;">
                <!-- Glowing Cyan Brow Spikes -->
                <div style="width:100%;display:flex;justify-content:space-between;padding:0 2px;">
                  <span style="width:8px;height:4px;background:#06b6d4;border-radius:2px;box-shadow:0 0 6px #06b6d4;"></span>
                  <span style="width:12px;height:4px;background:#c084fc;border-radius:2px;box-shadow:0 0 6px #c084fc;"></span>
                  <span style="width:8px;height:4px;background:#06b6d4;border-radius:2px;box-shadow:0 0 6px #06b6d4;"></span>
                </div>

                <!-- Piercing Reptilian Eyes (Green/Gold with Slit) -->
                <div style="width:100%;display:flex;justify-content:space-around;align-items:center;">
                  <div style="width:10px;height:7px;background:#84cc16;border-radius:2px;border:1px solid #14532d;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px #84cc16;">
                    <span style="width:2px;height:5px;background:#020617;border-radius:1px;"></span>
                  </div>
                  <div style="width:10px;height:7px;background:#84cc16;border-radius:2px;border:1px solid #14532d;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px #84cc16;">
                    <span style="width:2px;height:5px;background:#020617;border-radius:1px;"></span>
                  </div>
                </div>

                <!-- Dragon Jaw Fangs with Fire Breath Emerging from Mouth -->
                <div style="width:80%;display:flex;justify-content:space-between;position:relative;">
                  <span style="width:3px;height:5px;background:#ffffff;clip-path:polygon(50% 100%, 0 0, 100% 0);"></span>
                  <span style="width:3px;height:5px;background:#ffffff;clip-path:polygon(50% 100%, 0 0, 100% 0);"></span>
                  <span style="width:3px;height:5px;background:#ffffff;clip-path:polygon(50% 100%, 0 0, 100% 0);"></span>
                  <span style="width:3px;height:5px;background:#ffffff;clip-path:polygon(50% 100%, 0 0, 100% 0);"></span>
                  <!-- Roaring Dragon Flame coming straight out of mouth -->
                  <div style="position:absolute;top:3px;left:50%;transform:translateX(-50%);width:36px;height:12px;background:radial-gradient(ellipse at top, #ffffff 0%, #ffe600 35%, #ff5500 70%, transparent 100%);border-radius:0 0 16px 16px;box-shadow:0 0 12px #ff4400, 0 0 20px #ffaa00;z-index:5;pointer-events:none;"></div>
                </div>
              </div>
            </div>

            <!-- Enlarged Giant Billboard Screen Gripped Under Dragon -->
            <div class="airship-billboard-screen" style="position:relative;width:120px;height:56px;background:#030d1a;border:3px solid #06b6d4;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(6,182,212,0.9), inset 0 0 8px rgba(168,85,247,0.5);z-index:4;margin-top:2px;">
              ${
                this.currentBillboardData?.imageUrl
                  ? `<div style="position:relative;width:100%;height:100%;">
                      <img src="${this.currentBillboardData.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
                      ${this.currentBillboardData.businessName ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.85);color:#06b6d4;font-size:7px;font-weight:900;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:1px 2px;border-top:1px solid #06b6d4;">${this.currentBillboardData.businessName}</div>` : ''}
                    </div>`
                  : `<div style="display:flex;align-items:center;gap:2px;height:100%;padding:4px 0;">
                      <span style="width:3px;height:70%;background:#06b6d4;border-radius:1px;"></span>
                      <span style="width:3px;height:90%;background:#c084fc;border-radius:1px;"></span>
                      <span style="width:3px;height:60%;background:#38bdf8;border-radius:1px;"></span>
                      <span style="width:3px;height:100%;background:#a855f7;border-radius:1px;"></span>
                      <span style="width:3px;height:75%;background:#facc15;border-radius:1px;"></span>
                      <span style="width:3px;height:85%;background:#c084fc;border-radius:1px;"></span>
                      <span style="width:3px;height:65%;background:#06b6d4;border-radius:1px;"></span>
                      <span style="width:3px;height:95%;background:#a855f7;border-radius:1px;"></span>
                    </div>`
              }
            </div>
          </div>
        `;
      } else if (isPokemon) {
        spriteWrap.innerHTML = `
          <div style="position:relative;width:140px;height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <!-- Fluffy White Cloud Crest (Head) -->
            <div style="position:absolute;top:2px;left:50%;transform:translateX(-50%);width:46px;height:16px;background:#f8fafc;border-radius:10px;border:2px solid #cbd5e1;box-shadow:0 0 8px rgba(255,255,255,0.7);z-index:4;"></div>

            <!-- Left Flapping Wing -->
            <div style="position:absolute;top:24px;left:4px;width:24px;height:16px;background:linear-gradient(135deg, #9333ea, #c084fc);border-radius:12px 2px 12px 2px;border:1.5px solid #581c87;transform:rotate(-15deg);box-shadow:0 0 6px rgba(147,51,234,0.6);z-index:1;"></div>

            <!-- Right Flapping Wing -->
            <div style="position:absolute;top:24px;right:4px;width:24px;height:16px;background:linear-gradient(225deg, #9333ea, #c084fc);border-radius:2px 12px 2px 12px;border:1.5px solid #581c87;transform:rotate(15deg);box-shadow:0 0 6px rgba(147,51,234,0.6);z-index:1;"></div>

            <!-- Pokemon Block Airballoon Body (Purple Drifblim Style) -->
            <div style="position:relative;width:86px;height:78px;border-radius:40px;border:3px solid #3b0764;overflow:hidden;box-shadow:inset 0 4px 10px rgba(255,255,255,0.3), 0 0 16px rgba(168,85,247,0.8);background:linear-gradient(180deg, #9333ea 0%, #7e22ce 55%, #581c87 100%);z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;">
              <!-- Yellow Cross Face / Mouth -->
              <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);width:18px;height:18px;z-index:4;">
                <div style="position:absolute;top:7px;left:0;right:0;height:4px;background:#facc15;border-radius:1px;box-shadow:0 0 4px #facc15;"></div>
                <div style="position:absolute;left:7px;top:0;bottom:0;width:4px;background:#facc15;border-radius:1px;box-shadow:0 0 4px #facc15;"></div>
              </div>

              <!-- Glowing Ruby Eyes -->
              <div style="position:absolute;bottom:18px;left:16px;width:7px;height:7px;border-radius:2px;background:#ef4444;box-shadow:0 0 6px #ef4444;z-index:4;"></div>
              <div style="position:absolute;bottom:18px;right:16px;width:7px;height:7px;border-radius:2px;background:#ef4444;box-shadow:0 0 6px #ef4444;z-index:4;"></div>
            </div>

            <!-- Suspension Cables to Single Billboard -->
            <div style="width:58px;height:8px;display:flex;justify-content:space-between;padding:0 4px;z-index:2;">
              <span style="width:2px;height:100%;background:#facc15;"></span>
              <span style="width:2px;height:100%;background:#facc15;"></span>
            </div>

            <!-- ONE BILLBOARD ONLY (Replacing Basket Directly Under Creature) -->
            <div class="airship-billboard-screen" style="position:relative;width:82px;height:42px;background:#030d1a;border:2.5px solid #facc15;border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(250,204,21,0.85);z-index:3;">
              ${
                this.currentBillboardData?.imageUrl
                  ? `<div style="position:relative;width:100%;height:100%;">
                      <img src="${this.currentBillboardData.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
                      ${this.currentBillboardData.businessName ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.85);color:#facc15;font-size:7px;font-weight:900;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:1px 2px;border-top:1px solid #facc15;">${this.currentBillboardData.businessName}</div>` : ''}
                    </div>`
                  : `<div style="display:flex;align-items:center;gap:2px;height:100%;padding:4px 0;">
                      <span style="width:3px;height:70%;background:#a855f7;border-radius:1px;"></span>
                      <span style="width:3px;height:90%;background:#f8fafc;border-radius:1px;"></span>
                      <span style="width:3px;height:60%;background:#38bdf8;border-radius:1px;"></span>
                      <span style="width:3px;height:100%;background:#a855f7;border-radius:1px;"></span>
                      <span style="width:3px;height:75%;background:#facc15;border-radius:1px;"></span>
                      <span style="width:3px;height:85%;background:#f8fafc;border-radius:1px;"></span>
                      <span style="width:3px;height:65%;background:#38bdf8;border-radius:1px;"></span>
                      <span style="width:3px;height:95%;background:#a855f7;border-radius:1px;"></span>
                    </div>`
              }
            </div>

            <!-- 4 Waving Tentacles with Yellow Cloud Tips (Dangling Behind & Below) -->
            <div style="width:84px;height:16px;display:flex;justify-content:space-between;padding:0 4px;margin-top:-3px;z-index:1;">
              <div style="flex-direction:column;align-items:center;display:flex;">
                <span style="width:3px;height:8px;background:#3b0764;"></span>
                <span style="width:7px;height:7px;background:#facc15;border-radius:50%;border:1px solid #78350f;box-shadow:0 0 4px #facc15;"></span>
              </div>
              <div style="flex-direction:column;align-items:center;display:flex;">
                <span style="width:3px;height:11px;background:#3b0764;"></span>
                <span style="width:7px;height:7px;background:#facc15;border-radius:50%;border:1px solid #78350f;box-shadow:0 0 4px #facc15;"></span>
              </div>
              <div style="flex-direction:column;align-items:center;display:flex;">
                <span style="width:3px;height:11px;background:#3b0764;"></span>
                <span style="width:7px;height:7px;background:#facc15;border-radius:50%;border:1px solid #78350f;box-shadow:0 0 4px #facc15;"></span>
              </div>
              <div style="flex-direction:column;align-items:center;display:flex;">
                <span style="width:3px;height:8px;background:#3b0764;"></span>
                <span style="width:7px;height:7px;background:#facc15;border-radius:50%;border:1px solid #78350f;box-shadow:0 0 4px #facc15;"></span>
              </div>
            </div>
          </div>
        `;
      } else {
        spriteWrap.innerHTML = `
          <div style="position:relative;width:150px;height:78px;display:flex;align-items:center;justify-content:center;">
            <!-- Zeppelin Balloon Body -->
            <div style="position:absolute;width:142px;height:62px;background:linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #1e293b 85%);border-radius:70px 70px 70px 70px / 32px 32px 32px 32px;border:3px solid #38bdf8;box-shadow:inset 0 4px 8px rgba(255,255,255,0.4), 0 0 14px rgba(56,189,248,0.7);overflow:hidden;">
              <!-- Red Racing Stripe -->
              <div style="position:absolute;top:24px;left:0;right:0;height:12px;background:#e11d48;border-top:1.5px solid #facc15;border-bottom:1.5px solid #facc15;"></div>
              <!-- Dual Billboard Screen Area -->
              <div class="airship-billboard-screen" style="position:absolute;top:10px;left:32px;width:78px;height:42px;background:#030d1a;border:2px solid #facc15;border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(250,204,21,0.8);">
                ${
                  this.currentBillboardData?.imageUrl
                    ? `<div style="position:relative;width:100%;height:100%;">
                        <img src="${this.currentBillboardData.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
                        ${this.currentBillboardData.businessName ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.85);color:#facc15;font-size:7px;font-weight:900;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:1px 2px;border-top:1px solid #facc15;">${this.currentBillboardData.businessName}</div>` : ''}
                      </div>`
                    : `<div style="display:flex;align-items:center;gap:2px;height:100%;padding:4px 0;">
                        <span style="width:3px;height:70%;background:#38bdf8;border-radius:1px;"></span>
                        <span style="width:3px;height:90%;background:#f43f5e;border-radius:1px;"></span>
                        <span style="width:3px;height:60%;background:#facc15;border-radius:1px;"></span>
                        <span style="width:3px;height:100%;background:#38bdf8;border-radius:1px;"></span>
                        <span style="width:3px;height:75%;background:#f43f5e;border-radius:1px;"></span>
                        <span style="width:3px;height:85%;background:#facc15;border-radius:1px;"></span>
                        <span style="width:3px;height:65%;background:#38bdf8;border-radius:1px;"></span>
                        <span style="width:3px;height:95%;background:#f43f5e;border-radius:1px;"></span>
                      </div>`
                }
              </div>
            </div>
            <!-- Tail Fins -->
            <div style="position:absolute;left:-4px;top:12px;width:14px;height:18px;background:#e11d48;border:2px solid #facc15;border-radius:4px 0 0 4px;"></div>
            <div style="position:absolute;left:-4px;bottom:12px;width:14px;height:18px;background:#e11d48;border:2px solid #facc15;border-radius:4px 0 0 4px;"></div>
            <!-- Cockpit Gondola -->
            <div style="position:absolute;bottom:0px;left:50px;width:50px;height:14px;background:#0f172a;border:2px solid #38bdf8;border-radius:0 0 8px 8px;display:flex;align-items:center;justify-content:space-around;padding:0 4px;">
              <span style="width:7px;height:5px;background:#38bdf8;border-radius:1px;box-shadow:0 0 6px #38bdf8;"></span>
              <span style="width:7px;height:5px;background:#38bdf8;border-radius:1px;box-shadow:0 0 6px #38bdf8;"></span>
              <span style="width:7px;height:5px;background:#38bdf8;border-radius:1px;box-shadow:0 0 6px #38bdf8;"></span>
            </div>
          </div>
        `;
      }
      canvasWrap.appendChild(spriteWrap);
      this.spriteWrap = spriteWrap;

      // Aerial shadow disk projected on the ground
      const groundShadow = document.createElement('div');
      groundShadow.style.position = 'absolute';
      groundShadow.style.bottom = '-8px';
      groundShadow.style.left = '50%';
      groundShadow.style.transform = 'translateX(-50%)';
      groundShadow.style.width = '80px';
      groundShadow.style.height = '20px';
      groundShadow.style.borderRadius = '50%';
      groundShadow.style.background = isDragon
        ? 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, rgba(168,85,247,0.35) 50%, rgba(0,0,0,0) 80%)'
        : 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, rgba(56,189,248,0.25) 50%, rgba(0,0,0,0) 80%)';
      groundShadow.style.boxShadow = isDragon
        ? '0 0 20px rgba(168,85,247,0.6)'
        : '0 0 18px rgba(56,189,248,0.5)';
      groundShadow.style.pointerEvents = 'none';
      canvasWrap.appendChild(groundShadow);

      div.appendChild(canvasWrap);

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });

      this.containerDiv = div;
      this.canvasWrap = canvasWrap;
    }

    private enable3D() {
      if (this.canvas) return;
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.filter = city.craftType === 'portal_dragon'
        ? 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.95)) drop-shadow(0 0 10px rgba(6, 182, 212, 0.85))'
        : city.craftType === 'pokemon_balloon'
        ? 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.95)) drop-shadow(0 6px 14px rgba(0,0,0,0.75))'
        : 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.9)) drop-shadow(0 6px 14px rgba(0,0,0,0.75))';
      this.canvasWrap.appendChild(canvas);
      this.canvas = canvas;

      if (this.spriteWrap) {
        this.spriteWrap.style.display = 'none';
      }

      const controller = setupAirshipScene(
        canvas,
        170,
        125,
        this.currentBillboardData?.imageUrl || null,
        onClick,
        {
          modelScale: 0.74,
          autoRotate: true,
          craftType: city.craftType || 'airship',
          businessName: this.currentBillboardData?.businessName || null,
          businessLink: this.currentBillboardData?.businessLink || null,
        }
      );
      this.controller = controller;
      this.cleanupScene = controller.dispose;
    }

    private disable3D() {
      if (this.cleanupScene) {
        this.cleanupScene();
        this.cleanupScene = undefined;
      }
      this.controller = undefined;
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
      this.canvas = undefined;
      if (this.spriteWrap) {
        this.spriteWrap.style.display = 'flex';
      }
    }

    updateBillboard(data: AirshipBillboardData | null) {
      this.currentBillboardData = data;
      if (this.controller) {
        this.controller.updateBillboardImage(
          data?.imageUrl || null,
          data?.businessName || null,
          data?.businessLink || null
        );
      }
      if (this.spriteWrap) {
        const screen = this.spriteWrap.querySelector('.airship-billboard-screen');
        if (screen) {
          if (data?.imageUrl) {
            screen.innerHTML = `
              <div style="position:relative;width:100%;height:100%;">
                <img src="${data.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
                ${
                  data.businessName
                    ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.85);color:#facc15;font-size:7px;font-weight:900;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:1px 2px;border-top:1px solid #facc15;">${data.businessName}</div>`
                    : ''
                }
              </div>
            `;
          } else {
            screen.innerHTML = `
              <div style="display:flex;align-items:center;gap:2px;height:100%;padding:4px 0;">
                <span style="width:3px;height:70%;background:#38bdf8;border-radius:1px;"></span>
                <span style="width:3px;height:90%;background:#f43f5e;border-radius:1px;"></span>
                <span style="width:3px;height:60%;background:#facc15;border-radius:1px;"></span>
                <span style="width:3px;height:100%;background:#38bdf8;border-radius:1px;"></span>
                <span style="width:3px;height:75%;background:#f43f5e;border-radius:1px;"></span>
                <span style="width:3px;height:85%;background:#facc15;border-radius:1px;"></span>
                <span style="width:3px;height:65%;background:#38bdf8;border-radius:1px;"></span>
                <span style="width:3px;height:95%;background:#f43f5e;border-radius:1px;"></span>
              </div>
            `;
          }
        }
      }
    }

    onAdd() {
      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(this.containerDiv);
    }

    draw() {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (point) {
        this.containerDiv.style.left = `${Math.round(point.x)}px`;
        this.containerDiv.style.top = `${Math.round(point.y)}px`;
      }
      const zoom = this.getMap()?.getZoom() ?? 14;
      const scale = getZoomScale(zoom);
      this.containerDiv.style.transform = `translate(-50%, -100%) scale(${scale.toFixed(3)})`;
      this.containerDiv.style.transformOrigin = 'bottom center';

      // Smart LOD: Activate Three.js 3D when in viewport and zoomed in enough
      const mapObj = this.getMap();
      const bounds = mapObj && 'getBounds' in mapObj ? (mapObj as google.maps.Map).getBounds() : null;
      const inViewport = bounds ? bounds.contains(this.position) : true;
      if (inViewport && zoom >= 7) {
        if (!this.is3DActive && active3DAirshipCount < MAX_CONCURRENT_3D_AIRSHIPS) {
          this.is3DActive = true;
          active3DAirshipCount++;
          this.enable3D();
        }
      } else {
        if (this.is3DActive) {
          this.is3DActive = false;
          active3DAirshipCount = Math.max(0, active3DAirshipCount - 1);
          this.disable3D();
        }
      }
    }

    onRemove() {
      if (this.is3DActive) {
        this.is3DActive = false;
        active3DAirshipCount = Math.max(0, active3DAirshipCount - 1);
        this.disable3D();
      }
      if (this.containerDiv.parentNode) {
        this.containerDiv.parentNode.removeChild(this.containerDiv);
      }
    }
  }

  const overlayInstance = new ThreeAirshipOverlay();
  return {
    city,
    overlay: overlayInstance,
    updateBillboard: (url) => overlayInstance.updateBillboard(url),
  };
}

interface GoogleGamerMapProps {
  squads: SquadBeacon[];
  selectedSquad: SquadBeacon | null;
  onSelectSquad: (squad: SquadBeacon | null) => void;
  onSelectUserPin: () => void;
  userGamerTag: string;
  characterAvatar?: CharacterAvatarType;
  isUserPinVisible?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

// Tactical dark glowing map styling matching SquadUp aesthetic
const TACTICAL_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#030804' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#020603' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#86efac' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4ade80' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#22c55e' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#051b0a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#0c2e14' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#166534' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#86efac' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#14532d' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#22c55e' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#05180a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#010502' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#10b981' }],
  },
];

export function GoogleGamerMap({
  squads,
  selectedSquad,
  onSelectSquad,
  onSelectUserPin,
  userGamerTag,
  characterAvatar = 'waving',
  isUserPinVisible = true,
  onMapClick,
}: GoogleGamerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userOverlayRef = useRef<google.maps.OverlayView | null>(null);
  const squadOverlaysRef = useRef<google.maps.OverlayView[]>([]);
  const prevSquadsKeyRef = useRef<string>('');
  const userHasExploredMapRef = useRef<boolean>(false);
  const airshipOverlaysRef = useRef<Map<string, {
    city: GlobalAirshipCity;
    overlay: google.maps.OverlayView;
    updateBillboard: (data: AirshipBillboardData | null) => void;
  }>>(new Map());

  const { coords, isLive, requestLocation } = useLocation();
  const { user, gamerProfile } = useAuth();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAirshipModal, setShowAirshipModal] = useState<boolean>(false);
  const [selectedCraftType, setSelectedCraftType] = useState<AerialCraftType>('airship');
  const [selectedBillboardId, setSelectedBillboardId] = useState<string>('current');
  const [selectedBillboardName, setSelectedBillboardName] = useState<string>('Map Billboard');
  const [billboardsMap, setBillboardsMap] = useState<Map<string, AirshipBillboardData>>(new Map());
  const [openDrawerInitially, setOpenDrawerInitially] = useState<boolean>(false);
  const [activeBillboard, setActiveBillboard] = useState<AirshipBillboardData | null>(null);
  const [flightStatus, setFlightStatus] = useState<AirshipFlightStatus>(getAirshipFlightStatus());

  // Global user center coordinates (works worldwide)
  const effectiveCenter = {
    lat: gamerProfile?.coords?.lat ?? coords?.lat ?? 35.6762,
    lng: gamerProfile?.coords?.lng ?? coords?.lng ?? 139.6503,
  };

  const apiKey = GOOGLE_MAPS_API_KEY;

  // Initialize Google Maps instance using modern setOptions and importLibrary
  useEffect(() => {
    if (!mapContainerRef.current || !apiKey) return;

    try {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });

      Promise.all([importLibrary('maps'), importLibrary('marker')])
        .then(() => {
          if (!mapContainerRef.current) return;
          const map = new google.maps.Map(mapContainerRef.current, {
            center: effectiveCenter,
            zoom: 10,
            styles: TACTICAL_DARK_STYLE,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'greedy', // Ensures immediate, fluid panning on desktop & mobile
          });

          // Direct Map Tap / Pin Drop Listener
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng && onMapClick) {
              onMapClick(e.latLng.lat(), e.latLng.lng());
            }
          });

          // Track manual exploration so automated re-renders do not fight user panning
          map.addListener('dragstart', () => {
            userHasExploredMapRef.current = true;
          });

          mapInstanceRef.current = map;
          setMapLoaded(true);
          setLoadError(null);
        })
        .catch((err: unknown) => {
          console.warn('Google Maps loader notice:', err);
          setLoadError(
            'Google Maps API is activating or waiting for referrers. You can switch to the Tactical Radar Canvas anytime!'
          );
        });
    } catch (e: unknown) {
      console.warn('Google Maps setup error:', e);
    }
  }, [apiKey]);

  // Center when coords change
  useEffect(() => {
    if (mapInstanceRef.current && coords) {
      mapInstanceRef.current.setCenter({ lat: coords.lat, lng: coords.lng });
      mapInstanceRef.current.setZoom(14);
    }
  }, [coords]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (userOverlayRef.current) {
        userOverlayRef.current.setMap(null);
        userOverlayRef.current = null;
      }
      squadOverlaysRef.current.forEach((o) => o.setMap(null));
      squadOverlaysRef.current = [];

      airshipOverlaysRef.current.forEach((item) => {
        item.overlay.setMap(null);
      });
      airshipOverlaysRef.current.clear();
    };
  }, []);

  // Subscribe to live individual cloud billboard updates across all aerial crafts globally
  useEffect(() => {
    const unsub = subscribeAllBillboards((map) => {
      setBillboardsMap(map);
      // Update each individual airship/balloon overlay with its own individual billboard
      airshipOverlaysRef.current.forEach((item, cityId) => {
        const individualData = map.get(cityId) || map.get('current') || null;
        item.updateBillboard(individualData);
      });
      // Fallback for default active billboard
      setActiveBillboard(map.get(selectedBillboardId) || map.get('current') || null);
    });
    return unsub;
  }, [selectedBillboardId]);

  // Initialize Global Squadron Airship Network above every city worldwide on Google Maps
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || typeof google === 'undefined') return;

    if (airshipOverlaysRef.current.size === 0) {
      GLOBAL_AIRSHIP_CITIES.forEach((city) => {
        const initialBillboard = billboardsMap.get(city.id) || null;
        const airship = createThreeAirshipOverlay(
          city,
          initialBillboard,
          () => {
            playSketchClick();
            setSelectedBillboardId(city.id);
            setSelectedBillboardName(
              city.craftType === 'portal_dragon'
                ? `${city.name} (Dimensional Dragon Billboard)`
                : `${city.name} (${city.craftType === 'pokemon_balloon' ? 'Pokémon Air Balloon' : 'Airship'})`
            );
            setSelectedCraftType(city.craftType || 'airship');
            setShowAirshipModal(true);
          }
        );
        airship.overlay.setMap(mapInstanceRef.current);
        airshipOverlaysRef.current.set(city.id, airship);
      });
    }
  }, [mapLoaded, billboardsMap]);

  // Update Markers whenever map or squads or coords change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || typeof google === 'undefined') return;

    const activeUid = user?.uid || gamerProfile?.uid;
    const activeTag = (gamerProfile?.gamerTag || userGamerTag || '').trim().toLowerCase();

    // Helper to determine if a squad beacon is the current user's personal player pin
    const isCurrentUserBeacon = (sq: SquadBeacon) => {
      const isBuilding =
        sq.beaconType === 'store' ||
        sq.beaconType === 'other_event' ||
        sq.beaconType === 'chat_room' ||
        sq.buildingType === 'grand_event';
      if (isBuilding) return false;
      if (sq.id === '__user_pin__') return true;
      if (activeUid && (sq.ownerId === activeUid || sq.id === `user_${activeUid}`)) return true;
      if (activeTag && sq.name && sq.name.trim().toLowerCase() === activeTag) return true;
      return false;
    };

    // Filter out expired events automatically and exclude current user duplicate character pins
    // (The user's personal interactive pin is already rendered by userOverlay #1)
    const activeSquads = filterActiveEvents(squads).filter((sq) => !isCurrentUserBeacon(sq));

    const squadsKey = `${coords?.lat?.toFixed(4) || ''}_${coords?.lng?.toFixed(4) || ''}_${userGamerTag}_${characterAvatar}_${isLive}_${isUserPinVisible}_` +
      activeSquads.map((s) => `${s.id}-${s.lat}-${s.lng}-${s.buildingType || ''}-${s.name}-${s.characterAvatar || ''}`).sort().join(',');

    if (squadsKey === prevSquadsKeyRef.current && squadOverlaysRef.current.length > 0) {
      return;
    }
    const isSquadsSetChanged = squadsKey !== prevSquadsKeyRef.current;
    prevSquadsKeyRef.current = squadsKey;

    // Clear previous markers and overlays with explicit destroy()
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    squadOverlaysRef.current.forEach((o) => {
      if (typeof (o as any).destroy === 'function') {
        (o as any).destroy();
      } else {
        o.setMap(null);
      }
    });
    squadOverlaysRef.current = [];

    if (userOverlayRef.current) {
      if (typeof (userOverlayRef.current as any).destroy === 'function') {
        (userOverlayRef.current as any).destroy();
      } else {
        userOverlayRef.current.setMap(null);
      }
      userOverlayRef.current = null;
    }

    // Forcibly clear any lingering user pin DOM elements from the map container
    if (mapContainerRef.current) {
      mapContainerRef.current.querySelectorAll('[data-overlay-id="__user_pin__"]').forEach((el) => el.remove());
    }

    const bounds = new google.maps.LatLngBounds();
    if (user && gamerProfile && isLive && isUserPinVisible) {
      bounds.extend(new google.maps.LatLng(effectiveCenter.lat, effectiveCenter.lng));
    }

    // 1. Plant USER'S 3D BLOCKY CHARACTER PROFILE PIN (Only if user has an active profile, is live, and matches filter)
    if (user && gamerProfile && isLive && isUserPinVisible) {
      const userPos = new google.maps.LatLng(effectiveCenter.lat, effectiveCenter.lng);
      const userOverlay = createThreeCharacterOverlay(
        '__user_pin__',
        userPos,
        userGamerTag,
        isLive,
        () => {
          playSketchClick();
          onSelectUserPin();
        },
        characterAvatar,
        'LIVE!',
        undefined,
        '#a3e635',
        true
      );
      userOverlay.setMap(mapInstanceRef.current);
      userOverlayRef.current = userOverlay;
    }

    const validPositions: google.maps.LatLng[] = [];

    // Pre-calculate coordinate clusters to disperse duplicate locations geographically
    const clusterCounts = new Map<string, number>();
    activeSquads.forEach((sq) => {
      const rawLat = typeof sq.lat === 'number' ? sq.lat : parseFloat(sq.lat as any);
      const rawLng = typeof sq.lng === 'number' ? sq.lng : parseFloat(sq.lng as any);
      const hasValidLatLng = !isNaN(rawLat) && !isNaN(rawLng) && (rawLat !== 0 || rawLng !== 0);
      const sqZipCoords = getZipCoordinatesSync(sq.zipCode);
      const lat = hasValidLatLng ? rawLat : sqZipCoords ? sqZipCoords.lat : effectiveCenter.lat;
      const lng = hasValidLatLng ? rawLng : sqZipCoords ? sqZipCoords.lng : effectiveCenter.lng;
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      clusterCounts.set(key, (clusterCounts.get(key) || 0) + 1);
    });
    const clusterIndices = new Map<string, number>();

    // 2. Plant SQUAD BEACON / BUILDING / STORE 3D OVERLAYS strictly anchored to their geographic coordinates
    activeSquads.forEach((sq, i) => {
      const rawLat = typeof sq.lat === 'number' ? sq.lat : parseFloat(sq.lat as any);
      const rawLng = typeof sq.lng === 'number' ? sq.lng : parseFloat(sq.lng as any);
      const hasValidLatLng = !isNaN(rawLat) && !isNaN(rawLng) && (rawLat !== 0 || rawLng !== 0);

      const sqZipCoords = getZipCoordinatesSync(sq.zipCode);

      const pos = hasValidLatLng
        ? { lat: rawLat, lng: rawLng }
        : sqZipCoords
        ? { lat: sqZipCoords.lat, lng: sqZipCoords.lng }
        : {
            lat: effectiveCenter.lat + 0.005 * ((i % 3) - 1),
            lng: effectiveCenter.lng + 0.005 * ((i % 3) - 1),
          };

      // Disperse markers sharing the exact same coordinate cluster
      let finalLat = pos.lat;
      let finalLng = pos.lng;
      const key = `${pos.lat.toFixed(4)},${pos.lng.toFixed(4)}`;
      const totalInCluster = clusterCounts.get(key) || 1;
      if (totalInCluster > 1) {
        const clusterIdx = clusterIndices.get(key) || 0;
        clusterIndices.set(key, clusterIdx + 1);
        const angle = (clusterIdx / totalInCluster) * 2 * Math.PI + 0.3;
        const radiusDeg = 0.0035; // ~380m
        finalLat += Math.sin(angle) * radiusDeg;
        finalLng += Math.cos(angle) * (radiusDeg / Math.cos((pos.lat * Math.PI) / 180));
      }

      const squadPos = new google.maps.LatLng(finalLat, finalLng);
      validPositions.push(squadPos);
      bounds.extend(squadPos);

      const color =
        sq.accentColor === 'amber' ? '#f59e0b' :
        sq.accentColor === 'lime' ? '#a3e635' : '#22c55e';

      if (sq.beaconType === 'other_event' || sq.buildingType === 'grand_event') {
        const remainingBadge = getEventRemainingBadge(sq.expiresAt);
        const eventOverlay = createThreeEventHallOverlay(
          sq.id,
          squadPos,
          sq.name,
          remainingBadge,
          () => {
            playSketchClick();
            onSelectSquad(sq);
          }
        );
        eventOverlay.setMap(mapInstanceRef.current);
        squadOverlaysRef.current.push(eventOverlay);
      } else if (sq.beaconType === 'store') {
        const actionBadge = sq.storeData?.actionTypes
          ? sq.storeData.actionTypes.map((a) => a.toUpperCase()).join('/')
          : 'STORE';
        const storeBType =
          sq.buildingType === 'boy_kiosk' || sq.buildingType === 'girly_kiosk' || sq.buildingType === 'girly_spooky' || sq.buildingType === 'spooky_shop' || sq.buildingType === 'arcade' || sq.buildingType === 'medium_store' || sq.buildingType === 'sketch_store' || sq.buildingType === 'cyber_tower'
            ? sq.buildingType
            : 'boutique';
        const storeOverlay = createThreeStoreOverlay(
          sq.id,
          squadPos,
          sq.name,
          storeBType,
          actionBadge,
          () => {
            playSketchClick();
            onSelectSquad(sq);
          }
        );
        storeOverlay.setMap(mapInstanceRef.current);
        squadOverlaysRef.current.push(storeOverlay);
      } else if (sq.beaconType === 'chat_room') {
        const icon = sq.chatRoomData?.icon || '💬';
        const chatOverlay = createThreeChatRoomOverlay(
          sq.id,
          squadPos,
          sq.name,
          icon,
          () => {
            playSketchClick();
            onSelectSquad(sq);
          }
        );
        chatOverlay.setMap(mapInstanceRef.current);
        squadOverlaysRef.current.push(chatOverlay);
      } else {
        const squadOverlay = createThreeCharacterOverlay(
          sq.id,
          squadPos,
          sq.name,
          true,
          () => {
            playSketchClick();
            onSelectSquad(sq);
          },
          sq.characterAvatar ||
            (i % 8 === 0
              ? 'pumpkin'
              : i % 8 === 1
              ? 'girly_pumpkin'
              : i % 8 === 2
              ? 'freddy'
              : i % 8 === 3
              ? 'jason'
              : i % 8 === 4
              ? 'ghostface'
              : i % 8 === 5
              ? 'michael_myers'
              : i % 8 === 6
              ? 'classic'
              : 'waving'),
          sq.beaconType === 'tournament'
            ? '🏆 TOURNEY'
            : sq.game
            ? (sq.game.toLowerCase().includes('call of duty')
                ? '🎮 CALL OF DUTY'
                : `🎮 ${sq.game.split(':')[0]}`)
            : '🎮 GAMER',
          sq.photoUrl,
          sq.beaconType === 'tournament' ? '#f59e0b' : color
        );
        squadOverlay.setMap(mapInstanceRef.current);
        squadOverlaysRef.current.push(squadOverlay);
      }
    });

    // Only auto-fit or center when the set of markers actually changes (e.g. user searched, toggled to Events, or created an event),
    // NEVER interrupting or overriding user manual dragging or exploring!
    if (isSquadsSetChanged && mapInstanceRef.current) {
      userHasExploredMapRef.current = false;

      if (validPositions.length === 1) {
        mapInstanceRef.current.setCenter(validPositions[0]);
        mapInstanceRef.current.setZoom(14);
      } else if (validPositions.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, 80);
      } else {
        mapInstanceRef.current.setCenter(effectiveCenter);
        mapInstanceRef.current.setZoom(11);
      }
    }
  }, [mapLoaded, squads, coords, isLive, userGamerTag, characterAvatar, user?.uid, gamerProfile?.uid, gamerProfile?.characterAvatar]);

  return (
    <div
      className="relative w-full h-[80vh] min-h-[650px] rounded bg-[#020503] border-2 border-green-500/60 overflow-hidden shadow-[0_0_35px_rgba(34,197,94,0.35)]"
      style={{
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
      }}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      <AirshipBillboardModal
        isOpen={showAirshipModal}
        onClose={() => setShowAirshipModal(false)}
        billboardId={selectedBillboardId}
        billboardName={selectedBillboardName}
        activeBillboard={billboardsMap.get(selectedBillboardId) || null}
        initialCraftType={selectedCraftType}
        initialOpenDrawer={openDrawerInitially}
        onBillboardUpdated={(data) => {
          setBillboardsMap((prev) => {
            const next = new Map(prev);
            if (data) next.set(selectedBillboardId, data);
            else next.delete(selectedBillboardId);
            return next;
          });
          const targetOverlay = airshipOverlaysRef.current.get(selectedBillboardId);
          if (targetOverlay) {
            targetOverlay.updateBillboard(data);
          }
        }}
      />

      {/* Floating Billboard Promotion Access Button */}
      <div className="absolute top-3.5 right-14 z-30 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            playSketchClick();
            setOpenDrawerInitially(true);
            setShowAirshipModal(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-[#030c17]/95 hover:bg-[#07192e] border-2 border-amber-400 text-amber-300 text-xs font-display font-black tracking-wide shadow-[0_0_20px_rgba(251,191,36,0.6)] backdrop-blur-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          title="Promote your business name, logo & links on billboards on the map, airship and air balloon"
        >
          <span className="text-amber-400">📢</span>
          <span className="truncate max-w-[200px]">
            {activeBillboard?.businessName ? `★ Sponsor: ${activeBillboard.businessName}` : 'Promote on Billboards (5 Days)'}
          </span>
        </button>
      </div>

      {loadError && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center text-xs font-sketch text-green-200">
          <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
          <p className="max-w-md mb-3">{loadError}</p>
          <p className="text-slate-400 text-[11px]">
            Make sure <strong>Maps JavaScript API</strong> is enabled in your Google Cloud Console.
          </p>
        </div>
      )}
    </div>
  );
}
