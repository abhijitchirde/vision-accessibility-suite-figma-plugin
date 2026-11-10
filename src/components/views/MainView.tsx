import React, { useState, useEffect, useRef } from "react";
import "./MainView.css";
import { Icon } from "../ui/Icon/Icon";
import { Button } from "../ui/Button/Button";
import { FilterIcon } from "../ui/Filter/FilterIcon";
import { SeveritySlider } from "../ui/Filter/SeveritySlider";
import { RadiusSlider } from "../ui/Filter/RadiusSlider";
import { PresetSelector } from "../ui/Presets/PresetSelector";
import { PresetManager } from "../ui/Presets/PresetManager";
import { FilterParameterSlider } from "../ui/Filter/FilterParameterSlider";
import { FilterDropdown } from "../ui/Filter/FilterDropdown";
import {
  useFigmaMessage,
  waitForPluginMessage,
} from "../../hooks/useFigmaMessage";
import { FaPlus } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";
import { GoScreenFull } from "react-icons/go";
import {
  SimulationType,
  VisionSimulatorState,
  ColorBlindnessType,
  VisualFieldDefectType,
  CentralVisionLossConfig,
  PeripheralVisionLossConfig,
  FilterPreset,
} from "../../utils/vision-simulator.types";
import {
  FILTER_METADATA,
  COLOR_BLIND_FILTERS,
  VISUAL_FIELD_FILTERS,
  OTHER_FILTERS,
  DEFAULT_ZOOM,
  COLOR_BLIND_FILTERS as ALL_COLOR_BLIND_FILTERS,
  DEFAULT_CENTRAL_VISION_LOSS_CONFIG,
  DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG,
  DEFAULT_PRESETS,
  DEFAULT_BLUR_CONFIG,
  DEFAULT_GHOSTING_CONFIG,
  IMAGE_EXPORT_SETTINGS,
} from "../../utils/vision-simulator.constants";
import {
  applyColorBlindness,
  applyBlur,
  applyGhosting,
  applyYellowing,
  applyContrastLoss,
  applyBrightLight,
  applyCentralVisionLoss,
  applyPeripheralVisionLoss,
  applyFilterPreset,
  scaleBlurRadius,
} from "../../utils/image-utils";

type Tab = "generate" | "simulation";

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
 * Pixel-based settings (blur radius, ghosting offset, ...) are tuned for a
 * 2x export. Very large designs are exported at a lower scale to stay under
 * Figma's image size limit; this is the factor to scale those settings by.
 */
function exportPixelFactor(exportScale: number | undefined): number {
  return exportScale ? exportScale / IMAGE_EXPORT_SETTINGS.constraint.value : 1;
}

/**
 * Apply one Quick simulation filter, with its default settings, and return
 * the result as PNG bytes. `pixelScale` scales pixel-based settings (see
 * exportPixelFactor).
 */
async function renderQuickSimulationPng(
  img: HTMLImageElement,
  filter: SimulationType,
  pixelScale: number = 1
): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available");

  ctx.drawImage(img, 0, 0);
  const { width, height } = canvas;
  const source = ctx.getImageData(0, 0, width, height).data;
  let filtered: Uint8ClampedArray = source;

  if (COLOR_BLIND_FILTERS.includes(filter)) {
    // Type-appropriate default severity (complete = 1.0, anomalies = 0.6)
    filtered = applyColorBlindness(source, filter as ColorBlindnessType);
  } else if (filter === "blurred") {
    filtered = applyBlur(source, width, height, {
      ...DEFAULT_BLUR_CONFIG,
      radius: scaleBlurRadius(DEFAULT_BLUR_CONFIG.radius, pixelScale),
    });
  } else if (filter === "ghosting") {
    const { offset } = DEFAULT_GHOSTING_CONFIG;
    filtered = applyGhosting(source, width, height, {
      ...DEFAULT_GHOSTING_CONFIG,
      offset: {
        x: Math.round(offset.x * pixelScale),
        y: Math.round(offset.y * pixelScale),
      },
    });
  } else if (filter === "yellowing") {
    filtered = applyYellowing(source);
  } else if (filter === "loss-of-contrast") {
    filtered = applyContrastLoss(source);
  } else if (filter === "bright-light") {
    filtered = applyBrightLight(source);
  } else if (filter === "central-vision-loss") {
    // Scale the radius with the image so the effect looks the same at any size
    // (default radii are tuned for a 500px image)
    const imageSize = Math.min(width, height);
    filtered = applyCentralVisionLoss(
      source,
      width,
      height,
      {
        radius: (DEFAULT_CENTRAL_VISION_LOSS_CONFIG.radius / 500) * imageSize,
        severity: DEFAULT_CENTRAL_VISION_LOSS_CONFIG.severity,
      },
      pixelScale
    );
  } else if (filter === "peripheral-vision-loss") {
    // Same scaling as central vision loss
    const imageSize = Math.min(width, height);
    filtered = applyPeripheralVisionLoss(
      source,
      width,
      height,
      {
        tunnelRadius:
          (DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG.tunnelRadius / 500) *
          imageSize,
        severity: DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG.severity,
      },
      pixelScale
    );
  }

  ctx.putImageData(new ImageData(filtered as any, width, height), 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Couldn't encode the filtered image");
  return new Uint8Array(await blob.arrayBuffer());
}

/** Everything Vision Lab needs to render one view */
interface VisionLabSettings {
  filter: SimulationType;
  preset: FilterPreset | null;
  severity: number;
  /** Visual field radius as a fraction of the image's smaller side */
  radius: number;
  blurRadius: number;
  blurIterations: number;
  ghostingOffsetX: number;
  ghostingOffsetY: number;
  ghostingOpacity: number;
  yellowingIntensity: number;
  yellowingTemperature: number;
  contrastReduction: number;
  brightLightIntensity: number;
  brightLightWashout: number;
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

/**
 * Apply the Vision Lab filter or preset. `scale` is the image size relative
 * to the full export; pixel-based settings are scaled by it so the
 * downscaled preview matches what "Add current view to Figma" produces.
 * Returns the input unchanged for "original" with no preset.
 */
function renderVisionLab(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  s: VisionLabSettings,
  scale: number
): Uint8ClampedArray {
  if (s.preset) {
    return applyFilterPreset(source, width, height, s.preset, scale);
  }

  const filter = s.filter;
  if (filter === "original") return source;

  if (COLOR_BLIND_FILTERS.includes(filter)) {
    return applyColorBlindness(source, filter as ColorBlindnessType, s.severity);
  }

  switch (filter) {
    case "blurred":
      return applyBlur(source, width, height, {
        radius: scaleBlurRadius(s.blurRadius, scale),
        iterations: s.blurIterations,
      });
    case "ghosting":
      return applyGhosting(source, width, height, {
        offset: {
          x: Math.round(s.ghostingOffsetX * scale),
          y: Math.round(s.ghostingOffsetY * scale),
        },
        opacity: s.ghostingOpacity,
      });
    case "yellowing":
      return applyYellowing(source, {
        intensity: s.yellowingIntensity,
        temperature: s.yellowingTemperature,
      });
    case "loss-of-contrast":
      return applyContrastLoss(source, { reduction: s.contrastReduction });
    case "bright-light":
      return applyBrightLight(source, {
        intensity: s.brightLightIntensity,
        washout: s.brightLightWashout,
      });
    case "central-vision-loss":
      return applyCentralVisionLoss(
        source,
        width,
        height,
        { radius: s.radius * Math.min(width, height), severity: s.severity },
        scale
      );
    case "peripheral-vision-loss":
      return applyPeripheralVisionLoss(
        source,
        width,
        height,
        {
          tunnelRadius: s.radius * Math.min(width, height),
          severity: s.severity,
        },
        scale
      );
    default:
      return source;
  }
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

  // Simulation mode state
  const [currentFilter, setCurrentFilter] =
    useState<SimulationType>("original");
  const [currentSeverity, setCurrentSeverity] = useState<number>(1.0); // Default to complete (100%)
  const [currentRadius, setCurrentRadius] = useState<number>(0.3); // Default radius as percentage (30% of image dimension)
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  // True when a design is loaded into the Vision Lab preview
  const [hasPreview, setHasPreview] = useState(false);
  // Bumped each time a new design is loaded, to trigger a redraw
  const [imageVersion, setImageVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Other filter parameters
  const [blurRadius, setBlurRadius] = useState<number>(8);
  const [blurIterations, setBlurIterations] = useState<number>(2);
  const [ghostingOffsetX, setGhostingOffsetX] = useState<number>(10);
  const [ghostingOffsetY, setGhostingOffsetY] = useState<number>(5);
  const [ghostingOpacity, setGhostingOpacity] = useState<number>(0.5);
  const [yellowingIntensity, setYellowingIntensity] = useState<number>(0.6);
  const [yellowingTemperature, setYellowingTemperature] =
    useState<number>(2500);
  const [contrastReduction, setContrastReduction] = useState<number>(0.5);
  const [brightLightIntensity, setBrightLightIntensity] = useState<number>(0.7);
  const [brightLightWashout, setBrightLightWashout] = useState<number>(0.4);

  // Preset state
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(
    null
  );
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [showPresetManager, setShowPresetManager] = useState(false);

  // Parameters panel state
  const [showParameters, setShowParameters] = useState(false);

  // Vision Lab preview
  const previewCanvasRef = useRef<HTMLCanvasElement>(null); // visible preview
  const originalImageRef = useRef<HTMLImageElement | null>(null); // full-size export
  const previewSourceRef = useRef<ImagePixels | null>(null); // downscaled pixels
  const renderFrameRef = useRef<number | null>(null); // pending redraw
  const exportPixelFactorRef = useRef(1); // see exportPixelFactor

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
        setSelectedPreset(preset);
        setPendingPresetId(null);
      }
    }
  }, [pendingPresetId, allPresets]);

  /**
   * Check if a filter is a color blindness type (supports severity adjustment)
   */
  const isColorBlindnessFilter = (filter: SimulationType): boolean => {
    return ALL_COLOR_BLIND_FILTERS.includes(filter);
  };

  /**
   * Check if a filter is a visual field defect type (supports radius and severity)
   */
  const isVisualFieldDefect = (filter: SimulationType): boolean => {
    return VISUAL_FIELD_FILTERS.includes(filter);
  };

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
          exportPixelFactor(exported.exportScale)
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

  // Current Vision Lab settings (used by the preview and by "Add to Figma")
  const visionLabSettings: VisionLabSettings = {
    filter: currentFilter,
    preset: selectedPreset,
    severity: currentSeverity,
    radius: currentRadius,
    blurRadius,
    blurIterations,
    ghostingOffsetX,
    ghostingOffsetY,
    ghostingOpacity,
    yellowingIntensity,
    yellowingTemperature,
    contrastReduction,
    brightLightIntensity,
    brightLightWashout,
  };

  // Redraw the preview when the design or any setting changes. Changes are
  // coalesced to at most one redraw per animation frame, so dragging a
  // slider doesn't queue up work. The downscaled copy is drawn straight into
  // the visible canvas (no PNG encoding).
  useEffect(() => {
    if (activeTab !== "simulation" || !previewSourceRef.current) return;

    const settings = visionLabSettings;
    if (renderFrameRef.current !== null) {
      cancelAnimationFrame(renderFrameRef.current);
    }
    renderFrameRef.current = requestAnimationFrame(() => {
      renderFrameRef.current = null;
      const source = previewSourceRef.current;
      const canvas = previewCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!source || !canvas || !ctx) return;

      const filtered = renderVisionLab(
        source.data,
        source.width,
        source.height,
        settings,
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
    // visionLabSettings is rebuilt every render; list its parts instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    imageVersion,
    activeTab,
    currentFilter,
    currentSeverity,
    currentRadius,
    selectedPreset,
    blurRadius,
    blurIterations,
    ghostingOffsetX,
    ghostingOffsetY,
    ghostingOpacity,
    yellowingIntensity,
    yellowingTemperature,
    contrastReduction,
    brightLightIntensity,
    brightLightWashout,
  ]);

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
      exportPixelFactorRef.current = exportPixelFactor(exportScale);
      const preview = getImagePixels(img, MAX_PREVIEW_SIDE);
      // Pixel settings scale with both the preview downscale and the export scale
      preview.scale *= exportPixelFactorRef.current;
      previewSourceRef.current = preview;
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

    const settings = visionLabSettings;
    setExporting(true);
    setError(null);

    // Let "Adding to Figma..." show before the (blocking) full-size filter runs
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const full = getImagePixels(img);
      const filtered = renderVisionLab(
        full.data,
        full.width,
        full.height,
        settings,
        exportPixelFactorRef.current
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

      // Determine the label for the frame
      let label = "";
      if (selectedPreset) {
        label = selectedPreset.name;
      } else if (currentFilter !== "original") {
        label = FILTER_METADATA[currentFilter].name;
      }

      // Figma sizes the frame from the image itself (image size / export scale)
      sendMessage("VISION_SIMULATOR_EXPORT_TO_CANVAS", {
        imageData,
        label,
        filter: selectedPreset ? "original" : currentFilter,
      });
    } catch (err) {
      console.error("Failed to export to canvas:", err);
      setError("Failed to export to canvas");
      setExporting(false);
    }
  };

  // Prepare filter options for dropdown
  const filterOptions = [
    {
      value: "original" as SimulationType,
      label: "Original",
      groupLabel: "None",
      showIcon: false,
    },
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
      {/* Tabs */}
      <div className="main-view__tabs">
        <button
          className={`main-view__tab ${
            activeTab === "generate"
              ? "main-view__tab--active"
              : ""
          }`}
          onClick={() => setActiveTab("generate")}
        >
          Quick simulation
        </button>
        <button
          className={`main-view__tab ${
            activeTab === "simulation"
              ? "main-view__tab--active"
              : ""
          }`}
          onClick={() => setActiveTab("simulation")}
        >
          Vision Lab
        </button>
      </div>

      {/* Tab Content */}
      <div className="main-view__content">
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
          <div className="main-view__simulation">
            {/* Preset Selector */}
            <PresetSelector
              presets={allPresets}
              selectedPreset={selectedPreset}
              onSelectPreset={(preset) => {
                setSelectedPreset(preset);
                // Save selected preset ID to storage
                sendMessage("VISION_SIMULATOR_SAVE_SELECTED_PRESET", {
                  presetId: preset?.id || null,
                });
                // When a preset is selected, reset to "original" single filter
                if (preset) {
                  setCurrentFilter("original");
                }
              }}
              onManagePresets={() => setShowPresetManager(true)}
            />

            {/* Controls - Always show simulation dropdown */}
            <div className="main-view__controls-row">
              {/* Simulation Dropdown */}
              <div className="main-view__control main-view__control--simulation">
                <label className="main-view__control-label">
                  Simulation
                </label>
                <FilterDropdown
                  value={currentFilter}
                  onChange={(value) => {
                    // If a preset was selected, reset it when a simulation is chosen
                    if (selectedPreset) {
                      setSelectedPreset(null);
                      // Save cleared preset to storage
                      sendMessage("VISION_SIMULATOR_SAVE_SELECTED_PRESET", {
                        presetId: null,
                      });
                    }
                    setCurrentFilter(value);
                    // Set appropriate default severity based on filter type
                    if (
                      value === "protanomaly" ||
                      value === "deuteranomaly" ||
                      value === "tritanomaly"
                    ) {
                      // Partial color blindness defaults to 60%
                      setCurrentSeverity(0.6);
                    } else if (
                      isColorBlindnessFilter(value) ||
                      isVisualFieldDefect(value)
                    ) {
                      // Complete color blindness and visual field defects default to 100%
                      setCurrentSeverity(1.0);
                    }
                    // Reset radius to default (30%) when switching to visual field defects
                    if (isVisualFieldDefect(value)) {
                      setCurrentRadius(0.3);
                    }
                    // Reset parameters panel visibility when changing filter
                    setShowParameters(false);
                  }}
                  options={filterOptions}
                  placeholder="preset is applied"
                  showPlaceholder={!!selectedPreset}
                />
              </div>

              {/* Parameters Button - Only show if no preset is selected */}
              {!selectedPreset && (
                <button
                  className="main-view__params-btn"
                  onClick={() => setShowParameters(!showParameters)}
                  disabled={currentFilter === "original"}
                  title="Change parameters"
                >
                  <Icon name="parameters" size={16} />
                </button>
              )}
            </div>

            {/* Parameters Panel - Collapsible */}
            {!selectedPreset &&
              showParameters &&
              currentFilter !== "original" && (
                <div className="main-view__parameters">
                  {/* Severity Slider - only show for color blindness filters */}
                  {isColorBlindnessFilter(currentFilter) && (
                    <SeveritySlider
                      value={currentSeverity}
                      onChange={setCurrentSeverity}
                      label="Severity"
                      showPercentage={true}
                    />
                  )}

                  {/* Visual Field Defect Controls */}
                  {isVisualFieldDefect(currentFilter) && (
                    <>
                      <RadiusSlider
                        value={Math.round(currentRadius * 100)}
                        onChange={(value) => setCurrentRadius(value / 100)}
                        label={
                          currentFilter === "central-vision-loss"
                            ? "Affected Area Radius"
                            : "Clear Center Radius"
                        }
                        min={10}
                        max={90}
                        showValue={true}
                        unit="%"
                      />
                      <div style={{ marginTop: "16px" }}>
                        <SeveritySlider
                          value={currentSeverity}
                          onChange={setCurrentSeverity}
                          label="Severity"
                          showPercentage={true}
                        />
                      </div>
                    </>
                  )}

                  {/* Blurred Filter Controls */}
                  {currentFilter === "blurred" && (
                    <>
                      <FilterParameterSlider
                        label="Blur Radius"
                        value={blurRadius}
                        onChange={setBlurRadius}
                        min={1}
                        max={30}
                        step={1}
                        unit="px"
                        description="Blur strength (higher = more blur)"
                      />
                      <div style={{ marginTop: "16px" }}>
                        <FilterParameterSlider
                          label="Iterations"
                          value={blurIterations}
                          onChange={setBlurIterations}
                          min={1}
                          max={5}
                          step={1}
                          description="Number of blur passes (higher = smoother)"
                        />
                      </div>
                    </>
                  )}

                  {/* Ghosting Filter Controls */}
                  {currentFilter === "ghosting" && (
                    <>
                      <FilterParameterSlider
                        label="Horizontal Offset"
                        value={ghostingOffsetX}
                        onChange={setGhostingOffsetX}
                        min={0}
                        max={30}
                        step={1}
                        unit="px"
                        description="Ghost image horizontal displacement"
                      />
                      <FilterParameterSlider
                        label="Vertical Offset"
                        value={ghostingOffsetY}
                        onChange={setGhostingOffsetY}
                        min={0}
                        max={30}
                        step={1}
                        unit="px"
                        description="Ghost image vertical displacement"
                      />
                      <FilterParameterSlider
                        label="Ghost Opacity"
                        value={ghostingOpacity}
                        onChange={setGhostingOpacity}
                        min={0}
                        max={1}
                        step={0.05}
                        description="Ghost image transparency"
                      />
                    </>
                  )}

                  {/* Yellowing Filter Controls */}
                  {currentFilter === "yellowing" && (
                    <>
                      <FilterParameterSlider
                        label="Intensity"
                        value={yellowingIntensity}
                        onChange={setYellowingIntensity}
                        min={0}
                        max={1}
                        step={0.05}
                        description="Yellow tint strength"
                      />
                      <FilterParameterSlider
                        label="Temperature"
                        value={yellowingTemperature}
                        onChange={setYellowingTemperature}
                        min={1000}
                        max={4000}
                        step={100}
                        unit="K"
                        description="Color temperature (warmer = more yellow)"
                      />
                    </>
                  )}

                  {/* Loss of Contrast Filter Controls */}
                  {currentFilter === "loss-of-contrast" && (
                    <FilterParameterSlider
                      label="Contrast Reduction"
                      value={contrastReduction}
                      onChange={setContrastReduction}
                      min={0}
                      max={1}
                      step={0.05}
                      description="Amount of contrast loss (higher = less contrast)"
                    />
                  )}

                  {/* Bright Light Filter Controls */}
                  {currentFilter === "bright-light" && (
                    <>
                      <FilterParameterSlider
                        label="Brightness Intensity"
                        value={brightLightIntensity}
                        onChange={setBrightLightIntensity}
                        min={0}
                        max={1}
                        step={0.05}
                        description="Brightness increase amount"
                      />
                      <FilterParameterSlider
                        label="Color Washout"
                        value={brightLightWashout}
                        onChange={setBrightLightWashout}
                        min={0}
                        max={1}
                        step={0.05}
                        description="Color desaturation amount"
                      />
                    </>
                  )}
                </div>
              )}

            {/* Preview Area */}
            <div className="main-view__preview">
              {/* Zoom Controls */}
              {hasPreview && (
                <div className="main-view__zoom-controls">
                  <button
                    className="main-view__zoom-btn"
                    onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                    disabled={zoom <= 0.25}
                    title="Zoom out"
                  >
                    <FaMinus size={12} />
                  </button>
                  <span className="main-view__zoom-value">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    className="main-view__zoom-btn"
                    onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                    disabled={zoom >= 4}
                    title="Zoom in"
                  >
                    <FaPlus size={12} />
                  </button>
                  <button
                    className="main-view__zoom-fit-btn"
                    onClick={() => setZoom(1)}
                    title="Fit to view (100%)"
                  >
                    <GoScreenFull size={12} />
                  </button>
                </div>
              )}

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
                  style={{
                    transform: `scale(${zoom})`,
                    display: hasPreview ? undefined : "none",
                  }}
                >
                  <canvas
                    ref={previewCanvasRef}
                    className="main-view__preview-image"
                    role="img"
                    aria-label={`Preview: ${
                      selectedPreset
                        ? selectedPreset.name
                        : FILTER_METADATA[currentFilter]?.name ?? "Original"
                    }`}
                  />
                </div>

                {error && (
                  <div className="main-view__error">{error}</div>
                )}
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
        (currentFilter !== "original" || selectedPreset !== null) && (
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
        />
      )}
    </div>
  );
};
