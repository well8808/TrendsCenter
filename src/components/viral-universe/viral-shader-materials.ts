import * as THREE from "three";

export const viralGlowVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const viralGlowFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  varying vec3 vPosition;

  float ring(float dist, float radius, float width) {
    return smoothstep(width, 0.0, abs(dist - radius));
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered);
    float pulse = 0.5 + 0.5 * sin(uTime * 0.85 + dist * 12.0);
    float halo = smoothstep(0.5, 0.04, dist);
    float scan = ring(dist, 0.22 + pulse * 0.08, 0.08);
    vec3 color = mix(uColorA, uColorB, pulse);
    float alpha = (halo * 0.18 + scan * 0.28) * uOpacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

export function createViralGlowMaterial({
  colorA = "#ed4956",
  colorB = "#f77737",
  opacity = 1,
}: {
  colorA?: string;
  colorB?: string;
  opacity?: number;
}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    },
    vertexShader: viralGlowVertexShader,
    fragmentShader: viralGlowFragmentShader,
  });
}
