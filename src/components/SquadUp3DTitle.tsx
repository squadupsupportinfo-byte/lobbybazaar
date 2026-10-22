import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SquadUp3DTitleProps {
  className?: string;
  height?: string | number;
  interactive?: boolean;
  transparentBg?: boolean;
  compact?: boolean;
}

export const SquadUp3DTitle: React.FC<SquadUp3DTitleProps> = ({
  className = '',
  height = '300px',
  interactive = true,
  transparentBg = true,
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const initialWidth = container.clientWidth || 600;
    const initialHeight = container.clientHeight || 300;

    // Scene setup with deep dark background matching reference
    const scene = new THREE.Scene();
    if (!transparentBg) {
      scene.background = new THREE.Color(0x010502);
    }

    // Perspective Camera positioned for dramatic 3D title angle
    const initialAspect = Math.max(0.1, initialWidth / initialHeight);
    const camera = new THREE.PerspectiveCamera(36, initialAspect, 0.1, 1000);
    camera.position.set(0, 1.0, 50);

    // WebGL Renderer with High Dynamic Range Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: transparentBg,
      powerPreference: 'high-performance',
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.95; // Brighter exposure for high contrast visibility
    if (transparentBg) {
      renderer.setClearColor(0x000000, 0);
    }

    container.replaceChildren(renderer.domElement);

    // Bright direct Frontal Face Light illuminating letter surfaces
    const frontFaceLight = new THREE.DirectionalLight(0xf4fff2, 4.8);
    frontFaceLight.position.set(0, 10, 48);
    scene.add(frontFaceLight);

    // Balanced Hemisphere Light for radiant green ambient filling
    const hemiLight = new THREE.HemisphereLight(0x77ff88, 0x0c3a16, 2.8);
    scene.add(hemiLight);

    // Ambient Illumination for bevel details
    const ambientLight = new THREE.AmbientLight(0x22aa3b, 3.8);
    scene.add(ambientLight);

    // Primary Key Light for sharp metallic specular glints on top bevels
    const keyLight = new THREE.SpotLight(0xffffff, 18);
    keyLight.position.set(-20, 30, 40);
    keyLight.angle = Math.PI / 3;
    keyLight.penumbra = 0.3;
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Vibrant Electric Lime Fill Light
    const greenFill = new THREE.PointLight(0x39ff14, 18, 100);
    greenFill.position.set(22, -10, 30);
    scene.add(greenFill);

    // Top Specular Glint Light for chamfer edge shines
    const topGlint = new THREE.SpotLight(0x88ff44, 22);
    topGlint.position.set(2, 32, 26);
    topGlint.angle = Math.PI / 2.5;
    topGlint.penumbra = 0.5;
    scene.add(topGlint);

    // Back Rim Light to separate extrusion from darkness
    const backRim = new THREE.PointLight(0x22ff88, 16, 75);
    backRim.position.set(0, 2, -18);
    scene.add(backRim);

    // Central Backdrop Glow matching image vignette
    const bgGlow = new THREE.PointLight(0x188836, 12, 60);
    bgGlow.position.set(0, -2, -12);
    scene.add(bgGlow);

    // Helper function to create soft glowing particle texture
    function createParticleTexture(): THREE.CanvasTexture {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(160, 255, 170, 0.95)');
        gradient.addColorStop(0.5, 'rgba(40, 240, 80, 0.45)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    }

    // Helper function to create starburst glint lens flare texture
    function createGlintTexture(): THREE.CanvasTexture {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 128, 128);

        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(190, 255, 200, 0.9)');
        grad.addColorStop(0.6, 'rgba(50, 255, 110, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(64, 8);
        ctx.lineTo(64, 120);
        ctx.moveTo(8, 64);
        ctx.lineTo(120, 64);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(140, 255, 170, 0.7)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(24, 24);
        ctx.lineTo(104, 104);
        ctx.moveTo(104, 24);
        ctx.lineTo(24, 104);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(canvas);
    }

    const particleTex = createParticleTexture();
    const glintTex = createGlintTexture();

    // 1. Orbiting Plasma Light Orbs around the Title
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    const orbData: Array<{
      light: THREE.PointLight;
      speed: number;
      radiusX: number;
      radiusY: number;
      phase: number;
      tilt: number;
    }> = [];
    const orbColors = [0x55ff66, 0x88ff44, 0x00ffaa];

    for (let i = 0; i < 3; i++) {
      const orbLight = new THREE.PointLight(orbColors[i], 6, 22);

      const spriteMat = new THREE.SpriteMaterial({
        map: particleTex,
        color: orbColors[i],
        transparent: true,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(3.4, 3.4, 1);
      orbLight.add(sprite);
      orbGroup.add(orbLight);

      orbData.push({
        light: orbLight,
        speed: 0.9 + i * 0.35,
        radiusX: 20 + i * 2.5,
        radiusY: 8 + i * 2,
        phase: i * ((Math.PI * 2) / 3),
        tilt: (i - 1) * 0.35,
      });
    }

    // 2. Swirling Energy Dust Particles around letters
    const particleCount = compact ? 120 : 280;
    const pGeometry = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pData: Array<{
      baseX: number;
      baseY: number;
      baseZ: number;
      speed: number;
      angle: number;
      radius: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 46;
      const y = (Math.random() - 0.5) * 22;
      const z = (Math.random() - 0.5) * 16;

      pPositions[i * 3] = x;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = z;

      pData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        speed: 0.4 + Math.random() * 1.2,
        angle: Math.random() * Math.PI * 2,
        radius: 0.8 + Math.random() * 3.5,
      });
    }

    pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const pMaterial = new THREE.PointsMaterial({
      size: 1.1,
      map: particleTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x77ff88,
      opacity: 0.85,
    });

    const particleSystem = new THREE.Points(pGeometry, pMaterial);
    scene.add(particleSystem);

    function createSquadupShapes() {
      const shapes: Array<{ shape: THREE.Shape; width: number }> = [];

      // --- 1. 'S' - Dynamic Swooping Capital S ---
      const s = new THREE.Shape();
      s.moveTo(8.8, 8.4);
      s.lineTo(2.4, 8.4);
      s.quadraticCurveTo(0.0, 8.4, 0.0, 5.9);
      s.quadraticCurveTo(0.0, 3.8, 2.6, 3.2);
      s.lineTo(6.2, 2.5);
      s.quadraticCurveTo(8.4, 2.0, 8.4, 0.7);
      s.quadraticCurveTo(8.4, -0.6, 5.4, -0.6);
      s.lineTo(0.6, -0.6);
      s.lineTo(0.0, -2.4);
      s.lineTo(5.8, -2.4);
      s.quadraticCurveTo(11.0, -2.4, 11.0, 0.8);
      s.quadraticCurveTo(11.0, 3.5, 7.8, 4.2);
      s.lineTo(4.4, 4.8);
      s.quadraticCurveTo(2.3, 5.2, 2.3, 6.4);
      s.quadraticCurveTo(2.3, 6.9, 3.6, 6.9);
      s.lineTo(9.2, 6.9);
      s.closePath();
      shapes.push({ shape: s, width: 10.2 });

      // --- 2. 'q' - Lowercase q with Extended Descender ---
      const q = new THREE.Shape();
      q.moveTo(5.3, 5.3);
      q.lineTo(5.3, -5.2); // Extended descender tail
      q.lineTo(3.2, -5.2);
      q.lineTo(3.2, -0.2);
      q.lineTo(2.2, -0.2);
      q.quadraticCurveTo(0.0, -0.2, 0.0, 2.5);
      q.quadraticCurveTo(0.0, 5.3, 2.2, 5.3);
      q.closePath();

      const qHole = new THREE.Path();
      qHole.moveTo(3.2, 3.7);
      qHole.quadraticCurveTo(1.8, 3.7, 1.8, 2.5);
      qHole.quadraticCurveTo(1.8, 1.3, 3.2, 1.3);
      qHole.lineTo(3.2, 3.7);
      qHole.closePath();
      q.holes.push(qHole);
      shapes.push({ shape: q, width: 5.6 });

      // --- 3. 'u' - Lowercase u ---
      const u1 = new THREE.Shape();
      u1.moveTo(0.0, 5.3);
      u1.lineTo(2.1, 5.3);
      u1.lineTo(2.1, 1.6);
      u1.quadraticCurveTo(2.1, 1.3, 2.8, 1.3);
      u1.quadraticCurveTo(3.5, 1.3, 3.5, 1.6);
      u1.lineTo(3.5, 5.3);
      u1.lineTo(5.6, 5.3);
      u1.lineTo(5.6, 1.8);
      u1.quadraticCurveTo(5.6, -0.2, 2.8, -0.2);
      u1.quadraticCurveTo(0.0, -0.2, 0.0, 1.8);
      u1.closePath();
      shapes.push({ shape: u1, width: 5.8 });

      // --- 4. 'a' - Lowercase a ---
      const a = new THREE.Shape();
      a.moveTo(2.2, 5.3);
      a.lineTo(5.4, 5.3);
      a.lineTo(5.4, 0.0);
      a.lineTo(3.2, 0.0);
      a.quadraticCurveTo(0.0, 0.0, 0.0, 2.5);
      a.quadraticCurveTo(0.0, 5.3, 2.2, 5.3);
      a.closePath();

      const aHole = new THREE.Path();
      aHole.moveTo(3.2, 3.7);
      aHole.lineTo(2.5, 3.7);
      aHole.quadraticCurveTo(1.8, 3.7, 1.8, 2.5);
      aHole.quadraticCurveTo(1.8, 1.3, 2.5, 1.3);
      aHole.lineTo(3.2, 1.3);
      aHole.closePath();
      a.holes.push(aHole);
      shapes.push({ shape: a, width: 5.6 });

      // --- 5. 'd' - Lowercase d with High Ascender Stem ---
      const d = new THREE.Shape();
      d.moveTo(3.2, 8.8); // Tall ascender stem matching image
      d.lineTo(5.4, 8.8);
      d.lineTo(5.4, 0.0);
      d.lineTo(3.0, 0.0);
      d.quadraticCurveTo(0.0, 0.0, 0.0, 2.5);
      d.quadraticCurveTo(0.0, 5.3, 3.0, 5.3);
      d.closePath();

      const dHole = new THREE.Path();
      dHole.moveTo(3.2, 3.7);
      dHole.quadraticCurveTo(1.8, 3.7, 1.8, 2.5);
      dHole.quadraticCurveTo(1.8, 1.3, 3.2, 1.3);
      dHole.lineTo(3.2, 3.7);
      dHole.closePath();
      d.holes.push(dHole);
      shapes.push({ shape: d, width: 5.6 });

      // --- 6. 'u' - Second Lowercase u ---
      const u2 = new THREE.Shape();
      u2.moveTo(0.0, 5.3);
      u2.lineTo(2.1, 5.3);
      u2.lineTo(2.1, 1.6);
      u2.quadraticCurveTo(2.1, 1.3, 2.8, 1.3);
      u2.quadraticCurveTo(3.5, 1.3, 3.5, 1.6);
      u2.lineTo(3.5, 5.3);
      u2.lineTo(5.6, 5.3);
      u2.lineTo(5.6, 1.8);
      u2.quadraticCurveTo(5.6, -0.2, 2.8, -0.2);
      u2.quadraticCurveTo(0.0, -0.2, 0.0, 1.8);
      u2.closePath();
      shapes.push({ shape: u2, width: 5.8 });

      // --- 7. 'p' - Lowercase p with Extended Descender ---
      const p = new THREE.Shape();
      p.moveTo(0.0, 5.3);
      p.lineTo(3.0, 5.3);
      p.quadraticCurveTo(5.4, 5.3, 5.4, 2.5);
      p.quadraticCurveTo(5.4, -0.2, 3.0, -0.2);
      p.lineTo(2.1, -0.2);
      p.lineTo(2.1, -5.2); // Extended descender tail
      p.lineTo(0.0, -5.2);
      p.closePath();

      const pHole = new THREE.Path();
      pHole.moveTo(2.1, 3.7);
      pHole.lineTo(2.8, 3.7);
      pHole.quadraticCurveTo(3.6, 3.7, 3.6, 2.5);
      pHole.quadraticCurveTo(3.6, 1.3, 2.8, 1.3);
      pHole.lineTo(2.1, 1.3);
      pHole.closePath();
      p.holes.push(pHole);
      shapes.push({ shape: p, width: 5.6 });

      return shapes;
    }

    // Extrusion settings matching reference image's deep profile & crisp chamfer
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 3,
      depth: 3.4,
      bevelEnabled: true,
      bevelThickness: 0.72,
      bevelSize: 0.48,
      bevelOffset: 0,
      bevelSegments: 7,
    };

    // Applies 15-degree italic forward shear incline
    function applyItalicShear(geometry: THREE.BufferGeometry, shearAngle = 0.27) {
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setX(i, x + y * shearAngle);
      }
      geometry.computeVertexNormals();
    }

    // High Visibility Vibrant Emerald-Lime Front Cap (Clear diffuse + rich inner emission)
    const frontMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x45ff24, // High-brightness neon lime green
      emissive: 0x1ee838, // Radiant bright inner green emission
      emissiveIntensity: 0.75, // Glows visibly even in dark scenes
      metalness: 0.18, // Lowered metalness so color doesn't vanish into black void
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 1.0,
    });

    // Visible Metallic Forest-Green Side Extrusion Material
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x127c2e, // Rich visible forest emerald green
      emissive: 0x094819,
      emissiveIntensity: 0.55,
      metalness: 0.32,
      roughness: 0.22,
    });

    const letterMaterials = [frontMaterial, sideMaterial];

    const titleGroup = new THREE.Group();
    scene.add(titleGroup);

    const letterMeshes: THREE.Mesh[] = [];
    const letterData = createSquadupShapes();

    // Calculate width for tight center alignment
    const letterGap = 0.42;
    let totalWidth = 0;
    letterData.forEach((item) => {
      totalWidth += item.width + letterGap;
    });
    totalWidth -= letterGap;

    let currentX = -totalWidth / 2;

    letterData.forEach((item, index) => {
      const geometry = new THREE.ExtrudeGeometry(item.shape, extrudeSettings);

      // Apply forward slant shear transformation
      applyItalicShear(geometry, 0.27);

      const mesh = new THREE.Mesh(geometry, letterMaterials);
      mesh.position.x = currentX;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      mesh.userData = {
        baseX: currentX,
        phase: index * 0.35,
      };

      letterMeshes.push(mesh);
      titleGroup.add(mesh);

      currentX += item.width + letterGap;
    });

    // Initial view tilt matching reference photo angle
    titleGroup.rotation.x = 0.08;
    titleGroup.rotation.y = -0.07;

    // Center titleGroup geometry exactly
    const box = new THREE.Box3().setFromObject(titleGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 3. Chamfer Starburst Glints positioned at key vertices of letters
    const glintPositions = [
      new THREE.Vector3(-14.2, 8.4, 1.9), // Top crown of S
      new THREE.Vector3(-15.6, -2.4, 1.9), // Bottom swoop of S
      new THREE.Vector3(-7.2, 5.3, 1.9), // Upper corner of q
      new THREE.Vector3(-7.2, -5.2, 1.9), // Extended tip of q descender
      new THREE.Vector3(2.6, 8.8, 1.9), // Tall ascender tip of d
      new THREE.Vector3(12.4, -5.2, 1.9), // Descender tip of p
    ];

    const glintGroup = new THREE.Group();
    titleGroup.add(glintGroup);

    const glintSprites: Array<{ sprite: THREE.Sprite; phase: number }> = [];
    glintPositions.forEach((pos, idx) => {
      const mat = new THREE.SpriteMaterial({
        map: glintTex,
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(pos);
      sprite.scale.set(0, 0, 1);
      glintGroup.add(sprite);
      glintSprites.push({ sprite, phase: idx * 1.25 });
    });

    // Interactive mouse repeller for surrounding particles
    const mouse = new THREE.Vector2(-999, -999);
    const raycaster = new THREE.Raycaster();
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouse3D = new THREE.Vector3(-999, -999, 0);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.x = x;
      mouse.y = y;
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(mousePlane, mouse3D);
    };

    container.addEventListener('pointermove', handlePointerMove);

    let controls: OrbitControls | null = null;
    if (interactive) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
    }

    // Dynamic camera fitting: GUARANTEES all letters ("S", "q", "u", "a", "d", "u", "p")
    // fit 100% inside container without any truncation on mobile phones or desktops
    const updateCameraFraming = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 300;
      const currentAspect = Math.max(0.1, w / h);
      camera.aspect = currentAspect;

      const vFovRad = (camera.fov * Math.PI) / 180;
      const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * currentAspect);

      // Generous safety margin (1.5 = 50% breathing room for orbs & glints)
      const padding = compact ? 1.25 : 1.5;
      const distFromHeight = (size.y * padding) / (2 * Math.tan(vFovRad / 2));
      const distFromWidth = (size.x * padding) / (2 * Math.tan(hFovRad / 2));
      const requiredZ = Math.max(distFromHeight, distFromWidth, 38);

      camera.position.set(center.x, center.y + 0.3, requiredZ);
      camera.lookAt(center.x, center.y, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      if (controls) {
        controls.target.set(center.x, center.y, 0);
        controls.minDistance = requiredZ * 0.4;
        controls.maxDistance = requiredZ * 2.5;
      }
    };

    updateCameraFraming();

    window.addEventListener('resize', updateCameraFraming);
    const resizeObserver = new ResizeObserver(() => {
      updateCameraFraming();
    });
    resizeObserver.observe(container);

    const clock = new THREE.Clock();

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Subtle organic motion floating
      titleGroup.position.y = Math.sin(elapsedTime * 1.4) * 0.35;
      titleGroup.rotation.y = -0.07 + Math.sin(elapsedTime * 0.7) * 0.035;

      // Micro bounce per letter
      letterMeshes.forEach((mesh) => {
        const phase = mesh.userData.phase;
        mesh.position.y = Math.sin(elapsedTime * 2.2 + phase) * 0.1;
      });

      // Update Orbiting Plasma Orbs
      orbData.forEach((orb) => {
        const t = elapsedTime * orb.speed + orb.phase;
        const x = center.x + Math.cos(t) * orb.radiusX;
        const y = center.y + Math.sin(t * 1.4) * orb.radiusY;
        const z = Math.sin(t) * 9 * Math.cos(orb.tilt);
        orb.light.position.set(x, y, z);
      });

      // Update Chamfer Specular Glints
      glintSprites.forEach((item) => {
        const pulse = Math.pow(Math.max(0, Math.sin(elapsedTime * 2.8 + item.phase)), 4);
        const scale = pulse * 4.2;
        item.sprite.scale.set(scale, scale, 1);
        item.sprite.material.opacity = pulse * 0.95;
      });

      // Update Energy Particles with cursor response
      const posArr = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const data = pData[i];
        const t = elapsedTime * data.speed;

        let px = data.baseX + Math.sin(t + data.angle) * data.radius;
        let py = data.baseY + Math.sin(t * 1.3) * 1.4;
        let pz = data.baseZ + Math.cos(t + data.angle) * data.radius;

        // Repel particles slightly when mouse/touch gets close
        if (mouse3D.x !== -999) {
          const dx = px - mouse3D.x;
          const dy = py - mouse3D.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 9) {
            const force = (9 - dist) / 9;
            px += (dx / (dist || 1)) * force * 3.5;
            py += (dy / (dist || 1)) * force * 3.5;
          }
        }

        posArr[i * 3] = px;
        posArr[i * 3 + 1] = py;
        posArr[i * 3 + 2] = pz;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      // Subtle dynamic light glint sweep
      keyLight.position.x = -20 + Math.sin(elapsedTime * 1.1) * 8;
      topGlint.position.x = 2 + Math.cos(elapsedTime * 1.4) * 10;

      if (controls) {
        controls.update();
      }
      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateCameraFraming);
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      if (controls) controls.dispose();
      renderer.dispose();
      pGeometry.dispose();
      pMaterial.dispose();
      particleTex.dispose();
      glintTex.dispose();
      frontMaterial.dispose();
      sideMaterial.dispose();
      letterMeshes.forEach((mesh) => mesh.geometry.dispose());
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, transparentBg, compact]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex items-center justify-center select-none overflow-visible ${
        interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      } ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

export default SquadUp3DTitle;
