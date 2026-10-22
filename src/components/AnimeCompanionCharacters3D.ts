import * as THREE from 'three';

// Outline helper matching toon anime aesthetic
function createOutlinedMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  outlineThickness: number = 0.04,
  outlineColor: number = 0x090d16
): THREE.Group {
  const group = new THREE.Group();

  const mainMesh = new THREE.Mesh(geometry, material);
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  group.add(mainMesh);

  const outlineMat = new THREE.MeshBasicMaterial({
    color: outlineColor,
    side: THREE.BackSide,
  });
  const outlineMesh = new THREE.Mesh(geometry, outlineMat);
  outlineMesh.scale.set(1 + outlineThickness, 1 + outlineThickness, 1 + outlineThickness);
  group.add(outlineMesh);

  return group;
}

// Floating Speech Bubble for Characters - disabled per user request
function createSpeechBubbleSprite(_text: string, _bgColor: string, _textColor: string, _borderColor: string) {
  const group = new THREE.Group();
  group.visible = false;
  return group as unknown as THREE.Sprite;
}


// Interactive Mouse/Touch Rotation Hookup
function attachDragControls(canvas: HTMLCanvasElement, targetGroup: THREE.Group) {
  let isDragging = false;
  let previousX = 0;

  const onDown = (clientX: number) => {
    isDragging = true;
    previousX = clientX;
  };
  const onMove = (clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - previousX;
    targetGroup.rotation.y += deltaX * 0.015;
    previousX = clientX;
  };
  const onUp = () => {
    isDragging = false;
  };

  const handleMouseDown = (e: MouseEvent) => onDown(e.clientX);
  const handleMouseMove = (e: MouseEvent) => onMove(e.clientX);
  const handleMouseUp = () => onUp();

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) onDown(e.touches[0].clientX);
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) onMove(e.touches[0].clientX);
  };
  const handleTouchEnd = () => onUp();

  canvas.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchend', handleTouchEnd);

  return () => {
    canvas.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    canvas.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  };
}

function cleanUpScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer, animId: number) {
  cancelAnimationFrame(animId);
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
}

/**
 * 1. CYBER SOCCER GIRL & AKITA INU
 * Vibrant pink twin tails, purple dress, glowing cyber tattoos & Akita Inu on leash.
 */
export function setupCyberSoccerGirlScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'GOAL!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xfde047, 2.4);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x0284c7, 1.4);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.42, 0.42, 0.42);
  rootGroup.position.set(0.1, 0.8, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.55 }); // Blue anime skin
  const dressTopMat = new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.4 });
  const dressSkirtMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.4 });
  const socksMat = new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.5 });
  const bootsMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.4 });
  const tattooGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const tattooAccentMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
  const animeEyeBgMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const animeEyeColorMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const animeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyebrowMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

  const characterGroup = new THREE.Group();
  rootGroup.add(characterGroup);

  // Torso
  const torsoGroup = new THREE.Group();
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.6, 1.1), dressTopMat);
  torsoGroup.add(torsoMesh);

  const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.65, 1.15), redMat);
  stripe1.position.set(0.55, 0, 0);
  torsoGroup.add(stripe1);

  const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.65, 1.15), whiteMat);
  stripe2.position.set(-0.55, 0, 0);
  torsoGroup.add(stripe2);

  const skirtMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.7, 1.3), dressSkirtMat);
  skirtMesh.position.set(0, -1.0, 0);
  torsoGroup.add(skirtMesh);

  torsoGroup.position.y = 0.6;
  characterGroup.add(torsoGroup);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), skinMat);
  neck.position.set(0, 1.52, 0);
  characterGroup.add(neck);

  // Head
  const headGroup = new THREE.Group();
  const headGeo = new THREE.BoxGeometry(2.1, 2.1, 2.1);
  const headMesh = createOutlinedMesh(headGeo, skinMat, 0.04);
  headGroup.add(headMesh);

  const createHairSpike = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number) => {
    const spike = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), hairMat);
    spike.position.set(x, y, z);
    spike.rotation.set(rx, ry, rz);
    headGroup.add(spike);
  };

  createHairSpike(0, 1.25, 0.25, 2.2, 0.8, 1.5, 0.2, 0, 0);
  createHairSpike(0.9, 0.7, -0.25, 0.8, 1.3, 0.8, 0, 0.5, -0.5);
  createHairSpike(-0.9, 0.7, -0.25, 0.8, 1.3, 0.8, 0, -0.5, 0.5);
  createHairSpike(1.4, 0.3, -0.4, 0.8, 2.2, 0.8, -0.2, 0.4, -0.4);
  createHairSpike(-1.4, 0.3, -0.4, 0.8, 2.2, 0.8, -0.2, -0.4, 0.4);
  createHairSpike(1.25, 0.5, 0.4, 0.8, 2.4, 0.95, 0.05, 0.2, -0.2);
  createHairSpike(-1.25, 0.5, 0.4, 0.8, 2.4, 0.95, 0.05, -0.2, 0.2);
  createHairSpike(1.35, -0.5, 0.1, 0.8, 2.6, 0.95, 0.15, 0.3, -0.3);
  createHairSpike(-1.35, -0.5, 0.1, 0.8, 2.6, 0.95, 0.15, -0.3, 0.3);
  createHairSpike(0, 0.5, -0.85, 2.1, 1.4, 0.9, -0.25, 0, 0);
  createHairSpike(0, -0.3, -0.9, 2.0, 2.2, 0.95, -0.3, 0, 0);
  createHairSpike(0, -1.3, -0.75, 1.8, 2.2, 0.85, -0.35, 0, 0);

  const createAnimeEye = (xPos: number) => {
    const eyeGroup = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.08), animeEyeBgMat);
    eyeGroup.add(bg);
    const iris = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.1), animeEyeColorMat);
    iris.position.set(0, -0.05, 0.02);
    eyeGroup.add(iris);
    const shine1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.12), animeHighlightMat);
    shine1.position.set(0.1, 0.18, 0.04);
    eyeGroup.add(shine1);
    const shine2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), animeHighlightMat);
    shine2.position.set(-0.1, -0.2, 0.04);
    eyeGroup.add(shine2);
    eyeGroup.position.set(xPos, 0.2, 1.1);
    return eyeGroup;
  };

  headGroup.add(createAnimeEye(0.52));
  headGroup.add(createAnimeEye(-0.52));

  const createEyebrow = (xPos: number, isRight: boolean) => {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.08), eyebrowMat);
    brow.position.set(xPos, 0.72, 1.11);
    brow.rotation.z = isRight ? 0.12 : -0.12;
    return brow;
  };
  headGroup.add(createEyebrow(0.52, false));
  headGroup.add(createEyebrow(-0.52, true));

  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.1), animeEyeBgMat);
  smile.position.set(0, -0.63, 1.11);
  headGroup.add(smile);

  headGroup.position.set(0, 2.5, 0);
  characterGroup.add(headGroup);

  // Arms (short-sleeved purple jersey dress with bare blue skin arms & glowing cyber tattoos)
  const sleeveGeo = new THREE.BoxGeometry(0.76, 0.55, 0.76);
  const bareArmGeo = new THREE.BoxGeometry(0.68, 1.15, 0.68);

  const leftArmGroup = new THREE.Group();
  const leftSleeve = createOutlinedMesh(sleeveGeo, dressTopMat, 0.04);
  leftSleeve.position.y = -0.3;
  leftArmGroup.add(leftSleeve);
  const leftBareArm = new THREE.Mesh(bareArmGeo, skinMat);
  leftBareArm.position.y = -0.85;
  leftArmGroup.add(leftBareArm);
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.75), skinMat);
  leftHand.position.y = -1.35;
  leftArmGroup.add(leftHand);

  const tat1 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.72), tattooGlowMat);
  tat1.position.set(0, -0.95, 0);
  leftArmGroup.add(tat1);

  leftArmGroup.position.set(1.45, 1.4, 0);
  characterGroup.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  const rightSleeve = createOutlinedMesh(sleeveGeo, dressTopMat, 0.04);
  rightSleeve.position.y = -0.3;
  rightArmGroup.add(rightSleeve);
  const rightBareArm = new THREE.Mesh(bareArmGeo, skinMat);
  rightBareArm.position.y = -0.85;
  rightArmGroup.add(rightBareArm);
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.75), skinMat);
  rightHand.position.y = -1.35;
  rightArmGroup.add(rightHand);

  const rightTat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.72), tattooGlowMat);
  rightTat.position.set(0, -0.9, 0);
  rightArmGroup.add(rightTat);

  rightArmGroup.position.set(-1.45, 1.4, 0);
  characterGroup.add(rightArmGroup);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.8, 1.6, 0.8);
  const leftLegGroup = new THREE.Group();
  const leftLegMesh = new THREE.Mesh(legGeo, skinMat);
  leftLegMesh.position.y = -0.8;
  leftLegGroup.add(leftLegMesh);
  const leftSock = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.95, 0.82), socksMat);
  leftSock.position.y = -1.1;
  leftLegGroup.add(leftSock);
  const leftBoot = createOutlinedMesh(new THREE.BoxGeometry(0.95, 0.55, 1.2), bootsMat, 0.04);
  leftBoot.position.set(0, -1.75, 0.1);
  leftLegGroup.add(leftBoot);
  leftLegGroup.position.set(0.55, -0.4, 0);
  characterGroup.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  const rightLegMesh = new THREE.Mesh(legGeo, skinMat);
  rightLegMesh.position.y = -0.8;
  rightLegGroup.add(rightLegMesh);
  const rightSock = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.95, 0.82), socksMat);
  rightSock.position.y = -1.1;
  rightLegGroup.add(rightSock);
  const rightBoot = createOutlinedMesh(new THREE.BoxGeometry(0.95, 0.55, 1.2), bootsMat, 0.04);
  rightBoot.position.set(0, -1.75, 0.1);
  rightLegGroup.add(rightBoot);
  rightLegGroup.position.set(-0.55, -0.4, 0);
  characterGroup.add(rightLegGroup);

  characterGroup.position.set(0.8, 0.2, 0);

  // Akita Dog
  const akitaWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
  const akitaTanMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
  const dogGroup = new THREE.Group();

  const dogBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 1.8), akitaWhiteMat);
  dogGroup.add(dogBody);
  const backPatch = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.6, 1.2), akitaTanMat);
  backPatch.position.set(0, 0.25, -0.1);
  dogGroup.add(backPatch);

  const dogHeadGroup = new THREE.Group();
  const headDog = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.1), akitaWhiteMat);
  dogHeadGroup.add(headDog);
  const headPatch = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.5, 0.7), akitaTanMat);
  headPatch.position.set(0, 0.3, -0.15);
  dogHeadGroup.add(headPatch);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), akitaWhiteMat);
  snout.position.set(0, -0.15, 0.6);
  dogHeadGroup.add(snout);

  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 4), akitaTanMat);
  earL.position.set(0.38, 0.85, -0.05);
  earL.rotation.z = -0.15;
  dogHeadGroup.add(earL);

  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 4), akitaTanMat);
  earR.position.set(-0.38, 0.85, -0.05);
  earR.rotation.z = 0.15;
  dogHeadGroup.add(earR);

  dogHeadGroup.position.set(0, 0.65, 0.95);
  dogGroup.add(dogHeadGroup);

  const dogTailGroup = new THREE.Group();
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), akitaTanMat);
  tail.position.set(0, 0.45, 0);
  dogTailGroup.add(tail);
  dogTailGroup.position.set(0, 0.45, -0.9);
  dogTailGroup.rotation.x = -0.5;
  dogTailGroup.rotation.z = 0.3;
  dogGroup.add(dogTailGroup);

  const dogLegGeo = new THREE.BoxGeometry(0.38, 0.8, 0.38);
  [-0.45, 0.45].forEach((x) => {
    [0.5, -0.5].forEach((z) => {
      const leg = new THREE.Mesh(dogLegGeo, akitaWhiteMat);
      leg.position.set(x, -0.8, z);
      dogGroup.add(leg);
    });
  });

  dogGroup.position.set(-1.8, -1.25, 0.8);
  dogGroup.rotation.y = 0.4;
  rootGroup.add(dogGroup);

  // Curved Leash
  const leashMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 });
  const startPt = new THREE.Vector3(0.8 - 1.45, 0.2 + 1.4 - 1.35, 0);
  const endPt = new THREE.Vector3(-1.8, -1.25 + 0.65, 0.8 + 0.95);
  const midPt = new THREE.Vector3().addVectors(startPt, endPt).multiplyScalar(0.5);
  midPt.y -= 0.6;
  const curve = new THREE.QuadraticBezierCurve3(startPt, midPt, endPt);
  const leashMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.06, 6, false), leashMat);
  rootGroup.add(leashMesh);

  // Speech bubble
  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#7e22ce', '#ffffff', '#ec4899');
    bubble.position.set(0.6, 2.5, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    torsoGroup.position.y = 0.6 + Math.sin(elapsed * 2.5) * 0.04;
    headGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.08;
    headGroup.rotation.z = Math.cos(elapsed * 1.8) * 0.03;

    leftArmGroup.rotation.x = 0.15 + Math.sin(elapsed * 2.0) * 0.05;
    leftArmGroup.rotation.z = 0.08;
    rightArmGroup.rotation.x = 0.15;
    rightArmGroup.rotation.z = -0.08;

    dogGroup.position.y = -1.25 + Math.sin(elapsed * 3.0) * 0.03;
    dogTailGroup.rotation.z = 0.3 + Math.sin(elapsed * 12.0) * 0.2;
    dogHeadGroup.rotation.y = Math.sin(elapsed * 2.0) * 0.1;

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}

/**
 * 2. CYBER SOCCER PLAYER & SHIBA INU
 * Soccer green jersey, spiky hair, tan & cream Shiba Inu on curved leash.
 */
export function setupCyberSoccerBoyScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'STRIKE!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xfde047, 2.4);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x0284c7, 1.4);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.42, 0.42, 0.42);
  rootGroup.position.set(0.1, 0.8, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.55 }); // Red anime skin
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const socksMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
  const bootsMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const darkHairMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
  const animeEyeBgMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const animeEyeColorMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
  const animeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyebrowMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

  const characterGroup = new THREE.Group();
  rootGroup.add(characterGroup);

  // Torso
  const torsoGroup = new THREE.Group();
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.1, 1.2), shirtMat);
  torsoGroup.add(torsoMesh);

  const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.15, 1.25), redMat);
  stripe1.position.set(0.6, 0, 0);
  torsoGroup.add(stripe1);

  const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.15, 1.25), whiteMat);
  stripe2.position.set(-0.6, 0, 0);
  torsoGroup.add(stripe2);

  torsoGroup.position.y = 0.4;
  characterGroup.add(torsoGroup);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), skinMat);
  neck.position.set(0, 1.32, 0);
  characterGroup.add(neck);

  // Head
  const headGroup = new THREE.Group();
  const headGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
  const headMesh = createOutlinedMesh(headGeo, skinMat, 0.04);
  headGroup.add(headMesh);

  const createHairSpike = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number) => {
    const spike = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), darkHairMat);
    spike.position.set(x, y, z);
    spike.rotation.set(rx, ry, rz);
    headGroup.add(spike);
  };

  createHairSpike(0, 1.3, 0.15, 2.3, 0.9, 1.6, 0.2, 0, 0);
  createHairSpike(0.9, 0.8, -0.35, 0.9, 1.4, 0.9, 0, 0.5, -0.5);
  createHairSpike(-0.9, 0.8, -0.35, 0.9, 1.4, 0.9, 0, -0.5, 0.5);
  createHairSpike(1.1, 1.1, 0.25, 0.8, 1.2, 0.9, 0.2, 0.5, -0.3);
  createHairSpike(-1.1, 1.1, 0.25, 0.8, 1.2, 0.9, 0.2, -0.5, 0.3);
  createHairSpike(0, 0.5, -1.0, 2.2, 1.5, 1.0, -0.25, 0, 0);
  createHairSpike(0.8, 0.2, -0.9, 1.0, 1.4, 1.0, -0.3, 0.3, -0.3);
  createHairSpike(-0.8, 0.2, -0.9, 1.0, 1.4, 1.0, -0.3, -0.3, 0.3);

  const createAnimeEye = (xPos: number) => {
    const eyeGroup = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.08), animeEyeBgMat);
    eyeGroup.add(bg);
    const iris = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.1), animeEyeColorMat);
    iris.position.set(0, -0.05, 0.02);
    eyeGroup.add(iris);
    const shine1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.12), animeHighlightMat);
    shine1.position.set(0.1, 0.18, 0.04);
    eyeGroup.add(shine1);
    eyeGroup.position.set(xPos, 0.2, 1.12);
    return eyeGroup;
  };
  headGroup.add(createAnimeEye(0.55));
  headGroup.add(createAnimeEye(-0.55));

  const createEyebrow = (xPos: number, isRight: boolean) => {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.08), eyebrowMat);
    brow.position.set(xPos, 0.75, 1.13);
    brow.rotation.z = isRight ? -0.15 : 0.15;
    return brow;
  };
  headGroup.add(createEyebrow(0.55, false));
  headGroup.add(createEyebrow(-0.55, true));

  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.1), animeEyeBgMat);
  smile.position.set(0, -0.65, 1.13);
  headGroup.add(smile);

  headGroup.position.set(0, 2.3, 0);
  characterGroup.add(headGroup);

  // Arms (short-sleeved striker jersey with bare red skin arms & red hands)
  const sleeveGeo = new THREE.BoxGeometry(0.86, 0.6, 0.86);
  const bareArmGeo = new THREE.BoxGeometry(0.78, 1.2, 0.78);

  const leftArmGroup = new THREE.Group();
  const leftSleeve = createOutlinedMesh(sleeveGeo, shirtMat, 0.04);
  leftSleeve.position.y = -0.3;
  leftArmGroup.add(leftSleeve);
  const leftBareArm = new THREE.Mesh(bareArmGeo, skinMat);
  leftBareArm.position.y = -0.9;
  leftArmGroup.add(leftBareArm);
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), skinMat);
  leftHand.position.y = -1.4;
  leftArmGroup.add(leftHand);
  leftArmGroup.position.set(1.55, 1.3, 0);
  characterGroup.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  const rightSleeve = createOutlinedMesh(sleeveGeo, shirtMat, 0.04);
  rightSleeve.position.y = -0.3;
  rightArmGroup.add(rightSleeve);
  const rightBareArm = new THREE.Mesh(bareArmGeo, skinMat);
  rightBareArm.position.y = -0.9;
  rightArmGroup.add(rightBareArm);
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), skinMat);
  rightHand.position.y = -1.4;
  rightArmGroup.add(rightHand);
  rightArmGroup.position.set(-1.55, 1.3, 0);
  characterGroup.add(rightArmGroup);

  // Legs (white soccer shorts with bare red skin knees/thighs and green socks)
  const legSkinGeo = new THREE.BoxGeometry(0.86, 1.3, 0.86);
  const shortsGeo = new THREE.BoxGeometry(0.98, 0.6, 0.98);

  const leftLegGroup = new THREE.Group();
  const leftShorts = new THREE.Mesh(shortsGeo, shortsMat);
  leftShorts.position.y = -0.35;
  leftLegGroup.add(leftShorts);
  const leftLegSkin = new THREE.Mesh(legSkinGeo, skinMat);
  leftLegSkin.position.y = -0.85;
  leftLegGroup.add(leftLegSkin);
  const leftSock = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.85, 0.92), socksMat);
  leftSock.position.y = -1.35;
  leftLegGroup.add(leftSock);
  const leftBoot = createOutlinedMesh(new THREE.BoxGeometry(1.05, 0.6, 1.3), bootsMat, 0.04);
  leftBoot.position.set(0, -1.85, 0.1);
  leftLegGroup.add(leftBoot);
  leftLegGroup.position.set(0.6, -0.6, 0);
  characterGroup.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  const rightShorts = new THREE.Mesh(shortsGeo, shortsMat);
  rightShorts.position.y = -0.35;
  rightLegGroup.add(rightShorts);
  const rightLegSkin = new THREE.Mesh(legSkinGeo, skinMat);
  rightLegSkin.position.y = -0.85;
  rightLegGroup.add(rightLegSkin);
  const rightSock = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.85, 0.92), socksMat);
  rightSock.position.y = -1.35;
  rightLegGroup.add(rightSock);
  const rightBoot = createOutlinedMesh(new THREE.BoxGeometry(1.05, 0.6, 1.3), bootsMat, 0.04);
  rightBoot.position.set(0, -1.85, 0.1);
  rightLegGroup.add(rightBoot);
  rightLegGroup.position.set(-0.6, -0.6, 0);
  characterGroup.add(rightLegGroup);

  characterGroup.position.set(0.8, 0.2, 0);

  // Shiba Inu Dog
  const shibaOrangeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
  const shibaCreamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
  const dogGroup = new THREE.Group();

  const dogBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.6), shibaOrangeMat);
  dogGroup.add(dogBody);
  const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.6), shibaCreamMat);
  chestMesh.position.set(0, -0.1, 0.55);
  dogGroup.add(chestMesh);

  const dogHeadGroup = new THREE.Group();
  const headDog = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.0), shibaOrangeMat);
  dogHeadGroup.add(headDog);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.55), shibaCreamMat);
  snout.position.set(0, -0.15, 0.55);
  dogHeadGroup.add(snout);

  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 4), shibaOrangeMat);
  earL.position.set(0.35, 0.75, 0);
  earL.rotation.z = -0.2;
  dogHeadGroup.add(earL);

  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 4), shibaOrangeMat);
  earR.position.set(-0.35, 0.75, 0);
  earR.rotation.z = 0.2;
  dogHeadGroup.add(earR);

  dogHeadGroup.position.set(0, 0.6, 0.85);
  dogGroup.add(dogHeadGroup);

  const dogTailGroup = new THREE.Group();
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), shibaOrangeMat);
  tail.position.set(0, 0.4, 0);
  dogTailGroup.add(tail);
  dogTailGroup.position.set(0, 0.35, -0.8);
  dogTailGroup.rotation.x = -0.7;
  dogTailGroup.rotation.z = 0.2;
  dogGroup.add(dogTailGroup);

  const dogLegGeo = new THREE.BoxGeometry(0.32, 0.75, 0.32);
  [-0.4, 0.4].forEach((x) => {
    [0.45, -0.45].forEach((z) => {
      const leg = new THREE.Mesh(dogLegGeo, shibaCreamMat);
      leg.position.set(x, -0.75, z);
      dogGroup.add(leg);
    });
  });

  dogGroup.position.set(-1.8, -1.25, 0.8);
  dogGroup.rotation.y = 0.4;
  rootGroup.add(dogGroup);

  // Leash
  const leashMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 });
  const startPt = new THREE.Vector3(0.8 - 1.55, 0.2 + 1.3 - 1.4, 0);
  const endPt = new THREE.Vector3(-1.8, -1.25 + 0.6, 0.8 + 0.85);
  const midPt = new THREE.Vector3().addVectors(startPt, endPt).multiplyScalar(0.5);
  midPt.y -= 0.6;
  const curve = new THREE.QuadraticBezierCurve3(startPt, midPt, endPt);
  const leashMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.06, 6, false), leashMat);
  rootGroup.add(leashMesh);

  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#15803d', '#ffffff', '#22c55e');
    bubble.position.set(0.6, 2.5, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    torsoGroup.position.y = 0.4 + Math.sin(elapsed * 2.5) * 0.04;
    headGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.08;
    headGroup.rotation.z = Math.cos(elapsed * 1.8) * 0.03;

    leftArmGroup.rotation.x = 0.15;
    leftArmGroup.rotation.z = 0.08;
    rightArmGroup.rotation.x = 0.15;
    rightArmGroup.rotation.z = -0.08;

    dogGroup.position.y = -1.25 + Math.sin(elapsed * 3.0) * 0.03;
    dogTailGroup.rotation.z = 0.2 + Math.sin(elapsed * 14.0) * 0.25;
    dogHeadGroup.rotation.y = Math.sin(elapsed * 2.2) * 0.12;

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}

/**
 * 3. ANIME GIRL WITH PURPLE SKIN & GRAY CAT
 * Lavender purple skin, violet skirt, golden chest gem, and playful gray cat.
 */
export function setupPurpleAnimeGirlScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'MEOW!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xf43f5e, 2.0);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xa855f7, 1.4);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.42, 0.42, 0.42);
  rootGroup.position.set(0.1, 0.8, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd8b4fe, roughness: 0.6 });
  const dressTopMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.5 });
  const dressSkirtMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.5 });
  const bootsMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.5 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xd946ef, roughness: 0.4 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 });

  const characterGroup = new THREE.Group();
  rootGroup.add(characterGroup);

  // Torso
  const torsoGroup = new THREE.Group();
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.0, 1.1), dressTopMat);
  torsoGroup.add(torsoMesh);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 1.3), accentMat);
  collar.position.set(0, 0.85, 0);
  torsoGroup.add(collar);

  const gem = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.2), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
  gem.position.set(0, 0.4, 0.58);
  torsoGroup.add(gem);

  const skirtMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 1.45), dressSkirtMat);
  skirtMesh.position.set(0, -1.1, 0);
  torsoGroup.add(skirtMesh);

  torsoGroup.position.y = 0.4;
  characterGroup.add(torsoGroup);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), skinMat);
  neck.position.set(0, 1.32, 0);
  characterGroup.add(neck);

  // Head
  const headGroup = new THREE.Group();
  const headGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
  const headMesh = createOutlinedMesh(headGeo, skinMat, 0.04);
  headGroup.add(headMesh);

  const hairBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.3, 2.3), hairMat);
  hairBase.position.set(0, 0.1, -0.1);
  headGroup.add(hairBase);

  const bangs = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.4), hairMat);
  bangs.position.set(0, 0.9, 1.0);
  headGroup.add(bangs);

  [-1.1, 1.1].forEach((x) => {
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), hairMat);
    lock.position.set(x, -0.5, 0.95);
    headGroup.add(lock);
  });

  const eyeBgMat = new THREE.MeshBasicMaterial({ color: 0x030712 });
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const createBlackEye = (xPos: number) => {
    const eyeGroup = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.08), eyeBgMat);
    eyeGroup.add(bg);
    const shine1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.12), shineMat);
    shine1.position.set(0.1, 0.18, 0.04);
    eyeGroup.add(shine1);
    eyeGroup.position.set(xPos, 0.2, 1.12);
    return eyeGroup;
  };
  headGroup.add(createBlackEye(0.55));
  headGroup.add(createBlackEye(-0.55));

  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0x581c87 }));
  smile.position.set(0, -0.45, 1.13);
  headGroup.add(smile);

  headGroup.position.set(0, 2.3, 0);
  characterGroup.add(headGroup);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.7, 1.7, 0.7);
  const leftArmGroup = new THREE.Group();
  const leftArmMesh = createOutlinedMesh(armGeo, dressTopMat, 0.04);
  leftArmMesh.position.y = -0.7;
  leftArmGroup.add(leftArmMesh);
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.75), skinMat);
  leftHand.position.y = -1.4;
  leftArmGroup.add(leftHand);
  leftArmGroup.position.set(1.45, 1.3, 0);
  characterGroup.add(leftArmGroup);

  // Right Arm (Waving hello)
  const rightArmGroup = new THREE.Group();
  const rightArmMesh = createOutlinedMesh(armGeo, dressTopMat, 0.04);
  rightArmMesh.position.y = -0.7;
  rightArmGroup.add(rightArmMesh);
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.75), skinMat);
  rightHand.position.y = -1.4;
  rightArmGroup.add(rightHand);
  rightArmGroup.position.set(-1.45, 1.3, 0);
  characterGroup.add(rightArmGroup);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.85, 1.7, 0.85);
  const leftLegGroup = new THREE.Group();
  const leftLegMesh = new THREE.Mesh(legGeo, skinMat);
  leftLegMesh.position.y = -0.85;
  leftLegGroup.add(leftLegMesh);
  const leftBoot = createOutlinedMesh(new THREE.BoxGeometry(0.95, 0.7, 1.1), bootsMat, 0.04);
  leftBoot.position.set(0, -1.75, 0.1);
  leftLegGroup.add(leftBoot);
  leftLegGroup.position.set(0.55, -1.0, 0);
  characterGroup.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  const rightLegMesh = new THREE.Mesh(legGeo, skinMat);
  rightLegMesh.position.y = -0.85;
  rightLegGroup.add(rightLegMesh);
  const rightBoot = createOutlinedMesh(new THREE.BoxGeometry(0.95, 0.7, 1.1), bootsMat, 0.04);
  rightBoot.position.set(0, -1.75, 0.1);
  rightLegGroup.add(rightBoot);
  rightLegGroup.position.set(-0.55, -1.0, 0);
  characterGroup.add(rightLegGroup);

  characterGroup.position.set(0.8, 0.2, 0);

  // Gray Cat
  const catFurMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
  const catEyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const catGroup = new THREE.Group();

  const catBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.4), catFurMat);
  catGroup.add(catBody);

  const catHeadGroup = new THREE.Group();
  const headCat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.8), catFurMat);
  catHeadGroup.add(headCat);

  [-0.3, 0.3].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.15), catFurMat);
    ear.position.set(x, 0.55, 0);
    catHeadGroup.add(ear);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.08), catEyeMat);
    eye.position.set(x * 0.7, 0.05, 0.42);
    catHeadGroup.add(eye);
  });

  catHeadGroup.position.set(0, 0.55, 0.7);
  catGroup.add(catHeadGroup);

  const catTailGroup = new THREE.Group();
  const catTail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 0.2), catFurMat);
  catTail.position.set(0, 0.45, 0);
  catTailGroup.add(catTail);
  catTailGroup.position.set(0, 0.2, -0.7);
  catTailGroup.rotation.x = -0.6;
  catGroup.add(catTailGroup);

  const catLegGeo = new THREE.BoxGeometry(0.28, 0.7, 0.28);
  [-0.35, 0.35].forEach((x) => {
    [0.4, -0.4].forEach((z) => {
      const leg = new THREE.Mesh(catLegGeo, catFurMat);
      leg.position.set(x, -0.7, z);
      catGroup.add(leg);
    });
  });

  catGroup.position.set(-2.2, -1.2, 0.6);
  catGroup.rotation.y = 0.5;
  rootGroup.add(catGroup);

  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#8b5cf6', '#ffffff', '#d946ef');
    bubble.position.set(0.6, 2.5, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    torsoGroup.position.y = 0.4 + Math.sin(elapsed * 2.2) * 0.04;
    headGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.1;
    headGroup.rotation.z = Math.cos(elapsed * 1.8) * 0.03;

    leftArmGroup.rotation.x = Math.sin(elapsed * 2.0) * 0.05;
    leftArmGroup.rotation.z = 0.05;

    // Cheerful waving hand
    rightArmGroup.rotation.x = -2.2 + Math.sin(elapsed * 6.0) * 0.2;
    rightArmGroup.rotation.z = -0.6 + Math.sin(elapsed * 7.0) * 0.4;

    catGroup.position.y = -1.2 + Math.sin(elapsed * 3.0) * 0.02;
    catTailGroup.rotation.z = Math.sin(elapsed * 4.0) * 0.35;
    catHeadGroup.rotation.y = Math.sin(elapsed * 1.8) * 0.15;

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}

/**
 * 4. ANIME TRAVELER & BLUE DOG
 * Traditional sombrero, vibrant serape poncho stripes, and loyal blue dog.
 */
export function setupMexicanTravelerScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'HOLA!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xf59e0b, 2.5);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.42, 0.42, 0.42);
  rootGroup.position.set(0.1, 0.8, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.6 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const bootsMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
  const turquoiseMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
  const strawMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });

  const characterGroup = new THREE.Group();
  rootGroup.add(characterGroup);

  // Torso
  const torsoGroup = new THREE.Group();
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.1, 1.2), shirtMat);
  torsoGroup.add(torsoMesh);

  const s1 = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.4, 1.25), redMat);
  s1.position.set(0, 0.5, 0);
  s1.rotation.z = 0.15;
  torsoGroup.add(s1);

  const s2 = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.4, 1.25), yellowMat);
  s2.position.set(0, 0.1, 0);
  s2.rotation.z = 0.15;
  torsoGroup.add(s2);

  const s3 = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.4, 1.25), turquoiseMat);
  s3.position.set(0, -0.3, 0);
  s3.rotation.z = 0.15;
  torsoGroup.add(s3);

  torsoGroup.position.y = 0.4;
  characterGroup.add(torsoGroup);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), skinMat);
  neck.position.set(0, 1.32, 0);
  characterGroup.add(neck);

  // Head & Sombrero
  const headGroup = new THREE.Group();
  const headGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
  const headMesh = createOutlinedMesh(headGeo, skinMat, 0.04);
  headGroup.add(headMesh);

  const eyeBg = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const eyeIris = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
  const eyeShine = new THREE.MeshBasicMaterial({ color: 0xffffff });

  [-0.55, 0.55].forEach((x) => {
    const eg = new THREE.Group();
    eg.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.08), eyeBg));
    const iris = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.1), eyeIris);
    iris.position.set(0, -0.05, 0.02);
    eg.add(iris);
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.12), eyeShine);
    sh.position.set(0.1, 0.18, 0.04);
    eg.add(sh);
    eg.position.set(x, 0.2, 1.12);
    headGroup.add(eg);
  });

  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.1), eyeBg);
  smile.position.set(0, -0.45, 1.13);
  headGroup.add(smile);

  // Sombrero
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.15, 16), strawMat);
  brim.position.set(0, 1.3, 0);
  headGroup.add(brim);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 1.1, 16), strawMat);
  crown.position.set(0, 1.85, 0);
  headGroup.add(crown);

  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.32, 0.3, 16), redMat);
  hatBand.position.set(0, 1.45, 0);
  headGroup.add(hatBand);

  headGroup.position.set(0, 2.1, 0);
  characterGroup.add(headGroup);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
  const leftArmGroup = new THREE.Group();
  const leftArmMesh = createOutlinedMesh(armGeo, shirtMat, 0.04);
  leftArmMesh.position.y = -0.7;
  leftArmGroup.add(leftArmMesh);
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), skinMat);
  leftHand.position.y = -1.4;
  leftArmGroup.add(leftHand);
  leftArmGroup.position.set(1.55, 1.3, 0);
  characterGroup.add(leftArmGroup);

  // Right arm waving
  const rightArmGroup = new THREE.Group();
  const rightArmMesh = createOutlinedMesh(armGeo, shirtMat, 0.04);
  rightArmMesh.position.y = -0.7;
  rightArmGroup.add(rightArmMesh);
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), skinMat);
  rightHand.position.y = -1.4;
  rightArmGroup.add(rightHand);
  rightArmGroup.position.set(-1.55, 1.3, 0);
  characterGroup.add(rightArmGroup);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.95, 1.7, 0.95);
  const leftLegGroup = new THREE.Group();
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.position.y = -0.85;
  leftLegGroup.add(leftLegMesh);
  const leftBoot = createOutlinedMesh(new THREE.BoxGeometry(1.05, 0.7, 1.2), bootsMat, 0.04);
  leftBoot.position.set(0, -1.8, 0.1);
  leftLegGroup.add(leftBoot);
  leftLegGroup.position.set(0.6, -0.6, 0);
  characterGroup.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rightLegMesh.position.y = -0.85;
  rightLegGroup.add(rightLegMesh);
  const rightBoot = createOutlinedMesh(new THREE.BoxGeometry(1.05, 0.7, 1.2), bootsMat, 0.04);
  rightBoot.position.set(0, -1.8, 0.1);
  rightLegGroup.add(rightBoot);
  rightLegGroup.position.set(-0.6, -0.6, 0);
  characterGroup.add(rightLegGroup);

  characterGroup.position.set(0.8, 0.2, 0);

  // Loyal Blue Companion Dog
  const dogFurMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.6 });
  const dogGroup = new THREE.Group();

  const dogBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.8), dogFurMat);
  dogGroup.add(dogBody);

  const dogHeadGroup = new THREE.Group();
  const dogHead = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.1), dogFurMat);
  dogHeadGroup.add(dogHead);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.6), dogFurMat);
  snout.position.set(0, -0.2, 0.6);
  dogHeadGroup.add(snout);

  [-0.35, 0.35].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), dogFurMat);
    ear.position.set(x, 0.75, 0);
    dogHeadGroup.add(ear);
  });

  dogHeadGroup.position.set(0, 0.65, 0.95);
  dogGroup.add(dogHeadGroup);

  const dogTailGroup = new THREE.Group();
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), dogFurMat);
  tail.position.set(0, 0.35, 0);
  dogTailGroup.add(tail);
  dogTailGroup.position.set(0, 0.3, -0.9);
  dogTailGroup.rotation.x = 0.6;
  dogGroup.add(dogTailGroup);

  const dogLegGeo = new THREE.BoxGeometry(0.35, 0.8, 0.35);
  [-0.45, 0.45].forEach((x) => {
    [0.5, -0.5].forEach((z) => {
      const leg = new THREE.Mesh(dogLegGeo, dogFurMat);
      leg.position.set(x, -0.8, z);
      dogGroup.add(leg);
    });
  });

  dogGroup.position.set(-1.8, -1.2, 0.8);
  dogGroup.rotation.y = 0.4;
  rootGroup.add(dogGroup);

  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#d97706', '#ffffff', '#ef4444');
    bubble.position.set(0.6, 2.5, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    torsoGroup.position.y = 0.4 + Math.sin(elapsed * 2.2) * 0.04;
    headGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.1;
    headGroup.rotation.z = Math.cos(elapsed * 1.8) * 0.03;

    leftArmGroup.rotation.x = Math.sin(elapsed * 2.0) * 0.05;
    leftArmGroup.rotation.z = 0.05;

    // Friendly waving
    rightArmGroup.rotation.x = -2.2 + Math.sin(elapsed * 6.0) * 0.25;
    rightArmGroup.rotation.z = -0.4 + Math.sin(elapsed * 6.0) * 0.2;

    dogGroup.position.y = -1.2 + Math.sin(elapsed * 2.8) * 0.03;
    dogTailGroup.rotation.z = Math.sin(elapsed * 14.0) * 0.45;
    dogHeadGroup.rotation.y = Math.sin(elapsed * 2.0) * 0.1;

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}

/**
 * 5. COOL ALIEN GIRL & ALIEN DOG
 * Lavender alien girl with star antennae, bouncy space pigtails, glowing heart core & antenna puppy.
 */
export function setupAlienGirlScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'PEACE!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xa855f7, 2.5);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.4, 0.4, 0.4);
  rootGroup.position.set(0.1, 0.8, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  // Materials
  const alienSkinMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.6 });
  const suitTrimMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3, emissive: 0xf43f5e, emissiveIntensity: 0.6 });
  const jumpsuitMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.4 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
  const bootsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

  const characterGroup = new THREE.Group();
  rootGroup.add(characterGroup);

  // Torso
  const torsoGroup = new THREE.Group();
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 1.2), jumpsuitMat);
  torsoGroup.add(torsoMesh);

  const chestArmor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.3), alienSkinMat);
  chestArmor.position.set(0, 0.1, 0.05);
  torsoGroup.add(chestArmor);

  const coreReactor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), suitTrimMat);
  coreReactor.position.set(0, 0.1, 0.72);
  torsoGroup.add(coreReactor);

  const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.3, 1.28), beltMat);
  beltMesh.position.set(0, -0.9, 0);
  torsoGroup.add(beltMesh);

  torsoGroup.position.y = 0.5;
  characterGroup.add(torsoGroup);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), alienSkinMat);
  neck.position.set(0, 1.5, 0);
  characterGroup.add(neck);

  // Head
  const headGroup = new THREE.Group();
  const headGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
  const headMesh = createOutlinedMesh(headGeo, alienSkinMat, 0.05);
  headGroup.add(headMesh);

  // Antennae
  [-0.6, 0.6].forEach((x) => {
    const ant = createOutlinedMesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), alienSkinMat, 0.05);
    ant.position.set(x, 1.5, 0);
    ant.rotation.z = x > 0 ? -0.3 : 0.3;
    headGroup.add(ant);

    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), suitTrimMat);
    tip.position.set(x * 1.25, 1.9, 0);
    headGroup.add(tip);
  });

  // Space Pigtails
  const pigtailLGroup = new THREE.Group();
  const pMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), suitTrimMat);
  pMeshL.position.set(0.4, -0.5, 0);
  pigtailLGroup.add(pMeshL);
  pigtailLGroup.position.set(1.3, 0.8, 0);
  headGroup.add(pigtailLGroup);

  const pigtailRGroup = new THREE.Group();
  const pMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), suitTrimMat);
  pMeshR.position.set(-0.4, -0.5, 0);
  pigtailRGroup.add(pMeshR);
  pigtailRGroup.position.set(-1.3, 0.8, 0);
  headGroup.add(pigtailRGroup);

  // Large Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  [-0.65, 0.65].forEach((x) => {
    const eg = new THREE.Group();
    eg.add(new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.0, 0.1), eyeMat));
    const sh1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.12), shineMat);
    sh1.position.set(x > 0 ? 0.18 : -0.18, 0.25, 0.01);
    eg.add(sh1);
    eg.position.set(x, 0.15, 1.28);
    eg.rotation.y = x > 0 ? 0.25 : -0.25;
    headGroup.add(eg);
  });

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), eyeMat);
  mouth.position.set(0, -0.5, 1.28);
  headGroup.add(mouth);

  headGroup.position.set(0, 2.8, 0);
  characterGroup.add(headGroup);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.8, 1.7, 0.8);
  const leftArmGroup = new THREE.Group();
  const leftArmMesh = createOutlinedMesh(armGeo, jumpsuitMat, 0.05);
  leftArmMesh.position.y = -0.7;
  leftArmGroup.add(leftArmMesh);
  const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), alienSkinMat);
  leftGlove.position.y = -1.35;
  leftArmGroup.add(leftGlove);
  leftArmGroup.position.set(1.55, 1.3, 0);
  characterGroup.add(leftArmGroup);

  // Right arm waving
  const rightArmGroup = new THREE.Group();
  const rightArmMesh = createOutlinedMesh(armGeo, jumpsuitMat, 0.05);
  rightArmMesh.position.y = -0.7;
  rightArmGroup.add(rightArmMesh);
  const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), alienSkinMat);
  rightGlove.position.y = -1.35;
  rightArmGroup.add(rightGlove);
  rightArmGroup.position.set(-1.55, 1.3, 0);
  characterGroup.add(rightArmGroup);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.9, 1.6, 0.9);
  const leftLegGroup = new THREE.Group();
  const leftLegMesh = new THREE.Mesh(legGeo, jumpsuitMat);
  leftLegMesh.position.y = -0.8;
  leftLegGroup.add(leftLegMesh);
  const leftShoe = createOutlinedMesh(new THREE.BoxGeometry(1.0, 0.6, 1.2), bootsMat, 0.05);
  leftShoe.position.set(0, -1.7, 0.1);
  leftLegGroup.add(leftShoe);
  leftLegGroup.position.set(0.55, -0.5, 0);
  characterGroup.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  const rightLegMesh = new THREE.Mesh(legGeo, jumpsuitMat);
  rightLegMesh.position.y = -0.8;
  rightLegGroup.add(rightLegMesh);
  const rightShoe = createOutlinedMesh(new THREE.BoxGeometry(1.0, 0.6, 1.2), bootsMat, 0.05);
  rightShoe.position.set(0, -1.7, 0.1);
  rightLegGroup.add(rightShoe);
  rightLegGroup.position.set(-0.55, -0.5, 0);
  characterGroup.add(rightLegGroup);

  characterGroup.position.set(0.8, 0.2, 0);

  // Alien Dog
  const alienDogGroup = new THREE.Group();
  const dogBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.8), jumpsuitMat);
  alienDogGroup.add(dogBody);
  const dogCollar = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.25, 1.85), suitTrimMat);
  dogCollar.position.set(0, 0.2, 0);
  alienDogGroup.add(dogCollar);

  const dogHeadGroup = new THREE.Group();
  const dogHead = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), alienSkinMat);
  dogHeadGroup.add(dogHead);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), alienSkinMat);
  snout.position.set(0, -0.2, 0.6);
  dogHeadGroup.add(snout);

  const dogAnt = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), alienSkinMat);
  dogAnt.position.set(0, 0.8, 0);
  dogHeadGroup.add(dogAnt);
  const dogTip = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), suitTrimMat);
  dogTip.position.set(0, 1.1, 0);
  dogHeadGroup.add(dogTip);

  [-0.28, 0.28].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.1), eyeMat);
    eye.position.set(x, 0.1, 0.58);
    dogHeadGroup.add(eye);
  });

  dogHeadGroup.position.set(0, 0.65, 0.95);
  alienDogGroup.add(dogHeadGroup);

  const dogTailGroup = new THREE.Group();
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), alienSkinMat);
  tail.position.set(0, 0.4, 0);
  dogTailGroup.add(tail);
  dogTailGroup.position.set(0, 0.35, -0.95);
  dogTailGroup.rotation.x = 0.5;
  alienDogGroup.add(dogTailGroup);

  const dogLegGeo = new THREE.BoxGeometry(0.35, 0.75, 0.35);
  [-0.45, 0.45].forEach((x) => {
    [0.45, -0.45].forEach((z) => {
      const leg = new THREE.Mesh(dogLegGeo, jumpsuitMat);
      leg.position.set(x, -0.75, z);
      alienDogGroup.add(leg);
    });
  });

  alienDogGroup.position.set(-1.8, -1.2, 0.8);
  alienDogGroup.rotation.y = 0.4;
  rootGroup.add(alienDogGroup);

  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#4f46e5', '#ffffff', '#f43f5e');
    bubble.position.set(0.6, 2.5, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    torsoGroup.position.y = 0.5 + Math.sin(elapsed * 2.5) * 0.04;
    headGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.12;
    headGroup.rotation.z = Math.cos(elapsed * 1.8) * 0.03;

    pigtailLGroup.rotation.z = Math.sin(elapsed * 3.0) * 0.15;
    pigtailRGroup.rotation.z = -Math.sin(elapsed * 3.0) * 0.15;

    leftArmGroup.rotation.x = Math.sin(elapsed * 2.0) * 0.05;
    leftArmGroup.rotation.z = 0.05;

    rightArmGroup.rotation.x = -2.2 + Math.sin(elapsed * 6.0) * 0.25;
    rightArmGroup.rotation.z = -0.4 + Math.sin(elapsed * 6.0) * 0.2;

    alienDogGroup.position.y = -1.2 + Math.sin(elapsed * 3.0) * 0.03;
    dogTailGroup.rotation.z = Math.sin(elapsed * 14.0) * 0.4;
    dogHeadGroup.rotation.y = Math.sin(elapsed * 2.0) * 0.1;

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}

/**
 * 6. COOL ALIEN BOY & ALIEN DOG
 * Vibrant green alien skin, dark space suit with cyan reactor & antenna companion dog.
 */
export function setupAlienBoyScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'COSMIC!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0x22c55e, 2.4);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.4, 0.4, 0.4);
  rootGroup.position.set(0.1, 0.8, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  // Materials
  const alienSkinMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 });
  const spaceSuitMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const suitTrimMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, emissive: 0x38bdf8, emissiveIntensity: 0.5 });
  const bootsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
  const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const characterGroup = new THREE.Group();
  rootGroup.add(characterGroup);

  // Torso
  const torsoGroup = new THREE.Group();
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.1, 1.3), spaceSuitMat);
  torsoGroup.add(torsoMesh);

  const chestArmor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 1.4), alienSkinMat);
  chestArmor.position.set(0, 0.1, 0.05);
  torsoGroup.add(chestArmor);

  const coreReactor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.2), suitTrimMat);
  coreReactor.position.set(0, 0.1, 0.75);
  torsoGroup.add(coreReactor);

  torsoGroup.position.y = 0.4;
  characterGroup.add(torsoGroup);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.35, 0.84), alienSkinMat);
  neck.position.set(0, 1.45, 0);
  characterGroup.add(neck);

  // Head
  const headGroup = new THREE.Group();
  const headGeo = new THREE.BoxGeometry(2.6, 2.6, 2.6);
  const headMesh = createOutlinedMesh(headGeo, alienSkinMat, 0.05);
  headGroup.add(headMesh);

  [-0.7, 0.7].forEach((x) => {
    const ant = createOutlinedMesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), alienSkinMat, 0.05);
    ant.position.set(x, 1.6, 0);
    ant.rotation.z = x > 0 ? -0.2 : 0.2;
    headGroup.add(ant);

    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), suitTrimMat);
    tip.position.set(x * 1.2, 2.0, 0);
    headGroup.add(tip);
  });

  [-0.65, 0.65].forEach((x) => {
    const eg = new THREE.Group();
    eg.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.1), eyeMat));
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.12), eyeHighlightMat);
    sh.position.set(x > 0 ? 0.15 : -0.15, 0.2, 0.01);
    eg.add(sh);
    eg.position.set(x, 0.2, 1.32);
    eg.rotation.y = x > 0 ? 0.25 : -0.25;
    headGroup.add(eg);
  });

  headGroup.position.set(0, 2.85, 0);
  characterGroup.add(headGroup);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.9, 1.8, 0.9);
  const leftArmGroup = new THREE.Group();
  const leftArmMesh = createOutlinedMesh(armGeo, spaceSuitMat, 0.05);
  leftArmMesh.position.y = -0.7;
  leftArmGroup.add(leftArmMesh);
  const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.8, 0.95), alienSkinMat);
  leftGlove.position.y = -1.4;
  leftArmGroup.add(leftGlove);
  leftArmGroup.position.set(1.65, 1.3, 0);
  characterGroup.add(leftArmGroup);

  // Right arm waving
  const rightArmGroup = new THREE.Group();
  const rightArmMesh = createOutlinedMesh(armGeo, spaceSuitMat, 0.05);
  rightArmMesh.position.y = -0.7;
  rightArmGroup.add(rightArmMesh);
  const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.8, 0.95), alienSkinMat);
  rightGlove.position.y = -1.4;
  rightArmGroup.add(rightGlove);
  rightArmGroup.position.set(-1.65, 1.3, 0);
  characterGroup.add(rightArmGroup);

  // Legs
  const legGeo = new THREE.BoxGeometry(1.0, 1.7, 1.0);
  const leftLegGroup = new THREE.Group();
  const leftLegMesh = new THREE.Mesh(legGeo, spaceSuitMat);
  leftLegMesh.position.y = -0.85;
  leftLegGroup.add(leftLegMesh);
  const leftShoe = createOutlinedMesh(new THREE.BoxGeometry(1.1, 0.7, 1.3), bootsMat, 0.05);
  leftShoe.position.set(0, -1.8, 0.1);
  leftLegGroup.add(leftShoe);
  leftLegGroup.position.set(0.6, -0.6, 0);
  characterGroup.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  const rightLegMesh = new THREE.Mesh(legGeo, spaceSuitMat);
  rightLegMesh.position.y = -0.85;
  rightLegGroup.add(rightLegMesh);
  const rightShoe = createOutlinedMesh(new THREE.BoxGeometry(1.1, 0.7, 1.3), bootsMat, 0.05);
  rightShoe.position.set(0, -1.8, 0.1);
  rightLegGroup.add(rightShoe);
  rightLegGroup.position.set(-0.6, -0.6, 0);
  characterGroup.add(rightLegGroup);

  characterGroup.position.set(0.8, 0.2, 0);

  // Alien Dog
  const alienDogGroup = new THREE.Group();
  const dogBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.9), spaceSuitMat);
  alienDogGroup.add(dogBody);
  const dogCollar = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.3, 1.95), suitTrimMat);
  dogCollar.position.set(0, 0.2, 0);
  alienDogGroup.add(dogCollar);

  const dogHeadGroup = new THREE.Group();
  const dogHead = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), alienSkinMat);
  dogHeadGroup.add(dogHead);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), alienSkinMat);
  snout.position.set(0, -0.2, 0.65);
  dogHeadGroup.add(snout);

  const dogAnt = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), alienSkinMat);
  dogAnt.position.set(0, 0.85, 0);
  dogHeadGroup.add(dogAnt);
  const dogTip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), suitTrimMat);
  dogTip.position.set(0, 1.15, 0);
  dogHeadGroup.add(dogTip);

  [-0.3, 0.3].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.1), eyeMat);
    eye.position.set(x, 0.1, 0.62);
    dogHeadGroup.add(eye);
  });

  dogHeadGroup.position.set(0, 0.7, 1.0);
  alienDogGroup.add(dogHeadGroup);

  const dogTailGroup = new THREE.Group();
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), alienSkinMat);
  tail.position.set(0, 0.4, 0);
  dogTailGroup.add(tail);
  dogTailGroup.position.set(0, 0.4, -1.0);
  dogTailGroup.rotation.x = 0.5;
  alienDogGroup.add(dogTailGroup);

  const dogLegGeo = new THREE.BoxGeometry(0.4, 0.8, 0.4);
  [-0.5, 0.5].forEach((x) => {
    [0.5, -0.5].forEach((z) => {
      const leg = new THREE.Mesh(dogLegGeo, spaceSuitMat);
      leg.position.set(x, -0.8, z);
      alienDogGroup.add(leg);
    });
  });

  alienDogGroup.position.set(-1.8, -1.2, 0.8);
  alienDogGroup.rotation.y = 0.4;
  rootGroup.add(alienDogGroup);

  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#0f172a', '#38bdf8', '#22c55e');
    bubble.position.set(0.6, 2.5, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    torsoGroup.position.y = 0.4 + Math.sin(elapsed * 2.5) * 0.04;
    headGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.12;
    headGroup.rotation.z = Math.cos(elapsed * 1.8) * 0.03;

    leftArmGroup.rotation.x = Math.sin(elapsed * 2.0) * 0.05;
    leftArmGroup.rotation.z = 0.05;

    rightArmGroup.rotation.x = -2.2 + Math.sin(elapsed * 6.0) * 0.25;
    rightArmGroup.rotation.z = -0.4 + Math.sin(elapsed * 6.0) * 0.2;

    alienDogGroup.position.y = -1.2 + Math.sin(elapsed * 3.0) * 0.03;
    dogTailGroup.rotation.z = Math.sin(elapsed * 14.0) * 0.4;
    dogHeadGroup.rotation.y = Math.sin(elapsed * 2.0) * 0.1;

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}

/**
 * 7. MOON DEMON NOBLE
 * Pure white paper chibi face, elf/yokai ears, forehead purple crescent & cheek stripes,
 * flowing silver hair, Mokomoko fur stole, armor, Tensaiga, and floating shifting glowing katana.
 */
export function setupMoonDemonNobleScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'SILENCE!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 1.85, 5.5);
  camera.lookAt(0, 1.45, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xcfd8dc, 1.0);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.64, 0.64, 0.64);
  rootGroup.position.set(0, 1.18, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.0 });
  const lightGrayMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9, metalness: 0.0 });
  const pencilMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, metalness: 0.1 });
  const armorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.1 });
  const furMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, metalness: 0.0 });
  const inkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 1.0, metalness: 0.0 });
  const markMat = inkMat; // Pure black ink sketch mark (black & white character)

  const nobleGroup = new THREE.Group();
  rootGroup.add(nobleGroup);

  // Head
  const headGeo = new THREE.BoxGeometry(1.4, 1.3, 1.3);
  const headMesh = createOutlinedMesh(headGeo, paperMat, 0.04);
  headMesh.position.set(0, 0.9, 0);
  nobleGroup.add(headMesh);

  // Pointed ears
  const earGeo = new THREE.BoxGeometry(0.3, 0.7, 0.3);
  const leftEar = new THREE.Mesh(earGeo, paperMat);
  leftEar.position.set(0.75, 1.0, 0);
  leftEar.rotation.z = -0.4;
  nobleGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, paperMat);
  rightEar.position.set(-0.75, 1.0, 0);
  rightEar.rotation.z = 0.4;
  nobleGroup.add(rightEar);

  // Forehead crescent moon mark
  const moonGeo = new THREE.BoxGeometry(0.35, 0.15, 0.02);
  const moonMesh = new THREE.Mesh(moonGeo, markMat);
  moonMesh.position.set(0, 1.25, 0.67);
  nobleGroup.add(moonMesh);

  // Cheek stripes
  const stripeGeo = new THREE.BoxGeometry(0.12, 0.35, 0.02);
  const leftStripe = new THREE.Mesh(stripeGeo, markMat);
  leftStripe.position.set(0.42, 0.85, 0.67);
  nobleGroup.add(leftStripe);

  const rightStripe = new THREE.Mesh(stripeGeo, markMat);
  rightStripe.position.set(-0.42, 0.85, 0.67);
  nobleGroup.add(rightStripe);

  // Silvery hair
  const hairTop = createOutlinedMesh(new THREE.BoxGeometry(1.6, 0.5, 1.5), lightGrayMat, 0.04);
  hairTop.position.set(0, 1.5, 0);
  nobleGroup.add(hairTop);

  const hairBack = createOutlinedMesh(new THREE.BoxGeometry(1.5, 2.2, 0.7), lightGrayMat, 0.04);
  hairBack.position.set(0, 0.3, -0.5);
  nobleGroup.add(hairBack);

  const hairLockGeo = new THREE.BoxGeometry(0.38, 1.6, 0.38);
  const leftHair = createOutlinedMesh(hairLockGeo, lightGrayMat, 0.04);
  leftHair.position.set(0.85, 0.4, 0.25);
  nobleGroup.add(leftHair);

  const rightHair = createOutlinedMesh(hairLockGeo, lightGrayMat, 0.04);
  rightHair.position.set(-0.85, 0.4, 0.25);
  nobleGroup.add(rightHair);

  // Eyes & Mouth
  const eyeBaseGeo = new THREE.BoxGeometry(0.35, 0.35, 0.04);
  const leftEyeBase = new THREE.Mesh(eyeBaseGeo, inkMat);
  leftEyeBase.position.set(0.3, 0.95, 0.675);
  nobleGroup.add(leftEyeBase);

  const rightEyeBase = new THREE.Mesh(eyeBaseGeo, inkMat);
  rightEyeBase.position.set(-0.3, 0.95, 0.675);
  nobleGroup.add(rightEyeBase);

  const eyeShineGeo = new THREE.BoxGeometry(0.12, 0.12, 0.05);
  const leftShine = new THREE.Mesh(eyeShineGeo, paperMat);
  leftShine.position.set(0.38, 1.02, 0.68);
  nobleGroup.add(leftShine);

  const rightShine = new THREE.Mesh(eyeShineGeo, paperMat);
  rightShine.position.set(-0.22, 1.02, 0.68);
  nobleGroup.add(rightShine);

  const mouthMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.02), inkMat);
  mouthMesh.position.set(0, 0.58, 0.67);
  nobleGroup.add(mouthMesh);

  // Fluffy Mokomoko Fur Stole
  const furMesh = createOutlinedMesh(new THREE.BoxGeometry(2.1, 0.9, 1.2), furMat, 0.04);
  furMesh.position.set(0, 0.32, 0);
  nobleGroup.add(furMesh);

  const furTail = createOutlinedMesh(new THREE.BoxGeometry(0.7, 1.8, 0.7), furMat, 0.04);
  furTail.position.set(-1.1, -0.4, 0);
  nobleGroup.add(furTail);

  // Torso & Armor
  const torsoMesh = createOutlinedMesh(new THREE.BoxGeometry(1.2, 1.1, 0.85), paperMat, 0.04);
  torsoMesh.position.set(0, -0.2, 0);
  nobleGroup.add(torsoMesh);

  const pauldronGeo = new THREE.BoxGeometry(0.5, 0.5, 0.6);
  const leftPauldron = createOutlinedMesh(pauldronGeo, armorMat, 0.04);
  leftPauldron.position.set(0.85, 0.15, 0);
  nobleGroup.add(leftPauldron);

  const rightPauldron = createOutlinedMesh(pauldronGeo, armorMat, 0.04);
  rightPauldron.position.set(-0.85, 0.15, 0);
  nobleGroup.add(rightPauldron);

  const chestArmor = createOutlinedMesh(new THREE.BoxGeometry(0.7, 0.5, 0.2), armorMat, 0.04);
  chestArmor.position.set(0, -0.1, 0.42);
  nobleGroup.add(chestArmor);

  const obiMesh = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.25, 0.9), pencilMat);
  obiMesh.position.set(0, -0.5, 0);
  nobleGroup.add(obiMesh);

  // Arms & Legs
  const armGeo = new THREE.BoxGeometry(0.38, 0.9, 0.38);
  const leftArm = createOutlinedMesh(armGeo, paperMat, 0.04);
  leftArm.position.set(0.85, -0.2, 0);
  nobleGroup.add(leftArm);

  const rightArm = createOutlinedMesh(armGeo, paperMat, 0.04);
  rightArm.position.set(-0.85, -0.2, 0);
  nobleGroup.add(rightArm);

  const handGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
  const leftHand = createOutlinedMesh(handGeo, paperMat, 0.04);
  leftHand.position.set(0.85, -0.75, 0);
  nobleGroup.add(leftHand);

  const rightHand = createOutlinedMesh(handGeo, paperMat, 0.04);
  rightHand.position.set(-0.85, -0.75, 0);
  nobleGroup.add(rightHand);

  const pantsMesh = createOutlinedMesh(new THREE.BoxGeometry(1.15, 0.8, 0.75), paperMat, 0.04);
  pantsMesh.position.set(0, -0.95, 0);
  nobleGroup.add(pantsMesh);

  const bootGeo = new THREE.BoxGeometry(0.4, 0.35, 0.5);
  const leftBoot = createOutlinedMesh(bootGeo, pencilMat, 0.04);
  leftBoot.position.set(0.3, -1.6, 0.04);
  nobleGroup.add(leftBoot);

  const rightBoot = createOutlinedMesh(bootGeo, pencilMat, 0.04);
  rightBoot.position.set(-0.3, -1.6, 0.04);
  nobleGroup.add(rightBoot);

  // Tensaiga sword on back
  const swordBackGroup = new THREE.Group();
  const backHilt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), paperMat);
  backHilt.position.set(0, 1.2, 0);
  swordBackGroup.add(backHilt);

  const backGuard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.35), armorMat);
  backGuard.position.set(0, 0.75, 0);
  swordBackGroup.add(backGuard);

  const backBlade = createOutlinedMesh(new THREE.BoxGeometry(0.32, 2.8, 0.1), paperMat, 0.05);
  backBlade.position.set(0, -0.5, 0);
  swordBackGroup.add(backBlade);

  swordBackGroup.position.set(0.2, 0.1, -0.80);
  swordBackGroup.rotation.x = -0.15;
  swordBackGroup.rotation.z = -0.45;
  nobleGroup.add(swordBackGroup);

  // Floating mystical front sword with dynamic color shifting
  const floatingSwordGroup = new THREE.Group();
  const fHilt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.14), paperMat);
  fHilt.position.set(0, 0.9, 0);
  floatingSwordGroup.add(fHilt);

  const fGuard = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.3), armorMat);
  fGuard.position.set(0, 0.5, 0);
  floatingSwordGroup.add(fGuard);

  const glowingBladeMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffaa,
    emissiveIntensity: 2.5,
    roughness: 0.2,
    metalness: 0.8,
  });
  const swordBlade = createOutlinedMesh(new THREE.BoxGeometry(0.25, 2.2, 0.08), glowingBladeMat, 0.05);
  swordBlade.position.set(0, -0.6, 0);
  floatingSwordGroup.add(swordBlade);

  floatingSwordGroup.position.set(0, -0.3, 1.4);
  floatingSwordGroup.rotation.z = Math.PI / 6;
  nobleGroup.add(floatingSwordGroup);

  const swordLight = new THREE.PointLight(0x00ffaa, 4.0, 8);
  swordLight.position.set(0, -0.3, 1.4);
  nobleGroup.add(swordLight);

  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#0f172a', '#ffffff', '#ffffff');
    bubble.position.set(0.6, 2.1, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    nobleGroup.position.y = Math.sin(elapsed * 1.5) * 0.1;
    nobleGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.08;

    floatingSwordGroup.position.y = -0.3 + Math.sin(elapsed * 2.5) * 0.12;
    floatingSwordGroup.rotation.y += 0.02;
    floatingSwordGroup.rotation.z = Math.PI / 6 + Math.sin(elapsed * 1.5) * 0.05;

    const hue = (elapsed * 0.08) % 1;
    const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
    glowingBladeMat.emissive.copy(color);
    swordLight.color.copy(color);

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}

/**
 * 8. DEMON DOG WARRIOR
 * Pure white paper chibi face, oversized dog ears, silver-white hair, dark kimono with pencil hatching,
 * crossed swords on back, and floating color-shifting glowing Shikon Jewel sphere.
 */
export function setupDemonDogWarriorScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'IRON REAVER!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.2, 4.3);
  camera.lookAt(0, 0.05, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdddddd, 0.8);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.88, 0.88, 0.88);
  rootGroup.position.set(0, 0.05, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const lightGrayMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
  const pencilMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
  const dirtyClothMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95 });
  const inkMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1.0 });

  const warriorGroup = new THREE.Group();
  rootGroup.add(warriorGroup);

  // Head
  const headMesh = createOutlinedMesh(new THREE.BoxGeometry(1.4, 1.3, 1.3), paperMat, 0.04);
  headMesh.position.set(0, 0.9, 0);
  warriorGroup.add(headMesh);

  // Oversized Dog Ears
  const leftEarGroup = new THREE.Group();
  const earMesh = createOutlinedMesh(new THREE.BoxGeometry(0.6, 1.1, 0.45), paperMat, 0.05);
  earMesh.position.set(0.35, 0.35, 0);
  leftEarGroup.add(earMesh);
  leftEarGroup.position.set(0.75, 1.4, 0);
  leftEarGroup.rotation.z = -0.25;
  warriorGroup.add(leftEarGroup);

  const rightEarGroup = new THREE.Group();
  const rEarMesh = createOutlinedMesh(new THREE.BoxGeometry(0.6, 1.1, 0.45), paperMat, 0.05);
  rEarMesh.position.set(-0.35, 0.35, 0);
  rightEarGroup.add(rEarMesh);
  rightEarGroup.position.set(-0.75, 1.4, 0);
  rightEarGroup.rotation.z = 0.25;
  warriorGroup.add(rightEarGroup);

  // Flowing silver hair
  const hairTop = createOutlinedMesh(new THREE.BoxGeometry(1.6, 0.5, 1.5), lightGrayMat, 0.04);
  hairTop.position.set(0, 1.5, 0);
  warriorGroup.add(hairTop);

  const hairBack = createOutlinedMesh(new THREE.BoxGeometry(1.5, 1.4, 0.7), lightGrayMat, 0.04);
  hairBack.position.set(0, 0.6, -0.5);
  warriorGroup.add(hairBack);

  const hairLockGeo = new THREE.BoxGeometry(0.4, 1.1, 0.4);
  const leftHair = createOutlinedMesh(hairLockGeo, lightGrayMat, 0.04);
  leftHair.position.set(0.85, 0.7, 0.25);
  warriorGroup.add(leftHair);

  const rightHair = createOutlinedMesh(hairLockGeo, lightGrayMat, 0.04);
  rightHair.position.set(-0.85, 0.7, 0.25);
  warriorGroup.add(rightHair);

  // Eyes & Mouth
  const eyeBaseGeo = new THREE.BoxGeometry(0.35, 0.35, 0.08);
  const leftEyeBase = new THREE.Mesh(eyeBaseGeo, inkMat);
  leftEyeBase.position.set(0.3, 0.95, 0.67);
  warriorGroup.add(leftEyeBase);

  const rightEyeBase = new THREE.Mesh(eyeBaseGeo, inkMat);
  rightEyeBase.position.set(-0.3, 0.95, 0.67);
  warriorGroup.add(rightEyeBase);

  const eyeShineGeo = new THREE.BoxGeometry(0.12, 0.12, 0.04);
  const leftShine = new THREE.Mesh(eyeShineGeo, paperMat);
  leftShine.position.set(0.38, 1.02, 0.7);
  warriorGroup.add(leftShine);

  const rightShine = new THREE.Mesh(eyeShineGeo, paperMat);
  rightShine.position.set(-0.22, 1.02, 0.7);
  warriorGroup.add(rightShine);

  const mouthMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.08), inkMat);
  mouthMesh.position.set(0, 0.55, 0.67);
  warriorGroup.add(mouthMesh);

  // Kimono Torso & Hatching
  const torsoMesh = createOutlinedMesh(new THREE.BoxGeometry(1.3, 1.1, 0.9), dirtyClothMat, 0.04);
  torsoMesh.position.set(0, -0.2, 0);
  warriorGroup.add(torsoMesh);

  const hatchGeo = new THREE.BoxGeometry(1.2, 0.15, 0.95);
  const hatch1 = new THREE.Mesh(hatchGeo, pencilMat);
  hatch1.position.set(0, 0.05, 0);
  warriorGroup.add(hatch1);

  const hatch2 = new THREE.Mesh(hatchGeo, pencilMat);
  hatch2.position.set(0, -0.4, 0);
  warriorGroup.add(hatch2);

  const collarMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.2), paperMat);
  collarMesh.position.set(0, 0.35, 0.38);
  warriorGroup.add(collarMesh);

  // Arms & Legs
  const armGeo = new THREE.BoxGeometry(0.4, 0.9, 0.4);
  const leftArm = createOutlinedMesh(armGeo, dirtyClothMat, 0.04);
  leftArm.position.set(0.9, -0.2, 0);
  warriorGroup.add(leftArm);

  const rightArm = createOutlinedMesh(armGeo, dirtyClothMat, 0.04);
  rightArm.position.set(-0.9, -0.2, 0);
  warriorGroup.add(rightArm);

  const handGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  const leftHand = createOutlinedMesh(handGeo, paperMat, 0.04);
  leftHand.position.set(0.9, -0.75, 0);
  warriorGroup.add(leftHand);

  const rightHand = createOutlinedMesh(handGeo, paperMat, 0.04);
  rightHand.position.set(-0.9, -0.75, 0);
  warriorGroup.add(rightHand);

  const pantsMesh = createOutlinedMesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), pencilMat, 0.04);
  pantsMesh.position.set(0, -0.95, 0);
  warriorGroup.add(pantsMesh);

  const legGeo = new THREE.BoxGeometry(0.38, 0.4, 0.38);
  const leftLeg = new THREE.Mesh(legGeo, pencilMat);
  leftLeg.position.set(0.32, -1.4, 0);
  warriorGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pencilMat);
  rightLeg.position.set(-0.32, -1.4, 0);
  warriorGroup.add(rightLeg);

  const bootGeo = new THREE.BoxGeometry(0.44, 0.4, 0.52);
  const leftBoot = createOutlinedMesh(bootGeo, dirtyClothMat, 0.04);
  leftBoot.position.set(0.32, -1.75, 0.04);
  warriorGroup.add(leftBoot);

  const rightBoot = createOutlinedMesh(bootGeo, dirtyClothMat, 0.04);
  rightBoot.position.set(-0.32, -1.75, 0.04);
  warriorGroup.add(rightBoot);

  // Crossed swords on back
  function createBackSword() {
    const swGroup = new THREE.Group();
    const swHilt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.18), dirtyClothMat);
    swHilt.position.set(0, 1.2, 0);
    swGroup.add(swHilt);

    const swGuard = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.35), inkMat);
    swGuard.position.set(0, 0.8, 0);
    swGroup.add(swGuard);

    const swBlade = createOutlinedMesh(new THREE.BoxGeometry(0.35, 2.6, 0.12), paperMat, 0.05);
    swBlade.position.set(0, -0.4, 0);
    swGroup.add(swBlade);
    return swGroup;
  }

  const sword1 = createBackSword();
  sword1.position.set(0, -0.1, -0.80);
  sword1.rotation.set(-0.12, 0, -0.62);
  warriorGroup.add(sword1);

  const sword2 = createBackSword();
  sword2.position.set(0, -0.1, -0.85);
  sword2.rotation.set(-0.12, 0, 0.62);
  warriorGroup.add(sword2);

  // Floating Shikon Jewel
  const jewelGeo = new THREE.SphereGeometry(0.42, 24, 24);
  const jewelMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00aaff,
    emissiveIntensity: 2.2,
    roughness: 0.1,
    metalness: 0.9,
  });
  const jewelMesh = createOutlinedMesh(jewelGeo, jewelMat, 0.08);
  jewelMesh.position.set(0, -0.3, 1.8);
  warriorGroup.add(jewelMesh);

  const jewelLight = new THREE.PointLight(0x00dfff, 4.0, 7);
  jewelLight.position.set(0, -0.3, 1.8);
  warriorGroup.add(jewelLight);

  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#0f172a', '#ffffff', '#ffffff');
    bubble.position.set(0.6, 2.1, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    warriorGroup.position.y = Math.sin(elapsed * 1.5) * 0.1;
    warriorGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.08;

    jewelMesh.position.y = -0.3 + Math.sin(elapsed * 2.5) * 0.12;
    jewelMesh.rotation.y += 0.02;

    const hue = (elapsed * 0.08) % 1;
    const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
    jewelMat.emissive.copy(color);
    jewelLight.color.copy(color);

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}

/**
 * 9. CELESTIAL MOON GUARDIAN
 * Odangos & twin tails, sailor tiara, uniform with collar and chest bow,
 * and floating glowing crescent moon wand casting dynamic reflections.
 */
export function setupCelestialMoonGuardianScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'COSMIC POWER!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.2, 4.3);
  camera.lookAt(0, 0.05, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdddddd, 0.8);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.88, 0.88, 0.88);
  rootGroup.position.set(0, 0.05, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  // Black & White sketch materials for the character
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const whiteHairMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const pencilMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
  const darkClothMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const inkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 1.0 });

  // ONLY the floating Moon Stick wand glows
  const glowingWandMat = new THREE.MeshStandardMaterial({
    color: 0xff1493,
    emissive: 0xff3399,
    emissiveIntensity: 2.8,
    roughness: 0.1,
    metalness: 0.8,
  });
  const wandGemMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 2.0,
    roughness: 0.1,
  });

  const guardianGroup = new THREE.Group();
  rootGroup.add(guardianGroup);

  // Head
  const headMesh = createOutlinedMesh(new THREE.BoxGeometry(1.4, 1.3, 1.3), paperMat, 0.04);
  headMesh.position.set(0, 0.9, 0);
  guardianGroup.add(headMesh);

  // Hair & Odangos (pure white sketch paper hair)
  const hairTop = createOutlinedMesh(new THREE.BoxGeometry(1.6, 0.5, 1.5), whiteHairMat, 0.04);
  hairTop.position.set(0, 1.5, 0);
  guardianGroup.add(hairTop);

  const hairBack = createOutlinedMesh(new THREE.BoxGeometry(1.5, 1.4, 1.1), whiteHairMat, 0.04);
  hairBack.position.set(0, 0.6, -0.2);
  guardianGroup.add(hairBack);

  const leftHairLock = createOutlinedMesh(new THREE.BoxGeometry(0.35, 1.1, 0.35), whiteHairMat, 0.04);
  leftHairLock.position.set(0.85, 0.7, 0.3);
  guardianGroup.add(leftHairLock);

  const rightHairLock = createOutlinedMesh(new THREE.BoxGeometry(0.35, 1.1, 0.35), whiteHairMat, 0.04);
  rightHairLock.position.set(-0.85, 0.7, 0.3);
  guardianGroup.add(rightHairLock);

  // Odangos & twin tails
  const odangoGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  const leftOdango = createOutlinedMesh(odangoGeo, whiteHairMat, 0.05);
  leftOdango.position.set(0.9, 1.7, 0);
  guardianGroup.add(leftOdango);

  const rightOdango = createOutlinedMesh(odangoGeo, whiteHairMat, 0.05);
  rightOdango.position.set(-0.9, 1.7, 0);
  guardianGroup.add(rightOdango);

  const tailGeo = new THREE.BoxGeometry(0.4, 1.5, 0.4);
  const leftTail = createOutlinedMesh(tailGeo, whiteHairMat, 0.04);
  leftTail.position.set(1.1, 0.7, -0.2);
  leftTail.rotation.z = -0.2;
  guardianGroup.add(leftTail);

  const rightTail = createOutlinedMesh(tailGeo, whiteHairMat, 0.04);
  rightTail.position.set(-1.1, 0.7, -0.2);
  rightTail.rotation.z = 0.2;
  guardianGroup.add(rightTail);

  // Tiara & gem
  const tiara = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.2), pencilMat);
  tiara.position.set(0, 1.25, 0.62);
  guardianGroup.add(tiara);

  const centerGem = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.08), inkMat);
  centerGem.position.set(0, 1.25, 0.68);
  guardianGroup.add(centerGem);

  // Eyes & Mouth
  const eyeBaseGeo = new THREE.BoxGeometry(0.35, 0.35, 0.08);
  const leftEyeBase = new THREE.Mesh(eyeBaseGeo, inkMat);
  leftEyeBase.position.set(0.3, 0.95, 0.67);
  guardianGroup.add(leftEyeBase);

  const rightEyeBase = new THREE.Mesh(eyeBaseGeo, inkMat);
  rightEyeBase.position.set(-0.3, 0.95, 0.67);
  guardianGroup.add(rightEyeBase);

  const eyeShineGeo = new THREE.BoxGeometry(0.12, 0.12, 0.04);
  const leftShine = new THREE.Mesh(eyeShineGeo, paperMat);
  leftShine.position.set(0.38, 1.02, 0.7);
  guardianGroup.add(leftShine);

  const rightShine = new THREE.Mesh(eyeShineGeo, paperMat);
  rightShine.position.set(-0.22, 1.02, 0.7);
  guardianGroup.add(rightShine);

  const mouthMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.08), inkMat);
  mouthMesh.position.set(0, 0.55, 0.67);
  guardianGroup.add(mouthMesh);

  // Torso, Collar & Bow
  const torsoMesh = createOutlinedMesh(new THREE.BoxGeometry(1.2, 1.1, 0.9), paperMat, 0.04);
  torsoMesh.position.set(0, -0.2, 0);
  guardianGroup.add(torsoMesh);

  const collarMesh = createOutlinedMesh(new THREE.BoxGeometry(1.5, 0.5, 0.9), darkClothMat, 0.04);
  collarMesh.position.set(0, 0.4, -0.1);
  guardianGroup.add(collarMesh);

  const stripeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.08, 0.92), paperMat);
  stripeMesh.position.set(0, 0.45, -0.1);
  guardianGroup.add(stripeMesh);

  const bowCenter = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.2), pencilMat);
  bowCenter.position.set(0, 0.2, 0.42);
  guardianGroup.add(bowCenter);

  const bowLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.15), pencilMat);
  bowLeft.position.set(0.38, 0.2, 0.4);
  guardianGroup.add(bowLeft);

  const bowRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.15), pencilMat);
  bowRight.position.set(-0.38, 0.2, 0.4);
  guardianGroup.add(bowRight);

  // Arms extending forward
  const armGeo = new THREE.BoxGeometry(0.35, 1.1, 0.35);
  const leftArmGroup = new THREE.Group();
  const leftUpperArm = createOutlinedMesh(armGeo, paperMat, 0.04);
  leftUpperArm.position.set(0, -0.35, 0);
  leftArmGroup.add(leftUpperArm);
  const leftHand = createOutlinedMesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), paperMat, 0.04);
  leftHand.position.set(0, -0.95, 0);
  leftArmGroup.add(leftHand);
  leftArmGroup.position.set(0.85, 0.25, 0);
  leftArmGroup.rotation.x = -1.57;
  guardianGroup.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  const rightUpperArm = createOutlinedMesh(armGeo, paperMat, 0.04);
  rightUpperArm.position.set(0, -0.35, 0);
  rightArmGroup.add(rightUpperArm);
  const rightHand = createOutlinedMesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), paperMat, 0.04);
  rightHand.position.set(0, -0.95, 0);
  rightArmGroup.add(rightHand);
  rightArmGroup.position.set(-0.85, 0.25, 0);
  rightArmGroup.rotation.x = -1.57;
  guardianGroup.add(rightArmGroup);

  // Skirt & Boots (dark charcoal pencil cloth)
  const skirtMesh = createOutlinedMesh(new THREE.BoxGeometry(1.35, 0.5, 0.95), darkClothMat, 0.04);
  skirtMesh.position.set(0, -0.85, 0);
  guardianGroup.add(skirtMesh);

  const legGeo = new THREE.BoxGeometry(0.35, 0.5, 0.35);
  const leftLeg = new THREE.Mesh(legGeo, paperMat);
  leftLeg.position.set(0.3, -1.35, 0);
  guardianGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, paperMat);
  rightLeg.position.set(-0.3, -1.35, 0);
  guardianGroup.add(rightLeg);

  const bootGeo = new THREE.BoxGeometry(0.42, 0.6, 0.5);
  const leftBoot = createOutlinedMesh(bootGeo, darkClothMat, 0.04);
  leftBoot.position.set(0.3, -1.75, 0.04);
  guardianGroup.add(leftBoot);

  const rightBoot = createOutlinedMesh(bootGeo, darkClothMat, 0.04);
  rightBoot.position.set(-0.3, -1.75, 0.04);
  guardianGroup.add(rightBoot);

  // Floating crescent moon wand (the only glowing item)
  const floatingWeapon = new THREE.Group();
  const handleMesh = createOutlinedMesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), glowingWandMat, 0.05);
  floatingWeapon.add(handleMesh);

  const crescentMesh = createOutlinedMesh(new THREE.BoxGeometry(0.5, 0.5, 0.15), glowingWandMat, 0.05);
  crescentMesh.position.set(0, 1.05, 0);
  floatingWeapon.add(crescentMesh);

  const wandGem = createOutlinedMesh(new THREE.BoxGeometry(0.2, 0.2, 0.22), wandGemMat, 0.05);
  wandGem.position.set(0, 1.05, 0);
  floatingWeapon.add(wandGem);

  floatingWeapon.position.set(0, 0.1, 1.8);
  guardianGroup.add(floatingWeapon);

  const wandLight = new THREE.PointLight(0xff1493, 4.0, 7);
  wandLight.position.set(0, 0.1, 1.8);
  guardianGroup.add(wandLight);

  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#0f172a', '#ffffff', '#ffffff');
    bubble.position.set(0.6, 2.1, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    guardianGroup.position.y = Math.sin(elapsed * 1.5) * 0.1;
    guardianGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.08;

    floatingWeapon.position.y = 0.1 + Math.sin(elapsed * 2.5) * 0.12;
    floatingWeapon.rotation.y += 0.02;

    const hue = (elapsed * 0.12) % 1;
    const weaponColor = new THREE.Color().setHSL(hue, 0.9, 0.6);
    glowingWandMat.emissive.copy(weaponColor);
    wandLight.color.copy(weaponColor);

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}

/**
 * 10. SACRED SHRINE PRIESTESS
 * Pristine white paper face, pure white hair with ribbon, dark miko robes with white collar,
 * hakama pants with tabi socks, tall Yumi bow on back, and floating glowing sacred broadhead arrow.
 */
export function setupSacredShrinePriestessScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  speechText: string = 'PURIFY!'
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.2, 4.3);
  camera.lookAt(0, 0.05, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(4, 7, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdddddd, 0.8);
  fillLight.position.set(-4, 5, -4);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.scale.set(0.88, 0.88, 0.88);
  rootGroup.position.set(0, 0.05, 0);
  scene.add(rootGroup);

  const detachControls = attachDragControls(canvas, rootGroup);

  const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const lightGrayMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
  const pencilMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
  const darkClothMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
  const whiteHairMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const inkMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1.0 });

  const priestessGroup = new THREE.Group();
  rootGroup.add(priestessGroup);

  // Head
  const headMesh = createOutlinedMesh(new THREE.BoxGeometry(1.4, 1.3, 1.3), paperMat, 0.04);
  headMesh.position.set(0, 0.9, 0);
  priestessGroup.add(headMesh);

  // White Hair
  const hairTop = createOutlinedMesh(new THREE.BoxGeometry(1.55, 0.45, 1.45), whiteHairMat, 0.04);
  hairTop.position.set(0, 1.48, 0);
  priestessGroup.add(hairTop);

  const hairBack = createOutlinedMesh(new THREE.BoxGeometry(1.5, 1.8, 0.8), whiteHairMat, 0.04);
  hairBack.position.set(0, 0.4, -0.45);
  priestessGroup.add(hairBack);

  const hairLockGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
  const leftHair = createOutlinedMesh(hairLockGeo, whiteHairMat, 0.04);
  leftHair.position.set(0.8, 0.65, 0.25);
  priestessGroup.add(leftHair);

  const rightHair = createOutlinedMesh(hairLockGeo, whiteHairMat, 0.04);
  rightHair.position.set(-0.8, 0.65, 0.25);
  priestessGroup.add(rightHair);

  const ribbonMesh = createOutlinedMesh(new THREE.BoxGeometry(0.6, 0.2, 0.25), paperMat, 0.04);
  ribbonMesh.position.set(0, 0.6, -0.85);
  priestessGroup.add(ribbonMesh);

  // Eyes & Mouth
  const eyeBaseGeo = new THREE.BoxGeometry(0.35, 0.28, 0.08);
  const leftEyeBase = new THREE.Mesh(eyeBaseGeo, inkMat);
  leftEyeBase.position.set(0.3, 0.95, 0.67);
  priestessGroup.add(leftEyeBase);

  const rightEyeBase = new THREE.Mesh(eyeBaseGeo, inkMat);
  rightEyeBase.position.set(-0.3, 0.95, 0.67);
  priestessGroup.add(rightEyeBase);

  const eyeShineGeo = new THREE.BoxGeometry(0.12, 0.1, 0.04);
  const leftShine = new THREE.Mesh(eyeShineGeo, paperMat);
  leftShine.position.set(0.38, 1.0, 0.7);
  priestessGroup.add(leftShine);

  const rightShine = new THREE.Mesh(eyeShineGeo, paperMat);
  rightShine.position.set(-0.22, 1.0, 0.7);
  priestessGroup.add(rightShine);

  const mouthMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.08), inkMat);
  mouthMesh.position.set(0, 0.55, 0.67);
  priestessGroup.add(mouthMesh);

  // Torso & Robes
  const torsoMesh = createOutlinedMesh(new THREE.BoxGeometry(1.25, 1.0, 0.85), darkClothMat, 0.04);
  torsoMesh.position.set(0, -0.2, 0);
  priestessGroup.add(torsoMesh);

  const collarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.2), paperMat);
  collarMesh.position.set(0, 0.35, 0.38);
  priestessGroup.add(collarMesh);

  // Arms straight down
  const armGeo = new THREE.BoxGeometry(0.4, 1.0, 0.4);
  const leftArm = createOutlinedMesh(armGeo, darkClothMat, 0.04);
  leftArm.position.set(0.85, -0.35, 0);
  priestessGroup.add(leftArm);

  const rightArm = createOutlinedMesh(armGeo, darkClothMat, 0.04);
  rightArm.position.set(-0.85, -0.35, 0);
  priestessGroup.add(rightArm);

  const handGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  const leftHand = createOutlinedMesh(handGeo, paperMat, 0.04);
  leftHand.position.set(0.85, -0.9, 0);
  priestessGroup.add(leftHand);

  const rightHand = createOutlinedMesh(handGeo, paperMat, 0.04);
  rightHand.position.set(-0.85, -0.9, 0);
  priestessGroup.add(rightHand);

  // Hakama pants & footwear
  const hakamaMesh = createOutlinedMesh(new THREE.BoxGeometry(1.35, 0.75, 0.9), lightGrayMat, 0.04);
  hakamaMesh.position.set(0, -0.85, 0);
  priestessGroup.add(hakamaMesh);

  const sockGeo = new THREE.BoxGeometry(0.32, 0.45, 0.32);
  const leftSock = new THREE.Mesh(sockGeo, paperMat);
  leftSock.position.set(0.3, -1.35, 0);
  priestessGroup.add(leftSock);

  const rightSock = new THREE.Mesh(sockGeo, paperMat);
  rightSock.position.set(-0.3, -1.35, 0);
  priestessGroup.add(rightSock);

  const shoeGeo = new THREE.BoxGeometry(0.38, 0.25, 0.5);
  const leftShoe = createOutlinedMesh(shoeGeo, pencilMat, 0.04);
  leftShoe.position.set(0.3, -1.6, 0.04);
  priestessGroup.add(leftShoe);

  const rightShoe = createOutlinedMesh(shoeGeo, pencilMat, 0.04);
  rightShoe.position.set(-0.3, -1.6, 0.04);
  priestessGroup.add(rightShoe);

  // Yumi bow on back
  const bowGroup = new THREE.Group();
  const bowBody = createOutlinedMesh(new THREE.BoxGeometry(0.12, 3.2, 0.12), pencilMat, 0.05);
  bowBody.rotation.z = 0.2;
  bowGroup.add(bowBody);
  bowGroup.position.set(0, 0.1, -0.85);
  bowGroup.rotation.y = 0.5;
  priestessGroup.add(bowGroup);

  // Floating sacred broadhead arrow
  const arrowGroup = new THREE.Group();
  const arrowMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00cc55,
    emissiveIntensity: 3.5,
    roughness: 0.05,
    metalness: 0.95,
  });

  const shaftMesh = createOutlinedMesh(new THREE.BoxGeometry(0.12, 2.0, 0.12), arrowMat, 0.08);
  arrowGroup.add(shaftMesh);

  const headGeo = new THREE.ConeGeometry(0.3, 0.7, 4);
  headGeo.rotateX(Math.PI);
  const arrowHeadMesh = createOutlinedMesh(headGeo, arrowMat, 0.08);
  arrowHeadMesh.position.set(0, 1.35, 0);
  arrowGroup.add(arrowHeadMesh);

  const fletch1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.04), paperMat);
  fletch1.position.set(0, -0.95, 0);
  arrowGroup.add(fletch1);

  const fletch2 = fletch1.clone();
  fletch2.rotation.y = Math.PI / 2;
  arrowGroup.add(fletch2);

  arrowGroup.position.set(0, -0.3, 1.8);
  arrowGroup.rotation.z = 0.35;
  priestessGroup.add(arrowGroup);

  const arrowLight = new THREE.PointLight(0x00ff88, 4.0, 8);
  arrowLight.position.set(0, -0.3, 1.8);
  priestessGroup.add(arrowLight);

  if (speechText) {
    const bubble = createSpeechBubbleSprite(speechText, '#0f172a', '#ffffff', '#ffffff');
    bubble.position.set(0.6, 2.1, 0.3);
    rootGroup.add(bubble);
  }

  const clock = new THREE.Clock();
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    priestessGroup.position.y = Math.sin(elapsed * 1.5) * 0.1;
    priestessGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.08;

    arrowGroup.position.y = -0.3 + Math.sin(elapsed * 2.5) * 0.12;
    arrowGroup.rotation.y += 0.02;

    const hue = 0.25 + Math.sin(elapsed * 0.2) * 0.15;
    const color = new THREE.Color().setHSL(hue, 0.95, 0.55);
    arrowMat.emissive.copy(color);
    arrowLight.color.copy(color);

    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  animate();

  return {
    dispose: () => {
      detachControls();
      cleanUpScene(scene, renderer, animId);
    },
    renderer,
    scene,
  };
}
