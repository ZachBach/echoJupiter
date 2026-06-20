import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import Scene from './Scene'

export default function App() {
  const [emotion, setEmotion] = useState(0.2)

  return (
    <div
      onClick={() => setEmotion((e) => (e >= 1 ? 0 : Math.min(1, e + 0.2)))}
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
        <Scene emotion={emotion} />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 16,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'monospace',
          fontSize: 12,
          letterSpacing: '0.08em'
        }}
      >
        echoJupiter — click to shift emotion ({emotion.toFixed(1)})
      </div>
    </div>
  )
}

// This is the original shader code before I refactored it into the Scene component. I kept it here for reference and to show how the shader evolved during development.

// import { Canvas, useFrame } from '@react-three/fiber'
// import { useRef, useState } from 'react'

// function Field({ emotion }) {
//   const ref = useRef()

//   useFrame(({ clock }) => {
//     if (!ref.current) return
//     ref.current.material.uniforms.uTime.value = clock.getElapsedTime()
//     ref.current.material.uniforms.uEmotion.value = emotion
//   })

//   return (
//     <mesh ref={ref}>
//       <planeGeometry args={[4, 4, 128, 128]} />

//       <shaderMaterial

//         uniforms={{
//           uTime: { value: 0 },
//           uEmotion: { value: emotion }
//         }}


//         fragmentShader={`
// precision mediump float;

// uniform float uEmotion;
// uniform float uTime;
// varying float vWave;

// void main() {
//   float intensity = vWave * 0.5 + 0.5;
//   float e = clamp(uEmotion, 0.0, 1.0);

//   vec3 calm = vec3(0.2, 0.4, 1.0);
//   vec3 accent = vec3(0.6, 0.2, 1.0);
//   vec3 neon = vec3(0.1, 1.0, 0.5);

//   vec3 base = mix(calm, accent, e);

//   float pulse = sin(uTime * (2.0 + e * 6.0)) * 0.5 + 0.5;
//   float glow = pulse * e * intensity;

//   vec3 color = mix(base, neon, glow * 0.6);

//   gl_FragColor = vec4(color * intensity, 1.0);
// }
// `}

//         vertexShader={`
// precision mediump float;

// uniform float uTime;
// uniform float uEmotion;

// varying float vWave;

// void main() {
//   vec3 pos = position;

//   float freq = 1.0 + uEmotion * 4.0;

//   float wave1 = sin(pos.x * freq + uTime);
//   float wave2 = cos(pos.y * freq * 1.2 + uTime * 1.1);
//   float wave3 = sin(length(pos.xy) * 2.0 - uTime);

//   float combined = (wave1 + wave2 + wave3) / 3.0;

//   pos.z += combined * 0.4;
//   vWave = combined;

//   gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
// }
// `}

//       />
//     </mesh>
//   )
// }

// export default function App() {
//   const [emotion, setEmotion] = useState(0.2)

//   return (
//     <div
//       onClick={() => setEmotion(e => Math.min(1, e + 0.2))}
//       style={{ width: '100vw', height: '100vh', background: 'black' }}
//     >
//       <Canvas camera={{ position: [0, 0, 3] }}>
//         <Field emotion={emotion} />
//       </Canvas>
//     </div>
//   )
// //