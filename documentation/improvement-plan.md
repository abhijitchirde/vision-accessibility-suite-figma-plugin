# Improvement Plan

Tracker for improvements to the Vision Accessibility Suite Figma plugin.
Tick a box when the change is merged, and add the commit hash or PR link after it.

**Legend:** 🔴 High priority · 🟠 Medium · 🟢 Low / nice to have

**Started:** 2026-11-09 · **Branch:** `sandbox`

---

## Progress

| Phase | Items | Done |
| --- | --- | --- |
| 1. Correctness bugs | 8 | 0 |
| 2. Simulation accuracy | 4 | 0 |
| 3. Performance | 6 | 0 |
| 4. Storage | 3 | 0 |
| 5. Code health | 9 | 0 |
| 6. UX & plugin accessibility | 6 | 0 |
| 7. New features | 6 | 0 |

---

## Phase 1 — Correctness bugs

- [ ] 🔴 **1.1 Fix frame placement for nested nodes.** Generated and exported frames are placed with `node.x`/`node.y`, which are measured from the parent, but the frames are added to the page. Use `absoluteBoundingBox` (or `absoluteTransform`) instead.
  - [vision-simulator.ts:96-128](../src/utils/vision-simulator.ts#L96-L128)
  - [code.ts:323-324](../src/code.ts#L323-L324)
- [ ] 🔴 **1.2 Stop Quick simulations from stacking on top of each other.** `generateSimulations` always gets a single filter, so `i` is always 0 and every frame lands in the same spot. Offset each new frame from existing simulations of the same node, or find the next free position.
- [ ] 🔴 **1.3 Don't leave empty frames on failure.** Create the frame only once the filtered image is ready, or remove it if processing fails. Send `GENERATE_RESULT` after the image is applied, not before.
  - [code.ts:223-258](../src/code.ts#L223-L258)
- [ ] 🟠 **1.4 Remove the duplicate export in Quick simulation.** `generateSimulations` exports the node and discards the result, then `prepareImageForPreview` exports it again.
- [ ] 🟠 **1.5 Scale the peripheral vision loss radius in Quick simulation.** Central loss scales with image size; peripheral still uses fixed pixel values.
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
- [ ] 🟠 **3.6 Remove `figma.loadAllPagesAsync()`.** No `documentchange` handler needs it, it isn't awaited, and it's slow in large files.
  - [code.ts:6](../src/code.ts#L6)

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
- [ ] 🟠 **5.5 Fix the type-check errors.** `tsc --noEmit` fails because `@types/node` conflicts with the Figma typings and the `JSX` namespace is missing. Remove `@types/node` or limit `types` in `tsconfig.json`.
- [ ] 🟢 **5.6 Turn on `strict` in `tsconfig.json`** and pin `@figma/plugin-typings` instead of `"*"`.
- [ ] 🟢 **5.7 Delete dead code:**
  - [ ] `src/constants/wcag.constants.ts` (or use it in 7.4)
  - [ ] `src/constants/storage.constants.ts`
  - [ ] `src/utils/preset-storage.ts`
  - [ ] `src/services/storage.service.ts`
  - [ ] `Card`, `Badge`, `Checkbox` components
  - [ ] Unused `SelectionService` methods
  - [ ] `addLabel`, `deleteGeneratedSimulations`, `getAllExportableNodes` (unless used by 7.1)
  - [ ] Commented-out `console.log` lines
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

---

## Change log

| Date | Item | Change | Commit / PR |
| --- | --- | --- | --- |
| 2026-11-09 | — | Plan created | — |
