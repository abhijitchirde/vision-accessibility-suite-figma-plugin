# Archived documentation (December 2025)

These six documents describe the plugin as it was on 2025-12-09. **They are out of date** and
kept only for reference. Many things they describe have changed, for example:

- The "Generate" tab with a dropdown and parameters is now **Quick simulation**: one-click cards and "Add all simulations".
- The Presets and Simulation dropdowns in Vision Lab are now a **stack of simulations** with "Start from" and "Save as preset".
- Color blindness used the "ColorJack" matrices on gamma-encoded values; it now uses the **Machado (2009) model in linear RGB** (these documents also credited Brettel 1997, which was never used).
- Presets were saved in the file; they're now saved **per user** (`figma.clientStorage`), in **format version 2** with resolution-independent sizes.
- Several features listed as done (preview downscaling, progressive rendering, buffer reuse) weren't implemented then; downscaling is now.

For the current plugin, see [`../architecture.md`](../architecture.md) and the
[README](../../README.md). What changed, and why, is tracked in
[`../improvement-plan-09112026.md`](../improvement-plan-09112026.md).
