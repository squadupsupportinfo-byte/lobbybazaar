import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Builds the Grand Event Hall Building 3D scene (Exact user specification).
 */
export function setupGrandEventHallScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  eventTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(4.8, 3.2, 5.8);
  camera.lookAt(0, 1.25, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const clock = new THREE.Clock();
  let spotlightsGroup: THREE.Mesh[] = [];
  let sparklesGroup: THREE.Mesh[] = [];

  // Elegant Event Building Palette (Bright gold, royal purple, crimson red, polished white marble)
  const materials = {
    ground: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }),
    plazaTile: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 }),
    redCarpet: new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 }),
    goldMetal: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 }),
    wallBase: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }),
    wallDark: new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.3 }),
    wallTrim: new THREE.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.3 }),
    doorWood: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      depthWrite: false,
    }),
    glassGlow: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    spotBeamMat: new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    }),
    bannerPurple: new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3 }),
    potColor: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }),
    leafGreen: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 }),
    sparkleMat: new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.95 }),
  };

  // Crisp, bright ambient lighting so all architectural details are clearly visible
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  // Key directional light
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
  sunLight.position.set(6, 12, 7);
  scene.add(sunLight);

  // Front fill light illuminating facade, pillars, and grand marquee
  const frontFillLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
  frontFillLight.position.set(0, 4.0, 7.0);
  scene.add(frontFillLight);

  // Warm golden entrance point light
  const entranceLight = new THREE.PointLight(0xfde047, 3.8, 7.0);
  entranceLight.position.set(0, 1.6, 1.2);
  scene.add(entranceLight);

  // Interior grand chandelier glow
  const interiorLight = new THREE.PointLight(0xc084fc, 3.2, 6.0);
  interiorLight.position.set(0, 1.8, 0.0);
  scene.add(interiorLight);

  const buildingGroup = new THREE.Group();
  scene.add(buildingGroup);

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  // --- 1. Environment ---
  const basePlatform = createBox(5.2, 0.2, 5.2, materials.ground);
  basePlatform.position.y = -0.1;
  buildingGroup.add(basePlatform);

  const plazaTiles = createBox(4.8, 0.02, 2.0, materials.plazaTile);
  plazaTiles.position.set(0, 0.01, 1.4);
  buildingGroup.add(plazaTiles);

  // --- 2. Event Building Main ---
  const building = new THREE.Group();
  buildingGroup.add(building);

  // Main Building Mass (Elegant White Block)
  const mainWall = createBox(3.2, 2.4, 2.2, materials.wallBase);
  mainWall.position.set(0, 1.2, 0);
  building.add(mainWall);

  // Base Trim Foundation
  const foundation = createBox(3.3, 0.2, 2.3, materials.wallTrim);
  foundation.position.set(0, 0.1, 0);
  building.add(foundation);

  // Grand Side Wings
  const wingLeft = createBox(0.8, 2.1, 2.0, materials.wallDark);
  wingLeft.position.set(-1.8, 1.05, 0);
  const wingRight = createBox(0.8, 2.1, 2.0, materials.wallDark);
  wingRight.position.set(1.8, 1.05, 0);
  building.add(wingLeft, wingRight);

  // Grand Front Pillars (4 Classical Gold Trim Columns)
  const columnX = [-1.1, -0.4, 0.4, 1.1];
  columnX.forEach((x) => {
    const colBase = createBox(0.24, 0.12, 0.24, materials.goldMetal);
    colBase.position.set(x, 0.26, 1.15);
    const colShaft = createBox(0.18, 2.0, 0.18, materials.wallBase);
    colShaft.position.set(x, 1.2, 1.15);
    const colCapital = createBox(0.24, 0.12, 0.24, materials.goldMetal);
    colCapital.position.set(x, 2.14, 1.15);
    building.add(colBase, colShaft, colCapital);
  });

  // Double Entrance Glass Doors
  const doorFrame = createBox(1.2, 1.5, 0.08, materials.goldMetal);
  doorFrame.position.set(0, 0.95, 1.05);
  const doorGlassL = createBox(0.5, 1.35, 0.06, materials.glass);
  doorGlassL.position.set(-0.26, 0.95, 1.06);
  const doorGlassR = createBox(0.5, 1.35, 0.06, materials.glass);
  doorGlassR.position.set(0.26, 0.95, 1.06);
  const doorHandleL = createBox(0.04, 0.2, 0.08, materials.goldMetal);
  doorHandleL.position.set(-0.06, 0.95, 1.08);
  const doorHandleR = createBox(0.04, 0.2, 0.08, materials.goldMetal);
  doorHandleR.position.set(0.06, 0.95, 1.08);
  building.add(doorFrame, doorGlassL, doorGlassR, doorHandleL, doorHandleR);

  // Side Arch Windows on Wings
  [-1.8, 1.8].forEach((x) => {
    const windowFrame = createBox(0.45, 1.2, 0.08, materials.goldMetal);
    windowFrame.position.set(x, 1.15, 1.02);
    const windowGlass = createBox(0.37, 1.12, 0.06, materials.glass);
    windowGlass.position.set(x, 1.15, 1.03);
    building.add(windowFrame, windowGlass);
  });

  // Marquee Signboard Canopy
  const marqueeCanopy = createBox(2.6, 0.15, 0.6, materials.wallTrim);
  marqueeCanopy.position.set(0, 1.85, 1.35);
  const marqueeTrim = createBox(2.68, 0.22, 0.1, materials.goldMetal);
  marqueeTrim.position.set(0, 1.85, 1.63);
  building.add(marqueeCanopy, marqueeTrim);

  // Canvas Text Sign for Event
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const signCtx = signCanvas.getContext('2d');
  if (signCtx) {
    signCtx.fillStyle = '#0f172a';
    signCtx.fillRect(0, 0, 1024, 256);
    signCtx.lineWidth = 16;
    signCtx.strokeStyle = '#eab308';
    signCtx.strokeRect(12, 12, 1000, 232);

    signCtx.shadowColor = '#fde047';
    signCtx.shadowBlur = 12;
    signCtx.font = '900 68px "Inter", "Arial Black", sans-serif';
    signCtx.fillStyle = '#ffffff';
    signCtx.textAlign = 'center';
    signCtx.textBaseline = 'middle';
    const displayText = (eventTitle || 'GRAND EVENT HALL').toUpperCase().slice(0, 22);
    signCtx.fillText(displayText, 512, 128);
  }

  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.needsUpdate = true;

  const signBacking = createBox(2.7, 0.52, 0.08, materials.goldMetal);
  signBacking.position.set(0, 2.18, 1.68);

  const signGeo = new THREE.PlaneGeometry(2.62, 0.45);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 2.18, 1.73);
  building.add(signBacking, signMesh);

  // Glowing Marquee Light Bulbs around Sign Frame
  for (let i = -1.25; i <= 1.25; i += 0.25) {
    const bulbTop = createBox(0.04, 0.04, 0.04, materials.glassGlow);
    bulbTop.position.set(i, 2.42, 1.74);
    const bulbBottom = createBox(0.04, 0.04, 0.04, materials.glassGlow);
    bulbBottom.position.set(i, 1.94, 1.74);
    building.add(bulbTop, bulbBottom);
  }

  // Roof Structure (Grand Tiered Crown Roof)
  const roofTier1 = createBox(3.4, 0.3, 2.4, materials.wallTrim);
  roofTier1.position.set(0, 2.45, 0);

  const roofTier2 = createBox(2.8, 0.4, 1.8, materials.bannerPurple);
  roofTier2.position.set(0, 2.7, 0);

  const roofGoldCrest = createBox(2.9, 0.08, 1.9, materials.goldMetal);
  roofGoldCrest.position.set(0, 2.9, 0);
  building.add(roofTier1, roofTier2, roofGoldCrest);

  // Event Flags on Roof Corners
  const flagPos = [
    [-1.2, 0.8],
    [1.2, 0.8],
  ];
  flagPos.forEach(([x, z]) => {
    const pole = createBox(0.04, 0.6, 0.04, materials.goldMetal);
    pole.position.set(x, 3.2, z);
    const flag = createBox(0.25, 0.18, 0.02, materials.redCarpet);
    flag.position.set(x + 0.12, 3.38, z);
    building.add(pole, flag);
  });

  // --- 3. Red Carpet Entrance ---
  const entranceGroup = new THREE.Group();
  buildingGroup.add(entranceGroup);

  const carpet = createBox(0.9, 0.03, 1.8, materials.redCarpet);
  carpet.position.set(0, 0.025, 1.5);
  entranceGroup.add(carpet);

  // Golden Stanchions & Velvet Ropes along carpet edges
  const ropePositionsZ = [0.8, 1.3, 1.8, 2.3];
  [-0.52, 0.52].forEach((x) => {
    ropePositionsZ.forEach((z) => {
      const postBase = createBox(0.1, 0.02, 0.1, materials.goldMetal);
      postBase.position.set(x, 0.03, z);
      const postBody = createBox(0.04, 0.3, 0.04, materials.goldMetal);
      postBody.position.set(x, 0.17, z);
      const postOrb = createBox(0.07, 0.07, 0.07, materials.goldMetal);
      postOrb.position.set(x, 0.34, z);
      entranceGroup.add(postBase, postBody, postOrb);
    });

    for (let i = 0; i < ropePositionsZ.length - 1; i++) {
      const zStart = ropePositionsZ[i];
      const zEnd = ropePositionsZ[i + 1];
      const zMid = (zStart + zEnd) / 2;
      const rope = createBox(0.03, 0.03, 0.48, materials.bannerPurple);
      rope.position.set(x, 0.28, zMid);
      entranceGroup.add(rope);
    }
  });

  // --- 4. Entrance Planter Topiaries ---
  [-1.5, 1.5].forEach((x) => {
    const pot = createBox(0.3, 0.35, 0.3, materials.potColor);
    pot.position.set(x, 0.18, 1.25);
    const bush = createBox(0.4, 0.4, 0.4, materials.leafGreen);
    bush.position.set(x, 0.52, 1.25);
    const bushTop = createBox(0.28, 0.28, 0.28, materials.leafGreen);
    bushTop.position.set(x, 0.72, 1.25);
    buildingGroup.add(pot, bush, bushTop);
  });

  // Sidewalk Welcome Board Poster
  const posterGroup = new THREE.Group();
  posterGroup.position.set(1.4, 0, 1.8);
  posterGroup.rotation.y = -0.35;

  const boardFrame = createBox(0.38, 0.52, 0.04, materials.goldMetal);
  boardFrame.position.y = 0.3;

  const posterCanvas = document.createElement('canvas');
  posterCanvas.width = 256;
  posterCanvas.height = 512;
  const pCtx = posterCanvas.getContext('2d');
  if (pCtx) {
    pCtx.fillStyle = '#0f172a';
    pCtx.fillRect(0, 0, 256, 512);
    pCtx.lineWidth = 10;
    pCtx.strokeStyle = '#eab308';
    pCtx.strokeRect(10, 10, 236, 492);
    pCtx.font = '900 42px "Inter", sans-serif';
    pCtx.fillStyle = '#fde047';
    pCtx.textAlign = 'center';
    pCtx.fillText('GALA', 128, 110);
    pCtx.fillText('EVENT', 128, 165);
    pCtx.font = '700 28px "Inter", sans-serif';
    pCtx.fillStyle = '#ffffff';
    pCtx.fillText('LIVE NOW', 128, 280);
    pCtx.fillText('OPEN', 128, 335);
  }

  const posterTex = new THREE.CanvasTexture(posterCanvas);
  posterTex.needsUpdate = true;
  const posterBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.46),
    new THREE.MeshBasicMaterial({ map: posterTex, side: THREE.DoubleSide })
  );
  posterBoard.position.set(0, 0.3, 0.025);
  posterGroup.add(boardFrame, posterBoard);
  buildingGroup.add(posterGroup);

  // --- 5. Sweeping Spotlight Beams ---
  const spotPositions = [-1.3, 1.3];
  spotPositions.forEach((x, index) => {
    const housing = createBox(0.22, 0.2, 0.22, materials.goldMetal);
    housing.position.set(x, 2.55, 0.9);
    buildingGroup.add(housing);

    const coneGeo = new THREE.ConeGeometry(0.6, 4.0, 16, 1, true);
    coneGeo.translate(0, 2.0, 0);
    const beam = new THREE.Mesh(coneGeo, materials.spotBeamMat);
    beam.position.set(x, 2.55, 0.9);
    beam.rotation.x = Math.PI / 6;
    beam.userData = { speed: index % 2 === 0 ? 0.8 : -0.8 };
    spotlightsGroup.push(beam);
    buildingGroup.add(beam);
  });

  // --- 6. Floating Gold Sparkles ---
  const sparkleGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
  for (let i = 0; i < 28; i++) {
    const mesh = new THREE.Mesh(sparkleGeo, materials.sparkleMat);
    mesh.position.set(
      (Math.random() - 0.5) * 3.8,
      0.6 + Math.random() * 2.4,
      (Math.random() - 0.5) * 3.8
    );
    mesh.userData = {
      baseY: mesh.position.y,
      speed: 1 + Math.random() * 2,
      offset: Math.random() * Math.PI * 2,
    };
    sparklesGroup.push(mesh);
    scene.add(mesh);
  }

  let animFrameId: number;

  function animate() {
    animFrameId = requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Gentle slow building presentation rotation
    buildingGroup.rotation.y = Math.sin(time * 0.18) * 0.12;

    // Sweeping roof spotlight beam animation
    spotlightsGroup.forEach((beam, idx) => {
      beam.rotation.z = Math.sin(time * 1.2 + idx) * 0.25;
      beam.rotation.x = Math.PI / 6 + Math.cos(time * 0.8 + idx) * 0.1;
    });

    // Animate floating gold particles
    sparklesGroup.forEach((s) => {
      s.position.y = s.userData.baseY + Math.sin(time * s.userData.speed + s.userData.offset) * 0.12;
      s.rotation.y = time * s.userData.speed;
      s.rotation.x = time * 0.5;
    });

    renderer.render(scene, camera);
  }

  animate();

  return {
    dispose: () => {
      cancelAnimationFrame(animFrameId);
      signTex.dispose();
      posterTex.dispose();
      renderer.dispose();
    },
  };
}

interface EventBuilding3DProps {
  eventTitle?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const EventBuilding3D: React.FC<EventBuilding3DProps> = ({
  eventTitle,
  width = 160,
  height = 140,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const { dispose } = setupGrandEventHallScene(canvasRef.current, width, height, eventTitle);
    return () => {
      dispose();
    };
  }, [width, height, eventTitle]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={`block pointer-events-none ${className}`}
    />
  );
};
