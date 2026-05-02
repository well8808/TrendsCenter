"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  clamp,
  marketColor,
  normalizeMetric,
  scoreColor,
  seededNoise,
  stableSeed,
  summarizeUniverse,
  type ViralReelNode,
  type ViralSceneQuality,
  type ViralSignalNode,
  type ViralUniverseMode,
  type ViralUniverseStats,
} from "@/components/viral-universe/viral-scene-quality";
import { createViralGlowMaterial } from "@/components/viral-universe/viral-shader-materials";

const PARTICLE_COLORS = ["#ed4956", "#f77737", "#c13584", "#58c8be", "#e6b765"];
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const cameraTarget = new THREE.Vector3();

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    const geometry = mesh.geometry;
    const material = mesh.material;

    if (geometry && typeof geometry.dispose === "function") {
      geometry.dispose();
    }

    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else if (material && typeof material.dispose === "function") {
      material.dispose();
    }
  });
}

function createParticles({
  seed,
  count,
  mode,
  intensity,
}: {
  seed: string;
  count: number;
  mode: ViralUniverseMode;
  intensity: number;
}) {
  const baseSeed = stableSeed(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const angle = seededNoise(baseSeed, index) * Math.PI * 2;
    const radius = 1.05 + seededNoise(baseSeed, index + 13) * 3.25;
    const height = (seededNoise(baseSeed, index + 29) - 0.5) * (mode === "library" ? 2.4 : 1.7);
    const color = new THREE.Color(PARTICLE_COLORS[index % PARTICLE_COLORS.length]);

    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = height;
    positions[index * 3 + 2] = Math.sin(angle) * radius * 0.44;
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.026,
      vertexColors: true,
      transparent: true,
      opacity: 0.28 * intensity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}

function createEnergyRings({
  mode,
  stats,
}: {
  mode: ViralUniverseMode;
  stats: ViralUniverseStats;
}) {
  const root = new THREE.Group();
  const signalStrength = clamp(stats.signals / Math.max(stats.reels, 1), 0, 1);
  const scoreLift = clamp(stats.avgScore / 100, 0.08, 1);
  const glowMaterial = createViralGlowMaterial({
    colorA: mode === "library" ? "#ed4956" : "#58c8be",
    colorB: mode === "library" ? "#f77737" : "#e6b765",
    opacity: mode === "library" ? 0.9 : 0.7,
  });

  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), glowMaterial);
  glow.position.set(0, 0, -0.16);
  glow.scale.set(3.9, 3.9, 1);
  root.add(glow);

  [
    { radius: 1.1 + scoreLift * 0.28, color: "#ed4956", opacity: 0.36 },
    { radius: 1.55 + signalStrength * 0.36, color: "#f77737", opacity: 0.24 },
    { radius: 2.05 + stats.sources * 0.03, color: "#58c8be", opacity: 0.22 },
    { radius: 2.55 + stats.evidence * 0.012, color: "#c13584", opacity: 0.16 },
  ].forEach((ring, index) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(ring.radius, 0.006 + index * 0.002, 8, 160),
      new THREE.MeshBasicMaterial({
        color: ring.color,
        transparent: true,
        opacity: ring.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );

    mesh.rotation.set(Math.PI / 2 + index * 0.08, 0, index * 0.33);
    mesh.scale.set(1, 0.46 + index * 0.04, 1);
    root.add(mesh);
  });

  return { root, glowMaterial };
}

function createReelMesh({
  reels,
  signals,
  stats,
  limit,
}: {
  reels: ViralReelNode[];
  signals: ViralSignalNode[];
  stats: ViralUniverseStats;
  limit: number;
}) {
  const orderedReels = reels.slice(0, limit).sort((a, b) => b.score - a.score || b.views - a.views);

  if (orderedReels.length === 0) {
    return { orderedReels, mesh: null, summary: summarizeUniverse({ reels: orderedReels, signals, stats }) };
  }

  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.26, 0.48, 0.018),
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    orderedReels.length,
  );

  orderedReels.forEach((reel, index) => {
    tempColor.set(scoreColor(reel.score)).lerp(new THREE.Color(marketColor(reel.market)), 0.24);
    mesh.setColorAt(index, tempColor);
  });

  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  return {
    orderedReels,
    mesh,
    summary: summarizeUniverse({ reels: orderedReels, signals, stats }),
  };
}

function createSignalMeshes({
  signals,
  limit,
}: {
  signals: ViralSignalNode[];
  limit: number;
}) {
  const orderedSignals = signals.slice(0, limit).sort((a, b) => b.score - a.score || b.evidenceCount - a.evidenceCount);

  if (orderedSignals.length === 0) {
    return { orderedSignals, signalMesh: null, haloMesh: null };
  }

  const signalMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.18, 24, 14),
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    orderedSignals.length,
  );

  const haloMesh = new THREE.InstancedMesh(
    new THREE.RingGeometry(0.38, 0.44, 48),
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
    orderedSignals.length,
  );

  orderedSignals.forEach((signal, index) => {
    tempColor.set(scoreColor(signal.score)).lerp(new THREE.Color(marketColor(signal.market)), 0.32);
    signalMesh.setColorAt(index, tempColor);
    haloMesh.setColorAt(index, tempColor);
  });

  if (signalMesh.instanceColor) signalMesh.instanceColor.needsUpdate = true;
  if (haloMesh.instanceColor) haloMesh.instanceColor.needsUpdate = true;

  return { orderedSignals, signalMesh, haloMesh };
}

export function ViralOrbitScene({
  mode,
  reels,
  signals,
  stats,
  quality,
  active,
}: {
  mode: ViralUniverseMode;
  reels: ViralReelNode[];
  signals: ViralSignalNode[];
  stats: ViralUniverseStats;
  quality: ViralSceneQuality;
  active: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const baseZ = mode === "library" ? 5.4 : 5.0;
    const baseY = mode === "library" ? 0.16 : 0.28;
    const root = new THREE.Group();
    const seed = `${mode}:${stats.reels}:${stats.signals}:${stats.avgScore}:${stats.evidence}`;
    const intensity = mode === "library" ? 1.08 : 0.92;
    const particles = createParticles({
      seed,
      count: quality.particleCount + Math.min(stats.reels, 24) * 3,
      intensity,
      mode,
    });
    const { root: rings, glowMaterial } = createEnergyRings({ mode, stats });
    const { orderedReels, mesh: reelMesh, summary } = createReelMesh({
      reels,
      signals,
      stats,
      limit: quality.reelLimit,
    });
    const { orderedSignals, signalMesh, haloMesh } = createSignalMeshes({
      signals,
      limit: quality.signalLimit,
    });
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: quality.antialias,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });

    camera.position.set(0, baseY, baseZ);
    root.position.set(mode === "library" ? 0.45 : -0.2, mode === "library" ? 0.05 : 0.18, 0);
    root.add(rings, particles);
    if (reelMesh) root.add(reelMesh);
    if (haloMesh) root.add(haloMesh);
    if (signalMesh) root.add(signalMesh);
    scene.add(root);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(quality.dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    renderer.domElement.dataset.engine = "viral-universe-webgl";
    mount.appendChild(renderer.domElement);

    let disposed = false;
    let rafId: number | null = null;
    let pointerX = 0;
    let pointerY = 0;
    const startedAt = performance.now();

    const updateSize = () => {
      if (!mount) return;

      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointerX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointerY = clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(mount);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    updateSize();

    const frame = () => {
      if (disposed) return;

      const elapsed = (performance.now() - startedAt) / 1000;

      particles.rotation.y = elapsed * (mode === "library" ? 0.018 : -0.014);
      particles.rotation.x = Math.sin(elapsed * 0.18) * 0.035;
      rings.rotation.y = elapsed * 0.025;
      rings.rotation.x = -0.28 + Math.sin(elapsed * 0.2) * 0.035;
      glowMaterial.uniforms.uTime.value = elapsed;

      orderedReels.forEach((reel, index) => {
        if (!reelMesh) return;

        const itemSeed = stableSeed(reel.id);
        const score = clamp(reel.score / 100, 0.05, 1);
        const views = normalizeMetric(reel.views, summary.maxViews);
        const velocity = clamp(reel.velocity / 100, 0, 1);
        const phase = seededNoise(itemSeed, 1) * Math.PI * 2;
        const layer = index % 4;
        const radius = 1.08 + layer * 0.34 + score * 0.42;
        const speed = (mode === "library" ? 0.16 : 0.1) + velocity * 0.08;
        const angle = phase + elapsed * speed * (index % 2 === 0 ? 1 : -1);
        const y = (seededNoise(itemSeed, 8) - 0.5) * (mode === "library" ? 1.0 : 0.68) + score * 0.14;
        const z = Math.sin(angle) * radius * 0.34;
        const size = 0.72 + score * 0.52 + views * 0.34;

        tempObject.position.set(Math.cos(angle) * radius, y, z);
        tempObject.rotation.set(Math.sin(angle) * 0.08, -angle + Math.PI / 2, Math.sin(elapsed * 0.4 + phase) * 0.08);
        tempObject.scale.set(size, size, size);
        tempObject.updateMatrix();
        reelMesh.setMatrixAt(index, tempObject.matrix);
      });

      if (reelMesh) reelMesh.instanceMatrix.needsUpdate = true;

      orderedSignals.forEach((signal, index) => {
        if (!signalMesh || !haloMesh) return;

        const signalSeed = stableSeed(signal.id);
        const score = clamp(signal.score / 100, 0.08, 1);
        const phase = seededNoise(signalSeed, 4) * Math.PI * 2;
        const radius = mode === "signal-room" ? 0.58 + index * 0.16 : 0.78 + index * 0.22;
        const angle = phase + elapsed * (mode === "signal-room" ? 0.08 : 0.045);
        const lift = mode === "signal-room" ? 0.48 : -0.08;
        const pulse = 1 + Math.sin(elapsed * 1.2 + phase) * 0.08;

        tempObject.position.set(Math.cos(angle) * radius, lift + Math.sin(angle * 0.9) * 0.22, Math.sin(angle) * radius * 0.42);
        tempObject.scale.setScalar((0.18 + score * 0.18) * pulse);
        tempObject.rotation.set(0, angle, 0);
        tempObject.updateMatrix();
        signalMesh.setMatrixAt(index, tempObject.matrix);

        tempObject.scale.setScalar((0.42 + score * 0.34) * pulse);
        tempObject.updateMatrix();
        haloMesh.setMatrixAt(index, tempObject.matrix);
      });

      if (signalMesh) signalMesh.instanceMatrix.needsUpdate = true;
      if (haloMesh) haloMesh.instanceMatrix.needsUpdate = true;

      cameraTarget.set(
        pointerX * quality.cameraDrift + Math.sin(elapsed * 0.09) * 0.12,
        baseY + pointerY * quality.cameraDrift * 0.28 + Math.cos(elapsed * 0.12) * 0.035,
        baseZ,
      );

      camera.position.lerp(cameraTarget, 0.035);
      camera.lookAt(0, mode === "library" ? 0.05 : 0.24, 0);
      renderer.render(scene, camera);

      if (active) {
        rafId = window.requestAnimationFrame(frame);
      }
    };

    frame();

    return () => {
      disposed = true;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [active, mode, quality.antialias, quality.cameraDrift, quality.dpr, quality.particleCount, quality.reelLimit, quality.signalLimit, reels, signals, stats]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
