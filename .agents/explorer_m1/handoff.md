# Technical Analysis Handoff Report - Timetable / Schedule Tab

This handoff document details the technical analysis of the Timetable/Schedule features in the `prism-instructor-os` workspace.

## 1. Observation
- **Component File Locations**:
  - Main schedule component: `components/Schedule.tsx` (2425 lines)
  - Drag-and-drop subcomponents: `components/ScheduleDnD.tsx` (132 lines)
  - Scheduling utilities (conflicts, resource recommendation): `utils/scheduling.ts` (212 lines)
- **Lazy Load Setup**:
  - `App.tsx` imports Schedule lazily:
    ```tsx
    61: const Schedule = lazy(() => import('./components/Schedule'));
    ```
- **Drag-and-Drop Implementation**:
  - `components/Schedule.tsx` utilizes `@dnd-kit/core`:
    ```tsx
    11: import {
    12:   DndContext, DragOverlay, useDraggable, useDroppable,
    13:   DragEndEvent, useSensors, useSensor, PointerSensor, TouchSensor,
    14:   DragStartEvent
    15: } from '@dnd-kit/core';
    ```
  - Snapping mechanism:
    ```tsx
    413: const minutesDelta = Math.round(delta.y / heightPerMinute / 15) * 15;
    ```
  - Column drop target:
    ```tsx
    97: id: `day-${date.getDay()}`, // Use day of week (0-6) as ID
    99: disabled: !!holiday // Disable dropping if holiday
    ```
- **Syllabus / Curriculum Integration**:
  - Alignment calculated from schedule slot matches with curriculum keys:
    ```tsx
    1196: const scheduledCount = data.schedule.filter(s => s.subject === subject && s.status !== 'Cancelled').length;
    ```
- **Theme Profiles**:
  - Available themes are defined in the switcher pill:
    ```tsx
    965: [
    966:   { id: 'indigo', name: 'Classic', color: 'bg-indigo-500' },
    967:   { id: 'emerald', name: 'Forest', color: 'bg-emerald-500' },
    968:   { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-gradient-to-br from-pink-500 to-cyan-500' },
    969:   { id: 'amber', name: 'Solar', color: 'bg-amber-500' },
    970:   { id: 'rose', name: 'Sunset', color: 'bg-rose-500' }
    971: ]
    ```
  - Style mapper: `getThemeClasses()` maps the TailWind style object based on state `schedulerTheme`.
- **Three.js Dependency**:
  - Checked `package.json` and found no reference to `three`.
  - Raw WebGL implementation observed in `components/meetings/BubbleUniverse.tsx`:
    ```tsx
    662: const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
    ```
- **TypeScript Typecheck**:
  - Executed `npm run typecheck` which ran `tsc --noEmit -p tsconfig.json` successfully with 0 warnings/errors.
- **Production Build**:
  - Executed `npm run build` which compiled successfully in 1m 49s, producing build assets under `dist/`, including `dist/assets/Schedule-CEKhbNGz.js`.
  - Observed chunk warnings for `Meetings-CLNmPgVk.js` (6.73 MB) and `index-AG9CDkUK.js` (1.35 MB).

## 2. Logic Chain
1. **Dnd Kit Config**:
   - The PointerSensor and TouchSensor configurations are used to distinguish drag actions from simple clicks, making the UI desktop- and mobile-friendly. Snapping coordinates via y-axis offsets matches standard calendar grids.
2. **State Updates**:
   - To support flexible scheduling without destroying recurring templates, the system writes standard overrides using `overrideDate` and `replacesSlotId` pointers into the Supabase database. Real-time updates are pushed down to client components via Supabase subscription payloads in `App.tsx`.
3. **Themes**:
   - Themes are decoupled from core UI logic: the component queries local storage for `schedule_theme`, applies Tailwind properties via `getThemeClasses()`, and renders custom layouts (e.g. neon borders and dark backgrounds for `cyberpunk`).
4. **3D rendering options**:
   - Because `three` is not listed as a project dependency in `package.json`, any direct 3D visualizers will need to be written using raw WebGL2 (matching the structure of `BubbleUniverse.tsx`) or raw 2D HTML Canvas, unless a new package dependency is added.

## 3. Caveats
- No actual end-to-end user-interaction tests were performed (only build compilation and code review).
- We assumed that the local Supabase connection has been configured correctly in `.env` by the developer.

## 4. Conclusion
- The timetable functionality is highly modular and utilizes `@dnd-kit/core` for drag-and-drop interactions. It features custom overrides, conflict checks, public holiday exclusion, lab/asset recommendations, and AI-assisted scheduling health checks.
- Build and Typecheck are clean and compiling successfully, though asset sizes for LiveKit components are large and could benefit from further manual chunk configuration.

## 5. Verification Method
- Execute the following command from the workspace root:
  - `npm run typecheck` to verify TypeScript compliance.
  - `npm run build` to verify Vite and Rollup packaging.
- Check the output logs or view the compiled assets in the `dist/assets/` directory.
