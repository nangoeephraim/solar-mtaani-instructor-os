# Timetable / Schedule Component Analysis

This document provides a detailed technical analysis of the Timetable (Schedule) tab inside the `prism-instructor-os` workspace.

## 1. Components
The Schedule / Timetable tab is rendered using two primary React components:
- **`components/Schedule.tsx`**: Main component that manages the grid states (density, day/week view), date pagination, filtering, search, AI Co-Pilot optimization drawer, export formats (PDF/Print), sync with Google Calendar, and confirmation dialogs.
- **`components/ScheduleDnD.tsx`**: Contains subcomponents for handling drag-and-drop:
  - `DraggableSlot`: Wraps each class card using `@dnd-kit/core`'s `useDraggable` hook.
  - `DroppableDayColumn`: Represents day columns utilizing `@dnd-kit/core`'s `useDroppable` hook. Dropping is disabled for columns that fall on public holidays.

The Schedule component is integrated within `App.tsx` and is lazy-loaded:
```tsx
const Schedule = lazy(() => import('./components/Schedule'));
```
Data state is read from/written to a PostgreSQL database via a real-time Supabase connection defined in `services/storageService.ts`.

## 2. Drag-and-Drop Mechanics
- **Context & Sensors**:
  - The drag-and-drop features are powered by `@dnd-kit/core`. A `<DndContext>` wraps the week view schedule columns.
  - Sensors are configured for both pointer and touch support:
    - `PointerSensor`: Configured with an activation distance of 8px to prevent accidental drag triggers during regular clicks.
    - `TouchSensor`: Configured with a delay of 250ms and a tolerance of 5px to support mobile touchscreens.
- **Handlers**:
  - `handleDragEnd(event: DragEndEvent)`: Matches the active drag item and target column.
  - Snapshot calculation converts y-coordinates into time offsets, snapping to the nearest 15-minute mark:
    ```tsx
    const minutesDelta = Math.round(delta.y / heightPerMinute / 15) * 15;
    ```
  - Conflicts are computed reactively using `detectConflicts(newSlot, existingSlots)` from `utils/scheduling.ts`. If conflicts are detected, a custom confirmation dialog is presented.
  - If verified, the schedule item is rescheduled:
    - In **Template Mode**: The template slot is updated directly.
    - In **Standard Mode**: Moving/modifying a recurring slot creates a date-specific override slot with `overrideDate` and `replacesSlotId` fields, preserving the baseline template.

## 3. Syllabus Synchronization & AI Optimization
- **Syllabus / Curriculum Sync**:
  - Read from `data.curriculum`, which is reactively populated in `App.tsx` based on the active curriculum configuration (e.g. from `utils/curriculumData.ts`).
  - Displays progress percentages in the sidebar for each subject based on scheduled class counts against total curriculum units.
  - Highlights critical gaps (e.g. "Under-allocated: No classes scheduled").
- **AI Co-Pilot Optimizer**:
  - Accessed via the "Optimize" button which opens a side-drawer showing a **Timetable Health Index** score (out of 100).
  - Diagnostic issues are computed inside a `useMemo` block in `Schedule.tsx`, subtracting score points for:
    - Public holiday conflicts (-12 pts per clash)
    - Resource allocation / room double-booking clashes (-10 pts per clash)
    - Curriculum allocation gaps (-10 pts for 0 hours; -5 pts for low coverage)
    - Excessive load per day (-8 pts for >6 classes on a day)
  - Auto-fix executes `handleAutoOptimize`, which cancels classes falling on public holidays and updates Supabase.

## 4. Theme Management
- Theme profiles are handled dynamically through:
  - LocalStorage: `useLocalStorage<'indigo' | 'emerald' | 'cyberpunk' | 'amber' | 'rose'>('schedule_theme', 'indigo')`.
  - Header Pills: Allow switching themes instantly.
  - Theme mappings: `getThemeClasses()` returns TailWind classes for backgrounds, cards, buttons, badges, and gradients.
  - Specific slot style changes:
    - The `cyberpunk` theme maps slots using six custom neon text/border profiles on a dark `bg-slate-950/90` background.
    - Other themes use the classic pastel list `CLASS_COLORS` (Coral, Mint, Lavender, Sky, Amber, Rose).

## 5. 3D & WebGL Environment Options
- **Three.js Availability**:
  - Checking `package.json` reveals that **Three.js (`three`) is not installed** in dependencies.
  - If 3D rendering is needed, options are:
    1. Implement raw WebGL / HTML Canvas with 3D projection, similar to how WebGL2 is implemented in `components/meetings/BubbleUniverse.tsx`.
    2. Add `three` to `package.json` dependencies if complex 3D scenes are required.

## 6. Build and Typecheck Verification
- **Typescript Typecheck (`npm run typecheck`)**:
  - Ran `tsc --noEmit -p tsconfig.json` successfully with **no errors or warnings**.
- **Production Build (`npm run build`)**:
  - Vite production build compiled successfully in **1m 49s**.
  - Output Assets:
    - `dist/index.html` (2.57 kB)
    - `dist/assets/index-BcwQh2Df.css` (395.73 kB)
    - `dist/assets/Schedule-CEKhbNGz.js` (130.77 kB) - Schedule tab chunk
    - Bundled JS and dependencies total chunks (e.g. `index.js`, `Meetings.js`).
  - Warnings:
    - Rollup raised size warnings for large chunks:
      - `dist/assets/index-AG9CDkUK.js` (1.35 MB)
      - `dist/assets/Meetings-CLNmPgVk.js` (6.73 MB)
    - Recommendation: Use Rollup `manualChunks` or dynamic imports for heavy components like LiveKit to optimize chunk sizes.
