"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import {
  archiveDensity,
  buildArchiveArtifacts,
  type ViralArchiveArtifact,
} from "@/components/viral-universe/viral-archive-layout";
import {
  clamp,
  type ViralReelNode,
  type ViralSceneQuality,
  type ViralUniverseStats,
} from "@/components/viral-universe/viral-scene-quality";
import type { CinematicFlowStage } from "@/lib/trends/cinematic-flow";
import { proxiedReelImageUrl } from "@/lib/trends/reel-media";

interface StagePlate {
  stage: CinematicFlowStage;
  x: number;
  y: number;
  z: number;
  scale: number;
  accent: string;
}

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

function drawText({
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

function makeCanvasTexture(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  if (!context) return null;

  draw(context);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}

function artifactTexture(artifact: ViralArchiveArtifact) {
  return makeCanvasTexture(256, 456, (context) => {
    const gradient = context.createLinearGradient(0, 0, 256, 456);
    gradient.addColorStop(0, artifact.accent);
    gradient.addColorStop(0.42, "#15110f");
    gradient.addColorStop(1, "#050505");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 456);

    context.globalAlpha = 0.36;
    context.fillStyle = artifact.marketAccent;
    context.beginPath();
    context.ellipse(196, 78, 96, 68, 0.16, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    context.strokeStyle = "rgba(255,255,255,0.14)";
    context.strokeRect(18.5, 18.5, 219, 419);
    context.fillStyle = "rgba(0,0,0,0.26)";
    context.fillRect(18, 18, 220, 420);

    context.fillStyle = artifact.hasRealMedia ? "rgba(88,200,190,0.8)" : "rgba(255,255,255,0.48)";
    context.font = "700 10px Segoe UI, Arial, sans-serif";
    context.fillText(artifact.hasRealMedia ? "THUMBNAIL REAL" : "POSTER EDITORIAL", 32, 54);

    context.fillStyle = artifact.accent;
    context.font = "700 36px Segoe UI, Arial, sans-serif";
    context.textAlign = "right";
    context.fillText(String(Math.round(artifact.score)), 224, 82);
    context.textAlign = "left";

    context.fillStyle = "#ffffff";
    context.font = "700 24px Segoe UI, Arial, sans-serif";
    drawText({
      context,
      text: artifact.title,
      x: 32,
      y: 180,
      maxWidth: 190,
      lineHeight: 29,
      maxLines: 5,
    });

    context.fillStyle = "rgba(255,255,255,0.68)";
    context.font = "600 14px Segoe UI, Arial, sans-serif";
    const byline = artifact.creator ? `@${artifact.creator}` : artifact.sourceLabel ?? "fonte real";
    context.fillText(byline.slice(0, 24), 32, 388);

    context.fillStyle = artifact.accent;
    context.fillRect(32, 408, Math.max(32, 180 * clamp(artifact.score / 100, 0.16, 1)), 5);
  });
}

function stageTexture(plate: StagePlate) {
  return makeCanvasTexture(384, 160, (context) => {
    context.fillStyle = "rgba(9,9,8,0.92)";
    context.fillRect(0, 0, 384, 160);
    context.strokeStyle = "rgba(255,255,255,0.16)";
    context.strokeRect(0.5, 0.5, 383, 159);

    const gradient = context.createLinearGradient(0, 0, 384, 0);
    gradient.addColorStop(0, plate.accent);
    gradient.addColorStop(0.55, "rgba(255,255,255,0.08)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.globalAlpha = 0.32;
    context.fillStyle = gradient;
    context.fillRect(0, 0, 384, 160);
    context.globalAlpha = 1;

    context.fillStyle = plate.accent;
    context.font = "700 15px Segoe UI, Arial, sans-serif";
    context.fillText(plate.stage.label, 24, 36);

    context.fillStyle = "#ffffff";
    context.font = "700 24px Segoe UI, Arial, sans-serif";
    drawText({
      context,
      text: plate.stage.title,
      x: 24,
      y: 74,
      maxWidth: 318,
      lineHeight: 27,
      maxLines: 2,
    });

    context.fillStyle = "rgba(255,255,255,0.62)";
    context.font = "600 13px Segoe UI, Arial, sans-serif";
    drawText({
      context,
      text: plate.stage.metric ? `${plate.stage.metric} / ${plate.stage.body}` : plate.stage.body,
      x: 24,
      y: 124,
      maxWidth: 330,
      lineHeight: 18,
      maxLines: 1,
    });
  });
}

function stageAccent(stage: CinematicFlowStage) {
  if (stage.tone === "hot") return "#ed4956";
  if (stage.tone === "gold") return "#e6b765";
  if (stage.tone === "aqua") return "#58c8be";
  return "#efe9dc";
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
      // Provider thumbnails can expire or reject CORS. The generated data poster remains visible.
    },
  );
}

function createArtifactMesh(artifact: ViralArchiveArtifact) {
  const group = new THREE.Group();
  const baseTexture = artifactTexture(artifact);
  const accent = new THREE.Color(artifact.accent);
  const material = new THREE.MeshBasicMaterial({
    color: baseTexture ? "#ffffff" : artifact.accent,
    map: baseTexture ?? undefined,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.748), material);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.92),
    new THREE.MeshBasicMaterial({
      color: artifact.accent,
      transparent: true,
      opacity: 0.075 + artifact.glow * 0.06,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(0.43, 0.76, 0.035)),
    new THREE.LineBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.22 + artifact.glow * 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  shadow.position.z = -0.028;
  edge.position.z = 0.005;
  group.userData.artifact = artifact;
  group.userData.coverMaterial = material;
  group.position.set(artifact.x - 0.64, artifact.y, artifact.z);
  group.rotation.set(0, artifact.rotationY - 0.1, artifact.rotationZ);
  group.scale.setScalar(artifact.scale);
  group.add(shadow, cover, edge);

  return group;
}

function createStagePlate(plate: StagePlate) {
  const group = new THREE.Group();
  const texture = stageTexture(plate);
  const material = new THREE.MeshBasicMaterial({
    color: texture ? "#ffffff" : plate.accent,
    map: texture ?? undefined,
    transparent: true,
    opacity: plate.stage.state === "waiting" ? 0.62 : 0.88,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.36), material);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.96, 0.44),
    new THREE.MeshBasicMaterial({
      color: plate.accent,
      transparent: true,
      opacity: plate.stage.state === "complete" ? 0.07 : 0.04,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );

  glow.position.z = -0.02;
  group.position.set(plate.x, plate.y, plate.z);
  group.rotation.y = -0.12;
  group.scale.setScalar(plate.scale);
  group.userData.plate = plate;
  group.add(glow, mesh);
  return group;
}

function createStagePlates(stages: CinematicFlowStage[]): StagePlate[] {
  const visible = stages.slice(0, 5);
  const centerOffset = (visible.length - 1) / 2;

  return visible.map((stage, index) => ({
    stage,
    x: 1.28 + (index % 2) * 0.16,
    y: 0.86 - (index - centerOffset) * 0.42,
    z: -0.12 - index * 0.09,
    scale: stage.state === "complete" ? 1.02 : 0.92,
    accent: stageAccent(stage),
  }));
}

function createConnectionLines(artifacts: ViralArchiveArtifact[], plates: StagePlate[]) {
  const positions: number[] = [];
  const colors: number[] = [];

  artifacts.slice(0, Math.min(artifacts.length, 12)).forEach((artifact, index) => {
    const stageIndex = Math.min(index % Math.max(plates.length, 1), plates.length - 1);
    const plate = plates[stageIndex];

    if (!plate) return;

    const start = new THREE.Vector3(artifact.x - 0.42, artifact.y, artifact.z + 0.06);
    const mid = new THREE.Vector3((start.x + plate.x) * 0.5, (start.y + plate.y) * 0.5 - 0.12, Math.min(start.z, plate.z) - 0.28);
    const end = new THREE.Vector3(plate.x - 0.46, plate.y, plate.z);
    const color = new THREE.Color(index % 2 === 0 ? artifact.accent : plate.accent);

    positions.push(start.x, start.y, start.z, mid.x, mid.y, mid.z);
    positions.push(mid.x, mid.y, mid.z, end.x, end.y, end.z);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}

function createBackdrop(density: number) {
  const group = new THREE.Group();

  [
    { x: -0.72, y: 0.02, z: -1.24, w: 3.7, h: 2.05, color: "#efe9dc", opacity: 0.032 },
    { x: -1.05, y: -0.18, z: -1.02, w: 1.8, h: 1.26, color: "#ed4956", opacity: 0.055 + density * 0.035 },
    { x: 1.18, y: 0.1, z: -1.12, w: 1.72, h: 1.16, color: "#58c8be", opacity: 0.045 + density * 0.03 },
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
    mesh.rotation.z = index === 1 ? -0.08 : index === 2 ? 0.07 : 0;
    group.add(mesh);
  });

  return group;
}

export function CinematicSignalUniverseScene({
  reels,
  stages,
  stats,
  quality,
  active,
}: {
  reels: ViralReelNode[];
  stages: CinematicFlowStage[];
  stats: ViralUniverseStats;
  quality: ViralSceneQuality;
  active: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 60);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: quality.antialias,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    const density = archiveDensity(stats);
    const artifacts = buildArchiveArtifacts({ reels, stats, limit: Math.min(quality.reelLimit, 14) });
    const plates = createStagePlates(stages);
    const root = new THREE.Group();
    const backdrop = createBackdrop(density);
    const artifactGroups = artifacts.map(createArtifactMesh);
    const stageGroups = plates.map(createStagePlate);
    const connectors = createConnectionLines(artifacts, plates);
    const startedAt = performance.now();
    const cameraTarget = new THREE.Vector3(0.02, 0.02, 5.2);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(quality.dpr, 1.45));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    renderer.domElement.dataset.engine = "cinematic-signal-universe-webgl";
    renderer.domElement.dataset.scene = "reel-signal-brief-studio-flow";
    camera.position.set(0.02, 0.02, 5.2);

    root.position.set(0.03, -0.02, 0);
    root.add(backdrop, connectors, ...artifactGroups, ...stageGroups);
    scene.add(root);
    mount.appendChild(renderer.domElement);

    let disposed = false;
    let rafId: number | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let lastFrame = 0;

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
        material.opacity = 0.95;
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
      renderer.render(scene, camera);
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

      root.rotation.y = Math.sin(elapsed * 0.08) * 0.018;
      backdrop.rotation.z = Math.sin(elapsed * 0.05) * 0.008;
      connectors.scale.setScalar(1 + Math.sin(elapsed * 0.32) * 0.006);

      artifactGroups.forEach((group) => {
        const artifact = group.userData.artifact as ViralArchiveArtifact;
        const power = clamp(artifact.score / 100, 0.12, 1);
        const float = Math.sin(elapsed * (0.16 + power * 0.16) + artifact.phase) * (0.006 + power * 0.012);

        group.position.y = artifact.y + float;
        group.rotation.y = artifact.rotationY - 0.1 + Math.sin(elapsed * 0.12 + artifact.phase) * 0.014;
      });

      stageGroups.forEach((group) => {
        const plate = group.userData.plate as StagePlate;
        const activePulse = plate.stage.state === "current" ? 0.018 : 0.008;

        group.position.y = plate.y + Math.sin(elapsed * 0.18 + plate.y) * activePulse;
      });

      cameraTarget.set(pointerX * quality.cameraDrift * 0.65, pointerY * quality.cameraDrift * 0.16, 5.2);
      camera.position.lerp(cameraTarget, 0.04);
      camera.lookAt(0, 0, -0.55);
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
  }, [active, quality.antialias, quality.cameraDrift, quality.dpr, quality.reelLimit, reels, stages, stats]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
