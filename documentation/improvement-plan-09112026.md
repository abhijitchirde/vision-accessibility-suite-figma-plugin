# Improvement Plan

Tracker for improvements to the Vision Accessibility Suite Figma plugin.
Tick a box when the change is merged, and add the commit hash or PR link after it.

**Legend:** 🔴 High priority · 🟠 Medium · 🟢 Low / nice to have

**Started:** 2026-11-09 · **Branch:** `sandbox`

**Sources:** a code review on 2026-11-09, plus the "Known Limitations" and "Future Enhancements" sections of [implementation.md](implementation.md). Items that came from implementation.md are marked _(impl.md)_.

---

## ▶ Resume here

> Update this block at the end of every work session (or after every item), so work can restart from here if a session is interrupted.

- **Working on:** Phase 6 plugin accessibility (6.2–6.5). Batch A/B/C, v2, reference and stack-polish Figma tests not yet confirmed
- **Next step:** 6.5 Scrollable zoom, then 6.4 resizable window, then tick 6.6
- **Last completed:** 6.2 tabs and 6.3 labels/keyboard (2026-11-10); rename fixes (no forms; full-width field). Before that 7.16, 6.7, 7.13, 7.15, 7.17, 5.1, Batch C, 1.9, Batch B, Batch A
- **In progress / half done:** 6.4 resizable window: `components/ui/ResizeHandle.tsx` (bottom-right grip, pointer drag using screen coordinates, arrow keys ±20px) sends `resize-window` {width,height}; code.ts clamps to 320–800 × 480–1200, calls figma.ui.resize, saves to clientStorage `windowSize` on `save-window-size`, restores it on start. Default stays 360×770.
- **Quick simulation cards (after 0.11):** sections and cards come from `QUICK_SIMULATION_SECTIONS` in MainView.tsx; tooltip text is `FILTER_METADATA[filter].description` in vision-simulator.constants.ts. "Add all" uses the same list.
- **How Quick simulation works now (after 0.2 + 0.3):**
  - The plugin side exports the design once and sends `PROCESS_FILTER { sourceNodeId, filters[], imageData }`. No frame is created yet.
  - The UI (`runQuickSimulations` in MainView) filters the image for each filter in turn and sends `APPLY_FILTERED_IMAGE { sourceNodeId, filter, imageData, label }`. It waits for `IMAGE_APPLIED` before sending the next one, so positions never collide.
  - The plugin side creates the frame with `createSimulationFrame()`. Its size comes from `image.getSizeAsync() / export scale`. Its position comes from `getNextSimulationPosition()`: the right edge of the source's absolute box, or of the right-most existing simulation of that source if further right, plus spacing.
  - "Add current view to Figma" in Vision Lab uses the same helpers.
  - Container (0.13): `getSimulationContainer()` returns the nearest Section ancestor of the source, or the page. Frames are added there, positioned relative to the Section, and the Section grows to fit.
  - "Add all simulations" (0.4) sends `GENERATE { filters: ALL_QUICK_FILTERS }`; progress is tracked in `generateProgress`.
- **How Vision Lab renders (after Batch A):** `loadImageForPreview` keeps the full export in `originalImageRef` and a copy ≤ `MAX_PREVIEW_SIDE` (1200px) in `previewSourceRef`. A redraw effect calls `renderVisionLab(..., scale)` at most once per animation frame and draws into the visible `previewCanvasRef`. Pixel settings are multiplied by `scale` (the `pixelScale` parameter in image-utils) so the preview matches the export. "Add current view to Figma" runs `renderVisionLab` on the full-size image with scale 1. `code.ts` debounces selection (150 ms) and drops superseded previews (`latestPreviewRequest`).
- **Color blindness (after Batch B):** `applyColorBlindness` (image-utils.ts) converts sRGB → linear with lookup tables, applies `getColorBlindnessMatrix(type, severity)`, converts back. Matrices are in `machado-matrices.ts` (Machado 2009, severity steps 0.0–1.0, interpolated); achromatopsia = Rec. 709 luminance. Transcription checked: all 90 matrix rows sum to 1 and steps are smooth; worth one comparison against the paper's published table before release.
- **Presets (after Batch C):** `src/services/preset-store.ts` saves custom presets (`customPresets`) and the selected preset (`selectedPresetId`) in `figma.clientStorage`. Presets found in a file's old plugin data (`vision-simulator-presets`) are imported once; seen ids are kept in `importedLegacyPresetIds`. `src/utils/preset-validation.ts` (`validatePreset`, `sanitizePresets`) checks imports and stored data.
- **Filters (after 5.1):** `applyFilterConfig(data, w, h, config, pixelScale)` in image-utils.ts is the only place that maps a `CompleteFilterConfig` to a filter function; `applyFilterPreset` loops over it. `src/utils/simulation-render.ts` builds configs: `quickSimulationConfig` (Quick simulation defaults) and `visionLabConfig` (Vision Lab settings). Config units are preset format v2 (see below); `pixelScale` = image pixels per design pixel (2 at a normal export).
- **Preset format v2 (after 7.17):** presets have `"version": 2`; visual field `radiusPercent` (% of the design's smaller side), blur `radius` and ghosting `offset` in design pixels. No version = v1 (2×-export pixels, fixed-pixel visual field radii), converted by `upgradePreset` in preset-validation.ts on import and load. `PRESET_FILTER_SPEC` there lists every setting with its range — build 7.13's reference from it.
- **Vision Lab (after 7.15):** state is `stack: StackEntry[]` (`{id, config}`), `expandedId`, `selectedPreset` (the "Start from" preset) and `stackEdited`. `components/ui/Stack/SimulationStack.tsx` renders the list and each entry's sliders; `renderStack` (simulation-render.ts) applies it; `defaultStackConfig` gives a new entry's settings; `describeFilterConfig` the one-line summary. "Save as preset" builds a v2 preset in `handleSavePreset` (MainView).
- **Notes for whoever resumes:** Work on branch `sandbox`. **Don't merge into `master` or push:** all changes stay on `sandbox` until they are published to the Figma Community; merge to `master` after publishing (decided 2026-11-09). Commit after each item. Messages follow the style of the other plugin repos: `type(area): plain summary` (no plan numbers in the subject), an optional line on why, then bullets saying what changed, ending with `- Plan items: 4.1, 4.2`. Find an item's commits with `git log --grep "Plan items:.*4.1"`. (All earlier commits were reworded into this style on 2026-11-10; the old messages and hashes are kept on the local branch `sandbox-before-reword` (safe to delete once the user is happy).) Check `git status` first: uncommitted changes mean the "In progress" item was interrupted. Run `npm run build` and `npm run typecheck` to check a change (typecheck should report no errors).

---

## Progress

| Phase                        | Items | Done |
| ---------------------------- | ----- | ---- |
| 0. Quick wins                | 13    | 13   |
| 1. Correctness bugs          | 9     | 7    |
| 2. Simulation accuracy       | 4     | 2    |
| 3. Performance               | 8     | 4    |
| 4. Storage                   | 3     | 3    |
| 5. Code health               | 9     | 4    |
| 6. UX & plugin accessibility | 7     | 4    |
| 7. New features              | 15    | 4    |
| 8. Documentation accuracy    | 9     | 0    |

---

## Phase 0 — Quick wins

Small, low-risk changes, done first and in this order. Several come from later phases; ticking them here also counts there (tick both).

- [x] **0.1 Disclaimer in the footer.** A ⚠️ button next to the theme toggle shows a Figma notification, using the same pattern as desi-ipsum and the Indian user data generator. Wording: _"These simulations are approximations for design and learning. They can't show exactly how any one person sees, and they're not a medical tool, so don't use them for diagnosis or treatment."_
- [x] **0.2 Place new simulations next to existing ones (= 1.1 + 1.2).** Use absolute positions, and place each new frame to the right of the last simulation made from the same design instead of on top of it.
- [x] **0.3 Make generation reliable (= 1.3 + 1.4).** Export the design once. Create the frame only when the filtered image is ready, and report success only after the image is applied.
- [x] **0.4 "Add all simulations" button** in Quick simulation, creating every simulation in a row. Put the button at the **bottom** of the tab, in the same fixed spot as Vision Lab's "Add current view to Figma" (decided 2026-11-09). Show progress such as "Adding 3 of 14…". Labels come later. (Part of 7.1.)
- [x] **0.5 Remove `figma.loadAllPagesAsync()` (= 3.6).**
- [x] **0.6 Scale peripheral vision loss with the design size (= 1.5).**
- [x] **0.7 Fix the TypeScript type-check errors (= 5.5).**
- [x] **0.8 Delete dead code (= 5.7).** Kept `resizeImageData` and `calculatePreviewDimensions` for 3.1. Deleted files (including `wcag.constants.ts`, which 7.4 may want) can be restored with `git show 67bbf71:<path>`.
- [x] **0.10 Stop re-exporting the design on every render.** `useFigmaMessage` returns a new `sendMessage` function on every render. The effect that sends `PANEL_MOUNTED` depends on it, so every re-render in Vision Lab (including each slider move) makes Figma export the design again. Wrap `sendMessage` in `useCallback`. (Found 2026-11-09.)
- [x] **0.11 Shorter Quick simulation cards (+ 5.3).** Move each card's description ("Complete • ~1% males" etc.) into a native `title` tooltip, using the longer `FILTER_METADATA` descriptions. Add one note above the color sections: _"-opia: can't see that color at all · -omaly: sees it weakly"_ (decided 2026-11-09). Build the cards from one list instead of 11 hand-written buttons (= 5.3).
- [x] **0.12 Light/dark mode like desi-ipsum (= 6.1).** `showUI({ themeColors: true })`; footer toggle cycles 🌗 Auto (follows Figma) → ☀️ Light → 🌙 Dark; choice saved per user in `figma.clientStorage` (`get-theme-pref` / `set-theme-pref`, same as desi-ipsum). Fallback colors use `:where(:root)` so Figma's injected colors win; `html[data-theme]` overrides define every `--figma-color-*` the CSS uses (28), not just 13 as in desi-ipsum. Replaces `useFigmaTheme` with `useThemePreference` (decided 2026-11-09).
- [x] **0.13 Keep simulations inside Sections.** Simulations stay off the user's frames (never inside the parent frame), but if the source layer is inside a Section, the simulation goes into the nearest Section, lined up after earlier simulations there; the Section grows to fit if needed. Otherwise it stays on the page (decided 2026-11-09 after the nested-layer test).
- [x] **0.9 Test in Figma.** Run `npm run build`, then in Figma desktop: Plugins → Development → Vision Accessibility Suite. Tick each check as it passes; write what went wrong next to any that fail.
  - [x] Footer ⚠️ button shows the disclaimer toast.
  - [x] Theme button cycles 🌗 Auto → ☀️ Light → 🌙 Dark. In Auto, switching Figma between light and dark (Figma menu → Theme) changes the plugin too.
  - [x] Forced Light while Figma is dark (and the reverse) looks fully light (or dark): no leftover dark borders, hover colors or tab underline.
  - [x] Close and reopen the plugin: the theme choice is remembered.
  - [x] Quick simulation cards are one line each; hovering a card shows its description; the "-opia / -omaly" note is at the top. No vertical scrollbar in Quick simulation at the default window size, and the last row of cards isn't hidden behind the "Add all" bar.
  - [x] Quick simulation, **top-level frame**: click one card → one frame appears to the right of the design, with the filter applied.
  - [x] Click two more cards → each new frame appears **to the right of the previous one**, not on top.
  - [x] **Nested layer** (e.g. a card inside a frame): the simulation appears next to that layer, not somewhere else on the page. Position was right (2026-11-09), but the simulation is created on the page, not inside the parent frame. Decided: never inside the user's frames, but inside a parent Section (0.13). Retested 2026-11-09: works.
  - [x] **Layer inside a Section:** simulations go inside that Section in a row, and the Section grows if they would stick out. Moving the Section moves them too. ✅ 2026-11-09
  - [x] **Add all simulations** (bottom button): shows "Adding N of 14…", the cards are disabled while it runs, 14 frames end up in one row, and a "Added 14 simulations" toast appears.
  - [x] Click **Add all** with nothing selected → "Select a layer…" toast, and the button becomes clickable again.
  - [x] Peripheral loss on a large frame (e.g. 1440 px wide) looks similar to peripheral loss on a small one (not almost entirely black).
  - [x] Vision Lab: preview loads when you select a layer; moving a slider updates the preview without lag building up.
  - [x] Vision Lab: **Add current view to Figma** → frame appears in the same row as the Quick simulations of that layer, at the right size.
  - [x] Delete all simulations of a layer, then add one → it goes right next to the design again.

## Batch tests (needs you)

Run `npm run build`, then test in Figma desktop. Tick each check as it passes; write what went wrong next to any that fail.

- [ ] **Batch A — smooth Vision Lab**
  - [ ] Large frame (e.g. 1440 px wide or bigger): moving any slider updates the preview smoothly, without lag building up.
  - [ ] The preview looks right: same framing as before, sharp enough at 100%. (At 400% zoom it can be softer than before; say if that bothers you.)
  - [ ] For blur, ghosting, central and peripheral loss, and a preset with blur (e.g. Advanced Cataracts): the frame from **Add current view to Figma** looks like the preview (same strength of effect).
  - [ ] **Add current view to Figma** on a large frame shows "Adding to Figma..." while it works, and the frame is full quality.
  - [ ] Click quickly through several layers: the preview ends up showing the last one you selected, not an earlier one.
  - [ ] Small layer (e.g. a button): preview and Add to Figma still work as before.
  - [x] **Very large design** (wider or taller than 2048 px, e.g. a long landing page): Vision Lab "Add current view to Figma" and Quick simulation (one card and "Add all") work without "Image is too large". The new frame is the same size as the design; blur and ghosting look about as strong as on a smaller design. (Very large designs come out at lower resolution; that's Figma's image limit.) ✅ 2026-11-10
- [ ] **Batch C — presets per user**
  - [ ] Import a preset file, then open a **different** Figma file: the preset is there too.
  - [ ] Open a file where you made presets with the old version: a toast says they were imported, and they appear. Delete one, close and reopen the plugin: it stays deleted.
  - [ ] Select a preset, close and reopen the plugin (also in another file): the same preset is selected. Clear it, reopen: nothing is selected.
  - [ ] In a file you can only view: presets load and the selected preset is remembered.
  - [ ] Import a broken file (e.g. a filter with `"radius": 5000`, or a missing `config`): you get a message saying what's wrong, and nothing is imported.
- [ ] **Preset format v2**
  - [ ] Every built-in preset except Aging Vision (80+) looks the same as before. Aging Vision (80+): the dark centre is now the same share of a small and a large design.
  - [ ] Vision Lab blur and ghosting sliders start at 4 / 5 / 2.5 px (half the old numbers) and the preview looks the same as before at those values.
  - [ ] Export a custom or built-in preset: the file has `"version": 2`. Re-import it: it works.
  - [ ] Import an old file without `"version"` (e.g. one exported before today): it's accepted and looks the same as before (visual field filters: same share of a 500px design).
  - [ ] Presets you imported earlier today (saved per user) still load and look the same.
- [ ] **Batch B — accurate color blindness**
  - [ ] Every color-blind simulation looks different from before (expected), and greys, black and white look unchanged.
  - [ ] Protanopia: reds look dark olive/brown. Deuteranopia: reds look olive/brown, greens beige. Tritanopia: blues look teal, greens look cyan-ish.
  - [ ] Severity slider: 0% looks identical to the original; moving towards 100% changes smoothly, with no sudden jumps.
  - [ ] Achromatopsia is grey, with brightness that looks natural (yellows light, blues dark).
  - [ ] Optional: compare one screenshot against another simulator that uses Machado (e.g. Chrome DevTools → Rendering → Emulate vision deficiencies). Results should look very close.

- [x] **Stack of simulations (Vision Lab)** ✅ tested 2026-11-10
  - [x] Vision Lab shows "Start from" and "Simulations"; the old Simulation dropdown and gear-parameters button are gone.
  - [x] "+ Add a simulation" adds one with its sliders open; adding a second collapses nothing else but opens the new one; clicking a header opens/closes it.
  - [x] ↑ / ↓ reorder (e.g. Blur then Contrast vs Contrast then Blur looks different); ✕ removes; first ↑ and last ↓ are disabled.
  - [x] "Start from" a built-in preset: its simulations appear in the list; changing a slider shows "· edited" in the status line; the saved built-in preset itself is unchanged when you pick it again.
  - [ ] "Save as preset": type a name, Save → toast, it appears in the dropdown and in Manage presets, and survives closing the plugin. Cancel closes the field. — retest: used the same kind of form as Rename (fixed 2026-11-10).
  - [x] "Add current view to Figma" appears once there's at least one simulation; the frame is named after the preset or e.g. "Blurred + Yellowing", and matches the preview.
  - [x] The clear (✕ Reset) button next to "Start from" empties the list.
  - [x] With a long list, nothing is hidden behind the bottom bar (you can scroll to the preview).

- [ ] **Preset Manager reference**
  - [ ] Manage presets shows "Preset file format" with a short example; Copy puts valid JSON on the clipboard, and importing that JSON works.
  - [ ] "Filter reference" opens and lists the color blindness group plus 7 other filters, each with settings and ranges; readable in light and dark mode.

- [x] **Scrollbars** ✅ tested 2026-11-10
  - [x] Vision Lab with nothing selected (and with a preset chosen in "Start from"): no vertical scrollbar at the default window size.
  - [x] With a design selected and a simulation added, the preview isn't hidden behind the "Add current view to Figma" bar.
  - [x] Where something does scroll (long stack, dropdown menus, Preset Manager), the scrollbar is slim and rounded, in light and dark mode.

- [ ] **Stack polish**
  - [x] Manage presets: Duplicate on a built-in preset adds "… copy" under Custom presets, and it can be picked in Start from. ✅ 2026-11-10
  - [x] Rename a custom preset (pencil icon): Enter saves, Escape or Cancel keeps the old name; if it's the preset loaded in Vision Lab, the status line shows the new name. ❌ 2026-11-10: rename did nothing (the field was an HTML form, which Figma's sandbox blocks). Fixed; then the field was squeezed to ~0 width (screenshot) — also fixed: full-width field while renaming. Please retest. ✅ Retested 2026-11-10: works.
  - [ ] Keyboard only (Tab / Enter / Space) in the stack: after ↑ or ↓ focus stays on that entry's arrow; after ✕ it moves to the next entry (or "+ Add" when empty); after adding, it's on the new entry.

- [ ] **Plugin accessibility (keyboard)**
  - [ ] Tab to the tabs: only the selected tab is a stop; ← / → switch tabs.
  - [ ] Dropdowns (Start from, + Add a simulation): ↓ opens with the current option focused, ↑ / ↓ / Home / End move, Enter picks, Esc closes back to the dropdown.
  - [ ] Every slider can be reached with Tab and changed with the arrow keys.

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
- [x] 🟠 **1.8 Ignore stale previews.** Tag each preview request with an ID (or the node ID) and drop responses that arrive after a newer selection.

- [x] 🔴 **1.9 Large designs fail with "in createImage: Image is too large".** Figma images are limited to 4096 px per side, but designs are always exported at 2×, so anything over 2048 px fails (Vision Lab "Add to Figma" and Quick simulation). Fix: pick the export scale per design (2× if it fits, otherwise the largest scale under the limit) and size the frame with that same scale. Found in testing 2026-11-10.

## Phase 2 — Simulation accuracy

- [x] 🔴 **2.1 Replace the color-blindness matrices with Machado et al. (2009).** The current protan/deutan/tritan matrices are the inaccurate "ColorJack"/Coblis set. Machado provides severity steps from 0.1 to 1.0, which can replace the linear blend toward the identity matrix.
  - [vision-simulator.constants.ts:41-64](../src/utils/vision-simulator.constants.ts#L41-L64)
- [x] 🔴 **2.2 Apply color matrices in linear RGB.** Convert sRGB to linear, apply the matrix, then convert back. A lookup table keeps this fast.
- [ ] 🟠 **2.3 Make bright-light "washout" reduce saturation.** It currently blends toward white, and the `gray` value it computes is never used.
  - [image-utils.ts:519](../src/utils/image-utils.ts#L519)
- [ ] 🟢 **2.4 Premultiply alpha in blur.** This prevents dark fringes on transparent edges.

## Phase 3 — Performance

- [x] 🔴 **3.1 Downscale the Vision Lab preview.** Process at about 2× the panel width using the existing, unused `calculatePreviewDimensions` and `resizeImageData` (or canvas `drawImage` scaling). Keep full resolution only for "Add to Figma".
- [ ] 🔴 **3.2 Move image processing into a Web Worker** using `OffscreenCanvas`, so the UI stays responsive.
- [x] 🟠 **3.3 Debounce selection changes and slider input.**
- [ ] 🟠 **3.4 Use a faster blur.** Replace the Gaussian loop with a box-blur or stack-blur approximation, whose cost doesn't grow with the radius.
- [x] 🟠 **3.5 Draw straight into a visible `<canvas>`.** This avoids re-encoding a PNG with `toDataURL()` on every slider tick.
- [x] 🟠 **3.6 Remove `figma.loadAllPagesAsync()`.** No `documentchange` handler needs it, it isn't awaited, and it's slow in large files.
  - [code.ts:6](../src/code.ts#L6)
- [ ] 🟢 **3.7 Cache exported images by node ID** so switching back to a node doesn't export it again. Clear a node's entry when the node changes. _(impl.md)_
- [ ] 🟢 **3.8 Explore WebGL shaders** for the color matrix and blur. Worth doing only if 3.1–3.4 aren't fast enough. _(impl.md)_

## Phase 4 — Storage

- [x] 🔴 **4.1 Store custom presets per user with `figma.clientStorage`.** They currently live on the document via `figma.root.setPluginData`, so they don't follow the user to other files and fail in view-only files. Migrate any presets already stored on the document.
- [x] 🟠 **4.2 Store the selected preset in `clientStorage` too.**
- [x] 🟠 **4.3 Validate imported presets fully.** Check each filter's `type` and `config` shape; a missing `config` currently crashes when it's destructured.
  - [PresetManager.tsx:65-80](../src/components/ui/Presets/PresetManager.tsx#L65-L80)

## Phase 5 — Code health

- [x] 🔴 **5.1 Use one filter registry.** Replace the `if/else` chain copied in `processFilterForGenerate`, `applyFilterToPreview` and `applyFilterPreset` with a single `Record<SimulationType, (data, w, h, params) => data>`.
- [ ] 🟠 **5.2 Split `MainView.tsx` (1,369 lines)** into `QuickSimulationTab`, `VisionLabTab` and a `useFilterPipeline` hook.
- [x] 🟠 **5.3 Generate the Quick simulation filter cards from `FILTER_METADATA`** instead of writing each one by hand. This also removes the duplicated prevalence text.
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

- [x] 🟠 **6.1 Use Figma's theme.** Pass `themeColors: true` to `showUI` and use Figma's CSS variables. Remove the hard-coded `get-theme` → `"light"` handler and the manual toggle.
- [x] 🟠 **6.2 Make the tabs accessible:** `role="tablist"` / `role="tab"`, `aria-selected`, and arrow-key navigation.
- [x] 🟠 **6.3 Give sliders accessible labels**, and give the preview image alt text that names the active filter.
- [ ] 🟠 **6.4 Fix the window height.** 770px doesn't fit on many laptops; make it shorter or resizable.
- [ ] 🟢 **6.5 Make zoom scrollable.** It uses `transform: scale()` with no scroll container, so a zoomed preview gets cut off.
- [ ] 🟢 **6.6 Show feedback while a Quick simulation is generating**, and a clear message when the selection can't be exported.
- [x] 🟠 **6.7 No needless scrollbar in Vision Lab; slim scrollbars everywhere.** Vision Lab reserved space for the "Add current view" bar twice (80px preview margin + 56px padding) even when the bar is hidden, so an empty Vision Lab scrolled. Reserve 56px only while the bar shows. Use the QR code generator's slim rounded scrollbar for the whole plugin (found in testing 2026-11-10).

## Phase 7 — New features

- [ ] 🟠 **7.1 "Generate all":** a labeled grid of every simulation next to the original.
- [ ] 🟠 **7.2 Before/after comparison slider** in Vision Lab.
- [ ] ~~🟠 **7.3 "Save current settings as preset"** from Vision Lab, instead of JSON import only.~~ → replaced by 7.15 (2026-11-10)
- [ ] 🟢 **7.4 Contrast check under each simulation:** flag text that fails WCAG contrast once a simulation is applied.
- [ ] 🟢 **7.5 Support multiple selected nodes** (currently only `selection[0]` is used).
- [ ] 🟢 **7.6 Parameters for Quick simulation:** let it use the last-used Vision Lab settings, or a chosen preset.
- [ ] 🟠 **7.7 Presets in Quick simulation.** Presets currently work only in Vision Lab, so multi-filter frames can only reach the canvas through "Add current view to Figma". _(impl.md: Limitation 8, Future #2)_
- [ ] ~~🟠 **7.8 Preset builder in the UI.** Add, remove and reorder the filters in a preset, with sliders for each filter and a live preview. Today a custom preset means editing JSON and importing it. This is the full version of 7.3. _(impl.md: Limitations 5–7, Future #1)_~~ → replaced by 7.15 (2026-11-10)
- [ ] 🟢 **7.9 Download the filtered image as a PNG** from Vision Lab, with the filter name in the file name. _(impl.md: Future #4)_
- [ ] 🟢 **7.10 More conditions:** diabetic retinopathy (scattered dark spots) and halos/glare first. _(impl.md: Future #5)_
- [ ] 🟢 **7.11 Preset categories** (medical condition, age, environment) in the preset dropdown. _(impl.md: Future #6)_
- [ ] 🟢 **7.12 Refresh the preview when the selected node is edited.** Use `figma.currentPage.on("nodechange")`, which doesn't need `loadAllPagesAsync` (see 3.6). Debounce it. _(impl.md: Future #10)_
- [x] 🟠 **7.13 Minimal preset reference inside the Preset Manager (now).** Replace the long hand-written JSON block with a short copyable example and a collapsible "Filter reference": every filter type, its settings, ranges and defaults, one line each. Generate it from the same range definitions `preset-validation.ts` uses, so the two can't drift apart (decided 2026-11-10).
- [ ] 🟢 **7.14 Full preset guide for abhijitchirde.com (later, after release).** Markdown in `documentation/` for the user to publish: what each filter simulates, every setting with range/default/unit, examples, sample presets, why filter order matters, and what each import error means. Link to it from the Preset Manager once it's live (decided 2026-11-10).
- [x] 🔴 **7.15 Vision Lab as a stack of simulations (part a).** What you see is a list of simulations applied top to bottom: a single simulation is a list of one, a preset is a saved list. "Start from" a preset loads an editable copy; "+ Add simulation" appends one; each entry has ↑ ↓ ✕ buttons; only one entry is expanded with its sliders, the others show a one-line summary; "Save as preset" stores the list as a custom preset. Replaces the separate Presets/Simulation dropdowns, 7.3 and 7.8. Needs 5.1 and 7.17 first (decided 2026-11-10).
- [x] 🟢 **7.16 Stack polish (part b).** "Edited" indicator when a loaded preset is changed, duplicate/rename custom presets, keyboard focus handling for the list.
- [x] 🔴 **7.17 Preset format v2 before release.** Visual-field radius as a percentage of the design's smaller side (like the Vision Lab slider), blur radius and ghosting offset in design pixels (not 2× export pixels). Add `"version": 2`; read v1 files and built-ins by converting them; update `preset-validation.ts` ranges (decided 2026-11-10).

**Not planned** (from implementation.md's future list): community preset sharing (needs a backend, and the manifest blocks network access), ML-based simulation, VR/AR preview, and A/B mode (7.2 covers most of it).

## Phase 8 — Documentation accuracy

[implementation.md](implementation.md) says the plugin is "production ready" with "no known issues", but several of its claims don't match the code. Update each item once the related code change lands, or correct the text now if the feature isn't planned.

- [ ] 🟠 **8.1 Describe the Quick simulation tab as it is now.** The doc still describes an older "Generate" tab: a filter dropdown, a severity slider, "Advanced Parameters" and a Generate button. This appears in Features → Generate Mode, the Generate Mode Layout mockup, the Generate Mode Flow and the "Severity applied correctly in Generate mode" test. That design was replaced by the "Quick simulation" card grid, where each card generates immediately with default values. The doc's Vision Lab sections are correct. Rewrite the Generate sections to match the card grid and rename them "Quick simulation". The flow should also say that `GENERATE_RESULT` is currently sent _before_ the image is applied (see 1.3).
- [ ] 🟠 **8.2 "Labeled frames".** Only the frame _name_ includes the filter; no text label is placed on the canvas (`addLabel` is never called). Fix the doc, or do it as part of 7.1.
- [ ] 🟠 **8.3 Preview downscaling.** Limitation 3 says it's "already implemented for Vision Lab mode"; Performance §3 says it isn't. It isn't. Update after 3.1.
- [ ] 🟠 **8.4 Optimizations that don't exist.** "Canvas API hardware acceleration (50× faster)", "progressive rendering" and "Uint8ClampedArray reuse" are listed as done. All pixel work runs in JS loops on the UI thread, and each filter allocates a new buffer. Rewrite the Performance section after Phase 3.
- [ ] 🟠 **8.5 Scientific claims.** The doc says the plugin uses the Brettel (1997) algorithm with "peer-reviewed, physiologically validated" matrices. The code uses the ColorJack/Coblis matrices. Update after 2.1–2.2.
- [ ] 🟢 **8.6 Parameter ranges.** Doc vs code: blur radius 1–20 vs 1–30 px, ghosting offset −20..+20 vs 0..30 px, temperature 2000–3500 K vs 1000–4000 K.
- [ ] 🟢 **8.7 Zoom levels.** The doc lists fixed steps (25/50/100/200/400%), matching `ZOOM_LEVELS`. The code ignores that constant and steps by 25%, and no button highlights the current level. Pick one behavior.
- [ ] 🟢 **8.8 Status claims.** Remove or re-verify "Zero TypeScript errors" (see 5.5), "Known issues: none", "keyboard navigable, WCAG compliant UI" (see 6.2–6.3) and "theme toggle works" (see 6.1).
- [ ] 🟢 **8.9 Versions and dates.** React 18.3 → 19, and the "Last updated" date.

---

## Change log

| Date       | Item                   | Change                                           | Commit / PR |
| ---------- | ---------------------- | ------------------------------------------------ | ----------- |
| 2026-11-09 | —                      | Plan created                                     | 3b87c18     |
| 2026-11-09 | 3.7–3.8, 7.7–7.12, 8.x | Added items from implementation.md; renamed file | —           |
