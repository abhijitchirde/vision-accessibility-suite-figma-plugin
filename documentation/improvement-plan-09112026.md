# Improvement Plan

Tracker for improvements to the Vision Accessibility Suite Figma plugin.
Tick a box when the change is merged, and add the commit hash or PR link after it.

**Legend:** 🔴 High priority · 🟠 Medium · 🟢 Low / nice to have

**Started:** 2026-11-09 · **Branch:** `sandbox`

**Sources:** a code review on 2026-11-09, plus the "Known Limitations" and "Future Enhancements" sections of [implementation.md](implementation.md). Items that came from implementation.md are marked *(impl.md)*.

---

## ▶ Resume here

> Update this block at the end of every work session (or after every item), so work can restart from here if a session is interrupted.

- **Working on:** Phase 0 — Quick wins
- **Next step:** 0.9 Build and test in Figma (needs you: run the plugin in Figma desktop and follow the checklist under 0.9)
- **Last completed:** 0.8 (before that 0.7, 0.6, 0.5, 0.4, 0.10, 0.2 + 0.3). All build; none tested inside Figma yet, which is 0.9
- **In progress / half done:** —
- **How Quick simulation works now (after 0.2 + 0.3):**
  - The plugin side exports the design once and sends `PROCESS_FILTER { sourceNodeId, filters[], imageData }`. No frame is created yet.
  - The UI (`runQuickSimulations` in MainView) filters the image for each filter in turn and sends `APPLY_FILTERED_IMAGE { sourceNodeId, filter, imageData, label }`. It waits for `IMAGE_APPLIED` before sending the next one, so positions never collide.
  - The plugin side creates the frame with `createSimulationFrame()`. Its size comes from `image.getSizeAsync() / export scale`. Its position comes from `getNextSimulationPosition()`: the right edge of the source's absolute box, or of the right-most existing simulation of that source if further right, plus spacing.
  - "Add current view to Figma" in Vision Lab uses the same helpers.
  - "Add all simulations" (0.4) sends `GENERATE { filters: ALL_QUICK_FILTERS }`; progress is tracked in `generateProgress`.
- **Notes for whoever resumes:** Work on branch `sandbox`. Each item is one commit whose message starts with its number, e.g. `feat(0.1): …`, so `git log --oneline` shows exactly what's done. Check `git status` first: uncommitted changes mean the "In progress" item was interrupted. Run `npm run build` and `npm run typecheck` to check a change (typecheck should report no errors).

---

## Progress

| Phase | Items | Done |
| --- | --- | --- |
| 0. Quick wins | 10 | 9 |
| 1. Correctness bugs | 8 | 5 |
| 2. Simulation accuracy | 4 | 0 |
| 3. Performance | 8 | 1 |
| 4. Storage | 3 | 0 |
| 5. Code health | 9 | 2 |
| 6. UX & plugin accessibility | 6 | 0 |
| 7. New features | 12 | 0 |
| 8. Documentation accuracy | 9 | 0 |

---

## Phase 0 — Quick wins

Small, low-risk changes, done first and in this order. Several come from later phases; ticking them here also counts there (tick both).

- [x] **0.1 Disclaimer in the footer.** A ⚠️ button next to the theme toggle shows a Figma notification, using the same pattern as desi-ipsum and the Indian user data generator. Wording: *"These simulations are approximations for design and learning. They can't show exactly how any one person sees, and they're not a medical tool, so don't use them for diagnosis or treatment."*
- [x] **0.2 Place new simulations next to existing ones (= 1.1 + 1.2).** Use absolute positions, and place each new frame to the right of the last simulation made from the same design instead of on top of it.
- [x] **0.3 Make generation reliable (= 1.3 + 1.4).** Export the design once. Create the frame only when the filtered image is ready, and report success only after the image is applied.
- [x] **0.4 "Add all simulations" button** in Quick simulation, creating every simulation in a row. Put the button at the **bottom** of the tab, in the same fixed spot as Vision Lab's "Add current view to Figma" (decided 2026-11-09). Show progress such as "Adding 3 of 14…". Labels come later. (Part of 7.1.)
- [x] **0.5 Remove `figma.loadAllPagesAsync()` (= 3.6).**
- [x] **0.6 Scale peripheral vision loss with the design size (= 1.5).**
- [x] **0.7 Fix the TypeScript type-check errors (= 5.5).**
- [x] **0.8 Delete dead code (= 5.7).** Kept `resizeImageData` and `calculatePreviewDimensions` for 3.1. Deleted files (including `wcag.constants.ts`, which 7.4 may want) can be restored with `git show f632f6c:<path>`.
- [x] **0.10 Stop re-exporting the design on every render.** `useFigmaMessage` returns a new `sendMessage` function on every render. The effect that sends `PANEL_MOUNTED` depends on it, so every re-render in Vision Lab (including each slider move) makes Figma export the design again. Wrap `sendMessage` in `useCallback`. (Found 2026-11-09.)
- [ ] **0.9 Test in Figma.** Run `npm run build`, then in Figma desktop: Plugins → Development → Vision Accessibility Suite. Tick each check as it passes; write what went wrong next to any that fail.
  - [ ] Footer ⚠️ button shows the disclaimer toast.
  - [ ] Quick simulation, **top-level frame**: click one card → one frame appears to the right of the design, with the filter applied.
  - [ ] Click two more cards → each new frame appears **to the right of the previous one**, not on top.
  - [ ] **Nested layer** (e.g. a card inside a frame): the simulation appears next to that layer, not somewhere else on the page.
  - [ ] **Add all simulations** (bottom button): shows "Adding N of 14…", the cards are disabled while it runs, 14 frames end up in one row, and a "Added 14 simulations" toast appears.
  - [ ] Click **Add all** with nothing selected → "Select a layer…" toast, and the button becomes clickable again.
  - [ ] Peripheral loss on a large frame (e.g. 1440 px wide) looks similar to peripheral loss on a small one (not almost entirely black).
  - [ ] Vision Lab: preview loads when you select a layer; moving a slider updates the preview without lag building up.
  - [ ] Vision Lab: **Add current view to Figma** → frame appears in the same row as the Quick simulations of that layer, at the right size.
  - [ ] Delete all simulations of a layer, then add one → it goes right next to the design again.

## Phase 1 — Correctness bugs

- [x] 🔴 **1.1 Fix frame placement for nested nodes.** Generated and exported frames are placed with `node.x`/`node.y`, which are measured from the parent, but the frames are added to the page. Use `absoluteBoundingBox` (or `absoluteTransform`) instead.
  - [vision-simulator.ts:96-128](../src/utils/vision-simulator.ts#L96-L128)
  - [code.ts:323-324](../src/code.ts#L323-L324)
- [x] 🔴 **1.2 Stop Quick simulations from stacking on top of each other.** `generateSimulations` always gets a single filter, so `i` is always 0 and every frame lands in the same spot. Offset each new frame from existing simulations of the same node, or find the next free position.
- [x] 🔴 **1.3 Don't leave empty frames on failure.** Create the frame only once the filtered image is ready, or remove it if processing fails. Send `GENERATE_RESULT` after the image is applied, not before.
  - [code.ts:223-258](../src/code.ts#L223-L258)
- [x] 🟠 **1.4 Remove the duplicate export in Quick simulation.** `generateSimulations` exports the node and discards the result, then `prepareImageForPreview` exports it again.
- [x] 🟠 **1.5 Scale the peripheral vision loss radius in Quick simulation.** Central loss scales with image size; peripheral still uses fixed pixel values.
  - [MainView.tsx:265-271](../src/components/views/MainView.tsx#L265-L271)
- [ ] 🟠 **1.6 Correct pixel-based parameters for the 2× export.** Blur radius and ghosting offset are applied to a 2× image, so they come out at half the size the labels claim. Multiply by the export scale.
- [ ] 🟠 **1.7 Stop re-attaching the message listener on every render.** The effect depends on `processFilterForGenerate`, which is a new function each render. Stabilise it with `useCallback` or a ref to remove the stale-closure risk.
  - [MainView.tsx:375](../src/components/views/MainView.tsx#L375)
- [ ] 🟠 **1.8 Ignore stale previews.** Tag each preview request with an ID (or the node ID) and drop responses that arrive after a newer selection.

## Phase 2 — Simulation accuracy

- [ ] 🔴 **2.1 Replace the color-blindness matrices with Machado et al. (2009).** The current protan/deutan/tritan matrices are the inaccurate "ColorJack"/Coblis set. Machado provides severity steps from 0.1 to 1.0, which can replace the linear blend toward the identity matrix.
  - [vision-simulator.constants.ts:41-64](../src/utils/vision-simulator.constants.ts#L41-L64)
- [ ] 🔴 **2.2 Apply color matrices in linear RGB.** Convert sRGB to linear, apply the matrix, then convert back. A lookup table keeps this fast.
- [ ] 🟠 **2.3 Make bright-light "washout" reduce saturation.** It currently blends toward white, and the `gray` value it computes is never used.
  - [image-utils.ts:519](../src/utils/image-utils.ts#L519)
- [ ] 🟢 **2.4 Premultiply alpha in blur.** This prevents dark fringes on transparent edges.

## Phase 3 — Performance

- [ ] 🔴 **3.1 Downscale the Vision Lab preview.** Process at about 2× the panel width using the existing, unused `calculatePreviewDimensions` and `resizeImageData` (or canvas `drawImage` scaling). Keep full resolution only for "Add to Figma".
- [ ] 🔴 **3.2 Move image processing into a Web Worker** using `OffscreenCanvas`, so the UI stays responsive.
- [ ] 🟠 **3.3 Debounce selection changes and slider input.**
- [ ] 🟠 **3.4 Use a faster blur.** Replace the Gaussian loop with a box-blur or stack-blur approximation, whose cost doesn't grow with the radius.
- [ ] 🟠 **3.5 Draw straight into a visible `<canvas>`.** This avoids re-encoding a PNG with `toDataURL()` on every slider tick.
- [x] 🟠 **3.6 Remove `figma.loadAllPagesAsync()`.** No `documentchange` handler needs it, it isn't awaited, and it's slow in large files.
  - [code.ts:6](../src/code.ts#L6)
- [ ] 🟢 **3.7 Cache exported images by node ID** so switching back to a node doesn't export it again. Clear a node's entry when the node changes. *(impl.md)*
- [ ] 🟢 **3.8 Explore WebGL shaders** for the color matrix and blur. Worth doing only if 3.1–3.4 aren't fast enough. *(impl.md)*

## Phase 4 — Storage

- [ ] 🔴 **4.1 Store custom presets per user with `figma.clientStorage`.** They currently live on the document via `figma.root.setPluginData`, so they don't follow the user to other files and fail in view-only files. Migrate any presets already stored on the document.
- [ ] 🟠 **4.2 Store the selected preset in `clientStorage` too.**
- [ ] 🟠 **4.3 Validate imported presets fully.** Check each filter's `type` and `config` shape; a missing `config` currently crashes when it's destructured.
  - [PresetManager.tsx:65-80](../src/components/ui/Presets/PresetManager.tsx#L65-L80)

## Phase 5 — Code health

- [ ] 🔴 **5.1 Use one filter registry.** Replace the `if/else` chain copied in `processFilterForGenerate`, `applyFilterToPreview` and `applyFilterPreset` with a single `Record<SimulationType, (data, w, h, params) => data>`.
- [ ] 🟠 **5.2 Split `MainView.tsx` (1,369 lines)** into `QuickSimulationTab`, `VisionLabTab` and a `useFilterPipeline` hook.
- [ ] 🟠 **5.3 Generate the Quick simulation filter cards from `FILTER_METADATA`** instead of writing each one by hand. This also removes the duplicated prevalence text.
- [ ] 🟠 **5.4 Type the plugin ↔ UI messages** with one shared union type, and pick a single payload shape instead of `msg.data?.x || msg.x`.
- [x] 🟠 **5.5 Fix the type-check errors.** `tsc --noEmit` fails because `@types/node` conflicts with the Figma typings and the `JSX` namespace is missing. Remove `@types/node` or limit `types` in `tsconfig.json`.
- [ ] 🟢 **5.6 Turn on `strict` in `tsconfig.json`** and pin `@figma/plugin-typings` instead of `"*"`.
- [x] 🟢 **5.7 Delete dead code:**
  - [x] `src/constants/wcag.constants.ts` (or use it in 7.4)
  - [x] `src/constants/storage.constants.ts`
  - [x] `src/utils/preset-storage.ts`
  - [x] `src/services/storage.service.ts`
  - [x] `Card`, `Badge`, `Checkbox` components
  - [x] Unused `SelectionService` methods
  - [x] `addLabel`, `deleteGeneratedSimulations`, `getAllExportableNodes` (unless used by 7.1)
  - [x] Commented-out `console.log` lines
- [ ] 🟢 **5.8 Add unit tests (Vitest)** for `image-utils.ts`. For example: severity 0 returns the input unchanged, and achromatopsia output has R = G = B.
- [ ] 🟢 **5.9 Add ESLint**, including `react-hooks/exhaustive-deps`.

## Phase 6 — UX & accessibility of the plugin UI

- [ ] 🟠 **6.1 Use Figma's theme.** Pass `themeColors: true` to `showUI` and use Figma's CSS variables. Remove the hard-coded `get-theme` → `"light"` handler and the manual toggle.
- [ ] 🟠 **6.2 Make the tabs accessible:** `role="tablist"` / `role="tab"`, `aria-selected`, and arrow-key navigation.
- [ ] 🟠 **6.3 Give sliders accessible labels**, and give the preview image alt text that names the active filter.
- [ ] 🟠 **6.4 Fix the window height.** 770px doesn't fit on many laptops; make it shorter or resizable.
- [ ] 🟢 **6.5 Make zoom scrollable.** It uses `transform: scale()` with no scroll container, so a zoomed preview gets cut off.
- [ ] 🟢 **6.6 Show feedback while a Quick simulation is generating**, and a clear message when the selection can't be exported.

## Phase 7 — New features

- [ ] 🟠 **7.1 "Generate all":** a labeled grid of every simulation next to the original.
- [ ] 🟠 **7.2 Before/after comparison slider** in Vision Lab.
- [ ] 🟠 **7.3 "Save current settings as preset"** from Vision Lab, instead of JSON import only.
- [ ] 🟢 **7.4 Contrast check under each simulation:** flag text that fails WCAG contrast once a simulation is applied.
- [ ] 🟢 **7.5 Support multiple selected nodes** (currently only `selection[0]` is used).
- [ ] 🟢 **7.6 Parameters for Quick simulation:** let it use the last-used Vision Lab settings, or a chosen preset.
- [ ] 🟠 **7.7 Presets in Quick simulation.** Presets currently work only in Vision Lab, so multi-filter frames can only reach the canvas through "Add current view to Figma". *(impl.md: Limitation 8, Future #2)*
- [ ] 🟠 **7.8 Preset builder in the UI.** Add, remove and reorder the filters in a preset, with sliders for each filter and a live preview. Today a custom preset means editing JSON and importing it. This is the full version of 7.3. *(impl.md: Limitations 5–7, Future #1)*
- [ ] 🟢 **7.9 Download the filtered image as a PNG** from Vision Lab, with the filter name in the file name. *(impl.md: Future #4)*
- [ ] 🟢 **7.10 More conditions:** diabetic retinopathy (scattered dark spots) and halos/glare first. *(impl.md: Future #5)*
- [ ] 🟢 **7.11 Preset categories** (medical condition, age, environment) in the preset dropdown. *(impl.md: Future #6)*
- [ ] 🟢 **7.12 Refresh the preview when the selected node is edited.** Use `figma.currentPage.on("nodechange")`, which doesn't need `loadAllPagesAsync` (see 3.6). Debounce it. *(impl.md: Future #10)*

**Not planned** (from implementation.md's future list): community preset sharing (needs a backend, and the manifest blocks network access), ML-based simulation, VR/AR preview, and A/B mode (7.2 covers most of it).

## Phase 8 — Documentation accuracy

[implementation.md](implementation.md) says the plugin is "production ready" with "no known issues", but several of its claims don't match the code. Update each item once the related code change lands, or correct the text now if the feature isn't planned.

- [ ] 🟠 **8.1 Describe the Quick simulation tab as it is now.** The doc still describes an older "Generate" tab: a filter dropdown, a severity slider, "Advanced Parameters" and a Generate button. This appears in Features → Generate Mode, the Generate Mode Layout mockup, the Generate Mode Flow and the "Severity applied correctly in Generate mode" test. That design was replaced by the "Quick simulation" card grid, where each card generates immediately with default values. The doc's Vision Lab sections are correct. Rewrite the Generate sections to match the card grid and rename them "Quick simulation". The flow should also say that `GENERATE_RESULT` is currently sent *before* the image is applied (see 1.3).
- [ ] 🟠 **8.2 "Labeled frames".** Only the frame *name* includes the filter; no text label is placed on the canvas (`addLabel` is never called). Fix the doc, or do it as part of 7.1.
- [ ] 🟠 **8.3 Preview downscaling.** Limitation 3 says it's "already implemented for Vision Lab mode"; Performance §3 says it isn't. It isn't. Update after 3.1.
- [ ] 🟠 **8.4 Optimizations that don't exist.** "Canvas API hardware acceleration (50× faster)", "progressive rendering" and "Uint8ClampedArray reuse" are listed as done. All pixel work runs in JS loops on the UI thread, and each filter allocates a new buffer. Rewrite the Performance section after Phase 3.
- [ ] 🟠 **8.5 Scientific claims.** The doc says the plugin uses the Brettel (1997) algorithm with "peer-reviewed, physiologically validated" matrices. The code uses the ColorJack/Coblis matrices. Update after 2.1–2.2.
- [ ] 🟢 **8.6 Parameter ranges.** Doc vs code: blur radius 1–20 vs 1–30 px, ghosting offset −20..+20 vs 0..30 px, temperature 2000–3500 K vs 1000–4000 K.
- [ ] 🟢 **8.7 Zoom levels.** The doc lists fixed steps (25/50/100/200/400%), matching `ZOOM_LEVELS`. The code ignores that constant and steps by 25%, and no button highlights the current level. Pick one behavior.
- [ ] 🟢 **8.8 Status claims.** Remove or re-verify "Zero TypeScript errors" (see 5.5), "Known issues: none", "keyboard navigable, WCAG compliant UI" (see 6.2–6.3) and "theme toggle works" (see 6.1).
- [ ] 🟢 **8.9 Versions and dates.** React 18.3 → 19, and the "Last updated" date.

---

## Change log

| Date | Item | Change | Commit / PR |
| --- | --- | --- | --- |
| 2026-11-09 | — | Plan created | fe07565 |
| 2026-11-09 | 3.7–3.8, 7.7–7.12, 8.x | Added items from implementation.md; renamed file | — |
