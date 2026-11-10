# Changelog

## 2.0.0 (not yet published)

### New

- **Vision Lab stacks**: build a view from several simulations applied top to bottom; start from a preset, add, reorder, tune each one with its own sliders, and save the result as your own preset.
- **Add all simulations**: all 14 Quick simulations in one row, with progress.
- **Zoom and pan inside the preview**: the preview keeps a fixed size; zoom 25–400%, drag with the grab hand, scroll, or use the keyboard.
- **Preset Manager**: duplicate and rename presets, a filter reference (every setting and its range) and a copyable example.
- **Presets per user**: custom presets and the selected preset are saved to your account, so they're in every file and work in view-only files. Presets saved in a file by older versions are imported once.
- **Preset format v2**: sizes that work on any design (visual field radius in %, blur and ghosting in design pixels). Older files are converted automatically.
- **Light and dark mode** that follows Figma (Auto), or a fixed Light / Dark choice.
- **Disclaimer** in the footer.
- **Keyboard access**: tabs, dropdowns, sliders, the stack and the preview work with the keyboard; sliders and buttons have accessible names.

### Changed

- **Color blindness now uses the Machado et al. (2009) model in linear RGB**, with proper severity steps for the partial types. Colors look different from 1.0, and closer to other trusted simulators.
- Quick simulation cards are one line each, with descriptions in tooltips and an "-opia / -omaly" note.
- "Aging Vision (80+)": the dark centre is now the same share of any design instead of a fixed 120 px.
- Vision Lab blur and ghosting sliders show design pixels (half the old numbers, same look).
- Slim scrollbars everywhere; no scrollbar on an empty Vision Lab.

### Fixed

- Simulations were stacked on top of each other, and appeared in the wrong place for layers inside frames; they now line up next to the design, and stay inside its Section.
- A failed simulation no longer leaves an empty frame behind.
- Designs larger than 2048 px failed with "Image is too large".
- Peripheral vision loss turned large designs almost black.
- Vision Lab re-exported the design on every slider move, and could show an older selection after quick clicks; it now filters a smaller copy, so sliders stay smooth on large frames.
- A zoomed-in preview was cut off.
- Imported preset files are fully checked, with a clear message when something's wrong.
