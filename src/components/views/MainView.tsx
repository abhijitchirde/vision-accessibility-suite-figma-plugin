import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import "./MainView.css";
import { Button } from "../ui/Button/Button";
import { FilterIcon } from "../ui/Filter/FilterIcon";
import { PresetSelector } from "../ui/Presets/PresetSelector";
import { PresetManager } from "../ui/Presets/PresetManager";
import { SimulationStack, StackEntry } from "../ui/Stack/SimulationStack";
import {
  useFigmaMessage,
  waitForPluginMessage,
} from "../../hooks/useFigmaMessage";
import { FaPlus } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";
import { GoScreenFull } from "react-icons/go";
import {
  SimulationType,
  FilterPreset,
  PRESET_FORMAT_VERSION,
} from "../../utils/vision-simulator.types";
import {
  FILTER_METADATA,
  COLOR_BLIND_FILTERS,
  VISUAL_FIELD_FILTERS,
  OTHER_FILTERS,
  DEFAULT_ZOOM,
  DEFAULT_PRESETS,
} from "../../utils/vision-simulator.constants";
import {
  imagePixelsPerDesignPixel,
  renderQuickSimulation,
  renderStack,
  defaultStackConfig,
} from "../../utils/simulation-render";

type Tab = "generate" | "simulation";

const TABS: { id: Tab; label: string }[] = [
  { id: "generate", label: "Quick simulation" },
  { id: "simulation", label: "Vision Lab" },
];

/** Sections and cards shown in the Quick simulation tab, in display order */
const QUICK_SIMULATION_SECTIONS: {
  title: string;
  badge?: string;
  filters: SimulationType[];
}[] = [
  { title: "Red deficiency (Protan)", filters: ["protanopia", "protanomaly"] },
  {
    title: "Green deficiency (Deutan)",
    badge: "Most common",
    filters: ["deuteranopia", "deuteranomaly"],
  },
  { title: "Blue deficiency (Tritan)", filters: ["tritanopia", "tritanomaly"] },
  { title: "Total color blindness", filters: ["achromatopsia"] },
  { title: "Visual field defects", filters: VISUAL_FIELD_FILTERS },
  { title: "Other", filters: OTHER_FILTERS },
];

/** Every simulation offered in Quick simulation, in display order */
const ALL_QUICK_FILTERS: SimulationType[] = ([] as SimulationType[]).concat(
  ...QUICK_SIMULATION_SECTIONS.map((section) => section.filters)
);

/** Show a Figma toast */
function notifyInFigma(message: string) {
  parent.postMessage(
    { pluginMessage: { type: "SHOW_NOTIFICATION", message } },
    "*"
  );
}

/** Decode PNG bytes into an image element */
function loadPngImage(bytes: Uint8Array): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(
      new Blob([bytes as any], { type: "image/png" })
    );
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read the exported image"));
    };
    img.src = url;
  });
}

/**
 * Apply one Quick simulation filter, with its default settings, and return
 * the result as PNG bytes. `pixelScale` scales pixel-based settings (see
 * imagePixelsPerDesignPixel).
 */
async function renderQuickSimulationPng(
  img: HTMLImageElement,
  filter: SimulationType,
  pixelScale: number = 2
): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available");

  ctx.drawImage(img, 0, 0);
  const { width, height } = canvas;
  const source = ctx.getImageData(0, 0, width, height).data;
  const filtered = renderQuickSimulation(source, width, height, filter, pixelScale);

  ctx.putImageData(new ImageData(filtered as any, width, height), 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Couldn't encode the filtered image");
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Longest side of the live Vision Lab preview, in pixels. Large designs are
 * filtered on a copy this size instead of the full 2x export (a 1440px-wide
 * frame drops from ~5M to under 1M pixels per change). "Add current view to
 * Figma" still filters the full-size image.
 */
const MAX_PREVIEW_SIDE = 1200;

/** Pixel data of an image, optionally scaled down to fit `maxSide` */
interface ImagePixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  /** Size relative to the full image (1 = full size) */
  scale: number;
}

function getImagePixels(img: HTMLImageElement, maxSide?: number): ImagePixels {
  const fit = maxSide
    ? Math.min(1, maxSide / Math.max(img.width, img.height))
    : 1;
  const width = Math.max(1, Math.round(img.width * fit));
  const height = Math.max(1, Math.round(img.height * fit));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  return {
    data: ctx.getImageData(0, 0, width, height).data,
    width,
    height,
    scale: width / img.width,
  };
}

export const MainView: React.FC<{}> = ({}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  // Generate mode state
  const [generatingFilter, setGeneratingFilter] =
    useState<SimulationType | null>(null);
  // Set while "Add all simulations" runs: how many are done out of how many
  const [generateProgress, setGenerateProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const isGenerating = generatingFilter !== null || generateProgress !== null;

  // Vision Lab: a stack of simulations applied top to bottom
  const [stack, setStack] = useState<StackEntry[]>([]);
  // The entry whose sliders are shown (one at a time)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Preset the stack was started from, and whether it changed since
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(
    null
  );
  const [stackEdited, setStackEdited] = useState(false);
  // Name typed in the inline "Save as preset" form (null = form closed)
  const [savingPresetName, setSavingPresetName] = useState<string | null>(
    null
  );
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  // Size of the preview image in pixels
  const [previewPixelSize, setPreviewPixelSize] = useState({ width: 0, height: 0 });
  // Size of the preview's scroll area (the fixed-size frame)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [panning, setPanning] = useState(false);
  // True when a design is loaded into the Vision Lab preview
  const [hasPreview, setHasPreview] = useState(false);
  // Bumped each time a new design is loaded, to trigger a redraw
  const [imageVersion, setImageVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Presets
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [showPresetManager, setShowPresetManager] = useState(false);

  // Vision Lab preview
  const previewCanvasRef = useRef<HTMLCanvasElement>(null); // visible preview
  const originalImageRef = useRef<HTMLImageElement | null>(null); // full-size export
  const previewSourceRef = useRef<ImagePixels | null>(null); // downscaled pixels
  const renderFrameRef = useRef<number | null>(null); // pending redraw
  const viewportRef = useRef<HTMLDivElement>(null); // preview scroll area
  // Drag-to-pan: where the drag started and the scroll position then
  const panRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  // Point (as a fraction of the content) to keep centred across a zoom change
  const zoomCenterRef = useRef<{ x: number; y: number } | null>(null);
  const pixelsPerDesignPixelRef = useRef(2); // see imagePixelsPerDesignPixel

  const { sendMessage } = useFigmaMessage();

  // Combined presets (built-in + custom)
  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  // Track the preset ID we want to restore
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);

  // Load custom presets and selected preset from storage on mount (only once)
  useEffect(() => {
    sendMessage("VISION_SIMULATOR_LOAD_PRESETS", {});
    sendMessage("VISION_SIMULATOR_LOAD_SELECTED_PRESET", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Listen for loaded presets from code.ts
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg?.type === "VISION_SIMULATOR_PRESETS_LOADED") {
        setCustomPresets(msg.presets || []);
      } else if (msg?.type === "VISION_SIMULATOR_SELECTED_PRESET_LOADED") {
        if (msg.presetId) {
          setPendingPresetId(msg.presetId);
        }
      } else if (msg?.type === "VISION_SIMULATOR_PRESETS_SAVED") {
        if (!msg.success) {
          console.error("[UI] ✗ Failed to save presets:", msg.error);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Restore selected preset when presets are loaded and we have a pending ID
  useEffect(() => {
    if (pendingPresetId && allPresets.length > 0) {
      const preset = allPresets.find((p) => p.id === pendingPresetId);
      if (preset) {
        loadPresetIntoStack(preset);
        setPendingPresetId(null);
      }
    }
  }, [pendingPresetId, allPresets]);

  /**
   * Quick simulation, step 2: filter the exported image for each requested
   * simulation and send the results to Figma one at a time. Waiting for each
   * frame to be created before sending the next keeps them in a neat row.
   * Called when the plugin sends VISION_SIMULATOR_PROCESS_FILTER.
   */
  const runQuickSimulations = async (
    sourceNodeId: string,
    filters: SimulationType[],
    exported: { imageData: Uint8Array; exportScale?: number }
  ) => {
    try {
      const img = await loadPngImage(exported.imageData);

      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (filters.length > 1) {
          setGenerateProgress({ done: i, total: filters.length });
        }
        const png = await renderQuickSimulationPng(
          img,
          filter,
          imagePixelsPerDesignPixel(exported.exportScale)
        );

        const applied = waitForPluginMessage("VISION_SIMULATOR_IMAGE_APPLIED");
        sendMessage("VISION_SIMULATOR_APPLY_FILTERED_IMAGE", {
          sourceNodeId,
          filter,
          imageData: png,
          label: FILTER_METADATA[filter].name,
        });
        const result = await applied;
        if (!result.success) {
          throw new Error(result.error || "Failed to add simulation");
        }
      }
      setError(null);
      if (filters.length > 1) {
        notifyInFigma(`Added ${filters.length} simulations`);
      }
    } catch (err) {
      console.error("Quick simulation failed:", err);
      const message =
        err instanceof Error ? err.message : "Failed to add simulation";
      setError(message);
      notifyInFigma(message);
    } finally {
      setGeneratingFilter(null);
      setGenerateProgress(null);
    }
  };

  /**
   * Add every Quick simulation for the selected layer, in one row.
   */
  const handleAddAllSimulations = () => {
    setError(null);
    setGenerateProgress({ done: 0, total: ALL_QUICK_FILTERS.length });
    sendMessage("VISION_SIMULATOR_GENERATE", { filters: ALL_QUICK_FILTERS });
  };

  // Listen for messages from plugin code
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === "VISION_SIMULATOR_GENERATE_RESULT") {
        // Only sent when generation can't start (no selection, export failed)
        if (!msg.success) {
          setGeneratingFilter(null);
          setGenerateProgress(null);
          setError(msg.error || "Failed to generate simulation");
        }
      } else if (msg?.type === "VISION_SIMULATOR_PREVIEW_DATA") {
        if (msg.success && msg.data) {
          setError(null);
          loadImageForPreview(msg.data.imageData, msg.data.exportScale);
        } else if (msg.error === null) {
          // No selection, clear preview
          clearPreview();
          setError(null);
          setLoading(false);
        } else {
          // Actual error occurred
          clearPreview();
          setError(null); // Don't show error in UI
          setLoading(false);
          // Show figma notification instead
          parent.postMessage(
            {
              pluginMessage: {
                type: "SHOW_NOTIFICATION",
                message: msg.error || "Failed to load preview",
              },
            },
            "*"
          );
        }
      } else if (msg?.type === "VISION_SIMULATOR_PROCESS_FILTER") {
        await runQuickSimulations(msg.sourceNodeId, msg.filters, msg.imageData);
      } else if (msg?.type === "VISION_SIMULATOR_EXPORT_TO_CANVAS_RESULT") {
        setExporting(false);
        if (msg.success) {
          setError(null);
        } else {
          setError(msg.error || "Failed to export to canvas");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [runQuickSimulations]);

  // Notify plugin when Vision Lab tab becomes active/inactive
  useEffect(() => {
    if (activeTab === "simulation") {
      sendMessage("VISION_SIMULATOR_PANEL_MOUNTED", {});
    } else {
      sendMessage("VISION_SIMULATOR_PANEL_UNMOUNTED", {});
    }
  }, [activeTab, sendMessage]);

  // Current Vision Lab simulations (used by the preview and by "Add to Figma")
  const stackConfigs = stack.map((entry) => entry.config);

  // Redraw the preview when the design or the stack changes. Changes are
  // coalesced to at most one redraw per animation frame, so dragging a
  // slider doesn't queue up work. The downscaled copy is drawn straight into
  // the visible canvas (no PNG encoding).
  useEffect(() => {
    if (activeTab !== "simulation" || !previewSourceRef.current) return;

    const configs = stackConfigs;
    if (renderFrameRef.current !== null) {
      cancelAnimationFrame(renderFrameRef.current);
    }
    renderFrameRef.current = requestAnimationFrame(() => {
      renderFrameRef.current = null;
      const source = previewSourceRef.current;
      const canvas = previewCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!source || !canvas || !ctx) return;

      const filtered = renderStack(
        source.data,
        source.width,
        source.height,
        configs,
        source.scale
      );
      canvas.width = source.width;
      canvas.height = source.height;
      ctx.putImageData(
        new ImageData(filtered as any, source.width, source.height),
        0,
        0
      );
    });
    // stackConfigs is rebuilt every render; stack is what changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageVersion, activeTab, stack]);

  // Cancel a pending redraw when the view unmounts
  useEffect(() => {
    return () => {
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current);
      }
    };
  }, []);

  /**
   * Load an exported design into the preview: keep the full-size image for
   * "Add to Figma", and a downscaled copy for the live preview.
   */
  const loadImageForPreview = async (
    imageData: Uint8Array,
    exportScale?: number
  ) => {
    try {
      const img = await loadPngImage(imageData);
      originalImageRef.current = img;
      pixelsPerDesignPixelRef.current = imagePixelsPerDesignPixel(exportScale);
      const preview = getImagePixels(img, MAX_PREVIEW_SIDE);
      // Preview pixels per design pixel = downscale × export scale
      preview.scale *= pixelsPerDesignPixelRef.current;
      previewSourceRef.current = preview;
      setPreviewPixelSize({ width: preview.width, height: preview.height });
      setHasPreview(true);
      setImageVersion((v) => v + 1);
    } catch (err) {
      console.error("Failed to load preview image:", err);
      setError("Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  /** Forget the current design (e.g. nothing is selected) */
  const clearPreview = () => {
    originalImageRef.current = null;
    previewSourceRef.current = null;
    setHasPreview(false);
  };

  // Track the preview frame's size (it only exists in the Vision Lab tab)
  useEffect(() => {
    const element = viewportRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [activeTab]);

  // On-screen size of the preview. 100% = the whole design fits inside the
  // frame (never larger than its natural size); zoom scales from there.
  const PREVIEW_PADDING = 16;
  const fitScale =
    previewPixelSize.width > 0 && viewportSize.width > 0
      ? Math.min(
          1,
          (viewportSize.width - PREVIEW_PADDING) / previewPixelSize.width,
          (viewportSize.height - PREVIEW_PADDING) / previewPixelSize.height
        )
      : 1;
  const displayWidth = Math.max(1, Math.round(previewPixelSize.width * fitScale * zoom));
  const displayHeight = Math.max(1, Math.round(previewPixelSize.height * fitScale * zoom));
  // Larger than the frame: show the grab hand and allow dragging
  const canPan =
    hasPreview &&
    (displayWidth > viewportSize.width - PREVIEW_PADDING + 1 ||
      displayHeight > viewportSize.height - PREVIEW_PADDING + 1);

  /** Change zoom, keeping the point at the centre of the frame in view */
  const zoomTo = (next: number) => {
    const clamped = Math.max(0.25, Math.min(4, next));
    const element = viewportRef.current;
    if (element && element.scrollWidth > 0) {
      zoomCenterRef.current = {
        x: (element.scrollLeft + element.clientWidth / 2) / element.scrollWidth,
        y: (element.scrollTop + element.clientHeight / 2) / element.scrollHeight,
      };
    }
    setZoom(clamped);
  };

  useLayoutEffect(() => {
    const center = zoomCenterRef.current;
    const element = viewportRef.current;
    if (!center || !element) return;
    zoomCenterRef.current = null;
    element.scrollLeft = center.x * element.scrollWidth - element.clientWidth / 2;
    element.scrollTop = center.y * element.scrollHeight - element.clientHeight / 2;
  }, [zoom]);

  const handlePanStart = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = viewportRef.current;
    if (!canPan || !element || event.button !== 0) return;
    // Leave clicks on the frame's own scrollbars alone
    const rect = element.getBoundingClientRect();
    if (
      event.clientX - rect.left >= element.clientWidth ||
      event.clientY - rect.top >= element.clientHeight
    ) {
      return;
    }
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: element.scrollLeft,
      top: element.scrollTop,
    };
    setPanning(true);
  };

  const handlePanMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = panRef.current;
    const element = viewportRef.current;
    if (!start || !element) return;
    element.scrollLeft = start.left - (event.clientX - start.x);
    element.scrollTop = start.top - (event.clientY - start.y);
  };

  const handlePanEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current) return;
    panRef.current = null;
    viewportRef.current?.releasePointerCapture(event.pointerId);
    setPanning(false);
  };

  /** Keyboard on the focused preview: + / − zoom, 0 fits; arrows scroll natively */
  const handlePreviewKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "+" || event.key === "=") zoomTo(zoom + 0.25);
    else if (event.key === "-" || event.key === "_") zoomTo(zoom - 0.25);
    else if (event.key === "0") zoomTo(1);
    else return;
    event.preventDefault();
  };

  /** Tabs: ←/→ move between tabs (wrapping), Home/End jump to the ends */
  const handleTabKeyDown = (event: React.KeyboardEvent) => {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(TABS[next].id);
    document.getElementById(`tab-${TABS[next].id}`)?.focus();
  };

  /** Unique id for a stack entry */
  const newEntryId = () =>
    `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  /** Replace the stack with a copy of a preset's simulations (or empty) */
  const loadPresetIntoStack = (preset: FilterPreset | null) => {
    setSelectedPreset(preset);
    setStack(
      preset
        ? preset.filters.map((config) => ({ id: newEntryId(), config }))
        : []
    );
    setExpandedId(null);
    setStackEdited(false);
    setSavingPresetName(null);
  };

  /** "Start from" dropdown: load a preset (remembered per user) */
  const handleStartFrom = (preset: FilterPreset | null) => {
    loadPresetIntoStack(preset);
    sendMessage("VISION_SIMULATOR_SAVE_SELECTED_PRESET", {
      presetId: preset?.id || null,
    });
  };

  /** Change the stack and mark it as edited */
  const editStack = (update: (entries: StackEntry[]) => StackEntry[]) => {
    setStack(update);
    setStackEdited(true);
  };

  const handleAddSimulation = (filter: SimulationType) => {
    const config = defaultStackConfig(filter);
    if (!config) return;
    const entry = { id: newEntryId(), config };
    editStack((entries) => [...entries, entry]);
    setExpandedId(entry.id);
  };

  const handleMoveSimulation = (id: string, direction: -1 | 1) => {
    editStack((entries) => {
      const from = entries.findIndex((e) => e.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= entries.length) return entries;
      const next = [...entries];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const handleRemoveSimulation = (id: string) => {
    editStack((entries) => entries.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  /** Name shown for the current stack (preset name, or the simulations) */
  const stackLabel =
    selectedPreset && !stackEdited
      ? selectedPreset.name
      : stack
          .map((entry) => FILTER_METADATA[entry.config.type]?.name ?? entry.config.type)
          .join(" + ");

  /** Save the current stack as a custom preset */
  const handleSavePreset = () => {
    const name = (savingPresetName ?? "").trim();
    if (!name || stack.length === 0) return;
    const now = Date.now();
    const preset: FilterPreset = {
      version: PRESET_FORMAT_VERSION,
      id: `custom-${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name,
      description: `Made in Vision Lab: ${stack
        .map((entry) => FILTER_METADATA[entry.config.type]?.name ?? entry.config.type)
        .join(", ")}`,
      filters: stack.map((entry) => entry.config),
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };
    setCustomPresets((prev) => {
      const updated = [...prev, preset];
      sendMessage("VISION_SIMULATOR_SAVE_PRESETS", { presets: updated });
      return updated;
    });
    setSelectedPreset(preset);
    setStackEdited(false);
    setSavingPresetName(null);
    sendMessage("VISION_SIMULATOR_SAVE_SELECTED_PRESET", { presetId: preset.id });
    notifyInFigma(`Saved preset "${name}"`);
  };

  /**
   * Handle individual filter button click
   */
  const handleFilterClick = (filter: SimulationType) => {
    setGeneratingFilter(filter);
    setError(null);

    sendMessage("VISION_SIMULATOR_GENERATE", { filters: [filter] });
  };

  /**
   * Handle preset deletion
   */
  const handleDeletePreset = (presetId: string) => {
    setCustomPresets((prev) => {
      const updated = prev.filter((p) => p.id !== presetId);
      // Save to persistent storage via code.ts
      sendMessage("VISION_SIMULATOR_SAVE_PRESETS", {
        presets: updated,
      });
      return updated;
    });

    // If the deleted preset was selected, clear selection
    if (selectedPreset?.id === presetId) {
      setSelectedPreset(null);
    }
  };

  /**
   * Handle preset import
   */
  const handleImportPresets = (importedPresets: FilterPreset[]) => {

    // Add imported presets to custom presets
    // Only modify ID if it already exists to avoid duplicates
    const existingIds = new Set(customPresets.map((p) => p.id));

    const newPresets = importedPresets.map((preset) => {
      let finalId = preset.id;

      // If preset ID already exists, append timestamp to make it unique
      if (existingIds.has(preset.id)) {
        finalId = `${preset.id}-${Date.now()}`;
      }

      return {
        ...preset,
        id: finalId,
        isBuiltIn: false,
        createdAt: preset.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
    });


    setCustomPresets((prev) => {
      const updated = [...prev, ...newPresets];

      // Save to persistent storage via code.ts
      sendMessage("VISION_SIMULATOR_SAVE_PRESETS", {
        presets: updated,
      });

      return updated;
    });
  };

  /** Copy a preset (built-in or custom) as a new custom preset */
  const handleDuplicatePreset = (preset: FilterPreset) => {
    const now = Date.now();
    const copy: FilterPreset = {
      ...preset,
      version: PRESET_FORMAT_VERSION,
      id: `custom-${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: `${preset.name} copy`.slice(0, 100),
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };
    setCustomPresets((prev) => {
      const updated = [...prev, copy];
      sendMessage("VISION_SIMULATOR_SAVE_PRESETS", { presets: updated });
      return updated;
    });
    notifyInFigma(`Added "${copy.name}" to your presets`);
  };

  /** Rename a custom preset */
  const handleRenamePreset = (presetId: string, name: string) => {
    setCustomPresets((prev) => {
      const updated = prev.map((p) =>
        p.id === presetId ? { ...p, name, updatedAt: Date.now() } : p
      );
      sendMessage("VISION_SIMULATOR_SAVE_PRESETS", { presets: updated });
      return updated;
    });
    if (selectedPreset?.id === presetId) {
      setSelectedPreset({ ...selectedPreset, name });
    }
  };

  /**
   * Handle single preset export
   */
  const handleExportPreset = (preset: FilterPreset) => {
    const dataStr = JSON.stringify([preset], null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${preset.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Add the current view to the Figma canvas. The preview is downscaled, so
   * this filters the full-size export once with the same settings.
   */
  const handleExportToCanvas = async () => {
    const img = originalImageRef.current;
    if (!img || !hasPreview) return;

    const configs = stackConfigs;
    setExporting(true);
    setError(null);

    // Let "Adding to Figma..." show before the (blocking) full-size filter runs
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const full = getImagePixels(img);
      const filtered = renderStack(
        full.data,
        full.width,
        full.height,
        configs,
        pixelsPerDesignPixelRef.current
      );

      const canvas = document.createElement("canvas");
      canvas.width = full.width;
      canvas.height = full.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas isn't available");
      ctx.putImageData(
        new ImageData(filtered as any, full.width, full.height),
        0,
        0
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });

      // Convert blob to Uint8Array
      const arrayBuffer = await blob.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      // Figma sizes the frame from the image itself (image size / export scale)
      sendMessage("VISION_SIMULATOR_EXPORT_TO_CANVAS", {
        imageData,
        label: stackLabel || "Vision Simulation",
        filter: stack.length === 1 ? stack[0].config.type : "original",
      });
    } catch (err) {
      console.error("Failed to export to canvas:", err);
      setError("Failed to export to canvas");
      setExporting(false);
    }
  };

  // Simulations that can be added to the Vision Lab stack
  const filterOptions = [
    ...COLOR_BLIND_FILTERS.map((filter) => ({
      value: filter,
      label: FILTER_METADATA[filter].name,
      groupLabel: "Color Blind",
      showIcon: true,
    })),
    ...VISUAL_FIELD_FILTERS.map((filter) => ({
      value: filter,
      label: FILTER_METADATA[filter].name,
      groupLabel: "Visual Field Defects",
      showIcon: true,
    })),
    ...OTHER_FILTERS.map((filter) => ({
      value: filter,
      label: FILTER_METADATA[filter].name,
      groupLabel: "Other",
      showIcon: true,
    })),
  ];

  return (
    <div className="main-view">
      {/* Tabs (ARIA tabs pattern: arrow keys switch, one tab stop) */}
      <div
        className="main-view__tabs"
        role="tablist"
        aria-label="Simulation mode"
        onKeyDown={handleTabKeyDown}
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={`main-view__tab ${
                selected ? "main-view__tab--active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        className="main-view__content"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {/* Quick simulation tab */}
        {activeTab === "generate" && (
          <div className="main-view__generate">
            <p className="main-view__generate-note">
              <strong>-opia</strong>: can't see that color at all ·{" "}
              <strong>-omaly</strong>: sees it weakly
            </p>

            {QUICK_SIMULATION_SECTIONS.map((section) => (
              <div className="main-view__section" key={section.title}>
                <h3 className="main-view__section-title">
                  {section.title}
                  {section.badge && (
                    <span className="main-view__badge">{section.badge}</span>
                  )}
                </h3>
                <div className="main-view__filters">
                  {section.filters.map((filter) => (
                    <button
                      key={filter}
                      className={`main-view__filter-card ${
                        generatingFilter === filter
                          ? "main-view__filter-card--generating"
                          : ""
                      }`}
                      onClick={() => handleFilterClick(filter)}
                      disabled={isGenerating}
                      title={FILTER_METADATA[filter].description}
                    >
                      <span className="main-view__filter-label">
                        <FilterIcon filterId={filter} size="tiny" decorative />
                        {FILTER_METADATA[filter].name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === "simulation" && (
          <div
            className={`main-view__simulation ${
              hasPreview && stack.length > 0
                ? "main-view__simulation--with-bar"
                : ""
            }`}
          >
            {/* Start from a preset (loads an editable copy) */}
            <PresetSelector
              label="Start from"
              presets={allPresets}
              selectedPreset={selectedPreset}
              onSelectPreset={handleStartFrom}
              onManagePresets={() => setShowPresetManager(true)}
            />

            {/* Simulations, applied top to bottom */}
            <div className="main-view__stack">
              <div className="main-view__control-label">Simulations</div>
              <SimulationStack
                entries={stack}
                expandedId={expandedId}
                onToggle={(id) =>
                  setExpandedId((current) => (current === id ? null : id))
                }
                onChange={(id, config) =>
                  editStack((entries) =>
                    entries.map((e) => (e.id === id ? { ...e, config } : e))
                  )
                }
                onMove={handleMoveSimulation}
                onRemove={handleRemoveSimulation}
                onAdd={handleAddSimulation}
                addOptions={filterOptions}
              />

              {stack.length > 0 &&
                (savingPresetName === null ? (
                  <div className="main-view__stack-footer">
                    <span className="main-view__stack-status">
                      {selectedPreset
                        ? `${selectedPreset.name}${stackEdited ? " · edited" : ""}`
                        : `${stack.length} simulation${stack.length === 1 ? "" : "s"}`}
                    </span>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() =>
                        setSavingPresetName(
                          selectedPreset
                            ? `${selectedPreset.name} (edited)`
                            : "My preset"
                        )
                      }
                    >
                      Save as preset
                    </Button>
                  </div>
                ) : (
                  <div
                    className="main-view__save-preset"
                    role="group"
                    aria-label="Save as preset"
                  >
                    <input
                      className="main-view__save-preset-input"
                      value={savingPresetName}
                      onChange={(e) => setSavingPresetName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSavePreset();
                        } else if (e.key === "Escape") {
                          setSavingPresetName(null);
                        }
                      }}
                      maxLength={100}
                      aria-label="Preset name"
                      autoFocus
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      className="main-view__save-preset-btn main-view__save-preset-btn--primary"
                      disabled={!savingPresetName.trim()}
                      onClick={handleSavePreset}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="main-view__save-preset-btn"
                      onClick={() => setSavingPresetName(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
            </div>

            {/* Preview Area */}
            <div className="main-view__preview">
              {/* Zoom Controls */}
              {hasPreview && (
                <div className="main-view__zoom-controls">
                  <button
                    className="main-view__zoom-btn"
                    onClick={() => zoomTo(zoom - 0.25)}
                    disabled={zoom <= 0.25}
                    title="Zoom out"
                    aria-label="Zoom out"
                  >
                    <FaMinus size={12} />
                  </button>
                  <span className="main-view__zoom-value">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    className="main-view__zoom-btn"
                    onClick={() => zoomTo(zoom + 0.25)}
                    disabled={zoom >= 4}
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    <FaPlus size={12} />
                  </button>
                  <button
                    className="main-view__zoom-fit-btn"
                    onClick={() => zoomTo(1)}
                    title="Fit to view (100%)"
                    aria-label="Fit to view"
                  >
                    <GoScreenFull size={12} />
                  </button>
                </div>
              )}

              {/* Scroll area: zoom happens inside the fixed-size frame;
                  drag (grab hand) or scroll to move around */}
              <div
                ref={viewportRef}
                className={`main-view__preview-viewport ${
                  canPan ? "main-view__preview-viewport--pannable" : ""
                } ${panning ? "main-view__preview-viewport--panning" : ""}`}
                tabIndex={hasPreview ? 0 : -1}
                aria-label={
                  hasPreview
                    ? "Preview. When zoomed in, drag or use the arrow keys to move around; + and − zoom, 0 fits."
                    : undefined
                }
                onPointerDown={handlePanStart}
                onPointerMove={handlePanMove}
                onPointerUp={handlePanEnd}
                onPointerCancel={handlePanEnd}
                onKeyDown={handlePreviewKeyDown}
              >
              <div className="main-view__preview-content">
                {!hasPreview && !loading && (
                  <div className="main-view__preview-empty">
                    <p>Select a node to view simulation</p>
                  </div>
                )}

                {loading && (
                  <div className="main-view__preview-loading">
                    Loading...
                  </div>
                )}

                {/* Always mounted so the redraw effect has a canvas to draw
                    into; hidden until a design is loaded */}
                <div
                  className="main-view__preview-image-container"
                  style={{ display: hasPreview ? undefined : "none" }}
                >
                  {/* Display size from fitScale × zoom (see above) */}
                  <canvas
                    ref={previewCanvasRef}
                    className="main-view__preview-image"
                    style={{ width: displayWidth, height: displayHeight }}
                    draggable={false}
                    role="img"
                    aria-label={`Preview: ${stackLabel || "Original"}`}
                  />
                </div>

                {error && (
                  <div className="main-view__error">{error}</div>
                )}
              </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add all simulations - Fixed at bottom of Quick simulation */}
      {activeTab === "generate" && (
        <div className="main-view__export-button-container">
          <Button
            variant="primary"
            size="medium"
            onClick={handleAddAllSimulations}
            disabled={isGenerating}
          >
            {generateProgress
              ? `Adding ${generateProgress.done + 1} of ${generateProgress.total}…`
              : "Add all simulations"}
          </Button>
        </div>
      )}

      {/* Export to Canvas Button - Fixed at bottom, above bottom section */}
      {activeTab === "simulation" &&
        hasPreview &&
        stack.length > 0 && (
          <div className="main-view__export-button-container">
            <Button
              variant="primary"
              size="medium"
              onClick={handleExportToCanvas}
              disabled={exporting}
            >
              {exporting ? "Adding to Figma..." : "Add current view to Figma"}
            </Button>
          </div>
        )}

      {/* Preset Manager Modal */}
      {showPresetManager && (
        <PresetManager
          presets={allPresets}
          onClose={() => setShowPresetManager(false)}
          onDeletePreset={handleDeletePreset}
          onImportPresets={handleImportPresets}
          onExportPreset={handleExportPreset}
          onDuplicatePreset={handleDuplicatePreset}
          onRenamePreset={handleRenamePreset}
        />
      )}
    </div>
  );
};
