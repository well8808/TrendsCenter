"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  archiveDensity,
  buildArchiveArtifacts,
  buildArchiveSignals,
  type ViralArchiveArtifact,
  type ViralArchiveSignal,
} from "@/components/viral-universe/viral-archive-layout";
import {
  clamp,
  type ViralReelNode,
  type ViralSceneQuality,
  type ViralSignalNode,
  type ViralUniverseMode,
  type ViralUniverseStats,
} from "@/components/viral-universe/viral-scene-quality";
import { proxiedReelImageUrl } from "@/lib/trends/reel-media";

const cameraTarget = new THREE.Vector3();

function disposeMaterial(material: THREE.Material) {
  const mapped = material as THREE.MeshBasicMaterial;

  if (mapped.map) {
    mapped.map.dispose();
  }

  material.dispose();
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    const geometry = mesh.geometry;
    const material = mesh.material;

    if (geometry && typeof geometry.dispose === "function") {
      geometry.dispose();
    }

    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
    } else if (material && typeof material.dispose === "function") {
      disposeMaterial(material);
    }
  });
}

function drawWrappedText({
  context,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  maxLines,
}: {
  context: CanvasRenderingContext2D;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  maxLines: number;
}) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;

    if (context.measureText(next).width <= maxWidth || !current) {
      current = next;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) lines.push(current);

  lines.slice(0, maxLines).forEach((line, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "..." : "";
    context.fillText(`${line}${suffix}`, x, y + index * lineHeight);
  });
}

function createPosterTexture(artifact: ViralArchiveArtifact) {
  const canvas = document.createElement("canvas");
  const width = 256;
  const height = 456;
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  if (!context) {
    return null;
  }

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, artifact.accent);
  gradient.addColorStop(0.38, "#17110f");
  gradient.addColorStop(1, "#050505");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.52;
  context.fillStyle = artifact.marketAccent;
  context.beginPath();
  context.ellipse(width * 0.72, height * 0.16, 110, 82, 0.2, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = "rgba(255,255,255,0.16)";
  context.lineWidth = 1;
  for (let x = 32; x < width; x += 44) {
    context.beginPath();
    context.moveTo(x, 18);
    context.lineTo(x - 28, height - 18);
    context.stroke();
  }

  context.fillStyle = "rgba(0,0,0,0.28)";
  context.fillRect(18, 18, width - 36, height - 36);
  context.strokeStyle = "rgba(255,255,255,0.18)";
  context.strokeRect(18.5, 18.5, width - 37, height - 37);

  context.fillStyle = "rgba(255,255,255,0.78)";
  context.font = "700 18px Segoe UI, Arial, sans-serif";
  context.fillText(artifact.market, 32, 54);

  context.fillStyle = artifact.hasRealMedia ? "rgba(64,224,208,0.78)" : "rgba(255,255,255,0.46)";
  context.font = "700 10px Segoe UI, Arial, sans-serif";
  context.fillText(artifact.hasRealMedia ? "MEDIA REAL" : "POSTER GERADO", 32, 76);

  context.textAlign = "right";
  context.fillStyle = artifact.accent;
  context.font = "700 36px Segoe UI, Arial, sans-serif";
  context.fillText(String(Math.round(artifact.score)), width - 32, 62);
  context.textAlign = "left";

  context.fillStyle = "#ffffff";
  context.font = "700 24px Segoe UI, Arial, sans-serif";
  drawWrappedText({
    context,
    text: artifact.title,
    x: 32,
    y: 180,
    maxWidth: width - 64,
    lineHeight: 28,
    maxLines: 5,
  });

  context.fillStyle = "rgba(255,255,255,0.64)";
  context.font = "600 15px Segoe UI, Arial, sans-serif";
  const byline = artifact.creator ? `@${artifact.creator}` : artifact.sourceLabel ?? "fonte real";
  context.fillText(byline.slice(0, 24), 32, height - 64);

  context.fillStyle = artifact.accent;
  context.fillRect(32, height - 42, Math.max(28, (width - 64) * clamp(artifact.score / 100, 0.16, 1)), 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}

function loadMediaTexture(url: string, onReady: (texture: THREE.Texture) => void) {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  loader.load(
    proxiedReelImageUrl(url, 640),
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      onReady(texture);
    },
    undefined,
    () => {
      // Thumbnails from provider/CDNs can expire or reject CORS. The data poster remains the safe fallback.
    },
  );
}

function createArchiveBackdrop({
  density,
  mode,
}: {
  density: number;
  mode: ViralUniverseMode;
}) {
  const group = new THREE.Group();
  const warm = mode === "library" ? "#ed4956" : "#58c8be";
  const ember = mode === "library" ? "#f77737" : "#ed4956";

  [
    { x: -0.28, y: 0.02, z: -1.28, w: 4.1, h: 2.05, color: "#efe9dc", opacity: 0.035 },
    { x: 0.72, y: 0.1, z: -1.18, w: 2.45, h: 1.28, color: warm, opacity: 0.075 + density * 0.04 },
    { x: -0.95, y: -0.38, z: -1.08, w: 2.2, h: 0.92, color: ember, opacity: 0.05 + density * 0.025 },
  ].forEach((panel, index) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(panel.w, panel.h),
      new THREE.MeshBasicMaterial({
        color: panel.color,
        transparent: true,
        opacity: panel.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set(panel.x, panel.y, panel.z);
    mesh.rotation.z = index === 1 ? -0.035 : index === 2 ? 0.045 : 0;
    group.add(mesh);
  });

  return group;
}

function createArchiveShelves({
  density,
  mode,
}: {
  density: number;
  mode: ViralUniverseMode;
}) {
  const positions: number[] = [];
  const colors: number[] = [];
  const accent = new THREE.Color(mode === "library" ? "#ed4956" : "#58c8be");
  const paper = new THREE.Color("#efe9dc");

  for (let row = 0; row < 5; row += 1) {
    const y = 0.78 - row * 0.43;
    const z = -0.72 - row * 0.18;
    const left = -2.05 + row * 0.1;
    const right = 2.08 - row * 0.04;

    positions.push(left, y, z, right, y, z - 0.08);
    colors.push(accent.r, accent.g, accent.b, accent.r, accent.g, accent.b);

    for (let col = 0; col < 5; col += 1) {
      const x = left + 0.38 + col * 0.76;
      positions.push(x, y - 0.18, z - 0.02, x + 0.1, y + 0.16, z - 0.08);
      colors.push(paper.r, paper.g, paper.b, paper.r, paper.g, paper.b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.09 + density * 0.13,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}

function createArtifactGroup(artifact: ViralArchiveArtifact) {
  const group = new THREE.Group();
  const posterTexture = createPosterTexture(artifact);
  group.userData.artifact = artifact;
  group.position.set(artifact.x, artifact.y, artifact.z);
  group.rotation.set(0, artifact.rotationY, artifact.rotationZ);
  group.scale.setScalar(artifact.scale);

  const bodyColor = new THREE.Color(artifact.accent).lerp(new THREE.Color("#11100d"), 0.38);
  const bodyGeometry = new THREE.BoxGeometry(0.38, 0.74, 0.052);
  const body = new THREE.Mesh(
    bodyGeometry,
    new THREE.MeshBasicMaterial({
      color: bodyColor,
      transparent: true,
      opacity: 0.26 + artifact.glow * 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const coverMaterial = new THREE.MeshBasicMaterial({
    color: posterTexture ? "#ffffff" : artifact.marketAccent,
    map: posterTexture ?? undefined,
    transparent: true,
    opacity: posterTexture ? 0.82 : 0.28 + artifact.glow * 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const cover = new THREE.Mesh(
    new THREE.PlaneGeometry(0.31, 0.552),
    coverMaterial,
  );
  const scoreHeight = 0.46 * clamp(artifact.score / 100, 0.18, 1);
  const scoreStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(0.018, scoreHeight),
    new THREE.MeshBasicMaterial({
      color: artifact.accent,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const sourceMark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.11, 0.024),
    new THREE.MeshBasicMaterial({
      color: artifact.marketAccent,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(bodyGeometry),
    new THREE.LineBasicMaterial({
      color: artifact.accent,
      transparent: true,
      opacity: 0.18 + artifact.glow * 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.86),
    new THREE.MeshBasicMaterial({
      color: artifact.accent,
      transparent: true,
      opacity: 0.055 + artifact.glow * 0.045,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );

  cover.position.z = 0.034;
  scoreStrip.position.set(-0.15, -0.23 + scoreHeight / 2, 0.036);
  sourceMark.position.set(0.07, 0.24, 0.037);
  shadow.position.z = -0.035;
  group.userData.coverMaterial = coverMaterial;
  group.add(shadow, body, cover, scoreStrip, sourceMark, edge);
  return group;
}

function createSignalGroup(signal: ViralArchiveSignal) {
  const group = new THREE.Group();
  group.userData.signal = signal;
  group.position.set(signal.x, signal.y, signal.z);
  group.rotation.y = signal.x > 0 ? -0.12 : 0.12;
  group.scale.setScalar(signal.scale);

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.28),
    new THREE.MeshBasicMaterial({
      color: signal.accent,
      transparent: true,
      opacity: signal.priority === "now" ? 0.22 : 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const marker = new THREE.Mesh(
    new THREE.PlaneGeometry(0.035, 0.18),
    new THREE.MeshBasicMaterial({
      color: signal.accent,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const underline = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48 * clamp(signal.score / 100, 0.22, 1), 0.012),
    new THREE.MeshBasicMaterial({
      color: signal.accent,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );

  marker.position.x = -0.32;
  underline.position.set(-0.06, -0.1, 0.004);
  group.add(plate, marker, underline);
  return group;
}

function createConnectionLines({
  artifacts,
  signals,
  mode,
}: {
  artifacts: ViralArchiveArtifact[];
  signals: ViralArchiveSignal[];
  mode: ViralUniverseMode;
}) {
  const positions: number[] = [];
  const colors: number[] = [];
  const max = Math.min(artifacts.length, Math.max(signals.length, 1), 16);
  const libraryReadout = new THREE.Vector3(1.55, -0.18, -0.16);
  const signalRoomReadout = new THREE.Vector3(0.04, -0.05, -0.12);

  for (let index = 0; index < max; index += 1) {
    const artifact = artifacts[index];
    const signal = signals[index % Math.max(signals.length, 1)];
    const target = signal
      ? new THREE.Vector3(signal.x, signal.y, signal.z)
      : (mode === "library" ? libraryReadout : signalRoomReadout).clone().add(new THREE.Vector3(0, index * 0.04, -index * 0.02));
    const mid = new THREE.Vector3(
      (artifact.x + target.x) * 0.5,
      artifact.y - 0.1,
      Math.min(artifact.z, target.z) - 0.22,
    );
    const color = new THREE.Color(signal?.accent ?? artifact.accent);

    positions.push(artifact.x, artifact.y, artifact.z + 0.05, mid.x, mid.y, mid.z);
    positions.push(mid.x, mid.y, mid.z, target.x, target.y, target.z);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: mode === "library" ? 0.2 : 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}

export function ViralArchiveScene3D({
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
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 80);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: quality.antialias,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    const density = archiveDensity(stats);
    const artifacts = buildArchiveArtifacts({ reels, stats, limit: quality.reelLimit });
    const signalPlates = buildArchiveSignals({ signals, limit: quality.signalLimit });
    const root = new THREE.Group();
    const backdrop = createArchiveBackdrop({ density, mode });
    const shelves = createArchiveShelves({ density, mode });
    const artifactGroups = artifacts.map(createArtifactGroup);
    const signalGroups = signalPlates.map(createSignalGroup);
    const connectors = createConnectionLines({ artifacts, signals: signalPlates, mode });

    camera.position.set(mode === "library" ? 0.12 : -0.1, mode === "library" ? 0.12 : 0.22, mode === "library" ? 5.2 : 5.0);
    root.position.set(mode === "library" ? 0.04 : -0.1, mode === "library" ? 0 : 0.05, 0);
    root.add(backdrop, shelves, connectors, ...artifactGroups, ...signalGroups);
    scene.add(root);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(quality.dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    renderer.domElement.dataset.engine = "viral-universe-webgl";
    renderer.domElement.dataset.scene = "viral-archive-field";
    mount.appendChild(renderer.domElement);

    let disposed = false;
    let rafId: number | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let lastFrame = 0;
    const startedAt = performance.now();

    artifactGroups.forEach((group) => {
      const artifact = group.userData.artifact as ViralArchiveArtifact;
      const material = group.userData.coverMaterial as THREE.MeshBasicMaterial | undefined;

      const posterUrl = artifact.posterUrl ?? artifact.thumbnailUrl;

      if (!posterUrl || !material) return;

      loadMediaTexture(posterUrl, (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }

        if (material.map) {
          material.map.dispose();
        }

        material.map = texture;
        material.color.set("#ffffff");
        material.opacity = 0.92;
        material.blending = THREE.NormalBlending;
        material.needsUpdate = true;
      });
    });

    const updateSize = () => {
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

    const frame = (now: number) => {
      if (disposed) return;

      if (!active) {
        return;
      }

      if (now - lastFrame < 1000 / 24) {
        rafId = window.requestAnimationFrame(frame);
        return;
      }

      lastFrame = now;
      const elapsed = (now - startedAt) / 1000;
      shelves.rotation.y = Math.sin(elapsed * 0.055) * 0.018;
      backdrop.rotation.z = Math.sin(elapsed * 0.05) * 0.008;
      connectors.scale.setScalar(1 + Math.sin(elapsed * 0.35) * 0.008);

      artifactGroups.forEach((group) => {
        const artifact = group.userData.artifact as ViralArchiveArtifact;
        const velocity = clamp(artifact.velocity / 100, 0, 1);
        const growth = clamp(artifact.growth / Math.max(artifact.views, 1), 0, 0.2);
        const float = Math.sin(elapsed * (0.22 + velocity * 0.24) + artifact.phase) * (0.008 + growth * 0.05);

        group.position.set(artifact.x, artifact.y + float, artifact.z);
        group.rotation.y = artifact.rotationY + Math.sin(elapsed * 0.14 + artifact.phase) * (0.018 + velocity * 0.018);
        group.rotation.z = artifact.rotationZ + Math.sin(elapsed * 0.12 + artifact.phase) * 0.006;
      });

      signalGroups.forEach((group) => {
        const signal = group.userData.signal as ViralArchiveSignal;
        const pulse = 1 + Math.sin(elapsed * 0.42 + signal.phase) * (signal.priority === "now" ? 0.022 : 0.012);

        group.position.y = signal.y + Math.sin(elapsed * 0.18 + signal.phase) * 0.012;
        group.scale.setScalar(signal.scale * pulse);
      });

      cameraTarget.set(
        pointerX * quality.cameraDrift * 0.7 + Math.sin(elapsed * 0.06) * 0.035,
        (mode === "library" ? 0.12 : 0.22) + pointerY * quality.cameraDrift * 0.18,
        mode === "library" ? 5.2 : 5.0,
      );
      camera.position.lerp(cameraTarget, 0.045);
      camera.lookAt(mode === "library" ? 0.08 : -0.06, mode === "library" ? 0.02 : 0.14, -0.55);

      renderer.render(scene, camera);

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      disposed = true;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [active, mode, quality.antialias, quality.cameraDrift, quality.dpr, quality.reelLimit, quality.signalLimit, reels, signals, stats]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
