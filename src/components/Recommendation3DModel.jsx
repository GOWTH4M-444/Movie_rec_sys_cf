'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RotateCw } from 'lucide-react';

// Pre-allocated scratch math objects (zero GC inside animation loop)
const _scratchPos = new THREE.Vector3();
const _scratchWorld = new THREE.Vector3();
const _scratchQuat = new THREE.Quaternion();
const _scratchScale = new THREE.Vector3(1, 1, 1);
const _scratchMatrix = new THREE.Matrix4();

const NETWORK_NODES = [
  // Center: Active Viewer
  {
    id: 'active-viewer',
    role: 'core',
    title: 'Active Viewer',
    badge: 'Your Rating History',
    detail: '13 rated movies anchor your taste profile',
    pos: [0, 0, 0],
    color: 0x38bdf8,
  },
  // Inner Orbit: 5 Similar Users
  {
    id: 'sim-u1',
    role: 'user',
    title: 'Similar Viewer #1',
    badge: '94% Taste Match',
    detail: 'Shares your top ratings on Sci-Fi & Thrillers',
    pos: [2.25, 0.72, 0.95],
    color: 0x93c5fd,
  },
  {
    id: 'sim-u2',
    role: 'user',
    title: 'Similar Viewer #2',
    badge: '92% Taste Match',
    detail: 'Strongly agrees on cerebral mysteries',
    pos: [-2.15, 0.95, 0.8],
    color: 0x93c5fd,
  },
  {
    id: 'sim-u3',
    role: 'user',
    title: 'Similar Viewer #3',
    badge: '89% Taste Match',
    detail: 'Matches your high and low rating habits',
    pos: [-1.45, -1.35, -1.65],
    color: 0x93c5fd,
  },
  {
    id: 'sim-u4',
    role: 'user',
    title: 'Similar Viewer #4',
    badge: '87% Taste Match',
    detail: 'Overlaps on 8 shared movies in dataset',
    pos: [1.55, -1.25, -1.5],
    color: 0x93c5fd,
  },
  {
    id: 'sim-u5',
    role: 'user',
    title: 'Similar Viewer #5',
    badge: '85% Taste Match',
    detail: 'Contributes weighted neighbor signal',
    pos: [0.1, 1.85, -1.45],
    color: 0x93c5fd,
  },
  // Outer Orbit: 6 Recommended Movies
  {
    id: 'rec-m1',
    role: 'movie',
    title: 'Parasite',
    badge: 'Predicted: 4.9★',
    detail: 'Recommended Movie · 95% Match',
    pos: [4.05, 1.55, 1.45],
    color: 0xfbbf24,
  },
  {
    id: 'rec-m2',
    role: 'movie',
    title: 'Arrival',
    badge: 'Predicted: 4.8★',
    detail: 'Recommended Movie · 94% Match',
    pos: [-4.0, 1.7, 1.2],
    color: 0xfbbf24,
  },
  {
    id: 'rec-m3',
    role: 'movie',
    title: 'Dune',
    badge: 'Predicted: 4.8★',
    detail: 'Recommended Movie · 93% Match',
    pos: [3.6, -1.85, -2.0],
    color: 0xf8fafc,
  },
  {
    id: 'rec-m4',
    role: 'movie',
    title: 'Blade Runner 2049',
    badge: 'Predicted: 4.7★',
    detail: 'Recommended Movie · 91% Match',
    pos: [-3.45, -2.0, -2.1],
    color: 0xfbbf24,
  },
  {
    id: 'rec-m5',
    role: 'movie',
    title: 'Whiplash',
    badge: 'Predicted: 4.7★',
    detail: 'Recommended Movie · 90% Match',
    pos: [0.35, 3.25, -2.35],
    color: 0xf8fafc,
  },
  {
    id: 'rec-m6',
    role: 'movie',
    title: 'The Shawshank Redemption',
    badge: 'Predicted: 4.8★',
    detail: 'Recommended Movie · 93% Match',
    pos: [-0.4, -2.75, 2.55],
    color: 0xfbbf24,
  },
];

const NETWORK_EDGES = [
  // Active Viewer -> Similar Users (similarity links)
  { from: 'active-viewer', to: 'sim-u1', kind: 'similarity' },
  { from: 'active-viewer', to: 'sim-u2', kind: 'similarity' },
  { from: 'active-viewer', to: 'sim-u3', kind: 'similarity' },
  { from: 'active-viewer', to: 'sim-u4', kind: 'similarity' },
  { from: 'active-viewer', to: 'sim-u5', kind: 'similarity' },
  // Similar Users -> Recommended Movies (prediction links)
  { from: 'sim-u1', to: 'rec-m1', kind: 'prediction' },
  { from: 'sim-u1', to: 'rec-m3', kind: 'prediction' },
  { from: 'sim-u2', to: 'rec-m2', kind: 'prediction' },
  { from: 'sim-u2', to: 'rec-m6', kind: 'prediction' },
  { from: 'sim-u3', to: 'rec-m4', kind: 'prediction' },
  { from: 'sim-u3', to: 'rec-m6', kind: 'prediction' },
  { from: 'sim-u4', to: 'rec-m3', kind: 'prediction' },
  { from: 'sim-u4', to: 'rec-m1', kind: 'prediction' },
  { from: 'sim-u5', to: 'rec-m5', kind: 'prediction' },
  { from: 'sim-u5', to: 'rec-m2', kind: 'prediction' },
];

/**
 * Clean Static SVG/CSS Fallback if WebGL is unavailable or context is lost.
 */
function StaticConstellationFallback() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-[#0B192C] p-6 select-none"
      aria-label="Collaborative Filtering Similarity Network illustration"
    >
      <svg
        viewBox="0 0 420 320"
        className="w-full max-w-[380px] h-auto"
        role="img"
        aria-label="Active viewer connected to similar viewers and recommended movies"
      >
        <circle cx="210" cy="160" r="78" fill="none" stroke="#1E3A5F" strokeDasharray="4 4" strokeWidth="1.2" />
        <circle cx="210" cy="160" r="134" fill="none" stroke="#1E3A5F" strokeDasharray="3 5" strokeWidth="1" />

        {/* Similarity edges */}
        <line x1="210" y1="160" x2="274" y2="122" stroke="#38BDF8" strokeOpacity="0.55" strokeWidth="1.6" />
        <line x1="210" y1="160" x2="145" y2="125" stroke="#38BDF8" strokeOpacity="0.55" strokeWidth="1.6" />
        <line x1="210" y1="160" x2="170" y2="225" stroke="#38BDF8" strokeOpacity="0.55" strokeWidth="1.6" />
        <line x1="210" y1="160" x2="265" y2="215" stroke="#38BDF8" strokeOpacity="0.55" strokeWidth="1.6" />

        {/* Prediction edges */}
        <line x1="274" y1="122" x2="335" y2="95" stroke="#FBBF24" strokeOpacity="0.55" strokeWidth="1.4" />
        <line x1="145" y1="125" x2="82" y2="95" stroke="#FBBF24" strokeOpacity="0.55" strokeWidth="1.4" />
        <line x1="170" y1="225" x2="108" y2="265" stroke="#FBBF24" strokeOpacity="0.55" strokeWidth="1.4" />
        <line x1="265" y1="215" x2="328" y2="250" stroke="#F8FAFC" strokeOpacity="0.5" strokeWidth="1.4" />

        {/* Outer orbit movies */}
        <circle cx="335" cy="95" r="10" fill="#FBBF24" />
        <circle cx="82" cy="95" r="10" fill="#FBBF24" />
        <circle cx="108" cy="265" r="9" fill="#F8FAFC" />
        <circle cx="328" cy="250" r="10" fill="#FBBF24" />

        {/* Inner orbit similar users */}
        <circle cx="274" cy="122" r="11" fill="#93C5FD" />
        <circle cx="145" cy="125" r="11" fill="#93C5FD" />
        <circle cx="170" cy="225" r="11" fill="#93C5FD" />
        <circle cx="265" cy="215" r="11" fill="#93C5FD" />

        {/* Active Viewer core */}
        <circle cx="210" cy="160" r="24" fill="#38BDF8" fillOpacity="0.18" />
        <circle cx="210" cy="160" r="15" fill="#38BDF8" />
      </svg>
      <p className="text-xs text-[#93C5FD] mt-2">
        Similarity Network: Active Viewer → Similar Users → Recommended Movies
      </p>
    </div>
  );
}

/**
 * Interactive Three.js 3D Collaborative Filtering Similarity Network
 *
 * Renders an interactive 3D constellation with composite multi-part nodes,
 * glowing similarity edges, instanced animated signal particles, OrbitControls
 * drag rotation, throttled hover raycasting, and software-WebGL pacing.
 */
export default function Recommendation3DModel() {
  const containerRef = useRef(null);
  const canvasMountRef = useRef(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    const wrapperEl = containerRef.current;
    if (!mountEl || !wrapperEl) return undefined;

    // Detect software WebGL (SwiftShader/llvmpipe) or missing WebGL context
    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) {
        const rafId = window.requestAnimationFrame(() => setWebglFailed(true));
        return () => window.cancelAnimationFrame(rafId);
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      const rafId = window.requestAnimationFrame(() => setWebglFailed(true));
      return () => window.cancelAnimationFrame(rafId);
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      const rafId = window.requestAnimationFrame(() => setWebglFailed(true));
      return () => window.cancelAnimationFrame(rafId);
    }

    const width = Math.max(300, mountEl.clientWidth || 540);
    const height = Math.max(320, mountEl.clientHeight || 420);

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x0b192c, 1);

    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b192c);
    scene.fog = new THREE.FogExp2(0x0b192c, 0.042);

    // Studio PBR environment reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 80);
    camera.position.set(0, 1.85, 13.4);

    // Balanced warm/cool 3-point lighting rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0b192c, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4d6, 1.5);
    keyLight.position.set(6, 8, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
    rimLight.position.set(-7, -4, -6);
    scene.add(rimLight);

    // OrbitControls for interactive mouse-drag rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, -0.45, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.72;
    controls.autoRotate = !isSoftwareGl;
    controls.autoRotateSpeed = 0.75;
    controls.update();

    const handleControlStart = () => setIsDragging(true);
    const handleControlEnd = () => setIsDragging(false);
    controls.addEventListener('start', handleControlStart);
    controls.addEventListener('end', handleControlEnd);

    // Master network group
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    // Track disposable resources
    const geometries = [];
    const materials = [];
    const trackGeo = (g) => {
      geometries.push(g);
      return g;
    };
    const trackMat = (m) => {
      materials.push(m);
      return m;
    };

    // Subtle 3D orbital guide rings for spatial clarity
    const innerRingGeo = trackGeo(new THREE.TorusGeometry(2.55, 0.012, 12, 72));
    const innerRingMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.22,
      })
    );
    const innerOrbitRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerOrbitRing.rotation.x = Math.PI * 0.42;
    innerOrbitRing.rotation.y = 0.2;
    networkGroup.add(innerOrbitRing);

    const outerRingGeo = trackGeo(new THREE.TorusGeometry(4.4, 0.012, 12, 96));
    const outerRingMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.16,
      })
    );
    const outerOrbitRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerOrbitRing.rotation.x = Math.PI * 0.56;
    outerOrbitRing.rotation.y = -0.25;
    networkGroup.add(outerOrbitRing);

    // Subtle background starfield dust (InstancedMesh)
    const starGeo = trackGeo(new THREE.OctahedronGeometry(0.032, 0));
    const starMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.45,
      })
    );
    const starCount = 48;
    const starField = new THREE.InstancedMesh(starGeo, starMat, starCount);
    starField.frustumCulled = false;
    for (let i = 0; i < starCount; i++) {
      // Deterministic spherical scatter outside outer orbit
      const phi = Math.acos(1 - (2 * (i + 0.5)) / starCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 6.2 + ((i * 19) % 7) * 0.45;
      _scratchPos.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi) * 0.72,
        radius * Math.sin(phi) * Math.sin(theta)
      );
      const s = 0.65 + ((i * 7) % 5) * 0.16;
      _scratchScale.set(s, s, s);
      _scratchMatrix.compose(_scratchPos, _scratchQuat, _scratchScale);
      starField.setMatrixAt(i, _scratchMatrix);
    }
    starField.instanceMatrix.needsUpdate = true;
    networkGroup.add(starField);

    // Shared node geometries (composite multi-part assemblies)
    const coreGemGeo = trackGeo(new THREE.IcosahedronGeometry(0.54, 1));
    const coreRingGeo = trackGeo(new THREE.TorusGeometry(0.84, 0.035, 14, 48));
    const coreHaloGeo = trackGeo(new THREE.SphereGeometry(0.76, 20, 20));

    const userCoreGeo = trackGeo(new THREE.SphereGeometry(0.3, 20, 20));
    const userCollarGeo = trackGeo(new THREE.TorusGeometry(0.45, 0.024, 12, 36));
    const userHaloGeo = trackGeo(new THREE.SphereGeometry(0.4, 16, 16));

    const movieGemGeo = trackGeo(new THREE.OctahedronGeometry(0.34, 0));
    const movieRingGeo = trackGeo(new THREE.TorusGeometry(0.49, 0.022, 12, 36));
    const movieHaloGeo = trackGeo(new THREE.SphereGeometry(0.44, 16, 16));

    const hitSphereGeo = trackGeo(new THREE.SphereGeometry(0.75, 12, 12));
    const hitMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));

    // Build all composite nodes
    const nodeMap = new Map();
    const interactiveHitMeshes = [];
    const animatedRings = [];
    let coreGroupRef = null;
    let coreAuraMesh = null;

    for (const def of NETWORK_NODES) {
      const group = new THREE.Group();
      group.position.set(def.pos[0], def.pos[1], def.pos[2]);

      let primaryMat;
      if (def.role === 'core') {
        primaryMat = trackMat(
          new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.72,
            roughness: 0.18,
            metalness: 0.45,
            clearcoat: 0.8,
          })
        );
        const coreMesh = new THREE.Mesh(coreGemGeo, primaryMat);
        group.add(coreMesh);

        const gyroMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x93c5fd,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.4,
            roughness: 0.25,
            metalness: 0.85,
          })
        );
        const gyro1 = new THREE.Mesh(coreRingGeo, gyroMat);
        gyro1.rotation.x = Math.PI * 0.35;
        group.add(gyro1);
        animatedRings.push({ mesh: gyro1, speedX: 0.45, speedY: 0.65 });

        const gyro2 = new THREE.Mesh(coreRingGeo, gyroMat);
        gyro2.rotation.y = Math.PI * 0.4;
        gyro2.scale.setScalar(1.16);
        group.add(gyro2);
        animatedRings.push({ mesh: gyro2, speedX: -0.35, speedY: 0.5 });

        const auraMat = trackMat(
          new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
          })
        );
        coreAuraMesh = new THREE.Mesh(coreHaloGeo, auraMat);
        group.add(coreAuraMesh);
        coreGroupRef = group;
      } else if (def.role === 'user') {
        primaryMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x93c5fd,
            emissive: 0x3b82f6,
            emissiveIntensity: 0.45,
            roughness: 0.22,
            metalness: 0.55,
          })
        );
        group.add(new THREE.Mesh(userCoreGeo, primaryMat));

        const collarMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.45,
            metalness: 0.8,
          })
        );
        const collar = new THREE.Mesh(userCollarGeo, collarMat);
        collar.rotation.x = Math.PI * 0.38;
        group.add(collar);
        animatedRings.push({ mesh: collar, speedX: 0.25, speedY: 0.55 });

        const haloMat = trackMat(
          new THREE.MeshBasicMaterial({
            color: 0x93c5fd,
            transparent: true,
            opacity: 0.15,
            depthWrite: false,
          })
        );
        group.add(new THREE.Mesh(userHaloGeo, haloMat));
      } else {
        const isGold = def.color === 0xfbbf24;
        primaryMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: def.color,
            emissive: isGold ? 0xd97706 : 0x93c5fd,
            emissiveIntensity: isGold ? 0.52 : 0.4,
            roughness: 0.2,
            metalness: 0.65,
          })
        );
        const gem = new THREE.Mesh(movieGemGeo, primaryMat);
        group.add(gem);
        animatedRings.push({ mesh: gem, speedX: 0.15, speedY: 0.6 });

        const ringMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: isGold ? 0xfde68a : 0x38bdf8,
            roughness: 0.45,
            metalness: 0.8,
          })
        );
        const ring = new THREE.Mesh(movieRingGeo, ringMat);
        ring.rotation.x = Math.PI * 0.45;
        group.add(ring);

        const haloMat = trackMat(
          new THREE.MeshBasicMaterial({
            color: def.color,
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
          })
        );
        group.add(new THREE.Mesh(movieHaloGeo, haloMat));
      }

      // Dedicated invisible proxy sphere for smooth, accurate hover raycasting
      const hitMesh = new THREE.Mesh(hitSphereGeo, hitMat);
      hitMesh.userData = {
        nodeId: def.id,
        nodeDef: def,
        parentGroup: group,
        primaryMat,
        baseEmissive: primaryMat.emissiveIntensity,
      };
      group.add(hitMesh);
      interactiveHitMeshes.push(hitMesh);

      networkGroup.add(group);
      nodeMap.set(def.id, {
        def,
        group,
        posVec: new THREE.Vector3(def.pos[0], def.pos[1], def.pos[2]),
        targetScale: 1,
        currentScale: 1,
      });
    }

    // Build translucent glowing edges between connected nodes
    const edgeData = [];
    for (const edge of NETWORK_EDGES) {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) continue;

      const lineGeo = trackGeo(
        new THREE.BufferGeometry().setFromPoints([fromNode.posVec, toNode.posVec])
      );
      const lineMat = trackMat(
        new THREE.LineBasicMaterial({
          color: edge.kind === 'similarity' ? 0x38bdf8 : 0xfbbf24,
          transparent: true,
          opacity: edge.kind === 'similarity' ? 0.42 : 0.34,
        })
      );
      const line = new THREE.Line(lineGeo, lineMat);
      networkGroup.add(line);

      edgeData.push({
        from: fromNode.posVec,
        to: toNode.posVec,
        kind: edge.kind,
        lineMat,
        fromId: edge.from,
        toId: edge.to,
      });
    }

    // Instanced animated light particles traveling along edges
    const particlesPerEdge = 2;
    const totalParticles = edgeData.length * particlesPerEdge;
    const particleGeo = trackGeo(new THREE.SphereGeometry(0.068, 10, 10));
    const particleMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
      })
    );
    const particleMesh = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      totalParticles
    );
    particleMesh.frustumCulled = false;

    const particleStates = [];
    const skyColor = new THREE.Color(0x38bdf8);
    const goldColor = new THREE.Color(0xfbbf24);

    let pIdx = 0;
    for (let eIdx = 0; eIdx < edgeData.length; eIdx++) {
      const edge = edgeData[eIdx];
      for (let k = 0; k < particlesPerEdge; k++) {
        particleStates.push({
          edgeIndex: eIdx,
          offset: (k / particlesPerEdge + (eIdx * 0.13) % 1) % 1,
          speed: edge.kind === 'similarity' ? 0.32 : 0.26,
        });
        particleMesh.setColorAt(pIdx, edge.kind === 'similarity' ? skyColor : goldColor);
        pIdx += 1;
      }
    }
    if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;
    networkGroup.add(particleMesh);

    // Pre-warm shaders on GPU devices (skip on software WebGL)
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Hover Raycasting (throttled, strictly against interactiveHitMeshes)
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let hoveredNodeId = null;
    let lastRaycastAt = 0;

    const updateHoverTooltip = (hitUserData) => {
      if (!hitUserData) {
        if (hoveredNodeId !== null) {
          hoveredNodeId = null;
          renderer.domElement.style.cursor = 'grab';
          setHoveredInfo(null);
        }
        return;
      }

      const { nodeId, nodeDef, parentGroup } = hitUserData;
      hoveredNodeId = nodeId;
      renderer.domElement.style.cursor = 'pointer';

      // Project 3D node position into container CSS pixels
      parentGroup.getWorldPosition(_scratchWorld);
      _scratchWorld.project(camera);

      const cw = mountEl.clientWidth || width;
      const ch = mountEl.clientHeight || height;
      const screenX = ((_scratchWorld.x + 1) / 2) * cw;
      const screenY = ((-_scratchWorld.y + 1) / 2) * ch;

      setHoveredInfo({
        id: nodeId,
        title: nodeDef.title,
        badge: nodeDef.badge,
        detail: nodeDef.detail,
        role: nodeDef.role,
        x: Math.max(110, Math.min(cw - 110, screenX)),
        y: Math.max(54, Math.min(ch - 82, screenY - 26)),
      });
    };

    const handlePointerMove = (event) => {
      const now = performance.now();
      if (now - lastRaycastAt < 45) return;
      lastRaycastAt = now;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const intersects = raycaster.intersectObjects(interactiveHitMeshes, false);

      if (intersects.length > 0) {
        updateHoverTooltip(intersects[0].object.userData);
      } else {
        updateHoverTooltip(null);
      }
    };

    const handlePointerLeave = () => {
      updateHoverTooltip(null);
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);

    // WebGL context loss safety
    const handleContextLost = (e) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    // ResizeObserver for crisp responsive fitting
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(260, Math.floor(entry.contentRect.width));
        const h = Math.max(280, Math.floor(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(mountEl);

    // Render loop with exact software-WebGL fenceSync pacing (`afterDraw`)
    let disposed = false;
    let frameId = 0;
    let isTimeoutFrame = false;
    let lastTimestamp = performance.now();
    let elapsed = 0;

    const scheduleAfterDraw = (cb) => {
      const gl = renderer.getContext();
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            isTimeoutFrame = true;
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            isTimeoutFrame = true;
            frameId = window.setTimeout(cb, 80);
          }
        };
        isTimeoutFrame = true;
        frameId = window.setTimeout(poll, 5);
      } else {
        isTimeoutFrame = true;
        frameId = window.setTimeout(cb, 90);
      }
    };

    const tick = () => {
      if (disposed) return;

      const now = performance.now();
      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;
      elapsed += delta;

      // Gentle breathing pulse on the Active Viewer core
      if (coreGroupRef && coreAuraMesh) {
        const pulse = 1 + Math.sin(elapsed * 2.4) * 0.07;
        coreAuraMesh.scale.setScalar(pulse * 1.15);
      }

      // Smooth gentle rotation when software WebGL disables OrbitControls autoRotate
      if (isSoftwareGl) {
        networkGroup.rotation.y += delta * 0.22;
      }

      // Spin node rings & faceted gems
      for (let i = 0; i < animatedRings.length; i++) {
        const r = animatedRings[i];
        r.mesh.rotation.x += delta * r.speedX;
        r.mesh.rotation.y += delta * r.speedY;
      }

      // Smooth hover highlight scaling & edge brightness
      for (let i = 0; i < interactiveHitMeshes.length; i++) {
        const ud = interactiveHitMeshes[i].userData;
        const entry = nodeMap.get(ud.nodeId);
        if (!entry) continue;
        const isHot = ud.nodeId === hoveredNodeId;
        entry.targetScale = isHot ? 1.24 : 1.0;
        entry.currentScale = THREE.MathUtils.damp(
          entry.currentScale,
          entry.targetScale,
          10,
          delta
        );
        entry.group.scale.setScalar(entry.currentScale);
        ud.primaryMat.emissiveIntensity = isHot
          ? ud.baseEmissive + 0.55
          : ud.baseEmissive;
      }

      for (let i = 0; i < edgeData.length; i++) {
        const edge = edgeData[i];
        const connectedToHover =
          hoveredNodeId !== null &&
          (edge.fromId === hoveredNodeId || edge.toId === hoveredNodeId);
        edge.lineMat.opacity = connectedToHover
          ? 0.92
          : edge.kind === 'similarity'
          ? 0.42
          : 0.34;
      }

      // Advance animated light particles along similarity & prediction edges
      for (let i = 0; i < particleStates.length; i++) {
        const p = particleStates[i];
        const edge = edgeData[p.edgeIndex];
        const t = (p.offset + elapsed * p.speed) % 1;
        _scratchPos.lerpVectors(edge.from, edge.to, t);
        // Smooth taper at ends so pulses enter/leave nodes gracefully
        const pulseScale = 0.55 + Math.sin(t * Math.PI) * 0.75;
        _scratchScale.setScalar(pulseScale);
        _scratchMatrix.compose(_scratchPos, _scratchQuat, _scratchScale);
        particleMesh.setMatrixAt(i, _scratchMatrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        scheduleAfterDraw(tick);
      } else {
        isTimeoutFrame = false;
        frameId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      if (isTimeoutFrame) {
        window.clearTimeout(frameId);
      } else {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleControlStart);
      controls.removeEventListener('end', handleControlEnd);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mountEl) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="recommendation-3d-network"
      className="relative w-full h-[360px] sm:h-[420px] lg:h-[450px] rounded-xl bg-[#0B192C] border border-[#1E3A5F] overflow-hidden"
    >
      {/* Dedicated isolated WebGL canvas container (no sibling HUD inside this div) */}
      {webglFailed ? (
        <StaticConstellationFallback />
      ) : (
        <div
          ref={canvasMountRef}
          className="w-full h-full"
          aria-label="Interactive 3D Collaborative Filtering Similarity Network"
        />
      )}

      {/* Subtle Corner Interaction Hint (no backdrop-blur over WebGL) */}
      {!webglFailed && (
        <div className="pointer-events-none absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#132743]/95 border border-[#1E3A5F] text-[11px] font-medium text-[#CBD5E1] inline-flex items-center gap-1.5">
          <RotateCw className="w-3 h-3 text-[#38BDF8]" aria-hidden="true" />
          <span>{isDragging ? 'Rotating 3D Network' : 'Drag to rotate · Hover any node'}</span>
        </div>
      )}

      {/* Floating Plain-English Hover Tooltip */}
      {hoveredInfo && (
        <div
          role="status"
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-[#0B192C]/95 border border-[#38BDF8] px-3 py-2 shadow-xl min-w-[185px] max-w-[235px]"
          style={{
            left: hoveredInfo.x,
            top: hoveredInfo.y,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#F8FAFC] truncate">
              {hoveredInfo.title}
            </span>
            <span
              className={`font-mono text-[11px] font-semibold tabular-nums whitespace-nowrap ${
                hoveredInfo.role === 'movie'
                  ? 'text-[#FBBF24]'
                  : 'text-[#38BDF8]'
              }`}
            >
              {hoveredInfo.badge}
            </span>
          </div>
          <p className="text-[11px] text-[#CBD5E1] mt-0.5 leading-snug">
            {hoveredInfo.detail}
          </p>
        </div>
      )}

      {/* Static Legend Strip pinned neatly along bottom edge */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-3 py-2 rounded-lg bg-[#132743]/95 border border-[#1E3A5F] text-[11px] text-[#CBD5E1]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" aria-hidden="true" />
          <span>Core: Active Viewer</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#93C5FD]" aria-hidden="true" />
          <span>Inner Orbit: Similar Users</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" aria-hidden="true" />
          <span>Outer Orbit: Recommended Movies</span>
        </span>
      </div>
    </div>
  );
}
