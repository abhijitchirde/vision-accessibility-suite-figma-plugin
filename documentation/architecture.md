# How the plugin works

Technical overview of Vision Accessibility Suite for anyone changing the code. For what the
plugin does and how to build it, see the [README](../README.md).

## Two halves

Like every Figma plugin, it runs in two places that talk only through `postMessage`:

| Side | Entry | Has access to | Does |
|---|---|---|---|
| Plugin code | `src/code.ts` | The Figma document API, no DOM | Watches the selection, exports layers as PNG, creates frames, stores data |
| UI | `src/ui.tsx` (React) | DOM and canvas, no document API | Shows the tabs, runs every filter on pixels, sends results back |

All image processing happens in the UI, because it needs a canvas. The plugin code only exports
and places images.

Pure, testable code lives in `src/utils/` (no DOM, no Figma API):

| File | Contents |
|---|---|
| `image-utils.ts` | The filters, the filter registry `applyFilterConfig`, `applyFilterPreset`, color blindness in linear RGB |
| `machado-matrices.ts` | Machado (2009) matrices and interpolation |
| `simulation-render.ts` | Builds filter configs for Quick simulation and the Vision Lab stack, `renderStack`, summaries |
| `preset-validation.ts` | `PRESET_FILTER_SPEC` (every setting and range), validation, v1 → v2 upgrade |
| `vision-simulator.constants.ts` / `.types.ts` | Filter metadata, defaults, built-in presets, export settings, types |
| `vision-simulator.ts` | Plugin-side helpers: export scale, export, frame creation and placement |

## Messages

UI → plugin code (`src/code.ts`):

| Message | Effect |
|---|---|
| `VISION_SIMULATOR_GENERATE { filters }` | Export the selected layer once and reply `PROCESS_FILTER` (or `GENERATE_RESULT` with an error) |
| `VISION_SIMULATOR_APPLY_FILTERED_IMAGE { sourceNodeId, filter, imageData, label }` | Create one simulation frame; reply `IMAGE_APPLIED` |
| `VISION_SIMULATOR_EXPORT_TO_CANVAS { imageData, label, filter }` | Vision Lab's "Add current view to Figma"; reply `EXPORT_TO_CANVAS_RESULT` |
| `VISION_SIMULATOR_PANEL_MOUNTED` / `_UNMOUNTED` | Vision Lab opened or closed: start or stop sending previews |
| `VISION_SIMULATOR_LOAD_PRESETS` / `_SAVE_PRESETS` | Custom presets (per user) |
| `VISION_SIMULATOR_LOAD_SELECTED_PRESET` / `_SAVE_SELECTED_PRESET` | The Vision Lab "Start from" preset (per user) |
| `get-theme-pref` / `set-theme-pref` | The Auto / Light / Dark choice |
| `SHOW_NOTIFICATION { message }`, `disclaimer` | Figma toasts |
| `ZOOM_TO_NODE` | Still handled, but no longer sent by the UI |

Plugin code → UI: `VISION_SIMULATOR_PREVIEW_DATA` (the exported selection for Vision Lab, with
its `exportScale`), `PROCESS_FILTER`, `IMAGE_APPLIED`, `GENERATE_RESULT`,
`EXPORT_TO_CANVAS_RESULT`, `PRESETS_LOADED`, `PRESETS_SAVED`, `SELECTED_PRESET_LOADED`,
`theme-pref`.

UI messages go through `useFigmaMessage().sendMessage(type, data)`, which wraps the payload as
`{ pluginMessage: { type, data } }`; the plugin side reads `msg.data`. The theme and toast
messages send their fields at the top level.

## Quick simulation

1. A card (or "Add all simulations") sends `GENERATE { filters: [...] }`.
2. The plugin code exports the selected layer **once** and sends `PROCESS_FILTER` with the PNG
   and its `exportScale`. No frame is created yet.
3. The UI (`runQuickSimulations` in `MainView.tsx`) filters the image for each filter in turn
   and sends `APPLY_FILTERED_IMAGE`, **waiting for `IMAGE_APPLIED`** before the next one, so
   positions never collide. "Add all" shows "Adding N of 14…".
4. `createSimulationFrame` (in `vision-simulator.ts`) places the frame:
   - **Container**: never inside the user's frames (that would break auto layout, get clipped,
     or change components). If the source is inside a Section, the nearest Section; otherwise
     the page. The Section grows to fit.
   - **Position**: right of the source, or right of the right-most existing simulation of the
     same source (found by plugin data), plus 50 px.
   - **Size**: the image size divided by the export scale, so effects like drop shadows are
     included.
   - **Plugin data** `vision-simulator-generated`: `{ originalNodeId, filter, label, generatedAt }`.

A failure never leaves an empty frame: frames are only created once their image is ready.

## Export scale

Layers are exported at 2x, except very large designs: `getExportScale` lowers the scale so
the longest side stays under 4000 px (Figma refuses images over 4096 px). The UI receives the
scale and treats it as "image pixels per design pixel" (`imagePixelsPerDesignPixel`), so
pixel-based settings keep the same strength at any scale.

## Vision Lab

- **Selection**: `code.ts` waits 150 ms after the last selection change, then exports. A
  request counter drops results of older exports, so the preview always matches the current
  selection.
- **Preview**: `loadImageForPreview` keeps the full export (for "Add to Figma") and a copy at
  most 1200 px on its longest side (for the live preview). Changes are redrawn at most once per
  animation frame, straight into a visible `<canvas>`.
- **Stack**: the state is a list of `{ id, config }` (`StackEntry`), plus the "Start from"
  preset and an "edited" flag. `SimulationStack.tsx` renders the entries; one is expanded with
  its sliders. `renderStack` applies the list in order (it's `applyFilterPreset` over the
  configs). "Start from" loads a copy of a preset; "Save as preset" stores the list as a v2
  custom preset.
- **Zoom and pan**: the preview frame has a fixed height (360 px). 100% fits the whole design
  inside it; zoom (25–400%) scales from there around the centre. When the zoomed design is
  larger than the frame, it pans by dragging (grab cursor), the frame's scrollbars, the wheel,
  or the arrow keys (+ / − / 0 zoom).
- **Add current view to Figma** runs the same stack on the full-size export (scale = export
  scale) and creates the frame like Quick simulation does.

## Filters

`applyFilterConfig(data, width, height, config, pixelScale)` in `image-utils.ts` is the only
place that maps a filter config to its function. `pixelScale` is image pixels per design pixel
(2 for a normal export; less for the preview or very large designs).

| Filter | Settings (format v2 units) | Notes |
|---|---|---|
| Color blindness (7 types) | `severity` 0–1 (default 1 for -opia, 0.6 for -omaly) | Machado matrix for the severity, in linear RGB |
| `central-vision-loss` | `radiusPercent` of the smaller side, `severity` | Dark, blurred centre; its own blur is tuned for a 2x export (`pixelScale / 2`) |
| `peripheral-vision-loss` | `radiusPercent` (clear centre), `severity` | Dark, blurred edges |
| `blurred` | `radius` in design px, `iterations` | Separable Gaussian, at least 1 px after scaling |
| `ghosting` | `offset.x/y` in design px, `opacity` | Shifted copy blended in |
| `yellowing` | `intensity`, `temperature` (K) | Warm shift |
| `loss-of-contrast` | `reduction` 0–1 | Towards mid grey |
| `bright-light` | `intensity`, `washout` | Brightens, then blends toward white (veiling glare lowers contrast and saturation together) |

The accepted ranges are in `PRESET_FILTER_SPEC` (`preset-validation.ts`); the Preset
Manager's filter reference is generated from it.

### Color blindness in detail

- `machado-matrices.ts` holds one 3×3 matrix per deficiency (protan, deutan, tritan) at
  severities 0.0, 0.1 … 1.0; other severities interpolate between the two nearest steps.
  Severity 1.0 is the complete form (-opia), lower values the partial forms (-omaly).
- `applyColorBlindness` converts each pixel from sRGB to linear light (256-entry lookup
  table), applies the matrix, and converts back (4096-step lookup table). Alpha is kept.
- Achromatopsia blends toward Rec. 709 luminance.
- Checked by tests: every matrix row sums to 1 (greys stay grey), severity 0 changes nothing.

## Presets

- **Format v2** (`"version": 2`): blur radius and ghosting offset in design pixels,
  visual field radius as `radiusPercent`. Files without a version are **v1** (pixels of a 2x
  export, fixed-pixel visual field radii); `upgradePreset` converts them (pixel values ÷ 2,
  visual field pixels → % of a 500 px design).
- **Validation**: `validatePreset` checks every filter's settings against
  `PRESET_FILTER_SPEC` and returns a readable reason; `sanitizePresets` keeps the valid ones and
  upgrades them. Imports and stored data both go through it.
- **Built-ins**: five presets in `vision-simulator.constants.ts`, already v2.
- **Preset Manager**: duplicate (any preset), rename (custom), export, delete, import, a
  generated example and the filter reference.

## Storage

| Where | Key | What |
|---|---|---|
| `figma.clientStorage` (per user) | `customPresets` | Custom presets (v2) |
| | `selectedPresetId` | Vision Lab "Start from" preset (`""` = none) |
| | `importedLegacyPresetIds` | Ids of presets already imported from files, so deleted ones don't return |
| | `themePreference` | `auto` / `light` / `dark` |
| Document plugin data (read only now) | `vision-simulator-presets`, `vision-simulator-selected-preset` | Where older versions saved presets; imported once per preset id |
| Node plugin data | `vision-simulator-generated` | Marks simulation frames and links them to their source |

## UI

- **Theme**: `showUI({ themeColors: true })` gives Figma's own colors; Light / Dark override
  all 28 color variables the CSS uses (`ui.css`). Same approach as the author's other plugins.
- **Accessibility**: tabs follow the ARIA tabs pattern (arrow keys, one tab stop); sliders
  have linked labels and spoken values with units; dropdowns support arrow keys, Home / End
  and Escape; the stack keeps keyboard focus when entries move or are removed; the preview
  is focusable and keyboard-pannable.
- **No HTML forms**: Figma's sandboxed iframe can block form submission, so inline fields
  (Rename, Save as preset) use buttons and key handlers.
- Slim scrollbars everywhere (`ui.css`).

## Tests and tools

- `npm test`: Node's built-in test runner. `tests/helpers/load-utils.mjs` transpiles
  `src/utils/*.ts` with the project's TypeScript into a temp folder, so tests run the real code
  with no extra packages. Covers the Machado tables, color blindness invariants, every filter,
  the registry, presets (validation, upgrade) and summaries.
- `npm run typecheck`: TypeScript, no errors expected.
- `npm run community`: re-renders the Figma Community images in `documentation/community/`
  with headless Edge or Chrome. The simulated images there are real output of this code (it's
  bundled for the browser by `make-lib.mjs`), and the plugin windows are the real UI from `dist/`.

## Known limitations

- Filters run on the UI thread. The downscaled preview keeps Vision Lab smooth, but "Add all
  simulations" or "Add current view" on a very large design blocks the UI briefly (moving the
  work to a Web Worker is plan item 3.2).
- Very large designs are exported, and so simulated, below 2x resolution (Figma's image size
  limit).
- At high zoom on large designs the preview is softer than the export, because it's the
  downscaled copy.
- Only the first selected layer is used.
- Simulations are approximations for design and learning: they can't show exactly how any one
  person sees, and they're not a medical tool.
