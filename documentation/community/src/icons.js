// Icon options for Vision Accessibility Suite. Each icon is an SVG on a 100×100 grid.
// renderIcon(option, sizePx, { rounded }) returns an element.
//
// The "simulated" colours are real output of the plugin's Machado deuteranopia model:
// coral #ff5a4e -> #b1a049 and green #2ecc71 -> #baae77 (both turn khaki, which is the
// confusion the plugin helps designers see).

(function () {
  // Unique ids per rendered icon, so many copies on one page don't share gradients/clips
  let uid = 0;

  // ---- Dot-eye style (options 5-8), after the plugin's original icon: an eye drawn in
  // halftone dots, coloured round a colour wheel, bigger towards the middle of the eye.

  function hslToRgb(h, s, l) {
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
  }
  const toHex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

  /** Colour as someone with deuteranopia sees it (plugin's own model, if loaded) */
  function deut(rgb) {
    if (!window.VAS) return rgb;
    const px = new Uint8ClampedArray([rgb[0], rgb[1], rgb[2], 255]);
    return Array.from(window.VAS.applyColorBlindness(px, "deuteranopia").slice(0, 3));
  }

  /**
   * Dots in rings round the centre, kept inside an almond eye shape.
   * opts: { light (0-1 lightness), sat, simulateRight, irisRadius }
   */
  function eyeDots(opts) {
    const cx = 50, cy = 50, halfWidth = 46, halfHeight = 34;
    const irisR = opts.irisRadius || 14.5;
    const edge = (x) => halfHeight * (1 - Math.pow((x - cx) / halfWidth, 2)); // eye half-height at x
    const dots = [];
    for (let r = irisR + 4.8; r <= halfWidth; r += 4.7) {
      const count = Math.max(8, Math.round((2 * Math.PI * r) / 4.9));
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (r % 2) * 0.18;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const limit = edge(x);
        if (limit <= 0) continue;
        const depth = 1 - Math.abs(y - cy) / limit; // 1 on the centre line, 0 at the lid
        if (depth < 0.1) continue;
        const radius = 0.8 + 1.65 * Math.min(1, depth * 1.3) * (1 - 0.3 * (r / halfWidth));
        const hue = ((angle * 180) / Math.PI + 300) % 360;
        let rgb = hslToRgb(hue, opts.sat ?? 0.78, opts.light ?? 0.56);
        if (opts.simulateRight && x > cx) rgb = deut(rgb);
        dots.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius.toFixed(2)}" fill="${toHex(rgb)}" />`);
      }
    }
    return dots.join("");
  }

  /** Dark iris with a blue ring and a highlight, like the original icon */
  function iris(r, opts) {
    return `
      <circle cx="50" cy="50" r="${r}" fill="url(#ir-ID)" />
      <circle cx="50" cy="50" r="${(r * 0.55).toFixed(2)}" fill="${(opts && opts.pupil) || "#0d1030"}" />
      <circle cx="${(50 - r * 0.32).toFixed(2)}" cy="${(50 - r * 0.32).toFixed(2)}" r="${(r * 0.17).toFixed(2)}" fill="#fff" opacity="0.9" />`;
  }
  const irisGradient = `
    <radialGradient id="ir-ID" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.5" stop-color="#1b2a6b" /><stop offset="0.8" stop-color="#2f6bff" /><stop offset="1" stop-color="#22b8ff" />
    </radialGradient>`;

  /** An iris made only of dot rings (option 8) */
  function dotIris(r) {
    const dots = [];
    for (let ring = 9.5; ring <= r; ring += 3.4) {
      const count = Math.round((2 * Math.PI * ring) / 3.5);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const hue = ((angle * 180) / Math.PI + 300) % 360;
        dots.push(`<circle cx="${(50 + Math.cos(angle) * ring).toFixed(2)}" cy="${(50 + Math.sin(angle) * ring).toFixed(2)}" r="1.45" fill="${toHex(hslToRgb(hue, 0.85, 0.55))}" />`);
      }
    }
    return dots.join("");
  }

  const OPTIONS = [
    {
      id: 1,
      name: "Split eye",
      note: "An eye whose iris is half full colour, half as someone with deuteranopia sees it. Says 'see your design through other eyes'.",
      svg: () => `
        <defs>
          <linearGradient id="bg-ID" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#6a5bff" /><stop offset="1" stop-color="#2b1d9e" />
          </linearGradient>
          <clipPath id="iris-ID"><circle cx="50" cy="50" r="19" /></clipPath>
        </defs>
        <rect width="100" height="100" fill="url(#bg-ID)" />
        <circle cx="16" cy="6" r="56" fill="#fff" opacity="0.08" />
        <path d="M8 50 C24 24 76 24 92 50 C76 76 24 76 8 50 Z" fill="#fff" />
        <g clip-path="url(#iris-ID)">
          <rect x="31" y="31" width="19" height="19" fill="#ff5a4e" />
          <rect x="31" y="50" width="19" height="19" fill="#2ecc71" />
          <rect x="50" y="31" width="19" height="19" fill="#b1a049" />
          <rect x="50" y="50" width="19" height="19" fill="#baae77" />
        </g>
        <line x1="50" y1="29" x2="50" y2="71" stroke="#fff" stroke-width="2.2" />
        <circle cx="50" cy="50" r="7.5" fill="#111633" />
        <circle cx="46.5" cy="46.5" r="2.4" fill="#fff" opacity="0.9" />`,
    },
    {
      id: 2,
      name: "Before / After",
      note: "A design card split by a comparison handle: real colours on the left, simulated on the right. Says 'compare'.",
      svg: () => `
        <defs>
          <linearGradient id="bg-ID" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#26346e" /><stop offset="1" stop-color="#0f172a" />
          </linearGradient>
          <clipPath id="left-ID"><rect x="14" y="20" width="36" height="60" /></clipPath>
          <clipPath id="right-ID"><rect x="50" y="20" width="36" height="60" /></clipPath>
        </defs>
        <rect width="100" height="100" fill="url(#bg-ID)" />
        <rect x="14" y="20" width="72" height="60" rx="9" fill="#fff" />
        <g clip-path="url(#left-ID)">
          <circle cx="30" cy="40" r="9" fill="#ff5a4e" />
          <rect x="21" y="56" width="58" height="7" rx="3.5" fill="#2ecc71" />
          <rect x="21" y="67" width="40" height="5" rx="2.5" fill="#dfe3f0" />
        </g>
        <g clip-path="url(#right-ID)">
          <circle cx="70" cy="40" r="9" fill="#b1a049" />
          <rect x="21" y="56" width="58" height="7" rx="3.5" fill="#baae77" />
          <rect x="21" y="67" width="40" height="5" rx="2.5" fill="#dfe3f0" />
        </g>
        <line x1="50" y1="14" x2="50" y2="86" stroke="#ffd23f" stroke-width="3" />
        <circle cx="50" cy="50" r="7" fill="#ffd23f" />
        <path d="M47.5 47 L45 50 L47.5 53 M52.5 47 L55 50 L52.5 53" stroke="#0f172a" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />`,
    },
    {
      id: 3,
      name: "Light lenses",
      note: "Three overlapping colour lenses, like simulations stacked on top of each other; where they overlap, the colours mix. Says 'colour and vision'.",
      svg: () => `
        <defs>
          <linearGradient id="bg-ID" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#1d2152" /><stop offset="1" stop-color="#0a0c24" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bg-ID)" />
        <g style="mix-blend-mode: screen">
          <circle cx="38" cy="40" r="21" fill="#ff5a4e" style="mix-blend-mode: screen" />
          <circle cx="62" cy="40" r="21" fill="#2ecc71" style="mix-blend-mode: screen" />
          <circle cx="50" cy="61" r="21" fill="#2f6bff" style="mix-blend-mode: screen" />
        </g>`,
    },
    {
      id: 4,
      name: "Field of view",
      note: "An eye at the centre of rings that fade outwards, like a visual field. Says 'low vision and visual field'.",
      svg: () => `
        <defs>
          <linearGradient id="bg-ID" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#14a89c" /><stop offset="1" stop-color="#0b4a55" />
          </linearGradient>
          <radialGradient id="vig-ID" cx="0.5" cy="0.5" r="0.62">
            <stop offset="0.45" stop-color="#062026" stop-opacity="0" />
            <stop offset="1" stop-color="#062026" stop-opacity="0.65" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bg-ID)" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="3" opacity="0.22" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="#fff" stroke-width="3" opacity="0.45" />
        <path d="M24 50 C33 36 67 36 76 50 C67 64 33 64 24 50 Z" fill="#fff" />
        <circle cx="50" cy="50" r="9.5" fill="#ffd23f" />
        <circle cx="50" cy="50" r="4.5" fill="#062026" />
        <rect width="100" height="100" fill="url(#vig-ID)" />`,
    },
  ];

  OPTIONS.push(
    {
      id: 5,
      name: "Dot eye",
      note: "Your original icon, refined: an eye in halftone dots coloured round a colour wheel, on warm light paper.",
      svg: () => `
        <defs>${irisGradient}</defs>
        <rect width="100" height="100" fill="#f7f3ea" />
        ${eyeDots({ light: 0.56 })}
        ${iris(14.5)}`,
    },
    {
      id: 6,
      name: "Dot eye, half simulated",
      note: "The dot eye with its right half as someone with deuteranopia sees it (the plugin's own model). The original idea plus 'see through other eyes'.",
      svg: () => `
        <defs>${irisGradient}</defs>
        <rect width="100" height="100" fill="#f7f3ea" />
        ${eyeDots({ light: 0.56, simulateRight: true })}
        ${iris(14.5)}`,
    },
    {
      id: 7,
      name: "Dot eye, night",
      note: "The dot eye glowing on deep navy: the colours pop, and it stands out in Figma's dark menus.",
      svg: () => `
        <defs>
          ${irisGradient}
          <linearGradient id="bg-ID" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#1d2152" /><stop offset="1" stop-color="#0a0c24" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bg-ID)" />
        ${eyeDots({ light: 0.62, sat: 0.9 })}
        ${iris(14.5, { pupil: "#05061a" })}`,
    },
    {
      id: 8,
      name: "Dot iris",
      note: "A bold white eye on violet with an iris made of colour-wheel dots. Keeps the dot idea and reads clearly at 16 px.",
      svg: () => `
        <defs>
          <linearGradient id="bg-ID" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#6a5bff" /><stop offset="1" stop-color="#2b1d9e" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bg-ID)" />
        <circle cx="16" cy="6" r="56" fill="#fff" opacity="0.08" />
        <path d="M8 50 C24 22 76 22 92 50 C76 78 24 78 8 50 Z" fill="#fff" />
        ${dotIris(21)}
        <circle cx="50" cy="50" r="7.5" fill="#111633" />
        <circle cx="47" cy="47" r="2.3" fill="#fff" opacity="0.9" />`,
    }
  );

  window.ICON_OPTIONS = OPTIONS;

  window.renderIcon = function (option, size, opts) {
    const def = OPTIONS.find((o) => o.id === Number(option)) || OPTIONS[0];
    const id = "i" + uid++;
    const wrap = document.createElement("div");
    wrap.className = "icon-wrap" + (opts && opts.rounded ? " rounded" : "");
    wrap.style.width = size + "px";
    wrap.style.height = size + "px";
    wrap.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${def
      .svg()
      .replace(/ID/g, id)}</svg>`;
    return wrap;
  };
})();
