# RAAS Simulator v7 — Experience Reimagined / Design Contract DRAFT

> Status: **DESIGN DRAFT; user visual approval pending**. Created 2026-11-10.
> Design branch: `feat/v7-experience-reimagined`; baseline: `feat/v6-learning-content-ia` @ `972b525fc16e80a7ab0fdbea752ace00226d072b`.
> **No main merge, no public deployment, no existing engine/UI overwrite.** This is an explicitly authorized UX/UI full-reimagination initiative, not authorization to change existing scientific/clinical data or release gates.

## 1. Product goal

Target: primarily learners in their twenties, especially nursing/health-science learners. Reconsider the learner journey and UI from a blank canvas while preserving all domain behavior, content, calculations, input contracts, educational safety and clinical release conditions.

Core learning thread: **find a mechanism → trace upstream/downstream relations → inspect a drug's true target → compare engine outputs at the same step → explain relevant nursing assessment → apply to CKD/HFrEF cases**.

The earlier v6 screen layout, color palette, spacing and navigation are not mandatory visual templates for v7. Their *functional contracts* remain binding.

## 2. First interactive prototype (Concept 01)

A standalone local HTML design prototype was prepared and browser-checked in the originating ChatGPT conversation; it is **not yet part of this GitHub branch**. Its interaction data is UI-only, not a second RAAS engine.

- Home: focused editorial entry, explicit Explore/Learn/Clinical routes, concept-motif animation.
- Explore: interactive nine-step pathway, selected stage + causal explanation/nursing view, six drug target selectors, adjacent future BP / Na⁺ / volume / GFR and chart surface.
- Learning: five units / sixteen question-driven lesson entries, concept and action side-by-side on desktop, current-lesson navigation, temporary *viewed* indicator (not passed/completed).
- Clinical: preserved CKD–ACEi and HFrEF–MRA destinations, four-phase interaction shell. No original answer or Lab displayed in prototype.
- Desktop: navigation rail and visual pathway + inspector. Mobile: bottom primary navigation and horizontally navigable stage rail, with the relevant selected-stage explanation immediately below.
- Motion: brief content fade, active-state/path feedback, restrained hover/press, reduced-motion support.
- Candidate visual identity: light reading canvas, dark navy illustration surface, mint/teal stage emphasis; **not yet approved for production**.

### Prototype contract

No physiology calculations, original graph data, actual drug applications, clinical decisions, Lab values, gating or changes to real cases are performed. Result values are deliberately blank and marked “engine not connected.” The sample learning sentences are a **design/content demonstration**, not authoritative replacements for v6 education sources.

The new diagram represents simplified conceptual adjacency, not physiological time, dose-response or a comprehensive biochemical pathway. Ang II has branching physiological effects beyond a single serial rail. ACEi/ARB/MRA/β-blocker/loop/thiazide true targets must be identified separately from visual association and from model contribution rules.

## 3. Non-regression contract (mandatory)

- Keep all 9 original stages; 6 drugs + no-drug state; current step / max reached / selected-view distinction and original apply/remove/reset semantics.
- Preserve single authoritative `stageData`, `drugData`, `clinicalStageNotes`, `clinicalDrugNotes`, `calculatePhysiologyAtStep`, BP / Na⁺ / volume / GFR and source-backed educational notes.
- Preserve current engine outputs, graph series / conditions / units, original Canvas as a **fallback/verification baseline**, stage access via keyboard/touch, original-size graph exploration on mobile.
- Keep v6 five units / sixteen items, free exploration, read-only tutorial, ACEi **predict → confirm → observe** gate, model-vs-clinical safety notes, session navigation/return/reset.
- Keep both CKD and HFrEF cases, all current questions, answer explanations, nursing actions, gated Lab data and release conditions, and state ownership boundaries.
- Never fabricate changing physiological results, imply stage index is time or claim that a visual route marker is a true drug target.
- Retain rollback to unchanged v6 candidate at the baseline commit.

## 4. Architectural approach

Do **not** rewrite the original mixed HTML/JS physiology model as a by-product of visual rework. Treat existing stage/drug/case/engine logic as source of truth. Build a UI-only projection/adapter that subscribes to existing state, invokes pre-existing actions, and renders new layouts without creating an independent physiology/clinical state machine. Any relocation of original DOM/Canvas with event bindings must be verified; do not duplicate authoritative nodes or re-evaluate the engine twice.

Suggested implementation stages after visual direction approval:
1. Establish a tight state/action/UI mapping table from v6 source (including tutorial, practice, clinical gates, keyboard, reset and route return).
2. Build new shell, navigation and responsive layout against a *read-only* adapter; verify no state or results mutate during presentation-only transitions.
3. Integrate pathway exploration, drug apply/remove and output/chart with identical engine results and graph series.
4. Integrate all source-backed learning, ACEi practice, clinical decisions, actions, gate and Lab flows **without removing content**.
5. Validate large/small screens, keyboard, Safari/mobile device, reduced motion, focus, 200% zoom and screen reader; clinically review changed explanatory presentation. Conduct learner usability evaluation separately.

## 5. Major risks and mitigations

| Priority | Risk | Guardrail |
|---|---|---|
| High | Existing single HTML contains intertwined UI / state / engine behavior | Preserve original engine code and mappings; enforce before/after state snapshots, golden output equality and affected regression suites |
| High | New clinical flow accidentally reveals gated answers or Lab | Keep existing gate controller, test first-use / wrong answer / return / reset / both cases |
| High | Motion visually implies physiological time, drug onset or false values | Treat stage animation as conceptual motion; keep model condition / units / limitations visible |
| Medium | Original Canvas/graph duplicated, resized or disconnected | Keep original as fallback; compare output series, stage navigation, original-size horizontal graph behavior |
| Medium | Mobile bottom navigation, horizontal stage rail or new modal hides controls | Real touch/keyboard/zoom/a11y validation; test 320, 360, 390, 430, desktop |
| Medium | UI-only prototype sample wording silently replaces v6 evidence-linked material | Integrate original text/data by reference, review 16 item mappings and all nurse/source connections |
| Medium | Motion or large assets reduce responsiveness | CSS/SVG/WAAPI only when needed; reduced-motion, interruptibility, frame budget |

## 6. Acceptance / verification

- **Prototype only**: local Chromium interaction/reflow checks performed at 320/390/760/1024/1440 CSS pixels: 60/60 scenario assertions PASS after fixing a test-only uppercase-expectation mismatch. This is NOT an app integration or release certification.
- **NOT RUN**: integration with original v6 engine and clinical answers; CI on this branch; actual iOS/Android devices; Safari; manual assistive technology/zoom testing; educator review; learner comprehension/effectiveness studies.
- No existing functional code, baseline `main`, historical tests, candidate backups or published Pages changed by creating this design document.

## 7. References

Project sources: `docs/DESIGN_V6_CONTENT_IA.md`, `docs/QA_V6_CONTENT_IA.md`, `docs/EDUCATIONAL_UI_DESIGN_STANDARD_v1.1.md`, `docs/AI_ASSISTED_DEVELOPMENT_BPLUS_v1.0.md`, `AGENTS.md`.

Design-kkakgi (approved guidelines v1.3; supporting *reference research, not automatic style approval*):
- `references/UI_PATTERN_FIELD_ATLAS_v0.1_20261105.md`
- `references/MOTION_INDICATOR_ATLAS_v0.1_20261105.md`
- `references/UI_MOTION_BEHAVIOR_ADDENDUM_v0.1_20261108.md`
- `references/TEXT_MOTION_LAB_NOTE_01_20261108.md`
- `references/COLOR_BALANCE_CONTRAST_NOTE_v0.1_20261110.md`
- `references/ORIGIN_REFERENCE_CARDIAC_SIMULATOR_v0.1_20261022.md`

**Next decision**: review the interactive prototype's visual identity, desktop/mobile organization, pathway navigation, and animation strength. Once approved, proceed to integration via separate, reviewable commits.