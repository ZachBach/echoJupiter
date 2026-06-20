import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'

export default function SignalBackground({ emotionState, runtime }) {
    const ref = useRef()

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uEmotion: { value: emotionState.value },
            uMorph: { value: 0 },
            uEnergy: { value: 0.5 },
            uCoherence: { value: 0.2 },
            uPulseState: { value: emotionState.pulse }
        }),
        [emotionState]
    )

    useFrame(({ clock }) => {
        if (!ref.current) return

        const t = clock.getElapsedTime()
        const r = runtime.current

        ref.current.material.uniforms.uTime.value = t
        ref.current.material.uniforms.uEmotion.value = r.emotion
        ref.current.material.uniforms.uMorph.value = r.morph
        ref.current.material.uniforms.uEnergy.value = r.energy
        ref.current.material.uniforms.uCoherence.value = r.coherence
        ref.current.material.uniforms.uPulseState.value = r.pulse
    })

    return (
        <mesh ref={ref} position={[0, 0, -4]}>
            <planeGeometry args={[16, 10, 128, 128]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                toneMapped={false}
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

  // Kill animations when morph > 0.7 (approaching Jupiter)
  float animPhase = max(0.0, 1.0 - (uMorph - 0.7) / 0.3);
  
  float wave1 = sin(pos.x * (1.0 + uEmotion * 3.0) + uTime * animPhase);
  float wave2 = cos(pos.y * 1.6 + uTime * 1.1 * animPhase);
  float wave3 = sin(length(pos.xy) * 1.5 - uTime * 0.8 * animPhase);

  float combined = (wave1 + wave2 + wave3) / 3.0;

  pos.z += combined * 0.25 * (1.0 - uMorph * 0.55) * animPhase;
  pos.z += sin((pos.x + pos.y) * 2.0 + uTime * 0.6 * animPhase) * 0.08 * uEnergy * animPhase;

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
uniform float uPulseState;

varying vec2 vUv;
varying float vWave;

void main() {
  float intensity = vWave * 0.5 + 0.5;

  vec3 deep = vec3(0.02, 0.03, 0.08);
  vec3 calm = vec3(0.12, 0.28, 0.9);
  vec3 accent = vec3(0.60, 0.18, 1.0);
  vec3 neon = vec3(0.06, 1.0, 0.72);

  vec3 base = mix(calm, accent, uEmotion);
  
  // Kill pulsing when morph approaches 1.0
  float pulseFade = max(0.0, 1.0 - (uMorph - 0.6) / 0.4);
  float pulse = sin(uTime * (1.4 + uPulseState * 3.6 + uEnergy)) * 0.5 + 0.5;
  pulse = mix(pulse, 0.5, 1.0 - pulseFade);  // Fade to neutral 0.5 at end

  float grid = sin(vUv.x * 80.0 + uTime * pulseFade) * sin(vUv.y * 46.0 - uTime * 0.7 * pulseFade);
  grid = grid * 0.5 + 0.5;

  vec3 color = mix(deep, base, intensity * 0.65);
  color = mix(color, neon, pulse * grid * 0.18 * pulseFade);
  color *= 1.0 - uMorph * 0.35;
  color += neon * (1.0 - uCoherence) * 0.08 * pulseFade;
  color += neon * pulse * 0.08 * pulseFade;

  gl_FragColor = vec4(color, 1.0);
}
`