# E2E Test Infra: Timetable Visual System Overhaul

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Glassmorphism UI Layout | ORIGINAL_REQUEST §R1 | 5      | 5      | ✓      |
| 2 | WebGL 3D Workload View  | ORIGINAL_REQUEST §R2 | 5      | 5      | ✓      |
| 3 | Drag-and-Drop Handler   | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |
| 4 | AI Co-Pilot Optimizer   | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |
| 5 | Syllabus Sync Metrics   | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |
| 6 | Theme Switcher          | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |

## Test Architecture
- **Test Runner**: Node-based custom test runner located at `tests/timetable-e2e.mjs`.
- **Invocation**: `node tests/timetable-e2e.mjs`.
- **Pass/Fail Semantics**: All test cases return boolean status; exit code is 0 if all pass, 1 if any fail.
- **Verification Details**:
  - Checks DOM styling structure and Tailwind blur/frosted glassmorphic classes.
  - Verifies presence, setup, and redraw calls on the WebGL/Canvas context.
  - Verifies the integrity of drag-and-drop handler offsets and override state updates.
  - Verifies AI optimizer drawer diagnostics, health index math, and syllabus completion rates.
  - Verifies color state updates for all scheduler themes.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Standard Day Scheduling | Drag-and-Drop, Syllabus Sync, WebGL Redraw | Medium |
| 2 | Peak Load Warning & Auto-Fix | AI Optimizer Drawer, WebGL Redraw, Conflict Check | High |
| 3 | Theme Profile Switch & Style Update | Theme Switcher, WebGL Colors, Glassmorphic Styling | Medium |
| 4 | Public Holiday Drop Lock | Drag-and-Drop, Holiday Block, AI Diagnostics | Medium |
| 5 | Custom Date Overrides | Drag-and-Drop, DB State Updates, WebGL Redraw | High |

## Coverage Thresholds
- Tier 1: 30 test cases (5 per feature)
- Tier 2: 30 test cases (5 per feature for boundary conditions)
- Tier 3: 6 test cases (pairwise interactions)
- Tier 4: 5 realistic application scenarios
- Total: 71 test cases
