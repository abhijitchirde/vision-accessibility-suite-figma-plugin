// The filter registry, rendering a stack, presets (validation and v1 -> v2 upgrade).
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUtil, testImage } from "./helpers/load-utils.mjs";

const { applyFilterConfig, applyFilterPreset, scaleBlurRadius } = loadUtil("image-utils");
const { renderStack, defaultStackConfig, describeFilterConfig, quickSimulationConfig } =
  loadUtil("simulation-render");
const { DEFAULT_PRESETS } = loadUtil("vision-simulator.constants");
const { validatePreset, upgradePreset, sanitizePresets } = loadUtil("preset-validation");

const W = 48;
const H = 36;
const image = testImage(W, H);
const same = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;

test("every Quick simulation filter renders and keeps the image size", () => {
  const filters = [
    "protanopia", "protanomaly", "deuteranopia", "deuteranomaly", "tritanopia", "tritanomaly",
    "achromatopsia", "central-vision-loss", "peripheral-vision-loss", "blurred", "ghosting",
    "yellowing", "loss-of-contrast", "bright-light",
  ];
  for (const filter of filters) {
    const config = quickSimulationConfig(filter);
    assert.ok(config, filter);
    const out = applyFilterConfig(image, W, H, config, 2);
    assert.equal(out.length, image.length, filter);
    assert.ok(!same(out, image), `${filter} should change the image`);
  }
  assert.equal(quickSimulationConfig("original"), null);
});

test("filters never modify their input", () => {
  const copy = new Uint8ClampedArray(image);
  for (const preset of DEFAULT_PRESETS) applyFilterPreset(image, W, H, preset, 2);
  assert.ok(same(image, copy));
});

test("a stack renders exactly like the same filters as a preset", () => {
  for (const preset of DEFAULT_PRESETS) {
    assert.ok(same(renderStack(image, W, H, preset.filters, 2), applyFilterPreset(image, W, H, preset, 2)), preset.id);
  }
  assert.equal(renderStack(image, W, H, [], 2), image, "empty stack returns the input");
});

test("an unknown filter type leaves the image unchanged", () => {
  const out = applyFilterConfig(image, W, H, { type: "sparkles", config: {} }, 2);
  assert.ok(same(out, image));
});

test("blur radius scaling keeps at least 1px", () => {
  assert.equal(scaleBlurRadius(4, 2), 8);
  assert.equal(scaleBlurRadius(4, 0.1), 1);
  assert.equal(scaleBlurRadius(0, 2), 0);
});

test("built-in presets are valid format v2 presets", () => {
  assert.equal(DEFAULT_PRESETS.length, 5);
  for (const preset of DEFAULT_PRESETS) {
    assert.equal(preset.version, 2, preset.id);
    assert.equal(validatePreset(preset), null, preset.id);
  }
});

test("invalid presets are rejected with a reason", () => {
  const cases = [
    [{ id: "a", name: "A", filters: [{ type: "blurred" }] }, /missing "config"/],
    [{ id: "b", name: "B", filters: [{ type: "blurred", config: { radius: 5000 } }] }, /radius must be/],
    [{ id: "c", name: "C", filters: [{ type: "sparkles", config: {} }] }, /unknown filter type/],
    [{ id: "d", name: "D", filters: [] }, /has no filters/],
    [{ version: 3, id: "e", name: "E", filters: [{ type: "blurred", config: { radius: 2 } }] }, /version 3/],
    [{ version: 2, id: "f", name: "F", filters: [{ type: "central-vision-loss", config: { radius: 120, severity: 0.4 } }] }, /radiusPercent/],
  ];
  for (const [preset, reason] of cases) {
    const problem = validatePreset(preset);
    assert.ok(problem && reason.test(problem), `${preset.id}: ${problem}`);
  }
});

test("v1 presets are upgraded to v2 units", () => {
  const v1 = {
    id: "old",
    name: "Old preset",
    description: "",
    filters: [
      { type: "blurred", config: { radius: 10, iterations: 2 } },
      { type: "ghosting", config: { offset: { x: 10, y: -6 }, opacity: 0.5 } },
      { type: "central-vision-loss", config: { radius: 120, severity: 0.4 } },
      { type: "peripheral-vision-loss", config: { tunnelRadius: 60, severity: 0.8 } },
      { type: "deuteranomaly", severity: 0.6 },
    ],
  };
  assert.equal(validatePreset(v1), null);
  const v2 = upgradePreset(v1);
  assert.equal(v2.version, 2);
  assert.deepEqual(v2.filters[0].config, { radius: 5, iterations: 2 });
  assert.deepEqual(v2.filters[1].config, { offset: { x: 5, y: -3 }, opacity: 0.5 });
  assert.deepEqual(v2.filters[2].config, { radiusPercent: 24, severity: 0.4 });
  assert.deepEqual(v2.filters[3].config, { radiusPercent: 12, severity: 0.8 });
  assert.deepEqual(v2.filters[4], { type: "deuteranomaly", severity: 0.6 });
  assert.equal(validatePreset(v2), null);
});

test("sanitizePresets keeps valid presets, upgrades them, and fills in a description", () => {
  const out = sanitizePresets([
    { id: "ok", name: "OK", filters: [{ type: "achromatopsia" }] },
    { id: "bad", name: "Bad", filters: [] },
    "not a preset",
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "ok");
  assert.equal(out[0].version, 2);
  assert.equal(out[0].description, "");
  assert.deepEqual(sanitizePresets("nope"), []);
});

test("stack defaults and one-line summaries", () => {
  assert.deepEqual(defaultStackConfig("deuteranomaly"), { type: "deuteranomaly", severity: 0.6 });
  assert.deepEqual(defaultStackConfig("tritanopia"), { type: "tritanopia", severity: 1 });
  assert.equal(defaultStackConfig("original"), null);
  assert.equal(describeFilterConfig(defaultStackConfig("blurred")), "4px · 2 passes");
  assert.equal(describeFilterConfig(defaultStackConfig("central-vision-loss")), "30% area · 80%");
  assert.equal(describeFilterConfig(defaultStackConfig("loss-of-contrast")), "−50%");
  assert.equal(describeFilterConfig({ type: "protanomaly" }), "severity 60%");
});
