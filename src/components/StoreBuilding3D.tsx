import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BuildingType } from '../types';

/**
 * Builds the Tiny Little Boutique Store 3D scene (Building Option 1 - Pastel Boutique).
 */
export function setupBoutiqueStoreScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  storeTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(4.5, 3.2, 5.5);
  camera.lookAt(0, 1.3, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Lighting setup - Bright, crisp, vibrant lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
  sunLight.position.set(5, 8, 6);
  scene.add(sunLight);

  const frontFill = new THREE.DirectionalLight(0xfff1f2, 1.6);
  frontFill.position.set(0, 4, 6);
  scene.add(frontFill);

  const pinkFill = new THREE.DirectionalLight(0xf472b6, 0.7);
  pinkFill.position.set(-4, 4, -3);
  scene.add(pinkFill);

  const storeLight = new THREE.PointLight(0xffedd5, 1.8, 5.0);
  storeLight.position.set(0, 1.4, 0.2);
  scene.add(storeLight);

  const lanternL = new THREE.PointLight(0xfde047, 0.6, 2.0);
  lanternL.position.set(-0.85, 1.75, 1.25);
  scene.add(lanternL);

  const lanternR = new THREE.PointLight(0xfde047, 0.6, 2.0);
  lanternR.position.set(0.85, 1.75, 1.25);
  scene.add(lanternR);

  const materials = {
    ground: new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.8 }),
    path: new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 }),
    cobble: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 }),
    wallBase: new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.3 }),
    wallTrim: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 }),
    pinkRoof: new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.1 }),
    darkMagenta: new THREE.MeshStandardMaterial({ color: 0xbe185d, roughness: 0.4 }),
    accentGold: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.7 }),
    awningWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }),
    awningPink: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 }),
    doorWood: new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      depthWrite: false,
    }),
    interiorGlow: new THREE.MeshBasicMaterial({ color: 0xfff7ed }),
    woodShelf: new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 }),
    dressPink: new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 }),
    dressPurple: new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3 }),
    dressGold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3 }),
    leafGreen: new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 }),
    flowerPink: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 }),
    flowerYellow: new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 }),
    flowerWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
    potColor: new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.5 }),
    sparkleMat: new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9 }),
  };

  const boutiqueGroup = new THREE.Group();
  scene.add(boutiqueGroup);

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  // --- Environment ---
  const basePlatform = createBox(4.8, 0.2, 4.8, materials.ground);
  basePlatform.position.y = -0.1;
  boutiqueGroup.add(basePlatform);

  const mainPath = createBox(1.6, 0.04, 1.8, materials.path);
  mainPath.position.set(0, 0.01, 1.5);
  boutiqueGroup.add(mainPath);

  const cobblePos = [
    [-0.4, 1.1],
    [0.4, 1.1],
    [-0.2, 1.6],
    [0.3, 1.7],
    [-0.5, 2.0],
    [0.1, 2.1],
  ];
  cobblePos.forEach(([x, z]) => {
    const cobble = createBox(0.24, 0.02, 0.24, materials.cobble);
    cobble.position.set(x, 0.03, z);
    cobble.rotation.y = 0.2;
    boutiqueGroup.add(cobble);
  });

  // --- Store Building ---
  const building = new THREE.Group();
  boutiqueGroup.add(building);

  const mainWall = createBox(2.8, 2.2, 2.0, materials.wallBase);
  mainWall.position.set(0, 1.1, 0);
  building.add(mainWall);

  const foundation = createBox(2.9, 0.2, 2.1, materials.wallTrim);
  foundation.position.set(0, 0.1, 0);
  building.add(foundation);

  const colNL = createBox(0.18, 2.2, 0.18, materials.wallTrim);
  colNL.position.set(-1.38, 1.1, 0.98);
  const colNR = createBox(0.18, 2.2, 0.18, materials.wallTrim);
  colNR.position.set(1.38, 1.1, 0.98);
  const colBL = createBox(0.18, 2.2, 0.18, materials.wallTrim);
  colBL.position.set(-1.38, 1.1, -0.98);
  const colBR = createBox(0.18, 2.2, 0.18, materials.wallTrim);
  colBR.position.set(1.38, 1.1, -0.98);
  building.add(colNL, colNR, colBL, colBR);

  const doorStep = createBox(0.7, 0.1, 0.2, materials.wallTrim);
  doorStep.position.set(0, 0.1, 1.05);
  building.add(doorStep);

  const doorFrameLeft = createBox(0.08, 1.4, 0.08, materials.darkMagenta);
  doorFrameLeft.position.set(-0.34, 0.8, 1.01);
  const doorFrameRight = createBox(0.08, 1.4, 0.08, materials.darkMagenta);
  doorFrameRight.position.set(0.34, 0.8, 1.01);
  const doorFrameTop = createBox(0.76, 0.08, 0.08, materials.darkMagenta);
  doorFrameTop.position.set(0, 1.46, 1.01);
  building.add(doorFrameLeft, doorFrameRight, doorFrameTop);

  const doorPanel = createBox(0.6, 1.35, 0.05, materials.doorWood);
  doorPanel.position.set(0, 0.78, 1.0);
  const doorGlass = createBox(0.38, 0.65, 0.06, materials.glass);
  doorGlass.position.set(0, 0.95, 1.0);
  const doorHandle = createBox(0.04, 0.14, 0.08, materials.accentGold);
  doorHandle.position.set(0.22, 0.75, 1.02);
  building.add(doorPanel, doorGlass, doorHandle);

  const winLeftFrame = createBox(0.85, 1.05, 0.1, materials.wallTrim);
  winLeftFrame.position.set(-0.85, 0.95, 1.0);
  const winLeftGlass = createBox(0.75, 0.95, 0.08, materials.glass);
  winLeftGlass.position.set(-0.85, 0.95, 1.01);

  const winRightFrame = createBox(0.85, 1.05, 0.1, materials.wallTrim);
  winRightFrame.position.set(0.85, 0.95, 1.0);
  const winRightGlass = createBox(0.75, 0.95, 0.08, materials.glass);
  winRightGlass.position.set(0.85, 0.95, 1.01);

  building.add(winLeftFrame, winLeftGlass, winRightFrame, winRightGlass);

  // Awning
  const awningGroup = new THREE.Group();
  awningGroup.position.set(0, 1.6, 1.15);
  awningGroup.rotation.x = 0.25;

  const totalStripes = 11;
  const stripeWidth = 2.7 / totalStripes;
  for (let i = 0; i < totalStripes; i++) {
    const mat = i % 2 === 0 ? materials.awningPink : materials.awningWhite;
    const stripe = createBox(stripeWidth, 0.08, 0.55, mat);
    stripe.position.x = -1.35 + i * stripeWidth + stripeWidth / 2;
    awningGroup.add(stripe);

    const frill = createBox(stripeWidth - 0.01, 0.1, 0.04, mat);
    frill.position.set(stripe.position.x, -0.04, 0.26);
    awningGroup.add(frill);
  }
  building.add(awningGroup);

  // Signboard
  const signBacking = createBox(1.8, 0.45, 0.12, materials.pinkRoof);
  signBacking.position.set(0, 2.0, 1.04);
  const signTrim = createBox(1.88, 0.51, 0.08, materials.accentGold);
  signTrim.position.set(0, 2.0, 1.02);
  building.add(signBacking, signTrim);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const signCtx = signCanvas.getContext('2d');
  if (signCtx) {
    signCtx.fillStyle = '#fce7f3';
    signCtx.fillRect(0, 0, 512, 128);
    signCtx.lineWidth = 12;
    signCtx.strokeStyle = '#ec4899';
    signCtx.strokeRect(10, 10, 492, 108);
    signCtx.font = '900 44px "Inter", sans-serif';
    signCtx.fillStyle = '#be185d';
    signCtx.textAlign = 'center';
    signCtx.textBaseline = 'middle';
    const displayTitle = (storeTitle || 'PETITE BOUTIQUE').toUpperCase();
    signCtx.fillText(displayTitle.length > 20 ? displayTitle.slice(0, 18) + '...' : displayTitle, 256, 64);
  }

  const signTex = new THREE.CanvasTexture(signCanvas);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3 });
  const signBoard = createBox(1.7, 0.38, 0.02, signMat);
  signBoard.position.set(0, 2.0, 1.11);
  building.add(signBoard);

  // Golden Bow Header
  const bowCenter = createBox(0.12, 0.12, 0.1, materials.accentGold);
  bowCenter.position.set(0, 2.3, 1.08);
  const bowLoopL = createBox(0.16, 0.14, 0.08, materials.accentGold);
  bowLoopL.position.set(-0.12, 2.32, 1.08);
  bowLoopL.rotation.z = 0.3;
  const bowLoopR = createBox(0.16, 0.14, 0.08, materials.accentGold);
  bowLoopR.position.set(0.12, 2.32, 1.08);
  bowLoopR.rotation.z = -0.3;
  building.add(bowCenter, bowLoopL, bowLoopR);

  // Roof
  const roofBase = createBox(3.0, 0.25, 2.2, materials.wallTrim);
  roofBase.position.set(0, 2.25, 0);
  const roofTier1 = createBox(2.7, 0.45, 1.9, materials.pinkRoof);
  roofTier1.position.set(0, 2.5, 0);
  const roofTier2 = createBox(2.2, 0.35, 1.5, materials.darkMagenta);
  roofTier2.position.set(0, 2.8, 0);
  const roofCrest = createBox(2.3, 0.08, 1.6, materials.accentGold);
  roofCrest.position.set(0, 3.0, 0);
  building.add(roofBase, roofTier1, roofTier2, roofCrest);

  const spirePos = [
    [-1.05, 0.7],
    [1.05, 0.7],
    [-1.05, -0.7],
    [1.05, -0.7],
  ];
  spirePos.forEach(([x, z]) => {
    const spire = createBox(0.08, 0.25, 0.08, materials.accentGold);
    spire.position.set(x, 3.12, z);
    const tip = createBox(0.12, 0.12, 0.12, materials.accentGold);
    tip.position.set(x, 3.26, z);
    building.add(spire, tip);
  });

  // --- Window Displays ---
  const displays = new THREE.Group();
  boutiqueGroup.add(displays);

  const standL = createBox(0.12, 0.3, 0.12, materials.accentGold);
  standL.position.set(-0.85, 0.55, 0.7);
  const mannequinL = createBox(0.2, 0.3, 0.15, materials.wallBase);
  mannequinL.position.set(-0.85, 0.85, 0.7);
  const dressSkirtL = createBox(0.38, 0.35, 0.3, materials.dressPink);
  dressSkirtL.position.set(-0.85, 0.7, 0.7);
  const dressTopL = createBox(0.24, 0.22, 0.18, materials.dressPink);
  dressTopL.position.set(-0.85, 0.92, 0.7);
  const bowL = createBox(0.12, 0.08, 0.08, materials.accentGold);
  bowL.position.set(-0.85, 0.82, 0.8);
  displays.add(standL, mannequinL, dressSkirtL, dressTopL, bowL);

  const standR = createBox(0.12, 0.3, 0.12, materials.accentGold);
  standR.position.set(0.85, 0.55, 0.7);
  const mannequinR = createBox(0.2, 0.3, 0.15, materials.wallBase);
  mannequinR.position.set(0.85, 0.85, 0.7);
  const dressSkirtR = createBox(0.36, 0.35, 0.28, materials.dressPurple);
  dressSkirtR.position.set(0.85, 0.7, 0.7);
  const dressTopR = createBox(0.22, 0.22, 0.16, materials.dressPurple);
  dressTopR.position.set(0.85, 0.92, 0.7);

  const shelfR = createBox(0.3, 0.04, 0.18, materials.woodShelf);
  shelfR.position.set(0.65, 0.65, 0.75);
  const purse = createBox(0.1, 0.1, 0.06, materials.dressGold);
  purse.position.set(0.65, 0.72, 0.75);
  const purseStrap = createBox(0.08, 0.08, 0.02, materials.accentGold);
  purseStrap.position.set(0.65, 0.79, 0.75);
  displays.add(standR, mannequinR, dressSkirtR, dressTopR, shelfR, purse, purseStrap);

  // --- Decorations ---
  const decos = new THREE.Group();
  boutiqueGroup.add(decos);

  const boxPositions = [-0.85, 0.85];
  boxPositions.forEach((x) => {
    const planter = createBox(0.8, 0.14, 0.18, materials.potColor);
    planter.position.set(x, 0.4, 1.08);
    decos.add(planter);

    const foliage = createBox(0.76, 0.12, 0.14, materials.leafGreen);
    foliage.position.set(x, 0.48, 1.08);
    decos.add(foliage);

    for (let f = -0.3; f <= 0.3; f += 0.15) {
      const flowerMat =
        Math.abs(f) < 0.1 ? materials.flowerYellow : f < 0 ? materials.flowerPink : materials.flowerWhite;
      const flower = createBox(0.08, 0.08, 0.08, flowerMat);
      flower.position.set(x + f, 0.56, 1.08);
      decos.add(flower);
    }
  });

  const lanternPositions = [-0.85, 0.85];
  lanternPositions.forEach((x) => {
    const mount = createBox(0.04, 0.04, 0.1, materials.accentGold);
    mount.position.set(x, 1.75, 1.05);
    const lampGlass = createBox(0.1, 0.16, 0.1, materials.interiorGlow);
    lampGlass.position.set(x, 1.75, 1.12);
    const lampCap = createBox(0.14, 0.04, 0.14, materials.darkMagenta);
    lampCap.position.set(x, 1.84, 1.12);
    decos.add(mount, lampGlass, lampCap);
  });

  const potPositions = [-0.52, 0.52];
  potPositions.forEach((x) => {
    const pot = createBox(0.22, 0.28, 0.22, materials.potColor);
    pot.position.set(x, 0.14, 1.25);
    const stem = createBox(0.06, 0.25, 0.06, materials.accentGold);
    stem.position.set(x, 0.35, 1.25);
    const bushBottom = createBox(0.32, 0.32, 0.32, materials.leafGreen);
    bushBottom.position.set(x, 0.55, 1.25);
    const bushTop = createBox(0.24, 0.24, 0.24, materials.leafGreen);
    bushTop.position.set(x, 0.78, 1.25);
    decos.add(pot, stem, bushBottom, bushTop);
  });

  const aFrameGroup = new THREE.Group();
  aFrameGroup.position.set(-1.2, 0, 1.6);
  aFrameGroup.rotation.y = 0.4;
  const boardBack = createBox(0.35, 0.5, 0.04, materials.darkMagenta);
  boardBack.position.y = 0.28;

  const chalkCanvas = document.createElement('canvas');
  chalkCanvas.width = 128;
  chalkCanvas.height = 256;
  const chalkCtx = chalkCanvas.getContext('2d');
  if (chalkCtx) {
    chalkCtx.fillStyle = '#1e293b';
    chalkCtx.fillRect(0, 0, 128, 256);
    chalkCtx.font = 'bold 30px "Inter", sans-serif';
    chalkCtx.fillStyle = '#f472b6';
    chalkCtx.textAlign = 'center';
    chalkCtx.fillText('OPEN', 64, 70);
    chalkCtx.font = '22px "Inter", sans-serif';
    chalkCtx.fillStyle = '#fde047';
    chalkCtx.fillText('TRADE', 64, 130);
    chalkCtx.fillText('· SELL ·', 64, 170);
  }
  const chalkTex = new THREE.CanvasTexture(chalkCanvas);
  const chalkMat = new THREE.MeshBasicMaterial({ map: chalkTex });
  const chalkBoard = createBox(0.3, 0.44, 0.02, chalkMat);
  chalkBoard.position.set(0, 0.28, 0.025);
  aFrameGroup.add(boardBack, chalkBoard);
  decos.add(aFrameGroup);

  // Sparkles
  const sparklesGroup: THREE.Mesh[] = [];
  const sparkleGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
  for (let i = 0; i < 20; i++) {
    const mesh = new THREE.Mesh(sparkleGeo, materials.sparkleMat);
    mesh.position.set(
      (Math.random() - 0.5) * 3.5,
      0.8 + Math.random() * 2.2,
      (Math.random() - 0.5) * 3.5
    );
    mesh.userData = {
      baseY: mesh.position.y,
      speed: 1 + Math.random() * 2,
      offset: Math.random() * Math.PI * 2,
    };
    sparklesGroup.push(mesh);
    scene.add(mesh);
  }

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    boutiqueGroup.rotation.y = Math.sin(time * 0.2) * 0.12;

    sparklesGroup.forEach((s) => {
      s.position.y = s.userData.baseY + Math.sin(time * s.userData.speed + s.userData.offset) * 0.15;
      s.rotation.y = time * s.userData.speed;
      s.rotation.x = time * 0.5;
    });

    renderer.render(scene, camera);
  };

  animate();

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

/**
 * Builds the Retro Cyber Arcade & Game Exchange 3D scene (Building Option 2 - Cyber Arcade).
 */
export function setupArcadeStoreScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  storeTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(4.5, 3.2, 5.5);
  camera.lookAt(0, 1.3, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Lighting setup - Bright cyber tech lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);

  const frontFill = new THREE.DirectionalLight(0xe0f2fe, 1.6);
  frontFill.position.set(0, 4, 6);
  scene.add(frontFill);

  const cyanFill = new THREE.DirectionalLight(0x06b6d4, 0.8);
  cyanFill.position.set(-4, 4, -3);
  scene.add(cyanFill);

  const arcadeGlow = new THREE.PointLight(0xa3e635, 1.9, 5.0);
  arcadeGlow.position.set(0, 1.4, 0.2);
  scene.add(arcadeGlow);

  const lanternL = new THREE.PointLight(0x38bdf8, 0.7, 2.2);
  lanternL.position.set(-0.85, 1.75, 1.25);
  scene.add(lanternL);

  const lanternR = new THREE.PointLight(0x38bdf8, 0.7, 2.2);
  lanternR.position.set(0.85, 1.75, 1.25);
  scene.add(lanternR);

  const materials = {
    ground: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }),
    path: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }),
    cobble: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 }),
    wallBase: new THREE.MeshStandardMaterial({ color: 0x022c22, roughness: 0.3 }),
    wallTrim: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 }),
    arcadeRoof: new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.3, metalness: 0.3 }),
    darkCyber: new THREE.MeshStandardMaterial({ color: 0x041f17, roughness: 0.4 }),
    accentNeon: new THREE.MeshStandardMaterial({ color: 0xa3e635, roughness: 0.2, metalness: 0.8 }),
    accentGold: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 }),
    awningBlack: new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.3 }),
    awningEmerald: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 }),
    doorMetal: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.5 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xa7f3d0,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      depthWrite: false,
    }),
    screenGlow: new THREE.MeshBasicMaterial({ color: 0xa3e635 }),
    cabinetMat: new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.4 }),
    joystickMat: new THREE.MeshStandardMaterial({ color: 0xef4444 }),
    cartridgeMat: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }),
    leafCyber: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 }),
    potCyber: new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.4 }),
    sparkleMat: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 }),
  };

  const arcadeGroup = new THREE.Group();
  scene.add(arcadeGroup);

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  // --- Environment Platform ---
  const basePlatform = createBox(4.8, 0.2, 4.8, materials.ground);
  basePlatform.position.y = -0.1;
  arcadeGroup.add(basePlatform);

  const mainPath = createBox(1.6, 0.04, 1.8, materials.path);
  mainPath.position.set(0, 0.01, 1.5);
  arcadeGroup.add(mainPath);

  const cobblePos = [
    [-0.4, 1.1],
    [0.4, 1.1],
    [-0.2, 1.6],
    [0.3, 1.7],
    [-0.5, 2.0],
    [0.1, 2.1],
  ];
  cobblePos.forEach(([x, z]) => {
    const cobble = createBox(0.24, 0.02, 0.24, materials.cobble);
    cobble.position.set(x, 0.03, z);
    cobble.rotation.y = 0.3;
    arcadeGroup.add(cobble);
  });

  // --- Building Structure ---
  const building = new THREE.Group();
  arcadeGroup.add(building);

  const mainWall = createBox(2.8, 2.2, 2.0, materials.wallBase);
  mainWall.position.set(0, 1.1, 0);
  building.add(mainWall);

  const foundation = createBox(2.9, 0.2, 2.1, materials.wallTrim);
  foundation.position.set(0, 0.1, 0);
  building.add(foundation);

  const colNL = createBox(0.18, 2.2, 0.18, materials.wallTrim);
  colNL.position.set(-1.38, 1.1, 0.98);
  const colNR = createBox(0.18, 2.2, 0.18, materials.wallTrim);
  colNR.position.set(1.38, 1.1, 0.98);
  const colBL = createBox(0.18, 2.2, 0.18, materials.wallTrim);
  colBL.position.set(-1.38, 1.1, -0.98);
  const colBR = createBox(0.18, 2.2, 0.18, materials.wallTrim);
  colBR.position.set(1.38, 1.1, -0.98);
  building.add(colNL, colNR, colBL, colBR);

  const doorStep = createBox(0.7, 0.1, 0.2, materials.wallTrim);
  doorStep.position.set(0, 0.1, 1.05);
  building.add(doorStep);

  const doorFrameLeft = createBox(0.08, 1.4, 0.08, materials.accentNeon);
  doorFrameLeft.position.set(-0.34, 0.8, 1.01);
  const doorFrameRight = createBox(0.08, 1.4, 0.08, materials.accentNeon);
  doorFrameRight.position.set(0.34, 0.8, 1.01);
  const doorFrameTop = createBox(0.76, 0.08, 0.08, materials.accentNeon);
  doorFrameTop.position.set(0, 1.46, 1.01);
  building.add(doorFrameLeft, doorFrameRight, doorFrameTop);

  const doorPanel = createBox(0.6, 1.35, 0.05, materials.doorMetal);
  doorPanel.position.set(0, 0.78, 1.0);
  const doorGlass = createBox(0.38, 0.65, 0.06, materials.glass);
  doorGlass.position.set(0, 0.95, 1.0);
  const doorHandle = createBox(0.04, 0.14, 0.08, materials.accentNeon);
  doorHandle.position.set(0.22, 0.75, 1.02);
  building.add(doorPanel, doorGlass, doorHandle);

  const winLeftFrame = createBox(0.85, 1.05, 0.1, materials.wallTrim);
  winLeftFrame.position.set(-0.85, 0.95, 1.0);
  const winLeftGlass = createBox(0.75, 0.95, 0.08, materials.glass);
  winLeftGlass.position.set(-0.85, 0.95, 1.01);

  const winRightFrame = createBox(0.85, 1.05, 0.1, materials.wallTrim);
  winRightFrame.position.set(0.85, 0.95, 1.0);
  const winRightGlass = createBox(0.75, 0.95, 0.08, materials.glass);
  winRightGlass.position.set(0.85, 0.95, 1.01);
  building.add(winLeftFrame, winLeftGlass, winRightFrame, winRightGlass);

  // Awning
  const awningGroup = new THREE.Group();
  awningGroup.position.set(0, 1.6, 1.15);
  awningGroup.rotation.x = 0.25;

  const totalStripes = 11;
  const stripeWidth = 2.7 / totalStripes;
  for (let i = 0; i < totalStripes; i++) {
    const mat = i % 2 === 0 ? materials.awningEmerald : materials.awningBlack;
    const stripe = createBox(stripeWidth, 0.08, 0.55, mat);
    stripe.position.x = -1.35 + i * stripeWidth + stripeWidth / 2;
    awningGroup.add(stripe);

    const frill = createBox(stripeWidth - 0.01, 0.1, 0.04, mat);
    frill.position.set(stripe.position.x, -0.04, 0.26);
    awningGroup.add(frill);
  }
  building.add(awningGroup);

  // Signboard
  const signBacking = createBox(1.8, 0.45, 0.12, materials.arcadeRoof);
  signBacking.position.set(0, 2.0, 1.04);
  const signTrim = createBox(1.88, 0.51, 0.08, materials.accentNeon);
  signTrim.position.set(0, 2.0, 1.02);
  building.add(signBacking, signTrim);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const signCtx = signCanvas.getContext('2d');
  if (signCtx) {
    signCtx.fillStyle = '#022c22';
    signCtx.fillRect(0, 0, 512, 128);
    signCtx.lineWidth = 12;
    signCtx.strokeStyle = '#10b981';
    signCtx.strokeRect(10, 10, 492, 108);
    signCtx.font = '900 42px "Chakra Petch", "Arial Black", sans-serif';
    signCtx.fillStyle = '#a3e635';
    signCtx.textAlign = 'center';
    signCtx.textBaseline = 'middle';
    const displayTitle = (storeTitle || 'RETRO ARCADE & TRADE').toUpperCase();
    signCtx.fillText(displayTitle.length > 20 ? displayTitle.slice(0, 18) + '...' : displayTitle, 256, 64);
  }

  const signTex = new THREE.CanvasTexture(signCanvas);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3 });
  const signBoard = createBox(1.7, 0.38, 0.02, signMat);
  signBoard.position.set(0, 2.0, 1.11);
  building.add(signBoard);

  // Golden Arcade Star Crest
  const starCenter = createBox(0.16, 0.16, 0.1, materials.accentNeon);
  starCenter.position.set(0, 2.3, 1.08);
  const starL = createBox(0.14, 0.14, 0.08, materials.accentGold);
  starL.position.set(-0.14, 2.3, 1.08);
  const starR = createBox(0.14, 0.14, 0.08, materials.accentGold);
  starR.position.set(0.14, 2.3, 1.08);
  building.add(starCenter, starL, starR);

  // Roof
  const roofBase = createBox(3.0, 0.25, 2.2, materials.wallTrim);
  roofBase.position.set(0, 2.25, 0);
  const roofTier1 = createBox(2.7, 0.45, 1.9, materials.arcadeRoof);
  roofTier1.position.set(0, 2.5, 0);
  const roofTier2 = createBox(2.2, 0.35, 1.5, materials.darkCyber);
  roofTier2.position.set(0, 2.8, 0);
  const roofCrest = createBox(2.3, 0.08, 1.6, materials.accentNeon);
  roofCrest.position.set(0, 3.0, 0);
  building.add(roofBase, roofTier1, roofTier2, roofCrest);

  const spirePos = [
    [-1.05, 0.7],
    [1.05, 0.7],
    [-1.05, -0.7],
    [1.05, -0.7],
  ];
  spirePos.forEach(([x, z]) => {
    const spire = createBox(0.08, 0.25, 0.08, materials.accentNeon);
    spire.position.set(x, 3.12, z);
    const tip = createBox(0.12, 0.12, 0.12, materials.accentGold);
    tip.position.set(x, 3.26, z);
    building.add(spire, tip);
  });

  // --- Window Displays (Mini Arcade Machine & Retro Game Cartridges) ---
  const displays = new THREE.Group();
  arcadeGroup.add(displays);

  // Left Window: Mini Arcade Cabinet
  const cabBody = createBox(0.28, 0.5, 0.24, materials.cabinetMat);
  cabBody.position.set(-0.85, 0.75, 0.7);
  const cabScreen = createBox(0.22, 0.18, 0.04, materials.screenGlow);
  cabScreen.position.set(-0.85, 0.82, 0.83);
  const cabJoy = createBox(0.04, 0.08, 0.04, materials.joystickMat);
  cabJoy.position.set(-0.85, 0.65, 0.84);
  displays.add(cabBody, cabScreen, cabJoy);

  // Right Window: Retro Cartridges on Shelf
  const shelfR = createBox(0.4, 0.04, 0.2, materials.wallTrim);
  shelfR.position.set(0.85, 0.65, 0.7);
  const cart1 = createBox(0.1, 0.14, 0.04, materials.cartridgeMat);
  cart1.position.set(0.75, 0.74, 0.7);
  const cart2 = createBox(0.1, 0.14, 0.04, materials.cabinetMat);
  cart2.position.set(0.95, 0.74, 0.7);
  displays.add(shelfR, cart1, cart2);

  // --- Decorations & Sidewalk Sign ---
  const decos = new THREE.Group();
  arcadeGroup.add(decos);

  const lanternPositions = [-0.85, 0.85];
  lanternPositions.forEach((x) => {
    const mount = createBox(0.04, 0.04, 0.1, materials.accentNeon);
    mount.position.set(x, 1.75, 1.05);
    const lampGlass = createBox(0.1, 0.16, 0.1, materials.screenGlow);
    lampGlass.position.set(x, 1.75, 1.12);
    const lampCap = createBox(0.14, 0.04, 0.14, materials.arcadeRoof);
    lampCap.position.set(x, 1.84, 1.12);
    decos.add(mount, lampGlass, lampCap);
  });

  const potPositions = [-0.52, 0.52];
  potPositions.forEach((x) => {
    const pot = createBox(0.22, 0.28, 0.22, materials.potCyber);
    pot.position.set(x, 0.14, 1.25);
    const stem = createBox(0.06, 0.25, 0.06, materials.accentNeon);
    stem.position.set(x, 0.35, 1.25);
    const bush = createBox(0.3, 0.45, 0.3, materials.leafCyber);
    bush.position.set(x, 0.65, 1.25);
    decos.add(pot, stem, bush);
  });

  // A-Frame Sign: TRADE · BUY · SELL
  const aFrameGroup = new THREE.Group();
  aFrameGroup.position.set(-1.2, 0, 1.6);
  aFrameGroup.rotation.y = 0.4;
  const boardBack = createBox(0.35, 0.5, 0.04, materials.darkCyber);
  boardBack.position.y = 0.28;

  const chalkCanvas = document.createElement('canvas');
  chalkCanvas.width = 128;
  chalkCanvas.height = 256;
  const chalkCtx = chalkCanvas.getContext('2d');
  if (chalkCtx) {
    chalkCtx.fillStyle = '#022c22';
    chalkCtx.fillRect(0, 0, 128, 256);
    chalkCtx.font = 'bold 28px "Chakra Petch", sans-serif';
    chalkCtx.fillStyle = '#a3e635';
    chalkCtx.textAlign = 'center';
    chalkCtx.fillText('TRADE', 64, 70);
    chalkCtx.fillStyle = '#38bdf8';
    chalkCtx.fillText('SELL', 64, 120);
    chalkCtx.fillStyle = '#facc15';
    chalkCtx.fillText('SWAP!', 64, 170);
  }
  const chalkTex = new THREE.CanvasTexture(chalkCanvas);
  const chalkMat = new THREE.MeshBasicMaterial({ map: chalkTex });
  const chalkBoard = createBox(0.3, 0.44, 0.02, chalkMat);
  chalkBoard.position.set(0, 0.28, 0.025);
  aFrameGroup.add(boardBack, chalkBoard);
  decos.add(aFrameGroup);

  // Sparkles
  const sparklesGroup: THREE.Mesh[] = [];
  const sparkleGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
  for (let i = 0; i < 20; i++) {
    const mesh = new THREE.Mesh(sparkleGeo, materials.sparkleMat);
    mesh.position.set(
      (Math.random() - 0.5) * 3.5,
      0.8 + Math.random() * 2.2,
      (Math.random() - 0.5) * 3.5
    );
    mesh.userData = {
      baseY: mesh.position.y,
      speed: 1 + Math.random() * 2,
      offset: Math.random() * Math.PI * 2,
    };
    sparklesGroup.push(mesh);
    scene.add(mesh);
  }

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    arcadeGroup.rotation.y = Math.sin(time * 0.2) * 0.12;

    sparklesGroup.forEach((s) => {
      s.position.y = s.userData.baseY + Math.sin(time * s.userData.speed + s.userData.offset) * 0.15;
      s.rotation.y = time * s.userData.speed;
      s.rotation.x = time * 0.5;
    });

    renderer.render(scene, camera);
  };

  animate();

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

/**
 * Builds the 3D Tiny Halloween Shop with Interior (Building Option: Spooky Halloween Shop).
 */
export function setupSpookyStoreScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  storeTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(4.5, 3.2, 5.5);
  camera.lookAt(0, 1.3, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Spooky Night Bright Ambient Lighting - clearly illuminated
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  // Key Light
  const moonLight = new THREE.DirectionalLight(0xffffff, 2.2);
  moonLight.position.set(-5, 8, 4);
  scene.add(moonLight);

  // Front Fill Light
  const frontFill = new THREE.DirectionalLight(0xfef08a, 1.6);
  frontFill.position.set(0, 4, 6);
  scene.add(frontFill);

  // Interior Main Chandelier Ceiling Light (Warm Glow filling interior)
  const interiorChandelierLight = new THREE.PointLight(0xffb84d, 3.2, 5.5);
  interiorChandelierLight.position.set(0, 1.4, 0);
  scene.add(interiorChandelierLight);

  // Interior Crystal Ball Glowing Point Light
  const crystalBallLight = new THREE.PointLight(0xc084fc, 2.2, 3.0);
  crystalBallLight.position.set(0.35, 0.8, 0.2);
  scene.add(crystalBallLight);

  // Interior Back Shelf Magic Glow
  const shelfGlowLight = new THREE.PointLight(0x34d399, 1.8, 2.5);
  shelfGlowLight.position.set(-0.35, 1.0, -0.5);
  scene.add(shelfGlowLight);

  // Warm Front Window Light
  const windowLight = new THREE.PointLight(0xff9900, 2.0, 3.5);
  windowLight.position.set(-0.42, 0.75, 0.6);
  scene.add(windowLight);

  // Green Cauldron Light
  const cauldronLight = new THREE.PointLight(0x22c55e, 2.5, 3.0);
  cauldronLight.position.set(-1.1, 0.45, 1.2);
  scene.add(cauldronLight);

  // Spooky Halloween Palette & Interior Materials
  const materials = {
    // Exterior Building & Trim
    wallPurple: new THREE.MeshStandardMaterial({ color: 0x2e1a47, roughness: 0.6 }),
    wallPurpleDark: new THREE.MeshStandardMaterial({ color: 0x1f1131, roughness: 0.7 }),
    timberDark: new THREE.MeshStandardMaterial({ color: 0x181024, roughness: 0.8 }),
    roofTile: new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.4 }),
    stoneFoundation: new THREE.MeshStandardMaterial({ color: 0x332940, roughness: 0.9 }),
    doorWood: new THREE.MeshStandardMaterial({ color: 0x4a1525, roughness: 0.5 }),

    // Interior Materials
    interiorFloor: new THREE.MeshStandardMaterial({ color: 0x3d2150, roughness: 0.7 }),
    interiorWall: new THREE.MeshStandardMaterial({ color: 0x582c7e, roughness: 0.8 }),
    woodFurniture: new THREE.MeshStandardMaterial({ color: 0x5a2d16, roughness: 0.6 }),
    woodFurnitureDark: new THREE.MeshStandardMaterial({ color: 0x3d1a0a, roughness: 0.7 }),
    carpetPurple: new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.9 }),

    // Glass & Clear Windows
    windowGlass: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      visible: false,
    }),
    doorGlass: new THREE.MeshStandardMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      depthWrite: false,
    }),

    // Awning & Accents
    awningOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 }),
    awningBlack: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 }),
    goldAccent: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 }),

    // Props & Potions
    pumpkinOrange: new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 }),
    pumpkinStem: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 }),
    cauldronBlack: new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3, metalness: 0.5 }),
    potionGreen: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
    potionRed: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    potionBlue: new THREE.MeshBasicMaterial({ color: 0x3b82f6 }),
    potionPurple: new THREE.MeshBasicMaterial({ color: 0xa855f7 }),
    crystalGlow: new THREE.MeshBasicMaterial({ color: 0xd8b4fe }),
    ghostWhite: new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.85 }),
    skullWhite: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 }),

    // Glows & Lights
    windowGlow: new THREE.MeshBasicMaterial({ color: 0xfde047 }),
    jackGlow: new THREE.MeshBasicMaterial({ color: 0xffa500 }),

    // Ground & Cobblestone
    groundBase: new THREE.MeshStandardMaterial({ color: 0x110c1f, roughness: 0.9 }),
    cobbleStone: new THREE.MeshStandardMaterial({ color: 0x272036, roughness: 0.8 }),
  };

  const shopGroup = new THREE.Group();
  shopGroup.scale.set(1.26, 1.26, 1.26);
  scene.add(shopGroup);

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  // 1. Ground & Cobblestone
  const base = createBox(3.8, 0.16, 3.8, materials.groundBase);
  base.position.y = -0.08;
  shopGroup.add(base);

  const stones: [number, number, number, number, number, number][] = [
    [0, 0.01, 1.1, 0.6, 0.02, 0.5],
    [-0.3, 0.01, 1.4, 0.4, 0.02, 0.3],
    [0.2, 0.01, 1.5, 0.45, 0.02, 0.35],
    [-0.1, 0.01, 1.8, 0.5, 0.02, 0.4],
  ];
  stones.forEach(([x, y, z, w, h, d]) => {
    const tile = createBox(w, h, d, materials.cobbleStone);
    tile.position.set(x, y, z);
    shopGroup.add(tile);
  });

  // 2. Hollow Building Structure
  const foundation = createBox(2.2, 0.3, 2.0, materials.stoneFoundation);
  foundation.position.set(0, 0.15, 0);
  shopGroup.add(foundation);

  const interiorFloor = createBox(1.88, 0.04, 1.68, materials.interiorFloor);
  interiorFloor.position.set(0, 0.32, 0);
  shopGroup.add(interiorFloor);

  const backWall = createBox(2.0, 1.48, 0.1, materials.interiorWall);
  backWall.position.set(0, 1.05, -0.85);
  shopGroup.add(backWall);

  const rightWall = createBox(0.1, 1.48, 1.8, materials.interiorWall);
  rightWall.position.set(0.95, 1.05, 0);
  shopGroup.add(rightWall);

  // Left Wall with cutout for interior view
  const leftWallBot = createBox(0.1, 0.5, 1.8, materials.interiorWall);
  leftWallBot.position.set(-0.95, 0.56, 0);
  const leftWallTop = createBox(0.1, 0.4, 1.8, materials.interiorWall);
  leftWallTop.position.set(-0.95, 1.59, 0);
  const leftWallFrontPillar = createBox(0.1, 0.63, 0.5, materials.interiorWall);
  leftWallFrontPillar.position.set(-0.95, 1.11, 0.65);
  const leftWallBackPillar = createBox(0.1, 0.63, 0.5, materials.interiorWall);
  leftWallBackPillar.position.set(-0.95, 1.11, -0.65);
  shopGroup.add(leftWallBot, leftWallTop, leftWallFrontPillar, leftWallBackPillar);

  // Front Wall Sections
  const frontWallTop = createBox(2.0, 0.42, 0.1, materials.interiorWall);
  frontWallTop.position.set(0, 1.58, 0.85);
  const frontWallBot = createBox(2.0, 0.36, 0.1, materials.interiorWall);
  frontWallBot.position.set(0, 0.48, 0.85);
  const frontWallMidPillar = createBox(0.16, 0.74, 0.1, materials.interiorWall);
  frontWallMidPillar.position.set(0.08, 1.03, 0.85);
  const frontWallLeftPillar = createBox(0.16, 0.74, 0.1, materials.interiorWall);
  frontWallLeftPillar.position.set(-0.92, 1.03, 0.85);
  const frontWallRightPillar = createBox(0.16, 0.74, 0.1, materials.interiorWall);
  frontWallRightPillar.position.set(0.92, 1.03, 0.85);
  shopGroup.add(frontWallTop, frontWallBot, frontWallMidPillar, frontWallLeftPillar, frontWallRightPillar);

  // Timber Frame Corner Posts
  const posts = [
    [-0.98, 0.88],
    [0.98, 0.88],
    [-0.98, -0.88],
    [0.98, -0.88],
  ];
  posts.forEach(([x, z]) => {
    const post = createBox(0.12, 1.52, 0.12, materials.timberDark);
    post.position.set(x, 1.05, z);
    shopGroup.add(post);
  });

  // Pointy Spooky Roof
  for (let i = 0; i < 7; i++) {
    const w = 2.3 - i * 0.28;
    const d = 2.1 - i * 0.26;
    const layer = createBox(w, 0.16, d, materials.roofTile);
    layer.position.set(0, 1.88 + i * 0.15, 0);
    shopGroup.add(layer);
  }

  // Chimney
  const chimney = createBox(0.3, 0.7, 0.3, materials.stoneFoundation);
  chimney.position.set(0.6, 2.4, -0.3);
  shopGroup.add(chimney);

  // Precision Door Frame & Side Jambs
  const doorJambLeft = createBox(0.06, 1.03, 0.12, materials.timberDark);
  doorJambLeft.position.set(0.18, 0.855, 0.85);
  const doorJambRight = createBox(0.06, 1.03, 0.12, materials.timberDark);
  doorJambRight.position.set(0.8, 0.855, 0.85);
  const doorJambTop = createBox(0.68, 0.06, 0.12, materials.timberDark);
  doorJambTop.position.set(0.49, 1.34, 0.85);
  const doorStep = createBox(0.68, 0.04, 0.14, materials.cobbleStone);
  doorStep.position.set(0.49, 0.33, 0.85);
  shopGroup.add(doorJambLeft, doorJambRight, doorJambTop, doorStep);

  // Door Group
  const doorGroup = new THREE.Group();
  doorGroup.position.set(0.21, 0.835, 0.91);
  const doorBottom = createBox(0.55, 0.55, 0.05, materials.doorWood);
  doorBottom.position.set(0.275, -0.2, 0);
  const doorTopHeader = createBox(0.55, 0.12, 0.05, materials.doorWood);
  doorTopHeader.position.set(0.275, 0.41, 0);
  const doorSideLeft = createBox(0.14, 0.28, 0.05, materials.doorWood);
  doorSideLeft.position.set(0.07, 0.21, 0);
  const doorSideRight = createBox(0.14, 0.28, 0.05, materials.doorWood);
  doorSideRight.position.set(0.48, 0.21, 0);
  const smallWindowFrame = createBox(0.27, 0.28, 0.06, materials.timberDark);
  smallWindowFrame.position.set(0.275, 0.21, 0);
  const smallWindowGlass = createBox(0.23, 0.24, 0.02, materials.doorGlass);
  smallWindowGlass.position.set(0.275, 0.21, 0);
  const knobOuter = createBox(0.06, 0.06, 0.06, materials.goldAccent);
  knobOuter.position.set(0.48, -0.05, 0.035);
  const knobInner = createBox(0.06, 0.06, 0.06, materials.goldAccent);
  knobInner.position.set(0.48, -0.05, -0.035);
  const hingeTop = createBox(0.02, 0.08, 0.06, materials.goldAccent);
  hingeTop.position.set(0.01, 0.32, 0);
  const hingeBottom = createBox(0.02, 0.08, 0.06, materials.goldAccent);
  hingeBottom.position.set(0.01, -0.32, 0);

  doorGroup.add(
    doorBottom,
    doorTopHeader,
    doorSideLeft,
    doorSideRight,
    smallWindowFrame,
    smallWindowGlass,
    knobOuter,
    knobInner,
    hingeTop,
    hingeBottom
  );
  shopGroup.add(doorGroup);

  // 3. Interior Furniture
  const rug = createBox(0.9, 0.01, 0.9, materials.carpetPurple);
  rug.position.set(-0.1, 0.34, 0.05);
  shopGroup.add(rug);

  const counterBase = createBox(0.65, 0.48, 0.32, materials.woodFurniture);
  counterBase.position.set(0.42, 0.56, 0.22);
  const counterTop = createBox(0.72, 0.04, 0.38, materials.woodFurnitureDark);
  counterTop.position.set(0.42, 0.81, 0.22);
  shopGroup.add(counterBase, counterTop);

  const crystalStand = createBox(0.1, 0.06, 0.1, materials.goldAccent);
  crystalStand.position.set(0.35, 0.85, 0.22);
  const crystalOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    materials.crystalGlow
  );
  crystalOrb.position.set(0.35, 0.96, 0.22);
  shopGroup.add(crystalStand, crystalOrb);

  const ledger = createBox(0.18, 0.04, 0.14, materials.doorWood);
  ledger.position.set(0.55, 0.84, 0.22);
  ledger.rotation.y = -0.25;
  shopGroup.add(ledger);

  const stoolSeat = createBox(0.22, 0.04, 0.22, materials.woodFurnitureDark);
  stoolSeat.position.set(0.45, 0.62, -0.25);
  const stoolLeg = createBox(0.14, 0.26, 0.14, materials.woodFurniture);
  stoolLeg.position.set(0.45, 0.47, -0.25);
  shopGroup.add(stoolSeat, stoolLeg);

  // Large Back Wall Bookcase / Potion Shelving
  const shelfFrame = createBox(0.95, 1.1, 0.22, materials.woodFurniture);
  shelfFrame.position.set(-0.32, 0.89, -0.72);
  shopGroup.add(shelfFrame);

  [-0.2, 0.15, 0.45].forEach((yOffset) => {
    const board = createBox(0.91, 0.03, 0.2, materials.woodFurnitureDark);
    board.position.set(-0.32, 0.89 + yOffset, -0.71);
    shopGroup.add(board);
  });

  const potionColors = [
    materials.potionRed,
    materials.potionGreen,
    materials.potionBlue,
    materials.potionPurple,
    materials.awningOrange,
  ];
  for (let row = 0; row < 3; row++) {
    const yPos = 0.73 + row * 0.3;
    for (let col = 0; col < 4; col++) {
      const xPos = -0.62 + col * 0.2;
      const mat = potionColors[(row + col) % potionColors.length];
      const potion = createBox(0.06, 0.12, 0.06, mat);
      potion.position.set(xPos, yPos + 0.06, -0.71);
      shopGroup.add(potion);
    }
  }

  const skull1 = createBox(0.1, 0.09, 0.1, materials.skullWhite);
  skull1.position.set(-0.62, 1.38, -0.71);
  const skull2 = createBox(0.1, 0.09, 0.1, materials.skullWhite);
  skull2.position.set(-0.2, 1.38, -0.71);
  shopGroup.add(skull1, skull2);

  // Center Display Table
  const centerTableTop = createBox(0.45, 0.04, 0.45, materials.woodFurnitureDark);
  centerTableTop.position.set(-0.3, 0.62, 0.1);
  const centerTableLeg = createBox(0.12, 0.26, 0.12, materials.woodFurniture);
  centerTableLeg.position.set(-0.3, 0.47, 0.1);
  const tableHat = createBox(0.18, 0.16, 0.18, materials.roofTile);
  tableHat.position.set(-0.3, 0.72, 0.1);
  shopGroup.add(centerTableTop, centerTableLeg, tableHat);

  // Hanging Interior Chandelier
  const chain = createBox(0.02, 0.25, 0.02, materials.goldAccent);
  chain.position.set(0, 1.62, 0);
  const lanternFrame = createBox(0.16, 0.2, 0.16, materials.timberDark);
  lanternFrame.position.set(0, 1.4, 0);
  const lanternGlow = createBox(0.1, 0.14, 0.1, materials.windowGlow);
  lanternGlow.position.set(0, 1.4, 0);
  shopGroup.add(chain, lanternFrame, lanternGlow);

  // 4. Awning & Sign
  const awningGroup = new THREE.Group();
  awningGroup.position.set(-0.42, 1.25, 0.95);
  for (let i = 0; i < 6; i++) {
    const isOrange = i % 2 === 0;
    const stripe = createBox(0.14, 0.08, 0.42, isOrange ? materials.awningOrange : materials.awningBlack);
    stripe.position.set((i - 2.5) * 0.14, 0, 0.18);
    stripe.rotation.x = 0.35;
    awningGroup.add(stripe);
  }
  shopGroup.add(awningGroup);

  // Sign with dynamic store name
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const ctx = signCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1c0f30';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 16;
    ctx.strokeRect(12, 12, 1000, 232);

    ctx.fillStyle = '#ea580c';
    ctx.font = '900 78px "Chakra Petch", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 15;
    const displayTitle = (storeTitle || 'SPOOKY SHOP').toUpperCase();
    ctx.fillText(displayTitle, 512, 128);

    const signTexture = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture });

    const signBacking = createBox(1.5, 0.38, 0.08, materials.timberDark);
    signBacking.position.set(0, 1.62, 0.96);

    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.32), signMat);
    signMesh.position.set(0, 1.62, 1.01);
    shopGroup.add(signBacking, signMesh);
  }

  const bulbPositions = [-0.68, -0.34, 0, 0.34, 0.68];
  bulbPositions.forEach((x) => {
    const bulbTop = createBox(0.05, 0.05, 0.05, materials.windowGlow);
    bulbTop.position.set(x, 1.83, 1.02);
    const bulbBot = createBox(0.05, 0.05, 0.05, materials.windowGlow);
    bulbBot.position.set(x, 1.41, 1.02);
    shopGroup.add(bulbTop, bulbBot);
  });

  // 5. Window Displays
  const windowSill = createBox(0.88, 0.06, 0.16, materials.timberDark);
  windowSill.position.set(-0.42, 0.68, 0.92);
  const potion1 = createBox(0.07, 0.12, 0.07, materials.potionGreen);
  potion1.position.set(-0.72, 0.77, 0.92);
  const potion2 = createBox(0.06, 0.1, 0.06, materials.awningOrange);
  potion2.position.set(-0.64, 0.76, 0.92);
  const spellBook = createBox(0.16, 0.05, 0.12, materials.doorWood);
  spellBook.position.set(-0.16, 0.74, 0.92);
  spellBook.rotation.y = -0.2;
  shopGroup.add(windowSill, potion1, potion2, spellBook);

  // 6. Outdoor Decor
  const cauldronBase = createBox(0.42, 0.38, 0.42, materials.cauldronBlack);
  cauldronBase.position.set(-1.1, 0.22, 1.2);
  const cauldronLiquid = createBox(0.36, 0.04, 0.36, materials.potionGreen);
  cauldronLiquid.position.set(-1.1, 0.38, 1.2);
  shopGroup.add(cauldronBase, cauldronLiquid);

  // Jack-o'-Lanterns
  function addJackOLantern(x: number, y: number, z: number, size: number) {
    const pumpkin = new THREE.Group();
    pumpkin.position.set(x, y, z);
    const body = createBox(size, size * 0.85, size, materials.pumpkinOrange);
    const stem = createBox(size * 0.2, size * 0.3, size * 0.2, materials.pumpkinStem);
    stem.position.y = size * 0.5;
    const eyeL = createBox(size * 0.22, size * 0.22, 0.02, materials.jackGlow);
    eyeL.position.set(-size * 0.22, size * 0.12, size * 0.51);
    const eyeR = createBox(size * 0.22, size * 0.22, 0.02, materials.jackGlow);
    eyeR.position.set(size * 0.22, size * 0.12, size * 0.51);
    const mouth = createBox(size * 0.5, size * 0.12, 0.02, materials.jackGlow);
    mouth.position.set(0, -size * 0.18, size * 0.51);
    pumpkin.add(body, stem, eyeL, eyeR, mouth);
    shopGroup.add(pumpkin);
  }
  addJackOLantern(-0.55, 0.15, 1.3, 0.26);
  addJackOLantern(0.9, 0.13, 1.25, 0.22);

  const broomStick = createBox(0.04, 0.9, 0.04, materials.doorWood);
  broomStick.position.set(0.92, 0.5, 0.92);
  broomStick.rotation.z = -0.22;
  broomStick.rotation.x = -0.15;
  const broomBristles = createBox(0.12, 0.25, 0.12, materials.goldAccent);
  broomBristles.position.set(1.01, 0.16, 0.98);
  broomBristles.rotation.z = -0.22;
  shopGroup.add(broomStick, broomBristles);

  const tombstone = createBox(0.24, 0.35, 0.08, materials.cobbleStone);
  tombstone.position.set(-1.25, 0.18, 0.3);
  tombstone.rotation.y = 0.3;
  shopGroup.add(tombstone);

  // 7. Floating Particles (Ghosts & Cauldron Bubbles)
  const particleGroup: THREE.Object3D[] = [];
  for (let i = 0; i < 6; i++) {
    const ghostGroup = new THREE.Group();
    const body = createBox(0.12, 0.18, 0.12, materials.ghostWhite);
    const eye1 = createBox(0.03, 0.04, 0.02, materials.awningBlack);
    eye1.position.set(-0.03, 0.04, 0.065);
    const eye2 = createBox(0.03, 0.04, 0.02, materials.awningBlack);
    eye2.position.set(0.03, 0.04, 0.065);
    ghostGroup.add(body, eye1, eye2);
    ghostGroup.position.set(
      (Math.random() - 0.5) * 2.8,
      1.2 + Math.random() * 1.5,
      (Math.random() - 0.5) * 2.8
    );
    ghostGroup.userData = {
      speedY: 0.3 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
    };
    particleGroup.push(ghostGroup);
    shopGroup.add(ghostGroup);
  }

  for (let i = 0; i < 5; i++) {
    const bubble = createBox(0.05, 0.05, 0.05, materials.potionGreen);
    bubble.position.set(
      -1.1 + (Math.random() - 0.5) * 0.25,
      0.42 + Math.random() * 0.3,
      1.2 + (Math.random() - 0.5) * 0.25
    );
    bubble.userData = {
      isBubble: true,
      speedY: 0.2 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
    };
    particleGroup.push(bubble);
    shopGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Gentle storefront presentation sway
    shopGroup.rotation.y = Math.sin(time * 0.2) * 0.12;

    // Window candle light flicker
    windowLight.intensity = 2.0 + Math.sin(time * 8.0) * 0.3 + Math.cos(time * 12.0) * 0.2;

    // Interior Chandelier warmth pulsing
    interiorChandelierLight.intensity = 3.0 + Math.sin(time * 3.0) * 0.25;

    // Crystal Ball Magic Glow pulsation
    crystalBallLight.intensity = 2.0 + Math.sin(time * 6.0) * 0.6;

    // Cauldron bubbling light pulse
    cauldronLight.intensity = 2.2 + Math.sin(time * 10.0) * 0.5;

    // Animate particles (Ghosts bobbing & Cauldron bubbles rising)
    particleGroup.forEach((p) => {
      if (p.userData.isBubble) {
        p.position.y += p.userData.speedY * 0.005;
        if (p.position.y > 0.8) {
          p.position.y = 0.42;
          p.position.x = -1.1 + (Math.random() - 0.5) * 0.25;
          p.position.z = 1.2 + (Math.random() - 0.5) * 0.25;
        }
      } else {
        p.position.y += Math.sin(time * 2.0 + p.userData.offset) * 0.003;
        p.position.x += Math.cos(time * 1.5 + p.userData.offset) * 0.003;
        p.rotation.y = Math.sin(time * 1.2 + p.userData.offset) * 0.3;
      }
    });

    renderer.render(scene, camera);
  };

  animate();

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

// Global Building Thumbnail Cache to prevent WebGL context exhaustion on mobile
export const storeThumbnailCache = new Map<string, string>();
const storeThumbnailListeners = new Set<() => void>();
const storeThumbnailQueue: BuildingType[] = [];
let isStoreThumbnailQueueRunning = false;

// Preload cached thumbnails from sessionStorage if available
if (typeof window !== 'undefined') {
  try {
    const keys: BuildingType[] = [
      'boutique',
      'girly_spooky',
      'spooky_shop',
      'arcade',
      'girly_kiosk',
      'boy_kiosk',
      'medium_store',
      'sketch_store',
      'cyber_tower',
    ];
    keys.forEach((k) => {
      const saved = sessionStorage.getItem('store_thumb_' + k);
      if (saved && saved.length > 300) {
        storeThumbnailCache.set(k, saved);
      }
    });
  } catch (_) {}
}

function requestStoreThumbnail(bType: BuildingType) {
  if (storeThumbnailCache.has(bType)) return;
  if (!storeThumbnailQueue.includes(bType)) {
    storeThumbnailQueue.push(bType);
  }
  processStoreThumbnailQueue();
}

function createSceneForBuilding(bType: BuildingType, canvas: HTMLCanvasElement, width: number, height: number, title?: string) {
  switch (bType) {
    case 'sketch_store':
      return setupSketchStoreScene(canvas, width, height, title);
    case 'cyber_tower':
      return setupCyberTowerStoreScene(canvas, width, height, title);
    case 'medium_store':
      return setupMediumFormatStoreScene(canvas, width, height, title);
    case 'boy_kiosk':
      return setupBoyKioskStoreScene(canvas, width, height, title);
    case 'girly_kiosk':
      return setupGirlyKioskStoreScene(canvas, width, height, title);
    case 'girly_spooky':
      return setupGirlySpookyStoreScene(canvas, width, height, title);
    case 'spooky_shop':
      return setupSpookyStoreScene(canvas, width, height, title);
    case 'boutique':
      return setupBoutiqueStoreScene(canvas, width, height, title);
    case 'arcade':
    default:
      return setupArcadeStoreScene(canvas, width, height, title);
  }
}

async function processStoreThumbnailQueue() {
  if (isStoreThumbnailQueueRunning) return;
  isStoreThumbnailQueueRunning = true;

  while (storeThumbnailQueue.length > 0) {
    const b = storeThumbnailQueue.shift();
    if (!b || storeThumbnailCache.has(b)) continue;

    try {
      if (typeof document !== 'undefined') {
        const offscreen = document.createElement('canvas');
        offscreen.width = 180;
        offscreen.height = 140;
        offscreen.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);

        const instance = createSceneForBuilding(b, offscreen, 180, 140, '');
        const dataUrl = offscreen.toDataURL('image/png');
        if (dataUrl && dataUrl.length > 300) {
          storeThumbnailCache.set(b, dataUrl);
          try {
            sessionStorage.setItem('store_thumb_' + b, dataUrl);
          } catch (_) {}
        }

        instance.dispose();
        try {
          const gl = instance.renderer?.getContext();
          gl?.getExtension('WEBGL_lose_context')?.loseContext();
        } catch (_) {}

        storeThumbnailListeners.forEach((cb) => cb());
      }
    } catch (err) {
      console.warn('Store thumbnail generator notice:', err);
    }

    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  isStoreThumbnailQueueRunning = false;
}

export function getBuildingThemeMeta(bType: BuildingType) {
  switch (bType) {
    case 'boutique':
      return { label: 'Pink Boutique', emoji: '🌸', color: '#ec4899', bg: 'from-pink-950/60 to-[#0c040d]' };
    case 'girly_spooky':
      return { label: 'Girly Spooky', emoji: '🎀', color: '#f43f5e', bg: 'from-rose-950/60 to-[#12091c]' };
    case 'spooky_shop':
      return { label: 'Spooky Shop', emoji: '🎃', color: '#f97316', bg: 'from-orange-950/60 to-[#170a04]' };
    case 'arcade':
      return { label: 'Cyber Arcade', emoji: '🕹️', color: '#06b6d4', bg: 'from-cyan-950/60 to-[#041019]' };
    case 'girly_kiosk':
      return { label: 'Girly Kiosk', emoji: '🧋', color: '#f472b6', bg: 'from-pink-950/60 to-[#0e040c]' };
    case 'boy_kiosk':
      return { label: 'Gamer Kiosk', emoji: '⚡', color: '#3b82f6', bg: 'from-blue-950/60 to-[#04091a]' };
    case 'medium_store':
      return { label: 'Voxel Store', emoji: '🏪', color: '#10b981', bg: 'from-emerald-950/60 to-[#02130b]' };
    case 'sketch_store':
      return { label: 'Sketch Store', emoji: '✏️', color: '#a855f7', bg: 'from-purple-950/60 to-[#0f041b]' };
    case 'cyber_tower':
      return { label: 'Cyber Tower', emoji: '🏙️', color: '#38bdf8', bg: 'from-sky-950/60 to-[#03111f]' };
    default:
      return { label: 'Store Building', emoji: '🏬', color: '#84cc16', bg: 'from-lime-950/60 to-[#061205]' };
  }
}

interface StoreBuilding3DProps {
  buildingType: BuildingType;
  storeTitle?: string;
  width?: number;
  height?: number;
  className?: string;
  isLive?: boolean;
  onClick?: () => void;
}

export const StoreBuilding3D: React.FC<StoreBuilding3DProps> = ({
  buildingType = 'boutique',
  storeTitle,
  width = 160,
  height = 150,
  className = '',
  isLive = true,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasContextLost, setHasContextLost] = useState(false);
  const [, setRerender] = useState(0);

  // Subscribe to thumbnail generation if not live
  useEffect(() => {
    if (isLive) return;
    if (!storeThumbnailCache.has(buildingType)) {
      requestStoreThumbnail(buildingType);
      const listener = () => setRerender((r) => r + 1);
      storeThumbnailListeners.add(listener);
      return () => {
        storeThumbnailListeners.delete(listener);
      };
    }
  }, [buildingType, isLive]);

  // When live, maintain WebGL scene with context loss recovery
  useEffect(() => {
    if (!isLive) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    let disposeFn: (() => void) | null = null;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setHasContextLost(true);
    };

    const handleContextRestored = () => {
      setHasContextLost(false);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    try {
      const instance = createSceneForBuilding(buildingType, canvas, width, height, storeTitle);
      disposeFn = instance.dispose;

      // Capture rendered frame into thumbnail cache so fallback is always fresh
      const timer = setTimeout(() => {
        try {
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl && dataUrl.length > 300) {
              storeThumbnailCache.set(buildingType, dataUrl);
              sessionStorage.setItem('store_thumb_' + buildingType, dataUrl);
            }
          }
        } catch (_) {}
      }, 250);

      return () => {
        clearTimeout(timer);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
        if (disposeFn) disposeFn();
      };
    } catch (err) {
      console.warn('StoreBuilding3D WebGL init caught error:', err);
      setHasContextLost(true);
    }
  }, [buildingType, storeTitle, width, height, isLive]);

  const thumbnail = storeThumbnailCache.get(buildingType);
  const theme = getBuildingThemeMeta(buildingType);

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center select-none cursor-pointer group ${className}`}
      style={{ width }}
    >
      <div className="relative" style={{ width, height }}>
        {isLive && !hasContextLost ? (
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={theme.label}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
            className="pointer-events-none select-none transition-transform group-hover:scale-105 duration-300"
          />
        ) : (
          <div
            className={`w-full h-full rounded-lg bg-gradient-to-b ${theme.bg} flex flex-col items-center justify-center p-2 text-center border border-white/10`}
          >
            <span className="text-3xl animate-bounce">{theme.emoji}</span>
            <span className="text-[11px] font-display font-bold mt-1 text-white tracking-wide">
              {theme.label}
            </span>
            <div className="mt-1 w-4 h-4 rounded-full border border-dashed border-white/40 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Builds the 3D Girly Spooky Shop scene (Kawaii Spooky Shop with pastel pumpkins, pink cauldron, and blushing ghosts).
 */
export function setupGirlySpookyStoreScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  storeTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(4.5, 3.2, 5.5);
  camera.lookAt(0, 1.3, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Girly Spooky Theme Palette & Interior Materials
  const materials = {
    // Exterior Building & Trim
    wallPink: new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.5 }), // Vibrant pink
    wallLavender: new THREE.MeshStandardMaterial({ color: 0x9d4edd, roughness: 0.6 }), // Soft spooky purple
    trimMagenta: new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.7 }), // Deep dark magenta timber
    roofTile: new THREE.MeshStandardMaterial({ color: 0x701a75, roughness: 0.4 }), // Pastel goth purple roof
    stoneFoundation: new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.9 }),
    doorWood: new THREE.MeshStandardMaterial({ color: 0xbe185d, roughness: 0.5 }),

    // Interior Materials
    interiorFloor: new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.6 }),
    interiorWall: new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.7 }),
    woodFurniture: new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.6 }),
    woodFurnitureDark: new THREE.MeshStandardMaterial({ color: 0x500724, roughness: 0.7 }),
    carpetPinkStar: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.8 }),

    // Door Glass Pane
    doorGlass: new THREE.MeshStandardMaterial({
      color: 0xfbcfe8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      depthWrite: false,
    }),

    // Awning & Accents
    awningPink: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 }),
    awningWhite: new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.4 }),
    goldAccent: new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.2, metalness: 0.8 }),
    bowPink: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 }),

    // Girly Props & Potions
    pumpkinPastelPink: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 }),
    pumpkinPastelLilac: new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.4 }),
    pumpkinStem: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 }),
    cauldronPink: new THREE.MeshStandardMaterial({ color: 0x31103f, roughness: 0.3, metalness: 0.6 }),
    potionPink: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
    potionMint: new THREE.MeshBasicMaterial({ color: 0x34d399 }),
    potionCyan: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    potionPurple: new THREE.MeshBasicMaterial({ color: 0xc084fc }),
    crystalGlow: new THREE.MeshBasicMaterial({ color: 0xfbcfe8 }),
    ghostWhite: new THREE.MeshBasicMaterial({ color: 0xfff1f2, transparent: true, opacity: 0.88 }),
    ghostBlush: new THREE.MeshBasicMaterial({ color: 0xf472b6 }),
    skullWhite: new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 }),

    // Glows & Lights
    windowGlow: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    jackGlowPink: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),

    // Ground & Cobblestone
    groundBase: new THREE.MeshStandardMaterial({ color: 0x1e112a, roughness: 0.9 }),
    cobbleStone: new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.8 }),
  };

  // Girly Spooky Night Ambient Lighting - bright and vivid
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  // Cool Lavender Key Light
  const moonLight = new THREE.DirectionalLight(0xffffff, 2.2);
  moonLight.position.set(-5, 8, 4);
  scene.add(moonLight);

  // Front Fill Light
  const frontFill = new THREE.DirectionalLight(0xfff7ed, 1.6);
  frontFill.position.set(0, 4, 6);
  scene.add(frontFill);

  // Interior Main Chandelier Ceiling Light
  const interiorChandelierLight = new THREE.PointLight(0xfca5a5, 3.5, 5.5);
  interiorChandelierLight.position.set(0, 1.4, 0);
  scene.add(interiorChandelierLight);

  // Interior Crystal Ball Glowing Rose Light
  const crystalBallLight = new THREE.PointLight(0xf472b6, 2.8, 3.0);
  crystalBallLight.position.set(0.35, 0.8, 0.2);
  scene.add(crystalBallLight);

  // Interior Back Shelf Magic Mint Glow
  const shelfGlowLight = new THREE.PointLight(0x34d399, 2.0, 2.5);
  shelfGlowLight.position.set(-0.35, 1.0, -0.5);
  scene.add(shelfGlowLight);

  // Warm Window Front Light
  const windowLight = new THREE.PointLight(0xfbebe8, 2.2, 3.5);
  windowLight.position.set(-0.42, 0.75, 0.6);
  scene.add(windowLight);

  // Pink Cauldron Light
  const cauldronLight = new THREE.PointLight(0xf43f5e, 2.8, 3.0);
  cauldronLight.position.set(-1.1, 0.45, 1.2);
  scene.add(cauldronLight);

  const shopGroup = new THREE.Group();
  shopGroup.scale.set(1.26, 1.26, 1.26);
  scene.add(shopGroup);

  // Helper box creator
  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  // --- Ground & Cobblestone ---
  const base = createBox(3.8, 0.16, 3.8, materials.groundBase);
  base.position.y = -0.08;
  shopGroup.add(base);

  const stones = [
    [0, 0.01, 1.1, 0.6, 0.02, 0.5],
    [-0.3, 0.01, 1.4, 0.4, 0.02, 0.3],
    [0.2, 0.01, 1.5, 0.45, 0.02, 0.35],
    [-0.1, 0.01, 1.8, 0.5, 0.02, 0.4],
  ];
  stones.forEach(([x, y, z, w, h, d]) => {
    const tile = createBox(w, h, d, materials.cobbleStone);
    tile.position.set(x, y, z);
    shopGroup.add(tile);
  });

  // --- Hollow Building Structure ---
  const foundation = createBox(2.2, 0.3, 2.0, materials.stoneFoundation);
  foundation.position.set(0, 0.15, 0);
  shopGroup.add(foundation);

  const interiorFloor = createBox(1.88, 0.04, 1.68, materials.interiorFloor);
  interiorFloor.position.set(0, 0.32, 0);
  shopGroup.add(interiorFloor);

  const backWall = createBox(2.0, 1.48, 0.1, materials.interiorWall);
  backWall.position.set(0, 1.05, -0.85);
  shopGroup.add(backWall);

  const rightWall = createBox(0.1, 1.48, 1.8, materials.interiorWall);
  rightWall.position.set(0.95, 1.05, 0);
  shopGroup.add(rightWall);

  const leftWallBot = createBox(0.1, 0.5, 1.8, materials.interiorWall);
  leftWallBot.position.set(-0.95, 0.56, 0);
  const leftWallTop = createBox(0.1, 0.4, 1.8, materials.interiorWall);
  leftWallTop.position.set(-0.95, 1.59, 0);
  const leftWallFrontPillar = createBox(0.1, 0.63, 0.5, materials.interiorWall);
  leftWallFrontPillar.position.set(-0.95, 1.11, 0.65);
  const leftWallBackPillar = createBox(0.1, 0.63, 0.5, materials.interiorWall);
  leftWallBackPillar.position.set(-0.95, 1.11, -0.65);
  shopGroup.add(leftWallBot, leftWallTop, leftWallFrontPillar, leftWallBackPillar);

  const frontWallTop = createBox(2.0, 0.42, 0.1, materials.wallPink);
  frontWallTop.position.set(0, 1.58, 0.85);
  const frontWallBot = createBox(2.0, 0.36, 0.1, materials.wallPink);
  frontWallBot.position.set(0, 0.48, 0.85);
  const frontWallMidPillar = createBox(0.16, 0.74, 0.1, materials.wallPink);
  frontWallMidPillar.position.set(0.08, 1.03, 0.85);
  const frontWallLeftPillar = createBox(0.16, 0.74, 0.1, materials.wallPink);
  frontWallLeftPillar.position.set(-0.92, 1.03, 0.85);
  const frontWallRightPillar = createBox(0.16, 0.74, 0.1, materials.wallPink);
  frontWallRightPillar.position.set(0.92, 1.03, 0.85);
  shopGroup.add(frontWallTop, frontWallBot, frontWallMidPillar, frontWallLeftPillar, frontWallRightPillar);

  // Timber Frame Corner Posts (Magenta)
  const posts = [[-0.98, 0.88], [0.98, 0.88], [-0.98, -0.88], [0.98, -0.88]];
  posts.forEach(([x, z]) => {
    const post = createBox(0.12, 1.52, 0.12, materials.trimMagenta);
    post.position.set(x, 1.05, z);
    shopGroup.add(post);
  });

  // Pointy Pastel Roof Layers
  for (let i = 0; i < 7; i++) {
    const w = 2.3 - i * 0.28;
    const d = 2.1 - i * 0.26;
    const layer = createBox(w, 0.16, d, materials.roofTile);
    layer.position.set(0, 1.88 + i * 0.15, 0);
    shopGroup.add(layer);
  }

  // Chimney with Pink Trim
  const chimney = createBox(0.3, 0.7, 0.3, materials.stoneFoundation);
  chimney.position.set(0.6, 2.4, -0.3);
  shopGroup.add(chimney);

  // Door Frame & Step
  const doorJambLeft = createBox(0.06, 1.03, 0.12, materials.trimMagenta);
  doorJambLeft.position.set(0.18, 0.855, 0.85);
  const doorJambRight = createBox(0.06, 1.03, 0.12, materials.trimMagenta);
  doorJambRight.position.set(0.80, 0.855, 0.85);
  const doorJambTop = createBox(0.68, 0.06, 0.12, materials.trimMagenta);
  doorJambTop.position.set(0.49, 1.34, 0.85);
  const doorStep = createBox(0.68, 0.04, 0.14, materials.cobbleStone);
  doorStep.position.set(0.49, 0.33, 0.85);
  shopGroup.add(doorJambLeft, doorJambRight, doorJambTop, doorStep);

  // Door Assembly with pink bow
  const doorGroup = new THREE.Group();
  doorGroup.position.set(0.21, 0.835, 0.91);
  const doorBottom = createBox(0.55, 0.55, 0.05, materials.doorWood);
  doorBottom.position.set(0.275, -0.20, 0);
  const doorTopHeader = createBox(0.55, 0.12, 0.05, materials.doorWood);
  doorTopHeader.position.set(0.275, 0.41, 0);
  const doorSideLeft = createBox(0.14, 0.28, 0.05, materials.doorWood);
  doorSideLeft.position.set(0.07, 0.21, 0);
  const doorSideRight = createBox(0.14, 0.28, 0.05, materials.doorWood);
  doorSideRight.position.set(0.48, 0.21, 0);
  const smallWindowFrame = createBox(0.27, 0.28, 0.06, materials.trimMagenta);
  smallWindowFrame.position.set(0.275, 0.21, 0);
  const smallWindowGlass = createBox(0.23, 0.24, 0.02, materials.doorGlass);
  smallWindowGlass.position.set(0.275, 0.21, 0);
  const knobOuter = createBox(0.06, 0.06, 0.06, materials.goldAccent);
  knobOuter.position.set(0.48, -0.05, 0.035);
  const knobInner = createBox(0.06, 0.06, 0.06, materials.goldAccent);
  knobInner.position.set(0.48, -0.05, -0.035);
  const bowDecor = createBox(0.14, 0.08, 0.06, materials.bowPink);
  bowDecor.position.set(0.275, 0.38, 0.04);
  doorGroup.add(doorBottom, doorTopHeader, doorSideLeft, doorSideRight, smallWindowFrame, smallWindowGlass, knobOuter, knobInner, bowDecor);
  shopGroup.add(doorGroup);

  // --- Interior Furniture & Cute Props ---
  const rug = createBox(0.9, 0.01, 0.9, materials.carpetPinkStar);
  rug.position.set(-0.1, 0.34, 0.05);
  shopGroup.add(rug);

  const counterBase = createBox(0.65, 0.48, 0.32, materials.woodFurniture);
  counterBase.position.set(0.42, 0.56, 0.22);
  const counterTop = createBox(0.72, 0.04, 0.38, materials.woodFurnitureDark);
  counterTop.position.set(0.42, 0.81, 0.22);
  shopGroup.add(counterBase, counterTop);

  const crystalStand = createBox(0.1, 0.06, 0.1, materials.goldAccent);
  crystalStand.position.set(0.35, 0.85, 0.22);
  const crystalOrb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), materials.crystalGlow);
  crystalOrb.position.set(0.35, 0.96, 0.22);
  shopGroup.add(crystalStand, crystalOrb);

  const spellbook = createBox(0.18, 0.04, 0.14, materials.bowPink);
  spellbook.position.set(0.55, 0.84, 0.22);
  spellbook.rotation.y = -0.25;
  shopGroup.add(spellbook);

  const stoolSeat = createBox(0.22, 0.04, 0.22, materials.woodFurnitureDark);
  stoolSeat.position.set(0.45, 0.62, -0.25);
  const stoolLeg = createBox(0.14, 0.26, 0.14, materials.woodFurniture);
  stoolLeg.position.set(0.45, 0.47, -0.25);
  shopGroup.add(stoolSeat, stoolLeg);

  const shelfFrame = createBox(0.95, 1.1, 0.22, materials.woodFurniture);
  shelfFrame.position.set(-0.32, 0.89, -0.72);
  shopGroup.add(shelfFrame);

  [-0.2, 0.15, 0.45].forEach((yOffset) => {
    const board = createBox(0.91, 0.03, 0.2, materials.woodFurnitureDark);
    board.position.set(-0.32, 0.89 + yOffset, -0.71);
    shopGroup.add(board);
  });

  const potionColors = [materials.potionPink, materials.potionMint, materials.potionCyan, materials.potionPurple, materials.awningPink];
  for (let row = 0; row < 3; row++) {
    const yPos = 0.73 + row * 0.3;
    for (let col = 0; col < 4; col++) {
      const xPos = -0.62 + col * 0.2;
      const mat = potionColors[(row + col) % potionColors.length];
      const potion = createBox(0.06, 0.12, 0.06, mat);
      potion.position.set(xPos, yPos + 0.06, -0.71);
      shopGroup.add(potion);
    }
  }

  const skull1 = createBox(0.1, 0.09, 0.1, materials.skullWhite);
  skull1.position.set(-0.62, 1.38, -0.71);
  const bow1 = createBox(0.06, 0.04, 0.03, materials.bowPink);
  bow1.position.set(-0.62, 1.44, -0.66);
  const skull2 = createBox(0.1, 0.09, 0.1, materials.skullWhite);
  skull2.position.set(-0.2, 1.38, -0.71);
  const bow2 = createBox(0.06, 0.04, 0.03, materials.bowPink);
  bow2.position.set(-0.2, 1.44, -0.66);
  shopGroup.add(skull1, bow1, skull2, bow2);

  const centerTableTop = createBox(0.45, 0.04, 0.45, materials.woodFurnitureDark);
  centerTableTop.position.set(-0.3, 0.62, 0.1);
  const centerTableLeg = createBox(0.12, 0.26, 0.12, materials.woodFurniture);
  centerTableLeg.position.set(-0.3, 0.47, 0.1);
  const tableHatBase = createBox(0.24, 0.02, 0.24, materials.trimMagenta);
  tableHatBase.position.set(-0.3, 0.65, 0.1);
  const tableHatCone = createBox(0.12, 0.18, 0.12, materials.trimMagenta);
  tableHatCone.position.set(-0.3, 0.74, 0.1);
  const tableHatBow = createBox(0.08, 0.04, 0.14, materials.bowPink);
  tableHatBow.position.set(-0.3, 0.67, 0.1);
  shopGroup.add(centerTableTop, centerTableLeg, tableHatBase, tableHatCone, tableHatBow);

  const chain = createBox(0.02, 0.25, 0.02, materials.goldAccent);
  chain.position.set(0, 1.62, 0);
  const lanternFrame = createBox(0.16, 0.2, 0.16, materials.trimMagenta);
  lanternFrame.position.set(0, 1.4, 0);
  const lanternGlow = createBox(0.1, 0.14, 0.1, materials.windowGlow);
  lanternGlow.position.set(0, 1.4, 0);
  shopGroup.add(chain, lanternFrame, lanternGlow);

  // --- Awning & Kawaii Spooky Sign ---
  const awningGroup = new THREE.Group();
  awningGroup.position.set(-0.42, 1.25, 0.95);
  for (let i = 0; i < 6; i++) {
    const isPink = i % 2 === 0;
    const stripe = createBox(0.14, 0.08, 0.42, isPink ? materials.awningPink : materials.awningWhite);
    stripe.position.set((i - 2.5) * 0.14, 0, 0.18);
    stripe.rotation.x = 0.35;
    awningGroup.add(stripe);
  }
  shopGroup.add(awningGroup);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const ctx = signCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 14;
    ctx.strokeRect(12, 12, 1000, 232);
    ctx.fillStyle = '#fbcfe8';
    ctx.font = '900 68px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 18;
    const titleText = (storeTitle || 'KAWAII SPOOKY SHOP').toUpperCase();
    ctx.fillText(`✨ ${titleText.length > 22 ? titleText.slice(0, 20) + '...' : titleText} ✨`, 512, 128);
  }
  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
  const signBacking = createBox(1.5, 0.38, 0.08, materials.trimMagenta);
  signBacking.position.set(0, 1.62, 0.96);
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.32), signMat);
  signMesh.position.set(0, 1.62, 1.01);
  shopGroup.add(signBacking, signMesh);

  const bulbPositions = [-0.68, -0.34, 0, 0.34, 0.68];
  bulbPositions.forEach((x) => {
    const bulbTop = createBox(0.05, 0.05, 0.05, materials.windowGlow);
    bulbTop.position.set(x, 1.83, 1.02);
    const bulbBot = createBox(0.05, 0.05, 0.05, materials.windowGlow);
    bulbBot.position.set(x, 1.41, 1.02);
    shopGroup.add(bulbTop, bulbBot);
  });

  // --- Window Displays & Outdoor Decor ---
  const windowSill = createBox(0.88, 0.06, 0.16, materials.trimMagenta);
  windowSill.position.set(-0.42, 0.68, 0.92);
  const sillPotion1 = createBox(0.07, 0.12, 0.07, materials.potionPink);
  sillPotion1.position.set(-0.72, 0.77, 0.92);
  const sillPotion2 = createBox(0.06, 0.10, 0.06, materials.potionMint);
  sillPotion2.position.set(-0.64, 0.76, 0.92);
  const miniSkull = createBox(0.08, 0.08, 0.08, materials.skullWhite);
  miniSkull.position.set(-0.16, 0.74, 0.92);
  shopGroup.add(windowSill, sillPotion1, sillPotion2, miniSkull);

  // Pink Witch Cauldron
  const cauldronBase = createBox(0.42, 0.38, 0.42, materials.cauldronPink);
  cauldronBase.position.set(-1.1, 0.22, 1.2);
  const cauldronLiquid = createBox(0.36, 0.04, 0.36, materials.potionPink);
  cauldronLiquid.position.set(-1.1, 0.38, 1.2);
  shopGroup.add(cauldronBase, cauldronLiquid);

  function createGirlyPumpkin(x: number, y: number, z: number, size: number, pumpkinMat: THREE.Material) {
    const pumpkinGroup = new THREE.Group();
    pumpkinGroup.position.set(x, y, z);
    const pBody = createBox(size, size * 0.85, size, pumpkinMat);
    const pStem = createBox(size * 0.2, size * 0.3, size * 0.2, materials.pumpkinStem);
    pStem.position.y = size * 0.5;
    const pBow = createBox(size * 0.4, size * 0.18, size * 0.15, materials.bowPink);
    pBow.position.set(0, size * 0.45, size * 0.1);
    const eyeL = createBox(size * 0.2, size * 0.2, 0.02, materials.jackGlowPink);
    eyeL.position.set(-size * 0.2, size * 0.12, size * 0.51);
    const eyeR = createBox(size * 0.2, size * 0.2, 0.02, materials.jackGlowPink);
    eyeR.position.set(size * 0.2, size * 0.12, size * 0.51);
    const mouth = createBox(size * 0.4, size * 0.1, 0.02, materials.jackGlowPink);
    mouth.position.set(0, -size * 0.18, size * 0.51);
    pumpkinGroup.add(pBody, pStem, pBow, eyeL, eyeR, mouth);
    shopGroup.add(pumpkinGroup);
  }

  createGirlyPumpkin(-0.55, 0.15, 1.3, 0.26, materials.pumpkinPastelPink);
  createGirlyPumpkin(0.9, 0.13, 1.25, 0.22, materials.pumpkinPastelLilac);

  const broomStick = createBox(0.04, 0.9, 0.04, materials.doorWood);
  broomStick.position.set(0.92, 0.5, 0.92);
  broomStick.rotation.z = -0.22;
  broomStick.rotation.x = -0.15;
  const broomBristles = createBox(0.12, 0.25, 0.12, materials.goldAccent);
  broomBristles.position.set(1.01, 0.16, 0.98);
  broomBristles.rotation.z = -0.22;
  const broomRibbon = createBox(0.08, 0.05, 0.08, materials.bowPink);
  broomRibbon.position.set(0.97, 0.28, 0.95);
  shopGroup.add(broomStick, broomBristles, broomRibbon);

  const tombstone = createBox(0.24, 0.35, 0.08, materials.cobbleStone);
  tombstone.position.set(-1.25, 0.18, 0.3);
  tombstone.rotation.y = 0.3;
  const heart = createBox(0.08, 0.08, 0.02, materials.bowPink);
  heart.position.set(-1.23, 0.24, 0.35);
  heart.rotation.y = 0.3;
  shopGroup.add(tombstone, heart);

  // --- Particles: Floating Blushing Ghosts & Cauldron Bubbles ---
  type ParticleItem = {
    group: THREE.Group | THREE.Mesh;
    isBubble?: boolean;
    baseX?: number;
    baseY: number;
    speedY: number;
    offset: number;
  };
  const particleGroup: ParticleItem[] = [];

  const ghostPositions = [
    { x: -1.3, y: 1.1, z: 1.2 },
    { x: 1.2, y: 0.9, z: 1.0 },
    { x: 0.3, y: 2.1, z: 1.2 },
    { x: -0.7, y: 2.7, z: 0.3 },
    { x: 0.8, y: 2.9, z: -0.2 },
    { x: -1.4, y: 0.8, z: -0.3 },
    { x: 1.3, y: 1.8, z: -0.8 },
    { x: -1.1, y: 2.0, z: -1.1 },
    { x: 0.0, y: 3.3, z: 0.0 },
    { x: -0.2, y: 1.4, z: 0.0 },
    { x: -0.1, y: 0.9, z: 1.8 },
    { x: 1.1, y: 1.2, z: 0.2 },
    { x: -1.2, y: 1.6, z: 0.6 },
    { x: 0.7, y: 1.1, z: 1.1 },
  ];

  ghostPositions.forEach((pos, idx) => {
    const ghostGroup = new THREE.Group();
    const gBody = createBox(0.12, 0.18, 0.12, materials.ghostWhite);
    const eye1 = createBox(0.02, 0.03, 0.02, materials.trimMagenta);
    eye1.position.set(-0.03, 0.04, 0.065);
    const eye2 = createBox(0.02, 0.03, 0.02, materials.trimMagenta);
    eye2.position.set(0.03, 0.04, 0.065);
    const blush1 = createBox(0.03, 0.02, 0.01, materials.ghostBlush);
    blush1.position.set(-0.04, 0.01, 0.066);
    const blush2 = createBox(0.03, 0.02, 0.01, materials.ghostBlush);
    blush2.position.set(0.04, 0.01, 0.066);
    ghostGroup.add(gBody, eye1, eye2, blush1, blush2);

    const initialX = pos.x + (Math.random() - 0.5) * 0.15;
    const initialY = pos.y + (Math.random() - 0.5) * 0.15;
    ghostGroup.position.set(
      initialX,
      initialY,
      pos.z + (Math.random() - 0.5) * 0.15
    );
    particleGroup.push({
      group: ghostGroup,
      baseX: initialX,
      baseY: initialY,
      speedY: 0.3 + Math.random() * 0.5,
      offset: idx * 0.45 + Math.random() * Math.PI,
    });
    shopGroup.add(ghostGroup);
  });

  for (let i = 0; i < 6; i++) {
    const bubble = createBox(0.05, 0.05, 0.05, materials.potionPink);
    const initialY = 0.42 + Math.random() * 0.3;
    bubble.position.set(
      -1.1 + (Math.random() - 0.5) * 0.25,
      initialY,
      1.2 + (Math.random() - 0.5) * 0.25
    );
    particleGroup.push({
      group: bubble,
      isBubble: true,
      baseY: 0.42,
      speedY: 0.2 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
    });
    shopGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    windowLight.intensity = 2.2 + Math.sin(time * 6.0) * 0.3;
    interiorChandelierLight.intensity = 3.2 + Math.sin(time * 3.0) * 0.3;
    crystalBallLight.intensity = 2.8 + Math.sin(time * 7.0) * 0.5;
    cauldronLight.intensity = 2.8 + Math.sin(time * 9.0) * 0.6;

    shopGroup.rotation.y = Math.sin(time * 0.2) * 0.12;

    particleGroup.forEach((p) => {
      if (p.isBubble) {
        p.group.position.y += 0.008 * p.speedY;
        if (p.group.position.y > 0.85) {
          p.group.position.y = 0.42;
          p.group.position.x = -1.1 + (Math.random() - 0.5) * 0.25;
          p.group.position.z = 1.2 + (Math.random() - 0.5) * 0.25;
        }
      } else {
        p.group.position.y = p.baseY + Math.sin(time * 2.0 + p.offset) * 0.12;
        if (p.baseX !== undefined) {
          p.group.position.x = p.baseX + Math.cos(time * 1.5 + p.offset) * 0.08;
        }
        p.group.rotation.y = Math.sin(time * 1.2 + p.offset) * 0.3;
      }
    });

    renderer.render(scene, camera);
  };

  animate();

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

/**
 * Builds the 3D Girly Kiosk scene (Pastel Boba, Macarons, Flowers, Plushies, and Marquee Bow).
 */
export function setupGirlyKioskStoreScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  storeTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(4.5, 3.2, 5.5);
  camera.lookAt(0, 1.3, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const materials = {
    // Main Architecture
    pinkPrimary: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 }),
    pinkDeep: new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.5 }),
    lavenderSoft: new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.5 }),
    mintAccent: new THREE.MeshStandardMaterial({ color: 0x6ee7b7, roughness: 0.4 }),
    creamWhite: new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.3 }),
    woodPastel: new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 }),
    goldMetallic: new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.2, metalness: 0.85 }),

    // Glass & Translucency
    cupGlass: new THREE.MeshStandardMaterial({ color: 0xfff1f2, transparent: true, opacity: 0.45, roughness: 0.1, depthWrite: false }),
    bobaLiquidPink: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
    bobaLiquidMatcha: new THREE.MeshBasicMaterial({ color: 0x34d399 }),
    bobaLiquidTaro: new THREE.MeshBasicMaterial({ color: 0xa855f7 }),
    bobaTapioca: new THREE.MeshStandardMaterial({ color: 0x31103f, roughness: 0.2 }),

    // Decor & Props
    flowerPetalPink: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 }),
    flowerPetalYellow: new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 }),
    flowerPetalPurple: new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.5 }),
    leafGreen: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 }),
    bowRedPink: new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 }),
    plushieWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
    plushiePink: new THREE.MeshStandardMaterial({ color: 0xfba518, roughness: 0.8 }),

    // Lights & Glows
    bulbGlow: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    fairyLightGlow: new THREE.MeshBasicMaterial({ color: 0xfca5a5 }),

    // Environment & Ground
    groundBase: new THREE.MeshStandardMaterial({ color: 0x2e104d, roughness: 0.9 }),
    stoneTile: new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.7 }),
    woodDeck: new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.6 }),
  };

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
  sunLight.position.set(5, 9, 6);
  scene.add(sunLight);

  const frontFill = new THREE.DirectionalLight(0xfff7ed, 1.6);
  frontFill.position.set(0, 4, 6);
  scene.add(frontFill);

  const pinkFillLight = new THREE.DirectionalLight(0xf472b6, 0.8);
  pinkFillLight.position.set(-6, 4, -4);
  scene.add(pinkFillLight);

  const counterLight = new THREE.PointLight(0xfef08a, 2.5, 4.5);
  counterLight.position.set(0, 1.6, 0);
  scene.add(counterLight);

  const marqueeLight = new THREE.PointLight(0xf472b6, 2.2, 3.5);
  marqueeLight.position.set(0, 2.1, 1.1);
  scene.add(marqueeLight);

  const fairyLights: THREE.PointLight[] = [];

  const kioskGroup = new THREE.Group();
  kioskGroup.scale.set(1.22, 1.22, 1.22);
  scene.add(kioskGroup);

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  // --- Environment & Ground ---
  const base = createBox(3.8, 0.16, 3.8, materials.groundBase);
  base.position.y = -0.08;
  kioskGroup.add(base);

  const deck = createBox(2.8, 0.12, 2.6, materials.woodDeck);
  deck.position.set(0, 0.06, 0.1);
  kioskGroup.add(deck);

  const tiles = [
    [0, 0.13, 1.4, 0.6, 0.02, 0.4],
    [-0.4, 0.13, 1.7, 0.45, 0.02, 0.35],
    [0.35, 0.13, 1.8, 0.5, 0.02, 0.35],
    [-0.1, 0.13, 2.05, 0.55, 0.02, 0.4],
  ];
  tiles.forEach(([x, y, z, w, h, d]) => {
    const tile = createBox(w, h, d, materials.stoneTile);
    tile.position.set(x, y, z);
    kioskGroup.add(tile);
  });

  // --- Kiosk Structure ---
  const cabinetBase = createBox(2.2, 0.85, 1.6, materials.pinkPrimary);
  cabinetBase.position.set(0, 0.545, 0);

  const frontPanel = createBox(2.0, 0.65, 0.06, materials.lavenderSoft);
  frontPanel.position.set(0, 0.545, 0.81);

  const goldBorder = createBox(2.06, 0.71, 0.04, materials.goldMetallic);
  goldBorder.position.set(0, 0.545, 0.82);

  const sideLeftCut = createBox(0.06, 0.65, 1.2, materials.lavenderSoft);
  sideLeftCut.position.set(-1.11, 0.545, 0);

  const sideRightCut = createBox(0.06, 0.65, 1.2, materials.lavenderSoft);
  sideRightCut.position.set(1.11, 0.545, 0);

  const counterTop = createBox(2.36, 0.08, 1.76, materials.creamWhite);
  counterTop.position.set(0, 0.99, 0);

  kioskGroup.add(cabinetBase, frontPanel, goldBorder, sideLeftCut, sideRightCut, counterTop);

  const pillarCoords = [
    [-1.02, 0.72],
    [1.02, 0.72],
    [-1.02, -0.72],
    [1.02, -0.72],
  ];
  pillarCoords.forEach(([x, z]) => {
    const pillar = createBox(0.08, 1.2, 0.08, materials.goldMetallic);
    pillar.position.set(x, 1.63, z);
    kioskGroup.add(pillar);
  });

  // --- Counter Displays ---
  const registerBase = createBox(0.3, 0.12, 0.26, materials.pinkDeep);
  registerBase.position.set(0.72, 1.09, 0.35);

  const registerScreen = createBox(0.2, 0.16, 0.04, materials.creamWhite);
  registerScreen.position.set(0.72, 1.22, 0.31);
  registerScreen.rotation.x = -0.2;

  kioskGroup.add(registerBase, registerScreen);

  // Boba Cups
  const bobaPositions: [number, number, number, THREE.Material][] = [
    [-0.7, 1.03, 0.45, materials.bobaLiquidPink],
    [-0.52, 1.03, 0.42, materials.bobaLiquidMatcha],
    [-0.34, 1.03, 0.48, materials.bobaLiquidTaro],
  ];

  bobaPositions.forEach(([x, y, z, fluidMat]) => {
    const bobaGroup = new THREE.Group();
    bobaGroup.position.set(x, y, z);

    const cupMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.05, 0.18, 12),
      materials.cupGlass
    );
    cupMesh.position.y = 0.09;

    const liquidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.048, 0.14, 12),
      fluidMat
    );
    liquidMesh.position.y = 0.075;

    const pearlMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.046, 0.03, 12),
      materials.bobaTapioca
    );
    pearlMesh.position.y = 0.02;

    const straw = createBox(0.015, 0.24, 0.015, materials.goldMetallic);
    straw.position.set(0.01, 0.12, 0);
    straw.rotation.z = -0.15;

    const lid = createBox(0.15, 0.02, 0.15, materials.creamWhite);
    lid.position.y = 0.18;

    bobaGroup.add(cupMesh, liquidMesh, pearlMesh, straw, lid);
    kioskGroup.add(bobaGroup);
  });

  // Flower Vase on Counter
  const vaseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.06, 0.22, 12),
    materials.creamWhite
  );
  vaseMesh.position.set(0.1, 1.14, 0.4);
  kioskGroup.add(vaseMesh);

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const petalMat = i % 2 === 0 ? materials.flowerPetalPink : materials.flowerPetalYellow;

    const stem = createBox(0.015, 0.22, 0.015, materials.leafGreen);
    stem.position.set(0.1 + Math.cos(angle) * 0.03, 1.28, 0.4 + Math.sin(angle) * 0.03);
    stem.rotation.z = Math.cos(angle) * 0.2;

    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), petalMat);
    bloom.position.set(0.1 + Math.cos(angle) * 0.07, 1.38, 0.4 + Math.sin(angle) * 0.07);

    kioskGroup.add(stem, bloom);
  }

  // Display Tray with Macarons
  const tray = createBox(0.48, 0.03, 0.28, materials.creamWhite);
  tray.position.set(-0.15, 1.045, 0.2);

  const macaronColors = [materials.pinkPrimary, materials.lavenderSoft, materials.mintAccent, materials.flowerPetalYellow];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const mac = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.025, 10),
        macaronColors[(r + c) % macaronColors.length]
      );
      mac.position.set(-0.3 + c * 0.1, 1.07, 0.14 + r * 0.12);
      kioskGroup.add(mac);
    }
  }
  kioskGroup.add(tray);

  // Back Wall Shelves & Plushies
  const backShelfFrame = createBox(2.1, 1.1, 0.1, materials.pinkDeep);
  backShelfFrame.position.set(0, 1.62, -0.75);
  kioskGroup.add(backShelfFrame);

  [1.4, 1.75].forEach((yPos) => {
    const shelfBoard = createBox(1.9, 0.03, 0.22, materials.creamWhite);
    shelfBoard.position.set(0, yPos, -0.66);
    kioskGroup.add(shelfBoard);
  });

  const plushie1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), materials.plushieWhite);
  plushie1.position.set(-0.6, 1.48, -0.65);
  const ears1 = createBox(0.04, 0.08, 0.04, materials.pinkPrimary);
  ears1.position.set(-0.6, 1.57, -0.65);

  const plushie2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), materials.plushiePink);
  plushie2.position.set(0.6, 1.48, -0.65);

  kioskGroup.add(plushie1, ears1, plushie2);

  [-0.3, 0, 0.3].forEach((xOffset, idx) => {
    const bottleMat = idx === 0 ? materials.lavenderSoft : idx === 1 ? materials.pinkPrimary : materials.mintAccent;
    const bottle = createBox(0.06, 0.11, 0.06, bottleMat);
    bottle.position.set(xOffset, 1.82, -0.65);

    const cap = createBox(0.03, 0.04, 0.03, materials.goldMetallic);
    cap.position.set(xOffset, 1.895, -0.65);

    kioskGroup.add(bottle, cap);
  });

  // --- Roof & Scalloped Striped Awning ---
  const roofBase = createBox(2.48, 0.12, 1.88, materials.pinkDeep);
  roofBase.position.set(0, 2.29, 0);

  const roofCap = createBox(2.1, 0.16, 1.5, materials.lavenderSoft);
  roofCap.position.set(0, 2.41, 0);

  const roofCrown = createBox(1.6, 0.14, 1.1, materials.pinkPrimary);
  roofCrown.position.set(0, 2.54, 0);

  kioskGroup.add(roofBase, roofCap, roofCrown);

  const awningGroup = new THREE.Group();
  awningGroup.position.set(0, 2.18, 0.96);

  const stripeCount = 10;
  const stripeWidth = 2.5 / stripeCount;

  for (let i = 0; i < stripeCount; i++) {
    const isPink = i % 2 === 0;
    const mat = isPink ? materials.pinkPrimary : materials.creamWhite;

    const stripe = createBox(stripeWidth - 0.01, 0.06, 0.45, mat);
    stripe.position.set((i - (stripeCount - 1) / 2) * stripeWidth, 0, 0.18);
    stripe.rotation.x = 0.32;

    const fringe = createBox(stripeWidth - 0.01, 0.08, 0.04, isPink ? materials.pinkDeep : materials.goldMetallic);
    fringe.position.set((i - (stripeCount - 1) / 2) * stripeWidth, -0.06, 0.38);

    awningGroup.add(stripe, fringe);
  }
  kioskGroup.add(awningGroup);

  // --- Marquee Sign & Giant Ribbon Bow ---
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const ctx = signCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#db2777';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#fff1f2';
    ctx.font = '900 82px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 16;
    const signText = (storeTitle || 'KIOSKY').toUpperCase();
    ctx.fillText(`🎀 ${signText.length > 20 ? signText.slice(0, 18) + '...' : signText} 🎀`, 512, 128);
  }

  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signMat = new THREE.MeshBasicMaterial({ map: signTexture });

  const signBacking = createBox(1.8, 0.4, 0.08, materials.goldMetallic);
  signBacking.position.set(0, 2.76, 0.82);

  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 0.34), signMat);
  signMesh.position.set(0, 2.76, 0.87);

  kioskGroup.add(signBacking, signMesh);

  const bowCenter = createBox(0.18, 0.18, 0.12, materials.bowRedPink);
  bowCenter.position.set(0, 3.02, 0.84);

  const bowLeft = createBox(0.3, 0.22, 0.08, materials.pinkPrimary);
  bowLeft.position.set(-0.22, 3.04, 0.83);
  bowLeft.rotation.z = 0.25;

  const bowRight = createBox(0.3, 0.22, 0.08, materials.pinkPrimary);
  bowRight.position.set(0.22, 3.04, 0.83);
  bowRight.rotation.z = -0.25;

  kioskGroup.add(bowCenter, bowLeft, bowRight);

  const bulbX = [-0.82, -0.41, 0, 0.41, 0.82];
  bulbX.forEach((bx) => {
    const bulbTop = createBox(0.05, 0.05, 0.05, materials.bulbGlow);
    bulbTop.position.set(bx, 2.98, 0.88);

    const bulbBot = createBox(0.05, 0.05, 0.05, materials.bulbGlow);
    bulbBot.position.set(bx, 2.54, 0.88);

    kioskGroup.add(bulbTop, bulbBot);
  });

  // --- Hanging Flower Baskets, Planters, Stool & Fairy Lights ---
  [-0.95, 0.95].forEach((hx) => {
    const chain = createBox(0.015, 0.3, 0.015, materials.goldMetallic);
    chain.position.set(hx, 2.1, 0.85);

    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.12, 10), materials.pinkDeep);
    basket.position.set(hx, 1.9, 0.85);

    const flowers = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), materials.flowerPetalPink);
    flowers.position.set(hx, 1.96, 0.85);

    kioskGroup.add(chain, basket, flowers);
  });

  const tubLeft = createBox(0.5, 0.28, 0.3, materials.creamWhite);
  tubLeft.position.set(-1.1, 0.26, 1.1);

  const tubRight = createBox(0.5, 0.28, 0.3, materials.creamWhite);
  tubRight.position.set(1.1, 0.26, 1.1);

  kioskGroup.add(tubLeft, tubRight);

  [-1.1, 1.1].forEach((tx) => {
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), materials.leafGreen);
    bush.position.set(tx, 0.45, 1.1);

    for (let f = 0; f < 4; f++) {
      const fl = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        f % 2 === 0 ? materials.flowerPetalPink : materials.flowerPetalYellow
      );
      fl.position.set(tx + (Math.random() - 0.5) * 0.25, 0.52 + Math.random() * 0.1, 1.1 + (Math.random() - 0.5) * 0.2);
      kioskGroup.add(fl);
    }
    kioskGroup.add(bush);
  });

  const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), materials.pinkPrimary);
  stoolSeat.position.set(-0.85, 0.46, 1.3);

  const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.32, 8), materials.goldMetallic);
  stoolLeg.position.set(-0.85, 0.28, 1.3);

  kioskGroup.add(stoolSeat, stoolLeg);

  const lightPositions: [number, number, number][] = [
    [-0.9, 2.05, 1.05],
    [-0.5, 2.02, 1.08],
    [0, 2.0, 1.1],
    [0.5, 2.02, 1.08],
    [0.9, 2.05, 1.05],
    [-1.0, 2.05, 0.5],
    [1.0, 2.05, 0.5],
    [-1.0, 2.05, -0.2],
    [1.0, 2.05, -0.2],
  ];

  lightPositions.forEach(([lx, ly, lz], idx) => {
    const fairyNode = createBox(0.04, 0.05, 0.04, materials.fairyLightGlow);
    fairyNode.position.set(lx, ly, lz);
    kioskGroup.add(fairyNode);

    if (idx % 2 === 0) {
      const pLight = new THREE.PointLight(0xfca5a5, 0.6, 1.5);
      pLight.position.set(lx, ly - 0.04, lz);
      fairyLights.push(pLight);
      kioskGroup.add(pLight);
    }
  });

  // --- Floating Sparkle & Heart Particles ---
  type SparkleItem = {
    mesh: THREE.Mesh;
    baseX: number;
    baseY: number;
    speedY: number;
    rotSpeed: number;
    offset: number;
  };
  const sparkleGroup: SparkleItem[] = [];

  for (let i = 0; i < 26; i++) {
    const isHeart = i % 3 === 0;
    const mat = i % 2 === 0 ? materials.flowerPetalPink : materials.goldMetallic;

    const sparkle = createBox(isHeart ? 0.06 : 0.04, isHeart ? 0.06 : 0.04, 0.02, mat);

    const initX = (Math.random() - 0.5) * 4.2;
    const initY = 0.6 + Math.random() * 2.6;
    const initZ = (Math.random() - 0.5) * 4.2;
    sparkle.position.set(initX, initY, initZ);

    sparkleGroup.push({
      mesh: sparkle,
      baseX: initX,
      baseY: initY,
      speedY: 0.2 + Math.random() * 0.4,
      rotSpeed: (Math.random() - 0.5) * 2.0,
      offset: Math.random() * Math.PI * 2,
    });
    kioskGroup.add(sparkle);
  }

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    counterLight.intensity = 2.4 + Math.sin(time * 3.5) * 0.25;
    marqueeLight.intensity = 2.2 + Math.sin(time * 5.0) * 0.35;

    fairyLights.forEach((light, i) => {
      light.intensity = 0.5 + Math.sin(time * 6.0 + i) * 0.25;
    });

    kioskGroup.rotation.y = Math.sin(time * 0.2) * 0.12;

    sparkleGroup.forEach((p) => {
      p.mesh.position.y = p.baseY + Math.sin(time * 1.8 + p.offset) * 0.12;
      p.mesh.position.x = p.baseX + Math.cos(time * 1.2 + p.offset) * 0.08;
      p.mesh.rotation.y += p.rotSpeed * 0.01;
      p.mesh.rotation.z += p.rotSpeed * 0.005;
    });

    renderer.render(scene, camera);
  };

  animate();

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

/**
 * Builds the 3D Boy / Gamer Kiosk scene (Energy Drinks, Burgers, Skateboard, Basketball, Arcade Cabinet, and Lightning Marquee).
 */
export function setupBoyKioskStoreScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  storeTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(4.5, 3.2, 5.5);
  camera.lookAt(0, 1.3, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const materials = {
    // Main Architecture (Light Blue / Cyber Gamer Palette)
    lightBlue: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 }),
    lightBlueDark: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }),
    lightBlueSoft: new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.3 }),
    bluePrimary: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 }),
    darkCharcoal: new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.5 }),
    cyanAccent: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 }),
    orangeAccent: new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.4 }),
    whiteClean: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }),
    metalSilver: new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.2, metalness: 0.85 }),
    metalDark: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.7 }),

    // Drinks & Food Materials
    cupGlass: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.5, roughness: 0.1, depthWrite: false }),
    sodaRed: new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 }),
    sodaGreen: new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.5, roughness: 0.3 }),
    energyCyan: new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.2 }),
    burgerBun: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }),
    burgerMeat: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 }),
    cheeseYellow: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 }),

    // Gear & Props
    skateDeck: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 }),
    skateGrip: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }),
    skateWheel: new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.3 }),
    basketballOrange: new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.8 }),
    controllerBody: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.2 }),
    arcadeScreen: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),

    // Lights & Glows
    bulbGlow: new THREE.MeshBasicMaterial({ color: 0x7dd3fc }),
    fairyLightGlow: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),

    // Environment & Ground
    groundBase: new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 }),
    stoneTile: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }),
    woodDeck: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }),
  };

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
  sunLight.position.set(5, 9, 6);
  scene.add(sunLight);

  const frontFill = new THREE.DirectionalLight(0xfff7ed, 1.6);
  frontFill.position.set(0, 4, 6);
  scene.add(frontFill);

  const orangeFillLight = new THREE.DirectionalLight(0xf97316, 0.8);
  orangeFillLight.position.set(-6, 4, -4);
  scene.add(orangeFillLight);

  const counterLight = new THREE.PointLight(0x38bdf8, 2.5, 4.5);
  counterLight.position.set(0, 1.6, 0);
  scene.add(counterLight);

  const marqueeLight = new THREE.PointLight(0xf97316, 2.2, 3.5);
  marqueeLight.position.set(0, 2.1, 1.1);
  scene.add(marqueeLight);

  const fairyLights: THREE.PointLight[] = [];

  const kioskGroup = new THREE.Group();
  kioskGroup.scale.set(1.22, 1.22, 1.22);
  scene.add(kioskGroup);

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  // --- Environment ---
  const base = createBox(3.8, 0.16, 3.8, materials.groundBase);
  base.position.y = -0.08;
  kioskGroup.add(base);

  const deck = createBox(2.8, 0.12, 2.6, materials.woodDeck);
  deck.position.set(0, 0.06, 0.1);
  kioskGroup.add(deck);

  const tiles = [
    [0, 0.13, 1.4, 0.6, 0.02, 0.4],
    [-0.4, 0.13, 1.7, 0.45, 0.02, 0.35],
    [0.35, 0.13, 1.8, 0.5, 0.02, 0.35],
    [-0.1, 0.13, 2.05, 0.55, 0.02, 0.4],
  ];
  tiles.forEach(([x, y, z, w, h, d]) => {
    const tile = createBox(w, h, d, materials.stoneTile);
    tile.position.set(x, y, z);
    const trim = createBox(w + 0.02, 0.015, d + 0.02, materials.cyanAccent);
    trim.position.set(x, y - 0.005, z);
    kioskGroup.add(tile, trim);
  });

  // --- Kiosk Structure ---
  const cabinetBase = createBox(2.2, 0.85, 1.6, materials.lightBlueDark);
  cabinetBase.position.set(0, 0.545, 0);

  const frontPanel = createBox(2.0, 0.65, 0.06, materials.lightBlue);
  frontPanel.position.set(0, 0.545, 0.81);

  const metalBorder = createBox(2.06, 0.71, 0.04, materials.lightBlueSoft);
  metalBorder.position.set(0, 0.545, 0.82);

  const sideLeftCut = createBox(0.06, 0.65, 1.2, materials.lightBlue);
  sideLeftCut.position.set(-1.11, 0.545, 0);

  const sideRightCut = createBox(0.06, 0.65, 1.2, materials.lightBlue);
  sideRightCut.position.set(1.11, 0.545, 0);

  const counterTop = createBox(2.36, 0.08, 1.76, materials.metalDark);
  counterTop.position.set(0, 0.99, 0);

  kioskGroup.add(cabinetBase, frontPanel, metalBorder, sideLeftCut, sideRightCut, counterTop);

  const pillarCoords = [
    [-1.02, 0.72],
    [1.02, 0.72],
    [-1.02, -0.72],
    [1.02, -0.72],
  ];
  pillarCoords.forEach(([x, z]) => {
    const pillar = createBox(0.08, 1.2, 0.08, materials.metalSilver);
    pillar.position.set(x, 1.63, z);
    kioskGroup.add(pillar);
  });

  // --- Counter Displays ---
  const posBase = createBox(0.3, 0.1, 0.24, materials.darkCharcoal);
  posBase.position.set(0.72, 1.08, 0.35);

  const posScreen = createBox(0.24, 0.18, 0.03, materials.arcadeScreen);
  posScreen.position.set(0.72, 1.22, 0.31);
  posScreen.rotation.x = -0.2;

  kioskGroup.add(posBase, posScreen);

  const drinks: [number, number, number, THREE.Material][] = [
    [-0.7, 1.03, 0.45, materials.energyCyan],
    [-0.54, 1.03, 0.42, materials.sodaRed],
    [-0.38, 1.03, 0.48, materials.sodaGreen],
  ];

  drinks.forEach(([x, y, z, mat]) => {
    const canGroup = new THREE.Group();
    canGroup.position.set(x, y, z);

    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12), mat);
    can.position.y = 0.08;

    const topRim = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 12), materials.metalSilver);
    topRim.position.y = 0.16;

    canGroup.add(can, topRim);
    kioskGroup.add(canGroup);
  });

  // Burger
  const burgerGroup = new THREE.Group();
  burgerGroup.position.set(-0.15, 1.03, 0.35);

  const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.03, 12), materials.burgerBun);
  bottomBun.position.y = 0.015;

  const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.03, 12), materials.burgerMeat);
  patty.position.y = 0.045;

  const cheese = createBox(0.18, 0.01, 0.18, materials.cheeseYellow);
  cheese.position.y = 0.065;
  cheese.rotation.y = 0.4;

  const topBun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), materials.burgerBun);
  topBun.position.y = 0.07;

  burgerGroup.add(bottomBun, patty, cheese, topBun);
  kioskGroup.add(burgerGroup);

  // Controller
  const ctrlGroup = new THREE.Group();
  ctrlGroup.position.set(0.2, 1.05, 0.4);
  ctrlGroup.rotation.y = -0.3;

  const ctrlBody = createBox(0.22, 0.04, 0.12, materials.controllerBody);
  ctrlBody.position.y = 0.02;

  const btn1 = createBox(0.03, 0.02, 0.03, materials.cyanAccent);
  btn1.position.set(0.06, 0.045, 0);

  const btn2 = createBox(0.03, 0.02, 0.03, materials.orangeAccent);
  btn2.position.set(-0.06, 0.045, 0);

  ctrlGroup.add(ctrlBody, btn1, btn2);
  kioskGroup.add(ctrlGroup);

  // Back Wall Shelves
  const backShelfFrame = createBox(2.1, 1.1, 0.1, materials.lightBlueDark);
  backShelfFrame.position.set(0, 1.62, -0.75);
  kioskGroup.add(backShelfFrame);

  [1.4, 1.75].forEach((yPos) => {
    const shelfBoard = createBox(1.9, 0.03, 0.22, materials.lightBlueSoft);
    shelfBoard.position.set(0, yPos, -0.66);
    kioskGroup.add(shelfBoard);
  });

  // Mini Arcade Cabinet on shelf
  const arcadeGroup = new THREE.Group();
  arcadeGroup.position.set(-0.6, 1.415, -0.65);

  const cabBase = createBox(0.18, 0.28, 0.16, materials.darkCharcoal);
  cabBase.position.y = 0.14;

  const cabScreen = createBox(0.14, 0.12, 0.02, materials.arcadeScreen);
  cabScreen.position.set(0, 0.18, 0.08);

  const cabMarquee = createBox(0.16, 0.04, 0.04, materials.orangeAccent);
  cabMarquee.position.set(0, 0.26, 0.08);

  arcadeGroup.add(cabBase, cabScreen, cabMarquee);
  kioskGroup.add(arcadeGroup);

  // Trophy
  const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.12, 10), materials.metalSilver);
  trophyCup.position.set(0.6, 1.5, -0.65);
  const trophyBase = createBox(0.08, 0.05, 0.08, materials.darkCharcoal);
  trophyBase.position.set(0.6, 1.425, -0.65);
  kioskGroup.add(trophyCup, trophyBase);

  [-0.3, 0, 0.3].forEach((xOffset, idx) => {
    const canMat = idx === 0 ? materials.sodaRed : idx === 1 ? materials.energyCyan : materials.sodaGreen;
    const miniCan = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 10), canMat);
    miniCan.position.set(xOffset, 1.84, -0.65);
    kioskGroup.add(miniCan);
  });

  // --- Roof & Awning ---
  const roofBase = createBox(2.48, 0.12, 1.88, materials.lightBlueDark);
  roofBase.position.set(0, 2.29, 0);

  const roofCap = createBox(2.1, 0.16, 1.5, materials.lightBlue);
  roofCap.position.set(0, 2.41, 0);

  const roofCrown = createBox(1.6, 0.14, 1.1, materials.lightBlueSoft);
  roofCrown.position.set(0, 2.54, 0);

  kioskGroup.add(roofBase, roofCap, roofCrown);

  const awningGroup = new THREE.Group();
  awningGroup.position.set(0, 2.18, 0.96);

  const stripeCount = 10;
  const stripeWidth = 2.5 / stripeCount;

  for (let i = 0; i < stripeCount; i++) {
    const isBlue = i % 2 === 0;
    const mat = isBlue ? materials.lightBlue : materials.lightBlueSoft;

    const stripe = createBox(stripeWidth - 0.01, 0.06, 0.45, mat);
    stripe.position.set((i - (stripeCount - 1) / 2) * stripeWidth, 0, 0.18);
    stripe.rotation.x = 0.32;

    const fringe = createBox(stripeWidth - 0.01, 0.08, 0.04, isBlue ? materials.whiteClean : materials.cyanAccent);
    fringe.position.set((i - (stripeCount - 1) / 2) * stripeWidth, -0.06, 0.38);

    awningGroup.add(stripe, fringe);
  }
  kioskGroup.add(awningGroup);

  // --- Marquee Sign & Lightning Emblem ---
  const canvasElem = document.createElement('canvas');
  canvasElem.width = 1024;
  canvasElem.height = 256;
  const ctx = canvasElem.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#082f49';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 84px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#7dd3fc';
    ctx.shadowBlur = 18;
    const signText = (storeTitle || 'KIOSKY').toUpperCase();
    ctx.fillText(`⚡ ${signText.length > 20 ? signText.slice(0, 18) + '...' : signText} ⚡`, 512, 128);
  }

  const signTexture = new THREE.CanvasTexture(canvasElem);
  const signMat = new THREE.MeshBasicMaterial({ map: signTexture });

  const signBacking = createBox(1.8, 0.4, 0.08, materials.metalSilver);
  signBacking.position.set(0, 2.76, 0.82);

  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 0.34), signMat);
  signMesh.position.set(0, 2.76, 0.87);

  kioskGroup.add(signBacking, signMesh);

  const emblemCenter = createBox(0.14, 0.22, 0.08, materials.cyanAccent);
  emblemCenter.position.set(0, 3.02, 0.84);
  emblemCenter.rotation.z = 0.35;
  kioskGroup.add(emblemCenter);

  const bulbX = [-0.82, -0.41, 0, 0.41, 0.82];
  bulbX.forEach((bx) => {
    const bulbTop = createBox(0.05, 0.05, 0.05, materials.bulbGlow);
    bulbTop.position.set(bx, 2.98, 0.88);

    const bulbBot = createBox(0.05, 0.05, 0.05, materials.bulbGlow);
    bulbBot.position.set(bx, 2.54, 0.88);

    kioskGroup.add(bulbTop, bulbBot);
  });

  // --- Speakers, Storage, Skateboard, Basketball & Stool ---
  [-0.95, 0.95].forEach((sx) => {
    const chain = createBox(0.015, 0.3, 0.015, materials.metalSilver);
    chain.position.set(sx, 2.1, 0.85);

    const speaker = createBox(0.22, 0.26, 0.18, materials.darkCharcoal);
    speaker.position.set(sx, 1.88, 0.85);

    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.02, 12), materials.cyanAccent);
    cone.rotation.x = Math.PI / 2;
    cone.position.set(sx, 1.88, 0.95);

    kioskGroup.add(chain, speaker, cone);
  });

  const tubLeft = createBox(0.5, 0.28, 0.3, materials.lightBlueDark);
  tubLeft.position.set(-1.1, 0.26, 1.1);

  const tubRight = createBox(0.5, 0.28, 0.3, materials.lightBlueDark);
  tubRight.position.set(1.1, 0.26, 1.1);

  kioskGroup.add(tubLeft, tubRight);

  // Skateboard
  const skateGroup = new THREE.Group();
  skateGroup.position.set(0.85, 0.42, 0.92);
  skateGroup.rotation.set(0.15, -0.3, -0.2);

  const deckMesh = createBox(0.18, 0.65, 0.02, materials.skateDeck);
  const gripMesh = createBox(0.17, 0.64, 0.005, materials.skateGrip);
  gripMesh.position.z = 0.012;

  [-0.07, 0.07].forEach((wx) => {
    [-0.22, 0.22].forEach((wy) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), materials.skateWheel);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, -0.025);
      skateGroup.add(wheel);
    });
  });

  skateGroup.add(deckMesh, gripMesh);
  kioskGroup.add(skateGroup);

  // Basketball
  const bball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), materials.basketballOrange);
  bball.position.set(-1.1, 0.28, 1.25);
  kioskGroup.add(bball);

  // Gamer Barstool
  const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16), materials.darkCharcoal);
  stoolSeat.position.set(-0.85, 0.46, 1.3);

  const seatTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.015, 16), materials.cyanAccent);
  seatTrim.position.set(-0.85, 0.46, 1.3);

  const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.32, 8), materials.metalSilver);
  stoolLeg.position.set(-0.85, 0.28, 1.3);

  kioskGroup.add(stoolSeat, seatTrim, stoolLeg);

  // LED Lights
  const lightPositions: [number, number, number][] = [
    [-0.9, 2.05, 1.05],
    [-0.5, 2.02, 1.08],
    [0, 2.0, 1.1],
    [0.5, 2.02, 1.08],
    [0.9, 2.05, 1.05],
    [-1.0, 2.05, 0.5],
    [1.0, 2.05, 0.5],
    [-1.0, 2.05, -0.2],
    [1.0, 2.05, -0.2],
  ];

  lightPositions.forEach(([lx, ly, lz], idx) => {
    const fairyNode = createBox(0.04, 0.05, 0.04, materials.fairyLightGlow);
    fairyNode.position.set(lx, ly, lz);
    kioskGroup.add(fairyNode);

    if (idx % 2 === 0) {
      const pLight = new THREE.PointLight(0xf97316, 0.6, 1.5);
      pLight.position.set(lx, ly - 0.04, lz);
      fairyLights.push(pLight);
      kioskGroup.add(pLight);
    }
  });

  // Cyber Pixel Particles
  type SparkleItem = {
    mesh: THREE.Mesh;
    baseX: number;
    baseY: number;
    speedY: number;
    rotSpeed: number;
    offset: number;
  };
  const sparkleGroup: SparkleItem[] = [];

  for (let i = 0; i < 26; i++) {
    const mat = i % 2 === 0 ? materials.cyanAccent : materials.orangeAccent;
    const spark = createBox(0.04, 0.04, 0.04, mat);

    const initX = (Math.random() - 0.5) * 4.2;
    const initY = 0.6 + Math.random() * 2.6;
    const initZ = (Math.random() - 0.5) * 4.2;
    spark.position.set(initX, initY, initZ);

    sparkleGroup.push({
      mesh: spark,
      baseX: initX,
      baseY: initY,
      speedY: 0.2 + Math.random() * 0.4,
      rotSpeed: (Math.random() - 0.5) * 2.0,
      offset: Math.random() * Math.PI * 2,
    });
    kioskGroup.add(spark);
  }

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    counterLight.intensity = 2.4 + Math.sin(time * 3.5) * 0.25;
    marqueeLight.intensity = 2.2 + Math.sin(time * 5.0) * 0.35;

    fairyLights.forEach((light, i) => {
      light.intensity = 0.5 + Math.sin(time * 6.0 + i) * 0.25;
    });

    kioskGroup.rotation.y = Math.sin(time * 0.2) * 0.12;

    sparkleGroup.forEach((p) => {
      p.mesh.position.y = p.baseY + Math.sin(time * 1.8 + p.offset) * 0.12;
      p.mesh.position.x = p.baseX + Math.cos(time * 1.2 + p.offset) * 0.08;
      p.mesh.rotation.y += p.rotSpeed * 0.01;
      p.mesh.rotation.z += p.rotSpeed * 0.005;
    });

    renderer.render(scene, camera);
  };

  animate();

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

/**
 * Builds the 3D Minecraft-Style Medium Format Store scene (Camera, Hardware & Tech Voxel Store).
 * Grants +5 extra spaces (15 items total) upon unlocking for $5.00.
 */
export function setupMediumFormatStoreScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  storeTitle?: string
) {
  const scene = new THREE.Scene();

  // Consistent camera angle framing like other store buildings
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(4.5, 3.2, 5.5);
  camera.lookAt(0, 1.1, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Canvas-based 16x16 pixel art texture generator for authentic Minecraft voxel look
  function createPixelTexture(type: string): THREE.CanvasTexture {
    const cvs = document.createElement('canvas');
    cvs.width = 16;
    cvs.height = 16;
    const ctx = cvs.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(cvs);

    const noise = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    if (type === 'brick') {
      ctx.fillStyle = '#9b4733';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const n = noise(-15, 15);
          ctx.fillStyle = `rgb(${155 + n}, ${71 + Math.floor(n / 2)}, ${51 + Math.floor(n / 2)})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#c2b1a1';
      ctx.fillRect(0, 3, 16, 1);
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(0, 11, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(7, 0, 1, 3);
      ctx.fillRect(15, 0, 1, 3);
      ctx.fillRect(3, 4, 1, 3);
      ctx.fillRect(11, 4, 1, 3);
      ctx.fillRect(7, 8, 1, 3);
      ctx.fillRect(15, 8, 1, 3);
      ctx.fillRect(3, 12, 1, 3);
      ctx.fillRect(11, 12, 1, 3);
    } else if (type === 'planks') {
      ctx.fillStyle = '#a2784d';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const n = noise(-12, 12);
          ctx.fillStyle = `rgb(${162 + n}, ${120 + n}, ${77 + n})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#5c4125';
      ctx.fillRect(0, 3, 16, 1);
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(0, 11, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
    } else if (type === 'dark_concrete') {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const n = noise(-10, 10);
          ctx.fillStyle = `rgb(${55 + n}, ${58 + n}, ${62 + n})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    } else if (type === 'quartz') {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const n = noise(-6, 6);
          ctx.fillStyle = `rgb(${235 + n}, ${232 + n}, ${226 + n})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.strokeStyle = 'rgba(200, 195, 185, 0.5)';
      ctx.strokeRect(0.5, 0.5, 15, 15);
    } else if (type === 'stone_brick') {
      ctx.fillStyle = '#7a7c7e';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const n = noise(-14, 14);
          ctx.fillStyle = `rgb(${122 + n}, ${124 + n}, ${126 + n})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#3a3b3c';
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(7, 0, 1, 7);
      ctx.fillRect(15, 8, 1, 7);
    } else if (type === 'glass') {
      ctx.fillStyle = 'rgba(180, 220, 240, 0.35)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillRect(15, 0, 1, 16);
      ctx.fillRect(3, 3, 2, 2);
      ctx.fillRect(5, 5, 2, 2);
      ctx.fillRect(10, 10, 2, 2);
    } else if (type === 'glowstone') {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const n = noise(0, 40);
          ctx.fillStyle = `rgb(245, ${200 + n}, ${110 + n})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 6, 4, 4);
    } else if (type === 'sign_logo') {
      ctx.fillStyle = '#1c1e24';
      ctx.fillRect(0, 0, 16, 16);
      ctx.strokeStyle = '#d4af37';
      ctx.strokeRect(0.5, 0.5, 15, 15);
      ctx.fillStyle = '#3a86ff';
      ctx.fillRect(5, 5, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 7, 2, 2);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(4, 3, 8, 1);
      ctx.fillRect(2, 6, 1, 4);
      ctx.fillRect(13, 6, 1, 4);
    } else if (type === 'camera_box') {
      ctx.fillStyle = '#181818';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(0, 0, 16, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 8, 12, 4);
    } else if (type === 'metal') {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const n = noise(-10, 10);
          ctx.fillStyle = `rgb(${180 + n}, ${185 + n}, ${190 + n})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  // Root group scaled to be consistent with other buildings
  const mediumStoreGroup = new THREE.Group();
  mediumStoreGroup.scale.set(0.42, 0.42, 0.42);
  mediumStoreGroup.position.set(0, 0.15, 0);
  scene.add(mediumStoreGroup);

  // Materials lookup map
  const materials: Record<string, THREE.Material> = {
    brick: new THREE.MeshStandardMaterial({ map: createPixelTexture('brick'), roughness: 0.8 }),
    planks: new THREE.MeshStandardMaterial({ map: createPixelTexture('planks'), roughness: 0.7 }),
    dark_concrete: new THREE.MeshStandardMaterial({ map: createPixelTexture('dark_concrete'), roughness: 0.9 }),
    quartz: new THREE.MeshStandardMaterial({ map: createPixelTexture('quartz'), roughness: 0.3 }),
    stone_brick: new THREE.MeshStandardMaterial({ map: createPixelTexture('stone_brick'), roughness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({
      map: createPixelTexture('glass'),
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      depthWrite: false,
    }),
    glowstone: new THREE.MeshStandardMaterial({
      map: createPixelTexture('glowstone'),
      emissive: new THREE.Color('#ffd580'),
      emissiveIntensity: 0.8,
    }),
    sign_logo: new THREE.MeshStandardMaterial({ map: createPixelTexture('sign_logo'), roughness: 0.4 }),
    camera_box: new THREE.MeshStandardMaterial({ map: createPixelTexture('camera_box'), roughness: 0.5 }),
    metal: new THREE.MeshStandardMaterial({ map: createPixelTexture('metal'), metalness: 0.7, roughness: 0.3 }),
    black_metal: new THREE.MeshStandardMaterial({ color: 0x222224, roughness: 0.5 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 }),
  };

  // Shared Unit Box Geometry
  const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
  const blockBatches: Record<string, THREE.Vector3[]> = {};
  Object.keys(materials).forEach((k) => {
    blockBatches[k] = [];
  });

  function addBlock(x: number, y: number, z: number, matName: string) {
    if (blockBatches[matName]) {
      blockBatches[matName].push(new THREE.Vector3(x, y, z));
    }
  }

  // 1. COMPACT CONCRETE BASE (TINY FOOTPRINT)
  for (let x = -4; x <= 4; x++) {
    for (let z = -4; z <= 4; z++) {
      const isInteriorFloor = x >= -3 && x <= 3 && z >= -3 && z <= 3;
      if (isInteriorFloor) {
        addBlock(x, 0, z, (x + z) % 2 === 0 ? 'quartz' : 'dark_concrete');
      } else {
        addBlock(x, 0, z, 'stone_brick');
      }
    }
  }

  // 2. MINI WALLS & STRUCTURE (Y = 1 to 3)
  for (let y = 1; y <= 3; y++) {
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        const isCorner = (x === -3 || x === 3) && (z === -3 || z === 3);
        const isBackWall = z === -3;
        const isSideWall = x === -3 || x === 3;
        const isFrontWall = z === 3;

        if (isCorner) {
          addBlock(x, y, z, 'dark_concrete');
        } else if (isBackWall) {
          if (y === 1) addBlock(x, y, z, 'stone_brick');
          else addBlock(x, y, z, 'dark_concrete');
        } else if (isSideWall) {
          if (y === 1) addBlock(x, y, z, 'stone_brick');
          else if (z === 0 && y === 2) addBlock(x, y, z, 'glass');
          else addBlock(x, y, z, 'dark_concrete');
        } else if (isFrontWall) {
          if (y === 1) {
            if (x === 0) addBlock(x, y, z, 'glass');
            else if (x === -1 || x === 1) addBlock(x, y, z, 'quartz');
            else addBlock(x, y, z, 'stone_brick');
          } else if (y === 2) {
            if (x === 0) addBlock(x, y, z, 'glass');
            else if (x === -1 || x === 1) addBlock(x, y, z, 'glass');
            else addBlock(x, y, z, 'dark_concrete');
          } else if (y === 3) {
            addBlock(x, y, z, 'quartz');
          }
        }
      }
    }
  }

  // 3. MINI OVERHANG & SIGNBOARD (Y = 3 & 4)
  for (let x = -3; x <= 3; x++) {
    addBlock(x, 3, 4, 'dark_concrete');
  }
  for (let x = -2; x <= 2; x++) {
    if (x === 0) {
      addBlock(x, 4, 4, 'sign_logo');
    } else {
      addBlock(x, 4, 4, 'dark_concrete');
    }
  }

  // 4. MINI INTERIOR FURNISHINGS
  addBlock(1, 1, -1, 'planks');
  addBlock(1, 1, 0, 'quartz');
  addBlock(-1, 1, 1, 'quartz');
  addBlock(0, 3, 0, 'glowstone');

  // 5. ROOF DETAILS
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {
      if (x === -3 || x === 3 || z === -3 || z === 3) {
        addBlock(x, 4, z, 'quartz');
      } else {
        addBlock(x, 3, z, 'stone_brick');
      }
    }
  }
  addBlock(-1, 4, -1, 'metal');
  addBlock(1, 3, 0, 'glass');

  // Render batched voxel blocks using InstancedMesh
  Object.keys(blockBatches).forEach((matName) => {
    const positions = blockBatches[matName];
    if (positions.length === 0) return;

    const instancedMesh = new THREE.InstancedMesh(unitBoxGeo, materials[matName], positions.length);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    mediumStoreGroup.add(instancedMesh);
  });

  // Miniature Cameras inside display window and counter
  function createVoxelCamera(x: number, y: number, z: number) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const bodyMesh = new THREE.Mesh(bodyGeo, materials.black_metal);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    const trimGeo = new THREE.BoxGeometry(0.52, 0.48, 0.48);
    const trimMesh = new THREE.Mesh(trimGeo, materials.metal);
    group.add(trimMesh);

    const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 8);
    lensGeo.rotateX(Math.PI / 2);
    const lensMesh = new THREE.Mesh(lensGeo, materials.metal);
    lensMesh.position.set(0, 0, 0.3);
    lensMesh.castShadow = true;
    group.add(lensMesh);

    const lensGlassGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 8);
    lensGlassGeo.rotateX(Math.PI / 2);
    const lensGlassMesh = new THREE.Mesh(lensGlassGeo, materials.glass);
    lensGlassMesh.position.set(0, 0, 0.48);
    group.add(lensGlassMesh);

    const hoodGeo = new THREE.BoxGeometry(0.3, 0.18, 0.3);
    const hoodMesh = new THREE.Mesh(hoodGeo, materials.black_metal);
    hoodMesh.position.set(0, 0.32, 0);
    group.add(hoodMesh);

    group.position.set(x, y, z);
    mediumStoreGroup.add(group);
  }

  createVoxelCamera(-1, 1.5, 1);
  createVoxelCamera(1, 1.5, -1);

  // Main Storefront Title Signboard "MEDIUM STORE" (or custom store name)
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 160;
  signCanvas.height = 32;
  const signCtx = signCanvas.getContext('2d');
  if (signCtx) {
    signCtx.fillStyle = '#12141a';
    signCtx.fillRect(0, 0, 160, 32);

    signCtx.fillStyle = '#ffd700';
    signCtx.fillRect(0, 0, 160, 2);
    signCtx.fillRect(0, 30, 160, 2);
    signCtx.fillRect(0, 0, 2, 32);
    signCtx.fillRect(158, 0, 2, 32);

    signCtx.fillStyle = '#ffd700';
    signCtx.fillRect(8, 8, 16, 16);
    signCtx.fillStyle = '#12141a';
    signCtx.fillRect(11, 11, 10, 10);
    signCtx.fillStyle = '#3a86ff';
    signCtx.fillRect(14, 14, 4, 4);

    const textToPrint = (storeTitle || 'MEDIUM STORE').toUpperCase().slice(0, 14);
    signCtx.fillStyle = '#ffffff';
    signCtx.font = 'bold 12px monospace';
    signCtx.textAlign = 'center';
    signCtx.textBaseline = 'middle';
    signCtx.fillText(textToPrint, 92, 16);
  }

  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.magFilter = THREE.NearestFilter;
  signTexture.minFilter = THREE.NearestFilter;

  const signGeo = new THREE.BoxGeometry(4.4, 0.95, 0.15);
  const signMat = new THREE.MeshStandardMaterial({
    map: signTexture,
    roughness: 0.3,
    emissive: new THREE.Color(0x333333),
  });
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 4.05, 4.58);
  signMesh.castShadow = true;
  mediumStoreGroup.add(signMesh);

  // Dedicated sign spotlight
  const signLight = new THREE.PointLight(0xfffae6, 1.8, 4.5);
  signLight.position.set(0, 4.7, 4.9);
  mediumStoreGroup.add(signLight);

  // Warm interior store glow
  const interiorLight = new THREE.PointLight(0xffaa44, 2.0, 7.0);
  interiorLight.position.set(0, 2.2, 0);
  mediumStoreGroup.add(interiorLight);

  // Warm Directional Sunlight
  const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
  sunLight.position.set(6, 10, 6);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Ambient sky light
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  // ANIMATION LOOP
  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Gentle idle rotation so it feels alive and matches the other buildings
    mediumStoreGroup.rotation.y = Math.sin(time * 0.25) * 0.15;

    renderer.render(scene, camera);
  };

  animate();

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}



/**
 * Builds the 3D Sketch Store Building scene (Ink sketch toon-shaded 2-floor corner store with vibrant interior).
 * Grants +5 extra spaces (15 items total) upon unlocking for $5.00.
 */
export function setupSketchStoreScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  storeTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(4.8, 3.6, 5.8);
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

  // Black & white toon ramp for ink sketch shading
  const toonColors = new Uint8Array([90, 190, 255]);
  const gradientMap = new THREE.DataTexture(toonColors, 3, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.needsUpdate = true;

  // Dark ink line material for sketch outlines
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x111111,
    linewidth: 1.5,
  });

  // Helper to wrap mesh with ink sketch edge outlines
  function createSketchMesh(geometry: THREE.BufferGeometry, material: THREE.Material, threshold = 20) {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry, threshold);
    const line = new THREE.LineSegments(edges, lineMaterial);
    group.add(line);
    return group;
  }

  function makeToonMat(colorHex: number, transparent = false, opacity = 1.0) {
    return new THREE.MeshToonMaterial({
      color: colorHex,
      gradientMap: gradientMap,
      transparent: transparent,
      opacity: opacity,
    });
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xfffdfa, 1.5);
  mainLight.position.set(12, 18, 14);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xdbe6f0, 0.6);
  fillLight.position.set(-8, 8, -8);
  scene.add(fillLight);

  const gfInteriorLight = new THREE.PointLight(0xffd5a1, 1.8, 8);
  gfInteriorLight.position.set(0, 1.2, -0.2);
  scene.add(gfInteriorLight);

  const sfInteriorLight = new THREE.PointLight(0xffe3c4, 1.8, 8);
  sfInteriorLight.position.set(0, 2.2, -0.2);
  scene.add(sfInteriorLight);

  const colors = {
    sidewalk: 0xd8d4cd,
    wallExterior: 0xf5f5f5,
    wallTrim: 0x1f1f1f,
    roof: 0xcccccc,
    awningDark: 0x1a1a1a,
    awningLight: 0xfafafa,
    metal: 0x222222,
    gfFloorWood: 0xdca872,
    sfFloorWood: 0xbc8a55,
    accentWallGF: 0x3a5a40,
    accentWallSF: 0xc86d51,
    shelfWood: 0x8c5e34,
    counterWood: 0x6e4727,
    coral: 0xef476f,
    teal: 0x06d6a0,
    gold: 0xffd166,
    blue: 0x118ab2,
    purple: 0x8338ec,
    pink: 0xff006e,
    orange: 0xf77f00,
    lime: 0x70e000,
    mint: 0xa8edda,
    plantGreen: 0x2d6a4f,
    potTerracotta: 0xbe5a38,
    mannequin: 0xefd9ce,
  };

  const storeGroup = new THREE.Group();
  storeGroup.scale.set(0.25, 0.25, 0.25);
  storeGroup.position.set(0, 0.05, 0);
  scene.add(storeGroup);

  // Sidewalk slab
  const sidewalkGeo = new THREE.BoxGeometry(11, 0.3, 9);
  const sidewalkMat = makeToonMat(colors.sidewalk);
  const sidewalk = createSketchMesh(sidewalkGeo, sidewalkMat);
  sidewalk.position.set(0, 0.15, 0.5);
  storeGroup.add(sidewalk);

  const buildingWidth = 7.6;
  const buildingDepth = 5.6;
  const wallThickness = 0.25;
  const gfHeight = 3.4;
  const wallExtMat = makeToonMat(colors.wallExterior);

  // Exterior Back Wall
  const gfBackExtGeo = new THREE.BoxGeometry(buildingWidth, gfHeight, wallThickness);
  const gfBackExt = createSketchMesh(gfBackExtGeo, wallExtMat);
  gfBackExt.position.set(0, 2.0, -buildingDepth / 2 - 0.5 + wallThickness / 2);
  storeGroup.add(gfBackExt);

  // Inner Accent Wall
  const gfBackIntGeo = new THREE.BoxGeometry(buildingWidth - 2 * wallThickness, gfHeight - 0.1, 0.02);
  const gfBackIntMat = makeToonMat(colors.accentWallGF);
  const gfBackInt = createSketchMesh(gfBackIntGeo, gfBackIntMat);
  gfBackInt.position.set(0, 2.0, -buildingDepth / 2 - 0.5 + wallThickness + 0.01);
  storeGroup.add(gfBackInt);

  // GF Side Walls
  const sideWallDepth = buildingDepth - wallThickness;
  const gfSideGeo = new THREE.BoxGeometry(wallThickness, gfHeight, sideWallDepth);
  const sideCenterZ = -0.5 + wallThickness / 2;

  const gfLeft = createSketchMesh(gfSideGeo, wallExtMat);
  gfLeft.position.set(-buildingWidth / 2 + wallThickness / 2, 2.0, sideCenterZ);
  storeGroup.add(gfLeft);

  const gfRight = createSketchMesh(gfSideGeo, wallExtMat);
  gfRight.position.set(buildingWidth / 2 - wallThickness / 2, 2.0, sideCenterZ);
  storeGroup.add(gfRight);

  // GF Wood Floor
  const gfFloorGeo = new THREE.BoxGeometry(buildingWidth - 0.4, 0.08, buildingDepth - 0.4);
  const gfFloorMat = makeToonMat(colors.gfFloorWood);
  const gfFloor = createSketchMesh(gfFloorGeo, gfFloorMat);
  gfFloor.position.set(0, 0.34, -0.5);
  storeGroup.add(gfFloor);

  // Mid Slab
  const midSlabGeo = new THREE.BoxGeometry(buildingWidth + 0.3, 0.28, buildingDepth + 0.3);
  const trimMat = makeToonMat(colors.wallTrim);
  const midSlab = createSketchMesh(midSlabGeo, trimMat);
  midSlab.position.set(0, 3.75, -0.5);
  storeGroup.add(midSlab);

  const sfHeight = 3.0;

  // 2nd Floor Exterior Back Wall
  const sfBackExtGeo = new THREE.BoxGeometry(buildingWidth, sfHeight, wallThickness);
  const sfBackExt = createSketchMesh(sfBackExtGeo, wallExtMat);
  sfBackExt.position.set(0, 5.375, -buildingDepth / 2 - 0.5 + wallThickness / 2);
  storeGroup.add(sfBackExt);

  // 2nd Floor Accent Wall
  const sfBackIntGeo = new THREE.BoxGeometry(buildingWidth - 2 * wallThickness, sfHeight - 0.1, 0.02);
  const sfBackIntMat = makeToonMat(colors.accentWallSF);
  const sfBackInt = createSketchMesh(sfBackIntGeo, sfBackIntMat);
  sfBackInt.position.set(0, 5.375, -buildingDepth / 2 - 0.5 + wallThickness + 0.01);
  storeGroup.add(sfBackInt);

  // SF Side Walls
  const sfSideGeo = new THREE.BoxGeometry(wallThickness, sfHeight, sideWallDepth);
  const sfLeft = createSketchMesh(sfSideGeo, wallExtMat);
  sfLeft.position.set(-buildingWidth / 2 + wallThickness / 2, 5.375, sideCenterZ);
  storeGroup.add(sfLeft);

  const sfRight = createSketchMesh(sfSideGeo, wallExtMat);
  sfRight.position.set(buildingWidth / 2 - wallThickness / 2, 5.375, sideCenterZ);
  storeGroup.add(sfRight);

  // SF Wood Floor
  const sfFloorGeo = new THREE.BoxGeometry(buildingWidth - 0.4, 0.06, buildingDepth - 0.4);
  const sfFloorMat = makeToonMat(colors.sfFloorWood);
  const sfFloor = createSketchMesh(sfFloorGeo, sfFloorMat);
  sfFloor.position.set(0, 3.92, -0.5);
  storeGroup.add(sfFloor);

  // 1. Reception / Cashier Desk
  const deskGroup = new THREE.Group();
  deskGroup.position.set(2.2, 0.38, -1.8);

  const counterGeo = new THREE.BoxGeometry(2.0, 1.0, 0.9);
  const counterMat = makeToonMat(colors.counterWood);
  const counter = createSketchMesh(counterGeo, counterMat);
  counter.position.set(0, 0.5, 0);
  deskGroup.add(counter);

  const posGeo = new THREE.BoxGeometry(0.45, 0.35, 0.4);
  const posMat = makeToonMat(colors.metal);
  const pos = createSketchMesh(posGeo, posMat);
  pos.position.set(-0.4, 1.15, 0.1);
  deskGroup.add(pos);

  const screenGeo = new THREE.BoxGeometry(0.35, 0.28, 0.05);
  const screenMat = makeToonMat(colors.teal);
  const screen = createSketchMesh(screenGeo, screenMat);
  screen.position.set(-0.4, 1.35, 0.2);
  screen.rotation.x = -0.2;
  deskGroup.add(screen);

  [0.4, 0.7].forEach((xPos, idx) => {
    const bagGeo = new THREE.BoxGeometry(0.28, 0.35, 0.18);
    const bagMat = makeToonMat(idx === 0 ? colors.pink : colors.gold);
    const bag = createSketchMesh(bagGeo, bagMat);
    bag.position.set(xPos, 1.18, 0);
    deskGroup.add(bag);
  });
  storeGroup.add(deskGroup);

  // 2. GF Back Wall Display Shelving Racks
  const wallShelfGroup = new THREE.Group();
  wallShelfGroup.position.set(-1.2, 0.38, -2.8);

  [-1.8, 0, 1.8].forEach((x) => {
    const postGeo = new THREE.BoxGeometry(0.08, 2.6, 0.4);
    const postMat = makeToonMat(colors.shelfWood);
    const post = createSketchMesh(postGeo, postMat);
    post.position.set(x, 1.3, 0);
    wallShelfGroup.add(post);
  });

  [0.4, 1.0, 1.6, 2.2].forEach((y) => {
    const plankGeo = new THREE.BoxGeometry(3.6, 0.06, 0.4);
    const plankMat = makeToonMat(colors.shelfWood);
    const plank = createSketchMesh(plankGeo, plankMat);
    plank.position.set(0, y, 0);
    wallShelfGroup.add(plank);
  });

  const itemColors = [
    colors.coral, colors.teal, colors.gold, colors.blue,
    colors.purple, colors.pink, colors.orange, colors.lime,
  ];

  [0.45, 1.05, 1.65, 2.25].forEach((y, tier) => {
    for (let x = -1.5; x <= 1.5; x += 0.42) {
      const colorHex = itemColors[(Math.abs(Math.floor(x * 10)) + tier * 3) % itemColors.length];
      const itemType = (tier + Math.floor(x * 5)) % 3;

      if (itemType === 0) {
        const stackGeo = new THREE.BoxGeometry(0.3, 0.14, 0.28);
        const stack = createSketchMesh(stackGeo, makeToonMat(colorHex));
        stack.position.set(x, y + 0.07, 0);
        wallShelfGroup.add(stack);
      } else if (itemType === 1) {
        const boxGeo = new THREE.BoxGeometry(0.24, 0.22, 0.24);
        const box = createSketchMesh(boxGeo, makeToonMat(colorHex));
        box.position.set(x, y + 0.11, 0);
        wallShelfGroup.add(box);
      } else {
        const vaseGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8);
        const vase = createSketchMesh(vaseGeo, makeToonMat(colorHex));
        vase.position.set(x, y + 0.125, 0);
        wallShelfGroup.add(vase);
      }
    }
  });
  storeGroup.add(wallShelfGroup);

  // 3. Central Island Display Table
  const islandGroup = new THREE.Group();
  islandGroup.position.set(-0.8, 0.38, -0.2);

  const tableTopGeo = new THREE.BoxGeometry(2.4, 0.1, 1.3);
  const tableTop = createSketchMesh(tableTopGeo, makeToonMat(colors.shelfWood));
  tableTop.position.set(0, 0.75, 0);
  islandGroup.add(tableTop);

  [[-1.0, -0.5], [1.0, -0.5], [-1.0, 0.5], [1.0, 0.5]].forEach(([x, z]) => {
    const legGeo = new THREE.BoxGeometry(0.08, 0.75, 0.08);
    const leg = createSketchMesh(legGeo, makeToonMat(colors.metal));
    leg.position.set(x, 0.375, z);
    islandGroup.add(leg);
  });

  const tableItems = [
    { x: -0.8, z: -0.3, w: 0.4, h: 0.25, d: 0.3, col: colors.purple },
    { x: -0.3, z: 0.2, w: 0.35, h: 0.18, d: 0.3, col: colors.teal },
    { x: 0.3, z: -0.2, w: 0.45, h: 0.22, d: 0.35, col: colors.coral },
    { x: 0.8, z: 0.2, w: 0.3, h: 0.3, d: 0.25, col: colors.gold },
  ];

  tableItems.forEach((item) => {
    const itemGeo = new THREE.BoxGeometry(item.w, item.h, item.d);
    const mesh = createSketchMesh(itemGeo, makeToonMat(item.col));
    mesh.position.set(item.x, 0.8 + item.h / 2, item.z);
    islandGroup.add(mesh);
  });
  storeGroup.add(islandGroup);

  // 4. Side Garment Racks
  const rackGroup = new THREE.Group();
  rackGroup.position.set(-2.4, 0.38, 0.2);

  const rackBarGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8);
  const rackBarMat = makeToonMat(colors.metal);
  const rackTop = createSketchMesh(rackBarGeo, rackBarMat);
  rackTop.rotation.z = Math.PI / 2;
  rackTop.position.set(0, 1.8, 0);
  rackGroup.add(rackTop);

  [-1.0, 1.0].forEach((x) => {
    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8);
    const leg = createSketchMesh(legGeo, rackBarMat);
    leg.position.set(x, 0.9, 0);
    rackGroup.add(leg);
  });

  const coatColors = [colors.pink, colors.orange, colors.blue, colors.teal, colors.gold, colors.purple];
  for (let i = 0; i < 6; i++) {
    const coatGeo = new THREE.BoxGeometry(0.12, 1.0, 0.5);
    const coat = createSketchMesh(coatGeo, makeToonMat(coatColors[i]));
    coat.position.set(-0.75 + i * 0.3, 1.2, 0);
    rackGroup.add(coat);
  }
  storeGroup.add(rackGroup);

  // 5. Display Mannequins
  [-2.0, 1.8].forEach((xPos, idx) => {
    const mannequinGroup = new THREE.Group();
    mannequinGroup.position.set(xPos, 0.38, 1.5);

    const baseGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.04, 10);
    const base = createSketchMesh(baseGeo, makeToonMat(colors.metal));
    base.position.y = 0.02;
    mannequinGroup.add(base);

    const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
    const pole = createSketchMesh(poleGeo, makeToonMat(colors.metal));
    pole.position.y = 0.6;
    mannequinGroup.add(pole);

    const torsoGeo = new THREE.CylinderGeometry(0.22, 0.16, 0.8, 10);
    const torso = createSketchMesh(torsoGeo, makeToonMat(idx === 0 ? colors.coral : colors.blue));
    torso.position.y = 1.2;
    mannequinGroup.add(torso);

    const headGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const head = createSketchMesh(headGeo, makeToonMat(colors.mannequin));
    head.position.y = 1.7;
    mannequinGroup.add(head);

    storeGroup.add(mannequinGroup);
  });

  // Stairs
  const stairGroup = new THREE.Group();
  stairGroup.position.set(2.8, 0.38, 0.2);
  const stepCount = 13;
  const stairTotalHeight = 3.53;
  const stepHeight = stairTotalHeight / stepCount;
  const stepDepth = 0.22;

  for (let i = 0; i < stepCount; i++) {
    const stepGeo = new THREE.BoxGeometry(0.9, 0.06, stepDepth);
    const step = createSketchMesh(stepGeo, makeToonMat(colors.shelfWood));
    step.position.set(0, (i + 1) * stepHeight, -i * stepDepth);
    stairGroup.add(step);
  }
  storeGroup.add(stairGroup);

  // 2nd Floor Library
  const libraryGroup = new THREE.Group();
  libraryGroup.position.set(-1.8, 3.95, -0.6);

  const bookColors = [
    colors.coral, colors.teal, colors.gold, colors.blue,
    colors.purple, colors.pink, colors.orange, colors.lime,
  ];

  const wallCaseGroup = new THREE.Group();
  wallCaseGroup.position.set(-0.6, 0, -0.8);
  const caseFrameGeo = new THREE.BoxGeometry(2.4, 2.5, 0.45);
  const caseFrameMat = makeToonMat(colors.shelfWood);
  const caseFrame = createSketchMesh(caseFrameGeo, caseFrameMat);
  caseFrame.position.set(0, 1.25, 0);
  wallCaseGroup.add(caseFrame);

  for (let s = 1; s <= 4; s++) {
    const shelfPlankGeo = new THREE.BoxGeometry(2.2, 0.05, 0.4);
    const shelfPlank = createSketchMesh(shelfPlankGeo, caseFrameMat);
    shelfPlank.position.set(0, s * 0.5, 0);
    wallCaseGroup.add(shelfPlank);

    for (let currentX = -0.9; currentX < 0.85; currentX += 0.22) {
      const bookGeo = new THREE.BoxGeometry(0.14, 0.32, 0.3);
      const book = createSketchMesh(bookGeo, makeToonMat(bookColors[Math.abs(Math.floor(currentX * 10)) % bookColors.length]));
      book.position.set(currentX, (s - 1) * 0.5 + 0.18, 0.02);
      wallCaseGroup.add(book);
    }
  }
  libraryGroup.add(wallCaseGroup);

  // Central Double-Sided Book Island
  const islandBookshelfGroup = new THREE.Group();
  islandBookshelfGroup.position.set(1.1, 0, 0.4);
  const islandFrameGeo = new THREE.BoxGeometry(2.0, 1.4, 0.7);
  const islandFrame = createSketchMesh(islandFrameGeo, caseFrameMat);
  islandFrame.position.set(0, 0.7, 0);
  islandBookshelfGroup.add(islandFrame);
  libraryGroup.add(islandBookshelfGroup);

  storeGroup.add(libraryGroup);

  // Art Gallery on 2nd Floor
  const sfArtGroup = new THREE.Group();
  sfArtGroup.position.set(-0.8, 3.95, -2.8);

  const paintings = [
    { x: -1.8, y: 1.5, w: 0.9, h: 1.1, c: colors.pink },
    { x: -0.6, y: 1.6, w: 1.1, h: 0.8, c: colors.gold },
    { x: 0.6, y: 1.5, w: 0.8, h: 1.2, c: colors.teal },
    { x: 1.6, y: 1.6, w: 0.8, h: 0.8, c: colors.purple },
  ];

  paintings.forEach((p) => {
    const frameGeo = new THREE.BoxGeometry(p.w, p.h, 0.06);
    const frame = createSketchMesh(frameGeo, makeToonMat(colors.metal));
    frame.position.set(p.x, p.y, 0);
    sfArtGroup.add(frame);

    const canvasGeo = new THREE.BoxGeometry(p.w - 0.1, p.h - 0.1, 0.07);
    const canvasMesh = createSketchMesh(canvasGeo, makeToonMat(p.c));
    canvasMesh.position.set(p.x, p.y, 0.01);
    sfArtGroup.add(canvasMesh);
  });
  storeGroup.add(sfArtGroup);

  // Glass Front Windows
  const glassMat = new THREE.MeshToonMaterial({
    color: 0xeef7fc,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    gradientMap: gradientMap,
  });

  const gfGlassGeo = new THREE.BoxGeometry(buildingWidth - 0.5, 3.2, 0.04);
  const gfGlassMesh = new THREE.Mesh(gfGlassGeo, glassMat);
  gfGlassMesh.position.set(0, 2.0, buildingDepth / 2 - 0.4);
  storeGroup.add(gfGlassMesh);

  const sfGlassGeo = new THREE.BoxGeometry(buildingWidth - 0.5, sfHeight - 0.2, 0.04);
  const sfGlassMesh = new THREE.Mesh(sfGlassGeo, glassMat);
  sfGlassMesh.position.set(0, 5.375, buildingDepth / 2 - 0.4);
  storeGroup.add(sfGlassMesh);

  // Frame Mullions
  const frameMat = makeToonMat(colors.wallTrim);
  [-buildingWidth / 2 + 0.25, -1.2, 0, 1.2, buildingWidth / 2 - 0.25].forEach((x) => {
    const vMullionGeo = new THREE.BoxGeometry(0.1, 3.2, 0.12);
    const mullion = createSketchMesh(vMullionGeo, frameMat);
    mullion.position.set(x, 2.0, buildingDepth / 2 - 0.38);
    storeGroup.add(mullion);
  });

  const hMullionGeo = new THREE.BoxGeometry(buildingWidth - 0.5, 0.08, 0.12);
  const hMullion = createSketchMesh(hMullionGeo, frameMat);
  hMullion.position.set(0, 2.3, buildingDepth / 2 - 0.38);
  storeGroup.add(hMullion);

  // Canopy Awning
  const awningGroup = new THREE.Group();
  awningGroup.position.set(0, 3.5, buildingDepth / 2 - 0.35);
  const stripeCount = 12;
  const awningWidth = 6.8;
  const stripeWidth = awningWidth / stripeCount;
  const awningDepth = 1.4;

  for (let i = 0; i < stripeCount; i++) {
    const stripeGeo = new THREE.BoxGeometry(stripeWidth, 0.08, awningDepth);
    const isDark = i % 2 === 0;
    const stripe = createSketchMesh(stripeGeo, makeToonMat(isDark ? colors.awningDark : colors.awningLight));
    stripe.position.set(-awningWidth / 2 + stripeWidth / 2 + i * stripeWidth, 0, awningDepth / 2);
    stripe.rotation.x = 0.22;
    awningGroup.add(stripe);
  }
  storeGroup.add(awningGroup);

  // Roof & Parapet
  const roofGeo = new THREE.BoxGeometry(buildingWidth + 0.4, 0.3, buildingDepth + 0.4);
  const roofBase = createSketchMesh(roofGeo, makeToonMat(colors.wallTrim));
  roofBase.position.set(0, 6.85, -0.5);
  storeGroup.add(roofBase);

  const parapetGeo = new THREE.BoxGeometry(buildingWidth + 0.2, 0.5, 0.2);
  const frontParapet = createSketchMesh(parapetGeo, wallExtMat);
  frontParapet.position.set(0, 7.25, buildingDepth / 2 - 0.4);
  storeGroup.add(frontParapet);

  // Roof AC Unit & Chimney
  const acGeo = new THREE.BoxGeometry(1.2, 0.8, 1.0);
  const acUnit = createSketchMesh(acGeo, makeToonMat(colors.metal));
  acUnit.position.set(-2.0, 7.4, -1.2);
  storeGroup.add(acUnit);

  const chimneyGeo = new THREE.BoxGeometry(0.8, 1.6, 0.8);
  const chimney = createSketchMesh(chimneyGeo, wallExtMat);
  chimney.position.set(2.2, 7.6, -1.5);
  storeGroup.add(chimney);

  // Rooftop Billboard Frame & Storefront Sign
  const billboardGroup = new THREE.Group();
  billboardGroup.position.set(0, 7.2, 1.8);

  [-1.8, 1.8].forEach((x) => {
    const legGeo = new THREE.BoxGeometry(0.08, 1.8, 0.08);
    const leg = createSketchMesh(legGeo, makeToonMat(colors.metal));
    leg.position.set(x, 0.9, -0.06);
    billboardGroup.add(leg);
  });

  const boardFrameGeo = new THREE.BoxGeometry(3.6, 1.8, 0.1);
  const boardFrame = createSketchMesh(boardFrameGeo, makeToonMat(colors.wallTrim));
  boardFrame.position.set(0, 1.8, 0);
  billboardGroup.add(boardFrame);

  // Canvas-based Billboard Sign
  const bbCanvas = document.createElement('canvas');
  bbCanvas.width = 1024;
  bbCanvas.height = 512;
  const ctx = bbCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 512);

    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 16;
    ctx.strokeRect(18, 18, 988, 476);
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, 960, 448);

    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('— EST. 2026 —', 512, 105);

    ctx.font = '900 78px sans-serif';
    const titleText = (storeTitle || 'THE CORNER STORE').toUpperCase().slice(0, 20);
    ctx.fillText(titleText, 512, 220);

    ctx.beginPath();
    ctx.moveTo(160, 290);
    ctx.lineTo(864, 290);
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.font = '600 36px monospace';
    ctx.fillText('BOOKS • APPAREL • CURATED GOODS', 512, 375);
  }

  const bbTexture = new THREE.CanvasTexture(bbCanvas);
  const posterCanvas = createSketchMesh(
    new THREE.BoxGeometry(3.3, 1.5, 0.02),
    new THREE.MeshToonMaterial({ map: bbTexture, gradientMap: gradientMap })
  );
  posterCanvas.position.set(0, 1.8, 0.041);
  billboardGroup.add(posterCanvas);

  storeGroup.add(billboardGroup);

  // Sidewalk Decor: Potted Topiaries & Street Lamps
  [-3.3, 3.3].forEach((x) => {
    const potGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.6, 10);
    const pot = createSketchMesh(potGeo, makeToonMat(colors.potTerracotta));
    pot.position.set(x, 0.6, buildingDepth / 2 + 0.3);
    storeGroup.add(pot);

    const topiaryGeo = new THREE.SphereGeometry(0.48, 8, 8);
    const topiary = createSketchMesh(topiaryGeo, makeToonMat(colors.plantGreen));
    topiary.position.set(x, 1.25, buildingDepth / 2 + 0.3);
    storeGroup.add(topiary);
  });

  // Street Lamps
  [-4.2, 4.2].forEach((x) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, 0.38, buildingDepth / 2 + 1.8);

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.07, 3.0, 8);
    const pole = createSketchMesh(poleGeo, makeToonMat(colors.metal));
    pole.position.y = 1.5;
    lampGroup.add(pole);

    const bulbGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const bulb = createSketchMesh(bulbGeo, makeToonMat(colors.gold));
    bulb.position.set(0, 2.74, -0.4);
    lampGroup.add(bulb);

    storeGroup.add(lampGroup);
  });

  // Animation Loop
  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    storeGroup.rotation.y = Math.sin(time * 0.25) * 0.14;
    renderer.render(scene, camera);
  };
  animate();

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    lineMaterial.dispose();
    gradientMap.dispose();
    bbTexture.dispose();
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

/**
 * Builds the 3-Floor Cyberpunk Store scene with central glass elevator, 3 floors,
 * neon signs, satellite dish, turbine exhaust, orbiting drone, and flying billboard robot.
 * Grants +5 extra spaces (15 items total) upon unlocking for $5.00.
 */
export function setupCyberTowerStoreScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  storeTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(5.2, 3.8, 6.6);
  camera.lookAt(0, 1.45, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const NEON = {
    bg: 0x0a0c1a,
    cyan: 0x00f0ff,
    pink: 0xff007f,
    purple: 0x9d00ff,
    gold: 0xffb700,
    green: 0x39ff14,
    darkMetal: 0x181c2e,
    charcoal: 0x0f111e,
    fl1Light: 0xffb700,
    fl2Light: 0x00f0ff,
    fl3Light: 0x9d00ff,
  };

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight1.position.set(10, 16, 12);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(NEON.cyan, 0.8);
  dirLight2.position.set(-10, 10, -10);
  scene.add(dirLight2);

  // Interior floor lights
  const floorLight1 = new THREE.PointLight(NEON.fl1Light, 1.8, 8);
  floorLight1.position.set(0, 0.8, 0);
  scene.add(floorLight1);

  const floorLight2 = new THREE.PointLight(NEON.fl2Light, 1.8, 8);
  floorLight2.position.set(0, 1.6, 0);
  scene.add(floorLight2);

  const floorLight3 = new THREE.PointLight(NEON.fl3Light, 1.8, 8);
  floorLight3.position.set(0, 2.5, 0);
  scene.add(floorLight3);

  // Helpers
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0x05070e, side: THREE.BackSide });
  const edgeLineMat = new THREE.LineBasicMaterial({ color: 0x05070e, linewidth: 1.5 });
  const cyanEdgeLineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 1.5 });

  function createToonMesh(geometry: THREE.BufferGeometry, color: number, options: { unlit?: boolean; doubleSide?: boolean; edges?: boolean } = {}) {
    const group = new THREE.Group();
    const mat = options.unlit
      ? new THREE.MeshBasicMaterial({ color, side: options.doubleSide ? THREE.DoubleSide : THREE.FrontSide })
      : new THREE.MeshStandardMaterial({ color, roughness: 0.4, side: options.doubleSide ? THREE.DoubleSide : THREE.FrontSide });

    const mesh = new THREE.Mesh(geometry, mat);
    group.add(mesh);

    if (options.edges !== false && !options.unlit) {
      const edgesGeo = new THREE.EdgesGeometry(geometry, 35);
      const lineSegments = new THREE.LineSegments(edgesGeo, edgeLineMat);
      group.add(lineSegments);
    }
    return group;
  }

  function createGlassMesh(geometry: THREE.BufferGeometry, opacity = 0.35, glassColor = NEON.cyan) {
    const group = new THREE.Group();
    const glassMat = new THREE.MeshStandardMaterial({
      color: glassColor,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, glassMat);
    group.add(mesh);

    const edgesGeo = new THREE.EdgesGeometry(geometry);
    const lineSegments = new THREE.LineSegments(edgesGeo, cyanEdgeLineMat);
    group.add(lineSegments);
    return group;
  }

  // Root store group scaled appropriately
  const cyberGroup = new THREE.Group();
  cyberGroup.scale.set(0.19, 0.19, 0.19);
  cyberGroup.position.set(0, 0.05, 0);
  scene.add(cyberGroup);

  // Base ground & landing pad
  const groundGeo = new THREE.BoxGeometry(16, 0.4, 14);
  const ground = createToonMesh(groundGeo, NEON.charcoal);
  ground.position.set(0, -0.2, 0);
  cyberGroup.add(ground);

  const padGeo = new THREE.BoxGeometry(4.5, 0.2, 1.6);
  const pad = createToonMesh(padGeo, NEON.darkMetal);
  pad.position.set(0, 0.1, 4.3);
  cyberGroup.add(pad);

  const padGlowGeo = new THREE.BoxGeometry(4.55, 0.02, 1.65);
  const padGlow = createToonMesh(padGlowGeo, NEON.cyan, { unlit: true });
  padGlow.position.set(0, 0.201, 4.3);
  cyberGroup.add(padGlow);

  // Central Glass Elevator
  const shaftGeo = new THREE.BoxGeometry(1.8, 10.4, 1.8);
  const shaft = createGlassMesh(shaftGeo, 0.25, NEON.cyan);
  shaft.position.set(0, 5.3, -1.5);
  cyberGroup.add(shaft);

  const liftGeo = new THREE.BoxGeometry(1.6, 0.15, 1.6);
  const lift = createToonMesh(liftGeo, NEON.pink, { unlit: true });
  lift.position.set(0, 4.2, -1.5);
  cyberGroup.add(lift);

  for (const xOff of [-0.85, 0.85]) {
    for (const zOff of [-0.85, 0.85]) {
      const colGeo = new THREE.CylinderGeometry(0.04, 0.04, 10.3, 8);
      const col = createToonMesh(colGeo, NEON.purple);
      col.position.set(xOff, 5.3, -1.5 + zOff);
      cyberGroup.add(col);
    }
  }

  // Floors 1, 2, 3 Structure
  const floorLevels = [
    { num: 1, yBase: 0.1, rimColor: NEON.gold },
    { num: 2, yBase: 3.6, rimColor: NEON.cyan },
    { num: 3, yBase: 7.1, rimColor: NEON.purple },
  ];

  floorLevels.forEach(({ num, yBase, rimColor }) => {
    const floorHeight = 3.4;
    const yCenter = yBase + floorHeight / 2;

    const deckGeo = new THREE.BoxGeometry(10.2, 0.24, 8.2);
    const deck = createToonMesh(deckGeo, NEON.charcoal);
    deck.position.set(0, yBase, 0);
    cyberGroup.add(deck);

    const glowBorderGeo = new THREE.BoxGeometry(10.32, 0.06, 8.32);
    const glowBorder = createToonMesh(glowBorderGeo, rimColor, { unlit: true });
    glowBorder.position.set(0, yBase - 0.12, 0);
    cyberGroup.add(glowBorder);

    // Corner Columns
    for (const sideX of [-1, 1]) {
      for (const sideZ of [-1, 1]) {
        const colGeo = new THREE.BoxGeometry(0.5, floorHeight, 0.5);
        const col = createToonMesh(colGeo, NEON.darkMetal);
        col.position.set(sideX * 4.9, yCenter, sideZ * 3.9);
        cyberGroup.add(col);

        const stripGeo = new THREE.BoxGeometry(0.1, floorHeight * 0.9, 0.52);
        const stripColor = num === 1 ? NEON.cyan : num === 2 ? NEON.pink : NEON.green;
        const strip = createToonMesh(stripGeo, stripColor, { unlit: true });
        strip.position.set(sideX * 4.91, yCenter, sideZ * 3.9);
        cyberGroup.add(strip);
      }
    }

    // Glass Walls
    if (num === 1) {
      const frameGeo = new THREE.BoxGeometry(3.6, 2.8, 0.2);
      const frame = createToonMesh(frameGeo, NEON.charcoal);
      frame.position.set(0, yBase + 1.4, 4.0);
      cyberGroup.add(frame);

      for (const side of [-1, 1]) {
        const doorGeo = new THREE.BoxGeometry(1.5, 2.6, 0.08);
        const door = createGlassMesh(doorGeo, 0.35, NEON.cyan);
        door.position.set(side * 0.8, yBase + 1.3, 4.05);
        cyberGroup.add(door);
      }
    } else {
      const frontGlassGeo = new THREE.BoxGeometry(9.2, 2.9, 0.08);
      const frontGlass = createGlassMesh(frontGlassGeo, 0.3, NEON.pink);
      frontGlass.position.set(0, yCenter, 4.0);
      cyberGroup.add(frontGlass);
    }

    for (const side of [-1, 1]) {
      const sideGlassGeo = new THREE.BoxGeometry(0.08, 2.9, 7.2);
      const sideGlass = createGlassMesh(sideGlassGeo, 0.25, NEON.purple);
      sideGlass.position.set(side * 4.9, yCenter, 0);
      cyberGroup.add(sideGlass);
    }

    const rearGlassGeo = new THREE.BoxGeometry(9.2, 2.9, 0.08);
    const rearGlass = createGlassMesh(rearGlassGeo, 0.25, NEON.cyan);
    rearGlass.position.set(0, yCenter, -4.0);
    cyberGroup.add(rearGlass);
  });

  // Floor 1 Interior Details (Checkout, Shelves, Vending Machine, Holo 1)
  const yF1 = 0.1;
  const deskGeo = new THREE.BoxGeometry(2.4, 1.0, 0.9);
  const desk = createToonMesh(deskGeo, NEON.darkMetal);
  desk.position.set(2.6, yF1 + 0.5, -2.5);
  cyberGroup.add(desk);

  const regGeo = new THREE.BoxGeometry(0.6, 0.4, 0.05);
  const reg = createToonMesh(regGeo, NEON.cyan, { unlit: true });
  reg.position.set(2.6, yF1 + 1.25, -2.4);
  reg.rotation.x = -Math.PI / 8;
  cyberGroup.add(reg);

  // Vending Machine
  const vendGeo = new THREE.BoxGeometry(1.5, 2.8, 1.1);
  const vend = createToonMesh(vendGeo, NEON.charcoal);
  vend.position.set(-3.8, yF1 + 1.4, -3.2);
  vend.rotation.y = Math.PI / 2;
  cyberGroup.add(vend);

  // Floor 1 Holo Pedestal
  const pedGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.6, 8);
  const ped = createToonMesh(pedGeo, NEON.charcoal);
  ped.position.set(-1.2, yF1 + 0.3, 1.2);
  cyberGroup.add(ped);

  const holoArtifact1 = new THREE.Group();
  const icoGeo = new THREE.IcosahedronGeometry(0.35, 0);
  const icoMesh = createToonMesh(icoGeo, NEON.cyan, { unlit: true });
  holoArtifact1.add(icoMesh);
  holoArtifact1.position.set(-1.2, yF1 + 1.35, 1.2);
  cyberGroup.add(holoArtifact1);

  // Floor 2 Interior Details (Katana Weapon Rack, Tech Glass Counter, Holo 2)
  const yF2 = 3.6;
  const weaponBoardGeo = new THREE.BoxGeometry(2.8, 2.0, 0.1);
  const weaponBoard = createToonMesh(weaponBoardGeo, NEON.charcoal);
  weaponBoard.position.set(0, yF2 + 1.6, -3.85);
  cyberGroup.add(weaponBoard);

  for (let i = 0; i < 2; i++) {
    const ky = yF2 + 1.8 - i * 0.45;
    const bladeGeo = new THREE.BoxGeometry(1.3, 0.04, 0.02);
    const blade = createToonMesh(bladeGeo, NEON.cyan, { unlit: true });
    blade.position.set(0.0, ky, -3.73);
    cyberGroup.add(blade);
  }

  const holoArtifact2 = new THREE.Group();
  const octGeo = new THREE.OctahedronGeometry(0.28, 0);
  const octMesh = createToonMesh(octGeo, NEON.pink, { unlit: true });
  holoArtifact2.add(octMesh);
  holoArtifact2.position.set(-2.2, yF2 + 1.3, 1.5);
  cyberGroup.add(holoArtifact2);

  // Floor 3 Interior Details (Server Racks, Core Table, Holo 3, Floating Screens)
  const yF3 = 7.1;
  const serverGeo = new THREE.BoxGeometry(1.2, 2.5, 2.2);
  const server1 = createToonMesh(serverGeo, NEON.charcoal);
  server1.position.set(-3.2, yF3 + 1.25, -2.0);
  cyberGroup.add(server1);

  const server2 = createToonMesh(serverGeo, NEON.charcoal);
  server2.position.set(3.2, yF3 + 1.25, -2.0);
  cyberGroup.add(server2);

  const coreTableGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 12);
  const coreTable = createToonMesh(coreTableGeo, NEON.darkMetal);
  coreTable.position.set(0, yF3 + 0.7, 1.0);
  cyberGroup.add(coreTable);

  const holoArtifact3 = new THREE.Group();
  const dodecaGeo = new THREE.DodecahedronGeometry(0.32, 0);
  const dodecaMesh = createToonMesh(dodecaGeo, NEON.purple, { unlit: true });
  holoArtifact3.add(dodecaMesh);
  holoArtifact3.position.set(0, yF3 + 1.5, 1.0);
  cyberGroup.add(holoArtifact3);

  // Rooftop (Antenna Mast, Dish, Turbine Exhaust)
  const yRoof = 10.6;
  const roofBaseGeo = new THREE.BoxGeometry(10.2, 0.4, 8.2);
  const roofBase = createToonMesh(roofBaseGeo, NEON.charcoal);
  roofBase.position.set(0, yRoof + 0.2, 0);
  cyberGroup.add(roofBase);

  // Satellite Dish
  const dishGeo = new THREE.CylinderGeometry(1.2, 0.2, 0.3, 12, 1, true);
  const dish = createToonMesh(dishGeo, NEON.cyan, { doubleSide: true });
  dish.rotation.x = Math.PI / 3;
  dish.position.set(-2.8, yRoof + 1.5, 1.5);
  cyberGroup.add(dish);

  // Antenna Mast
  const mastGeo = new THREE.CylinderGeometry(0.08, 0.12, 4.5, 8);
  const mast = createToonMesh(mastGeo, NEON.darkMetal);
  mast.position.set(3.0, yRoof + 3.1, -1.8);
  cyberGroup.add(mast);

  const beaconGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const beacon = createToonMesh(beaconGeo, NEON.pink, { unlit: true });
  beacon.position.set(3.0, yRoof + 5.45, -1.8);
  cyberGroup.add(beacon);

  // Exhaust Turbine Fan
  const roofTurbine = new THREE.Group();
  for (let b = 0; b < 6; b++) {
    const bGeo = new THREE.BoxGeometry(1.1, 0.03, 0.12);
    const blade = createToonMesh(bGeo, NEON.cyan, { unlit: true });
    blade.rotation.y = (b * Math.PI) / 3;
    roofTurbine.add(blade);
  }
  roofTurbine.position.set(0, yRoof + 1.76, -1.2);
  cyberGroup.add(roofTurbine);

  // Rising Energy Particles from Turbine
  const smokeParticles: { mesh: THREE.Group; baseY: number; offsetY: number; speed: number; wobbleSpeed: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const pGeo = new THREE.OctahedronGeometry(0.25, 0);
    const pMesh = createToonMesh(pGeo, i % 2 === 0 ? NEON.cyan : NEON.pink, { unlit: true });
    pMesh.position.set(0, yRoof + 1.8 + i * 0.45, -1.2);
    cyberGroup.add(pMesh);
    smokeParticles.push({
      mesh: pMesh,
      baseY: yRoof + 1.8,
      offsetY: i * 0.45,
      speed: 0.02,
      wobbleSpeed: 2.5,
    });
  }

  // 3D Rooftop Cyber Sign
  const cyberSignGroup = new THREE.Group();
  const trussTop = createToonMesh(new THREE.BoxGeometry(8.8, 0.12, 0.12), NEON.darkMetal);
  trussTop.position.set(0, 0.95, 0);
  cyberSignGroup.add(trussTop);

  const trussBot = createToonMesh(new THREE.BoxGeometry(8.8, 0.12, 0.12), NEON.darkMetal);
  trussBot.position.set(0, -0.95, 0);
  cyberSignGroup.add(trussBot);

  // Sign text canvas billboard
  const signCvs = document.createElement('canvas');
  signCvs.width = 512;
  signCvs.height = 128;
  const sCtx = signCvs.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#0a0d1d';
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.strokeStyle = '#00f0ff';
    sCtx.lineWidth = 6;
    sCtx.strokeRect(6, 6, 500, 116);
    sCtx.fillStyle = '#00f0ff';
    sCtx.font = 'bold 44px monospace';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    const text = (storeTitle || 'CYBER MEGASTORE').toUpperCase().slice(0, 16);
    sCtx.fillText(text, 256, 64);
  }
  const signTex = new THREE.CanvasTexture(signCvs);
  const signPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(8.2, 1.8),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signPlate.position.set(0, 0, 0.08);
  cyberSignGroup.add(signPlate);

  cyberSignGroup.position.set(0, yRoof + 1.8, 3.8);
  cyberGroup.add(cyberSignGroup);

  // Circling Drone
  const droneGroup = new THREE.Group();
  const dBodyGeo = new THREE.SphereGeometry(0.45, 8, 8);
  dBodyGeo.scale(1.3, 0.7, 1.0);
  const dBody = createToonMesh(dBodyGeo, NEON.pink);
  droneGroup.add(dBody);

  const dEyeGeo = new THREE.SphereGeometry(0.2, 6, 6);
  const dEye = createToonMesh(dEyeGeo, NEON.cyan, { unlit: true });
  dEye.position.set(0.4, 0, 0);
  droneGroup.add(dEye);

  cyberGroup.add(droneGroup);

  // Animation Loop
  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Gentle storefront sway
    cyberGroup.rotation.y = Math.sin(time * 0.22) * 0.12;

    roofTurbine.rotation.y += 0.12;

    holoArtifact1.rotation.y += 0.02;
    holoArtifact1.rotation.x = Math.sin(time) * 0.2;

    holoArtifact2.rotation.y -= 0.025;
    holoArtifact2.position.y = yF2 + 1.3 + Math.sin(time * 2.0) * 0.08;

    holoArtifact3.rotation.y += 0.03;

    // Drone circling store
    const droneAngle = time * 0.4;
    droneGroup.position.set(Math.cos(droneAngle) * 9.5, 7.0 + Math.sin(time * 1.2) * 0.5, Math.sin(droneAngle) * 9.5);
    droneGroup.rotation.y = -droneAngle + Math.PI / 2;

    // Rising energy particles
    smokeParticles.forEach((p) => {
      p.offsetY += p.speed;
      p.mesh.position.y = p.baseY + p.offsetY;
      if (p.offsetY > 2.6) p.offsetY = 0;
    });

    renderer.render(scene, camera);
  };
  animate();

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    outlineMat.dispose();
    edgeLineMat.dispose();
    cyanEdgeLineMat.dispose();
    signTex.dispose();
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}
