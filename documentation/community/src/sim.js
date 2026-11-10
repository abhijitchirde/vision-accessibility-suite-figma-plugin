// Helpers for the community pages: run the plugin's real filters (lib/filters.js) on the
// sample design and get canvases back.
//
//   const img = await loadSample();                      // exports/sample-design.png (2x)
//   const canvas = simulate(img, configs, 320);          // stack of filter configs, 320px wide
//   const canvas = simulate(img, [quickConfig("deuteranomaly")], 320);
//
// The sample is a 2x render of a 520×720 design, like the plugin's own 2x export, so filter
// settings in design pixels scale exactly as they do in the plugin.

(function () {
  const SAMPLE_URL = "../exports/sample-design.png";
  const DESIGN_WIDTH = 520; // design px (the PNG is 2x)

  window.loadSample = function () {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("sample-design.png missing: run render.mjs"));
      img.src = SAMPLE_URL;
    });
  };

  /** PNG bytes of the sample (what the plugin UI receives from Figma's export) */
  window.loadSampleBytes = function () {
    return new Promise((resolve, reject) => {
      // fetch() can't read file:// URLs; XHR can with --allow-file-access-from-files
      const xhr = new XMLHttpRequest();
      xhr.open("GET", SAMPLE_URL);
      xhr.responseType = "arraybuffer";
      xhr.onload = () => resolve(new Uint8Array(xhr.response));
      xhr.onerror = reject;
      xhr.send();
    });
  };

  /** Quick simulation's default config for a filter id */
  window.quickConfig = function (filter) {
    return VAS.defaultStackConfig(filter);
  };

  /**
   * Draw the sample at `width` px wide and apply a stack of filter configs with the
   * plugin's own renderStack. Returns a canvas.
   */
  window.simulate = function (img, configs, width) {
    const scale = width / img.naturalWidth;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    if (configs && configs.length) {
      const data = ctx.getImageData(0, 0, w, h).data;
      // Image pixels per design pixel, as in the plugin
      const pixelScale = w / DESIGN_WIDTH;
      const out = VAS.renderStack(data, w, h, configs, pixelScale);
      ctx.putImageData(new ImageData(new Uint8ClampedArray(out), w, h), 0, 0);
    }
    return canvas;
  };
})();
