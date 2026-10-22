import * as THREE from 'three';

// Helper: Toon Lighting Ramp Canvas Texture
function createToonRampTexture(colors: string[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = colors.length;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    colors.forEach((col, idx) => {
      ctx.fillStyle = col;
      ctx.fillRect(idx, 0, 1, 1);
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

// Helper: Inverted Hull Toon Outline
function createOutline(geometry: THREE.BufferGeometry, thickness = 0.035, color = 0x030508): THREE.Mesh {
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
  });
  const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
  outlineMesh.scale.multiplyScalar(1.0 + thickness);
  return outlineMesh;
}

// Helper: Speech Bubble for Characters - disabled per user request
function createSpeechBubbleGroup(_text: string, _borderColor: string, _textColor: string) {
  const speechBubbleGroup = new THREE.Group();
  speechBubbleGroup.visible = false;
  return speechBubbleGroup;
}


// Clean disposal helper
function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer, animationFrameId: number) {
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
    } else if (obj instanceof THREE.Points) {
      obj.geometry.dispose();
      if (obj.material instanceof THREE.Material) {
        obj.material.dispose();
      }
    }
  });
  try {
    const gl = renderer.getContext();
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch (_) {}
  renderer.dispose();
}

/**
 * 3D Toon Jason Voorhees Scene
 * Hockey mask with red chevrons, scalp lumps, deformed ear, eye sockets, glowing iris,
 * olive green jacket, jeans, boots, and right hand holding blood-stained machete.
 */
export function setupJasonScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'KI-KI-KI!'
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

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
  renderer.toneMappingExposure = 1.75;
  renderer.setClearColor(0x000000, 0);

  const toonRampTexture = createToonRampTexture(['#64748b', '#94a3b8', '#e2e8f0', '#ffffff']);

  // Materials - Bright, ultra-legible slasher tones visible on dark maps
  const maskMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonRampTexture });
  const maskRedMat = new THREE.MeshToonMaterial({ color: 0xef4444, gradientMap: toonRampTexture });
  const skinMat = new THREE.MeshToonMaterial({ color: 0xa8998a, gradientMap: toonRampTexture });
  const scarMat = new THREE.MeshToonMaterial({ color: 0x8c7361, gradientMap: toonRampTexture });
  const jacketMat = new THREE.MeshToonMaterial({ color: 0x628a59, gradientMap: toonRampTexture });
  const shirtMat = new THREE.MeshToonMaterial({ color: 0x5e564d, gradientMap: toonRampTexture });
  const pantsMat = new THREE.MeshToonMaterial({ color: 0x4f678a, gradientMap: toonRampTexture });
  const bootMat = new THREE.MeshToonMaterial({ color: 0x423831, gradientMap: toonRampTexture });
  const gloveMat = new THREE.MeshToonMaterial({ color: 0x735a47, gradientMap: toonRampTexture });
  const strapMat = new THREE.MeshToonMaterial({ color: 0x3d332c, gradientMap: toonRampTexture });
  const bladeMat = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonRampTexture });
  const bloodMat = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonRampTexture });
  const handleWoodMat = new THREE.MeshToonMaterial({ color: 0x78492c, gradientMap: toonRampTexture });
  const brassRivetMat = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonRampTexture });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0f });
  const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

  // Main Root Group - Normalized for identical framing
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const characterGroup = new THREE.Group();
  // Normalized offset: boots bottom aligns with y = 0
  characterGroup.position.set(0, 0.46, 0);
  characterGroup.scale.set(1.08, 1.08, 1.08);
  rootGroup.add(characterGroup);

  // ---------------- HEAD GROUP ----------------
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.62;

  // Deformed Neck
  const neckGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.32, 12);
  const neckMesh = new THREE.Mesh(neckGeo, scarMat);
  neckMesh.position.set(0, -0.42, 0);
  neckMesh.add(createOutline(neckGeo, 0.03));
  headGroup.add(neckMesh);

  // Deformed Head Base
  const headGeo = new THREE.BoxGeometry(0.72, 0.74, 0.66);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headMesh.add(createOutline(headGeo, 0.035));
  headGroup.add(headMesh);

  // Scalp Lumps & Deformities
  const lump1Geo = new THREE.BoxGeometry(0.22, 0.25, 0.22);
  const lump1 = new THREE.Mesh(lump1Geo, scarMat);
  lump1.position.set(0.26, 0.3, -0.15);
  lump1.rotation.set(0.2, 0.1, 0.3);
  headGroup.add(lump1);

  const lump2Geo = new THREE.BoxGeometry(0.28, 0.18, 0.2);
  const lump2 = new THREE.Mesh(lump2Geo, scarMat);
  lump2.position.set(-0.2, 0.32, -0.1);
  headGroup.add(lump2);

  // Ears
  const earGeo = new THREE.BoxGeometry(0.08, 0.16, 0.1);
  const earL = new THREE.Mesh(earGeo, scarMat);
  earL.position.set(-0.38, 0.02, -0.05);
  headGroup.add(earL);

  const earR = new THREE.Mesh(earGeo, scarMat);
  earR.position.set(0.38, -0.04, -0.05);
  headGroup.add(earR);

  // Eye Sockets & Right Iris
  const eyeSocketGeo = new THREE.BoxGeometry(0.18, 0.16, 0.1);
  const leftSocket = new THREE.Mesh(eyeSocketGeo, voidMat);
  leftSocket.position.set(-0.16, 0.08, 0.31);
  headGroup.add(leftSocket);

  const rightSocket = new THREE.Mesh(eyeSocketGeo, voidMat);
  rightSocket.position.set(0.16, 0.08, 0.31);
  headGroup.add(rightSocket);

  const irisGeo = new THREE.BoxGeometry(0.05, 0.05, 0.02);
  const rightIris = new THREE.Mesh(irisGeo, eyeIrisMat);
  rightIris.position.set(0.16, 0.08, 0.34);
  headGroup.add(rightIris);

  // HOCKEY MASK
  const maskGroup = new THREE.Group();
  maskGroup.position.set(0, 0.03, 0.18);

  const maskPlateGeo = new THREE.BoxGeometry(0.68, 0.74, 0.28);
  const maskPlate = new THREE.Mesh(maskPlateGeo, maskMat);
  maskPlate.position.set(0, 0, 0.12);
  maskPlate.castShadow = true;
  maskPlate.add(createOutline(maskPlateGeo, 0.03));
  maskGroup.add(maskPlate);

  const eyeHoleGeo = new THREE.BoxGeometry(0.18, 0.14, 0.08);
  const maskEyeL = new THREE.Mesh(eyeHoleGeo, voidMat);
  maskEyeL.position.set(-0.16, 0.06, 0.26);
  maskGroup.add(maskEyeL);

  const maskEyeR = new THREE.Mesh(eyeHoleGeo, voidMat);
  maskEyeR.position.set(0.16, 0.06, 0.26);
  maskGroup.add(maskEyeR);

  // Red Chevrons
  const chevronTopGeo = new THREE.BoxGeometry(0.12, 0.14, 0.03);
  const chevronTop = new THREE.Mesh(chevronTopGeo, maskRedMat);
  chevronTop.position.set(0, 0.26, 0.27);
  chevronTop.rotation.z = Math.PI / 4;
  maskGroup.add(chevronTop);

  const chevronLGeo = new THREE.BoxGeometry(0.14, 0.08, 0.03);
  const chevronL = new THREE.Mesh(chevronLGeo, maskRedMat);
  chevronL.position.set(-0.22, -0.06, 0.27);
  chevronL.rotation.z = -0.3;
  maskGroup.add(chevronL);

  const chevronRGeo = new THREE.BoxGeometry(0.14, 0.08, 0.03);
  const chevronR = new THREE.Mesh(chevronRGeo, maskRedMat);
  chevronR.position.set(0.22, -0.06, 0.27);
  chevronR.rotation.z = 0.3;
  maskGroup.add(chevronR);

  // Vent Holes
  const ventGeo = new THREE.BoxGeometry(0.025, 0.025, 0.02);
  const ventPositions = [
    [0, 0.02, 0.27],
    [0, -0.05, 0.27],
    [-0.1, -0.12, 0.27],
    [0.1, -0.12, 0.27],
    [-0.18, -0.18, 0.27],
    [0.18, -0.18, 0.27],
    [-0.1, -0.24, 0.27],
    [0, -0.24, 0.27],
    [0.1, -0.24, 0.27],
    [-0.05, -0.3, 0.27],
    [0.05, -0.3, 0.27],
  ];
  ventPositions.forEach((p) => {
    const vent = new THREE.Mesh(ventGeo, voidMat);
    vent.position.set(p[0], p[1], p[2]);
    maskGroup.add(vent);
  });

  // Straps
  const topStrapGeo = new THREE.BoxGeometry(0.08, 0.25, 0.55);
  const topStrap = new THREE.Mesh(topStrapGeo, strapMat);
  topStrap.position.set(0, 0.34, 0);
  maskGroup.add(topStrap);

  const sideStrapGeo = new THREE.BoxGeometry(0.74, 0.06, 0.45);
  const sideStrap = new THREE.Mesh(sideStrapGeo, strapMat);
  sideStrap.position.set(0, 0.04, -0.02);
  maskGroup.add(sideStrap);

  headGroup.add(maskGroup);
  characterGroup.add(headGroup);

  // ---------------- TORSO / JACKET GROUP ----------------
  const jacketGroup = new THREE.Group();
  const torsoWidth = 0.92;
  const torsoHeight = 0.95;
  const torsoDepth = 0.58;

  const shirtGeo = new THREE.BoxGeometry(torsoWidth * 0.88, torsoHeight, torsoDepth * 0.88);
  const shirtMesh = new THREE.Mesh(shirtGeo, shirtMat);
  shirtMesh.position.y = 0.8;
  shirtMesh.castShadow = true;
  jacketGroup.add(shirtMesh);

  const jacketGeo = new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth);
  const jacketMesh = new THREE.Mesh(jacketGeo, jacketMat);
  jacketMesh.position.y = 0.82;
  jacketMesh.castShadow = true;
  jacketMesh.add(createOutline(jacketGeo, 0.03));
  jacketGroup.add(jacketMesh);

  const lapelGeoL = new THREE.BoxGeometry(0.12, torsoHeight * 0.9, 0.08);
  const lapelL = new THREE.Mesh(lapelGeoL, jacketMat);
  lapelL.position.set(-0.24, 0.82, 0.3);
  lapelL.rotation.y = -0.25;
  jacketGroup.add(lapelL);

  const lapelR = new THREE.Mesh(lapelGeoL, jacketMat);
  lapelR.position.set(0.24, 0.82, 0.3);
  lapelR.rotation.y = 0.25;
  jacketGroup.add(lapelR);

  const pocketGeo = new THREE.BoxGeometry(0.22, 0.2, 0.05);
  const pocketL = new THREE.Mesh(pocketGeo, jacketMat);
  pocketL.position.set(-0.25, 0.58, 0.31);
  pocketL.add(createOutline(pocketGeo, 0.02));
  jacketGroup.add(pocketL);

  const pocketR = new THREE.Mesh(pocketGeo, jacketMat);
  pocketR.position.set(0.25, 0.58, 0.31);
  pocketR.add(createOutline(pocketGeo, 0.02));
  jacketGroup.add(pocketR);

  const shoulderGeo = new THREE.SphereGeometry(0.24, 12, 12);
  const shoulderR = new THREE.Mesh(shoulderGeo, jacketMat);
  shoulderR.position.set(-0.48, 1.22, 0);
  shoulderR.add(createOutline(shoulderGeo, 0.025));
  jacketGroup.add(shoulderR);

  const shoulderL = new THREE.Mesh(shoulderGeo, jacketMat);
  shoulderL.position.set(0.48, 1.22, 0);
  shoulderL.add(createOutline(shoulderGeo, 0.025));
  jacketGroup.add(shoulderL);

  characterGroup.add(jacketGroup);

  // Legs & Boots
  const legGeo = new THREE.BoxGeometry(0.36, 0.68, 0.42);
  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(-0.24, 0.05, 0);
  legR.castShadow = true;
  legR.add(createOutline(legGeo, 0.03));
  characterGroup.add(legR);

  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(0.24, 0.05, 0);
  legL.castShadow = true;
  legL.add(createOutline(legGeo, 0.03));
  characterGroup.add(legL);

  const bootGeo = new THREE.BoxGeometry(0.32, 0.22, 0.48);
  const bootR = new THREE.Mesh(bootGeo, bootMat);
  bootR.position.set(-0.24, -0.32, 0.05);
  bootR.castShadow = true;
  bootR.add(createOutline(bootGeo, 0.03));
  characterGroup.add(bootR);

  const bootL = new THREE.Mesh(bootGeo, bootMat);
  bootL.position.set(0.24, -0.32, 0.05);
  bootL.castShadow = true;
  bootL.add(createOutline(bootGeo, 0.03));
  characterGroup.add(bootL);

  // ---------------- RIGHT ARM: HOLDING MACHETE ----------------
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(-0.52, 1.22, 0);

  const armSleeveGeo = new THREE.BoxGeometry(0.28, 0.58, 0.28);
  const armSleeveR = new THREE.Mesh(armSleeveGeo, jacketMat);
  armSleeveR.position.y = -0.32;
  armSleeveR.castShadow = true;
  armSleeveR.add(createOutline(armSleeveGeo, 0.03));
  rightArmGroup.add(armSleeveR);

  const handRGeo = new THREE.BoxGeometry(0.22, 0.2, 0.22);
  const handR = new THREE.Mesh(handRGeo, gloveMat);
  handR.position.y = -0.68;
  handR.add(createOutline(handRGeo, 0.03));

  const fingerPositions = [-0.07, -0.025, 0.025, 0.07];
  fingerPositions.forEach((posX) => {
    const fGeo = new THREE.BoxGeometry(0.045, 0.14, 0.05);
    const finger = new THREE.Mesh(fGeo, gloveMat);
    finger.position.set(posX, -0.08, 0.08);
    finger.rotation.x = 0.8;
    handR.add(finger);
  });

  const macheteGroup = new THREE.Group();
  macheteGroup.position.set(0, -0.05, 0.02);

  const handleGeo = new THREE.BoxGeometry(0.05, 0.32, 0.08);
  const handle = new THREE.Mesh(handleGeo, handleWoodMat);
  handle.position.set(0, -0.08, 0);
  handle.add(createOutline(handleGeo, 0.02));
  macheteGroup.add(handle);

  const rivetGeo = new THREE.BoxGeometry(0.06, 0.025, 0.025);
  const r1 = new THREE.Mesh(rivetGeo, brassRivetMat);
  r1.position.set(0, 0.02, 0);
  macheteGroup.add(r1);
  const r2 = new THREE.Mesh(rivetGeo, brassRivetMat);
  r2.position.set(0, -0.08, 0);
  macheteGroup.add(r2);
  const r3 = new THREE.Mesh(rivetGeo, brassRivetMat);
  r3.position.set(0, -0.18, 0);
  macheteGroup.add(r3);

  const bladeBodyGeo = new THREE.BoxGeometry(0.022, 0.95, 0.16);
  const bladeBody = new THREE.Mesh(bladeBodyGeo, bladeMat);
  bladeBody.position.set(0, 0.52, 0.04);
  bladeBody.castShadow = true;
  bladeBody.add(createOutline(bladeBodyGeo, 0.025));
  macheteGroup.add(bladeBody);

  const tipGeo = new THREE.BoxGeometry(0.022, 0.22, 0.16);
  const bladeTip = new THREE.Mesh(tipGeo, bladeMat);
  bladeTip.position.set(0, 0.98, 0.06);
  bladeTip.rotation.z = -0.35;
  bladeTip.add(createOutline(tipGeo, 0.02));
  macheteGroup.add(bladeTip);

  const bloodGeo = new THREE.BoxGeometry(0.026, 0.38, 0.08);
  const bloodMesh = new THREE.Mesh(bloodGeo, bloodMat);
  bloodMesh.position.set(0, 0.72, 0.08);
  macheteGroup.add(bloodMesh);

  const glintGeo = new THREE.BoxGeometry(0.006, 0.92, 0.02);
  const glint = new THREE.Mesh(glintGeo, glintMat);
  glint.position.set(0.012, 0.52, 0.11);
  macheteGroup.add(glint);

  handR.add(macheteGroup);
  rightArmGroup.add(handR);
  characterGroup.add(rightArmGroup);

  // ---------------- LEFT ARM ----------------
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(0.52, 1.22, 0);

  const armSleeveL = new THREE.Mesh(armSleeveGeo, jacketMat);
  armSleeveL.position.y = -0.32;
  armSleeveL.castShadow = true;
  armSleeveL.add(createOutline(armSleeveGeo, 0.03));
  leftArmGroup.add(armSleeveL);

  const handLGeo = new THREE.BoxGeometry(0.22, 0.2, 0.22);
  const handL = new THREE.Mesh(handLGeo, gloveMat);
  handL.position.y = -0.68;
  handL.add(createOutline(handLGeo, 0.03));

  fingerPositions.forEach((posX) => {
    const fGeo = new THREE.BoxGeometry(0.045, 0.13, 0.05);
    const finger = new THREE.Mesh(fGeo, gloveMat);
    finger.position.set(posX, -0.08, 0.06);
    finger.rotation.x = 0.5;
    handL.add(finger);
  });

  leftArmGroup.add(handL);
  characterGroup.add(leftArmGroup);

  // Speech Bubble
  if (speechText) {
    const speechBubbleGroup = createSpeechBubbleGroup(speechText, '#aa1818', '#0f141c');
    characterGroup.add(speechBubbleGroup);
  }

  // Lighting & Embers - High-visibility character lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
  keyLight.position.set(3.5, 6, 4.5);
  scene.add(keyLight);

  const frontFill = new THREE.DirectionalLight(0xffffff, 2.3);
  frontFill.position.set(0, 2.5, 5.0);
  scene.add(frontFill);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
  rimLight.position.set(-3.5, 3, -4);
  scene.add(rimLight);

  const rimAmber = new THREE.DirectionalLight(0xfbbf24, 2.2);
  rimAmber.position.set(3.5, 3, -4);
  scene.add(rimAmber);

  const hearthLight = new THREE.PointLight(0xff7722, 4.0, 8.0);
  hearthLight.position.set(0, -0.2, 2.0);
  scene.add(hearthLight);

  // Floating Embers
  const emberCount = 35;
  const emberGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 1] = Math.random() * 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const emberMat = new THREE.PointsMaterial({
    color: 0xff8833,
    size: 0.05,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const particlesMesh = new THREE.Points(emberGeo, emberMat);
  scene.add(particlesMesh);

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Heavy Breathing Motion
    characterGroup.position.y = 0.46 + Math.sin(elapsedTime * 1.8) * 0.02;
    jacketGroup.scale.x = 1.0 + Math.sin(elapsedTime * 1.8) * 0.015;

    // Slow Menacing Slasher Head Tilt & Sway
    headGroup.rotation.y = Math.sin(elapsedTime * 0.7) * 0.16;
    headGroup.rotation.z = Math.cos(elapsedTime * 0.9) * 0.06;

    // Right Arm: Holding Machete
    rightArmGroup.rotation.x = -0.45 + Math.sin(elapsedTime * 1.5) * 0.05;
    rightArmGroup.rotation.z = -0.22 + Math.cos(elapsedTime * 1.2) * 0.03;
    rightArmGroup.rotation.y = -0.15;

    macheteGroup.rotation.x = 1.05 + Math.sin(elapsedTime * 2.5) * 0.05;
    macheteGroup.rotation.z = 0.12;

    // Left Arm: Idle
    leftArmGroup.rotation.x = Math.sin(elapsedTime * 1.5) * 0.03;
    leftArmGroup.rotation.z = 0.2 + Math.cos(elapsedTime * 1.5) * 0.02;

    // Campfire Flicker
    hearthLight.intensity = 2.2 + Math.sin(elapsedTime * 11.0) * 0.4 + Math.cos(elapsedTime * 21.0) * 0.2;

    // Embers
    const posArr = particlesMesh.geometry.attributes.position.array as Float32Array;
    for (let i = 1; i < posArr.length; i += 3) {
      posArr[i] += 0.006;
      if (posArr[i] > 4) posArr[i] = 0;
    }
    particlesMesh.geometry.attributes.position.needsUpdate = true;

    // Smooth Front Facing Sway
    rootGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.12;

    renderer.render(scene, camera);
  };

  animate();

  return {
    dispose: () => disposeScene(scene, renderer, animationFrameId),
    renderer,
    scene,
  };
}

/**
 * 3D Toon Ghostface Scene
 * Screaming elongated ghostface mask, pointed dark cowl hood, charcoal cloak,
 * hanging sleeve streamers, and Buck 120 hunting knife.
 */
export function setupGhostfaceScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'SCARY!'
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

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
  renderer.toneMappingExposure = 1.75;
  renderer.setClearColor(0x000000, 0);

  const toonRampTexture = createToonRampTexture(['#64748b', '#94a3b8', '#e2e8f0', '#ffffff']);

  // Materials - Bright, ultra-legible twilight-slate cloak visible against dark map backgrounds
  const maskMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonRampTexture });
  const cloakMat = new THREE.MeshToonMaterial({ color: 0x485573, gradientMap: toonRampTexture });
  const innerCloakMat = new THREE.MeshToonMaterial({ color: 0x2f394f, gradientMap: toonRampTexture });
  const gloveMat = new THREE.MeshToonMaterial({ color: 0x5b6787, gradientMap: toonRampTexture });
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x050608 });
  const steelMat = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonRampTexture });
  const bladeEdgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const handleMat = new THREE.MeshToonMaterial({ color: 0x222222, gradientMap: toonRampTexture });
  const brassMat = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonRampTexture });

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const characterGroup = new THREE.Group();
  characterGroup.position.set(0, 0.03, 0);
  characterGroup.scale.set(1.15, 1.15, 1.15);
  rootGroup.add(characterGroup);

  // ---------------- HEAD & HOOD ----------------
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.45;

  const hoodGeo = new THREE.BoxGeometry(0.92, 0.95, 0.92);
  const hoodMesh = new THREE.Mesh(hoodGeo, cloakMat);
  hoodMesh.position.set(0, 0.08, -0.05);
  hoodMesh.castShadow = true;
  hoodMesh.add(createOutline(hoodGeo, 0.04));
  headGroup.add(hoodMesh);

  const hoodPeakGeo = new THREE.ConeGeometry(0.42, 0.5, 4);
  const hoodPeak = new THREE.Mesh(hoodPeakGeo, cloakMat);
  hoodPeak.position.set(0, 0.48, -0.28);
  hoodPeak.rotation.x = -0.4;
  hoodPeak.rotation.y = Math.PI / 4;
  hoodPeak.add(createOutline(hoodPeakGeo, 0.04));
  headGroup.add(hoodPeak);

  const hoodInnerGeo = new THREE.BoxGeometry(0.78, 0.82, 0.3);
  const hoodInner = new THREE.Mesh(hoodInnerGeo, innerCloakMat);
  hoodInner.position.set(0, 0.02, 0.28);
  headGroup.add(hoodInner);

  // Mask Group
  const maskGroup = new THREE.Group();
  maskGroup.position.set(0, -0.02, 0.18);

  const maskTopGeo = new THREE.BoxGeometry(0.66, 0.45, 0.38);
  const maskTop = new THREE.Mesh(maskTopGeo, maskMat);
  maskTop.position.set(0, 0.16, 0.12);
  maskTop.castShadow = true;
  maskTop.add(createOutline(maskTopGeo, 0.035));
  maskGroup.add(maskTop);

  const jawGeo = new THREE.BoxGeometry(0.46, 0.52, 0.35);
  const jawMesh = new THREE.Mesh(jawGeo, maskMat);
  jawMesh.position.set(0, -0.22, 0.1);
  jawMesh.castShadow = true;
  jawMesh.add(createOutline(jawGeo, 0.035));
  maskGroup.add(jawMesh);

  const chinGeo = new THREE.BoxGeometry(0.3, 0.18, 0.28);
  const chinMesh = new THREE.Mesh(chinGeo, maskMat);
  chinMesh.position.set(0, -0.48, 0.07);
  chinMesh.add(createOutline(chinGeo, 0.035));
  maskGroup.add(chinMesh);

  const cheekGeo = new THREE.BoxGeometry(0.12, 0.32, 0.12);
  const leftCheek = new THREE.Mesh(cheekGeo, maskMat);
  leftCheek.position.set(-0.25, -0.12, 0.26);
  leftCheek.rotation.z = -0.18;
  maskGroup.add(leftCheek);

  const rightCheek = new THREE.Mesh(cheekGeo, maskMat);
  rightCheek.position.set(0.25, -0.12, 0.26);
  rightCheek.rotation.z = 0.18;
  maskGroup.add(rightCheek);

  // Screaming Features
  const eyeGeo = new THREE.BoxGeometry(0.18, 0.26, 0.1);
  const leftEye = new THREE.Mesh(eyeGeo, voidMat);
  leftEye.position.set(-0.17, 0.14, 0.32);
  leftEye.rotation.z = 0.32;
  maskGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, voidMat);
  rightEye.position.set(0.17, 0.14, 0.32);
  rightEye.rotation.z = -0.32;
  maskGroup.add(rightEye);

  const noseGeo = new THREE.BoxGeometry(0.08, 0.22, 0.1);
  const noseMesh = new THREE.Mesh(noseGeo, voidMat);
  noseMesh.position.set(0, 0.02, 0.32);
  maskGroup.add(noseMesh);

  const mouthGeo = new THREE.BoxGeometry(0.18, 0.36, 0.12);
  const mouthMesh = new THREE.Mesh(mouthGeo, voidMat);
  mouthMesh.position.set(0, -0.22, 0.28);
  maskGroup.add(mouthMesh);

  headGroup.add(maskGroup);
  characterGroup.add(headGroup);

  // ---------------- TORSO & CLOAK ----------------
  const cloakGroup = new THREE.Group();

  const torsoGeo = new THREE.BoxGeometry(0.8, 0.85, 0.55);
  const torsoMesh = new THREE.Mesh(torsoGeo, cloakMat);
  torsoMesh.position.y = 0.82;
  torsoMesh.castShadow = true;
  torsoMesh.add(createOutline(torsoGeo));
  cloakGroup.add(torsoMesh);

  const cowlGeo = new THREE.BoxGeometry(0.88, 0.25, 0.62);
  const cowlMesh = new THREE.Mesh(cowlGeo, cloakMat);
  cowlMesh.position.y = 1.22;
  cowlMesh.add(createOutline(cowlGeo, 0.03));
  cloakGroup.add(cowlMesh);

  const skirtGeo = new THREE.BoxGeometry(0.85, 0.7, 0.6);
  const skirtMesh = new THREE.Mesh(skirtGeo, cloakMat);
  skirtMesh.position.y = 0.28;
  skirtMesh.castShadow = true;
  skirtMesh.add(createOutline(skirtGeo));
  cloakGroup.add(skirtMesh);

  const fringeCoords = [
    { s: [0.18, 0.25, 0.1], p: [-0.32, -0.1, 0.26] },
    { s: [0.22, 0.32, 0.1], p: [-0.08, -0.14, 0.27] },
    { s: [0.18, 0.22, 0.1], p: [0.16, -0.09, 0.26] },
    { s: [0.2, 0.28, 0.1], p: [0.34, -0.12, 0.25] },
  ];
  fringeCoords.forEach((d) => {
    const fGeo = new THREE.BoxGeometry(d.s[0], d.s[1], d.s[2]);
    const fMesh = new THREE.Mesh(fGeo, cloakMat);
    fMesh.position.set(d.p[0], d.p[1], d.p[2]);
    fMesh.add(createOutline(fGeo, 0.03));
    cloakGroup.add(fMesh);
  });

  const bootGeo = new THREE.BoxGeometry(0.24, 0.2, 0.35);
  const bootL = new THREE.Mesh(bootGeo, gloveMat);
  bootL.position.set(-0.2, 0.08, 0.08);
  bootL.add(createOutline(bootGeo));
  cloakGroup.add(bootL);

  const bootR = new THREE.Mesh(bootGeo, gloveMat);
  bootR.position.set(0.2, 0.08, 0.08);
  bootR.add(createOutline(bootGeo));
  cloakGroup.add(bootR);

  characterGroup.add(cloakGroup);

  // ---------------- ARMS & TATTERED STREAMERS ----------------
  const armGeo = new THREE.BoxGeometry(0.26, 0.58, 0.28);
  const streamerGeo = new THREE.BoxGeometry(0.06, 0.45, 0.18);

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.52, 1.15, 0);

  const armL = new THREE.Mesh(armGeo, cloakMat);
  armL.position.y = -0.24;
  armL.add(createOutline(armGeo));
  leftArmGroup.add(armL);

  const handLGeo = new THREE.BoxGeometry(0.2, 0.2, 0.22);
  const handL = new THREE.Mesh(handLGeo, gloveMat);
  handL.position.y = -0.56;
  handL.add(createOutline(handLGeo, 0.03));
  leftArmGroup.add(handL);

  const streamerL1 = new THREE.Mesh(streamerGeo, cloakMat);
  streamerL1.position.set(-0.1, -0.38, 0);
  streamerL1.rotation.z = 0.25;
  streamerL1.add(createOutline(streamerGeo, 0.03));
  leftArmGroup.add(streamerL1);

  const streamerL2 = new THREE.Mesh(streamerGeo, cloakMat);
  streamerL2.position.set(0.02, -0.42, -0.1);
  streamerL2.rotation.x = -0.2;
  streamerL2.add(createOutline(streamerGeo, 0.03));
  leftArmGroup.add(streamerL2);

  characterGroup.add(leftArmGroup);

  // Right Arm with Knife
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.52, 1.15, 0);
  rightArmGroup.rotation.x = -0.5;
  rightArmGroup.rotation.z = -0.15;

  const armR = new THREE.Mesh(armGeo, cloakMat);
  armR.position.y = -0.24;
  armR.add(createOutline(armGeo));
  rightArmGroup.add(armR);

  const handRGeo = new THREE.BoxGeometry(0.22, 0.2, 0.22);
  const handR = new THREE.Mesh(handRGeo, gloveMat);
  handR.position.y = -0.56;
  handR.add(createOutline(handRGeo, 0.03));
  rightArmGroup.add(handR);

  const streamerR1 = new THREE.Mesh(streamerGeo, cloakMat);
  streamerR1.position.set(0.1, -0.38, 0);
  streamerR1.rotation.z = -0.25;
  streamerR1.add(createOutline(streamerGeo, 0.03));
  rightArmGroup.add(streamerR1);

  // BUCK 120 HUNTING KNIFE
  const knifeGroup = new THREE.Group();
  knifeGroup.position.set(0, -0.58, 0.08);
  knifeGroup.rotation.x = 1.25;
  knifeGroup.rotation.y = -Math.PI / 2;

  const handleGeo = new THREE.BoxGeometry(0.07, 0.3, 0.08);
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.y = -0.1;
  handle.add(createOutline(handleGeo, 0.03));
  knifeGroup.add(handle);

  const guardGeo = new THREE.BoxGeometry(0.12, 0.04, 0.16);
  const guard = new THREE.Mesh(guardGeo, brassMat);
  guard.position.y = 0.07;
  guard.add(createOutline(guardGeo, 0.03));
  knifeGroup.add(guard);

  const pommelGeo = new THREE.BoxGeometry(0.09, 0.04, 0.09);
  const pommel = new THREE.Mesh(pommelGeo, brassMat);
  pommel.position.y = -0.26;
  knifeGroup.add(pommel);

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.12, 0);
  bladeShape.lineTo(0.12, 0.68);
  bladeShape.quadraticCurveTo(0.11, 0.9, 0.0, 1.0);
  bladeShape.lineTo(-0.02, 0.78);
  bladeShape.lineTo(-0.02, 0);
  bladeShape.closePath();

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  });
  const blade = new THREE.Mesh(bladeGeo, steelMat);
  blade.position.set(-0.05, 0.08, -0.012);
  blade.castShadow = true;
  blade.add(createOutline(bladeGeo, 0.025));
  knifeGroup.add(blade);

  const glintGeo = new THREE.BoxGeometry(0.015, 0.7, 0.028);
  const glint = new THREE.Mesh(glintGeo, bladeEdgeMat);
  glint.position.set(0.03, 0.52, 0.0);
  knifeGroup.add(glint);

  rightArmGroup.add(knifeGroup);
  characterGroup.add(rightArmGroup);

  // Speech Bubble
  if (speechText) {
    const speechBubbleGroup = createSpeechBubbleGroup(speechText, '#3a3f52', '#090a0f');
    characterGroup.add(speechBubbleGroup);
  }

  // Lighting - High-visibility character lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(3, 6, 4.5);
  scene.add(keyLight);

  const frontFill = new THREE.DirectionalLight(0xffffff, 2.3);
  frontFill.position.set(0, 2.5, 5);
  scene.add(frontFill);

  const rimLight = new THREE.DirectionalLight(0x818cf8, 2.8);
  rimLight.position.set(-3.5, 3.5, -3);
  scene.add(rimLight);

  const rimSilver = new THREE.DirectionalLight(0xe0e7ff, 2.4);
  rimSilver.position.set(3.5, 3, -3.5);
  scene.add(rimSilver);

  const ghostGlow = new THREE.PointLight(0xa5b4fc, 4.0, 8.0);
  ghostGlow.position.set(0, 0.2, 1.8);
  scene.add(ghostGlow);

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    characterGroup.position.y = 0.03 + Math.sin(elapsedTime * 2.5) * 0.02;

    headGroup.rotation.y = Math.sin(elapsedTime * 0.9) * 0.15;
    headGroup.rotation.z = Math.cos(elapsedTime * 1.2) * 0.06;

    leftArmGroup.rotation.x = Math.sin(elapsedTime * 2.5) * 0.04;

    rightArmGroup.rotation.x = -0.5 + Math.sin(elapsedTime * 2.5) * 0.05;
    rightArmGroup.rotation.z = -0.15;

    rootGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.12;

    renderer.render(scene, camera);
  };

  animate();

  return {
    dispose: () => disposeScene(scene, renderer, animationFrameId),
    renderer,
    scene,
  };
}

/**
 * 3D Toon Michael Myers Scene
 * Mask with hollow dark eye sockets, dark anime hair clumps, navy blue mechanic suit,
 * and massive butcher knife.
 */
export function setupMichaelMyersScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = '...'
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

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
  renderer.toneMappingExposure = 1.75;
  renderer.setClearColor(0x000000, 0);

  const toonRampTexture = createToonRampTexture(['#64748b', '#94a3b8', '#e2e8f0', '#ffffff']);

  // Materials - Bright, ultra-legible mechanic jumpsuit tones visible on dark maps
  const maskMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonRampTexture });
  const hairMat = new THREE.MeshToonMaterial({ color: 0x6e503f, gradientMap: toonRampTexture });
  const jumpsuitMat = new THREE.MeshToonMaterial({ color: 0x5274a3, gradientMap: toonRampTexture });
  const bootMat = new THREE.MeshToonMaterial({ color: 0x435063, gradientMap: toonRampTexture });
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x050608 });
  const steelMat = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonRampTexture });
  const handleMat = new THREE.MeshToonMaterial({ color: 0x301e16, gradientMap: toonRampTexture });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const characterGroup = new THREE.Group();
  characterGroup.position.set(0, 0.04, 0);
  characterGroup.scale.set(1.18, 1.18, 1.18);
  rootGroup.add(characterGroup);

  // ---------------- HEAD GROUP ----------------
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.45;

  const headGeo = new THREE.BoxGeometry(0.85, 0.8, 0.8);
  const headMesh = new THREE.Mesh(headGeo, maskMat);
  headMesh.castShadow = true;
  headMesh.add(createOutline(headGeo));
  headGroup.add(headMesh);

  const chinGeo = new THREE.BoxGeometry(0.45, 0.2, 0.2);
  const chinMesh = new THREE.Mesh(chinGeo, maskMat);
  chinMesh.position.set(0, -0.35, 0.32);
  headGroup.add(chinMesh);

  const eyeGeo = new THREE.BoxGeometry(0.22, 0.16, 0.1);
  const leftEye = new THREE.Mesh(eyeGeo, voidMat);
  leftEye.position.set(-0.21, 0.05, 0.38);
  leftEye.rotation.z = -0.08;
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, voidMat);
  rightEye.position.set(0.21, 0.05, 0.38);
  rightEye.rotation.z = 0.08;
  headGroup.add(rightEye);

  const noseGeo = new THREE.BoxGeometry(0.08, 0.16, 0.12);
  const noseMesh = new THREE.Mesh(noseGeo, maskMat);
  noseMesh.position.set(0, -0.02, 0.42);
  headGroup.add(noseMesh);

  // Spiky Anime Hair Blocks
  const hairGroup = new THREE.Group();
  const hairMainGeo = new THREE.BoxGeometry(0.9, 0.35, 0.85);
  const hairMain = new THREE.Mesh(hairMainGeo, hairMat);
  hairMain.position.set(0, 0.32, -0.02);
  hairMain.add(createOutline(hairMainGeo));
  hairGroup.add(hairMain);

  const spikeCoords = [
    { s: [0.25, 0.35, 0.25], p: [-0.3, 0.45, 0.2], r: [0.2, -0.2, 0.1] },
    { s: [0.28, 0.4, 0.25], p: [0.0, 0.5, 0.25], r: [0.25, 0, 0] },
    { s: [0.25, 0.35, 0.25], p: [0.3, 0.45, 0.2], r: [0.2, 0.2, -0.1] },
    { s: [0.2, 0.3, 0.2], p: [-0.38, 0.35, -0.1], r: [0, 0, 0.3] },
    { s: [0.2, 0.3, 0.2], p: [0.38, 0.35, -0.1], r: [0, 0, -0.3] },
    { s: [0.3, 0.3, 0.25], p: [0.0, 0.42, -0.35], r: [-0.2, 0, 0] },
  ];
  spikeCoords.forEach((data) => {
    const spGeo = new THREE.BoxGeometry(data.s[0], data.s[1], data.s[2]);
    const spMesh = new THREE.Mesh(spGeo, hairMat);
    spMesh.position.set(data.p[0], data.p[1], data.p[2]);
    spMesh.rotation.set(data.r[0], data.r[1], data.r[2]);
    spMesh.add(createOutline(spGeo, 0.04));
    hairGroup.add(spMesh);
  });

  headGroup.add(hairGroup);
  characterGroup.add(headGroup);

  // ---------------- TORSO GROUP ----------------
  const torsoGroup = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(0.75, 0.75, 0.5);
  const bodyMesh = new THREE.Mesh(bodyGeo, jumpsuitMat);
  bodyMesh.position.y = 0.85;
  bodyMesh.castShadow = true;
  bodyMesh.add(createOutline(bodyGeo));
  torsoGroup.add(bodyMesh);

  const collarGeo = new THREE.BoxGeometry(0.2, 0.15, 0.1);
  const collarL = new THREE.Mesh(collarGeo, jumpsuitMat);
  collarL.position.set(-0.18, 1.22, 0.23);
  collarL.rotation.set(0.2, 0, -0.3);
  torsoGroup.add(collarL);

  const collarR = new THREE.Mesh(collarGeo, jumpsuitMat);
  collarR.position.set(0.18, 1.22, 0.23);
  collarR.rotation.set(0.2, 0, 0.3);
  torsoGroup.add(collarR);

  const pocketGeo = new THREE.BoxGeometry(0.2, 0.12, 0.04);
  const pocketL = new THREE.Mesh(pocketGeo, jumpsuitMat);
  pocketL.position.set(-0.2, 0.95, 0.26);
  pocketL.add(createOutline(pocketGeo, 0.03));
  torsoGroup.add(pocketL);

  const pocketR = new THREE.Mesh(pocketGeo, jumpsuitMat);
  pocketR.position.set(0.2, 0.95, 0.26);
  pocketR.add(createOutline(pocketGeo, 0.03));
  torsoGroup.add(pocketR);

  const beltGeo = new THREE.BoxGeometry(0.77, 0.12, 0.52);
  const beltMesh = new THREE.Mesh(beltGeo, bootMat);
  beltMesh.position.y = 0.48;
  beltMesh.add(createOutline(beltGeo, 0.03));
  torsoGroup.add(beltMesh);

  characterGroup.add(torsoGroup);

  // ---------------- LEGS & BOOTS ----------------
  const legGeo = new THREE.BoxGeometry(0.3, 0.32, 0.35);

  const legL = new THREE.Mesh(legGeo, jumpsuitMat);
  legL.position.set(-0.21, 0.3, 0);
  legL.add(createOutline(legGeo));
  characterGroup.add(legL);

  const legR = new THREE.Mesh(legGeo, jumpsuitMat);
  legR.position.set(0.21, 0.3, 0);
  legR.add(createOutline(legGeo));
  characterGroup.add(legR);

  const bootGeo = new THREE.BoxGeometry(0.32, 0.22, 0.45);
  const bootL = new THREE.Mesh(bootGeo, bootMat);
  bootL.position.set(-0.21, 0.11, 0.04);
  bootL.castShadow = true;
  bootL.add(createOutline(bootGeo));
  characterGroup.add(bootL);

  const bootR = new THREE.Mesh(bootGeo, bootMat);
  bootR.position.set(0.21, 0.11, 0.04);
  bootR.castShadow = true;
  bootR.add(createOutline(bootGeo));
  characterGroup.add(bootR);

  // ---------------- ARMS ----------------
  const armGeo = new THREE.BoxGeometry(0.24, 0.55, 0.26);

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.48, 1.15, 0);

  const armL = new THREE.Mesh(armGeo, jumpsuitMat);
  armL.position.y = -0.22;
  armL.add(createOutline(armGeo));
  leftArmGroup.add(armL);

  const handLGeo = new THREE.BoxGeometry(0.2, 0.18, 0.22);
  const handL = new THREE.Mesh(handLGeo, maskMat);
  handL.position.y = -0.52;
  handL.add(createOutline(handLGeo, 0.03));
  leftArmGroup.add(handL);

  characterGroup.add(leftArmGroup);

  // Right Arm with Knife
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.48, 1.15, 0);
  rightArmGroup.rotation.x = -0.45;
  rightArmGroup.rotation.z = -0.2;

  const armR = new THREE.Mesh(armGeo, jumpsuitMat);
  armR.position.y = -0.22;
  armR.add(createOutline(armGeo));
  rightArmGroup.add(armR);

  const handRGeo = new THREE.BoxGeometry(0.22, 0.2, 0.22);
  const handR = new THREE.Mesh(handRGeo, maskMat);
  handR.position.y = -0.52;
  handR.add(createOutline(handRGeo, 0.03));
  rightArmGroup.add(handR);

  // BUTCHER KNIFE
  const knifeGroup = new THREE.Group();
  knifeGroup.position.set(0, -0.55, 0.1);
  knifeGroup.rotation.x = 1.2;

  const handleGeo = new THREE.BoxGeometry(0.08, 0.28, 0.08);
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.y = -0.08;
  handle.add(createOutline(handleGeo, 0.03));
  knifeGroup.add(handle);

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.18, 0);
  bladeShape.lineTo(0.18, 0.7);
  bladeShape.lineTo(0.08, 0.95);
  bladeShape.lineTo(0, 0.85);
  bladeShape.closePath();

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  });
  const blade = new THREE.Mesh(bladeGeo, steelMat);
  blade.position.set(-0.09, 0.02, -0.01);
  blade.castShadow = true;
  blade.add(createOutline(bladeGeo, 0.025));
  knifeGroup.add(blade);

  const glintGeo = new THREE.BoxGeometry(0.02, 0.6, 0.025);
  const glint = new THREE.Mesh(glintGeo, glintMat);
  glint.position.set(0.04, 0.45, 0.01);
  knifeGroup.add(glint);

  rightArmGroup.add(knifeGroup);
  characterGroup.add(rightArmGroup);

  // Speech Bubble
  if (speechText) {
    const speechBubbleGroup = createSpeechBubbleGroup(speechText, '#223040', '#020204');
    characterGroup.add(speechBubbleGroup);
  }

  // Lighting - High-visibility character lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(3, 6, 4.5);
  scene.add(keyLight);

  const frontFill = new THREE.DirectionalLight(0xffffff, 2.3);
  frontFill.position.set(0, 2.5, 5);
  scene.add(frontFill);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
  rimLight.position.set(-3.5, 3, -3.5);
  scene.add(rimLight);

  const backLight = new THREE.DirectionalLight(0x93c5fd, 2.3);
  backLight.position.set(3.5, 2.5, -4);
  scene.add(backLight);

  const myersGlow = new THREE.PointLight(0x60a5fa, 3.8, 7.5);
  myersGlow.position.set(0, -0.1, 2.0);
  scene.add(myersGlow);

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    characterGroup.position.y = 0.04 + Math.sin(elapsedTime * 2.2) * 0.025;

    headGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.12;
    headGroup.rotation.z = Math.cos(elapsedTime * 1.1) * 0.05;

    rightArmGroup.rotation.x = -0.45 + Math.sin(elapsedTime * 2.2) * 0.03;
    leftArmGroup.rotation.x = Math.sin(elapsedTime * 2.2) * 0.03;

    rootGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.12;

    renderer.render(scene, camera);
  };

  animate();

  return {
    dispose: () => disposeScene(scene, renderer, animationFrameId),
    renderer,
    scene,
  };
}

/**
 * 3D Toon Freddy Krueger Scene
 * Fedora hat with brim and indented crease, burned scarred face with sinister grin and yellow pupils,
 * iconic dirty red & olive-green striped sweater, dark brown pants, worn boots,
 * and terrifying leather claw glove on right hand with brass plates and four razor-sharp curved steel blades.
 */
export function setupFreddyScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'DREAM!'
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

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
  renderer.toneMappingExposure = 1.75;
  renderer.setClearColor(0x000000, 0);

  const toonRampTexture = createToonRampTexture(['#78350f', '#b45309', '#fde68a', '#ffffff']);

  // Freddy Materials - High-visibility nightmare slasher tones
  const burnedSkinMat = new THREE.MeshToonMaterial({ color: 0xbe6955, gradientMap: toonRampTexture });
  const deepScarMat = new THREE.MeshToonMaterial({ color: 0x7c3527, gradientMap: toonRampTexture });
  const rawFleshMat = new THREE.MeshToonMaterial({ color: 0xc9493b, gradientMap: toonRampTexture });
  const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const teethMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x070302 });

  // Fedora Hat - Rich visible saddle brown
  const fedoraMat = new THREE.MeshToonMaterial({ color: 0x66442e, gradientMap: toonRampTexture });
  const hatBandMat = new THREE.MeshToonMaterial({ color: 0x2e1b12, gradientMap: toonRampTexture });

  // Iconic Striped Sweater (Vibrant Nightmare Red & Emerald Olive Green)
  const sweaterRedMat = new THREE.MeshToonMaterial({ color: 0xc53030, gradientMap: toonRampTexture });
  const sweaterGreenMat = new THREE.MeshToonMaterial({ color: 0x2d6a4f, gradientMap: toonRampTexture });

  // Pants & Boots - Readable warm trousers
  const pantsMat = new THREE.MeshToonMaterial({ color: 0x54473e, gradientMap: toonRampTexture });
  const bootMat = new THREE.MeshToonMaterial({ color: 0x3d3229, gradientMap: toonRampTexture });

  // Claw Glove - Burnished brass & mirror chrome steel blades
  const gloveLeatherMat = new THREE.MeshToonMaterial({ color: 0x7a4c28, gradientMap: toonRampTexture });
  const brassPlateMat = new THREE.MeshToonMaterial({ color: 0xdeaa40, gradientMap: toonRampTexture });
  const bladeSteelMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonRampTexture });
  const rivetMat = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonRampTexture });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const characterGroup = new THREE.Group();
  characterGroup.position.set(0, 0.04, 0);
  characterGroup.scale.set(1.16, 1.16, 1.16);
  rootGroup.add(characterGroup);

  // ---------------- HEAD & FEDORA ----------------
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.45;

  // Neck with burns
  const neckGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.3, 10);
  const neckMesh = new THREE.Mesh(neckGeo, burnedSkinMat);
  neckMesh.position.set(0, -0.38, 0);
  neckMesh.add(createOutline(neckGeo, 0.03));
  headGroup.add(neckMesh);

  // Head Base
  const headGeo = new THREE.BoxGeometry(0.74, 0.76, 0.68);
  const headMesh = new THREE.Mesh(headGeo, burnedSkinMat);
  headMesh.castShadow = true;
  headMesh.add(createOutline(headGeo, 0.035));
  headGroup.add(headMesh);

  // Charred tissue & deep burn scars across head
  const scarCoords = [
    { s: [0.24, 0.22, 0.12], p: [0.22, 0.12, 0.32] },
    { s: [0.26, 0.18, 0.12], p: [-0.2, 0.22, 0.31] },
    { s: [0.22, 0.15, 0.1], p: [0.18, -0.18, 0.32] },
    { s: [0.2, 0.14, 0.1], p: [-0.22, -0.15, 0.31] },
    { s: [0.18, 0.12, 0.08], p: [0, 0.26, 0.32] },
  ];
  scarCoords.forEach((sc, i) => {
    const sGeo = new THREE.BoxGeometry(sc.s[0], sc.s[1], sc.s[2]);
    const sMesh = new THREE.Mesh(sGeo, i % 2 === 0 ? deepScarMat : rawFleshMat);
    sMesh.position.set(sc.p[0], sc.p[1], sc.p[2]);
    headGroup.add(sMesh);
  });

  // Burned Ears
  const earGeo = new THREE.BoxGeometry(0.08, 0.16, 0.1);
  const earL = new THREE.Mesh(earGeo, deepScarMat);
  earL.position.set(-0.39, 0.02, -0.04);
  headGroup.add(earL);
  const earR = new THREE.Mesh(earGeo, deepScarMat);
  earR.position.set(0.39, 0.02, -0.04);
  headGroup.add(earR);

  // Eye Sockets & Sinister Yellow Eyes
  const eyeSocketGeo = new THREE.BoxGeometry(0.18, 0.15, 0.1);
  const leftSocket = new THREE.Mesh(eyeSocketGeo, voidMat);
  leftSocket.position.set(-0.17, 0.08, 0.32);
  headGroup.add(leftSocket);

  const rightSocket = new THREE.Mesh(eyeSocketGeo, voidMat);
  rightSocket.position.set(0.17, 0.08, 0.32);
  headGroup.add(rightSocket);

  const irisGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
  const leftIris = new THREE.Mesh(irisGeo, eyeIrisMat);
  leftIris.position.set(-0.17, 0.08, 0.35);
  headGroup.add(leftIris);

  const rightIris = new THREE.Mesh(irisGeo, eyeIrisMat);
  rightIris.position.set(0.17, 0.08, 0.35);
  headGroup.add(rightIris);

  // Sinister Grinning Mouth
  const mouthGeo = new THREE.BoxGeometry(0.36, 0.14, 0.08);
  const mouthMesh = new THREE.Mesh(mouthGeo, voidMat);
  mouthMesh.position.set(0, -0.22, 0.32);
  headGroup.add(mouthMesh);

  // Jagged Teeth
  [-0.11, -0.04, 0.04, 0.11].forEach((tx) => {
    const tGeo = new THREE.BoxGeometry(0.045, 0.06, 0.02);
    const toothTop = new THREE.Mesh(tGeo, teethMat);
    toothTop.position.set(tx, -0.2, 0.34);
    headGroup.add(toothTop);
  });

  // FEDORA HAT
  const fedoraGroup = new THREE.Group();
  fedoraGroup.position.set(0, 0.42, 0);
  fedoraGroup.rotation.x = -0.08;
  fedoraGroup.rotation.z = -0.06;

  // Hat Brim
  const brimGeo = new THREE.BoxGeometry(1.08, 0.06, 1.02);
  const brimMesh = new THREE.Mesh(brimGeo, fedoraMat);
  brimMesh.castShadow = true;
  brimMesh.add(createOutline(brimGeo, 0.03));
  fedoraGroup.add(brimMesh);

  // Hat Crown
  const crownGeo = new THREE.BoxGeometry(0.72, 0.38, 0.68);
  const crownMesh = new THREE.Mesh(crownGeo, fedoraMat);
  crownMesh.position.y = 0.2;
  crownMesh.castShadow = true;
  crownMesh.add(createOutline(crownGeo, 0.03));
  fedoraGroup.add(crownMesh);

  // Indented Top Crease
  const creaseGeo = new THREE.BoxGeometry(0.55, 0.1, 0.28);
  const creaseMesh = new THREE.Mesh(creaseGeo, fedoraMat);
  creaseMesh.position.set(0, 0.36, 0);
  fedoraGroup.add(creaseMesh);

  // Hat Ribbon Band
  const bandGeo = new THREE.BoxGeometry(0.76, 0.08, 0.72);
  const bandMesh = new THREE.Mesh(bandGeo, hatBandMat);
  bandMesh.position.y = 0.06;
  fedoraGroup.add(bandMesh);

  headGroup.add(fedoraGroup);
  characterGroup.add(headGroup);

  // ---------------- TORSO: STRIPED SWEATER ----------------
  const torsoGroup = new THREE.Group();

  const stripeData = [
    { y: 1.14, h: 0.14, m: sweaterRedMat },
    { y: 1.0, h: 0.14, m: sweaterGreenMat },
    { y: 0.86, h: 0.14, m: sweaterRedMat },
    { y: 0.72, h: 0.14, m: sweaterGreenMat },
    { y: 0.58, h: 0.14, m: sweaterRedMat },
    { y: 0.45, h: 0.12, m: sweaterGreenMat },
  ];

  stripeData.forEach((st) => {
    const sGeo = new THREE.BoxGeometry(0.76, st.h, 0.48);
    const sMesh = new THREE.Mesh(sGeo, st.m);
    sMesh.position.y = st.y;
    sMesh.castShadow = true;
    sMesh.add(createOutline(sGeo, 0.028));
    torsoGroup.add(sMesh);
  });

  // Tattered Sweater Hem Fringes
  [-0.24, -0.08, 0.08, 0.24].forEach((fx, idx) => {
    const fGeo = new THREE.BoxGeometry(0.12, 0.08, 0.06);
    const fMesh = new THREE.Mesh(fGeo, idx % 2 === 0 ? sweaterGreenMat : sweaterRedMat);
    fMesh.position.set(fx, 0.36, 0.22);
    torsoGroup.add(fMesh);
  });

  characterGroup.add(torsoGroup);

  // ---------------- LEGS & BOOTS ----------------
  const legGeo = new THREE.BoxGeometry(0.31, 0.34, 0.36);

  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.2, 0.28, 0);
  legL.castShadow = true;
  legL.add(createOutline(legGeo));
  characterGroup.add(legL);

  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.2, 0.28, 0);
  legR.castShadow = true;
  legR.add(createOutline(legGeo));
  characterGroup.add(legR);

  const bootGeo = new THREE.BoxGeometry(0.32, 0.22, 0.46);
  const bootL = new THREE.Mesh(bootGeo, bootMat);
  bootL.position.set(-0.2, 0.1, 0.04);
  bootL.castShadow = true;
  bootL.add(createOutline(bootGeo));
  characterGroup.add(bootL);

  const bootR = new THREE.Mesh(bootGeo, bootMat);
  bootR.position.set(0.2, 0.1, 0.04);
  bootR.castShadow = true;
  bootR.add(createOutline(bootGeo));
  characterGroup.add(bootR);

  // ---------------- LEFT ARM: STRIPED SLEEVE & SCARRED HAND ----------------
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.52, 1.15, 0);

  const lArmStripes = [
    { y: -0.08, h: 0.14, m: sweaterRedMat },
    { y: -0.22, h: 0.14, m: sweaterGreenMat },
    { y: -0.36, h: 0.14, m: sweaterRedMat },
    { y: -0.48, h: 0.12, m: sweaterGreenMat },
  ];
  lArmStripes.forEach((st) => {
    const aGeo = new THREE.BoxGeometry(0.24, st.h, 0.26);
    const aMesh = new THREE.Mesh(aGeo, st.m);
    aMesh.position.y = st.y;
    aMesh.add(createOutline(aGeo, 0.025));
    leftArmGroup.add(aMesh);
  });

  const handLGeo = new THREE.BoxGeometry(0.2, 0.18, 0.22);
  const handL = new THREE.Mesh(handLGeo, burnedSkinMat);
  handL.position.y = -0.62;
  handL.add(createOutline(handLGeo, 0.025));
  leftArmGroup.add(handL);

  [-0.06, -0.02, 0.02, 0.06].forEach((fx) => {
    const fGeo = new THREE.BoxGeometry(0.04, 0.12, 0.04);
    const finger = new THREE.Mesh(fGeo, deepScarMat);
    finger.position.set(fx, -0.72, 0.04);
    leftArmGroup.add(finger);
  });

  characterGroup.add(leftArmGroup);

  // ---------------- RIGHT ARM: THE ICONIC CLAW GLOVE ----------------
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.52, 1.15, 0);
  rightArmGroup.rotation.x = -0.55;
  rightArmGroup.rotation.z = -0.2;
  rightArmGroup.rotation.y = -0.15;

  const rArmStripes = [
    { y: -0.08, h: 0.14, m: sweaterRedMat },
    { y: -0.22, h: 0.14, m: sweaterGreenMat },
    { y: -0.36, h: 0.14, m: sweaterRedMat },
    { y: -0.48, h: 0.12, m: sweaterGreenMat },
  ];
  rArmStripes.forEach((st) => {
    const aGeo = new THREE.BoxGeometry(0.24, st.h, 0.26);
    const aMesh = new THREE.Mesh(aGeo, st.m);
    aMesh.position.y = st.y;
    aMesh.add(createOutline(aGeo, 0.025));
    rightArmGroup.add(aMesh);
  });

  const glovePalmGeo = new THREE.BoxGeometry(0.22, 0.2, 0.22);
  const glovePalm = new THREE.Mesh(glovePalmGeo, gloveLeatherMat);
  glovePalm.position.y = -0.62;
  glovePalm.add(createOutline(glovePalmGeo, 0.025));
  rightArmGroup.add(glovePalm);

  const backplateGeo = new THREE.BoxGeometry(0.18, 0.14, 0.04);
  const backplate = new THREE.Mesh(backplateGeo, brassPlateMat);
  backplate.position.set(0, -0.62, 0.12);
  backplate.add(createOutline(backplateGeo, 0.02));
  rightArmGroup.add(backplate);

  [-0.06, 0.06].forEach((rx) => {
    const rivGeo = new THREE.BoxGeometry(0.03, 0.03, 0.02);
    const riv = new THREE.Mesh(rivGeo, rivetMat);
    riv.position.set(rx, -0.58, 0.14);
    rightArmGroup.add(riv);
  });

  const clawFingersGroup = new THREE.Group();
  clawFingersGroup.position.set(0, -0.72, 0.05);

  const fingerSpecs = [
    { x: -0.075, bladeLen: 0.38, angle: -0.08 },
    { x: -0.025, bladeLen: 0.46, angle: -0.02 },
    { x: 0.025, bladeLen: 0.48, angle: 0.02 },
    { x: 0.075, bladeLen: 0.42, angle: 0.08 },
  ];

  fingerSpecs.forEach((f) => {
    const fArmatureGroup = new THREE.Group();
    fArmatureGroup.position.x = f.x;
    fArmatureGroup.rotation.z = f.angle;

    const sleeveGeo = new THREE.BoxGeometry(0.045, 0.12, 0.05);
    const sleeve = new THREE.Mesh(sleeveGeo, brassPlateMat);
    sleeve.position.y = -0.04;
    sleeve.add(createOutline(sleeveGeo, 0.015));
    fArmatureGroup.add(sleeve);

    const knuckRivet = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.02), rivetMat);
    knuckRivet.position.set(0, -0.02, 0.03);
    fArmatureGroup.add(knuckRivet);

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.03, -0.06);
    bladeShape.lineTo(0.025, -f.bladeLen * 0.7);
    bladeShape.lineTo(0.005, -f.bladeLen);
    bladeShape.lineTo(0, -f.bladeLen * 0.9);
    bladeShape.lineTo(-0.015, -0.06);
    bladeShape.closePath();

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.015,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.005,
    });

    const blade = new THREE.Mesh(bladeGeo, bladeSteelMat);
    blade.position.set(-0.01, -0.08, 0.02);
    blade.rotation.x = 0.25;
    blade.castShadow = true;
    blade.add(createOutline(bladeGeo, 0.018));
    fArmatureGroup.add(blade);

    const glintGeo = new THREE.BoxGeometry(0.012, f.bladeLen * 0.6, 0.015);
    const glint = new THREE.Mesh(glintGeo, glintMat);
    glint.position.set(0.01, -f.bladeLen * 0.45, 0.03);
    fArmatureGroup.add(glint);

    clawFingersGroup.add(fArmatureGroup);
  });

  rightArmGroup.add(clawFingersGroup);
  characterGroup.add(rightArmGroup);

  // Speech Bubble
  if (speechText) {
    const speechBubbleGroup = createSpeechBubbleGroup(speechText, '#7a1e1e', '#1a0505');
    characterGroup.add(speechBubbleGroup);
  }

  // BOILER ROOM LIGHTING - High-visibility nightmare lighting
  const ambientLight = new THREE.AmbientLight(0xfff7ed, 2.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffedd5, 2.5);
  keyLight.position.set(3, 6, 4.5);
  scene.add(keyLight);

  const frontFill = new THREE.DirectionalLight(0xffffff, 2.3);
  frontFill.position.set(0, 2.5, 5);
  scene.add(frontFill);

  const greenRim = new THREE.DirectionalLight(0x34d399, 2.6);
  greenRim.position.set(-3.5, 3, -3.5);
  scene.add(greenRim);

  const flameRim = new THREE.DirectionalLight(0xf87171, 2.4);
  flameRim.position.set(3.5, 3, -3.5);
  scene.add(flameRim);

  const furnaceLight = new THREE.PointLight(0xff5500, 4.0, 8.0);
  furnaceLight.position.set(0, -0.1, 2.0);
  scene.add(furnaceLight);

  const clock = new THREE.Clock();
  let animationFrameId: number;

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    characterGroup.position.y = 0.04 + Math.sin(elapsedTime * 2.2) * 0.025;

    headGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.14;
    headGroup.rotation.z = Math.cos(elapsedTime * 1.1) * 0.07;

    rightArmGroup.rotation.x = -0.55 + Math.sin(elapsedTime * 2.0) * 0.06;
    rightArmGroup.rotation.z = -0.2 + Math.cos(elapsedTime * 1.5) * 0.04;
    clawFingersGroup.rotation.x = Math.sin(elapsedTime * 3.5) * 0.12;

    leftArmGroup.rotation.x = Math.sin(elapsedTime * 2.2) * 0.04;

    furnaceLight.intensity = 2.6 + Math.sin(elapsedTime * 14.0) * 0.5 + Math.cos(elapsedTime * 23.0) * 0.3;

    rootGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.12;

    renderer.render(scene, camera);
  };

  animate();

  return {
    dispose: () => disposeScene(scene, renderer, animationFrameId),
    renderer,
    scene,
  };
}
