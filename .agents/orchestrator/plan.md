# Project Plan — Timetable Visual System Overhaul

## Objective
Rebuild the Timetable tab visual system to implement advanced glassmorphism styling (R1) and an interactive Three.js/WebGL 3D data visualization panel showing daily workload distribution (R2), maintaining existing mechanics (R3/Acceptance Criteria).

## Milestone Phases

### Milestone 1: Discovery & Planning
- **Goal**: Research current timetable implementation, drag-and-drop mechanism, syllabus integration, and themes. Determine integration points for 3D visualization.
- **Verification**: Handoff report from Explorer with files identified, code flow outlined, and build command validated.

### Milestone 2: E2E Test Suite Design
- **Goal**: Create comprehensive E2E tests checking feature coverage, boundary conditions, cross-feature interaction, and application scenarios.
- **Verification**: `TEST_READY.md` published and test runner command ready.

### Milestone 3: Glassmorphism Overhaul (R1)
- **Goal**: Restyle timetable views, cards, modals, sidebar, toolbars with backdrop blurs, frosted designs, custom scrollbars, and micro-animations.
- **Verification**: Reviewer confirms UI matches glassmorphism requirements, passes builds and tests.

### Milestone 4: Three.js/WebGL Workload Visualization (R2)
- **Goal**: Implement 3D canvas displaying workload density, redrawing on schedule modifications, and reacting to color themes.
- **Verification**: Reviewer confirms WebGL/Canvas rendering, color transitions on theme switches, and auto-updates on state changes.

### Milestone 5: E2E Test Suite Pass (Tiers 1-4)
- **Goal**: Verify that all implementation aspects pass all designed E2E tests, preserving scheduler functionality (dnd, optimizer, syllabus).
- **Verification**: Test runner report showing 100% pass on Tiers 1-4.

### Milestone 6: Adversarial Hardening (Tier 5)
- **Goal**: Run white-box coverage checks and design adversarial test cases to cover edge cases and bugs.
- **Verification**: Challenger verifies zero coverage gaps, Auditor runs forensic checks and reports CLEAN.

### Milestone 7: Final Verification & Sentinel Hand-off
- **Goal**: Final project check, typecheck, build verification, and reporting victory to parent Sentinel.
- **Verification**: Verification metrics documented, parent notified.
