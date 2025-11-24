import React, { useState, useEffect, useRef } from "react";
import "./VisionSimulatorPanel.css";
import { Icon } from "../../../../components/ui/Icon/Icon";
import { Button } from "../../../../components/ui/Button/Button";
import { FilterIcon } from "./FilterIcon";
import { useFigmaMessage } from "../../../../hooks/useFigmaMessage";
import {
  SimulationType,
  VisionSimulatorState,
} from "../vision-simulator.types";
import {
  FILTER_METADATA,
  COLOR_BLIND_FILTERS,
  OTHER_FILTERS,
  ZOOM_LEVELS,
  DEFAULT_ZOOM,
} from "../vision-simulator.constants";
import {
  applyColorBlindness,
  applyBlur,
  applyGhosting,
  applyYellowing,
  applyContrastLoss,
  applyBrightLight,
} from "../image-utils";

type Tab = "generate" | "simulation";

export const VisionSimulatorPanel: React.FC<{ onBack: () => void }> = ({
  onBack,
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  // Generate mode state
  const [generatingFilter, setGeneratingFilter] =
    useState<SimulationType | null>(null);

  // Simulation mode state
  const [currentFilter, setCurrentFilter] =
    useState<SimulationType>("original");
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas refs for image processing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const { sendMessage } = useFigmaMessage();

  /**
   * Process filter for generated frame (background processing)
   * Called when plugin sends VISION_SIMULATOR_PROCESS_FILTER message
   */
  const processFilterForGenerate = async (
    frameId: string,
    filter: SimulationType,
    imageData: { imageData: Uint8Array; width: number; height: number }
  ) => {
    try {
      // Create a temporary canvas for processing
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) {
        console.error("Failed to get 2d context");
        return;
      }

      // Load image
      const blob = new Blob([imageData.imageData as any], {
        type: "image/png",
      });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        // Set canvas size
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Apply filter
        if (filter !== "original") {
          const imgData = ctx.getImageData(
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
          );
          let filteredData: Uint8ClampedArray;

          if (
            filter === "protanopia" ||
            filter === "deuteranopia" ||
            filter === "tritanopia" ||
            filter === "achromatopsia"
          ) {
            filteredData = applyColorBlindness(imgData.data, filter);
          } else if (filter === "blurred") {
            filteredData = applyBlur(
              imgData.data,
              tempCanvas.width,
              tempCanvas.height
            );
          } else if (filter === "ghosting") {
            filteredData = applyGhosting(
              imgData.data,
              tempCanvas.width,
              tempCanvas.height
            );
          } else if (filter === "yellowing") {
            filteredData = applyYellowing(imgData.data);
          } else if (filter === "loss-of-contrast") {
            filteredData = applyContrastLoss(imgData.data);
          } else if (filter === "bright-light") {
            filteredData = applyBrightLight(imgData.data);
          } else {
            filteredData = imgData.data;
          }

          const newImageData = new ImageData(
            filteredData as any,
            tempCanvas.width,
            tempCanvas.height
          );
          ctx.putImageData(newImageData, 0, 0);
        }

        // Convert canvas to blob then to Uint8Array
        tempCanvas.toBlob(async (blob) => {
          if (blob) {
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Send filtered image back to plugin
            sendMessage("VISION_SIMULATOR_APPLY_FILTERED_IMAGE", {
              frameId,
              imageData: uint8Array,
            });
          } else {
            console.error("Failed to create blob from canvas");
          }
        }, "image/png");

        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        console.error("Failed to load image for filter processing");
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error("Error processing filter:", error);
    }
  };

  // Listen for messages from plugin code
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg?.type === "VISION_SIMULATOR_GENERATE_RESULT") {
        setGeneratingFilter(null);
        if (msg.success) {
          setError(null);
        } else {
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
          setError(null);
          setLoading(false);
        } else {
          // Actual error occurred
          setPreviewImage(null);
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
        // Process filter and send back filtered image
        await processFilterForGenerate(msg.frameId, msg.filter, msg.imageData);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [processFilterForGenerate]);

  // Notify plugin when Live view tab becomes active/inactive
  useEffect(() => {
    if (activeTab === "simulation") {
      sendMessage("VISION_SIMULATOR_PANEL_MOUNTED", {});
    } else {
      sendMessage("VISION_SIMULATOR_PANEL_UNMOUNTED", {});
    }
  }, [activeTab, sendMessage]);

  // Apply filter when currentFilter changes
  useEffect(() => {
    if (originalImageRef.current && activeTab === "simulation") {
      applyFilterToPreview(currentFilter);
    }
  }, [currentFilter, activeTab]);

  /**
   * Load image data into canvas for preview
   */
  const loadImageForPreview = async (
    imageData: Uint8Array,
    width: number,
    height: number
  ) => {
    try {
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
   * Apply the current filter to the preview image
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

    // If not 'original', apply filter
    if (filter !== "original") {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let filteredData: Uint8ClampedArray;

      // Apply the appropriate filter
      if (
        filter === "protanopia" ||
        filter === "deuteranopia" ||
        filter === "tritanopia" ||
        filter === "achromatopsia"
      ) {
        filteredData = applyColorBlindness(imageData.data, filter);
      } else if (filter === "blurred") {
        filteredData = applyBlur(imageData.data, canvas.width, canvas.height);
      } else if (filter === "ghosting") {
        filteredData = applyGhosting(
          imageData.data,
          canvas.width,
          canvas.height
        );
      } else if (filter === "yellowing") {
        filteredData = applyYellowing(imageData.data);
      } else if (filter === "loss-of-contrast") {
        filteredData = applyContrastLoss(imageData.data);
      } else if (filter === "bright-light") {
        filteredData = applyBrightLight(imageData.data);
      } else {
        filteredData = imageData.data;
      }

      // Update canvas with filtered data
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

    sendMessage("VISION_SIMULATOR_GENERATE", {
      filter,
      options: {
        position: "right",
        spacing: 50,
        includeLabel: false,
      },
    });
  };

  return (
    <div className="vision-simulator-panel">
      {/* Header */}
      <div className="vision-simulator-panel__header">
        <Button variant="ghost" size="small" onClick={onBack}>
          <Icon name="chevron-left" size={20} />
        </Button>
        <h2 className="vision-simulator-panel__title">Vision Simulator</h2>
      </div>

      {/* Tabs */}
      <div className="vision-simulator-panel__tabs">
        <button
          className={`vision-simulator-panel__tab ${
            activeTab === "generate"
              ? "vision-simulator-panel__tab--active"
              : ""
          }`}
          onClick={() => setActiveTab("generate")}
        >
          Generate simulation
        </button>
        <button
          className={`vision-simulator-panel__tab ${
            activeTab === "simulation"
              ? "vision-simulator-panel__tab--active"
              : ""
          }`}
          onClick={() => setActiveTab("simulation")}
        >
          Live view
        </button>
      </div>

      {/* Tab Content */}
      <div className="vision-simulator-panel__content">
        {/* Generate Tab */}
        {activeTab === "generate" && (
          <div className="vision-simulator-panel__generate">
            {/* Color Blind Section */}
            <div className="vision-simulator-panel__section">
              <h3 className="vision-simulator-panel__section-title">
                Color blind
              </h3>
              <div className="vision-simulator-panel__filters">
                {COLOR_BLIND_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    className={`vision-simulator-panel__filter-card ${
                      generatingFilter === filter
                        ? "vision-simulator-panel__filter-card--generating"
                        : ""
                    }`}
                    onClick={() => handleFilterClick(filter)}
                    disabled={generatingFilter !== null}
                  >
                    <FilterIcon filterId={filter} size="small" />
                    <span className="vision-simulator-panel__filter-label">
                      {FILTER_METADATA[filter].name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Section */}
            <div className="vision-simulator-panel__section">
              <h3 className="vision-simulator-panel__section-title">Other</h3>
              <div className="vision-simulator-panel__filters">
                {OTHER_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    className={`vision-simulator-panel__filter-card ${
                      generatingFilter === filter
                        ? "vision-simulator-panel__filter-card--generating"
                        : ""
                    }`}
                    onClick={() => handleFilterClick(filter)}
                    disabled={generatingFilter !== null}
                  >
                    <FilterIcon filterId={filter} size="small" />
                    <span className="vision-simulator-panel__filter-label">
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
          <div className="vision-simulator-panel__simulation">
            {/* Controls */}
            <div className="vision-simulator-panel__controls">
              {/* Zoom Dropdown */}
              <div className="vision-simulator-panel__control">
                <label className="vision-simulator-panel__control-label">
                  Zoom
                </label>
                <select
                  className="vision-simulator-panel__select"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                >
                  {ZOOM_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level * 100}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Simulation Dropdown */}
              <div className="vision-simulator-panel__control">
                <label className="vision-simulator-panel__control-label">
                  Simulation
                </label>
                <select
                  className="vision-simulator-panel__select"
                  value={currentFilter}
                  onChange={(e) =>
                    setCurrentFilter(e.target.value as SimulationType)
                  }
                >
                  <option value="original">Original</option>
                  <optgroup label="Color Blind">
                    {COLOR_BLIND_FILTERS.map((filter) => (
                      <option key={filter} value={filter}>
                        {FILTER_METADATA[filter].name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other">
                    {OTHER_FILTERS.map((filter) => (
                      <option key={filter} value={filter}>
                        {FILTER_METADATA[filter].name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Preview Area */}
            <div className="vision-simulator-panel__preview">
              {!previewImage && !loading && (
                <div className="vision-simulator-panel__preview-empty">
                  <p>Select a node to view simulation</p>
                </div>
              )}

              {loading && (
                <div className="vision-simulator-panel__preview-loading">
                  Loading...
                </div>
              )}

              {previewImage && (
                <div
                  className="vision-simulator-panel__preview-image-container"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <img
                    src={previewImage}
                    alt="Simulated preview"
                    className="vision-simulator-panel__preview-image"
                  />
                </div>
              )}

              {error && (
                <div className="vision-simulator-panel__error">{error}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};
