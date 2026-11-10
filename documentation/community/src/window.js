// A plugin window: title bar + the REAL plugin UI from dist/ui.html in an iframe.
// Run `npm run build` at the repo root first so dist/ui.html is current.
//
// The plugin UI talks to Figma through postMessage. This page plays Figma's part for the
// messages the UI sends on start, so the real UI shows a chosen theme, tab and preset, with
// the sample design in the Vision Lab preview:
//   get-theme-pref                       -> theme-pref (light / dark)
//   VISION_SIMULATOR_LOAD_PRESETS        -> no custom presets
//   VISION_SIMULATOR_LOAD_SELECTED_PRESET-> the preset to start from (Vision Lab)
//   VISION_SIMULATOR_PANEL_MOUNTED       -> the sample design PNG, as Figma's 2x export

(function () {
  const UI_URL = "../../../dist/ui.html";
  const UI_WIDTH = 360;
  const UI_HEIGHT = 770;
  const setupFor = new Map(); // iframe window -> setup

  let sampleBytes = null;
  const samplePromise = window.loadSampleBytes().then((bytes) => (sampleBytes = bytes));

  function reply(target, pluginMessage) {
    target.postMessage({ pluginMessage }, "*");
  }

  function answer(target, setup, type) {
    if (type === "get-theme-pref") reply(target, { type: "theme-pref", value: setup.theme });
    if (type === "VISION_SIMULATOR_LOAD_PRESETS") {
      reply(target, { type: "VISION_SIMULATOR_PRESETS_LOADED", presets: [] });
    }
    if (type === "VISION_SIMULATOR_LOAD_SELECTED_PRESET") {
      reply(target, { type: "VISION_SIMULATOR_SELECTED_PRESET_LOADED", presetId: setup.preset || null });
    }
    if (type === "VISION_SIMULATOR_PANEL_MOUNTED") {
      samplePromise.then(() =>
        reply(target, {
          type: "VISION_SIMULATOR_PREVIEW_DATA",
          success: true,
          data: {
            imageData: sampleBytes.slice(),
            width: 520,
            height: 720,
            nodeName: "Spendwise",
            exportScale: 2,
          },
        })
      );
    }
  }

  window.addEventListener("message", (event) => {
    const msg = event.data && event.data.pluginMessage;
    if (msg && setupFor.has(event.source)) answer(event.source, setupFor.get(event.source), msg.type);
  });

  /**
   * @param {{ theme?: "light"|"dark", icon?: number, scale?: number,
   *           tab?: "quick"|"lab", preset?: string, expandIndex?: number, height?: number }} opts
   *   tab: "lab" opens Vision Lab; preset: built-in preset id to start from;
   *   expandIndex: open that simulation's sliders (0 = first); height: crop the UI (before scaling)
   */
  window.pluginWindow = function (opts) {
    const o = opts || {};
    const theme = o.theme || "light";
    const scale = o.scale || 1;
    const height = o.height || UI_HEIGHT;
    const setup = { theme, preset: o.preset };

    const win = document.createElement("div");
    win.className = "pw pw-" + theme;
    win.style.width = UI_WIDTH * scale + "px";

    const bar = document.createElement("div");
    bar.className = "pw-bar";
    bar.style.height = 40 * scale + "px";
    bar.style.fontSize = 13 * scale + "px";
    bar.style.padding = "0 " + 12 * scale + "px";
    bar.appendChild(window.renderIcon(o.icon || 1, 18 * scale, { rounded: true }));
    const title = document.createElement("span");
    title.textContent = "Vision Accessibility Suite";
    bar.appendChild(title);
    const close = document.createElement("span");
    close.className = "pw-close";
    close.textContent = "✕";
    bar.appendChild(close);
    win.appendChild(bar);

    const body = document.createElement("div");
    body.className = "pw-body";
    body.style.width = UI_WIDTH * scale + "px";
    body.style.height = height * scale + "px";
    const frame = document.createElement("iframe");
    frame.src = UI_URL;
    frame.width = UI_WIDTH;
    frame.height = UI_HEIGHT;
    frame.style.transform = "scale(" + scale + ")";
    frame.addEventListener("load", () => {
      setupFor.set(frame.contentWindow, setup);
      let doc = null;
      try {
        doc = frame.contentDocument;
        // Screenshots must not catch the UI halfway through a transition
        const still = doc.createElement("style");
        still.textContent = "*, *::before, *::after { transition: none !important; animation: none !important; }";
        doc.head.appendChild(still);
      } catch (e) {
        // Needs --allow-file-access-from-files (render.mjs passes it)
      }
      // Answer anything the UI asked before this window was registered
      ["get-theme-pref", "VISION_SIMULATOR_LOAD_PRESETS", "VISION_SIMULATOR_LOAD_SELECTED_PRESET"].forEach((type) =>
        answer(frame.contentWindow, setup, type)
      );
      if (doc && o.tab === "lab") {
        setTimeout(() => {
          const tab = doc.getElementById("tab-simulation");
          if (tab) tab.click();
          if (typeof o.expandIndex === "number") {
            setTimeout(() => {
              const toggles = doc.querySelectorAll(".simulation-stack__toggle");
              if (toggles[o.expandIndex]) toggles[o.expandIndex].click();
            }, 300);
          }
        }, 300);
      }
    });
    setTimeout(() => frame.contentWindow && setupFor.set(frame.contentWindow, setup), 0);
    body.appendChild(frame);
    win.appendChild(body);
    return win;
  };
})();
