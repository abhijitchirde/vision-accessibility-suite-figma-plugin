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
  ZOOM_LEVELS,
  DEFAULT_ZOOM,
  COLOR_BLIND_FILTERS as ALL_COLOR_BLIND_FILTERS,
  DEFAULT_CENTRAL_VISION_LOSS_CONFIG,
  DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG,
  DEFAULT_PRESETS,
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
} from "../../utils/image-utils";

type Tab = "generate" | "simulation";

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
 * the result as PNG bytes.
 */
async function renderQuickSimulationPng(
  img: HTMLImageElement,
  filter: SimulationType
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
    filtered = applyBlur(source, width, height);
  } else if (filter === "ghosting") {
    filtered = applyGhosting(source, width, height);
  } else if (filter === "yellowing") {
    filtered = applyYellowing(source);
  } else if (filter === "loss-of-contrast") {
    filtered = applyContrastLoss(source);
  } else if (filter === "bright-light") {
    filtered = applyBrightLight(source);
  } else if (filter === "central-vision-loss") {
    // Scale the radius with the image so the effect looks the same at any size
    const imageSize = Math.min(width, height);
    filtered = applyCentralVisionLoss(source, width, height, {
      radius: (DEFAULT_CENTRAL_VISION_LOSS_CONFIG.radius / 500) * imageSize,
      severity: DEFAULT_CENTRAL_VISION_LOSS_CONFIG.severity,
    });
  } else if (filter === "peripheral-vision-loss") {
    filtered = applyPeripheralVisionLoss(
      source,
      width,
      height,
      DEFAULT_PERIPHERAL_VISION_LOSS_CONFIG
    );
  }

  ctx.putImageData(new ImageData(filtered as any, width, height), 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Couldn't encode the filtered image");
  return new Uint8Array(await blob.arrayBuffer());
}

export const MainView: React.FC<{}> = ({}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  // Generate mode state
  const [generatingFilter, setGeneratingFilter] =
    useState<SimulationType | null>(null);

  // Simulation mode state
  const [currentFilter, setCurrentFilter] =
    useState<SimulationType>("original");
  const [currentSeverity, setCurrentSeverity] = useState<number>(1.0); // Default to complete (100%)
  const [currentRadius, setCurrentRadius] = useState<number>(0.3); // Default radius as percentage (30% of image dimension)
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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

  // Canvas refs for image processing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Store original node dimensions (not the exported image dimensions which may be 2x)
  const [originalNodeWidth, setOriginalNodeWidth] = useState<number | null>(
    null
  );
  const [originalNodeHeight, setOriginalNodeHeight] = useState<number | null>(
    null
  );

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
        // console.log("[UI] Loaded presets:", msg.presets);
        setCustomPresets(msg.presets || []);
      } else if (msg?.type === "VISION_SIMULATOR_SELECTED_PRESET_LOADED") {
        // console.log("[UI] Loaded selected preset ID:", msg.presetId);
        if (msg.presetId) {
          setPendingPresetId(msg.presetId);
        }
      } else if (msg?.type === "VISION_SIMULATOR_PRESETS_SAVED") {
        if (msg.success) {
          // console.log(
          //   "[UI] ✓ Presets saved successfully to Figma storage:",
          //   msg.count,
          //   "presets"
          // );
        } else {
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
        // console.log("Restoring preset:", preset.name);
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
    exported: { imageData: Uint8Array }
  ) => {
    try {
      const img = await loadPngImage(exported.imageData);

      for (const filter of filters) {
        const png = await renderQuickSimulationPng(img, filter);

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
    } catch (err) {
      console.error("Quick simulation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to add simulation");
    } finally {
      setGeneratingFilter(null);
    }
  };

  // Listen for messages from plugin code
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === "VISION_SIMULATOR_GENERATE_RESULT") {
        // Only sent when generation can't start (no selection, export failed)
        if (!msg.success) {
          setGeneratingFilter(null);
          setError(msg.error || "Failed to generate simulation");
        }
      } else if (msg?.type === "VISION_SIMULATOR_PREVIEW_DATA") {
        if (msg.success && msg.data) {
          // Convert image data to canvas
          setError(null);
          loadImageForPreview(
            msg.data.imageData,
            msg.data.width,
            msg.data.height
          );
        } else if (msg.error === null) {
          // No selection, clear preview
          setPreviewImage(null);
          setOriginalNodeWidth(null);
          setOriginalNodeHeight(null);
          setError(null);
          setLoading(false);
        } else {
          // Actual error occurred
          setPreviewImage(null);
          setOriginalNodeWidth(null);
          setOriginalNodeHeight(null);
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

  // Apply filter when currentFilter, currentSeverity, currentRadius, or selectedPreset changes
  useEffect(() => {
    if (originalImageRef.current && activeTab === "simulation") {
      applyFilterToPreview(currentFilter);
    }
  }, [
    currentFilter,
    currentSeverity,
    currentRadius,
    selectedPreset,
    activeTab,
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
  ]); // Re-apply when any parameter changes

  /**
   * Load image data into canvas for preview
   */
  const loadImageForPreview = async (
    imageData: Uint8Array,
    width: number,
    height: number
  ) => {
    try {
      // Store original node dimensions (these are the actual node dimensions, not the exported image size)
      setOriginalNodeWidth(width);
      setOriginalNodeHeight(height);

      // Create blob from image data
      const blob = new Blob([imageData as any], { type: "image/png" });
      const url = URL.createObjectURL(blob);

      // Load image
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        applyFilterToPreview(currentFilter);
        setLoading(false);
        URL.revokeObjectURL(url); // Clean up
      };
      img.onerror = () => {
        setError("Failed to load image");
        setLoading(false);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error("Failed to load preview image:", err);
      setError("Failed to load preview");
      setLoading(false);
    }
  };

  /**
   * Apply the current filter or preset to the preview image
   */
  const applyFilterToPreview = (filter: SimulationType) => {
    const img = originalImageRef.current;
    const canvas = canvasRef.current;

    if (!img || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let filteredData: Uint8ClampedArray = imageData.data;

    // Check if a preset is selected
    if (selectedPreset) {
      // Apply preset (multiple filters in sequence)
      filteredData = applyFilterPreset(
        imageData.data,
        canvas.width,
        canvas.height,
        selectedPreset
      );
    } else if (filter !== "original") {
      // Apply single filter
      // Apply the appropriate filter
      if (
        filter === "protanopia" ||
        filter === "deuteranopia" ||
        filter === "tritanopia" ||
        filter === "achromatopsia" ||
        filter === "protanomaly" ||
        filter === "deuteranomaly" ||
        filter === "tritanomaly"
      ) {
        // Apply color blindness with current severity
        filteredData = applyColorBlindness(
          imageData.data,
          filter as ColorBlindnessType,
          currentSeverity
        );
      } else if (filter === "blurred") {
        filteredData = applyBlur(imageData.data, canvas.width, canvas.height, {
          radius: blurRadius,
          iterations: blurIterations,
        });
      } else if (filter === "ghosting") {
        filteredData = applyGhosting(
          imageData.data,
          canvas.width,
          canvas.height,
          {
            offset: { x: ghostingOffsetX, y: ghostingOffsetY },
            opacity: ghostingOpacity,
          }
        );
      } else if (filter === "yellowing") {
        filteredData = applyYellowing(imageData.data, {
          intensity: yellowingIntensity,
          temperature: yellowingTemperature,
        });
      } else if (filter === "loss-of-contrast") {
        filteredData = applyContrastLoss(imageData.data, {
          reduction: contrastReduction,
        });
      } else if (filter === "bright-light") {
        filteredData = applyBrightLight(imageData.data, {
          intensity: brightLightIntensity,
          washout: brightLightWashout,
        });
      } else if (filter === "central-vision-loss") {
        // Calculate pixel radius from percentage: use smaller dimension to ensure proportional effect
        const imageSize = Math.min(canvas.width, canvas.height);
        const pixelRadius = currentRadius * imageSize;
        filteredData = applyCentralVisionLoss(
          imageData.data,
          canvas.width,
          canvas.height,
          {
            radius: pixelRadius,
            severity: currentSeverity,
          }
        );
      } else if (filter === "peripheral-vision-loss") {
        // Calculate pixel radius from percentage: use smaller dimension to ensure proportional effect
        const imageSize = Math.min(canvas.width, canvas.height);
        const pixelRadius = currentRadius * imageSize;
        filteredData = applyPeripheralVisionLoss(
          imageData.data,
          canvas.width,
          canvas.height,
          {
            tunnelRadius: pixelRadius,
            severity: currentSeverity,
          }
        );
      }
    }

    // Update canvas with filtered data (only if not original and no errors)
    if (filter !== "original" || selectedPreset) {
      const newImageData = new ImageData(
        filteredData as any,
        canvas.width,
        canvas.height
      );
      ctx.putImageData(newImageData, 0, 0);
    }

    // Convert canvas to preview image
    setPreviewImage(canvas.toDataURL());
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
    // console.log("[UI] handleImportPresets called with:", importedPresets);
    // console.log("[UI] Current customPresets state:", customPresets);

    // Add imported presets to custom presets
    // Only modify ID if it already exists to avoid duplicates
    const existingIds = new Set(customPresets.map((p) => p.id));
    // console.log("[UI] Existing preset IDs:", Array.from(existingIds));

    const newPresets = importedPresets.map((preset) => {
      let finalId = preset.id;

      // If preset ID already exists, append timestamp to make it unique
      if (existingIds.has(preset.id)) {
        finalId = `${preset.id}-${Date.now()}`;
        // console.log(
        //   `[UI] Preset ID ${preset.id} already exists, using ${finalId}`
        // );
      }

      return {
        ...preset,
        id: finalId,
        isBuiltIn: false,
        createdAt: preset.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
    });

    // console.log("[UI] New presets to add:", newPresets);

    setCustomPresets((prev) => {
      // console.log("[UI] setCustomPresets updater - prev:", prev);
      const updated = [...prev, ...newPresets];
      // console.log("[UI] setCustomPresets updater - updated:", updated);
      // console.log(
      //   "[UI] About to send SAVE message with:",
      //   updated.length,
      //   "presets"
      // );

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
   * Export current preview to Figma canvas
   */
  const handleExportToCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !previewImage) return;

    // Use original node dimensions instead of canvas dimensions
    // Canvas dimensions may be 2x due to export scale, but we want the actual node size
    if (originalNodeWidth === null || originalNodeHeight === null) {
      setError("Original node dimensions not available");
      return;
    }

    setExporting(true);
    setError(null);

    try {
      // Convert canvas to blob
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
        {/* Generate Tab */}
        {activeTab === "generate" && (
          <div className="main-view__generate">
            {/* Red Deficiency Section */}
            <div className="main-view__section">
              <h3 className="main-view__section-title">
                Red deficiency (Protan)
              </h3>
              <div className="main-view__filters">
                <button
                  key="protanopia"
                  className={`main-view__filter-card ${
                    generatingFilter === "protanopia"
                      ? "main-view__filter-card--generating"
                      : ""
                  }`}
                  onClick={() => handleFilterClick("protanopia")}
                  disabled={generatingFilter !== null}
                >
                  <span className="main-view__filter-label">
                    <FilterIcon filterId="protanopia" size="tiny" />
                    Protanopia
                  </span>
                  <span className="main-view__filter-info">
                    Complete • ~1% males
                  </span>
                </button>
                <button
                  key="protanomaly"
                  className={`main-view__filter-card ${
                    generatingFilter === "protanomaly"
                      ? "main-view__filter-card--generating"
                      : ""
                  }`}
                  onClick={() => handleFilterClick("protanomaly")}
                  disabled={generatingFilter !== null}
                >
                  <span className="main-view__filter-label">
                    <FilterIcon filterId="protanomaly" size="tiny" />
                    Protanomaly
                  </span>
                  <span className="main-view__filter-info">
                    Partial • ~1% males
                  </span>
                </button>
              </div>
            </div>

            {/* Green Deficiency Section - MOST COMMON */}
            <div className="main-view__section">
              <h3 className="main-view__section-title">
                Green deficiency (Deutan)
                <span className="main-view__badge">
                  Most common
                </span>
              </h3>
              <div className="main-view__filters">
                <button
                  key="deuteranopia"
                  className={`main-view__filter-card ${
                    generatingFilter === "deuteranopia"
                      ? "main-view__filter-card--generating"
                      : ""
                  }`}
                  onClick={() => handleFilterClick("deuteranopia")}
                  disabled={generatingFilter !== null}
                >
                  <span className="main-view__filter-label">
                    <FilterIcon filterId="deuteranopia" size="tiny" />
                    Deuteranopia
                  </span>
                  <span className="main-view__filter-info">
                    Complete • ~1% males
                  </span>
                </button>
                <button
                  key="deuteranomaly"
                  className={`main-view__filter-card ${
                    generatingFilter === "deuteranomaly"
                      ? "main-view__filter-card--generating"
                      : ""
                  }`}
                  onClick={() => handleFilterClick("deuteranomaly")}
                  disabled={generatingFilter !== null}
                >
                  <span className="main-view__filter-label">
                    <FilterIcon filterId="deuteranomaly" size="tiny" />
                    Deuteranomaly
                  </span>
                  <span className="main-view__filter-info">
                    Partial • ~5-6% males
                  </span>
                </button>
              </div>
            </div>

            {/* Blue Deficiency Section */}
            <div className="main-view__section">
              <h3 className="main-view__section-title">
                Blue deficiency (Tritan)
              </h3>
              <div className="main-view__filters">
                <button
                  key="tritanopia"
                  className={`main-view__filter-card ${
                    generatingFilter === "tritanopia"
                      ? "main-view__filter-card--generating"
                      : ""
                  }`}
                  onClick={() => handleFilterClick("tritanopia")}
                  disabled={generatingFilter !== null}
                >
                  <span className="main-view__filter-label">
                    <FilterIcon filterId="tritanopia" size="tiny" />
                    Tritanopia
                  </span>
                  <span className="main-view__filter-info">
                    Complete • ~0.001%
                  </span>
                </button>
                <button
                  key="tritanomaly"
                  className={`main-view__filter-card ${
                    generatingFilter === "tritanomaly"
                      ? "main-view__filter-card--generating"
                      : ""
                  }`}
                  onClick={() => handleFilterClick("tritanomaly")}
                  disabled={generatingFilter !== null}
                >
                  <span className="main-view__filter-label">
                    <FilterIcon filterId="tritanomaly" size="tiny" />
                    Tritanomaly
                  </span>
                  <span className="main-view__filter-info">
                    Partial • ~0.01%
                  </span>
                </button>
              </div>
            </div>

            {/* Total Color Blindness Section */}
            <div className="main-view__section">
              <h3 className="main-view__section-title">
                Total color blindness
              </h3>
              <div className="main-view__filters">
                <button
                  key="achromatopsia"
                  className={`main-view__filter-card ${
                    generatingFilter === "achromatopsia"
                      ? "main-view__filter-card--generating"
                      : ""
                  }`}
                  onClick={() => handleFilterClick("achromatopsia")}
                  disabled={generatingFilter !== null}
                >
                  <span className="main-view__filter-label">
                    <FilterIcon filterId="achromatopsia" size="tiny" />
                    Achromatopsia
                  </span>
                  <span className="main-view__filter-info">
                    Grayscale • ~0.003%
                  </span>
                </button>
              </div>
            </div>

            {/* Visual Field Defects Section */}
            <div className="main-view__section">
              <h3 className="main-view__section-title">
                Visual field defects
              </h3>
              <div className="main-view__filters">
                <button
                  key="central-vision-loss"
                  className={`main-view__filter-card ${
                    generatingFilter === "central-vision-loss"
                      ? "main-view__filter-card--generating"
                      : ""
                  }`}
                  onClick={() => handleFilterClick("central-vision-loss")}
                  disabled={generatingFilter !== null}
                >
                  <span className="main-view__filter-label">
                    <FilterIcon filterId="central-vision-loss" size="tiny" />
                    Central Loss
                  </span>
                  <span className="main-view__filter-info">
                    Macular degeneration
                  </span>
                </button>
                <button
                  key="peripheral-vision-loss"
                  className={`main-view__filter-card ${
                    generatingFilter === "peripheral-vision-loss"
                      ? "main-view__filter-card--generating"
                      : ""
                  }`}
                  onClick={() => handleFilterClick("peripheral-vision-loss")}
                  disabled={generatingFilter !== null}
                >
                  <span className="main-view__filter-label">
                    <FilterIcon filterId="peripheral-vision-loss" size="tiny" />
                    Peripheral Loss
                  </span>
                  <span className="main-view__filter-info">
                    Glaucoma / Tunnel vision
                  </span>
                </button>
              </div>
            </div>

            {/* Other Section */}
            <div className="main-view__section">
              <h3 className="main-view__section-title">Other</h3>
              <div className="main-view__filters">
                {OTHER_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    className={`main-view__filter-card main-view__filter-card--compact ${
                      generatingFilter === filter
                        ? "main-view__filter-card--generating"
                        : ""
                    }`}
                    onClick={() => handleFilterClick(filter)}
                    disabled={generatingFilter !== null}
                  >
                    <span className="main-view__filter-label">
                      <FilterIcon filterId={filter} size="tiny" />
                      {FILTER_METADATA[filter].name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
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
                // console.log("Preset selected:", preset?.name || "none");
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
              {previewImage && (
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
                {!previewImage && !loading && (
                  <div className="main-view__preview-empty">
                    <p>Select a node to view simulation</p>
                  </div>
                )}

                {loading && (
                  <div className="main-view__preview-loading">
                    Loading...
                  </div>
                )}

                {previewImage && (
                  <div
                    className="main-view__preview-image-container"
                    style={{ transform: `scale(${zoom})` }}
                  >
                    <img
                      src={previewImage}
                      alt="Simulated preview"
                      className="main-view__preview-image"
                    />
                  </div>
                )}

                {error && (
                  <div className="main-view__error">{error}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export to Canvas Button - Fixed at bottom, above bottom section */}
      {activeTab === "simulation" &&
        previewImage &&
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

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

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
