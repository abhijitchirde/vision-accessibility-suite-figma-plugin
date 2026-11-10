// Icon options for Vision Accessibility Suite. Each icon is an SVG on a 100×100 grid.
// renderIcon(option, sizePx, { rounded }) returns an element.
//
// The "simulated" colours are real output of the plugin's Machado deuteranopia model:
// coral #ff5a4e -> #b1a049 and green #2ecc71 -> #baae77 (both turn khaki, which is the
// confusion the plugin helps designers see).

(function () {
  // Unique ids per rendered icon, so many copies on one page don't share gradients/clips
  let uid = 0;

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
