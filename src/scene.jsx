import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import JupiterField from './JupiterField'
import DysonParticles from './DysonParticles'
import AtmosphereShell from './AtmosphereShell'
import SignalBackground from './SignalBackground'

export default function Scene({ emotion }) {
  const state = useRef({
    morph: 0,
    energy: 0,
    coherence: 0,
    storm: 0,
    particleEvolve: 0
  })

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    const morph = THREE.MathUtils.clamp(t / 24, 0, 1)
    const energy = 0.35 + emotion * 0.65
    const coherence = THREE.MathUtils.lerp(0.12 + emotion * 0.18, 1.0, morph)
    const storm = THREE.MathUtils.lerp(
      0.12 + emotion * 0.22,
      0.95,
      morph
    )
    const particleEvolve = THREE.MathUtils.clamp((t - 3.5) / 18, 0, 1)

    state.current.morph = morph
    state.current.energy = energy
    state.current.coherence = coherence
    state.current.storm = storm
    state.current.particleEvolve = particleEvolve
  })

  return (
    <>
      <color attach="background" args={['#02030a']} />
      <fog attach="fog" args={['#02030a', 8, 18]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 4]} intensity={1.1} color="#88aaff" />
      <pointLight position={[3, 2, 2]} intensity={0.7} color="#ff8844" />

      <SignalBackground emotion={emotion} runtime={state} />

      <group>
        <JupiterField emotion={emotion} runtime={state} />
        <AtmosphereShell emotion={emotion} runtime={state} />
        <DysonParticles emotion={emotion} runtime={state} />
      </group>
    </>
  )
}