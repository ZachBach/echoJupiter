import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'

export default function JupiterField({ emotionState, runtime }) {
  const ref = useRef()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEmotion: { value: emotionState.value },
      uMorph: { value: 0 },
      uEnergy: { value: 0.5 },
      uCoherence: { value: 0.2 },
      uStormIntensity: { value: 0.2 },
      uTurbulence: { value: emotionState.turbulence },
      uWarmth: { value: emotionState.warmth },
      uPulseState: { value: emotionState.pulse }
    }),
    [emotionState]
  )

  useFrame(({ clock }) => {
    if (!ref.current) return

    const t = clock.getElapsedTime()
    const r = runtime.current
    const mat = ref.current.material

    ref.current.rotation.y += 0.0015 + r.particleSpeed * 0.002
    ref.current.rotation.z = Math.sin(t * 0.15) * 0.06

    mat.uniforms.uTime.value = t
    mat.uniforms.uEmotion.value = r.emotion
    mat.uniforms.uMorph.value = r.morph
    mat.uniforms.uEnergy.value = r.energy
    mat.uniforms.uCoherence.value = r.coherence
    mat.uniforms.uStormIntensity.value = r.storm
    mat.uniforms.uTurbulence.value = r.turbulence
    mat.uniforms.uWarmth.value = r.warmth
    mat.uniforms.uPulseState.value = r.pulse
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.3, 128, 128]} />
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
uniform float uCoherence;
uniform float uStormIntensity;
uniform float uTurbulence;
uniform float uPulseState;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vSignal;

void main() {
  vUv = uv;
  vNormal = normal;

  vec3 pos = position;

  float wave1 = sin(pos.y * 8.0 + uTime * (1.1 + uPulseState * 0.8));
  float wave2 = cos(pos.x * 11.0 - uTime * (1.0 + uPulseState * 0.7));
  float wave3 = sin(length(pos.xy) * 14.0 - uTime * (1.4 + uPulseState * 0.9));
  float signal = (wave1 + wave2 + wave3) / 3.0;

  float bands = sin((uv.y * 28.0) + sin(uv.x * 8.0 + uTime * 0.35) * 1.7);

  float chaoticAmp = (1.0 - uMorph) * (0.18 + uTurbulence * 0.42);
  float planetAmp = uMorph * (0.06 + uStormIntensity * 0.14);

  pos += normal * signal * chaoticAmp;
  pos += normal * bands * planetAmp;

  float pulse = sin(uTime * (1.0 + uEnergy * 2.2 + uPulseState)) * 0.5 + 0.5;
  pos += normal * pulse * 0.04 * (0.3 + uEmotion) * (1.0 - uMorph);

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vSignal = signal;

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
uniform float uTurbulence;
uniform float uWarmth;
uniform float uPulseState;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vSignal;

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

  return mix(a, b, u.x)
       + (c - a) * u.y * (1.0 - u.x)
       + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;

  float sig = vSignal * 0.5 + 0.5;
  float pulse = sin(uTime * (1.8 + uPulseState * 5.0)) * 0.5 + 0.5;

  // Abstract state colors - MUCH BRIGHTER for initial visibility
  vec3 calm = vec3(0.35, 0.55, 1.0);        // Bright blue
  vec3 accent = vec3(0.85, 0.35, 1.0);      // Bright purple
  vec3 neon = vec3(0.15, 1.0, 0.85);        // Bright cyan

  vec3 abstractBase = mix(calm, accent, uEmotion);
  vec3 abstractColor = mix(abstractBase, neon, sig * pulse * (0.25 + uPulseState * 0.6));

  // Jupiter-accurate colors: vivid bands and storm - HIGHLY SATURATED
  vec3 lightBand = vec3(1.0, 0.95, 0.65);      // Bright golden yellow
  vec3 calmBand = vec3(0.92, 0.80, 0.40);      // Rich golden-brown
  vec3 darkBand = vec3(0.80, 0.52, 0.15);      // Deep orange-brown
  vec3 stormRed = vec3(1.0, 0.55, 0.10);       // Vivid orange-red (Great Red Spot)
  vec3 deepDark = vec3(0.40, 0.25, 0.08);      // Very dark shadow

  // Enhance with warmth - push toward red/orange
  lightBand = mix(lightBand, vec3(1.0, 0.93, 0.70), uWarmth * 0.3);
  darkBand = mix(darkBand, vec3(0.95, 0.58, 0.18), uWarmth * 0.7);
  stormRed = mix(stormRed, vec3(1.0, 0.62, 0.12), uWarmth * 0.6);

  // Create distinct band structure with more contrast
  // ONLY use Y for bands - X causes seams!
  // Fade out animation as morph completes
  float bandPattern = sin(uv.y * 28.0 + uTime * 0.15 * earlyPhase) * 0.5 + 0.5;
  
  // Smoother horizontal banding to avoid seams
  float bandMask = smoothstep(0.35, 0.65, sin(uv.y * 24.0) * 0.5 + 0.5);

  // Turbulent swirls - Y-based only, fade out when morphing
  float swirls =
    noise(vec2(uTime * 0.04 * earlyPhase, uv.y * 4.0)) * 0.6 +
    noise(vec2(uTime * 0.03 * earlyPhase, uv.y * 6.0)) * 0.4;

  float jMix = clamp(bandPattern * 0.6 + swirls * 0.5 + bandMask * 0.3, 0.0, 1.0);

  // Layer the bands with more vibrant color transitions
  vec3 jupiter = mix(lightBand, calmBand, smoothstep(0.0, 0.35, jMix));
  jupiter = mix(jupiter, darkBand, smoothstep(0.35, 0.75, jMix));
  jupiter = mix(jupiter, deepDark, smoothstep(0.75, 1.0, jMix));

  // Great Red Spot - blend with bands, not a hard spot
  // Use Y-based positioning to avoid seam
  float stormLat = abs(uv.y - 0.38);  // Latitude band centered at v=0.38
  float storm = smoothstep(0.12, 0.0, stormLat);  // Smooth fade
  
  // Make it wiggle but only in Y - fades out at end
  storm *= mix(sin(uTime * 0.4) * 0.3 + 0.7, 1.0, latePhase);

  // Make the storm more vivid and dynamic
  float stormIntensity = storm * uStormIntensity;
  jupiter = mix(jupiter, stormRed, stormIntensity * 0.95);
  
  // Add warm glow around storm edges
  float stormGlow = smoothstep(0.25, 0.0, distance(uv, stormCenter)) * (1.0 - storm);
  jupiter += mix(vec3(0.0, 0.0, 0.0), stormRed * 0.3, stormGlow * 0.5);

  float signalLines = sin(uv.y * 40.0 - uTime * (1.4 + uPulseState * 1.5) * earlyPhase) * 0.5 + 0.5;
  vec3 signalTint = mix(neon, accent, signalLines);

  // Three-stage morph: early abstract → transition → late Jupiter
  float earlyPhase = smoothstep(0.5, 0.0, uMorph);           // 1 at morph=0, 0 at morph=0.5
  float transitionPhase = smoothstep(0.3, 0.7, uMorph);      // Ramps 0→1 between 0.3 and 0.7
  float latePhase = smoothstep(0.5, 1.0, uMorph);            // 0 at morph=0.5, 1 at morph=1.0

  // Early: show abstract with BRIGHT signals and pulsing
  vec3 earlyColor = abstractColor + signalTint * (0.5 + pulse * 0.4);  // Brighter, pulsing overlay
  
  // Late: show pure Jupiter
  vec3 lateColor = jupiter;
  
  // Blend phases together
  vec3 color = mix(earlyColor, lateColor, transitionPhase);

  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.7);
  
  // Fresnel rim bright in early state, fades as we transition to Jupiter
  color += vec3(0.35, 0.65, 1.0) * fresnel * earlyPhase * 0.35;
  color += vec3(0.15, 1.0, 0.85) * fresnel * earlyPhase * pulse * 0.2;
  
  gl_FragColor = vec4(color, 1.0);
}
`