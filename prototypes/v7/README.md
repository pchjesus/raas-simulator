# RAAS Simulator v7 — Concept 01 (Interactive UX Draft)

This directory holds an isolated redesign prototype. **It is not the live simulator and must not be merged into main or deployed without review.**

## View locally

Download `concept-01.html` and open it in a modern browser. No installation, external assets, or dependencies are required. File-URL execution has not been validated in every browser; the Chromium verification loaded its complete HTML through the browser's in-memory document facility.

Navigate via the left rail on desktop or bottom navigation on mobile:

- **Start**: home and three learning destinations.
- **Explore**: select all 9 RAAS stages, inspect mechanism versus nursing explanation, select six drug targets, and open the full-stage chooser.
- **Learn**: browse 5 units / 16 illustrative questions, move between lessons, and open the linked pathway step. “Viewed” is not a mastery grade.
- **Clinical**: preview CKD/ACEi and HFrEF/MRA case selection and the four-stage user journey without revealing protected answers or Labs.

## Non-goals and safety

The original `index.html`, engine, state controllers, cases, questions, gate checks, Labs, graph series and Canvas are untouched by this prototype. **No physiological computations run here.** Blank BP/Na⁺/volume/GFR and chart areas are intentional. Drug chips only highlight educational target associations; they do not administer/apply drugs to the v6 engine.

The simplified visible 9-step track is not a complete biochemical map or physiological timeline; Ang II's multiple effects and drug actual targets require source-backed presentation in final integration.

## Verification at initial upload

Local Chromium interaction/reflow smoke suite: 60/60 PASS at 320, 390, 760, 1024 and 1440 CSS px for navigation, stage controls, drug target information, modal open/close, lesson navigation, case switching, lack of page-wide horizontal overflow, and JavaScript page errors. This was **not** an integrated v6 regression test.

Still NOT RUN: v6 integration, CI, Safari, real iOS/Android, manual screen reader, actual zoom, clinical educator review, learner study.

See [v7 draft design contract](../../docs/DESIGN_V7_EXPERIENCE_REIMAGINED_DRAFT.md) before integration.
## Concept 01-B — Compact explorer (2026-11-10)

The Explore toolbar now includes **기본 / 간편**, alongside full path / learning shortcuts. 기본 retains the separate full panels, concept explanation and graph surface; 간편 relocates the **same** drug and output panels into the concept/controls inspector and hides the lower experiment area. The path, stage controls, drug target selection and four output placeholders can be seen together at desktop sizes. Expanded mechanism/nursing detail is available through a disclosure. The mode does not reset stage/drug/lesson/clinical state; returning to 기본 restores the original panels. Native morphing transitions have a CSS/no-motion fallback; interruptions favor the latest choice.

Only the layout and UI-only movement have changed. Prototype output values intentionally remain uncomputed. See [Concept 01-B focused QA](../../docs/QA_V7_CONCEPT_01B.md): 186/186 Chromium assertions at six widths, plus rapid-toggling and keyboard/modal checks; integration, device/Safari, expert and learner validation NOT RUN.
