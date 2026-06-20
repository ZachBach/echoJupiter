import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const COUNT = 2600
const NODE_COUNT = 120

export default function DysonParticles({ emotion, runtime }) {
    const shellRef = useRef()
    const nodesRef = useRef()
    const groupRef = useRef()

    const shellPositions = useMemo(() => {
        const arr = new Float32Array(COUNT * 3)

        for (let i = 0; i < COUNT; i++) {
            arr[i * 3 + 0] = (Math.random() - 0.5) * 6
            arr[i * 3 + 1] = (Math.random() - 0.5) * 6
            arr[i * 3 + 2] = (Math.random() - 0.5) * 6
        }

        return arr
    }, [])

    const shellTargetsA = useMemo(() => {
        const arr = new Float32Array(COUNT * 3)

        for (let i = 0; i < COUNT; i++) {
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            const r = 1.95 + Math.random() * 0.55

            arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
            arr[i * 3 + 1] = r * Math.cos(phi) * 0.8
            arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
        }

        return arr
    }, [])

    const shellTargetsB = useMemo(() => {
        const arr = new Float32Array(COUNT * 3)

        for (let i = 0; i < COUNT; i++) {
            const theta = Math.random() * Math.PI * 2
            const ringR = 2.35 + (Math.random() - 0.5) * 0.5
            const y = (Math.random() - 0.5) * 0.9

            arr[i * 3 + 0] = Math.cos(theta) * ringR
            arr[i * 3 + 1] = y
            arr[i * 3 + 2] = Math.sin(theta) * ringR
        }

        return arr
    }, [])

    const shellColors = useMemo(() => {
        const arr = new Float32Array(COUNT * 3)

        for (let i = 0; i < COUNT; i++) {
            const t = Math.random()
            arr[i * 3 + 0] = THREE.MathUtils.lerp(0.15, 1.0, t)
            arr[i * 3 + 1] = THREE.MathUtils.lerp(0.45, 0.95, 1.0 - t)
            arr[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 0.35, t)
        }

        return arr
    }, [])

    const nodePositions = useMemo(() => {
        const arr = new Float32Array(NODE_COUNT * 3)

        for (let i = 0; i < NODE_COUNT; i++) {
            const theta = (i / NODE_COUNT) * Math.PI * 2
            const r = 2.55 + Math.random() * 0.35
            const y = (Math.random() - 0.5) * 0.6

            arr[i * 3 + 0] = Math.cos(theta) * r
            arr[i * 3 + 1] = y
            arr[i * 3 + 2] = Math.sin(theta) * r
        }

        return arr
    }, [])

    const nodeColors = useMemo(() => {
        const arr = new Float32Array(NODE_COUNT * 3)

        for (let i = 0; i < NODE_COUNT; i++) {
            arr[i * 3 + 0] = 1.0
            arr[i * 3 + 1] = 0.72
            arr[i * 3 + 2] = 0.35
        }

        return arr
    }, [])

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        const r = runtime.current

        if (groupRef.current) {
            groupRef.current.rotation.y += 0.0015 + r.energy * 0.003
            groupRef.current.rotation.x = Math.sin(t * 0.14) * 0.16
            groupRef.current.rotation.z = Math.cos(t * 0.11) * 0.05
        }

        if (shellRef.current) {
            const attr = shellRef.current.geometry.attributes.position
            const arr = attr.array
            const evolve = r.particleEvolve
            const coherence = r.coherence

            for (let i = 0; i < COUNT; i++) {
                const idx = i * 3

                const cx = shellPositions[idx]
                const cy = shellPositions[idx + 1]
                const cz = shellPositions[idx + 2]

                const ax = shellTargetsA[idx]
                const ay = shellTargetsA[idx + 1]
                const az = shellTargetsA[idx + 2]

                const bx = shellTargetsB[idx]
                const by = shellTargetsB[idx + 1]
                const bz = shellTargetsB[idx + 2]

                const structureMix = 0.35 + coherence * 0.65

                const tx = THREE.MathUtils.lerp(ax, bx, structureMix)
                const ty = THREE.MathUtils.lerp(ay, by, structureMix)
                const tz = THREE.MathUtils.lerp(az, bz, structureMix)

                const angle = t * (0.25 + emotion * 0.55) + i * 0.017
                const swirl = (1.0 - evolve) * (0.28 + emotion * 0.18)

                const ox = Math.cos(angle) * swirl
                const oy = Math.sin(angle * 1.2) * swirl * 0.45
                const oz = Math.sin(angle) * swirl

                arr[idx] = THREE.MathUtils.lerp(cx, tx + ox, evolve)
                arr[idx + 1] = THREE.MathUtils.lerp(cy, ty + oy, evolve)
                arr[idx + 2] = THREE.MathUtils.lerp(cz, tz + oz, evolve)
            }

            attr.needsUpdate = true

            shellRef.current.material.size = 0.016 + emotion * 0.026
            shellRef.current.material.opacity = 0.28 + evolve * 0.42
        }

        if (nodesRef.current) {
            nodesRef.current.rotation.y -= 0.002 - emotion * 0.0005
            nodesRef.current.rotation.x = Math.sin(t * 0.22) * 0.08
            nodesRef.current.material.size = 0.04 + r.particleEvolve * 0.035
            nodesRef.current.material.opacity = 0.45 + r.particleEvolve * 0.35
        }
    })

    return (
        <group ref={groupRef}>
            <points ref={shellRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        array={shellPositions}
                        count={shellPositions.length / 3}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        array={shellColors}
                        count={shellColors.length / 3}
                        itemSize={3}
                    />
                </bufferGeometry>

                <pointsMaterial
                    size={0.03}
                    vertexColors={true}
                    transparent={true}
                    opacity={0.7}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            <points ref={nodesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        array={nodePositions}
                        count={nodePositions.length / 3}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        array={nodeColors}
                        count={nodeColors.length / 3}
                        itemSize={3}
                    />
                </bufferGeometry>

                <pointsMaterial
                    size={0.065}
                    vertexColors={true}
                    transparent={true}
                    opacity={0.8}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </group>
    )
}