# SkyLens V1 — Unified Handoff

This folder is **documentation and visual references only**, not a replacement app or a ready-to-run data importer.

## Installation
1. Create a Git commit / backup of the **existing working Expo app**, including its TestFlight configuration.
2. Extract the ZIP in the repository root: result should be `docs/skylens-v1/` (do not replace `skylens-rn/`, `ios/`, or the original SwiftUI files).
3. Open Claude Code at the real repository root; paste `CLAUDE_CODE_INTEGRATION_PROMPT.md` in its entirety.
4. Claude must first inspect **actual code and TestFlight/build evidence** and create `V1_GAP_AUDIT.md` and `V1_INTEGRATION_PLAN.md`; only then implement Stage 1, behind flags and reversible changes.

## Source-of-truth rules
- Existing verified app source/build: what currently exists and functions; **do not reimplement it** without evidence.
- `SKYLENS_V1_PRD.md`: V1 product requirements and acceptance scenarios.
- `SKYLENS_V1_DESIGN_LOCK.md` + `visuals/approved_existing_design.png`: approved visual grammar and additions; preserve existing screens.
- `visuals/new_features_concept_only.png`: illustrative references **only for features not yet in the app**. Images depict some invented sample data; not literal scientific source, UI design specification or evidence of code.
- `DATA_SOURCE_AUDIT.md`: rights and evidence gates. HOLD means **do not redistribute or bundle** yet.
- `DATA_ARCHITECTURE.md`: proposed technical approach, **not proof of existing code or completed tests**. If its sample scripts/fixtures are missing, report that instead of claiming they are bundled.

## Conflict rule
If PRD, design, source audit, and architecture conflict: preserve existing verified functionality, science correctness, legal compliance and user privacy. Log conflicts in `V1_DECISION_LOG.md` with recommended resolution. Do not silently pick a convenient interpretation.

## First milestone
Advanced Sky Map + Observe/Explore/Deep Atlas + Layers + robust selection + LOD. Report real performance, iPhone test results, visual comparisons and blocked licences. Other new features follow the PRD order. Do not rewrite completed core screens.
