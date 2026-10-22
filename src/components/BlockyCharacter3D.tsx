import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { setupJasonScene, setupGhostfaceScene, setupMichaelMyersScene, setupFreddyScene } from './HorrorCharacters3D';
import {
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
} from './AnimeCompanionCharacters3D';

export type CharacterVariant =
  | 'classic'
  | 'waving'
  | 'pumpkin'
  | 'girly_pumpkin'
  | 'jason'
  | 'ghostface'
  | 'michael_myers'
  | 'freddy'
  | 'cyber_soccer_girl'
  | 'cyber_soccer_boy'
  | 'purple_anime_girl'
  | 'mexican_traveler'
  | 'alien_girl'
  | 'alien_boy'
  | 'moon_demon_noble'
  | 'demon_dog_warrior'
  | 'celestial_moon_guardian'
  | 'sacred_shrine_priestess';

export {
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
};

export interface BlockyCharacterOptions {
  shirtColor?: number;
  hairColor?: number;
  pantsColor?: number;
  interactive?: boolean;
}

/**
 * Builds the Short Blocky 3D Cyber-Warrior (Boy Warrior) scene with articulated hands, helmet, and waving animation (No spinning).
 */
export function setupClassicCharacterScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'HELLO!'
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
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

  // Lighting setup - Bright, crisp character lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
  dirLight.position.set(4, 8, 5);
  scene.add(dirLight);

  const frontFill = new THREE.DirectionalLight(0xfff7ed, 1.6);
  frontFill.position.set(0, 3, 5);
  scene.add(frontFill);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
  rimLight.position.set(-4, 5, -5);
  scene.add(rimLight);

  const materials = {
    undersuit: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }),
    shirt: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.2 }),
    skirt: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 }),
    collar: new THREE.MeshStandardMaterial({ color: 0xfba518, roughness: 0.3, metalness: 0.6 }),
    socks: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.8 }),
    shoes: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }),
    eyes: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    sparkle: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    gloves: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.3 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 }),
    armor: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.7 }),
    helmet: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.4 }),
    helmetAccent: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.5 }),
    visor: new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    }),
  };

  const characterGroup = new THREE.Group();
  characterGroup.scale.set(1.26, 1.26, 1.26);
  characterGroup.position.set(0, -0.16, 0);
  scene.add(characterGroup);

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.75;
  characterGroup.add(torsoGroup);

  // Warrior Top
  const shirt = createBox(0.72, 0.45, 0.45, materials.shirt);
  shirt.position.y = 0.38;
  torsoGroup.add(shirt);

  // Chestplate & Belt
  const chestArmor = createBox(0.5, 0.22, 0.47, materials.armor);
  chestArmor.position.set(0, 0.42, 0.01);
  const belt = createBox(0.76, 0.1, 0.47, materials.gold);
  belt.position.set(0, 0.18, 0);
  const beltGem = createBox(0.12, 0.12, 0.5, materials.helmetAccent);
  beltGem.position.set(0, 0.18, 0);
  torsoGroup.add(chestArmor, belt, beltGem);

  // Collar Accent
  const collar = createBox(0.4, 0.08, 0.47, materials.collar);
  collar.position.set(0, 0.58, 0.01);
  torsoGroup.add(collar);

  // Armored Pleated Skirt
  const skirt = createBox(0.86, 0.28, 0.56, materials.skirt);
  skirt.position.y = 0.12;
  torsoGroup.add(skirt);

  // Neck - Armored undersuit neck seal (100% covered)
  const neck = createBox(0.24, 0.12, 0.24, materials.undersuit);
  neck.position.y = 0.64;
  torsoGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.7, 0);
  torsoGroup.add(headGroup);

  // Head Base - Tech undersuit fabric underneath helmet (no skin)
  const headBase = createBox(0.96, 0.88, 0.88, materials.undersuit);
  headBase.position.y = 0.44;
  headGroup.add(headBase);

  // High-Tech Visor & Integrated Optics
  const visorMain = createBox(0.88, 0.32, 0.06, materials.visor);
  visorMain.position.set(0, 0.48, 0.445);

  const eyeL = createBox(0.18, 0.16, 0.04, materials.eyes);
  eyeL.position.set(0.22, 0.5, 0.46);
  const sparkle1L = createBox(0.06, 0.06, 0.05, materials.sparkle);
  sparkle1L.position.set(0.25, 0.53, 0.47);

  const eyeR = createBox(0.18, 0.16, 0.04, materials.eyes);
  eyeR.position.set(-0.22, 0.5, 0.46);
  const sparkle1R = createBox(0.06, 0.06, 0.05, materials.sparkle);
  sparkle1R.position.set(-0.19, 0.53, 0.47);

  headGroup.add(visorMain, eyeL, sparkle1L, eyeR, sparkle1R);

  // --- COOL HELMET METALLIC STRUCTURE ---
  // Main Helmet Shell Top & Sides
  const helmetCap = createBox(1.04, 0.46, 0.96, materials.helmet);
  helmetCap.position.y = 0.72;
  const helmetBack = createBox(1.02, 0.7, 0.3, materials.helmet);
  helmetBack.position.set(0, 0.48, -0.34);
  const helmetCheekL = createBox(0.16, 0.5, 0.5, materials.helmet);
  helmetCheekL.position.set(0.48, 0.38, 0.2);
  const helmetCheekR = createBox(0.16, 0.5, 0.5, materials.helmet);
  helmetCheekR.position.set(-0.48, 0.38, 0.2);
  headGroup.add(helmetCap, helmetBack, helmetCheekL, helmetCheekR);

  // Helmet Brow Guard & Gold Crest
  const browGuard = createBox(1.02, 0.16, 0.22, materials.armor);
  browGuard.position.set(0, 0.68, 0.4);
  const crownCrest = createBox(0.2, 0.36, 0.24, materials.gold);
  crownCrest.position.set(0, 0.98, 0.28);
  const crestGem = createBox(0.14, 0.14, 0.08, materials.helmetAccent);
  crestGem.position.set(0, 0.98, 0.4);
  headGroup.add(browGuard, crownCrest, crestGem);

  // Sleek Cat/Mecha Ear Antennas on Helmet Sides
  const earL = createBox(0.14, 0.4, 0.22, materials.helmetAccent);
  earL.position.set(0.56, 0.92, 0.02);
  earL.rotation.z = -0.35;
  const earR = createBox(0.14, 0.4, 0.22, materials.helmetAccent);
  earR.position.set(-0.56, 0.92, 0.02);
  earR.rotation.z = 0.35;

  const earTipL = createBox(0.08, 0.22, 0.14, materials.gold);
  earTipL.position.set(0.62, 1.15, 0.02);
  earTipL.rotation.z = -0.35;
  const earTipR = createBox(0.08, 0.22, 0.14, materials.gold);
  earTipR.position.set(-0.62, 1.15, 0.02);
  earTipR.rotation.z = 0.35;
  headGroup.add(earL, earR, earTipL, earTipR);

  // Lower Face Guard Mask
  const warriorMask = createBox(0.92, 0.26, 0.26, materials.helmet);
  warriorMask.position.set(0, 0.24, 0.35);
  const maskTrim = createBox(0.4, 0.1, 0.06, materials.gold);
  maskTrim.position.set(0, 0.24, 0.48);
  headGroup.add(warriorMask, maskTrim);

  // Semi-Transparent High-Tech Glowing Visor Rim
  const visorShield = createBox(0.92, 0.18, 0.08, materials.visor);
  visorShield.position.set(0, 0.5, 0.46);
  headGroup.add(visorShield);

  // Shoulder Pauldrons attached directly to Torso so they stay fixed on shoulders
  const shoulderPadL = createBox(0.28, 0.18, 0.28, materials.armor);
  shoulderPadL.position.set(0.4, 0.42, 0);
  const shoulderPadR = createBox(0.28, 0.18, 0.28, materials.armor);
  shoulderPadR.position.set(-0.4, 0.42, 0);
  torsoGroup.add(shoulderPadL, shoulderPadR);

  // Left Arm (+X side, character's left)
  const armLeft = new THREE.Group();
  armLeft.position.set(0.38, 0.38, 0);
  torsoGroup.add(armLeft);

  const sleeveL = createBox(0.22, 0.16, 0.22, materials.shirt);
  sleeveL.position.y = -0.08;
  const gloveCuffL = createBox(0.25, 0.08, 0.25, materials.gold);
  gloveCuffL.position.y = -0.18;
  const gloveL = createBox(0.23, 0.22, 0.23, materials.gloves);
  gloveL.position.y = -0.26;

  // Blocky Hand & Fingers (Left Hand)
  const handPalmL = createBox(0.25, 0.12, 0.16, materials.gloves);
  handPalmL.position.set(0, -0.38, 0);

  const thumbL = createBox(0.08, 0.1, 0.08, materials.gloves);
  thumbL.position.set(0.12, -0.38, 0.04);
  thumbL.rotation.z = -0.3;

  const fingerL1 = createBox(0.05, 0.1, 0.06, materials.gloves);
  fingerL1.position.set(0.06, -0.48, 0.04);
  const fingerL2 = createBox(0.05, 0.11, 0.06, materials.gloves);
  fingerL2.position.set(0.02, -0.485, 0.04);
  const fingerL3 = createBox(0.05, 0.1, 0.06, materials.gloves);
  fingerL3.position.set(-0.02, -0.48, 0.04);
  const fingerL4 = createBox(0.05, 0.08, 0.06, materials.gloves);
  fingerL4.position.set(-0.06, -0.46, 0.04);

  armLeft.add(sleeveL, gloveCuffL, gloveL, handPalmL, thumbL, fingerL1, fingerL2, fingerL3, fingerL4);

  // Right Arm (-X side, character's right)
  const armRight = new THREE.Group();
  armRight.position.set(-0.38, 0.38, 0);
  torsoGroup.add(armRight);

  const sleeveR = createBox(0.22, 0.16, 0.22, materials.shirt);
  sleeveR.position.y = -0.08;
  const gloveCuffR = createBox(0.25, 0.08, 0.25, materials.gold);
  gloveCuffR.position.y = -0.18;
  const gloveR = createBox(0.23, 0.22, 0.23, materials.gloves);
  gloveR.position.y = -0.26;

  // Blocky Hand & Fingers (Right Hand)
  const handPalmR = createBox(0.25, 0.12, 0.16, materials.gloves);
  handPalmR.position.set(0, -0.38, 0);

  const thumbR = createBox(0.08, 0.1, 0.08, materials.gloves);
  thumbR.position.set(-0.12, -0.38, 0.04);
  thumbR.rotation.z = 0.3;

  const fingerR1 = createBox(0.05, 0.1, 0.06, materials.gloves);
  fingerR1.position.set(-0.06, -0.48, 0.04);
  const fingerR2 = createBox(0.05, 0.11, 0.06, materials.gloves);
  fingerR2.position.set(-0.02, -0.485, 0.04);
  const fingerR3 = createBox(0.05, 0.1, 0.06, materials.gloves);
  fingerR3.position.set(0.02, -0.48, 0.04);
  const fingerR4 = createBox(0.05, 0.08, 0.06, materials.gloves);
  fingerR4.position.set(0.06, -0.46, 0.04);

  armRight.add(sleeveR, gloveCuffR, gloveR, handPalmR, thumbR, fingerR1, fingerR2, fingerR3, fingerR4);

  // Legs seamlessly connected inside skirt - Fully covered combat leggings (no bare skin)
  const legLeft = new THREE.Group();
  legLeft.position.set(0.19, 0.05, 0);
  torsoGroup.add(legLeft);

  const legMeshL = createBox(0.22, 0.42, 0.22, materials.undersuit);
  legMeshL.position.y = -0.16;
  const kneeGuardL = createBox(0.25, 0.12, 0.12, materials.armor);
  kneeGuardL.position.set(0, -0.22, 0.08);
  const sockL = createBox(0.23, 0.22, 0.23, materials.socks);
  sockL.position.y = -0.32;
  const bootL = createBox(0.26, 0.28, 0.34, materials.shoes);
  bootL.position.set(0, -0.5, 0.04);
  const bootGoldL = createBox(0.28, 0.08, 0.35, materials.gold);
  bootGoldL.position.set(0, -0.42, 0.04);
  legLeft.add(legMeshL, kneeGuardL, sockL, bootL, bootGoldL);

  const legRight = new THREE.Group();
  legRight.position.set(-0.19, 0.05, 0);
  torsoGroup.add(legRight);

  const legMeshR = createBox(0.22, 0.42, 0.22, materials.undersuit);
  legMeshR.position.y = -0.16;
  const kneeGuardR = createBox(0.25, 0.12, 0.12, materials.armor);
  kneeGuardR.position.set(0, -0.22, 0.08);
  const sockR = createBox(0.23, 0.22, 0.23, materials.socks);
  sockR.position.y = -0.32;
  const bootR = createBox(0.26, 0.28, 0.34, materials.shoes);
  bootR.position.set(0, -0.5, 0.04);
  const bootGoldR = createBox(0.28, 0.08, 0.35, materials.gold);
  bootGoldR.position.set(0, -0.42, 0.04);
  legRight.add(legMeshR, kneeGuardR, sockR, bootR, bootGoldR);

  // Speech balloon disabled per user request
  const speechBubbleGroup = new THREE.Group();
  speechBubbleGroup.visible = false;
  characterGroup.add(speechBubbleGroup);

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Gentle torso idle bob
    torsoGroup.position.y = 0.75 + Math.sin(time * 2.8) * 0.02;

    // Head tilting slightly toward viewer
    headGroup.rotation.z = Math.sin(time * 2.0) * 0.04 - 0.05;
    headGroup.rotation.y = Math.sin(time * 1.2) * 0.06;

    // Left Arm - Raised High and Waving Outwards (+X side)
    armLeft.rotation.z = 2.2 + Math.sin(time * 7.5 + 0.5) * 0.25;
    armLeft.rotation.x = Math.cos(time * 7.5 + 0.5) * 0.15;

    // Right Arm - Raised High and Waving Outwards (-X side)
    armRight.rotation.z = -2.2 - Math.sin(time * 7.5) * 0.25;
    armRight.rotation.x = Math.cos(time * 7.5) * 0.15;

    // Legs stance
    legLeft.rotation.z = 0.05;
    legRight.rotation.z = -0.05;

    // Smooth Character Gentle Facing Rotation (Front-Facing) - NO SPINNING
    characterGroup.rotation.y = Math.sin(time * 0.8) * 0.15;

    // Speech bubble floating pulse
    if (speechBubbleGroup) {
      speechBubbleGroup.position.y = Math.sin(time * 3.5) * 0.04;
      speechBubbleGroup.scale.setScalar(1 + Math.sin(time * 4.0) * 0.02);
    }

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
      } else if (obj instanceof THREE.Sprite) {
        if (obj.material.map) {
          obj.material.map.dispose();
        }
        obj.material.dispose();
      }
    });
    try {
      const gl = renderer.getContext();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch (_) {}
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

/**
 * Builds the Waving Cyber-Warrior 3D Character scene (Pink Warrior) with articulated hands, pauldrons, speech balloon & waving hand.
 */
export function setupWavingCharacterScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'HELLO!'
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
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

  // Lighting setup - Bright, crisp waving character lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
  dirLight.position.set(4, 8, 5);
  scene.add(dirLight);

  const frontFill = new THREE.DirectionalLight(0xfff7ed, 1.6);
  frontFill.position.set(0, 3, 5);
  scene.add(frontFill);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
  rimLight.position.set(-4, 5, -5);
  scene.add(rimLight);

  const materials = {
    undersuit: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }),
    shirt: new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.2 }),
    skirt: new THREE.MeshStandardMaterial({ color: 0xbe185d, roughness: 0.4 }),
    collar: new THREE.MeshStandardMaterial({ color: 0xfba518, roughness: 0.3, metalness: 0.6 }),
    socks: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.8 }),
    shoes: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }),
    eyes: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    sparkle: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    gloves: new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.3 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 }),
    armor: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.7 }),
    helmet: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3, metalness: 0.4 }),
    helmetAccent: new THREE.MeshStandardMaterial({ color: 0xbe185d, roughness: 0.2, metalness: 0.5 }),
    visor: new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    }),
  };

  const characterGroup = new THREE.Group();
  characterGroup.scale.set(1.26, 1.26, 1.26);
  characterGroup.position.set(0, -0.16, 0);
  scene.add(characterGroup);

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.75;
  characterGroup.add(torsoGroup);

  // Warrior Top
  const shirt = createBox(0.72, 0.45, 0.45, materials.shirt);
  shirt.position.y = 0.38;
  torsoGroup.add(shirt);

  // Chestplate & Belt
  const chestArmor = createBox(0.5, 0.22, 0.47, materials.armor);
  chestArmor.position.set(0, 0.42, 0.01);
  const belt = createBox(0.76, 0.1, 0.47, materials.gold);
  belt.position.set(0, 0.18, 0);
  const beltGem = createBox(0.12, 0.12, 0.5, materials.helmetAccent);
  beltGem.position.set(0, 0.18, 0);
  torsoGroup.add(chestArmor, belt, beltGem);

  // Collar Accent
  const collar = createBox(0.4, 0.08, 0.47, materials.collar);
  collar.position.set(0, 0.58, 0.01);
  torsoGroup.add(collar);

  // Armored Pleated Skirt
  const skirt = createBox(0.86, 0.28, 0.56, materials.skirt);
  skirt.position.y = 0.12;
  torsoGroup.add(skirt);

  // Neck - Armored undersuit neck seal (100% covered)
  const neck = createBox(0.24, 0.12, 0.24, materials.undersuit);
  neck.position.y = 0.64;
  torsoGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.7, 0);
  torsoGroup.add(headGroup);

  // Head Base - Tech undersuit fabric underneath helmet (no skin)
  const headBase = createBox(0.96, 0.88, 0.88, materials.undersuit);
  headBase.position.y = 0.44;
  headGroup.add(headBase);

  // High-Tech Visor & Integrated Optics
  const visorMain = createBox(0.88, 0.32, 0.06, materials.visor);
  visorMain.position.set(0, 0.48, 0.445);

  const eyeL = createBox(0.18, 0.16, 0.04, materials.eyes);
  eyeL.position.set(0.22, 0.5, 0.46);
  const sparkle1L = createBox(0.06, 0.06, 0.05, materials.sparkle);
  sparkle1L.position.set(0.25, 0.53, 0.47);

  const eyeR = createBox(0.18, 0.16, 0.04, materials.eyes);
  eyeR.position.set(-0.22, 0.5, 0.46);
  const sparkle1R = createBox(0.06, 0.06, 0.05, materials.sparkle);
  sparkle1R.position.set(-0.19, 0.53, 0.47);

  headGroup.add(visorMain, eyeL, sparkle1L, eyeR, sparkle1R);

  // --- COOL HELMET METALLIC STRUCTURE ---
  // Main Helmet Shell Top & Sides
  const helmetCap = createBox(1.04, 0.46, 0.96, materials.helmet);
  helmetCap.position.y = 0.72;
  const helmetBack = createBox(1.02, 0.7, 0.3, materials.helmet);
  helmetBack.position.set(0, 0.48, -0.34);
  const helmetCheekL = createBox(0.16, 0.5, 0.5, materials.helmet);
  helmetCheekL.position.set(0.48, 0.38, 0.2);
  const helmetCheekR = createBox(0.16, 0.5, 0.5, materials.helmet);
  helmetCheekR.position.set(-0.48, 0.38, 0.2);
  headGroup.add(helmetCap, helmetBack, helmetCheekL, helmetCheekR);

  // Helmet Brow Guard & Gold Crest
  const browGuard = createBox(1.02, 0.16, 0.22, materials.armor);
  browGuard.position.set(0, 0.68, 0.4);
  const crownCrest = createBox(0.2, 0.36, 0.24, materials.gold);
  crownCrest.position.set(0, 0.98, 0.28);
  const crestGem = createBox(0.14, 0.14, 0.08, materials.helmetAccent);
  crestGem.position.set(0, 0.98, 0.4);
  headGroup.add(browGuard, crownCrest, crestGem);

  // Sleek Cat/Mecha Ear Antennas on Helmet Sides
  const earL = createBox(0.14, 0.4, 0.22, materials.helmetAccent);
  earL.position.set(0.56, 0.92, 0.02);
  earL.rotation.z = -0.35;
  const earR = createBox(0.14, 0.4, 0.22, materials.helmetAccent);
  earR.position.set(-0.56, 0.92, 0.02);
  earR.rotation.z = 0.35;

  const earTipL = createBox(0.08, 0.22, 0.14, materials.gold);
  earTipL.position.set(0.62, 1.15, 0.02);
  earTipL.rotation.z = -0.35;
  const earTipR = createBox(0.08, 0.22, 0.14, materials.gold);
  earTipR.position.set(-0.62, 1.15, 0.02);
  earTipR.rotation.z = 0.35;
  headGroup.add(earL, earR, earTipL, earTipR);

  // Lower Face Guard Mask
  const warriorMask = createBox(0.92, 0.26, 0.26, materials.helmet);
  warriorMask.position.set(0, 0.24, 0.35);
  const maskTrim = createBox(0.4, 0.1, 0.06, materials.gold);
  maskTrim.position.set(0, 0.24, 0.48);
  headGroup.add(warriorMask, maskTrim);

  // Semi-Transparent High-Tech Glowing Visor Rim
  const visorShield = createBox(0.92, 0.18, 0.08, materials.visor);
  visorShield.position.set(0, 0.5, 0.46);
  headGroup.add(visorShield);

  // Shoulder Pauldrons attached directly to Torso so they stay fixed on shoulders
  const shoulderPadL = createBox(0.28, 0.18, 0.28, materials.armor);
  shoulderPadL.position.set(0.4, 0.42, 0);
  const shoulderPadR = createBox(0.28, 0.18, 0.28, materials.armor);
  shoulderPadR.position.set(-0.4, 0.42, 0);
  torsoGroup.add(shoulderPadL, shoulderPadR);

  // Left Arm (+X side, character's left)
  const armLeft = new THREE.Group();
  armLeft.position.set(0.38, 0.38, 0);
  torsoGroup.add(armLeft);

  const sleeveL = createBox(0.22, 0.16, 0.22, materials.shirt);
  sleeveL.position.y = -0.08;
  const gloveCuffL = createBox(0.25, 0.08, 0.25, materials.gold);
  gloveCuffL.position.y = -0.18;
  const gloveL = createBox(0.23, 0.22, 0.23, materials.gloves);
  gloveL.position.y = -0.26;

  // Blocky Hand & Fingers (Left Hand)
  const handPalmL = createBox(0.25, 0.12, 0.16, materials.gloves);
  handPalmL.position.set(0, -0.38, 0);

  const thumbL = createBox(0.08, 0.1, 0.08, materials.gloves);
  thumbL.position.set(0.12, -0.38, 0.04);
  thumbL.rotation.z = -0.3;

  const fingerL1 = createBox(0.05, 0.1, 0.06, materials.gloves);
  fingerL1.position.set(0.06, -0.48, 0.04);
  const fingerL2 = createBox(0.05, 0.11, 0.06, materials.gloves);
  fingerL2.position.set(0.02, -0.485, 0.04);
  const fingerL3 = createBox(0.05, 0.1, 0.06, materials.gloves);
  fingerL3.position.set(-0.02, -0.48, 0.04);
  const fingerL4 = createBox(0.05, 0.08, 0.06, materials.gloves);
  fingerL4.position.set(-0.06, -0.46, 0.04);

  armLeft.add(sleeveL, gloveCuffL, gloveL, handPalmL, thumbL, fingerL1, fingerL2, fingerL3, fingerL4);

  // Right Arm (-X side, character's right)
  const armRight = new THREE.Group();
  armRight.position.set(-0.38, 0.38, 0);
  torsoGroup.add(armRight);

  const sleeveR = createBox(0.22, 0.16, 0.22, materials.shirt);
  sleeveR.position.y = -0.08;
  const gloveCuffR = createBox(0.25, 0.08, 0.25, materials.gold);
  gloveCuffR.position.y = -0.18;
  const gloveR = createBox(0.23, 0.22, 0.23, materials.gloves);
  gloveR.position.y = -0.26;

  // Blocky Hand & Fingers (Right Hand)
  const handPalmR = createBox(0.25, 0.12, 0.16, materials.gloves);
  handPalmR.position.set(0, -0.38, 0);

  const thumbR = createBox(0.08, 0.1, 0.08, materials.gloves);
  thumbR.position.set(-0.12, -0.38, 0.04);
  thumbR.rotation.z = 0.3;

  const fingerR1 = createBox(0.05, 0.1, 0.06, materials.gloves);
  fingerR1.position.set(-0.06, -0.48, 0.04);
  const fingerR2 = createBox(0.05, 0.11, 0.06, materials.gloves);
  fingerR2.position.set(-0.02, -0.485, 0.04);
  const fingerR3 = createBox(0.05, 0.1, 0.06, materials.gloves);
  fingerR3.position.set(0.02, -0.48, 0.04);
  const fingerR4 = createBox(0.05, 0.08, 0.06, materials.gloves);
  fingerR4.position.set(0.06, -0.46, 0.04);

  armRight.add(sleeveR, gloveCuffR, gloveR, handPalmR, thumbR, fingerR1, fingerR2, fingerR3, fingerR4);

  // Legs seamlessly connected inside skirt - Fully covered combat leggings (no bare skin)
  const legLeft = new THREE.Group();
  legLeft.position.set(0.19, 0.05, 0);
  torsoGroup.add(legLeft);

  const legMeshL = createBox(0.22, 0.42, 0.22, materials.undersuit);
  legMeshL.position.y = -0.16;
  const kneeGuardL = createBox(0.25, 0.12, 0.12, materials.armor);
  kneeGuardL.position.set(0, -0.22, 0.08);
  const sockL = createBox(0.23, 0.22, 0.23, materials.socks);
  sockL.position.y = -0.32;
  const bootL = createBox(0.26, 0.28, 0.34, materials.shoes);
  bootL.position.set(0, -0.5, 0.04);
  const bootGoldL = createBox(0.28, 0.08, 0.35, materials.gold);
  bootGoldL.position.set(0, -0.42, 0.04);
  legLeft.add(legMeshL, kneeGuardL, sockL, bootL, bootGoldL);

  const legRight = new THREE.Group();
  legRight.position.set(-0.19, 0.05, 0);
  torsoGroup.add(legRight);

  const legMeshR = createBox(0.22, 0.42, 0.22, materials.undersuit);
  legMeshR.position.y = -0.16;
  const kneeGuardR = createBox(0.25, 0.12, 0.12, materials.armor);
  kneeGuardR.position.set(0, -0.22, 0.08);
  const sockR = createBox(0.23, 0.22, 0.23, materials.socks);
  sockR.position.y = -0.32;
  const bootR = createBox(0.26, 0.28, 0.34, materials.shoes);
  bootR.position.set(0, -0.5, 0.04);
  const bootGoldR = createBox(0.28, 0.08, 0.35, materials.gold);
  bootGoldR.position.set(0, -0.42, 0.04);
  legRight.add(legMeshR, kneeGuardR, sockR, bootR, bootGoldR);

  // Speech balloon disabled per user request
  const speechBubbleGroup = new THREE.Group();
  speechBubbleGroup.visible = false;
  characterGroup.add(speechBubbleGroup);

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Gentle torso idle bob
    torsoGroup.position.y = 0.75 + Math.sin(time * 2.8) * 0.02;

    // Head tilting slightly toward viewer
    headGroup.rotation.z = Math.sin(time * 2.0) * 0.04 - 0.05;
    headGroup.rotation.y = Math.sin(time * 1.2) * 0.06;

    // Left Arm - Resting at side with subtle idle sway
    armLeft.rotation.z = 0.18 + Math.sin(time * 2.8) * 0.04;
    armLeft.rotation.x = 0;

    // Right Arm - Raised High and Waving Outwards (-X side)
    armRight.rotation.z = -2.2 - Math.sin(time * 7.5) * 0.25;
    armRight.rotation.x = Math.cos(time * 7.5) * 0.15;

    // Legs stance
    legLeft.rotation.z = 0.05;
    legRight.rotation.z = -0.05;

    // Smooth Character Gentle Facing Rotation (Front-Facing)
    characterGroup.rotation.y = Math.sin(time * 0.8) * 0.15;

    // Speech bubble floating pulse
    if (speechBubbleGroup) {
      speechBubbleGroup.position.y = Math.sin(time * 3.5) * 0.04;
      speechBubbleGroup.scale.setScalar(1 + Math.sin(time * 4.0) * 0.02);
    }

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
      } else if (obj instanceof THREE.Sprite) {
        if (obj.material.map) {
          obj.material.map.dispose();
        }
        obj.material.dispose();
      }
    });
    try {
      const gl = renderer.getContext();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch (_) {}
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

/**
 * Builds the 3D Blocky Pumpkin Head Monster character scene with articulated claws, glowing Jack-O'-Lantern face,
 * spooky torn coat, mini pumpkin ground props, floating ember particles, and eerie floating bobbing animations.
 */
export function setupPumpkinMonsterScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'BOO!'
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
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

  // Spooky Monster Lighting - Crisp and visible
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0xffffff, 2.2);
  moonLight.position.set(4, 7, 5);
  scene.add(moonLight);

  const frontFill = new THREE.DirectionalLight(0xffedd5, 1.6);
  frontFill.position.set(0, 3, 5);
  scene.add(frontFill);

  const backLight = new THREE.DirectionalLight(0xffeedd, 0.8);
  backLight.position.set(-4, 5, -5);
  scene.add(backLight);

  // Pumpkin Head Internal Glow Point Light
  const headLight = new THREE.PointLight(0xff6600, 3.0, 4.0);
  headLight.position.set(0, 0, 0.2);

  // Green Under-lighting
  const bottomGlow = new THREE.PointLight(0x22c55e, 1.4, 4.0);
  bottomGlow.position.set(0, 0.1, 0.5);
  scene.add(bottomGlow);

  // Spooky Monster Materials
  const materials = {
    pumpkinMain: new THREE.MeshStandardMaterial({ color: 0xeb6b14, roughness: 0.5, metalness: 0.1 }),
    pumpkinRib: new THREE.MeshStandardMaterial({ color: 0xcf5204, roughness: 0.6 }),
    pumpkinStem: new THREE.MeshStandardMaterial({ color: 0x3d6e24, roughness: 0.7 }),
    glowFace: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
    coatDark: new THREE.MeshStandardMaterial({ color: 0x241836, roughness: 0.6 }),
    coatTrim: new THREE.MeshStandardMaterial({ color: 0x6b21a8, roughness: 0.5 }),
    shirtInner: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 }),
    skinMonster: new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.6 }),
    clawColor: new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3, metalness: 0.4 }),
    pantsColor: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.7 }),
    bootsColor: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 }),
    pedestalGround: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }),
    emberMat: new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.85 }),
  };

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  const monsterGroup = new THREE.Group();
  monsterGroup.scale.set(1.258, 1.258, 1.258);
  scene.add(monsterGroup);

  // 1. Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.35, 0);
  headGroup.add(headLight);

  const centerHead = createBox(0.72, 0.65, 0.68, materials.pumpkinMain);
  headGroup.add(centerHead);

  const sideLeft = createBox(0.12, 0.58, 0.62, materials.pumpkinRib);
  sideLeft.position.x = -0.4;
  const sideRight = createBox(0.12, 0.58, 0.62, materials.pumpkinRib);
  sideRight.position.x = 0.4;

  const topBump = createBox(0.62, 0.08, 0.58, materials.pumpkinRib);
  topBump.position.y = 0.35;
  const botBump = createBox(0.62, 0.08, 0.58, materials.pumpkinRib);
  botBump.position.y = -0.35;

  headGroup.add(sideLeft, sideRight, topBump, botBump);

  // Curled Stem on top
  const stemBase = createBox(0.1, 0.18, 0.1, materials.pumpkinStem);
  stemBase.position.set(0, 0.45, 0);
  stemBase.rotation.z = -0.15;

  const stemTip = createBox(0.08, 0.12, 0.08, materials.pumpkinStem);
  stemTip.position.set(0.06, 0.56, 0.04);
  stemTip.rotation.z = 0.3;

  headGroup.add(stemBase, stemTip);

  // Glowing Jack-O'-Lantern Face
  const eyeL = createBox(0.14, 0.14, 0.05, materials.glowFace);
  eyeL.position.set(-0.18, 0.1, 0.35);
  eyeL.rotation.z = Math.PI / 4;

  const eyeR = createBox(0.14, 0.14, 0.05, materials.glowFace);
  eyeR.position.set(0.18, 0.1, 0.35);
  eyeR.rotation.z = Math.PI / 4;

  const nose = createBox(0.08, 0.08, 0.05, materials.glowFace);
  nose.position.set(0, -0.02, 0.35);
  nose.rotation.z = Math.PI / 4;

  const mouthBar = createBox(0.42, 0.08, 0.05, materials.glowFace);
  mouthBar.position.set(0, -0.18, 0.35);

  const tooth1 = createBox(0.06, 0.08, 0.05, materials.pumpkinMain);
  tooth1.position.set(-0.1, -0.15, 0.36);
  const tooth2 = createBox(0.06, 0.08, 0.05, materials.pumpkinMain);
  tooth2.position.set(0.1, -0.15, 0.36);
  const tooth3 = createBox(0.06, 0.08, 0.05, materials.pumpkinMain);
  tooth3.position.set(0, -0.21, 0.36);

  headGroup.add(eyeL, eyeR, nose, mouthBar, tooth1, tooth2, tooth3);
  monsterGroup.add(headGroup);

  // 2. Torso
  const torsoGroup = new THREE.Group();

  const innerBody = createBox(0.48, 0.52, 0.36, materials.skinMonster);
  innerBody.position.set(0, 0.86, 0);

  const collarL = createBox(0.08, 0.22, 0.28, materials.coatTrim);
  collarL.position.set(-0.28, 1.05, 0.02);
  collarL.rotation.z = -0.2;

  const collarR = createBox(0.08, 0.22, 0.28, materials.coatTrim);
  collarR.position.set(0.28, 1.05, 0.02);
  collarR.rotation.z = 0.2;

  const coatBack = createBox(0.54, 0.48, 0.1, materials.coatDark);
  coatBack.position.set(0, 0.86, -0.15);

  const coatSideL = createBox(0.1, 0.48, 0.38, materials.coatDark);
  coatSideL.position.set(-0.26, 0.86, 0);

  const coatSideR = createBox(0.1, 0.48, 0.38, materials.coatDark);
  coatSideR.position.set(0.26, 0.86, 0);

  const belt = createBox(0.52, 0.08, 0.4, materials.clawColor);
  belt.position.set(0, 0.63, 0);

  const beltBuckle = createBox(0.12, 0.12, 0.42, materials.pumpkinMain);
  beltBuckle.position.set(0, 0.63, 0);

  torsoGroup.add(innerBody, collarL, collarR, coatBack, coatSideL, coatSideR, belt, beltBuckle);
  monsterGroup.add(torsoGroup);

  // 3. Claw Hands & Arms
  function buildClawHand(isRightHand: boolean) {
    const hand = new THREE.Group();
    const palm = createBox(0.14, 0.1, 0.12, materials.skinMonster);
    palm.position.set(0, -0.02, 0);
    hand.add(palm);

    const thumbX = isRightHand ? 0.08 : -0.08;
    const thumb = createBox(0.04, 0.08, 0.04, materials.clawColor);
    thumb.position.set(thumbX, -0.02, 0.04);
    thumb.rotation.x = 0.3;
    hand.add(thumb);

    for (let i = 0; i < 3; i++) {
      const offsetX = (i - 1) * 0.045;
      const finger = createBox(0.035, 0.1, 0.035, materials.skinMonster);
      finger.position.set(offsetX, -0.09, 0.02);

      const clawTip = createBox(0.03, 0.05, 0.03, materials.clawColor);
      clawTip.position.set(offsetX, -0.15, 0.03);
      clawTip.rotation.x = 0.4;

      hand.add(finger, clawTip);
    }
    return hand;
  }

  // Left Arm
  const armLeft = new THREE.Group();
  armLeft.position.set(-0.35, 1.0, 0);
  const shoulderL = createBox(0.18, 0.18, 0.2, materials.coatTrim);
  const sleeveL = createBox(0.16, 0.28, 0.18, materials.coatDark);
  sleeveL.position.set(0, -0.18, 0);
  const forearmL = createBox(0.14, 0.22, 0.16, materials.skinMonster);
  forearmL.position.set(0, -0.38, 0);
  const handLeft = buildClawHand(false);
  handLeft.position.set(0, -0.5, 0);
  armLeft.add(shoulderL, sleeveL, forearmL, handLeft);

  // Right Arm
  const armRight = new THREE.Group();
  armRight.position.set(0.35, 1.0, 0);
  const shoulderR = createBox(0.18, 0.18, 0.2, materials.coatTrim);
  const sleeveR = createBox(0.16, 0.28, 0.18, materials.coatDark);
  sleeveR.position.set(0, -0.18, 0);
  const forearmR = createBox(0.14, 0.22, 0.16, materials.skinMonster);
  forearmR.position.set(0, -0.38, 0);
  const handRight = buildClawHand(true);
  handRight.position.set(0, -0.5, 0);
  armRight.add(shoulderR, sleeveR, forearmR, handRight);

  monsterGroup.add(armLeft, armRight);

  // 4. Legs
  const legLeft = new THREE.Group();
  legLeft.position.set(-0.16, 0.58, 0);
  const pantL = createBox(0.18, 0.32, 0.2, materials.pantsColor);
  pantL.position.set(0, -0.12, 0);
  const bootL = createBox(0.2, 0.22, 0.28, materials.bootsColor);
  bootL.position.set(0, -0.32, 0.03);
  legLeft.add(pantL, bootL);

  const legRight = new THREE.Group();
  legRight.position.set(0.16, 0.58, 0);
  const pantR = createBox(0.18, 0.32, 0.2, materials.pantsColor);
  pantR.position.set(0, -0.12, 0);
  const bootR = createBox(0.2, 0.22, 0.28, materials.bootsColor);
  bootR.position.set(0, -0.32, 0.03);
  legRight.add(pantR, bootR);

  monsterGroup.add(legLeft, legRight);

  // Mini pumpkin props near feet
  const miniPos: [number, number][] = [
    [-0.45, 0.35],
    [0.48, 0.3],
  ];
  miniPos.forEach(([x, z]) => {
    const mini = createBox(0.15, 0.14, 0.15, materials.pumpkinMain);
    mini.position.set(x, 0.07, z);
    const miniStem = createBox(0.03, 0.05, 0.03, materials.pumpkinStem);
    miniStem.position.set(x, 0.15, z);
    monsterGroup.add(mini, miniStem);
  });

  // Floating Ember Particles
  const emberParticles: THREE.Mesh[] = [];
  const emberGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
  for (let i = 0; i < 20; i++) {
    const mesh = new THREE.Mesh(emberGeo, materials.emberMat);
    mesh.position.set(
      (Math.random() - 0.5) * 1.8,
      0.2 + Math.random() * 1.8,
      (Math.random() - 0.5) * 1.8
    );
    mesh.userData = {
      speedY: 0.3 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
    };
    emberParticles.push(mesh);
    scene.add(mesh);
  }

  // Speech balloon disabled per user request
  const speechBubbleGroup = new THREE.Group();
  speechBubbleGroup.visible = false;
  monsterGroup.add(speechBubbleGroup);

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Spooky floating body motion anchored at standard floor height
    monsterGroup.position.y = -0.028 + Math.sin(time * 2.5) * 0.05;

    // Head bobbing and subtle tilt
    headGroup.rotation.y = Math.sin(time * 1.5) * 0.15;
    headGroup.rotation.z = Math.cos(time * 2.0) * 0.05;

    // Spooky hand waving gesture
    armRight.rotation.z = 0.3 + Math.sin(time * 3.0) * 0.25;
    armRight.rotation.x = -0.4 + Math.cos(time * 2.5) * 0.2;

    armLeft.rotation.z = -0.3 - Math.cos(time * 2.8) * 0.2;
    armLeft.rotation.x = -0.2 + Math.sin(time * 2.0) * 0.15;

    // Subtle leg sway
    legLeft.rotation.x = Math.sin(time * 2.5) * 0.08;
    legRight.rotation.x = -Math.sin(time * 2.5) * 0.08;

    // Headlight inner glow flicker
    headLight.intensity = 2.5 + Math.sin(time * 12.0) * 0.5 + Math.cos(time * 23.0) * 0.3;

    // Ember particles floating up
    emberParticles.forEach((p) => {
      p.position.y += p.userData.speedY * 0.01;
      p.position.x += Math.sin(time * 2.0 + p.userData.offset) * 0.005;
      if (p.position.y > 2.2) {
        p.position.y = 0.2;
        p.position.x = (Math.random() - 0.5) * 1.8;
        p.position.z = (Math.random() - 0.5) * 1.8;
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
      } else if (obj instanceof THREE.Sprite) {
        if (obj.material.map) {
          obj.material.map.dispose();
        }
        obj.material.dispose();
      }
    });
    try {
      const gl = renderer.getContext();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch (_) {}
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

/**
 * Builds the 3D Girly Blocky Pumpkin scene with glowing heart eyes, pink ribbon bow, dress, sparkles, and waving animation.
 */
export function setupGirlyPumpkinScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'CUTE!'
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
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

  // Soft Purple Ambient Light - Bright and vibrant
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  // Warm Key Light
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  // Front Fill Light
  const frontFill = new THREE.DirectionalLight(0xfff1f2, 1.6);
  frontFill.position.set(0, 3, 5);
  scene.add(frontFill);

  // Pink Rim Light
  const rimLight = new THREE.DirectionalLight(0xf472b6, 1.1);
  rimLight.position.set(-4, 5, -4);
  scene.add(rimLight);

  // Pumpkin Internal Glow Light
  const headLight = new THREE.PointLight(0xffb703, 2.5, 3.5);
  headLight.position.set(0, 0, 0.2);

  // Girly Pumpkin Color Palette
  const materials = {
    pumpkinMain: new THREE.MeshStandardMaterial({ color: 0xff7a29, roughness: 0.4, metalness: 0.1 }),
    pumpkinRib: new THREE.MeshStandardMaterial({ color: 0xe05600, roughness: 0.5 }),
    pumpkinStem: new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 }),
    glowFace: new THREE.MeshBasicMaterial({ color: 0xffe066 }),
    blushCheek: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),

    // Girly Outfit Materials
    dressMain: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 }),
    dressTrim: new THREE.MeshStandardMaterial({ color: 0xbe185d, roughness: 0.3 }),
    bowPink: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 }),
    goldAccent: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 }),
    collarWhite: new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.5 }),

    // Skin & Gloves
    skinTone: new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 }),
    gloveColor: new THREE.MeshStandardMaterial({ color: 0xfce7f3, roughness: 0.4 }),

    // Boots & Ground
    bootsColor: new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.3 }),
    pedestalGround: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.9 }),

    // Sparkles
    sparkleMatPink: new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.85 }),
    sparkleMatGold: new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.85 }),
  };

  function createBox(w: number, h: number, d: number, mat: THREE.Material) {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  const monsterGroup = new THREE.Group();
  monsterGroup.scale.set(1.28, 1.28, 1.28);
  scene.add(monsterGroup);

  // Build Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.35, 0);
  headGroup.add(headLight);

  // Main central pumpkin block
  const centerHead = createBox(0.72, 0.65, 0.68, materials.pumpkinMain);
  headGroup.add(centerHead);

  // Side pumpkin ridges for rounded blocky silhouette
  const sideLeft = createBox(0.12, 0.58, 0.62, materials.pumpkinRib);
  sideLeft.position.x = -0.4;
  const sideRight = createBox(0.12, 0.58, 0.62, materials.pumpkinRib);
  sideRight.position.x = 0.4;

  const topBump = createBox(0.62, 0.08, 0.58, materials.pumpkinRib);
  topBump.position.y = 0.35;
  const botBump = createBox(0.62, 0.08, 0.58, materials.pumpkinRib);
  botBump.position.y = -0.35;

  headGroup.add(sideLeft, sideRight, topBump, botBump);

  // Green Stem
  const stem = createBox(0.09, 0.18, 0.09, materials.pumpkinStem);
  stem.position.set(0, 0.45, 0);
  headGroup.add(stem);

  // Cute Pink Ribbon Bow on top near stem
  const bowCenter = createBox(0.1, 0.1, 0.08, materials.goldAccent);
  bowCenter.position.set(0.12, 0.42, 0.18);

  const bowLeftLoop = createBox(0.16, 0.12, 0.06, materials.bowPink);
  bowLeftLoop.position.set(0.02, 0.42, 0.18);
  bowLeftLoop.rotation.z = 0.25;

  const bowRightLoop = createBox(0.16, 0.12, 0.06, materials.bowPink);
  bowRightLoop.position.set(0.22, 0.42, 0.18);
  bowRightLoop.rotation.z = -0.25;

  const bowTail1 = createBox(0.06, 0.14, 0.04, materials.bowPink);
  bowTail1.position.set(0.08, 0.32, 0.19);
  bowTail1.rotation.z = -0.3;

  const bowTail2 = createBox(0.06, 0.14, 0.04, materials.bowPink);
  bowTail2.position.set(0.16, 0.32, 0.19);
  bowTail2.rotation.z = 0.3;

  headGroup.add(bowCenter, bowLeftLoop, bowRightLoop, bowTail1, bowTail2);

  // Glowing Heart-Carved Eyes
  const heartL1 = createBox(0.1, 0.1, 0.05, materials.glowFace);
  heartL1.position.set(-0.18, 0.12, 0.35);
  heartL1.rotation.z = Math.PI / 4;

  const heartL2 = createBox(0.12, 0.06, 0.05, materials.glowFace);
  heartL2.position.set(-0.18, 0.15, 0.35);

  const heartR1 = createBox(0.1, 0.1, 0.05, materials.glowFace);
  heartR1.position.set(0.18, 0.12, 0.35);
  heartR1.rotation.z = Math.PI / 4;

  const heartR2 = createBox(0.12, 0.06, 0.05, materials.glowFace);
  heartR2.position.set(0.18, 0.15, 0.35);

  // Cute Curved Smiling Mouth with single tooth
  const mouthBar = createBox(0.36, 0.07, 0.05, materials.glowFace);
  mouthBar.position.set(0, -0.16, 0.35);

  const mouthCornerL = createBox(0.07, 0.07, 0.05, materials.glowFace);
  mouthCornerL.position.set(-0.18, -0.12, 0.35);

  const mouthCornerR = createBox(0.07, 0.07, 0.05, materials.glowFace);
  mouthCornerR.position.set(0.18, -0.12, 0.35);

  const tooth = createBox(0.05, 0.06, 0.05, materials.pumpkinMain);
  tooth.position.set(-0.06, -0.14, 0.36);

  // Rosy Pink Blush Cheeks
  const blushL = createBox(0.12, 0.06, 0.02, materials.blushCheek);
  blushL.position.set(-0.28, -0.04, 0.36);

  const blushR = createBox(0.12, 0.06, 0.02, materials.blushCheek);
  blushR.position.set(0.28, -0.04, 0.36);

  headGroup.add(heartL1, heartL2, heartR1, heartR2, mouthBar, mouthCornerL, mouthCornerR, tooth, blushL, blushR);
  monsterGroup.add(headGroup);

  // Build Torso
  const torsoGroup = new THREE.Group();

  const collar = createBox(0.44, 0.06, 0.34, materials.collarWhite);
  collar.position.set(0, 1.02, 0);

  const dressTop = createBox(0.42, 0.38, 0.32, materials.dressMain);
  dressTop.position.set(0, 0.82, 0);

  const frontRibbon = createBox(0.08, 0.38, 0.34, materials.dressTrim);
  frontRibbon.position.set(0, 0.82, 0.01);

  const brooch = createBox(0.08, 0.08, 0.36, materials.goldAccent);
  brooch.position.set(0, 0.94, 0.02);
  brooch.rotation.z = Math.PI / 4;

  // Flared Blocky Skirt
  const dressSkirt = new THREE.Group();
  dressSkirt.position.set(0, 0.63, 0);

  const skirtUpper = createBox(0.52, 0.16, 0.42, materials.dressMain);
  skirtUpper.position.y = 0;

  const skirtLower = createBox(0.62, 0.12, 0.52, materials.dressTrim);
  skirtLower.position.y = -0.1;

  const skirtRuffle = createBox(0.66, 0.04, 0.56, materials.collarWhite);
  skirtRuffle.position.y = -0.16;

  dressSkirt.add(skirtUpper, skirtLower, skirtRuffle);

  torsoGroup.add(collar, dressTop, frontRibbon, brooch, dressSkirt);
  monsterGroup.add(torsoGroup);

  // Build Gloved Hand function
  function buildGlovedHand(isRightHand: boolean) {
    const hand = new THREE.Group();

    const palm = createBox(0.06, 0.12, 0.12, materials.gloveColor);
    palm.position.set(0, 0, 0);
    hand.add(palm);

    const thumb = createBox(0.04, 0.07, 0.04, materials.gloveColor);
    thumb.position.set(0, 0.01, 0.05);
    thumb.rotation.x = -0.3;
    hand.add(thumb);

    for (let i = 0; i < 3; i++) {
      const offsetZ = (i - 1) * 0.038;
      const finger = createBox(0.032, 0.08, 0.032, materials.gloveColor);
      finger.position.set(0, -0.09, offsetZ);
      hand.add(finger);
    }
    return hand;
  }

  // Left Arm
  const armLeft = new THREE.Group();
  armLeft.position.set(-0.3, 0.92, 0);

  const puffSleeveL = createBox(0.18, 0.18, 0.18, materials.dressTrim);
  puffSleeveL.position.set(-0.02, 0, 0);

  const armInnerL = createBox(0.12, 0.22, 0.14, materials.skinTone);
  armInnerL.position.set(-0.02, -0.16, 0);

  const gloveCuffL = createBox(0.14, 0.05, 0.15, materials.collarWhite);
  gloveCuffL.position.set(-0.02, -0.28, 0);

  const handLeft = buildGlovedHand(false);
  handLeft.position.set(-0.02, -0.38, 0);

  armLeft.add(puffSleeveL, armInnerL, gloveCuffL, handLeft);

  // Right Arm (Waving Arm)
  const armRight = new THREE.Group();
  armRight.position.set(0.3, 0.92, 0);

  const puffSleeveR = createBox(0.18, 0.18, 0.18, materials.dressTrim);
  puffSleeveR.position.set(0.02, 0, 0);

  const armInnerR = createBox(0.12, 0.22, 0.14, materials.skinTone);
  armInnerR.position.set(0.02, -0.16, 0);

  const gloveCuffR = createBox(0.14, 0.05, 0.15, materials.collarWhite);
  gloveCuffR.position.set(0.02, -0.28, 0);

  const handRight = buildGlovedHand(true);
  handRight.position.set(0.02, -0.38, 0);
  handRight.rotation.y = Math.PI / 2;

  armRight.add(puffSleeveR, armInnerR, gloveCuffR, handRight);
  monsterGroup.add(armLeft, armRight);

  // Build Legs
  const legLeft = new THREE.Group();
  legLeft.position.set(-0.14, 0.45, 0);

  const legInnerL = createBox(0.14, 0.28, 0.14, materials.skinTone);
  legInnerL.position.set(0, -0.05, 0);

  const bootL = createBox(0.18, 0.22, 0.22, materials.bootsColor);
  bootL.position.set(0, -0.24, 0.02);

  const bootBowL = createBox(0.08, 0.06, 0.04, materials.bowPink);
  bootBowL.position.set(0, -0.22, 0.14);

  legLeft.add(legInnerL, bootL, bootBowL);

  const legRight = new THREE.Group();
  legRight.position.set(0.14, 0.45, 0);

  const legInnerR = createBox(0.14, 0.28, 0.14, materials.skinTone);
  legInnerR.position.set(0, -0.05, 0);

  const bootR = createBox(0.18, 0.22, 0.22, materials.bootsColor);
  bootR.position.set(0, -0.24, 0.02);

  const bootBowR = createBox(0.08, 0.06, 0.04, materials.bowPink);
  bootBowR.position.set(0, -0.22, 0.14);

  legRight.add(legInnerR, bootR, bootBowR);
  monsterGroup.add(legLeft, legRight);

  // Mini decorative pink pumpkins
  const miniPos: [number, number][] = [
    [-0.45, 0.35],
    [0.48, 0.3],
  ];
  miniPos.forEach(([x, z]) => {
    const mini = createBox(0.14, 0.13, 0.14, materials.pumpkinMain);
    mini.position.set(x, 0.07, z);
    const miniBow = createBox(0.07, 0.04, 0.03, materials.bowPink);
    miniBow.position.set(x, 0.14, z + 0.06);
    monsterGroup.add(mini, miniBow);
  });

  // Floating Sparkle Particles
  const sparkleParticles: THREE.Mesh[] = [];
  const sparkleGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
  for (let i = 0; i < 24; i++) {
    const mat = i % 2 === 0 ? materials.sparkleMatPink : materials.sparkleMatGold;
    const mesh = new THREE.Mesh(sparkleGeo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 1.8,
      0.2 + Math.random() * 1.8,
      (Math.random() - 0.5) * 1.8
    );
    mesh.userData = {
      speedY: 0.25 + Math.random() * 0.45,
      rotSpeed: 1.0 + Math.random() * 2.0,
      offset: Math.random() * Math.PI * 2,
    };
    sparkleParticles.push(mesh);
    scene.add(mesh);
  }

  // Floating Speech Bubble - disabled per user request

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Cute floating bobbing motion anchored at standard floor height
    monsterGroup.position.y = 0.032 + Math.sin(time * 2.5) * 0.05;

    // Head tilt & gentle wobble
    headGroup.rotation.y = Math.sin(time * 1.5) * 0.12;
    headGroup.rotation.z = Math.cos(time * 2.0) * 0.06;

    // Left arm rests at side with subtle idle motion
    armLeft.rotation.set(0, 0, Math.sin(time * 2.5) * 0.03);

    // Right arm raised high waving "hello" with palm facing forward and active wrist wave
    armRight.rotation.z = 2.2 + Math.sin(time * 4.0) * 0.12;
    armRight.rotation.x = -0.1;
    armRight.rotation.y = 0.1;

    // Wrist waving back and forth
    handRight.rotation.y = Math.PI / 2;
    handRight.rotation.z = Math.sin(time * 7.0) * 0.28;

    // Subtle Dress Skirt Sway
    dressSkirt.rotation.z = Math.sin(time * 2.5) * 0.04;

    // Leg Stance
    legLeft.rotation.x = Math.sin(time * 2.5) * 0.06;
    legRight.rotation.x = -Math.sin(time * 2.5) * 0.06;

    // Pumpkin face light pulse
    headLight.intensity = 2.2 + Math.sin(time * 8.0) * 0.4;

    // Floating Sparkle Particles
    sparkleParticles.forEach((p) => {
      p.position.y += p.userData.speedY * 0.008;
      p.position.x += Math.sin(time * 2.0 + p.userData.offset) * 0.004;
      p.rotation.y += p.userData.rotSpeed * 0.02;
      p.rotation.z += p.userData.rotSpeed * 0.01;

      if (p.position.y > 2.2) {
        p.position.y = 0.2;
        p.position.x = (Math.random() - 0.5) * 1.8;
        p.position.z = (Math.random() - 0.5) * 1.8;
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
      } else if (obj instanceof THREE.Sprite) {
        if (obj.material.map) {
          obj.material.map.dispose();
        }
        obj.material.dispose();
      }
    });
    try {
      const gl = renderer.getContext();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch (_) {}
    renderer.dispose();
  };

  return { dispose, renderer, scene };
}

// Default setup alias
export const setupCharacterScene = setupWavingCharacterScene;

// High-visibility tactical halo filter for map clarity against dark terrain
export const getCharacterAuraFilter = (v?: CharacterVariant | string): string => {
  switch (v) {
    case 'moon_demon_noble':
      return 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.95)) drop-shadow(0 0 3px rgba(192, 132, 252, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'demon_dog_warrior':
      return 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 3px rgba(254, 202, 202, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'celestial_moon_guardian':
      return 'drop-shadow(0 0 10px rgba(244, 114, 182, 0.95)) drop-shadow(0 0 3px rgba(254, 240, 138, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'sacred_shrine_priestess':
      return 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.95)) drop-shadow(0 0 3px rgba(167, 243, 208, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'cyber_soccer_girl':
      return 'drop-shadow(0 0 9px rgba(236, 72, 153, 0.9)) drop-shadow(0 0 2px rgba(192, 132, 252, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'cyber_soccer_boy':
      return 'drop-shadow(0 0 9px rgba(34, 197, 94, 0.9)) drop-shadow(0 0 2px rgba(254, 240, 138, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'purple_anime_girl':
      return 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.95)) drop-shadow(0 0 2px rgba(244, 63, 94, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'mexican_traveler':
      return 'drop-shadow(0 0 9px rgba(245, 158, 11, 0.9)) drop-shadow(0 0 2px rgba(56, 189, 248, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'alien_girl':
      return 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.95)) drop-shadow(0 0 2px rgba(79, 70, 229, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'alien_boy':
      return 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.95)) drop-shadow(0 0 2px rgba(56, 189, 248, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'jason':
      return 'drop-shadow(0 0 9px rgba(245, 158, 11, 0.9)) drop-shadow(0 0 2px rgba(254, 240, 138, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'ghostface':
      return 'drop-shadow(0 0 10px rgba(165, 180, 252, 0.95)) drop-shadow(0 0 2px rgba(255, 255, 255, 1)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'michael_myers':
      return 'drop-shadow(0 0 9px rgba(96, 165, 250, 0.9)) drop-shadow(0 0 2px rgba(219, 234, 254, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'freddy':
      return 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 2px rgba(254, 202, 202, 0.95)) drop-shadow(0 3px 6px rgba(0,0,0,0.7))';
    case 'pumpkin':
      return 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.85)) drop-shadow(0 2px 5px rgba(0,0,0,0.5))';
    case 'girly_pumpkin':
      return 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.85)) drop-shadow(0 2px 5px rgba(0,0,0,0.5))';
    default:
      return 'drop-shadow(0 0 6px rgba(163, 230, 53, 0.65)) drop-shadow(0 2px 5px rgba(0,0,0,0.5))';
  }
};

export const getCharacterPedestal = (v?: CharacterVariant | string, live: boolean = false) => {
  switch (v) {
    case 'moon_demon_noble':
      return {
        ring: 'border-purple-400 bg-purple-600/35 shadow-[0_0_16px_#a855f7]',
        ping: 'bg-purple-400',
      };
    case 'demon_dog_warrior':
      return {
        ring: 'border-red-500 bg-red-600/35 shadow-[0_0_16px_#ef4444]',
        ping: 'bg-red-500',
      };
    case 'celestial_moon_guardian':
      return {
        ring: 'border-pink-400 bg-pink-500/35 shadow-[0_0_16px_#f472b6]',
        ping: 'bg-pink-400',
      };
    case 'sacred_shrine_priestess':
      return {
        ring: 'border-emerald-400 bg-emerald-500/35 shadow-[0_0_16px_#34d399]',
        ping: 'bg-emerald-400',
      };
    case 'cyber_soccer_girl':
      return {
        ring: 'border-pink-500 bg-purple-600/35 shadow-[0_0_16px_#ec4899]',
        ping: 'bg-pink-500',
      };
    case 'cyber_soccer_boy':
      return {
        ring: 'border-emerald-500 bg-emerald-600/35 shadow-[0_0_16px_#10b981]',
        ping: 'bg-emerald-500',
      };
    case 'purple_anime_girl':
      return {
        ring: 'border-purple-400 bg-purple-600/35 shadow-[0_0_16px_#a855f7]',
        ping: 'bg-purple-400',
      };
    case 'mexican_traveler':
      return {
        ring: 'border-amber-400 bg-amber-600/35 shadow-[0_0_16px_#f59e0b]',
        ping: 'bg-amber-400',
      };
    case 'alien_girl':
      return {
        ring: 'border-rose-400 bg-indigo-600/35 shadow-[0_0_16px_#f43f5e]',
        ping: 'bg-rose-400',
      };
    case 'alien_boy':
      return {
        ring: 'border-cyan-400 bg-emerald-600/35 shadow-[0_0_16px_#38bdf8]',
        ping: 'bg-cyan-400',
      };
    case 'freddy':
      return {
        ring: 'border-red-500 bg-red-600/35 shadow-[0_0_16px_#ef4444]',
        ping: 'bg-red-500',
      };
    case 'jason':
      return {
        ring: 'border-amber-400 bg-amber-500/35 shadow-[0_0_16px_#f59e0b]',
        ping: 'bg-amber-400',
      };
    case 'ghostface':
      return {
        ring: 'border-indigo-300 bg-indigo-400/35 shadow-[0_0_16px_#a5b4fc]',
        ping: 'bg-indigo-300',
      };
    case 'michael_myers':
      return {
        ring: 'border-blue-400 bg-blue-500/35 shadow-[0_0_16px_#60a5fa]',
        ping: 'bg-blue-400',
      };
    case 'pumpkin':
      return {
        ring: 'border-orange-500 bg-orange-600/35 shadow-[0_0_16px_#f97316]',
        ping: 'bg-orange-500',
      };
    case 'girly_pumpkin':
      return {
        ring: 'border-pink-400 bg-pink-500/35 shadow-[0_0_16px_#ec4899]',
        ping: 'bg-pink-400',
      };
    default:
      return {
        ring: live
          ? 'border-lime-400 bg-lime-400/25 shadow-[0_0_12px_#a3e635]'
          : 'border-green-400 bg-green-500/20 shadow-[0_0_8px_#22c55e]',
        ping: live ? 'bg-lime-400' : 'bg-green-400',
      };
  }
};

export function createSceneForVariant(
  variant: CharacterVariant,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string
) {
  switch (variant) {
    case 'moon_demon_noble':
      return setupMoonDemonNobleScene(canvas, width, height, speechText === 'HELLO!' ? 'SILENCE!' : speechText);
    case 'demon_dog_warrior':
      return setupDemonDogWarriorScene(canvas, width, height, speechText === 'HELLO!' ? 'IRON REAVER!' : speechText);
    case 'celestial_moon_guardian':
      return setupCelestialMoonGuardianScene(canvas, width, height, speechText === 'HELLO!' ? 'COSMIC POWER!' : speechText);
    case 'sacred_shrine_priestess':
      return setupSacredShrinePriestessScene(canvas, width, height, speechText === 'HELLO!' ? 'PURIFY!' : speechText);
    case 'cyber_soccer_girl':
      return setupCyberSoccerGirlScene(canvas, width, height, speechText === 'HELLO!' ? 'GOAL!' : speechText);
    case 'cyber_soccer_boy':
      return setupCyberSoccerBoyScene(canvas, width, height, speechText === 'HELLO!' ? 'STRIKE!' : speechText);
    case 'purple_anime_girl':
      return setupPurpleAnimeGirlScene(canvas, width, height, speechText === 'HELLO!' ? 'MEOW!' : speechText);
    case 'mexican_traveler':
      return setupMexicanTravelerScene(canvas, width, height, speechText === 'HELLO!' ? 'HOLA!' : speechText);
    case 'alien_girl':
      return setupAlienGirlScene(canvas, width, height, speechText === 'HELLO!' ? 'PEACE!' : speechText);
    case 'alien_boy':
      return setupAlienBoyScene(canvas, width, height, speechText === 'HELLO!' ? 'COSMIC!' : speechText);
    case 'freddy':
      return setupFreddyScene(canvas, width, height, speechText === 'HELLO!' ? 'DREAM!' : speechText);
    case 'jason':
      return setupJasonScene(canvas, width, height, speechText === 'HELLO!' ? 'KI-KI-KI!' : speechText);
    case 'ghostface':
      return setupGhostfaceScene(canvas, width, height, speechText === 'HELLO!' ? 'SCARY!' : speechText);
    case 'michael_myers':
      return setupMichaelMyersScene(canvas, width, height, speechText === 'HELLO!' ? '...' : speechText);
    case 'girly_pumpkin':
      return setupGirlyPumpkinScene(canvas, width, height, speechText === 'HELLO!' ? 'CUTE!' : speechText);
    case 'pumpkin':
      return setupPumpkinMonsterScene(canvas, width, height, speechText === 'HELLO!' ? 'BOO!' : speechText);
    case 'waving':
      return setupWavingCharacterScene(canvas, width, height, speechText);
    case 'classic':
    default:
      return setupClassicCharacterScene(canvas, width, height, speechText);
  }
}

// Global in-memory cache for character preview images to prevent WebGL context exhaustion
export const characterThumbnailCache = new Map<CharacterVariant, string>();
const thumbnailListeners = new Set<() => void>();

let isThumbnailQueueRunning = false;
const thumbnailQueue: CharacterVariant[] = [];

export function requestCharacterThumbnail(v: CharacterVariant) {
  if (characterThumbnailCache.has(v)) return;
  if (!thumbnailQueue.includes(v)) {
    thumbnailQueue.push(v);
    processThumbnailQueue();
  }
}

// Load cached thumbnails from sessionStorage if present
if (typeof window !== 'undefined') {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach((k) => {
      if (k.startsWith('char_thumb_')) {
        const variant = k.replace('char_thumb_', '') as CharacterVariant;
        const val = sessionStorage.getItem(k);
        if (val && val.length > 200) {
          characterThumbnailCache.set(variant, val);
        }
      }
    });
  } catch (_) {}
}

async function processThumbnailQueue() {
  if (isThumbnailQueueRunning) return;
  isThumbnailQueueRunning = true;

  while (thumbnailQueue.length > 0) {
    const v = thumbnailQueue.shift();
    if (!v || characterThumbnailCache.has(v)) continue;

    try {
      if (typeof document !== 'undefined') {
        const offscreen = document.createElement('canvas');
        offscreen.width = 180;
        offscreen.height = 240;
        offscreen.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);

        const instance = createSceneForVariant(v, offscreen, 180, 240, '');
        // Initial frame is rendered synchronously by createSceneForVariant
        const dataUrl = offscreen.toDataURL('image/png');
        if (dataUrl && dataUrl.length > 300) {
          characterThumbnailCache.set(v, dataUrl);
          try {
            sessionStorage.setItem('char_thumb_' + v, dataUrl);
          } catch (_) {}
        }

        instance.dispose();
        try {
          const gl = instance.renderer?.getContext();
          gl?.getExtension('WEBGL_lose_context')?.loseContext();
        } catch (_) {}

        // Notify mounted components of new thumbnail
        thumbnailListeners.forEach((cb) => cb());
      }
    } catch (err) {
      console.warn('Character thumbnail generator notice:', err);
    }

    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  isThumbnailQueueRunning = false;
}

// Pre-populate queue for all variants in the background
if (typeof window !== 'undefined') {
  const allVariants: CharacterVariant[] = [
    'waving',
    'classic',
    'pumpkin',
    'girly_pumpkin',
    'jason',
    'ghostface',
    'michael_myers',
    'freddy',
    'cyber_soccer_girl',
    'cyber_soccer_boy',
    'purple_anime_girl',
    'mexican_traveler',
    'alien_girl',
    'alien_boy',
    'moon_demon_noble',
    'demon_dog_warrior',
    'celestial_moon_guardian',
    'sacred_shrine_priestess',
  ];
  allVariants.forEach((v) => requestCharacterThumbnail(v));
}

interface BlockyCharacter3DProps {
  variant?: CharacterVariant;
  speechText?: string;
  width?: number;
  height?: number;
  gamerTag?: string;
  isLive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const BlockyCharacter3D: React.FC<BlockyCharacter3DProps> = ({
  variant = 'waving',
  speechText = '',
  width = 96,
  height = 120,
  gamerTag,
  isLive = false,
  onClick,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [, setRerender] = useState(0);

  // Subscribe to thumbnail generation if not live and thumbnail is still pending
  useEffect(() => {
    if (isLive) return;
    if (!characterThumbnailCache.has(variant)) {
      requestCharacterThumbnail(variant);
      const listener = () => setRerender((r: number) => r + 1);
      thumbnailListeners.add(listener);
      return () => {
        thumbnailListeners.delete(listener);
      };
    }
  }, [variant, isLive]);

  // When live, maintain high-performance 60fps WebGL scene
  useEffect(() => {
    if (!isLive) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const handleContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    const instance = createSceneForVariant(variant, canvas, width, height, speechText);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      instance.dispose();
    };
  }, [variant, isLive, speechText, width, height]);

  const pedestal = getCharacterPedestal(variant, isLive);
  const auraFilter = getCharacterAuraFilter(variant);
  const thumbnail = characterThumbnailCache.get(variant);

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center select-none cursor-pointer group ${className}`}
      style={{ width }}
    >
      {/* Tactical Floating Gamertag Badge */}
      {gamerTag && (
        <div
          className="mb-0.5 px-2 py-0.5 text-[10px] font-display font-black tracking-wider rounded whitespace-nowrap bg-[#041207]/90 border border-lime-400 text-lime-200 shadow-[0_0_12px_rgba(163,230,53,0.6)] flex items-center gap-1 transition-transform group-hover:scale-105"
          style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full inline-block ${
              isLive ? 'bg-lime-400 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span>{gamerTag}</span>
        </div>
      )}

      {/* The 3D Character Canvas or Cached Static Image */}
      <div className="relative" style={{ width, height }}>
        {isLive ? (
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              filter: auraFilter,
              transition: 'filter 0.2s ease-in-out',
            }}
          />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={variant}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'contain',
              filter: auraFilter,
              transition: 'filter 0.2s ease-in-out',
            }}
            className="pointer-events-none select-none"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center pointer-events-none select-none"
            style={{ filter: auraFilter }}
          >
            <div className="w-8 h-8 rounded-full border border-dashed border-slate-500/60 animate-spin opacity-50" />
          </div>
        )}

        {/* Tactical Pulse / Pedestal Circle under Character Feet */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 pointer-events-none">
          <div
            className={`w-full h-full rounded-full border opacity-85 transition-all ${pedestal.ring}`}
          />
          <div
            className={`absolute inset-0 rounded-full animate-ping opacity-45 ${pedestal.ping}`}
          />
        </div>
      </div>
    </div>
  );
};
