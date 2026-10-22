import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AirshipBillboardData, AerialCraftType } from '../utils/airshipFlight';

export interface AirshipSceneOptions {
  modelScale?: number;
  autoRotate?: boolean;
  interactiveOrbit?: boolean;
  enableZoom?: boolean;
  initialZoom?: number;
  onZoomChange?: (zoom: number) => void;
  craftType?: AerialCraftType;
  businessName?: string | null;
  businessLink?: string | null;
}

export interface AirshipSceneController {
  dispose: () => void;
  updateBillboardImage: (url: string | null, businessName?: string | null, businessLink?: string | null) => void;
  resize?: (w: number, h: number) => void;
  setZoom?: (zoom: number) => void;
  getZoom?: () => number;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
  setCraftType?: (craft: AerialCraftType) => void;
}

/**
 * Creates the procedural toon voxel airship scene from user specification.
 * Features dual-sided billboards with live neon animated equalizer or custom photo,
 * spinning engine propellers, glowing cabin/nose lights, and gentle flight dynamics.
 */
export function setupAirshipScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  initialImageUrl?: string | null,
  onClick?: () => void,
  options?: AirshipSceneOptions
): AirshipSceneController {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(22, 11, 24);
  camera.lookAt(0, 1.5, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.setClearColor(0x000000, 0);

  // 4-step cel-shading toon ramp
  const rampCanvas = document.createElement('canvas');
  rampCanvas.width = 4;
  rampCanvas.height = 1;
  const rampCtx = rampCanvas.getContext('2d');
  if (rampCtx) {
    rampCtx.fillStyle = '#64748b';
    rampCtx.fillRect(0, 0, 1, 1);
    rampCtx.fillStyle = '#94a3b8';
    rampCtx.fillRect(1, 0, 1, 1);
    rampCtx.fillStyle = '#e2e8f0';
    rampCtx.fillRect(2, 0, 1, 1);
    rampCtx.fillStyle = '#ffffff';
    rampCtx.fillRect(3, 0, 1, 1);
  }
  const toonGradient = new THREE.CanvasTexture(rampCanvas);
  toonGradient.minFilter = THREE.NearestFilter;
  toonGradient.magFilter = THREE.NearestFilter;

  // Billboard 2D canvas texture
  const billboardCanvas = document.createElement('canvas');
  billboardCanvas.width = 1024;
  billboardCanvas.height = 512;
  const billboardCtx = billboardCanvas.getContext('2d');

  const billboardTexture = new THREE.CanvasTexture(billboardCanvas);
  billboardTexture.wrapS = THREE.ClampToEdgeWrapping;
  billboardTexture.wrapT = THREE.ClampToEdgeWrapping;

  let currentImageUrl: string | null = initialImageUrl || null;
  let activeImageObj: HTMLImageElement | null = null;
  let activeBusinessName: string | null = options?.businessName || null;
  let activeBusinessLink: string | null = options?.businessLink || null;

  function loadCustomImage(url: string | null, businessName?: string | null, businessLink?: string | null) {
    currentImageUrl = url;
    if (businessName !== undefined) activeBusinessName = businessName;
    if (businessLink !== undefined) activeBusinessLink = businessLink;

    if (!url) {
      activeImageObj = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      activeImageObj = img;
      renderImageOnBillboard(img);
    };
    img.src = url;
  }

  function renderImageOnBillboard(img: HTMLImageElement) {
    if (!billboardCtx) return;
    const w = billboardCanvas.width;
    const h = billboardCanvas.height;

    billboardCtx.fillStyle = '#060e18';
    billboardCtx.fillRect(0, 0, w, h);

    const scale = Math.min(w / img.width, h / img.height);
    const nw = img.width * scale;
    const nh = img.height * scale;
    const nx = (w - nw) / 2;
    const ny = (h - nh) / 2;

    billboardCtx.drawImage(img, nx, ny, nw, nh);

    // Business Name & Link Sponsor Banner Overlay
    if (activeBusinessName) {
      const bannerH = 100;
      const bannerY = h - bannerH - 18;

      // Dark translucent backdrop
      billboardCtx.fillStyle = 'rgba(2, 6, 12, 0.88)';
      billboardCtx.fillRect(18, bannerY, w - 36, bannerH);

      // Gold neon divider line
      billboardCtx.strokeStyle = '#facc15';
      billboardCtx.lineWidth = 3;
      billboardCtx.beginPath();
      billboardCtx.moveTo(18, bannerY);
      billboardCtx.lineTo(w - 18, bannerY);
      billboardCtx.stroke();

      // Sponsor Tag Badge
      billboardCtx.fillStyle = '#facc15';
      billboardCtx.fillRect(36, bannerY + 16, 130, 26);
      billboardCtx.fillStyle = '#000000';
      billboardCtx.font = '900 13px sans-serif';
      billboardCtx.fillText('★ 5-DAY SPONSOR', 42, bannerY + 34);

      // Business Name Text
      billboardCtx.fillStyle = '#ffffff';
      billboardCtx.font = 'bold 30px sans-serif';
      const cleanBName = activeBusinessName.length > 30 ? activeBusinessName.slice(0, 28) + '...' : activeBusinessName;
      billboardCtx.fillText(cleanBName, 180, bannerY + 37);

      // Website / Social Link
      if (activeBusinessLink) {
        billboardCtx.fillStyle = '#38bdf8';
        billboardCtx.font = 'bold 18px monospace';
        const linkDisplay = activeBusinessLink.replace(/^https?:\/\//i, '');
        billboardCtx.fillText(`🌐 ${linkDisplay}`, 36, bannerY + 76);
      }
    }

    // Glowing border frame
    billboardCtx.strokeStyle = '#facc15';
    billboardCtx.lineWidth = 10;
    billboardCtx.strokeRect(5, 5, w - 10, h - 10);

    billboardCtx.strokeStyle = '#38bdf8';
    billboardCtx.lineWidth = 4;
    billboardCtx.strokeRect(14, 14, w - 28, h - 28);

    billboardTexture.needsUpdate = true;
  }

  function updateEqualizerAnimation(time: number) {
    if (activeImageObj) return;
    if (!billboardCtx) return;

    const w = billboardCanvas.width;
    const h = billboardCanvas.height;

    // Portal Dragon Spec: Animated Glowing Reptile Eye with Dark Purple Energy Runes
    if (currentCraftType === 'portal_dragon') {
      const cx = w / 2;
      const cy = h / 2;

      const bgGrad = billboardCtx.createRadialGradient(cx, cy, 20, cx, cy, w / 2);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(1, '#05020a');
      billboardCtx.fillStyle = bgGrad;
      billboardCtx.fillRect(0, 0, w, h);

      billboardCtx.strokeStyle = '#312e81';
      billboardCtx.lineWidth = 1.5;
      for (let x = 0; x < w; x += 32) {
        billboardCtx.beginPath();
        billboardCtx.moveTo(x, 0);
        billboardCtx.lineTo(x, h);
        billboardCtx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        billboardCtx.beginPath();
        billboardCtx.moveTo(0, y);
        billboardCtx.lineTo(w, y);
        billboardCtx.stroke();
      }

      billboardCtx.fillStyle = '#06b6d4';
      billboardCtx.beginPath();
      billboardCtx.ellipse(cx, cy, 200, 96, 0, 0, Math.PI * 2);
      billboardCtx.fill();

      billboardCtx.fillStyle = '#10b981';
      billboardCtx.beginPath();
      billboardCtx.ellipse(cx, cy, 168, 80, 0, 0, Math.PI * 2);
      billboardCtx.fill();

      billboardCtx.fillStyle = '#facc15';
      billboardCtx.beginPath();
      billboardCtx.ellipse(cx, cy, 104, 68, 0, 0, Math.PI * 2);
      billboardCtx.fill();

      const pupilW = 12 + Math.sin(time * 3) * 6;
      billboardCtx.fillStyle = '#030712';
      billboardCtx.beginPath();
      billboardCtx.ellipse(cx, cy, pupilW, 60, 0, 0, Math.PI * 2);
      billboardCtx.fill();

      billboardCtx.strokeStyle = '#06b6d4';
      billboardCtx.lineWidth = 14;
      billboardCtx.strokeRect(6, 6, w - 12, h - 12);

      billboardTexture.needsUpdate = true;
      return;
    }

    billboardCtx.fillStyle = '#090e1a';
    billboardCtx.fillRect(0, 0, w, h);

    // Animated cyber grid
    billboardCtx.strokeStyle = '#ec489930';
    billboardCtx.lineWidth = 2;
    const gridSize = 32;
    for (let x = 0; x < w; x += gridSize) {
      billboardCtx.beginPath();
      billboardCtx.moveTo(x, 0);
      billboardCtx.lineTo(x, h);
      billboardCtx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      billboardCtx.beginPath();
      billboardCtx.moveTo(0, y);
      billboardCtx.lineTo(w, y);
      billboardCtx.stroke();
    }

    // Audio equalizer bars
    const numBars = 18;
    const barWidth = 22;
    const gap = 12;
    const startX = (w - numBars * (barWidth + gap)) / 2;

    for (let i = 0; i < numBars; i++) {
      const barHeight = Math.sin(time * 5 + i * 0.55) * 75 + 85;
      const x = startX + i * (barWidth + gap);
      const y = h / 2 - barHeight / 2;

      const grad = billboardCtx.createLinearGradient(0, y + barHeight, 0, y);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(0.5, '#f43f5e');
      grad.addColorStop(1, '#facc15');

      billboardCtx.fillStyle = grad;
      billboardCtx.fillRect(x, y, barWidth, barHeight);

      // Peak glow cap
      billboardCtx.fillStyle = '#ffffff';
      billboardCtx.fillRect(x, y - 7, barWidth, 4);
    }

    // Luminous border frames
    billboardCtx.strokeStyle = '#facc15';
    billboardCtx.lineWidth = 10;
    billboardCtx.strokeRect(5, 5, w - 10, h - 10);

    billboardCtx.strokeStyle = '#38bdf8';
    billboardCtx.lineWidth = 4;
    billboardCtx.strokeRect(14, 14, w - 28, h - 28);

    billboardTexture.needsUpdate = true;
  }

  if (initialImageUrl) {
    loadCustomImage(initialImageUrl);
  }

  // ---------------- VOXEL CRAFT MODEL (AIRSHIP OR POKEMON AIR BALLOON) ----------------
  const rootAirshipGroup = new THREE.Group();
  const effectiveScale = options?.modelScale ?? 0.65;
  rootAirshipGroup.scale.set(effectiveScale, effectiveScale, effectiveScale);
  scene.add(rootAirshipGroup);

  const outlineMat = new THREE.LineBasicMaterial({ color: 0x0f172a });

  const materials = {
    hullWhite: new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGradient }),
    hullNavy: new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGradient }),
    hullRed: new THREE.MeshToonMaterial({ color: 0xe11d48, gradientMap: toonGradient }),
    balloonMain: new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGradient }),
    balloonStripe: new THREE.MeshToonMaterial({ color: 0xf43f5e, gradientMap: toonGradient }),
    goldTrim: new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGradient }),
    glowLight: new THREE.MeshToonMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
    }),
    windowGlass: new THREE.MeshToonMaterial({ color: 0x38bdf8, opacity: 0.85, transparent: true }),
    engineMetal: new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGradient }),
    bladeMetal: new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGradient }),
    billboardFrame: new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGradient }),
    billboardScreen: new THREE.MeshBasicMaterial({ map: billboardTexture }),
    // Pokémon Block Style Airballoon Materials (Drifblim / Creature Block Style)
    pokePurple: new THREE.MeshToonMaterial({ color: 0x7e22ce, gradientMap: toonGradient }),
    pokeDeepPurple: new THREE.MeshToonMaterial({ color: 0x581c87, gradientMap: toonGradient }),
    pokeLavender: new THREE.MeshToonMaterial({ color: 0xa855f7, gradientMap: toonGradient }),
    pokeCloudWhite: new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGradient }),
    pokeCloudSoft: new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGradient }),
    pokeYellowCross: new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGradient }),
    pokeEyesRed: new THREE.MeshToonMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.9,
    }),
    pokeTentacleRibbon: new THREE.MeshToonMaterial({ color: 0x3b0764, gradientMap: toonGradient }),
    pokeTentacleYellowTip: new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGradient }),
    pokeWingFlap: new THREE.MeshToonMaterial({ color: 0x9333ea, gradientMap: toonGradient }),
    basketWicker: new THREE.MeshToonMaterial({ color: 0x78350f, gradientMap: toonGradient }),
    burnerFlame: new THREE.MeshToonMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 1.6,
    }),
  };

  // Dimensional Portal Dragon Materials (Voxel Portal Dragon Edition)
  const dragonMats = {
    dragonScaleDark: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3, metalness: 0.2 }),
    dragonScaleMain: new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.4 }),
    dragonUnderbelly: new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.5 }),
    dragonAccentCyan: new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0284c7, emissiveIntensity: 0.7 }),
    hornGold: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.6 }),
    spikePurple: new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.3, emissive: 0x7e22ce, emissiveIntensity: 0.3 }),
    eyeReptileSclera: new THREE.MeshBasicMaterial({ color: 0x84cc16 }),
    eyeReptileIris: new THREE.MeshBasicMaterial({ color: 0xeab308 }),
    eyePupilSlit: new THREE.MeshBasicMaterial({ color: 0x020617 }),
    teethWhite: new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
    portalRing: new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.2, emissive: 0x2e1065, emissiveIntensity: 0.6 }),
    liquidPurpleDeep: new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.95, emissive: 0x3b0764, emissiveIntensity: 0.8 }),
    liquidPurpleMid: new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85, emissive: 0x6b21a8, emissiveIntensity: 0.9 }),
    liquidPurpleGlow: new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.0, metalness: 0.1, transparent: true, opacity: 0.75, emissive: 0xa855f7, emissiveIntensity: 1.2 }),
    frameDarkStone: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.4 }),
    cyanEnergyGlow: new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 1.2 }),
    purpleCrystalCore: new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 1.0, roughness: 0.2 }),
    billboardScreen: new THREE.MeshBasicMaterial({ map: billboardTexture }),
  };

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const edgeGeo = new THREE.EdgesGeometry(boxGeo);

  let craftSubGroup = new THREE.Group();
  rootAirshipGroup.add(craftSubGroup);
  let propellers: THREE.Group[] = [];
  let tentacles: { root: THREE.Group; segments: THREE.Group[] }[] = [];
  let wings: THREE.Group[] = [];

  // Dragon Model Tracking State
  let dragonGroup: THREE.Group | null = null;
  let dragonPortalGroup: THREE.Group | null = null;
  let dragonBillboardGroup: THREE.Group | null = null;
  let portalParticlesGroup: THREE.Group | null = null;
  let neckSegments: THREE.Group[] = [];
  let jawPivot: THREE.Group | null = null;
  let headGroup: THREE.Group | null = null;
  let fireParticleGroup: THREE.Group | null = null;
  let breathPointLight: THREE.PointLight | null = null;
  let portalPointLight: THREE.PointLight | null = null;
  let liquidRings: { mesh: THREE.Mesh; speed: number; baseRadius: number; baseZ: number }[] = [];
  let fireParticles: {
    mesh: THREE.Mesh;
    active: boolean;
    life: number;
    maxLife: number;
    velocity: THREE.Vector3;
  }[] = [];

  function addVoxel(
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    scaleX = 1,
    scaleY = 1,
    scaleZ = 1,
    withOutline = true
  ) {
    const mesh = new THREE.Mesh(boxGeo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(scaleX, scaleY, scaleZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (withOutline) {
      const line = new THREE.LineSegments(edgeGeo, outlineMat);
      mesh.add(line);
    }

    craftSubGroup.add(mesh);
    return mesh;
  }

  function createPropellerUnit(x: number, y: number, z: number, scale = 1.0) {
    addVoxel(x, y, z, materials.engineMetal, 1.2 * scale, 1.2 * scale, 1.8 * scale);

    const propX = x;
    const propY = y;
    const propZ = z + 1.1 * scale;

    // Glowing exhaust ring
    addVoxel(x, y, z - 1.0 * scale, materials.glowLight, 0.9 * scale, 0.9 * scale, 0.25);

    const propGroup = new THREE.Group();
    propGroup.position.set(propX, propY, propZ);

    const hubMesh = new THREE.Mesh(boxGeo, materials.goldTrim);
    hubMesh.scale.set(0.55 * scale, 0.55 * scale, 0.6 * scale);
    hubMesh.castShadow = true;
    hubMesh.add(new THREE.LineSegments(edgeGeo, outlineMat));
    propGroup.add(hubMesh);

    const numBlades = 4;
    const bladeRadius = 1.4 * scale;

    for (let i = 0; i < numBlades; i++) {
      const angle = (i * Math.PI) / 2;
      const bladeHolder = new THREE.Group();
      bladeHolder.rotation.z = angle;

      const bladeMesh = new THREE.Mesh(boxGeo, materials.bladeMetal);
      bladeMesh.scale.set(0.32 * scale, bladeRadius, 0.08 * scale);
      bladeMesh.position.y = bladeRadius / 2 + 0.18 * scale;
      bladeMesh.rotation.y = 0.28;
      bladeMesh.castShadow = true;
      bladeHolder.add(bladeMesh);

      const tipMesh = new THREE.Mesh(boxGeo, materials.goldTrim);
      tipMesh.scale.set(0.35 * scale, 0.38 * scale, 0.1 * scale);
      tipMesh.position.y = bladeRadius + 0.18 * scale;
      tipMesh.rotation.y = 0.28;
      bladeHolder.add(tipMesh);

      propGroup.add(bladeHolder);
    }

    craftSubGroup.add(propGroup);
    propellers.push(propGroup);
  }

  function buildClassicAirship() {
    // 1. BALLOON ENVELOPE (Zeppelin Main Gas Cell)
    const bWidth = 8;
    const bLength = 22;

    for (let z = -bLength / 2; z <= bLength / 2; z += 1.2) {
      const zNorm = z / (bLength / 2);
      const radiusFactor = Math.sqrt(Math.max(0, 1 - Math.pow(zNorm, 2))) * (1 - 0.15 * zNorm);
      const currentRadius = radiusFactor * (bWidth / 2);

      for (let x = -Math.ceil(currentRadius); x <= Math.ceil(currentRadius); x += 1.2) {
        for (let y = -Math.ceil(currentRadius); y <= Math.ceil(currentRadius); y += 1.2) {
          const dist = Math.sqrt(x * x + y * y);
          if (dist <= currentRadius && dist > currentRadius - 1.2) {
            let mat = materials.balloonMain;
            if (Math.abs(Math.round(z)) % 5 === 0) mat = materials.balloonStripe;
            if (y >= Math.floor(currentRadius) - 0.5 || y <= -Math.floor(currentRadius) + 0.5) {
              mat = materials.goldTrim;
            }
            addVoxel(x, y + 6, z, mat, 1.15, 1.15, 1.15);
          }
        }
      }
    }

    // Nose cones & glowing headlights
    addVoxel(0, 6, -bLength / 2 - 1, materials.goldTrim, 1.8, 1.8, 1.5);
    addVoxel(0, 6, -bLength / 2 - 2, materials.glowLight, 1.2, 1.2, 1.2);
    addVoxel(0, 6, bLength / 2 + 1, materials.goldTrim, 1.8, 1.8, 1.5);

    // 2. GONDOLA (Command Cabin & Passenger Deck)
    const gLength = 16;
    const gWidth = 4.5;
    const gY = -2.5;

    for (let z = -gLength / 2; z <= gLength / 2; z += 1.2) {
      const taper = Math.abs(z) > gLength / 3 ? 0.8 : 1.0;
      const widthCur = gWidth * taper;

      for (let x = -Math.floor(widthCur / 2); x <= Math.floor(widthCur / 2); x += 1.2) {
        addVoxel(x, gY, z, materials.hullNavy, 1.15, 1, 1.15);

        if (Math.abs(x) >= Math.floor(widthCur / 2) - 0.4 || Math.abs(z) >= gLength / 2 - 0.8) {
          addVoxel(x, gY + 1, z, materials.hullRed, 1.15, 1, 1.15);
          addVoxel(x, gY + 2, z, materials.hullWhite, 1.15, 1, 1.15);
        }
      }
    }

    // Windows & Bridge Lights
    [-4, -2, 0, 2].forEach((zWin) => {
      addVoxel(-2.2, gY + 2, zWin, materials.windowGlass, 0.4, 0.9, 1.2);
      addVoxel(2.2, gY + 2, zWin, materials.windowGlass, 0.4, 0.9, 1.2);
    });
    addVoxel(0, gY + 3, -5.6, materials.windowGlass, 2.2, 1.0, 0.4);
    addVoxel(0, gY + 1, -gLength / 2 - 0.8, materials.glowLight, 1.2, 1.2, 1.2);

    // 3. SUSPENSION TRUSSES
    const struts = [
      [-2.2, 0, -6],
      [2.2, 0, -6],
      [-2.2, 0, -2],
      [2.2, 0, -2],
      [-2.2, 0, 2],
      [2.2, 0, 2],
      [-2.2, 0, 6],
      [2.2, 0, 6],
    ];
    struts.forEach(([sx, sy, sz]) => {
      for (let py = 0; py <= 3.5; py += 1.2) {
        addVoxel(sx, sy + py, sz, materials.goldTrim, 0.35, 1.2, 0.35);
      }
    });

    // 4. DUAL SIDE BILLBOARDS (PORT & STARBOARD)
    const bbWidth = 0.5;
    const bbHeight = 6.8;
    const bbLength = 15.0;
    const bbY = 2.0;
    const bbXOffset = 5.4;

    // Left Billboard (Port Side)
    addVoxel(-bbXOffset, bbY, 0, materials.billboardFrame, bbWidth, bbHeight + 0.8, bbLength + 0.8);
    const leftScreenGeo = new THREE.PlaneGeometry(bbLength, bbHeight);
    const leftScreen = new THREE.Mesh(leftScreenGeo, materials.billboardScreen);
    leftScreen.position.set(-bbXOffset - 0.28, bbY, 0);
    leftScreen.rotation.y = -Math.PI / 2;
    craftSubGroup.add(leftScreen);

    // Right Billboard (Starboard Side)
    addVoxel(bbXOffset, bbY, 0, materials.billboardFrame, bbWidth, bbHeight + 0.8, bbLength + 0.8);
    const rightScreenGeo = new THREE.PlaneGeometry(bbLength, bbHeight);
    const rightScreen = new THREE.Mesh(rightScreenGeo, materials.billboardScreen);
    rightScreen.position.set(bbXOffset + 0.28, bbY, 0);
    rightScreen.rotation.y = Math.PI / 2;
    craftSubGroup.add(rightScreen);

    // Mounting Brackets
    [-5.5, 5.5].forEach((zOffset) => {
      addVoxel(-3.6, bbY, zOffset, materials.engineMetal, 3.2, 0.5, 0.5);
      addVoxel(3.6, bbY, zOffset, materials.engineMetal, 3.2, 0.5, 0.5);
    });

    // Heavy propulsion units at stern
    createPropellerUnit(-2.8, -1.8, 8.8, 1.25);
    createPropellerUnit(2.8, -1.8, 8.8, 1.25);

    // 6. X-TAIL FIN RUDDERS
    for (let i = 0; i < 5; i++) {
      addVoxel(0, 10 + i * 0.8, 8 + i * 0.9, materials.balloonStripe, 0.5, 1.2, 1.2);
      addVoxel(0, 2 - i * 0.8, 8 + i * 0.9, materials.balloonStripe, 0.5, 1.2, 1.2);
      addVoxel(-5 - i * 0.9, 6, 8 + i * 0.9, materials.balloonStripe, 1.2, 0.5, 1.2);
      addVoxel(5 + i * 0.9, 6, 8 + i * 0.9, materials.balloonStripe, 1.2, 0.5, 1.2);
    }
  }

  function buildPokemonAirBalloon() {
    // ---------------- POKÉMON BLOCK STYLE AIRBALLOON ----------------
    // Signature Voxel Creature Airballoon (Drifblim / Pokemon Block Style)
    // Features animated flapping wings, articulated waving tentacles, fluffy cloud crown,
    // expressive block face with yellow cross & glowing ruby eyes, and dual billboard screens.

    const centerY = 5.8;
    const balloonRadius = 6.4;

    // 1. MAIN POKÉMON BLOCK BALLOON BODY (Vibrant purple & lavender voxels)
    for (let y = 1.0; y <= 11.2; y += 1.15) {
      const dy = y - centerY;
      // Balloon creature profile: rounded sphere with slight taper at bottom
      let r = 0;
      if (y >= centerY) {
        r = Math.sqrt(Math.max(0, Math.pow(balloonRadius, 2) - dy * dy));
      } else {
        const factor = (y - 1.0) / (centerY - 1.0);
        r = 2.8 + factor * (balloonRadius - 2.8);
      }

      for (let x = -Math.ceil(r); x <= Math.ceil(r); x += 1.15) {
        for (let z = -Math.ceil(r); z <= Math.ceil(r); z += 1.15) {
          const dist = Math.sqrt(x * x + z * z);
          if (dist <= r && dist > r - 1.25) {
            let mat = materials.pokePurple;
            // Shading variations for rich blocky texture
            if (y >= 9.0) {
              mat = materials.pokeLavender; // Upper highlight crest
            } else if (y <= 3.2) {
              mat = materials.pokeDeepPurple; // Lower underside shade
            } else if (Math.abs(x) < 2.0 && Math.abs(z) < 2.0) {
              mat = materials.pokeLavender;
            }
            addVoxel(x, y, z, mat, 1.14, 1.14, 1.14);
          }
        }
      }
    }

    // 2. FLUFFY WHITE CLOUD TUFT (Crown on top of head, Drifblim style)
    const cloudCenterY = 11.8;
    const cloudOffsets = [
      [0, 0, 0, 3.2, 1.4, 3.2],
      [-1.4, 0.4, -0.6, 2.2, 1.2, 2.2],
      [1.4, 0.4, 0.6, 2.2, 1.2, 2.2],
      [-0.8, 0.6, 1.2, 1.8, 1.2, 1.8],
      [0.8, 0.7, -1.2, 1.8, 1.2, 1.8],
      [0, 1.2, 0, 2.2, 1.0, 2.2],
    ];
    cloudOffsets.forEach(([cx, cy, cz, sx, sy, sz]) => {
      addVoxel(cx, cloudCenterY + cy, cz, materials.pokeCloudWhite, sx, sy, sz);
    });

    // 3. ICONIC YELLOW "X" MOUTH & EXPRESSIVE EYES (Front Face)
    // Center yellow block
    addVoxel(0, centerY - 0.2, balloonRadius - 0.15, materials.pokeYellowCross, 1.2, 1.2, 0.6);
    // Upper-left to bottom-right arm of X
    addVoxel(-0.9, centerY + 0.7, balloonRadius - 0.25, materials.pokeYellowCross, 0.9, 0.9, 0.5);
    addVoxel(0.9, centerY - 1.1, balloonRadius - 0.25, materials.pokeYellowCross, 0.9, 0.9, 0.5);
    // Upper-right to bottom-left arm of X
    addVoxel(0.9, centerY + 0.7, balloonRadius - 0.25, materials.pokeYellowCross, 0.9, 0.9, 0.5);
    addVoxel(-0.9, centerY - 1.1, balloonRadius - 0.25, materials.pokeYellowCross, 0.9, 0.9, 0.5);

    // Glowing Ruby Creature Eyes
    [-2.2, 2.2].forEach((xEye) => {
      // Main ruby eye block
      addVoxel(xEye, centerY + 0.9, balloonRadius - 0.35, materials.pokeEyesRed, 1.1, 1.1, 0.5);
      // Sparkle / Catchlight
      addVoxel(xEye + (xEye > 0 ? 0.3 : -0.3), centerY + 1.2, balloonRadius - 0.1, materials.pokeCloudWhite, 0.4, 0.4, 0.4);
    });

    // 4. ANIMATED FLAPPING WINGS (Left & Right Voxel Wings)
    const wingConfigs = [
      { side: 'left', x: -balloonRadius + 0.4, rotY: Math.PI / 2 },
      { side: 'right', x: balloonRadius - 0.4, rotY: -Math.PI / 2 },
    ];

    wings = [];

    wingConfigs.forEach(({ side, x }) => {
      const wingRoot = new THREE.Group();
      wingRoot.position.set(x, centerY + 0.5, 0);

      // Wing base bracket
      const baseBlock = new THREE.Mesh(boxGeo, materials.pokeDeepPurple);
      baseBlock.scale.set(0.6, 0.8, 0.8);
      baseBlock.castShadow = true;
      wingRoot.add(baseBlock);

      // Wing flapping arm container
      const wingArm = new THREE.Group();
      wingArm.position.set(side === 'left' ? -0.4 : 0.4, 0, 0);

      // Voxel feathers / wing panels
      const isL = side === 'left' ? -1 : 1;
      [
        [0.8 * isL, 0.3, 0, 1.2, 1.6, 0.3, materials.pokeWingFlap],
        [1.8 * isL, 0.8, -0.2, 1.4, 1.4, 0.25, materials.pokeWingFlap],
        [2.8 * isL, 1.2, -0.3, 1.2, 1.2, 0.2, materials.pokeLavender],
        [3.6 * isL, 1.6, -0.4, 0.9, 0.9, 0.2, materials.pokeLavender],
      ].forEach(([wx, wy, wz, wsx, wsy, wsz, wmat]) => {
        const wingVoxel = new THREE.Mesh(boxGeo, wmat as THREE.Material);
        wingVoxel.position.set(wx as number, wy as number, wz as number);
        wingVoxel.scale.set(wsx as number, wsy as number, wsz as number);
        wingVoxel.castShadow = true;
        wingVoxel.add(new THREE.LineSegments(edgeGeo, outlineMat));
        wingArm.add(wingVoxel);
      });

      wingRoot.add(wingArm);
      craftSubGroup.add(wingRoot);
      wings.push(wingRoot);
    });

    // 5. ANIMATED WAVING TENTACLES (4 Segmented Floating Ribbon Arms with Yellow Cloud Tips)
    tentacles = [];

    const tentacleBasePositions = [
      { x: -1.8, z: 1.8 },   // Front-Left
      { x: 1.8, z: 1.8 },    // Front-Right
      { x: -1.8, z: -1.8 },  // Back-Left
      { x: 1.8, z: -1.8 },   // Back-Right
    ];

    tentacleBasePositions.forEach((pos) => {
      const tentacleRoot = new THREE.Group();
      tentacleRoot.position.set(pos.x, 0.6, pos.z);

      const segmentGroups: THREE.Group[] = [];
      let parentGroup = tentacleRoot;
      const numSegments = 5;

      for (let s = 0; s < numSegments; s++) {
        const segGroup = new THREE.Group();
        segGroup.position.set(0, -1.05, 0);

        // Ribbon link
        const ribbonMesh = new THREE.Mesh(boxGeo, materials.pokeTentacleRibbon);
        ribbonMesh.scale.set(0.42, 1.05, 0.42);
        ribbonMesh.position.set(0, -0.5, 0);
        ribbonMesh.castShadow = true;
        ribbonMesh.add(new THREE.LineSegments(edgeGeo, outlineMat));
        segGroup.add(ribbonMesh);

        parentGroup.add(segGroup);
        segmentGroups.push(segGroup);
        parentGroup = segGroup;
      }

      // Cute Yellow Cloud Cushion Hand at the tip of the tentacle
      const tipMesh = new THREE.Mesh(boxGeo, materials.pokeTentacleYellowTip);
      tipMesh.scale.set(1.15, 1.15, 1.15);
      tipMesh.position.set(0, -1.2, 0);
      tipMesh.castShadow = true;
      tipMesh.add(new THREE.LineSegments(edgeGeo, outlineMat));
      parentGroup.add(tipMesh);

      // Gold bead accent above the yellow hand
      const beadMesh = new THREE.Mesh(boxGeo, materials.goldTrim);
      beadMesh.scale.set(0.65, 0.45, 0.65);
      beadMesh.position.set(0, -0.65, 0);
      parentGroup.add(beadMesh);

      craftSubGroup.add(tentacleRoot);
      tentacles.push({ root: tentacleRoot, segments: segmentGroups });
    });

    // 6. ONE BILLBOARD ONLY (Suspended Directly Beneath Creature, Replacing Basket)
    // As specified: Replaced basket with one billboard only!
    const bbY = -3.4;
    const bbWidth = 12.0;
    const bbHeight = 6.2;
    const bbDepth = 0.55;

    // Glowing Top Collar & Burner Core
    addVoxel(0, 0.2, 0, materials.goldTrim, 2.8, 0.5, 2.8);
    addVoxel(0, -0.4, 0, materials.engineMetal, 1.4, 0.6, 1.4);
    addVoxel(0, -0.1, 0, materials.burnerFlame, 1.2, 1.2, 1.2);

    // 4 Suspension Rigging Cables connecting balloon creature to the single billboard
    const cableOffsets = [
      [-bbWidth / 2 + 1.2, -bbDepth / 2],
      [bbWidth / 2 - 1.2, -bbDepth / 2],
      [-bbWidth / 2 + 1.2, bbDepth / 2],
      [bbWidth / 2 - 1.2, bbDepth / 2],
    ];
    cableOffsets.forEach(([cx, cz]) => {
      for (let py = -0.4; py >= bbY + bbHeight / 2; py -= 0.9) {
        addVoxel(cx, py, cz, materials.goldTrim, 0.2, 0.9, 0.2);
      }
    });

    // Outer Billboard Frame Housing
    addVoxel(0, bbY, 0, materials.billboardFrame, bbWidth + 0.6, bbHeight + 0.6, bbDepth);

    // Golden Neon Border Trim around the Billboard Frame
    addVoxel(0, bbY + bbHeight / 2 + 0.15, 0, materials.goldTrim, bbWidth + 0.8, 0.3, bbDepth + 0.1);
    addVoxel(0, bbY - bbHeight / 2 - 0.15, 0, materials.goldTrim, bbWidth + 0.8, 0.3, bbDepth + 0.1);
    addVoxel(-bbWidth / 2 - 0.15, bbY, 0, materials.goldTrim, 0.3, bbHeight + 0.8, bbDepth + 0.1);
    addVoxel(bbWidth / 2 + 0.15, bbY, 0, materials.goldTrim, 0.3, bbHeight + 0.8, bbDepth + 0.1);

    // Glowing Cyan Corner Accents
    [
      [-bbWidth / 2, bbY + bbHeight / 2],
      [bbWidth / 2, bbY + bbHeight / 2],
      [-bbWidth / 2, bbY - bbHeight / 2],
      [bbWidth / 2, bbY - bbHeight / 2],
    ].forEach(([cornerX, cornerY]) => {
      addVoxel(cornerX, cornerY, 0, materials.glowLight, 0.5, 0.5, bbDepth + 0.15);
    });

    // Front Billboard Display Screen (Visible when looking from front)
    const singleScreenGeo = new THREE.PlaneGeometry(bbWidth, bbHeight);
    const frontScreen = new THREE.Mesh(singleScreenGeo, materials.billboardScreen);
    frontScreen.position.set(0, bbY, bbDepth / 2 + 0.05);
    craftSubGroup.add(frontScreen);

    // Back Billboard Display Screen (Visible when orbiting to back)
    const backScreen = new THREE.Mesh(singleScreenGeo, materials.billboardScreen);
    backScreen.position.set(0, bbY, -bbDepth / 2 - 0.05);
    backScreen.rotation.y = Math.PI;
    craftSubGroup.add(backScreen);
  }

  // ---------------- VOXEL DIMENSIONAL PORTAL DRAGON (LIQUID PORTAL EDITION) ----------------
  function buildPortalDragon() {
    dragonGroup = new THREE.Group();
    dragonGroup.position.set(0, -4.5, -0.5);
    dragonGroup.scale.set(0.85, 0.85, 0.85);

    function addDragonVoxel(
      x: number,
      y: number,
      z: number,
      mat: THREE.Material,
      scaleX = 1,
      scaleY = 1,
      scaleZ = 1,
      parent: THREE.Group = dragonGroup!,
      withOutline = true
    ) {
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(scaleX, scaleY, scaleZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (withOutline) {
        const line = new THREE.LineSegments(edgeGeo, outlineMat);
        mesh.add(line);
      }

      parent.add(mesh);
      return mesh;
    }

    // 1. THE LIQUID PURPLE DIMENSIONAL PORTAL
    dragonPortalGroup = new THREE.Group();
    dragonPortalGroup.position.set(0, 8.5, -6.0);

    const portalRadius = 8.5;
    const segments = 24;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const px = Math.cos(angle) * portalRadius;
      const py = Math.sin(angle) * portalRadius;

      const ringBlock = addDragonVoxel(px, py, 0, dragonMats.portalRing, 1.8, 1.8, 1.8, dragonPortalGroup);
      ringBlock.rotation.z = angle;

      if (i % 2 === 0) {
        addDragonVoxel(px * 1.12, py * 1.12, 0.2, dragonMats.dragonAccentCyan, 1.0, 1.0, 0.6, dragonPortalGroup);
      }
    }

    liquidRings = [];
    const ringConfigs = [
      { radius: 6.8, tube: 0.8, mat: dragonMats.liquidPurpleDeep, speed: 0.8, offsetZ: -0.4 },
      { radius: 5.2, tube: 0.9, mat: dragonMats.liquidPurpleMid, speed: -1.2, offsetZ: -0.2 },
      { radius: 3.4, tube: 1.0, mat: dragonMats.liquidPurpleGlow, speed: 1.6, offsetZ: 0.0 },
      { radius: 1.8, tube: 0.8, mat: dragonMats.liquidPurpleMid, speed: -2.0, offsetZ: 0.2 },
    ];

    ringConfigs.forEach((cfg) => {
      const ringGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 36);
      const ringMesh = new THREE.Mesh(ringGeo, cfg.mat);
      ringMesh.position.z = cfg.offsetZ;
      dragonPortalGroup!.add(ringMesh);

      liquidRings.push({
        mesh: ringMesh,
        speed: cfg.speed,
        baseRadius: cfg.radius,
        baseZ: cfg.offsetZ,
      });
    });

    const poolGeo = new THREE.CylinderGeometry(7.2, 7.2, 0.6, 32);
    const poolMesh = new THREE.Mesh(poolGeo, dragonMats.liquidPurpleDeep);
    poolMesh.rotation.x = Math.PI / 2;
    poolMesh.position.z = -0.6;
    dragonPortalGroup.add(poolMesh);

    dragonGroup.add(dragonPortalGroup);

    portalParticlesGroup = new THREE.Group();
    for (let p = 0; p < 40; p++) {
      const partMat =
        p % 3 === 0
          ? dragonMats.liquidPurpleGlow
          : p % 2 === 0
          ? dragonMats.dragonAccentCyan
          : dragonMats.spikePurple;
      const pMesh = new THREE.Mesh(boxGeo, partMat);
      const size = 0.3 + Math.random() * 0.4;
      pMesh.scale.set(size, size, size);
      const ang = Math.random() * Math.PI * 2;
      const rad = 1.5 + Math.random() * 6.0;
      pMesh.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad, (Math.random() - 0.5) * 3);
      portalParticlesGroup.add(pMesh);
    }
    dragonPortalGroup.add(portalParticlesGroup);

    // 2. EXTENDED CURVED DRAGON NECK
    neckSegments = [];
    let currentParent: THREE.Group = dragonGroup;
    const numNeckSegs = 6;
    const startZ = -5.0;
    const startY = 8.5;

    for (let n = 0; n < numNeckSegs; n++) {
      const segGroup = new THREE.Group();
      if (n === 0) {
        segGroup.position.set(0, startY, startZ);
      } else {
        segGroup.position.set(0, 0.6 - n * 0.1, 2.2);
      }

      const width = 5.2 - n * 0.4;
      const height = 4.8 - n * 0.3;
      const depth = 2.4;

      addDragonVoxel(0, 0, 0, dragonMats.dragonScaleMain, width, height, depth, segGroup);
      addDragonVoxel(0, -height / 2 + 0.2, 0.2, dragonMats.dragonUnderbelly, width * 0.75, 0.8, depth + 0.1, segGroup);
      addDragonVoxel(0, height / 2 + 0.6, -0.2, dragonMats.spikePurple, 0.8, 1.4, 0.8, segGroup);

      if (n % 2 === 0) {
        addDragonVoxel(-width / 2 - 0.3, 0, 0, dragonMats.dragonAccentCyan, 0.5, 0.8, 0.8, segGroup);
        addDragonVoxel(width / 2 + 0.3, 0, 0, dragonMats.dragonAccentCyan, 0.5, 0.8, 0.8, segGroup);
      }

      currentParent.add(segGroup);
      currentParent = segGroup;
      neckSegments.push(segGroup);
    }

    // 3. DRAGON HEAD WITH FRONT-POSITIONED REPTILE EYES
    headGroup = new THREE.Group();
    headGroup.position.set(0, 0.8, 2.4);

    addDragonVoxel(0, 1.0, 1.2, dragonMats.dragonScaleDark, 4.4, 3.2, 3.6, headGroup);
    addDragonVoxel(0, 0.2, 3.8, dragonMats.dragonScaleMain, 3.6, 2.0, 3.2, headGroup);
    addDragonVoxel(-0.8, 1.1, 5.2, dragonMats.dragonScaleDark, 0.5, 0.4, 0.4, headGroup);
    addDragonVoxel(0.8, 1.1, 5.2, dragonMats.dragonScaleDark, 0.5, 0.4, 0.4, headGroup);

    [-1.4, 1.4].forEach((xP) => {
      addDragonVoxel(xP, -0.9, 5.0, dragonMats.teethWhite, 0.4, 0.8, 0.4, headGroup!);
    });

    [-1.25, 1.25].forEach((side) => {
      const eyeSocketsGroup = new THREE.Group();
      eyeSocketsGroup.position.set(side * 1.35, 1.65, 3.6);
      eyeSocketsGroup.rotation.y = side * 0.18;

      addDragonVoxel(0, 0.6, 0, dragonMats.dragonScaleDark, 1.2, 0.6, 1.3, eyeSocketsGroup);
      addDragonVoxel(0, 0, 0, dragonMats.dragonScaleMain, 1.0, 0.9, 1.1, eyeSocketsGroup);
      addDragonVoxel(0, 0.05, 0.45, dragonMats.eyeReptileSclera, 0.8, 0.7, 0.3, eyeSocketsGroup, false);
      addDragonVoxel(0, 0.05, 0.58, dragonMats.eyeReptileIris, 0.55, 0.55, 0.18, eyeSocketsGroup, false);
      addDragonVoxel(0, 0.05, 0.65, dragonMats.eyePupilSlit, 0.18, 0.65, 0.1, eyeSocketsGroup, false);

      headGroup!.add(eyeSocketsGroup);
      addDragonVoxel(side * 1.7, 0.2, 2.2, dragonMats.dragonAccentCyan, 0.7, 0.5, 1.2, headGroup!);
    });

    [-2.0, 2.0].forEach((side) => {
      const hornGroup = new THREE.Group();
      hornGroup.position.set(side * 1.1, 3.2, 0.2);
      addDragonVoxel(0, 0.8, -0.6, dragonMats.hornGold, 1.2, 1.8, 1.2, hornGroup);
      addDragonVoxel(side * 0.3, 2.2, -1.6, dragonMats.hornGold, 1.0, 2.0, 1.0, hornGroup);
      addDragonVoxel(side * 0.6, 3.6, -2.8, dragonMats.hornGold, 0.8, 1.6, 0.8, hornGroup);
      hornGroup.rotation.x = -0.2;
      hornGroup.rotation.y = side * 0.25;
      headGroup!.add(hornGroup);
    });

    addDragonVoxel(0, 3.4, 0.8, dragonMats.spikePurple, 0.8, 1.6, 1.6, headGroup);

    jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.6, 1.8);
    addDragonVoxel(0, -0.6, 1.8, dragonMats.dragonScaleDark, 3.4, 1.2, 3.2, jawPivot);
    [-1.1, 1.1].forEach((xP) => {
      addDragonVoxel(xP, 0.2, 3.0, dragonMats.teethWhite, 0.3, 0.7, 0.3, jawPivot!);
    });
    headGroup.add(jawPivot);
    currentParent.add(headGroup);

    // 4. FLOATING PORTAL BILLBOARD - ENLARGED SPECIFICALLY FOR DRAGON
    dragonBillboardGroup = new THREE.Group();
    dragonBillboardGroup.position.set(0, -5.0, 4.5);

    const bbWidth = 34.0;
    const bbHeight = 18.0;
    const bbDepth = 1.2;

    addDragonVoxel(0, 0, 0, dragonMats.frameDarkStone, bbWidth, bbHeight, bbDepth, dragonBillboardGroup);

    for (let rx = -(bbWidth / 2 - 2.5); rx <= bbWidth / 2 - 2.5; rx += 2.8) {
      addDragonVoxel(rx, bbHeight / 2 + 0.3, 0, dragonMats.cyanEnergyGlow, 1.2, 0.55, bbDepth + 0.2, dragonBillboardGroup);
      addDragonVoxel(rx, -bbHeight / 2 - 0.3, 0, dragonMats.cyanEnergyGlow, 1.2, 0.55, bbDepth + 0.2, dragonBillboardGroup);
    }

    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([cx, cy]) => {
      const cornerGroup = new THREE.Group();
      cornerGroup.position.set(cx * (bbWidth / 2 + 0.6), cy * (bbHeight / 2 + 0.6), 0);
      addDragonVoxel(0, 0, 0, dragonMats.frameDarkStone, 2.2, 2.2, bbDepth + 0.4, cornerGroup);
      addDragonVoxel(0, 0, 0, dragonMats.purpleCrystalCore, 1.4, 1.4, bbDepth + 0.6, cornerGroup);
      addDragonVoxel(cx * 0.9, cy * 0.9, 0, dragonMats.spikePurple, 1.2, 1.2, 1.2, cornerGroup);
      dragonBillboardGroup!.add(cornerGroup);
    });

    [-(bbWidth / 2 - 2.8), bbWidth / 2 - 2.8].forEach((cX) => {
      const emitterGroup = new THREE.Group();
      emitterGroup.position.set(cX, bbHeight / 2 + 1.4, 0);
      addDragonVoxel(0, 0, 0, dragonMats.cyanEnergyGlow, 1.3, 1.3, 1.3, emitterGroup);
      addDragonVoxel(0, -0.7, 0, dragonMats.frameDarkStone, 1.6, 0.7, 1.6, emitterGroup);
      dragonBillboardGroup!.add(emitterGroup);
    });

    const frontGeo = new THREE.PlaneGeometry(bbWidth - 1.6, bbHeight - 1.6);
    const frontMesh = new THREE.Mesh(frontGeo, dragonMats.billboardScreen);
    frontMesh.position.set(0, 0, bbDepth / 2 + 0.02);
    dragonBillboardGroup.add(frontMesh);

    const backGeo = new THREE.PlaneGeometry(bbWidth - 1.6, bbHeight - 1.6);
    const backMesh = new THREE.Mesh(backGeo, dragonMats.billboardScreen);
    backMesh.position.set(0, 0, -bbDepth / 2 - 0.02);
    backMesh.rotation.y = Math.PI;
    dragonBillboardGroup.add(backMesh);

    dragonGroup.add(dragonBillboardGroup);

    // 5. Fire Breath Particle System - Attached directly to headGroup so fire comes directly out of dragon mouth
    fireParticleGroup = new THREE.Group();
    headGroup.add(fireParticleGroup);

    const fireMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xffe600, emissive: 0xffaa00, emissiveIntensity: 2.2 }),
      new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff2200, emissiveIntensity: 2.4 }),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa0000, emissiveIntensity: 2.0 }),
      new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff4400, emissiveIntensity: 2.3 }),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffeedd, emissiveIntensity: 2.8 }),
    ];

    fireParticles = [];
    const poolSize = 80;
    for (let i = 0; i < poolSize; i++) {
      const mat = fireMaterials[i % fireMaterials.length];
      const pMesh = new THREE.Mesh(boxGeo, mat);
      pMesh.visible = false;
      fireParticleGroup.add(pMesh);
      fireParticles.push({
        mesh: pMesh,
        active: false,
        life: 0,
        maxLife: 1.0,
        velocity: new THREE.Vector3(),
      });
    }

    portalPointLight = new THREE.PointLight(0xd8b4fe, 3.5, 45);
    portalPointLight.position.set(0, 8, -6);
    dragonGroup.add(portalPointLight);

    // Mouth breath light directly inside mouth between teeth
    breathPointLight = new THREE.PointLight(0xff5500, 0, 35);
    breathPointLight.position.set(0, -0.85, 5.3);
    headGroup.add(breathPointLight);

    craftSubGroup.add(dragonGroup);
  }

  function updateFireBreath(time: number, delta: number) {
    if (currentCraftType !== 'portal_dragon') return;

    const cycleTime = time % 4.0;
    const isFiring = cycleTime < 2.2; // Blasts fire stream for 2.2s every 4s

    if (jawPivot) {
      const targetJawAngle = isFiring ? 0.75 : 0.08;
      jawPivot.rotation.x += (targetJawAngle - jawPivot.rotation.x) * 0.15;
    }

    if (breathPointLight) {
      if (isFiring) {
        breathPointLight.intensity = 15.0 + Math.random() * 8.0;
        breathPointLight.color.setHex(Math.random() > 0.4 ? 0xff4400 : 0xffaa00);
      } else {
        breathPointLight.intensity = Math.max(0, breathPointLight.intensity - delta * 25);
      }
    }

    if (isFiring) {
      for (let i = 0; i < 3; i++) {
        const p = fireParticles.find((part) => !part.active);
        if (p) {
          p.active = true;
          p.life = 0;
          p.maxLife = 0.75 + Math.random() * 0.45;
          p.mesh.visible = true;

          // Originates strictly from inside dragon's open mouth cavity between upper fangs and open lower jaw
          p.mesh.position.set(
            (Math.random() - 0.5) * 0.7,
            -0.85 + (Math.random() - 0.5) * 0.25,
            5.3 + Math.random() * 0.35
          );

          // Shoots forward along +Z direction out from mouth
          const forwardSpeed = 26 + Math.random() * 12;
          const spreadX = (Math.random() - 0.5) * 5.0;
          const spreadY = -0.5 + (Math.random() - 0.5) * 2.5;

          p.velocity.set(spreadX, spreadY, forwardSpeed);
        }
      }
    }

    fireParticles.forEach((p) => {
      if (!p.active) return;

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        return;
      }

      p.mesh.position.addScaledVector(p.velocity, delta);

      const lifeProgress = p.life / p.maxLife;
      const scale = 0.5 + lifeProgress * 3.0;
      p.mesh.scale.set(scale, scale, scale);

      p.velocity.y += delta * 2.2;
      p.velocity.x += (Math.random() - 0.5) * delta * 6;
    });
  }

  function renderSelectedCraft(craft: AerialCraftType) {
    while (craftSubGroup.children.length > 0) {
      const child = craftSubGroup.children[0];
      craftSubGroup.remove(child);
    }
    propellers = [];
    tentacles = [];
    wings = [];
    liquidRings = [];
    neckSegments = [];
    fireParticles = [];
    jawPivot = null;
    headGroup = null;
    dragonGroup = null;
    portalParticlesGroup = null;
    dragonBillboardGroup = null;
    if (breathPointLight) {
      if (breathPointLight.parent) {
        breathPointLight.parent.remove(breathPointLight);
      } else {
        scene.remove(breathPointLight);
      }
      breathPointLight = null;
    }
    if (portalPointLight) {
      scene.remove(portalPointLight);
      portalPointLight = null;
    }

    if (craft === 'portal_dragon') {
      buildPortalDragon();
    } else if (craft === 'pokemon_balloon') {
      buildPokemonAirBalloon();
    } else {
      buildClassicAirship();
    }
  }

  let currentCraftType: AerialCraftType = options?.craftType || 'airship';
  renderSelectedCraft(currentCraftType);

  // ---------------- LIGHTING ----------------
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
  dirLight.position.set(30, 45, 25);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.8);
  fillLight.position.set(-25, 20, -20);
  scene.add(fillLight);

  const underGlow = new THREE.PointLight(0x38bdf8, 3.0, 15);
  underGlow.position.set(0, -3, 0);
  scene.add(underGlow);

  // ---------------- ZOOM & CAMERA CONTROLS ----------------
  let currentZoom = options?.initialZoom ?? 1.0;
  const minZoom = 0.35;
  const maxZoom = 2.6;

  function applyZoom(newZoom: number) {
    currentZoom = Math.max(minZoom, Math.min(maxZoom, Math.round(newZoom * 100) / 100));
    camera.zoom = currentZoom;
    camera.updateProjectionMatrix();
    if (options?.onZoomChange) {
      options.onZoomChange(currentZoom);
    }
  }

  if (currentZoom !== 1.0) {
    camera.zoom = currentZoom;
    camera.updateProjectionMatrix();
  }

  const onWheel = (e: WheelEvent) => {
    if (!options?.enableZoom) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    applyZoom(currentZoom + delta);
  };

  let initialPinchDist = 0;
  let pinchStartZoom = currentZoom;

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2 && options?.enableZoom) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist = Math.hypot(dx, dy);
      pinchStartZoom = currentZoom;
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && options?.enableZoom && initialPinchDist > 0) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / initialPinchDist;
      applyZoom(pinchStartZoom * factor);
    }
  };

  const onTouchEnd = () => {
    initialPinchDist = 0;
  };

  if (options?.enableZoom) {
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  // Interactive orbit controls if enabled
  let isDragging = false;
  let prevPos = { x: 0, y: 0 };
  let rotY = 0;
  let rotX = 0;

  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    prevPos = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - prevPos.x;
    const dy = e.clientY - prevPos.y;
    rotY += dx * 0.008;
    rotX = Math.max(-0.4, Math.min(0.4, rotX + dy * 0.005));
    prevPos = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => {
    isDragging = false;
  };

  if (options?.interactiveOrbit) {
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  // ---------------- ANIMATION LOOP ----------------
  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (options?.autoRotate && !isDragging) {
      rotY += 0.008;
    }

    // Flight bobbing & gentle roll
    rootAirshipGroup.position.y = Math.sin(time * 1.5) * 0.45;
    rootAirshipGroup.rotation.y = rotY;
    rootAirshipGroup.rotation.x = rotX + Math.cos(time * 1.1) * 0.02;
    rootAirshipGroup.rotation.z = Math.sin(time * 0.9) * 0.035;

    // Spin propellers (for airship)
    propellers.forEach((prop, idx) => {
      prop.rotation.z += (idx % 2 === 0 ? 1 : -1) * 0.4;
    });

    // Animate flapping wings (for Pokémon Block Airballoon)
    wings.forEach((wing, idx) => {
      const dir = idx === 0 ? 1 : -1;
      wing.rotation.z = Math.sin(time * 3.6) * 0.25 * dir;
      wing.rotation.y = Math.cos(time * 3.6) * 0.14 * dir;
    });

    // Animate waving articulated tentacles (for Pokémon Block Airballoon)
    tentacles.forEach((tData, tIdx) => {
      tData.segments.forEach((seg, sIdx) => {
        const waveZ = Math.sin(time * 2.2 + tIdx * 1.5 + sIdx * 0.55) * 0.16;
        const waveX = Math.cos(time * 1.8 + tIdx * 1.2 + sIdx * 0.45) * 0.12;
        seg.rotation.z = waveZ;
        seg.rotation.x = waveX;
      });
    });

    // Animate Voxel Dimensional Portal Dragon (Liquid Portal Edition)
    if (currentCraftType === 'portal_dragon') {
      liquidRings.forEach((ring, idx) => {
        ring.mesh.rotation.z = time * ring.speed;
        const pulse = Math.sin(time * 2.5 + idx * 0.8) * 0.12;
        ring.mesh.scale.set(1 + pulse, 1 + pulse, 1 + pulse * 1.5);
        ring.mesh.position.z = ring.baseZ + Math.cos(time * 3.0 + idx) * 0.2;
      });

      if (portalParticlesGroup) {
        portalParticlesGroup.rotation.z = -time * 0.5;
      }

      neckSegments.forEach((seg, idx) => {
        seg.rotation.x = Math.sin(time * 1.8 + idx * 0.3) * 0.04;
        seg.rotation.y = Math.cos(time * 1.4 + idx * 0.3) * 0.05;
      });

      if (dragonBillboardGroup) {
        dragonBillboardGroup.position.y = -3.0 + Math.sin(time * 1.8) * 0.2;
        dragonBillboardGroup.rotation.z = Math.sin(time * 1.0) * 0.02;
      }

      updateFireBreath(time, delta);
    }

    updateEqualizerAnimation(time);
    renderer.render(scene, camera);
  };

  animate();

  return {
    dispose: () => {
      cancelAnimationFrame(animationFrameId);
      if (options?.interactiveOrbit) {
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      }
      if (options?.enableZoom) {
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
      }
      if (breathPointLight) {
        scene.remove(breathPointLight);
      }
      if (portalPointLight) {
        scene.remove(portalPointLight);
      }
      billboardTexture.dispose();
      toonGradient.dispose();
      renderer.dispose();
    },
    updateBillboardImage: (url: string | null, businessName?: string | null, businessLink?: string | null) => {
      loadCustomImage(url, businessName, businessLink);
    },
    resize: (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    setZoom: (zoom: number) => {
      applyZoom(zoom);
    },
    getZoom: () => currentZoom,
    zoomIn: () => {
      applyZoom(currentZoom + 0.15);
    },
    zoomOut: () => {
      applyZoom(currentZoom - 0.15);
    },
    resetZoom: () => {
      applyZoom(options?.initialZoom ?? 1.0);
    },
    setCraftType: (craft: AerialCraftType) => {
      currentCraftType = craft;
      renderSelectedCraft(craft);
    },
  };
}

// ---------------- REACT COMPONENT WRAPPER ----------------

export interface Airship3DProps {
  width?: number | string;
  height?: number | string;
  imageUrl?: string | null;
  businessName?: string | null;
  businessLink?: string | null;
  onClick?: () => void;
  className?: string;
  modelScale?: number;
  autoRotate?: boolean;
  interactiveOrbit?: boolean;
  enableZoom?: boolean;
  initialZoom?: number;
  craftType?: AerialCraftType;
  onZoomChange?: (zoom: number) => void;
  onControllerReady?: (ctrl: AirshipSceneController) => void;
}

export const Airship3D: React.FC<Airship3DProps> = ({
  width = 110,
  height = 84,
  imageUrl,
  businessName,
  businessLink,
  onClick,
  className = '',
  modelScale,
  autoRotate,
  interactiveOrbit,
  enableZoom,
  initialZoom,
  craftType = 'airship',
  onZoomChange,
  onControllerReady,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<AirshipSceneController | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pixelWidth = typeof width === 'number' ? width : Math.max(200, rect.width || 300);
    const pixelHeight = typeof height === 'number' ? height : Math.max(160, rect.height || 200);

    const controller = setupAirshipScene(
      canvasRef.current,
      pixelWidth,
      pixelHeight,
      imageUrl,
      onClick,
      {
        modelScale,
        autoRotate,
        interactiveOrbit,
        enableZoom,
        initialZoom,
        onZoomChange,
        craftType,
        businessName,
        businessLink,
      }
    );
    controllerRef.current = controller;
    if (onControllerReady) {
      onControllerReady(controller);
    }

    const handleResize = () => {
      if (containerRef.current && controller.resize) {
        const r = containerRef.current.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          controller.resize(r.width, r.height);
        }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controller.dispose();
    };
  }, [width, height, modelScale, autoRotate, interactiveOrbit, enableZoom, initialZoom, craftType]);

  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.updateBillboardImage(imageUrl || null, businessName, businessLink);
    }
  }, [imageUrl, businessName, businessLink]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative select-none flex flex-col items-center ${
        interactiveOrbit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${className}`}
      style={{ width, height }}
      title={
        interactiveOrbit
          ? 'Drag to spin 3D Airship & view photo billboard from all angles'
          : 'Click Squadron Airship to view full screen & manage photo billboard'
      }
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          filter: 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.85)) drop-shadow(0 4px 10px rgba(0,0,0,0.7))',
        }}
      />
    </div>
  );
};
