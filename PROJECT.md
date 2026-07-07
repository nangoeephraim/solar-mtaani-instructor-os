# Project: Timetable Visual System Overhaul

## Architecture
- Timetable Visual View: Contains the scheduler grid, slot components, optimization drawer, syllabus sync UI, and theme selector.
- 3D Workload Canvas: WebGL/Canvas 3D scene embedded in the Timetable tab displaying workload distribution and density by day.
- Drag and Drop handler: Integrates `@dnd-kit/core` for dragging classes across days and times.

## Milestones
| # | Name | Scope | Dependencies | Status | Conv ID |
|---|---|---|---|---|---|
| 1 | Discovery & Planning | Analyze the codebase to map timetable grid, dnd logic, theme configuration, and verify build capability. | None | DONE | 5ecd9f6d-e3f3-4ce2-8dd8-07fa822ace15 |
| 2 | E2E Test Suite Design | Formulate test cases covering feature coverage, edge cases, combinations, and workloads. Write tests to verify scheduler integrity. | M1 | DONE | 9cde8cc2-2c86-4da4-ab37-e9df2ed81019 |
| 3 | Glassmorphism Overhaul (R1) | Stylize timetable UI, slots, modals, and toolbars with premium glassmorphism. | M1 | DONE | b0ec7679-816b-4491-9d6f-72d654028527 |
| 4 | 3D Workload Visualization (R2) | Embed dynamic WebGL/Canvas 3D visualizer updated on state and theme changes. | M1 | DONE | b0ec7679-816b-4491-9d6f-72d654028527 |
| 5 | E2E Test Suite Pass | Run and pass all Tier 1-4 tests, verifying styling and interactivity. | M2, M3, M4 | DONE | b0ec7679-816b-4491-9d6f-72d654028527 |
| 6 | Adversarial Hardening (Tier 5) | Perform white-box analysis, identify untested code paths, write and pass Tier 5 adversarial tests. | M5 | DONE | 26d93fe5-6b0b-4993-b89c-4a00b9ed0676 |
| 7 | Final Integration & Hand-off | Perform final checks, clean build/typecheck, and notify the Sentinel. | M6 | DONE | 26d93fe5-6b0b-4993-b89c-4a00b9ed0676 |

## Interface Contracts
### Schedule Grid ↔ 3D Workload Canvas
- Data input: Array of scheduled class objects (day, duration, start/end time, subject/instructor).
- Theme configuration: Current theme profile (indigo, emerald, cyberpunk, amber, rose).
- Redraw trigger: Triggers redraw on slot drag-and-drop or state changes.
