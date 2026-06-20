import { Canvas } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import Scene from './Scene'
import { EMOTION_STATES } from './emotionStates'

export default function App() {
  const [emotionIndex, setEmotionIndex] = useState(0)

  const emotionState = useMemo(
    () => EMOTION_STATES[emotionIndex],
    [emotionIndex]
  )

  const nextEmotion = () => {
    setEmotionIndex((i) => (i + 1) % EMOTION_STATES.length)
  }

  return (
    <div
      onClick={nextEmotion}
      style={{
        width: '100vw',
        height: '100vh',
        background:
          'radial-gradient(circle at center, #090014 0%, #020208 45%, #000000 100%)',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Scene emotionState={emotionState} />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 16,
          color: 'rgba(255,255,255,0.78)',
          fontFamily: 'monospace',
          fontSize: 12,
          letterSpacing: '0.08em',
          lineHeight: 1.5
        }}
      >
        <div>echoJupiter</div>
        <div>state: {emotionState.label}</div>
        <div>click to cycle emotion</div>
      </div>
    </div>
  )
}