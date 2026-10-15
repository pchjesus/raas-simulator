# Educational Simulator UI/UX Design Standard v1.0
> Status: APPROVED **future-design guideline** (2026-10-15). Documentation only; **no current UI/animation/engine changes approved or implemented by this file**.
>
> Applies to Ventilator Simulator, RAAS Simulator, and Cardiac Electrophysiology Simulator. Design philosophy and interaction policy shared; existing per-repository approved contracts and clinical/scientific boundaries remain authoritative.

## 1. Purpose & design baseline

**Product goal:** An educational simulator should help the learner understand *why they are here, what to do next, what changed, and what they have learned* without requiring them to learn the application's controls first. Optimize **user-centered usability, accessibility, readable information hierarchy and educational outcomes** before adding superficial visual complexity.

**Main internal reference:** Boyacto's separate PB980 learning room (Ventilator Simulator, commit [5be92ce](https://github.com/pchjesus/ventilator-simulator/commit/5be92ce76469eca0309b2b6daf225fcfc05a1b1d), `learn.html`, `learning-room.css`, `src/learning-room.js`, `docs/LEARNING_ROOM.md`). Its A intro → B device exploration → C single-task practice is a **reference for information architecture**, not a requirement to duplicate code or add the same pages everywhere. The original UI is retained deliberately for comparative evaluation and functional regression.

**Complementary external references (select patterns; do not mix entire visual kits):**
- Dieter Rams / Braun: useful, understandable, honest, restrained, durable design; purposeful details and controls.
- ChatGPT interface: calm whitespace, focused entry point, clear primary action and low visual noise. Use interaction principles, **not** trademark/branding or a mandate to make every screen chat-like.
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/): layout, navigation, interaction feedback and purposeful motion; adapt web-accessibly, never require Apple-only APIs.
- [KRDS](https://www.krds.go.kr/): accessible input, form, file upload, errors/status and service interaction patterns. KRDS patterns do not themselves implement authentication, upload storage or integration.
- [NHS Design System](https://service-manual.nhs.uk/design-system): clear health-service flows, labels, accessible forms and critical information.
- [IBM Carbon](https://carbondesignsystem.com/): semantic color, design tokens, complex information and data displays.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): accessibility acceptance reference.

**Out of scope:** The user's personal moodboard / Pinterest / Awwwards / Behance collecting activity is a **separate hobby** and is **not a development dependency, approval gate, or deliverable**. References may be adopted into a project only if the user explicitly selects a concrete design decision.

## 2. Guiding principles (MUST)

1. **Purpose first:** First-time learner should immediately see *what this is for* and one obvious starting action. Preserve a clear optional path for experienced free exploration.
2. **One primary task per view:** Purpose → observation/exploration → controlled action/prediction → feedback/review is a preferred **learning journey**, not a rigid rule to split correlated data.
3. **Progressive disclosure, no information loss:** Show today's objective and essential information first. Move optional details, advanced tools, references and long descriptions into discoverable layers; **do not hide clinically critical warnings, timepoints, model boundaries, or information needed to answer the current question**.
4. **Information hierarchy:** Main heading → short context → main visualization/content → primary action → secondary action/explanation. Avoid duplicate headers/cards, nested boxes, uncontrolled scroll and visually equal competing CTAs.
5. **Semantic, consistent visual language:** Neutral reading surfaces; accent colors indicate roles/states (e.g., explore, practice, confirm, caution), not decoration. Never convey state using color alone. The Boyacto blue `#2854cc`, dark device `#10232c`, practice green `#15745c` are *reference examples*, **not mandatory palette values**.
6. **Honest data:** Make *actual vs educational generated waveforms vs fixed display examples vs fictional cases* unmistakable. Never imply clinical validation, calibrated measurements or physiology predictions from visual polish.
7. **Model and state remain independent of presentation:** UX navigation/rendering must not silently reset, seek, autoplay, change simulation values, disclose answers or replace single-source-of-truth scientific models. Explicitly handle pending vs committed edits, tab/session return, reset and browser navigation.
8. **Accessibility from the start:** Keyboard access, visible focus, focus restoration, readable semantic labels, meaningful status/feedback and predictable responsive behavior. Support reduced-motion settings.
9. **Design as a testable hypothesis:** Preserve the original UI/learning engine where required and compare first-use comprehension, task completion, errors, backtracking and perceived cognitive effort with actual learners. Do not assert educational effectiveness based only on screenshots.

## 3. Default visual & interaction heuristics (targets, not retroactive mandates)

- Typical learning body text **about 16px or larger**; secondary explanatory text **prefer 14px+**, with adequate contrast. Tiny schematic labels must have a nearby **large-print equivalent** or zoom/inspect path. Keep article line lengths comfortable and line height about 1.5–1.7 where appropriate.
- Use a small reusable spacing/type/radius/color token scale. Aim for legible spacing rather than many borders, card-within-card visual noise or uniform emphasis.
- Provide touch-friendly controls; **44×44 CSS px is the project-preferred design target where feasible**, particularly for primary/mobile actions; evaluate dense device controls individually and offer larger equivalent controls. This is a product preference, not a claim that WCAG mandates 44px.
- For WCAG 2.2 AA, evaluate text contrast: normal text **4.5:1**, large text **3:1**; necessary UI boundaries/states generally **3:1** non-text contrast. Validate the actual final palette/hover/disabled/focus states with tools, not by visual impression.
- Show a single obvious primary action per learning step; label navigation for *outcomes* ("설정 변경 취소", "관찰하기") instead of vague verbs where possible. Keep predictable back/exit/retry actions.
- For data-dense simulation work, retain **simultaneous related views** where comparison itself is the lesson (e.g., ECG + electrical conduction; RAAS route + variables). Do not blindly force a single-item layout.
- Motion conveys causality, state change and progress; it should not exist for visual novelty. Honor `prefers-reduced-motion` and avoid motion-dependent-only explanations, autoplay side effects or new independent animation clocks.
- Adapt desktop, tablet and mobile thoughtfully; use meaningful focus/reading order, avoid clipped labels, verify horizontal scrolling for information that must remain at original scale (e.g., large graphs), and never shrink scientific text to fit at any cost.

## 4. Approved UX process for subsequent changes

**Before UI design:** (a) Read current `AGENTS.md`, specification, current code, README/devlog and project-specific signed decisions; (b) identify target learner and one measurable goal; (c) map current first-use entry, task flow, competing information and state boundaries; (d) compare with Boyacto reference and existing functional UI, including what **must remain**.

**Before implementation:** Draw a small low-fidelity layout/storyboard and state-transition sketch when the change is material. Explain user-visible before/after, navigation/return behavior, responsive/accessible states, and regression risks. Use reusable tokens/patterns and **reuse the current verified model/quiz/CASE data**. Ask the user only for meaningful product/UX decisions; handle local technical choices autonomously.

**Incremental development:** Prototype or implement isolated components, not a wholesale redesign of existing code or physics. Reuse validated app state logic. Avoid duplicate timers, mirrored answer states, rewritten algorithms, conflicting CSS or inaccessible fake controls.

**After implementation:** Verify new workflow and impacted existing features at representative widths (including 320/360/390, tablet, desktop), keyboard/focus, zoom/reflow, reduced-motion behavior, appropriate screen-reader/manual checks, exit/return, tab/route refresh, pending/committed/reset, and safety/clinical disclaimers. Keep automated test evidence separate from physical-device and human usability validation. Document the outcome and screenshots in DEVLOG/test report or equivalent.

**Usability comparison:** As appropriate, ask novice testers to explain the screen's purpose and complete representative tasks without instructions; examine first meaningful click, success/errors, time, recovery and clarity. Treat this as a validation plan, not an assertion that a study has already occurred.

## 5. Repository-specific non-regression contracts

### Ventilator Simulator
- Boyacto's `learn.html` is the **preferred design-language reference for future learner-facing UI**. Preserve the original PB980-reference device view (`index.html`) and the separate learning room as comparison baselines until a future *explicitly approved* unification decision; this guidance alone authorizes **no merge/replacement**.
- The original equipment representation has a legitimate fidelity goal, so **do not turn the simulated device face into a generic SaaS dashboard**. Differentiate equipment imagery from the surrounding student-facing learning shell.
- Preserve 7 settings, pending/accept/cancel, fixed monitoring examples, generated pressure/flow/volume, independent LAB/CORE/CASE data, gating, state ownership and clinically unreviewed labels. Separate learning-room state is not a new patient model.
- Do not assume `learn.html` / `index.html` navigation preserves live RAM sessions across full-page reloads. If integration is proposed, present persistence and preservation tradeoffs first.

### RAAS Simulator
- Current main v5.9.1 approved **B layout / P1 medical navy / T1 soft borders / K2 focused learning / G1 original-size graph** remains authoritative. The new philosophy should **refine entry and progression**, not silently replace those decisions.
- Preserve single existing stage/drug data, RAAS physiology, Canvas pathway and coordinates, current vs reached step distinction, drug application/removal, BP/Na⁺/volume/GFR output, lab/case answers and simulation/learning/clinical state separation.
- Preserve original-scale graph horizontal access on small screens, current-topic study and return from clinical review. A new introduction must not prevent direct simulator/free-exploration access.

### Cardiac Electrophysiology Simulator
- Preserve current v1.13 three-area Simulator/Learning/Clinical navigation, original five-stage Guide/10 questions, six-unit learning, and present public vs QA-only clinical-case gating.
- **ECG + conduction may need simultaneous visibility** for causally linked learning; do not split or clone the single active engine/Canvas/SVG merely to make screens visually sparse.
- Preserve canonical Play/Pause, physiological/visualization A/B time, Timeline/seek, HR, phase and electrical/mechanical/Wiggers behavior. Tab changes must not cause new time changes/auto-Play or lose session/answers; use the explicit approved v1.13 transition contract.
- Preserve scientific terminology and all established model-vs-clinical caveats.

## 6. Authority, review and versioning

This file is a **forward-looking visual/UX process baseline**, not a blanket authorization to change shipped screens, curricula, design colors, simulation logic, medical statements, persistence or navigation. **Explicit newer user-approved UX contracts and project-specific simulation/safety rules take precedence** if a proposal conflicts. Flag conflicts, explain options and ask the user to choose consequential UX changes.

Use this guide when planning future work, record accepted design choices and any deviations in the appropriate project design/DEVLOG record, and amend the guideline by reviewed PR when the shared rules materially change. Do not claim review completion, browser PASS, real-device PASS or clinical approval from documentation-only registration.
