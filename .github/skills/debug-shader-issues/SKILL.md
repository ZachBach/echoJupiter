---
name: debug-shader-issues
description: |
  Multi-step debugging workflow for echoJupiter shader and code quality issues.
  Use when: diagnosing visual artifacts, performance problems, state synchronization bugs, or shader logic errors.
  Guides systematic inspection of rendering, performance, uniforms, and component interactions.
---

# Debug Shader Issues in echoJupiter

## Overview
This skill provides a **systematic workflow** for identifying and fixing issues in shader rendering, React component state, and Three.js integration. It combines visual inspection, performance profiling, logic review, and iterative testing.

---

## Workflow Steps

### Step 1: Visual Inspection & Symptom Documentation

**Goal:** Characterize what's broken visually or functionally.

**Actions:**
1. **Run the dev server**: `npm run dev` and open in browser
2. **Observe the issue**:
   - Where does the artifact appear? (specific region, all over, intermittent?)
   - What does it look like? (wrong color, distortion, flickering, frozen, lag?)
   - When does it occur? (on load, after interaction, continuously?)
   - Which component is affected? (JupiterField, DysonParticles, background?)
3. **Document symptoms**:
   - Expected behavior
   - Actual behavior
   - Reproduction steps (if interactive controls exist)
   - Emotional state or parameter values that trigger it

**Suspected Component** (narrow down):
- Shader logic issue → JupiterField.jsx or DysonParticles.jsx vertex/fragment shaders
- State sync issue → useFrame hook, uniform updates
- Rendering issue → geometry, material, camera
- Performance issue → draw calls, texture resolution, animation loop

---

### Step 2: Browser DevTools & WebGL Inspection

**Goal:** Capture error messages and WebGL warnings that pinpoint the root cause.

**Actions:**
1. **Open Chrome DevTools** (F12)
2. **Check Console tab**:
   - Any red errors or yellow warnings?
   - Three.js warnings about deprecated features?
   - React errors from hooks or state?
   - WebGL errors or shader compile failures?
3. **Enable WebGL debugging** (Chrome):
   - Install "Spector.js" extension (Chrome Web Store) OR use Chrome's built-in WebGL inspector
   - Record a frame capture to inspect:
     - Shader source code (verify it compiled)
     - Draw calls and uniforms passed each frame
     - Texture bindings and state
4. **Check Network tab**:
   - All files loaded? (especially shaders if they're external)
   - Any 404s or failed requests?

**Quick Fix Checklist:**
- ✅ Shader compilation errors in WebGL inspector?
- ✅ Missing semicolons in shader code?
- ✅ Typo in uniform name (JS vs GLSL mismatch)?
- ✅ Uniform value out of expected range (e.g., emotion > 1)?
- ✅ Division by zero or NaN in calculations?
- ✅ Out-of-bounds array access or undefined references?

---

### Step 3: Performance Profiling (PRIORITY)

**Goal:** Determine if the issue is performance-related (dropped frames, GPU bottleneck, memory spike).

**Actions:**
1. **Baseline FPS measurement**:
   - Open DevTools > Performance tab
   - Record 5-10 seconds of interaction
   - Check FPS graph: target 60 FPS, acceptable 30+ FPS steady
   - If drops below 30 FPS frequently → Performance issue confirmed

2. **Identify the bottleneck** (CPU or GPU):
   - **CPU-bound**: Main thread blocking (orange bars in Performance tab)
     - Likely: Complex useFrame calculations, state updates, re-renders
   - **GPU-bound**: Rendering thread slow (check GPU usage in Task Manager)
     - Likely: Too many draw calls, shader too complex, geometry too dense

3. **Profile Three.js rendering**:
   - Add this to `main.jsx` during development:
     ```javascript
     import Stats from 'three/examples/jsm/libs/stats.module.js'
     const stats = new Stats()
     document.body.appendChild(stats.dom)
     // Call stats.update() in your animation loop (three.js does this automatically)
     ```
   - Watch FPS, render time, and memory allocation in real-time

4. **Check specific component costs**:
   - **JupiterField sphere geometry**: Currently `sphereGeometry args={[1.3, 192, 192]}`
     - 192×192 = 36,864 vertices per sphere; try 96×96 (9,216) or 64×64 (4,096) for quick test
   - **DysonParticles**: How many particles? 1000+ can cause lag
   - **Shader complexity**: Too many sin/cos/noise calls?

5. **GPU memory check** (DevTools):
   - Open DevTools > Memory tab
   - Watch for heap size growth (memory leak indicator)
   - GPU VRAM pressure: (GPU has ~2-8 GB typically; monitor in external tools)

**Performance Optimization Checklist** (prioritized):
- 🔴 **Critical**: Reduce geometry density (sphere args) or particle count
- 🟠 **High**: Simplify shader math (fewer sin/cos/noise calls, precompute if possible)
- 🟡 **Medium**: Cache uniform calculations, avoid per-frame object allocations
- 🟢 **Low**: Enable WebGL context loss recovery, consider LOD (level of detail)

**Quick Win**: Reduce JupiterField sphere from 192×192 to 64×64 → typically 3-5x FPS improvement

---

### Step 4: Shader Logic Review

**Goal:** Inspect the shader code for mathematical or logical errors.

**Actions:**
1. **Review vertex shader**:
   - Wave calculations correct? (sin/cos arguments, frequency scaling)
   - Morph/coherence logic: Is the interpolation correct?
   - Pulse calculation: Does it behave as expected?
   - Normal transformations: Are positions being modified correctly?

2. **Review fragment shader**:
   - Color interpolation smooth? (no hard boundaries where there shouldn't be)
   - Noise function producing stable output? (hash and noise stable over time?)
   - UV coordinate calculations correct?
   - Fresnel effect magnitude appropriate?

3. **Inspect uniform updates** (in React component):
   - Are uniforms being passed before shader runs? (check order of operations in useFrame)
   - Are `ref.current.material.uniforms` being modified correctly?
   - Are emotion/energy/coherence values in expected range (0-1)?

---

### Step 5: State Synchronization Check

**Goal:** Verify React state flows correctly into shader uniforms.

**Actions:**
1. **In JupiterField.jsx** (or similar components):
   - Does `useFrame` run every frame?
   - Do all uniforms get updated with current values?
   - Is `runtime.current` being passed and accessed correctly?
2. **In parent component** (App.jsx or similar):
   - Are emotion, energy, coherence, storm intensity values being calculated?
   - Are they passed correctly as props?
   - Do values stay in valid range? (add clamp/normalize if needed)
3. **Test isolated changes**:
   - Temporarily hardcode a uniform value → does visual change as expected?
   - Temporarily disable a wave function → does artifact disappear?
   - Temporarily freeze time (`uTime = 0`) → does animation stop?

---

### Step 6: Iterative Refinement & Testing

**Goal:** Make targeted fixes and verify each one works.

**Actions:**
1. **Make ONE change** at a time (shader code, uniform calculation, geometry, etc.)
2. **Test in browser** → does the issue improve, worsen, or stay the same?
3. **Commit or revert** based on outcome
4. **Repeat** until the issue is resolved

**Tips:**
- Use browser DevTools > Sources to edit shaders live (hot reload)
- Add debug visualization (e.g., output wave values as color to debug signal)
- Compare with git history if behavior recently changed

---

## Decision Tree: Quick Diagnosis

```
Issue: Visual artifact or wrong behavior

├─ Error in console?
│  ├─ YES → Go to Step 2 (DevTools)
│  └─ NO → Continue below
│
├─ Happens continuously or just sometimes?
│  ├─ Continuously → Likely shader or logic issue
│  └─ Sometimes → Likely timing, state, or async issue
│
├─ Affects performance (low FPS)?
│  ├─ YES → Go to Step 3 (Profiling)
│  └─ NO → Go to Step 4 (Shader Logic)
│
└─ Is the visual output mathematically wrong?
   ├─ YES → Go to Step 4 (Shader math)
   └─ NO → Go to Step 5 (State Sync)
```

---

## Common Fixes in echoJupiter

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Wrong colors, weird gradients | Emotion/coherence not synced | Check `runtime.current` passed correctly, verify uniform range |
| Flickering or strobing | uTime calculation wrong, or wave frequencies off | Debug uTime value, adjust sin/cos frequencies |
| Frozen animation | useFrame not running, or geometry not updating | Check ref, verify useFrame dependency array |
| Slow FPS | Geometry too dense or shader too complex | Reduce sphere geometry args, simplify noise calcs |
| Black screen or invisible mesh | Shader compilation error, or camera clipping | Check console errors, adjust near/far planes |
| Sharp/jagged bands instead of smooth | Banding function frequency too high or aliasing | Reduce multiplier in `sin(uv.y * 28.0...)`, smooth with smoothstep |

---

## Tools & Resources

**WebGL Debugging (recommended for shader issues):**
- **Spector.js** (Chrome extension): Frame capture, shader inspection, draw call analysis
- **Chrome DevTools WebGL Inspector**: Built-in (DevTools > More Tools > WebGL)
- **Three.js Examples**: [https://threejs.org/examples](https://threejs.org/examples) (performance best practices, debugging patterns)

**Performance Profiling:**
- **DevTools Performance Tab**: Record, analyze frame rate, thread activity
- **Chrome Task Manager** (Shift+Esc): Real-time GPU, CPU, memory per tab
- **Three.js Stats Module**: `import Stats from 'three/examples/jsm/libs/stats.module.js'`

**Shader Development & Testing:**
- **ShaderToy** ([shadertoy.com](https://www.shadertoy.com)): Isolated shader testing and sharing
- **GLSL Validator** (online): Syntax checking before integration
- **Git Blame & History**: Pinpoint when behavior changed (`git log -p src/JupiterField.jsx`)

---

## When to Escalate

If after following all steps the issue persists:
- Simplify the shader to isolate the problem
- Test with hardcoded values instead of uniforms
- Compare against a known-working version (git checkout old commit)
- Check Three.js/React Three Fiber versions for breaking changes
