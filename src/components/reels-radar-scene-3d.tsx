"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ReelsRadarScene3DProps {
  className?: string;
  intensity?: number;
  mode?: "library" | "radar";
}

const palette = {
  hot: new THREE.Color("#ed4956"),
  aqua: new THREE.Color("#58c8be"),
  gold: new THREE.Color("#e6b765"),
  violet: new THREE.Color("#9d83ec"),
};

function makeReelCard(color: THREE.Color, index: number) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 1.34, 0.035),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.54,
      blending: THREE.AdditiveBlending,
    }),
  );
  const play = new THREE.Mesh(
    new THREE.CircleGeometry(0.08, 24),
    new THREE.MeshBasicMaterial({
      color: palette.hot,
      transparent: true,
      opacity: 0.46,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  play.position.z = 0.025;
  group.add(body, edge, play);
  group.userData.phase = index * 0.62;

  return group;
}

function makeSignalNode(color: THREE.Color, index: number) {
  const group = new THREE.Group();
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 20, 12),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.13, 0.19, 36),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );

  halo.position.z = -0.005;
  group.add(dot, halo);
  group.userData.phase = index * 0.92;

  return group;
}

function makeOrbit(radius: number, color: THREE.Color, opacity: number, tilt: number) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.42, 0, Math.PI * 2);
  const points = curve.getPoints(160).map((point) => new THREE.Vector3(point.x, point.y, 0));
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
    }),
  );

  line.rotation.x = tilt;
  return line;
}

export function ReelsRadarScene3D({ className, intensity = 1, mode = "library" }: ReelsRadarScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const mountElement: HTMLDivElement = mount;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const root = new THREE.Group();
    const orbitItems = new THREE.Group();
    const clock = new THREE.Clock();
    const isRadar = mode === "radar";
    let frameId = 0;
    let visible = true;

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    mountElement.appendChild(renderer.domElement);

    camera.position.set(0, 0.08, 5.25);
    scene.add(root);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(isRadar ? 0.2 : 0.16, 32, 16),
      new THREE.MeshBasicMaterial({
        color: palette.hot,
        transparent: true,
        opacity: (isRadar ? 0.82 : 0.72) * intensity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    root.add(core);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(isRadar ? 1.04 : 0.86, 40, 20),
      new THREE.MeshBasicMaterial({
        color: palette.violet,
        transparent: true,
        opacity: (isRadar ? 0.1 : 0.07) * intensity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    root.add(glow);

    root.add(
      makeOrbit(1.22, palette.hot, (isRadar ? 0.52 : 0.42) * intensity, 0.52),
      makeOrbit(1.72, palette.aqua, (isRadar ? 0.34 : 0.26) * intensity, -0.34),
      makeOrbit(2.18, palette.gold, (isRadar ? 0.22 : 0.16) * intensity, 0.12),
    );

    const colors = [palette.hot, palette.aqua, palette.gold, palette.violet, palette.hot, palette.aqua];
    colors.forEach((color, index) => {
      const item = isRadar ? makeSignalNode(color, index) : makeReelCard(color, index);
      orbitItems.add(item);
    });
    root.add(orbitItems);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = isRadar ? 68 : 90;
    const positions = new Float32Array(starCount * 3);
    const colorsArray = new Float32Array(starCount * 3);

    for (let index = 0; index < starCount; index++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 2.9;
      const y = (Math.random() - 0.5) * 2.2;
      const color = [palette.hot, palette.aqua, palette.gold, palette.violet][index % 4];

      positions[index * 3] = Math.cos(theta) * radius;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = Math.sin(theta) * radius * 0.42;
      colorsArray[index * 3] = color.r;
      colorsArray[index * 3 + 1] = color.g;
      colorsArray[index * 3 + 2] = color.b;
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        size: 0.022,
        vertexColors: true,
        transparent: true,
        opacity: 0.48 * intensity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    root.add(stars);

    function resize() {
      const { width, height } = mountElement.getBoundingClientRect();
      const safeWidth = Math.max(1, width);
      const safeHeight = Math.max(1, height);

      renderer.setSize(safeWidth, safeHeight, false);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
    }

    function render() {
      const elapsed = clock.getElapsedTime();

      root.rotation.y = elapsed * 0.13;
      root.rotation.x = Math.sin(elapsed * 0.34) * 0.08 - 0.08;
      core.scale.setScalar(1 + Math.sin(elapsed * 2.1) * 0.18);
      glow.scale.setScalar(1 + Math.sin(elapsed * 0.9) * 0.08);
      stars.rotation.y = elapsed * 0.025;

      orbitItems.children.forEach((child, index) => {
        const phase = child.userData.phase as number;
        const angle = elapsed * 0.35 + phase;
        const radius = 1.18 + (index % 3) * 0.36;

        child.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.15) * 0.38, Math.sin(angle) * 0.7);
        child.rotation.y = isRadar ? angle * 0.18 : -angle + Math.PI / 2;
        child.rotation.z = Math.sin(angle * 0.8) * (isRadar ? 0.22 : 0.12);
      });

      renderer.render(scene, camera);
    }

    function animate() {
      render();
      if (!reducedMotion && visible) {
        frameId = requestAnimationFrame(animate);
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      render();
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible && !reducedMotion) {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(animate);
      }
    });

    resizeObserver.observe(mountElement);
    intersectionObserver.observe(mountElement);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry?.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material?.dispose();
          }
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [intensity, mode]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={`pointer-events-none${className ? ` ${className}` : ""}`}
    />
  );
}
