# Community page assets

Everything for the plugin's Figma Community page: icon options, cover, carousel slides and
the page text ([`description.md`](description.md): tagline options, tags and the full
description to paste).

## What's here

| Path | What it is | Size |
|---|---|---|
| `exports/icons/icon-N-*-128.png` | Plugin icon, 8 options (**upload the 128 px one**; Figma rounds the corners) | 128×128 |
| `exports/icons/icon-N-*-512.png` | Same icons, large preview | 512×512 |
| `exports/icons/icon-options-1-4.png`, `icon-options-5-8.png` | Four options per sheet, at 240/64/32/16 px on light and dark | 1920×1080 |
| `exports/cover-1920x960.png` | Community cover | 1920×960 |
| `exports/slide-1…4-1920x1080.png` | Carousel: 14 simulations, Quick simulation, Vision Lab, presets | 1920×1080 |
| `exports/sample-design.png` | The sample design the simulations are applied to (2x) | 1040×1440 |
| `description.md` | Tagline options, tags, full description | — |
| `src/` | HTML/CSS/JS sources for all images | — |
| `make-lib.mjs` | Bundles the plugin's filter code into `src/lib/filters.js` | — |
| `render.mjs` | Re-renders every PNG with headless Edge/Chrome | — |

## Icon options

1. **Split eye**: an iris half in full colour, half as someone with deuteranopia sees it, on violet
2. **Before / After**: a design card with a comparison handle (real colours left, simulated right); muddy at 16 px
3. **Light lenses**: three overlapping colour lenses, like stacked simulations, on navy
4. **Field of view**: an eye inside fading rings, for low vision and visual field, on teal
5. **Dot eye**: the plugin's original icon, refined: an eye in halftone dots coloured round a colour wheel
6. **Dot eye, half simulated**: the dot eye with its right half run through the plugin's deuteranopia model
7. **Dot eye, night**: the dot eye on deep navy
8. **Dot iris**: a bold white eye on violet with a dot-ring iris; keeps the dot idea and reads at 16 px

Options 5–8 follow the plugin's original icon (an eye drawn in rainbow halftone dots).
The "simulated" colours in options 1, 2 and 6 are real output of the plugin's Machado
deuteranopia model, not hand-picked.

**Cover and slides use option 8 for now** (user's choice, 2026-11-10). To use another:
`npm run community -- --icon 5`.

## Carousel

1. **14 simulations**: the sample design shown 12 ways, each tile rendered by the plugin's filters
2. **Quick simulation**: a Figma canvas with the design and its generated frames in a row, next to the real Quick simulation window
3. **Vision Lab**: the real Vision Lab with "Advanced Cataracts" loaded and a slider open
4. **Presets**: the five built-in presets applied to the sample, how to make your own, and the disclaimer

## Re-rendering

```sh
npm run build                       # the cover and slides embed the real plugin UI from dist/
npm run community                   # everything, with icon option 8
npm run community -- --icon 5       # cover and slides with another icon
npm run community -- --icons-only
```

- Needs Edge or Chrome (set `EDGE_PATH` or `CHROME_PATH` if it isn't found) and an internet
  connection (fonts come from Google Fonts).
- **Every simulated image is real plugin output.** `make-lib.mjs` bundles `src/utils/*.ts`
  (filters, presets, the Machado model) into `src/lib/filters.js`, and `src/sim.js` runs it on
  `exports/sample-design.png` with the same pixel scaling as the plugin. Change a filter in
  the plugin, re-render, and the images follow.
- **The plugin windows are the real plugin UI** (`dist/ui.html`) in an iframe, not mock-ups.
  `src/window.js` plays Figma's part for the messages the UI sends on start (theme, presets,
  the preset to start from, and the sample design as Figma's 2x export) and opens the Vision
  Lab tab. Transitions are switched off inside the iframe so screenshots never catch one
  halfway.
- The sample design (`src/sample-design.html`) is a finance app screen with the things
  simulations reveal: a red/green-only legend and amounts, status colours, an error banner and
  a low-contrast button.
