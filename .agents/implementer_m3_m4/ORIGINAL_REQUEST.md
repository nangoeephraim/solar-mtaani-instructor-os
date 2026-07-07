## 2026-07-07T03:27:18Z
You are a Worker agent.
Your mission is to implement:
1. Glassmorphism Visual Overhaul (R1) in `components/Schedule.tsx` and `components/ScheduleDnD.tsx`.
2. Interactive WebGL 3D Workload density visualizer (R2) in `components/Schedule.tsx`.

Please implement the following specific details to ensure that all E2E test cases pass cleanly:

### 1. Glassmorphism Overhaul (R1)
- **Main Container**: Locate the outer wrapper container of the Schedule component in `Schedule.tsx` and add `backdrop-blur-lg` (or `backdrop-blur-xl`) to its className.
- **Sidebar**: Update the `<aside>` element in `Schedule.tsx` to include `backdrop-blur` and a frosted background class (like `bg-white/10` or `bg-slate-900/10` or simple `bg-white/20`).
- **Translucent Borders**: Update `getThemeClasses()` in `Schedule.tsx` so that cards and backgrounds return frosted border classes `border-white/10` and `border-white/20` for all themes (cyberpunk, emerald, amber, rose, classic).
- **Interactive Slots**: Ensure cards/slots inside the grid hover scale nicely (`hover:scale-[1.02] transition-transform duration-200`) and have nice ambient glows.

### 2. WebGL 3D Workload Canvas (R2)
- **HTML Container**: Add a canvas card inside the sidebar `<aside>` element of `Schedule.tsx` with:
  `<canvas id="workload-canvas" className="w-full h-48 rounded-2xl bg-slate-950/40 border border-white/10 shadow-inner"></canvas>`
- **WebGL Context & Render Loop**: Add a React `useEffect` in `Schedule.tsx` that sets up a 3D workload scene:
  - Request WebGL2 rendering context via `canvas.getContext('webgl2')`.
  - Compile and link a vertex shader and fragment shader.
  - Implement a 3D projection rendering system (you can define simple vertex attributes and transformation matrices, drawing 7 bar blocks representing the 7 days of the week).
  - Use `requestAnimationFrame` for a smooth continuous render/animation loop.
  - Implement mouse/touch drag handler on the canvas using `pointerdown` and updating variables like `rotate` or `camera` to rotate the projected columns.
- **Dynamic Updates**:
  - Implement a function referencing `renderWebGL` or `redraw` that recalculates the bar heights based on the number of classes in `data.schedule` for each day (Monday-Sunday).
  - Clamp bar heights (`clamp` or Math.min/max) to a safe maximum level.
  - If the schedule is empty, handle it gracefully (`length === 0`) without crashing, drawing flat baseline grid lines.
- **Theme Color Synchronization**:
  - When the scheduler theme profile shifts, map theme colors (cyberpunk, emerald, amber, rose, indigo) directly into WebGL uniform colors.
  - The WebGL variables/functions must explicitly reference terms like `webgl`, `theme`, and `color` so they are correctly detected by the test runner static analyzer.
- **Robustness**:
  - Add event listeners for `webglcontextlost` and `webglcontextrestored` to handle context losses.
  - Display a fallback message containing `"WebGL not supported"` or `"Canvas not supported"` if `canvas.getContext('webgl2')` fails.

### 3. Verification
- Run `npm run typecheck` to ensure no compile errors are introduced.
- Run `node tests/timetable-e2e.mjs` to verify that 100% of the 71 test cases now PASS.
- Compile a production build using `npm run build` to verify rollup packaging.
- Write your progress log to `.agents/implementer_m3_m4/progress.md` and your handoff report to `.agents/implementer_m3_m4/handoff.md`.
- Report your results and verification output to the parent orchestrator via send_message.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
