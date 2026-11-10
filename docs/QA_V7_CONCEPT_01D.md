# RAAS v7 Concept 01-D — Collapsed help and question-card density

**Date:** 2026-11-10. **Scope:** isolated v7 visual prototype. Review/approval pending; no production integration or deployment.

## Change

- At viewport widths **761–1080 CSS px**, the collapsed desktop sidebar's Help control displays only a centered 19 px question-mark icon in a **48 × 48 px** hit area. It retains the accessible label `사용 안내 열기`, its native help action and the full labelled control when the sidebar is expanded. Mobile navigation is not changed.
- On **desktop widths > 760 CSS px**, question tiles shrink from **108 px minimum height to 76 px** (~70%), and the label grows from **13 px to 15 px**. The label stays on one line without clipping or ellipsizing. Single- and two-question units retain even full-width cards when space permits; units with 5–6 questions use **intrinsic content widths + horizontal scroll** so longer Korean/English medication questions stay readable.
- The 320/390/760 px mobile rail retains its prior wrapping and 108 px minimum-height cards, pending dedicated mobile design review.
- All sixteen original demo questions, their source text, lesson selection state, existing help dialog, tutorial, basic/compact explorer, clinical shells and data labels remain unchanged.

## Verification

Local Chromium Playwright standalone HTML loaded in memory (not integrated engine): **198/198 PASS** across widths **320, 390, 760, 840, 1024, 1080, 1280, 1440 px**. Checks include:

- Help icon visibility and 48 px sizing on collapsed sidebar, expanded sidebar text visibility, button name, Help open/Escape-close.
- Unit navigation and full sets of 2/2/5/6/1 unique questions; desktop card height 76 px; long strings never overflow their tile; desktop labels never wrap.
- No document-wide horizontal overflow; question selection, exploration switch and compact panel relocation continue working; no uncaught JS errors.

A first test asserted a specific computed `display:inline` value in the expanded sidebar, but its span correctly rendered `display:block`; this was fixed in the **test expectation only** and all 198 checks rerun successfully. The resulting screenshots were inspected at 1024 and 1440 px; this is a **prototype layout QA**, not production release testing.

**NOT RUN:** integrated v6 physiology and graph regression, clinical grading/Lab gates, actual mobile/Safari, screen readers, text zoom, educator/learner study. The simulator engine still is not connected to the prototype.

**Release boundary:** no `main` merge, no public Pages deployment. Visual review may still revise text size and density.