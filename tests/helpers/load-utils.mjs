// Loads the plugin's pure modules (src/utils/*.ts) for tests, without a build step or extra
// packages: each file is transpiled with the project's own TypeScript into a temporary
// folder as CommonJS, then required from there.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(path.join(root, "package.json"));
const ts = require("typescript");

let outDir = null;

function build() {
  outDir = fs.mkdtempSync(path.join(os.tmpdir(), "vas-tests-"));
  const utils = path.join(root, "src", "utils");
  for (const file of fs.readdirSync(utils).filter((f) => f.endsWith(".ts"))) {
    const js = ts.transpileModule(fs.readFileSync(path.join(utils, file), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
    }).outputText;
    fs.writeFileSync(path.join(outDir, file.replace(/\.ts$/, ".js")), js);
  }
}

/** require() one of src/utils (e.g. "image-utils") */
export function loadUtil(name) {
  if (!outDir) build();
  return createRequire(path.join(outDir, "index.js"))(`./${name}.js`);
}

/** A deterministic RGBA test image */
export function testImage(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = (x * 7 + y * 3) % 256;
      data[i + 1] = (x * 2 + y * 11) % 256;
      data[i + 2] = (x * y) % 256;
      data[i + 3] = (x + y) % 5 === 0 ? 128 : 255;
    }
  }
  return data;
}

/** One opaque pixel */
export const pixel = (r, g, b) => new Uint8ClampedArray([r, g, b, 255]);
