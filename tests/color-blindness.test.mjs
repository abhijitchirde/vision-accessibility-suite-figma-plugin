// Color blindness: the Machado (2009) matrices and the simulation in linear RGB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUtil, pixel } from "./helpers/load-utils.mjs";

const { MACHADO_MATRICES, getMachadoMatrix } = loadUtil("machado-matrices");
const { applyColorBlindness, getColorBlindnessMatrix } = loadUtil("image-utils");

const TYPES = [
  "protanopia", "protanomaly", "deuteranopia", "deuteranomaly",
  "tritanopia", "tritanomaly", "achromatopsia",
];
const rgb = (data) => Array.from(data.slice(0, 3));

test("Machado tables have 11 severity steps per deficiency, starting at identity", () => {
  for (const [name, steps] of Object.entries(MACHADO_MATRICES)) {
    assert.equal(steps.length, 11, name);
    assert.deepEqual(steps[0], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], name);
  }
});

test("every Machado matrix row sums to 1 (white and greys stay unchanged)", () => {
  for (const [name, steps] of Object.entries(MACHADO_MATRICES)) {
    steps.forEach((matrix, step) =>
      matrix.forEach((row, r) => {
        const sum = row.reduce((a, b) => a + b, 0);
        assert.ok(Math.abs(sum - 1) < 2e-5, `${name} step ${step} row ${r}: ${sum}`);
      })
    );
  }
});

test("severities between steps interpolate between the two nearest matrices", () => {
  const m = getMachadoMatrix("deutan", 0.55);
  const a = MACHADO_MATRICES.deutan[5];
  const b = MACHADO_MATRICES.deutan[6];
  assert.ok(Math.abs(m[0][0] - (a[0][0] + b[0][0]) / 2) < 1e-9);
  assert.deepEqual(getMachadoMatrix("protan", 1), MACHADO_MATRICES.protan[10]);
  assert.deepEqual(getMachadoMatrix("tritan", 5), MACHADO_MATRICES.tritan[10]); // clamped
});

test("greys, black and white stay the same for every type and severity", () => {
  for (const type of TYPES) {
    for (const severity of [0, 0.3, 0.6, 1]) {
      for (const g of [0, 64, 128, 200, 255]) {
        const out = rgb(applyColorBlindness(pixel(g, g, g), type, severity));
        out.forEach((v) => assert.ok(Math.abs(v - g) <= 1, `${type} ${severity} grey ${g} -> ${out}`));
      }
    }
  }
});

test("severity 0 leaves colors unchanged", () => {
  for (const type of TYPES) {
    for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [200, 120, 40]]) {
      const out = rgb(applyColorBlindness(pixel(...c), type, 0));
      out.forEach((v, i) => assert.ok(Math.abs(v - c[i]) <= 1, `${type} ${c} -> ${out}`));
    }
  }
});

test("known results: red and green both turn khaki for deuteranopia", () => {
  assert.deepEqual(rgb(applyColorBlindness(pixel(0xff, 0x5a, 0x4e), "deuteranopia")), [177, 160, 73]);
  assert.deepEqual(rgb(applyColorBlindness(pixel(0x2e, 0xcc, 0x71), "deuteranopia")), [186, 174, 119]);
  // Achromatopsia: pure red becomes its luminance (Rec. 709 in linear light)
  assert.deepEqual(rgb(applyColorBlindness(pixel(255, 0, 0), "achromatopsia")), [127, 127, 127]);
});

test("partial types default to 0.6 severity, complete types to 1", () => {
  const red = pixel(255, 0, 0);
  assert.deepEqual(
    rgb(applyColorBlindness(red, "deuteranomaly")),
    rgb(applyColorBlindness(red, "deuteranomaly", 0.6))
  );
  assert.deepEqual(
    rgb(applyColorBlindness(red, "protanopia")),
    rgb(applyColorBlindness(red, "protanopia", 1))
  );
  assert.deepEqual(getColorBlindnessMatrix("protanomaly", 1), MACHADO_MATRICES.protan[10]);
});

test("alpha is kept and the input is not modified", () => {
  const input = new Uint8ClampedArray([255, 0, 0, 77]);
  const out = applyColorBlindness(input, "tritanopia");
  assert.equal(out[3], 77);
  assert.deepEqual(Array.from(input), [255, 0, 0, 77]);
});
