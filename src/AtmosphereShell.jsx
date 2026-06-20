import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

export default function AtmosphereShell({ emotionState, runtime }) {
    const ref = useRef()

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uEmotion: { value: emotionState.value },
            uMorph: { value: 0 },
            uCoherence: { value: 0.2 },
            uWarmth: { value: emotionState.warmth },
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
        ref.current.material.uniforms.uCoherence.value = r.coherence
        ref.current.material.uniforms.uWarmth.value = r.warmth
        ref.current.material.uniforms.uPulseState.value = r.pulse

        ref.current.rotation.y -= 0.001
        ref.current.rotation.z = Math.sin(t * 0.12) * 0.08
    })

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[1.42, 128, 128]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent={true}
                depthWrite={false}
                side={THREE.BackSide}
                toneMapped={false}
            />
        </mesh>
    )
}

const vertexShader = `
precision mediump float;

uniform float uTime;
uniform float uMorph;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 pos = position;
  float ripple = sin(uv.y * 30.0 + uTime * 0.8) * 0.01;
  pos += normal * ripple * (0.3 + uMorph * 0.7);

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const fragmentShader = `
precision mediump float;

uniform float uTime;
uniform float uEmotion;
uniform float uMorph;
uniform float uCoherence;
uniform float uWarmth;
uniform float uPulseState;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 3.5);
  float pulse = sin(uTime * (1.8 + uPulseState * 3.5)) * 0.5 + 0.5;
  float wave = sin(vUv.y * 36.0 - uTime * 1.4) * 0.5 + 0.5;

  vec3 blue = vec3(0.22, 0.45, 1.0);
  vec3 cyan = vec3(0.10, 0.95, 0.82);
  vec3 amber = vec3(1.0, 0.55, 0.18);

  vec3 edgeColor = mix(blue, cyan, uEmotion * 0.7);
  edgeColor = mix(edgeColor, amber, uWarmth * 0.5 + uMorph * 0.25);

  float alpha = fresnel * (0.16 + pulse * 0.16 + wave * 0.08);
  alpha *= 0.65 + uMorph * 0.45;
  alpha *= 0.7 + (1.0 - uCoherence) * 0.4;

  vec3 bloomColor = edgeColor * (1.15 + pulse * 0.9 + uMorph * 0.45);

  gl_FragColor = vec4(bloomColor, alpha);
}
`