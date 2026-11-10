# RAAS v7 Concept 01-B — Compact Exploration UX / Focused QA

**Status:** prototype-only, design review pending. Checked 2026-11-10 against the `prototypes/v7/concept-01.html` blob `7742dd0ba7a7368dd2a3409abdea7de03dd7b0f5` from commit `3c16701c581e4f98489b7dcd8e9df564b9dba1b7`.

## Rationale and behavior

- Preserve the guided home page, its prominent direct **Explore** entry point, approved Concept 01 color balance and existing smooth animations.
- Next to **전체 경로 / 학습으로 연결**, add a two-state, keyboard-operable **기본 / 간편** control. The selection is local in-memory UI state, not simulation progress.
- **기본:** original exploration structure with expanded stage explanation and separate lower drug, physiology and graph panels.
- **간편:** preserve the entire RAAS pathway beside a tighter concept/controller column containing stage prev/next, the same six drug target selectors and four model-output placeholders. The separate lower panels disappear because their **original DOM nodes are moved**, not cloned. Graph/expanded details remain available by switching to 기본. Mechanism/nursing explanation is disclosure-accessible.
- Preserve selected stage, drug target and focus selection through mode transitions, lesson navigation and modal opening/closing.
- Apply native View Transitions to moved panels when supported and motion is enabled; use immediate layout changes as fallback, plus an animated active-segment pill and brief state-related feedback. A new input supersedes interrupted transition animations to prevent stale UI.
- This is a UI-only prototype: do **not** show invented physiology or clinical values. The result tiles are blank pending connection to the existing tested v6 engine. The educational stage path represents conceptual order, **not physiological time**; drug labels are target descriptions and **do not administer a drug**.

## Verification done

**Local Chromium, Python Playwright (standalone HTML through `page.set_content`):**

| Check | Result |
|---|---|
| 320/390/760/1024/1280/1440 CSS px × 31 assertions | **186/186 PASS** |
| Switching between 기본 ↔ 간편 | PASS |
| Original drug/output DOM nodes move and return, no duplicate engine panels | PASS |
| Stage and drug target remain selected | PASS |
| Nursing focus remains selected, disclosure operates | PASS |
| Original graph visible in 기본 and hidden in 간편 | PASS |
| 4 output tiles accessible in both modes | PASS |
| No document-wide horizontal overflow or JS page errors | PASS |
| Nav leave/re-enter retains display mode | PASS |
| Reduced-motion environment (760px) | PASS |
| 14 rapid mode-toggle clicks at 1440 and 390px | PASS (after race fix) |
| Keyboard Enter, focus retention, full-path modal Escape | PASS |

At 1440 × 900 and 1280 × 900, the compact display’s main control area was contained within the visible viewport in this captured initial test state. This is not a guarantee for increased text, longer source content, different zoom, or all devices.

## Risk, remaining validation and non-regression

**Risk addressed:** native View Transition callbacks may occur asynchronously; rapid clicks initially produced a stale selected-mode result. Fixed by immediately recording the latest intended mode and dropping/skipping outdated animation callbacks. Reran rapid-switch and general suites.

The initial design concept’s 5-unit/16-item scaffold, CKD/HFrEF destination shells, modal and mobile controls remain reachable. No existing RAAS engine, clinical answer, Lab release gate, source-of-truth data, graph series, existing v6 tests, index.html, backup, main, or Pages were changed.

**NOT RUN:** complete integrated v6 physiology/clinical regression (because engine is deliberately not connected), GitHub Actions for the design-only prototype, iOS/Android physical devices, Safari, manual screen reader, browser zoom settings, clinical educator review, learner acceptance/effectiveness evaluation. Mobile was regression-checked automatically but the user’s visual review is pending.

## Next step

Ask for user acceptance of Concept 01-B compact control layout and motion level. Only then design the state/action adapter and integrate with the existing v6 code, retaining original functions and safety barriers. No main merge or deployment until separate approval.
