import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'

import JupiterField from './JupiterField'
import DysonParticles from './DysonParticles'
import AtmosphereShell from './AtmosphereShell'
import SignalBackground from './SignalBackground'

export default function Scene({ emotionState }) {
  const state = useRef({
    morph: 0,
    energy: 0,
    coherence: 0,
    storm: 0,
    particleEvolve: 0,
    emotion: 0,
    pulse: 0,
    turbulence: 0,
    warmth: 0,
    particleSpeed: 0
  })

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    const morph = THREE.MathUtils.clamp(t / 24, 0, 1)

    const emotion = emotionState.value
    const warmth = emotionState.warmth
    const pulse = emotionState.pulse
    const turbulence = emotionState.turbulence
    const particleSpeed = emotionState.particleSpeed

    const energy = 0.25 + pulse * 0.75

    const coherence = THREE.MathUtils.clamp(
      THREE.MathUtils.lerp(0.12 + emotionState.coherenceBias * 0.35, 1.0, morph),
      0,
      1
    )

    const storm = THREE.MathUtils.clamp(
      THREE.MathUtils.lerp(
        0.08 + emotionState.stormBias * 0.45,
        0.65 + emotionState.stormBias * 0.35,
        morph
      ),
      0,
      1
    )

    const particleEvolve = THREE.MathUtils.clamp((t - 3.5) / 18, 0, 1)

    state.current.morph = morph
    state.current.energy = energy
    state.current.coherence = coherence
    state.current.storm = storm
    state.current.particleEvolve = particleEvolve
    state.current.emotion = emotion
    state.current.pulse = pulse
    state.current.turbulence = turbulence
    state.current.warmth = warmth
    state.current.particleSpeed = particleSpeed
  })

  return (
    <>
      <color attach="background" args={['#02030a']} />
      <fog attach="fog" args={['#02030a', 8, 18]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 4]} intensity={1.1} color="#88aaff" />
      <pointLight position={[3, 2, 2]} intensity={0.7} color="#ff8844" />

      <SignalBackground emotionState={emotionState} runtime={state} />

      <group>
        <JupiterField emotionState={emotionState} runtime={state} />
        <AtmosphereShell emotionState={emotionState} runtime={state} />
        <DysonParticles emotionState={emotionState} runtime={state} />
      </group>

      <EffectComposer>
        <Bloom
          intensity={1.15}
          luminanceThreshold={0.18}
          luminanceSmoothing={0.55}
          mipmapBlur
        />
        <ChromaticAberration
          offset={[0.0015, 0.0012]}
        />
        <Vignette
          eskil={false}
          offset={0.1}
          darkness={0.5}
        />
      </EffectComposer>
    </>
  )
}