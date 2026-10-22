import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Builds the 3D Game Room Cafe Retro Arcade building scene.
 * Used for chat room pins on the map and preview modals.
 */
export function setupGameRoomCafeScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  roomTitle?: string
) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(5.5, 4.0, 6.6);
  camera.lookAt(0, 1.2, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const clock = new THREE.Clock();
  let buildingGroup: THREE.Group;
  let signGroup: THREE.Group;
  let signSpotlight: THREE.SpotLight;
  const dynamicLights: Array<{
    light: THREE.PointLight;
    baseIntensity: number;
    speed: number;
    phase: number;
    colorShift?: boolean;
  }> = [];
  const stringLights: THREE.Mesh[] = [];
  const pinballBumpers: THREE.Mesh[] = [];

  const colors = {
    baseDark: 0x334155,
    wallBrick: 0x4f46e5,
    wallTrim: 0x00f0ff,
    woodDark: 0x475569,
    woodLight: 0xa855f7,
    accentCyan: 0x00f0ff,
    accentPink: 0xff007f,
    accentPurple: 0xc084fc,
    accentGreen: 0x10b981,
    accentYellow: 0xffea00,
    accentOrange: 0xff7700,
    warmAmber: 0xfbbf24,
    pavement: 0x475569,
    grass: 0x15803d,
  };

  const mats = {
    wall: new THREE.MeshToonMaterial({ color: colors.wallBrick }),
    trim: new THREE.MeshToonMaterial({ color: colors.wallTrim }),
    wood: new THREE.MeshToonMaterial({ color: colors.woodDark }),
    counterWood: new THREE.MeshToonMaterial({ color: colors.woodLight }),
    roofTile: new THREE.MeshToonMaterial({ color: 0x9333ea }),
    cyanNeon: new THREE.MeshBasicMaterial({ color: colors.accentCyan }),
    pinkNeon: new THREE.MeshBasicMaterial({ color: colors.accentPink }),
    purpleNeon: new THREE.MeshBasicMaterial({ color: colors.accentPurple }),
    greenNeon: new THREE.MeshBasicMaterial({ color: colors.accentGreen }),
    yellowNeon: new THREE.MeshBasicMaterial({ color: colors.accentYellow }),
    orangeNeon: new THREE.MeshBasicMaterial({ color: colors.accentOrange }),
    amberGlow: new THREE.MeshBasicMaterial({ color: colors.warmAmber }),
    pavement: new THREE.MeshToonMaterial({ color: colors.pavement }),
    grass: new THREE.MeshToonMaterial({ color: colors.grass }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
    }),
    gold: new THREE.MeshToonMaterial({ color: 0xffea00 }),
    silver: new THREE.MeshToonMaterial({ color: 0xa8b4ce }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 }),
  };

  function createSignTexture(title?: string) {
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 1024;
    textCanvas.height = 256;
    const ctx = textCanvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    const grad = ctx.createLinearGradient(0, 0, 1024, 256);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#6366f1');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 256);

    ctx.lineWidth = 14;
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 25;
    ctx.strokeRect(16, 16, 992, 224);

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 15;
    ctx.strokeRect(28, 28, 968, 200);

    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff00f0';
    ctx.font = '900 78px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    const displayTitle = title ? title.toUpperCase().slice(0, 22) : 'GAME ROOM';
    ctx.fillText(`🎮 ${displayTitle} 🕹️`, 512, 105);

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f0ff';
    ctx.font = '800 36px sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('• 24/7 RETRO ARCADE & CAFE •', 512, 182);

    const texture = new THREE.CanvasTexture(textCanvas);
    texture.needsUpdate = true;
    return texture;
  }

  function setupLighting() {
    // Crisp, bright ambient light (pure daylight white so all details are visible)
    const ambient = new THREE.AmbientLight(0xffffff, 1.9);
    scene.add(ambient);

    // High-angle sun light
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(6, 12, 7);
    scene.add(sunLight);

    // Front fill light illuminating the front facade, arcade machines, and sign
    const frontFill = new THREE.DirectionalLight(0xfff7ed, 1.8);
    frontFill.position.set(0, 4.0, 7.5);
    scene.add(frontFill);

    // Left/back rim light for 3D depth and separation
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    rimLight.position.set(-6, 6, -5);
    scene.add(rimLight);

    // Warm interior chandelier light
    const interiorChandelier = new THREE.PointLight(0xffedd5, 3.5, 6);
    interiorChandelier.position.set(0, 2.0, 0);
    scene.add(interiorChandelier);

    const cyanLight = new THREE.PointLight(colors.accentCyan, 4.5, 8);
    cyanLight.position.set(-1.0, 1.8, -0.2);
    scene.add(cyanLight);
    dynamicLights.push({ light: cyanLight, baseIntensity: 4.5, speed: 2.1, phase: 0, colorShift: true });

    const pinkLight = new THREE.PointLight(colors.accentPink, 4.5, 8);
    pinkLight.position.set(0.3, 1.6, 0.2);
    scene.add(pinkLight);
    dynamicLights.push({ light: pinkLight, baseIntensity: 4.5, speed: 2.8, phase: 1.2, colorShift: true });

    const greenLight = new THREE.PointLight(colors.accentGreen, 3.8, 7);
    greenLight.position.set(-1.8, 1.5, 1.8);
    scene.add(greenLight);
    dynamicLights.push({ light: greenLight, baseIntensity: 3.8, speed: 3.5, phase: 2.4 });

    const orangeLight = new THREE.PointLight(colors.accentOrange, 3.8, 7);
    orangeLight.position.set(1.8, 1.5, 1.8);
    scene.add(orangeLight);
    dynamicLights.push({ light: orangeLight, baseIntensity: 3.8, speed: 2.2, phase: 3.1 });

    signSpotlight = new THREE.SpotLight(0xffffff, 5.5, 12, Math.PI / 3.8, 0.4);
    signSpotlight.position.set(0, 4.8, 4.0);
    signSpotlight.target.position.set(0, 3.2, 1.5);
    scene.add(signSpotlight);
    scene.add(signSpotlight.target);
  }

  function createSodaVendingMachine() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.45), mats.wood);
    body.position.y = 0.5;
    group.add(body);

    const dispMat = new THREE.MeshBasicMaterial({ color: colors.accentPink });
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.55), dispMat);
    disp.position.set(0, 0.62, 0.23);
    group.add(disp);

    for (let i = 0; i < 6; i++) {
      const btnMat = i % 2 === 0 ? mats.cyanNeon : mats.yellowNeon;
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), btnMat);
      btn.position.set(-0.12 + (i % 3) * 0.12, 0.28 + Math.floor(i / 3) * 0.08, 0.235);
      group.add(btn);
    }

    const coinSlot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), mats.gold);
    coinSlot.position.set(0.14, 0.24, 0.235);
    group.add(coinSlot);

    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.1), new THREE.MeshToonMaterial({ color: 0x05010a }));
    pocket.position.set(0, 0.1, 0.2);
    group.add(pocket);

    return group;
  }

  function createArcadeStool(seatColor: number) {
    const stool = new THREE.Group();

    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), new THREE.MeshBasicMaterial({ color: seatColor }));
    cushion.position.y = 0.38;
    stool.add(cushion);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 8), mats.chrome);
    post.position.y = 0.17;
    stool.add(post);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 16), mats.chrome);
    base.position.y = 0.01;
    stool.add(base);

    const footring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 16), mats.chrome);
    footring.rotation.x = Math.PI / 2;
    footring.position.y = 0.14;
    stool.add(footring);

    return stool;
  }

  function createTokenMachine() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.2), mats.wood);
    body.position.y = 0.25;
    group.add(body);

    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), mats.yellowNeon);
    face.position.set(0, 0.25, 0.105);
    group.add(face);

    const label = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.02), mats.pinkNeon);
    label.position.set(0, 0.38, 0.11);
    group.add(label);

    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), mats.chrome);
    slot.position.set(0, 0.25, 0.11);
    group.add(slot);

    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.08), mats.chrome);
    tray.position.set(0, 0.08, 0.12);
    group.add(tray);

    return group;
  }

  function createBoombox() {
    const boom = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.15), mats.trim);
    body.position.y = 0.1;
    boom.add(body);

    [-0.12, 0.12].forEach((x) => {
      const spk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), mats.pinkNeon);
      spk.rotation.x = Math.PI / 2;
      spk.position.set(x, 0.1, 0.08);
      boom.add(spk);
    });

    const tape = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.08), mats.yellowNeon);
    tape.position.set(0, 0.09, 0.076);
    boom.add(tape);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.02), mats.chrome);
    handle.position.set(0, 0.22, 0);
    boom.add(handle);

    return boom;
  }

  function createNeonStreetLamp() {
    const lamp = new THREE.Group();

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.2, 12), mats.trim);
    pole.position.y = 1.1;
    lamp.add(pole);

    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), mats.cyanNeon);
    globe.position.y = 2.2;
    lamp.add(globe);

    const light = new THREE.PointLight(colors.accentCyan, 2.2, 5);
    light.position.y = 2.2;
    lamp.add(light);

    return lamp;
  }

  function createArcadeCabinet(colorAccent: number, screenColor: number) {
    const cabinet = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
    const bodyMat = new THREE.MeshToonMaterial({ color: colors.woodDark });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    cabinet.add(body);

    const trimGeo = new THREE.BoxGeometry(0.03, 1.22, 0.52);
    const trimMat = new THREE.MeshBasicMaterial({ color: colorAccent });
    const sideL = new THREE.Mesh(trimGeo, trimMat);
    sideL.position.set(-0.25, 0.6, 0);
    cabinet.add(sideL);

    const sideR = new THREE.Mesh(trimGeo, trimMat);
    sideR.position.set(0.25, 0.6, 0);
    cabinet.add(sideR);

    const screenGeo = new THREE.PlaneGeometry(0.38, 0.3);
    const screenMat = new THREE.MeshBasicMaterial({ color: screenColor });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.82, 0.255);
    screen.rotation.x = -0.15;
    cabinet.add(screen);

    const panelGeo = new THREE.BoxGeometry(0.44, 0.1, 0.2);
    const panelMat = new THREE.MeshToonMaterial({ color: 0x111122 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 0.58, 0.28);
    panel.rotation.x = 0.2;
    cabinet.add(panel);

    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8), mats.silver);
    stick.position.set(-0.1, 0.64, 0.3);
    cabinet.add(stick);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), mats.pinkNeon);
    knob.position.set(-0.1, 0.68, 0.3);
    cabinet.add(knob);

    [-0.02, 0.06, 0.12].forEach((xOff, idx) => {
      const btnMat = idx === 0 ? mats.cyanNeon : idx === 1 ? mats.yellowNeon : mats.greenNeon;
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), btnMat);
      btn.position.set(xOff, 0.63, 0.3);
      cabinet.add(btn);
    });

    const marqueeGeo = new THREE.BoxGeometry(0.46, 0.15, 0.1);
    const marqueeMat = new THREE.MeshBasicMaterial({ color: colorAccent });
    const marquee = new THREE.Mesh(marqueeGeo, marqueeMat);
    marquee.position.set(0, 1.12, 0.22);
    cabinet.add(marquee);

    return cabinet;
  }

  function createPinballMachine() {
    const pinball = new THREE.Group();

    const tableBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.95), mats.wood);
    tableBody.position.set(0, 0.45, 0);
    tableBody.rotation.x = 0.12;
    pinball.add(tableBody);

    const pfGeo = new THREE.PlaneGeometry(0.48, 0.85);
    const pfMat = new THREE.MeshBasicMaterial({ color: colors.accentPink });
    const pf = new THREE.Mesh(pfGeo, pfMat);
    pf.position.set(0, 0.58, 0);
    pf.rotation.x = -Math.PI / 2 + 0.12;
    pinball.add(pf);

    for (let i = 0; i < 3; i++) {
      const bump = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.04, 12), mats.cyanNeon);
      bump.position.set((i - 1) * 0.12, 0.59 + (i % 2) * 0.02, -0.1 + i * 0.12);
      pinball.add(bump);
      pinballBumpers.push(bump);
    }

    [
      [-0.24, -0.42],
      [0.24, -0.42],
      [-0.24, 0.42],
      [0.24, 0.42],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.48, 8), mats.chrome);
      leg.position.set(lx, 0.24, lz);
      pinball.add(leg);
    });

    const backbox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.15), mats.wood);
    backbox.position.set(0, 0.92, -0.42);
    pinball.add(backbox);

    const backArt = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.42), mats.yellowNeon);
    backArt.position.set(0, 0.92, -0.34);
    pinball.add(backArt);

    return pinball;
  }

  function createClawMachine() {
    const clawGroup = new THREE.Group();

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), mats.wood);
    base.position.y = 0.25;
    clawGroup.add(base);

    const glassCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.75, 0.58), mats.glass);
    glassCabinet.position.y = 0.875;
    clawGroup.add(glassCabinet);

    [
      [-0.28, -0.28],
      [0.28, -0.28],
      [-0.28, 0.28],
      [0.28, 0.28],
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.75, 0.04), mats.greenNeon);
      post.position.set(px, 0.875, pz);
      clawGroup.add(post);
    });

    const toyColors = [colors.accentPink, colors.accentCyan, colors.accentYellow, colors.accentGreen, colors.accentPurple];
    for (let i = 0; i < 12; i++) {
      const toyMat = new THREE.MeshBasicMaterial({ color: toyColors[i % toyColors.length] });
      const toy = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), toyMat);
      toy.position.set((Math.random() - 0.5) * 0.4, 0.55 + Math.random() * 0.1, (Math.random() - 0.5) * 0.4);
      clawGroup.add(toy);
    }

    const topCap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.62), mats.greenNeon);
    topCap.position.y = 1.34;
    clawGroup.add(topCap);

    return clawGroup;
  }

  function buildBuildingStructure() {
    const wallGroup = new THREE.Group();

    const intFloorGeo = new THREE.BoxGeometry(3.6, 0.05, 2.6);
    const intFloorMat = new THREE.MeshToonMaterial({ color: 0x312e81 });
    const intFloor = new THREE.Mesh(intFloorGeo, intFloorMat);
    intFloor.position.set(0, 0.025, 0.1);
    wallGroup.add(intFloor);

    const backWallGeo = new THREE.BoxGeometry(3.8, 2.4, 0.2);
    const backWall = new THREE.Mesh(backWallGeo, mats.wall);
    backWall.position.set(0, 1.2, -1.2);
    wallGroup.add(backWall);

    const leftWallGeo = new THREE.BoxGeometry(0.2, 2.4, 2.8);
    const leftWall = new THREE.Mesh(leftWallGeo, mats.wall);
    leftWall.position.set(-1.9, 1.2, 0.1);
    wallGroup.add(leftWall);

    const rightWallGeo = new THREE.BoxGeometry(0.2, 2.4, 2.8);
    const rightWall = new THREE.Mesh(rightWallGeo, mats.wall);
    rightWall.position.set(1.9, 1.2, 0.1);
    wallGroup.add(rightWall);

    const pil1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 0.2), mats.wall);
    pil1.position.set(-1.75, 1.2, 1.4);
    wallGroup.add(pil1);

    const pil2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 0.2), mats.wall);
    pil2.position.set(1.75, 1.2, 1.4);
    wallGroup.add(pil2);

    const pilMid = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 0.2), mats.wall);
    pilMid.position.set(0.1, 1.2, 1.4);
    wallGroup.add(pilMid);

    const trimTop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 0.08), mats.cyanNeon);
    trimTop.position.set(0, 2.38, 1.45);
    wallGroup.add(trimTop);

    buildingGroup.add(wallGroup);
  }

  function buildInteriorDetails() {
    const intGroup = new THREE.Group();

    const fighterArcade = createArcadeCabinet(colors.accentPink, colors.accentYellow);
    fighterArcade.position.set(-1.3, 0, -0.6);
    intGroup.add(fighterArcade);

    const stool1 = createArcadeStool(colors.accentPink);
    stool1.position.set(-1.3, 0, -0.15);
    intGroup.add(stool1);

    const pinballMachine = createPinballMachine();
    pinballMachine.position.set(-0.5, 0, -0.5);
    pinballMachine.rotation.y = 0.2;
    intGroup.add(pinballMachine);

    const clawMachine = createClawMachine();
    clawMachine.position.set(1.3, 0, -0.5);
    intGroup.add(clawMachine);

    const leadBoard = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.04), mats.wood);
    leadBoard.position.set(-0.4, 1.7, -1.08);
    const leadScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.32), mats.greenNeon);
    leadScreen.position.set(-0.4, 1.7, -1.05);
    intGroup.add(leadBoard);
    intGroup.add(leadScreen);

    const counterGeo = new THREE.BoxGeometry(1.2, 0.85, 0.5);
    const counter = new THREE.Mesh(counterGeo, mats.counterWood);
    counter.position.set(0.6, 0.425, 0.5);
    intGroup.add(counter);

    [0.3, 0.8].forEach((xPos) => {
      const counterStool = createArcadeStool(colors.accentCyan);
      counterStool.position.set(xPos, 0, 0.9);
      intGroup.add(counterStool);
    });

    const espGeo = new THREE.BoxGeometry(0.35, 0.35, 0.25);
    const espresso = new THREE.Mesh(espGeo, mats.chrome);
    espresso.position.set(0.6, 1.025, 0.5);
    intGroup.add(espresso);

    const regGeo = new THREE.BoxGeometry(0.2, 0.15, 0.2);
    const reg = new THREE.Mesh(regGeo, mats.yellowNeon);
    reg.position.set(0.25, 0.925, 0.5);
    intGroup.add(reg);

    const neonArt = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), mats.pinkNeon);
    neonArt.position.set(0.6, 1.7, -1.08);
    intGroup.add(neonArt);

    buildingGroup.add(intGroup);
  }

  function buildRoofAndMarquee() {
    const roofGroup = new THREE.Group();

    const roofGeo = new THREE.ConeGeometry(3.2, 1.1, 4);
    const roof = new THREE.Mesh(roofGeo, mats.roofTile);
    roof.position.set(0, 3.0, 0.1);
    roof.rotation.y = Math.PI / 4;
    roofGroup.add(roof);

    const eavesGeo = new THREE.BoxGeometry(4.2, 0.18, 3.2);
    const eaves = new THREE.Mesh(eavesGeo, mats.trim);
    eaves.position.set(0, 2.45, 0.1);
    roofGroup.add(eaves);

    signGroup = new THREE.Group();
    signGroup.position.set(0, 3.25, 1.55);

    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.75, 0.12), mats.wood);
    signGroup.add(signFrame);

    const signTexture = createSignTexture(roomTitle);
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(2.58, 0.63), signMat);
    signBoard.position.z = 0.065;
    signGroup.add(signBoard);

    [-1.15, 1.15].forEach((xPos) => {
      const ctrl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.08), mats.yellowNeon);
      ctrl.position.set(xPos, 0, 0.08);
      signGroup.add(ctrl);
    });

    roofGroup.add(signGroup);
    buildingGroup.add(roofGroup);
  }

  function buildOutdoorArcadeArea() {
    const outdoorGroup = new THREE.Group();

    const racerArcade = createArcadeCabinet(colors.accentCyan, colors.accentYellow);
    racerArcade.position.set(-1.8, 0, 1.8);
    racerArcade.rotation.y = Math.PI / 6;

    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), mats.pinkNeon);
    wheel.position.set(-1.8, 0.78, 2.05);
    wheel.rotation.x = 0.4;
    outdoorGroup.add(racerArcade);
    outdoorGroup.add(wheel);

    const stoolRacer = createArcadeStool(colors.accentYellow);
    stoolRacer.position.set(-1.55, 0, 2.2);
    outdoorGroup.add(stoolRacer);

    const danceArcade = createArcadeCabinet(colors.accentPink, colors.accentGreen);
    danceArcade.position.set(1.7, 0, 1.8);
    danceArcade.rotation.y = -Math.PI / 6;
    outdoorGroup.add(danceArcade);

    const padMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.65), mats.trim);
    padMesh.position.set(1.5, 0.025, 2.3);
    outdoorGroup.add(padMesh);

    const arrowCols = [colors.accentPink, colors.accentCyan, colors.accentGreen, colors.accentYellow];
    [
      [-0.18, 0],
      [0.18, 0],
      [0, -0.18],
      [0, 0.18],
    ].forEach((pos, idx) => {
      const arrow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: arrowCols[idx] }));
      arrow.position.set(1.5 + pos[0], 0.03, 2.3 + pos[1]);
      outdoorGroup.add(arrow);
    });

    const sodaMachine = createSodaVendingMachine();
    sodaMachine.position.set(-2.2, 0, 0.3);
    sodaMachine.rotation.y = Math.PI / 2;
    outdoorGroup.add(sodaMachine);

    buildingGroup.add(outdoorGroup);
  }

  function buildOutdoorGameProps() {
    const propsGroup = new THREE.Group();

    const joyBase = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.45), mats.wood);
    joyBase.position.set(-2.5, 0.125, 2.4);
    propsGroup.add(joyBase);

    const joyStick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 12), mats.chrome);
    joyStick.position.set(-2.5, 0.38, 2.4);
    joyStick.rotation.z = -0.15;
    propsGroup.add(joyStick);

    const joyBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), mats.pinkNeon);
    joyBall.position.set(-2.55, 0.54, 2.4);
    propsGroup.add(joyBall);

    [-0.1, 0.02].forEach((xOff, i) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), i === 0 ? mats.cyanNeon : mats.yellowNeon);
      b.position.set(-2.4 + xOff, 0.26, 2.45);
      propsGroup.add(b);
    });

    const tokenMachine = createTokenMachine();
    tokenMachine.position.set(-1.85, 1.0, 0.7);
    tokenMachine.rotation.y = Math.PI / 2;
    propsGroup.add(tokenMachine);

    const streetLamp = createNeonStreetLamp();
    streetLamp.position.set(2.6, 0, 1.2);
    propsGroup.add(streetLamp);

    const boombox = createBoombox();
    boombox.position.set(-0.8, 0, 2.5);
    boombox.rotation.y = 0.2;
    propsGroup.add(boombox);

    const cartGroup = new THREE.Group();
    cartGroup.position.set(1.82, 0.5, 0.1);
    cartGroup.rotation.y = -Math.PI / 2;
    cartGroup.rotation.z = -0.12;

    const cartBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.82, 0.1), mats.trim);
    cartGroup.add(cartBody);

    const cartLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.48), mats.yellowNeon);
    cartLabel.position.z = 0.052;
    cartGroup.add(cartLabel);

    propsGroup.add(cartGroup);

    const gumballGroup = new THREE.Group();
    gumballGroup.position.set(0.72, 0, 1.85);

    const gBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.45, 12), mats.pinkNeon);
    gBase.position.y = 0.225;
    gumballGroup.add(gBase);

    const gGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), mats.glass);
    gGlobe.position.y = 0.55;
    gumballGroup.add(gGlobe);

    const capCols = [colors.accentCyan, colors.accentPink, colors.accentYellow, colors.accentGreen];
    for (let i = 0; i < 7; i++) {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 8, 8),
        new THREE.MeshBasicMaterial({ color: capCols[i % capCols.length] })
      );
      cap.position.set((Math.random() - 0.5) * 0.14, 0.48 + Math.random() * 0.12, (Math.random() - 0.5) * 0.14);
      gumballGroup.add(cap);
    }
    propsGroup.add(gumballGroup);

    const coinSignGroup = new THREE.Group();
    coinSignGroup.position.set(-1.8, 1.6, -0.3);
    coinSignGroup.rotation.y = Math.PI / 2;

    const signBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.06), mats.wood);
    coinSignGroup.add(signBox);

    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.28), mats.yellowNeon);
    signFace.position.z = 0.032;
    coinSignGroup.add(signFace);

    propsGroup.add(coinSignGroup);

    [-2.7, 2.7].forEach((xPos) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(xPos, 0, 2.7);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.6, 8), mats.trim);
      trunk.position.y = 0.8;
      treeGroup.add(trunk);

      for (let a = 0; a < 5; a++) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.12), a % 2 === 0 ? mats.cyanNeon : mats.pinkNeon);
        leaf.position.set(0, 1.6, 0);
        leaf.rotation.y = (a * Math.PI * 2) / 5;
        leaf.rotation.z = -0.3;
        treeGroup.add(leaf);
      }
      propsGroup.add(treeGroup);
    });

    buildingGroup.add(propsGroup);
  }

  function buildDecorations() {
    const wireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.7, 2.4, 1.45),
      new THREE.Vector3(-0.8, 2.22, 1.5),
      new THREE.Vector3(0, 2.38, 1.5),
      new THREE.Vector3(0.8, 2.2, 1.5),
      new THREE.Vector3(1.7, 2.4, 1.45),
    ]);

    const points = wireCurve.getPoints(20);
    points.forEach((pt, index) => {
      if (index % 3 === 0) {
        const bulbMat = index % 6 === 0 ? mats.cyanNeon : index % 6 === 3 ? mats.pinkNeon : mats.yellowNeon;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), bulbMat);
        bulb.position.copy(pt);
        buildingGroup.add(bulb);
        stringLights.push(bulb);
      }
    });
  }

  function buildScene() {
    buildingGroup = new THREE.Group();

    const baseGeo = new THREE.BoxGeometry(6.4, 0.28, 6.4);
    const baseMesh = new THREE.Mesh(baseGeo, mats.pavement);
    baseMesh.position.y = -0.14;
    scene.add(baseMesh);

    const grassGeo = new THREE.BoxGeometry(7.0, 0.1, 7.0);
    const grassMesh = new THREE.Mesh(grassGeo, mats.grass);
    grassMesh.position.y = -0.32;
    scene.add(grassMesh);

    for (let x = -2.8; x <= 2.8; x += 0.8) {
      for (let z = 1.6; z <= 2.8; z += 0.8) {
        if (Math.random() > 0.1) {
          const tileGeo = new THREE.BoxGeometry(0.74, 0.04, 0.74);
          const isNeonBorder = Math.random() > 0.8;
          const tileMat = isNeonBorder
            ? mats.purpleNeon
            : new THREE.MeshToonMaterial({
                color: Math.random() > 0.5 ? 0x1b1035 : 0x271648,
              });
          const tile = new THREE.Mesh(tileGeo, tileMat);
          tile.position.set(x, 0.01, z);
          scene.add(tile);
        }
      }
    }

    buildBuildingStructure();
    buildInteriorDetails();
    buildRoofAndMarquee();
    buildOutdoorArcadeArea();
    buildOutdoorGameProps();
    buildDecorations();

    scene.add(buildingGroup);
  }

  setupLighting();
  buildScene();

  let animId: number;
  function animate() {
    animId = requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    if (buildingGroup) {
      buildingGroup.rotation.y = Math.sin(time * 0.2) * 0.04;
    }

    if (signGroup) {
      signGroup.position.y = 3.25 + Math.sin(time * 1.8) * 0.03;
    }

    if (signSpotlight) {
      signSpotlight.intensity = 4.0 + Math.sin(time * 3.0) * 0.8;
    }

    dynamicLights.forEach((item) => {
      item.light.intensity = item.baseIntensity + Math.sin(time * item.speed + item.phase) * 1.0;
      if (item.colorShift) {
        const hue = (time * 0.08 + item.phase) % 1.0;
        item.light.color.setHSL(hue, 1.0, 0.5);
      }
    });

    pinballBumpers.forEach((bumper, idx) => {
      const s = 1.0 + Math.sin(time * 7.0 + idx * 1.5) * 0.25;
      bumper.scale.set(s, 1, s);
    });

    stringLights.forEach((light, idx) => {
      const scale = 0.8 + Math.sin(time * 5.0 + idx) * 0.35;
      light.scale.set(scale, scale, scale);
    });

    renderer.render(scene, camera);
  }

  animate();

  return {
    dispose: () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    },
  };
}

interface GameRoomBuilding3DProps {
  roomTitle?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const GameRoomBuilding3D: React.FC<GameRoomBuilding3DProps> = ({
  roomTitle,
  width = 160,
  height = 140,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const { dispose } = setupGameRoomCafeScene(canvasRef.current, width, height, roomTitle);
    return () => {
      dispose();
    };
  }, [width, height, roomTitle]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={`block pointer-events-none ${className}`}
    />
  );
};
