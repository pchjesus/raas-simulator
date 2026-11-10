# RAAS v7 Concept 01-C — Home, Help and Question-First Learning (QA)

**Status:** isolated UI/interaction prototype; pending visual review and engine integration. Reviewed 2026-11-10.

## Change scope

- Home: retained direct simulator/learning entry, added prominently accessible **사용 안내** in hero, top bar and desktop sidebar; changed headline to **“RAAS의 흐름을 보고, 약물의 작용을 이해하다.”**
- Hero motif: redrew the decorative six-node relationship diagram with aligned circle centres, centered Korean/Latin glyphs, intentionally consistent node labels and subtle branch/edge motion. It is *not* the nine-stage physiological flow, drug onset animation or time series.
- Usage guide: native modal with four short, sourced-to-UI steps and **follow-along** option.
- Follow-along: five actions using actual prototype controls (Ang II stage → ACEi target → inspect blank output region → compact mode → learning navigation). Visual spotlight does not block normal input; can be skipped, moved forward/back, escaped; the guide does not calculate physiology, reveal clinical answers/Lab or award mastery.
- Learning: replace the endless left-hand list with five unit selectors across the top, an overflowing horizontal question rail (2/2/5/6/1), and a two-column question workspace linking mechanism, inquiry and nursing-oriented reflection. Preserve the existing UI demonstration content for all 16 questions and 'viewed ≠ mastered' semantics.
- Existing exploration basic/compact mode, drug target selection, graph placeholder and CKD/HFrEF shell remain unchanged.

## Verification

- Chromium smoke checks on **320 / 390 / 760 / 1024 / 1280 / 1440 CSS px**: **90/90 PASS** after correcting a test expectation for CSS-transformed `HFrEF` text (not a product failure).
- Tests covered home and help dialog, Escape, exploration stages, six-drug target UI, compact ↔ default DOM relocation, unit selectors and question counts, question selection and per-unit last visited position, lesson → related pathway navigation, case switch, page-wide overflow and JavaScript errors.
- Follow-along interaction verified in Chromium at **1440 and 390 px**: stage click, ACEi target selection, output acknowledgment, compact toggle and learn navigation; no JS errors. No fake physiology result.
- Existing stress test re-run: **14 rapid basic/compact toggles** at 1440 and 390 px each, keyboard Enter, focus continuity, old full-path modal Escape, stage update: **PASS**.
- Desktop / mobile screenshot capture inspected visually. At 1440 the question-first layout shows five concise unit tabs and a contained question rail, rather than a tall navigation list.
- A previous long combined browser-run timed out; the same behavioral work was split into focused checks and rerun as above. The timing issue was not recorded as a validated app defect.

## Not verified / risk

- **NOT RUN**: original v6 physiology, graph series, original Canvas and clinical/Lab answer gating *integrated into the new UI*; deployment/CI; physical Android/iOS, Safari, real keyboard-only screen-reader QA, large text/zoom, clinical educator review, formal learner usability.
- `prototypes/v7/concept-01.html` is still a design demo. Numbers intentionally show em dashes until the existing engine is safely adapted. No copy of original domain data has been replaced.
- Planned future integration must preserve the original single source of truth and clinical release contracts; do not treat this design-only QA as proof of scientific equivalence.

## References

- `docs/DESIGN_V7_EXPERIENCE_REIMAGINED_DRAFT.md`
- `docs/QA_V7_CONCEPT_01B.md`
- `docs/DESIGN_V6_CONTENT_IA.md`, `AGENTS.md`
- Design kkakgi v1.3 and `references/UI_MOTION_BEHAVIOR_ADDENDUM_v0.1_20261108.md`

**Publication state**: `main` and Pages untouched; review and approval required before merging or deploying.
