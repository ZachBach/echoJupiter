import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'

export default function SignalBackground({ emotion, runtime }) {
    const ref = useRef()

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uEmotion: { value: emotion },
            uMorph: { value: 0 },
            uEnergy: { value: 0.5 },
            uCoherence: { value: 0.2 }
        }),
        [emotion]
    )

    useFrame(({ clock }) => {
        if (!ref.current) return

        const t = clock.getElapsedTime()
        const r = runtime.current

        ref.current.material.uniforms.uTime.value = t
        ref.current.material.uniforms.uEmotion.value = emotion
        ref.current.material.uniforms.uMorph.value = r.morph
        ref.current.material.uniforms.uEnergy.value = r.energy
        ref.current.material.uniforms.uCoherence.value = r.coherence
    })

    return (
        <mesh ref={ref} position={[0, 0, -4]}>
            <planeGeometry args={[16, 10, 128, 128]} />
            <shaderMaterial
                uniforms={uniforms}
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

varying vec2 vUv;
varying float vWave;

void main() {
  vUv = uv;
  vec3 pos = position;

  float wave1 = sin(pos.x * (1.0 + uEmotion * 3.0) + uTime);
  float wave2 = cos(pos.y * 1.6 + uTime * 1.1);
  float wave3 = sin(length(pos.xy) * 1.5 - uTime * 0.8);

  float combined = (wave1 + wave2 + wave3) / 3.0;

  pos.z += combined * 0.25 * (1.0 - uMorph * 0.55);
  pos.z += sin((pos.x + pos.y) * 2.0 + uTime * 0.6) * 0.08 * uEnergy;

  vWave = combined;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
precision mediump float;

uniform float uTime;
uniform float uEmotion;
uniform float uMorph;
uniform float uEnergy;
uniform float uCoherence;

varying vec2 vUv;
varying float vWave;

void main() {
  float intensity = vWave * 0.5 + 0.5;

  vec3 deep = vec3(0.02, 0.03, 0.08);
  vec3 calm = vec3(0.12, 0.28, 0.9);
  vec3 accent = vec3(0.60, 0.18, 1.0);
  vec3 neon = vec3(0.06, 1.0, 0.72);

  vec3 base = mix(calm, accent, uEmotion);
  float pulse = sin(uTime * (1.6 + uEnergy * 2.8)) * 0.5 + 0.5;

  float grid = sin(vUv.x * 80.0 + uTime) * sin(vUv.y * 46.0 - uTime * 0.7);
  grid = grid * 0.5 + 0.5;

  vec3 color = mix(deep, base, intensity * 0.65);
  color = mix(color, neon, pulse * grid * 0.18);
  color *= 1.0 - uMorph * 0.35;
  color += neon * (1.0 - uCoherence) * 0.08;

  gl_FragColor = vec4(color, 1.0);
}
`