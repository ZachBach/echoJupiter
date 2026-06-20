import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

export default function JupiterField({ emotion, runtime }) {
    const ref = useRef()

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uEmotion: { value: emotion },
            uMorph: { value: 0 },
            uEnergy: { value: 0.5 },
            uCoherence: { value: 0.2 },
            uStormIntensity: { value: 0.2 }
        }),
        [emotion]
    )

    useFrame(({ clock }) => {
        if (!ref.current) return

        const t = clock.getElapsedTime()
        const r = runtime.current

        ref.current.rotation.y += 0.0015 + emotion * 0.002
        ref.current.rotation.z = Math.sin(t * 0.15) * 0.06

        const mat = ref.current.material
        mat.uniforms.uTime.value = t
        mat.uniforms.uEmotion.value = emotion
        mat.uniforms.uMorph.value = r.morph
        mat.uniforms.uEnergy.value = r.energy
        mat.uniforms.uCoherence.value = r.coherence
        mat.uniforms.uStormIntensity.value = r.storm
    })

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[1.3, 192, 192]} />
            <shaderMaterial
                uniforms={uniforms}
                transparent={false}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </mesh>
    )
}

const vertexShader = `
precision mediump float;

uniform float uTime;
uniform float uEmotion;
uniform float uMorph;
uniform float uEnergy;
uniform float uCoherence;
uniform float uStormIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vSignal;
varying float vBands;

void main() {
  vUv = uv;
  vNormal = normal;

  vec3 pos = position;

  // Abstract signal interference
  float wave1 = sin(pos.y * 8.0 + uTime * 1.2);
  float wave2 = cos(pos.x * 11.0 - uTime * 1.1);
  float wave3 = sin(length(pos.xy) * 14.0 - uTime * 1.7);
  float signal = (wave1 + wave2 + wave3) / 3.0;

  // Planet-like banding emerges as morph increases
  float bands = sin((uv.y * 28.0) + sin(uv.x * 8.0 + uTime * 0.35) * 1.7);

  // Turbulence decreases as coherence rises
  float chaoticAmp = (1.0 - uMorph) * (0.35 + uEmotion * 0.35);
  float planetAmp = uMorph * (0.08 + uStormIntensity * 0.10);

  pos += normal * signal * chaoticAmp;
  pos += normal * bands * planetAmp;

  // slight breathing / pulse
  float pulse = sin(uTime * (1.2 + uEnergy * 1.8)) * 0.5 + 0.5;
  pos += normal * pulse * 0.04 * (0.3 + uEmotion);

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vSignal = signal;
  vBands = bands;

  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const fragmentShader = `
precision mediump float;

uniform float uTime;
uniform float uEmotion;
uniform float uMorph;
uniform float uEnergy;
uniform float uCoherence;
uniform float uStormIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vSignal;
varying float vBands;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;

  // Base abstract interference field
  float sig = vSignal * 0.5 + 0.5;
  float pulse = sin(uTime * (2.0 + uEmotion * 5.0)) * 0.5 + 0.5;

  vec3 calm = vec3(0.16, 0.30, 0.95);
  vec3 accent = vec3(0.64, 0.15, 1.0);
  vec3 neon = vec3(0.05, 1.0, 0.72);

  vec3 abstractBase = mix(calm, accent, uEmotion);
  vec3 abstractColor = mix(abstractBase, neon, sig * pulse * (0.3 + uEmotion * 0.5));

  // Jupiter-like palette (stylized, not realistic)
  vec3 cream = vec3(0.89, 0.78, 0.62);
  vec3 tan   = vec3(0.74, 0.50, 0.30);
  vec3 rust  = vec3(0.63, 0.28, 0.16);
  vec3 deep  = vec3(0.30, 0.16, 0.10);

  float bandMask =
    sin(uv.y * 24.0 + sin(uv.x * 9.0 + uTime * 0.25) * 1.8) * 0.5 + 0.5;

  float swirls =
    noise(uv * 8.0 + vec2(uTime * 0.04, 0.0)) * 0.6 +
    noise(uv * 18.0 + vec2(0.0, uTime * 0.03)) * 0.4;

  float jMix = clamp(bandMask * 0.7 + swirls * 0.6, 0.0, 1.0);

  vec3 jupiter = mix(cream, tan, jMix);
  jupiter = mix(jupiter, rust, smoothstep(0.55, 0.95, jMix));
  jupiter = mix(jupiter, deep, smoothstep(0.82, 1.0, jMix));

  // Great-red-ish storm, emerging late
  vec2 stormCenter = vec2(0.68, 0.38);
  float storm =
    1.0 - smoothstep(0.0, 0.18 + 0.05 * sin(uTime * 0.4),
    distance(uv, stormCenter + vec2(sin(uTime * 0.2) * 0.015, 0.0)));

  vec3 stormColor = vec3(0.86, 0.34, 0.18);
  jupiter = mix(jupiter, stormColor, storm * uMorph * uStormIntensity * 0.85);

  // Interference still lives inside the planet
  float signalLines = sin((uv.x + uv.y) * 40.0 - uTime * 2.0) * 0.5 + 0.5;
  vec3 signalTint = mix(neon, accent, signalLines);

  vec3 color = mix(abstractColor, jupiter, uMorph);
  color += signalTint * (1.0 - uMorph) * 0.18;
  color += signalTint * uMorph * (1.0 - uCoherence) * 0.08;

  // Rim + glow
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.7);
  color += vec3(0.25, 0.45, 1.0) * fresnel * (0.15 + (1.0 - uMorph) * 0.2);
  color += vec3(1.0, 0.45, 0.15) * fresnel * uMorph * 0.12;

  gl_FragColor = vec4(color, 1.0);
}
`