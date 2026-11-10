import { VisionSimulator } from "./utils/vision-simulator";
import { SelectionService } from "./services/selection.service";

// Show the plugin UI. themeColors injects Figma's real --figma-color-* values
// for the user's light/dark theme, so "Auto" follows Figma.
figma.showUI(__html__, { width: 360, height: 770, themeColors: true });

/** Theme override chosen in the footer (Auto / Light / Dark), saved per user */
const THEME_KEY = "themePreference";

function isThemeValue(value: unknown): value is "auto" | "light" | "dark" {
  return value === "auto" || value === "light" || value === "dark";
}

// Initialize services
const selectionService = new SelectionService();
const visionSimulator = new VisionSimulator();

// Track Vision Simulator panel state for auto-preview
let visionSimulatorPanelActive = false;

// Increases with every preview request; a response is only sent if no newer
// request started while its export was running (so a slow export of an old
// selection can't overwrite the preview of the current one).
let latestPreviewRequest = 0;

// Function to auto-load vision simulator preview for current selection
async function autoLoadVisionSimulatorPreview() {
  if (!visionSimulatorPanelActive) return;
  const requestId = ++latestPreviewRequest;

  const selectedNodes = visionSimulator.getSelectedNodes();
  if (selectedNodes.length === 0) {
    figma.ui.postMessage({
      type: "VISION_SIMULATOR_PREVIEW_DATA",
      success: false,
      error: null, // No error, just no selection
    });
    return;
  }

  const previewData = await visionSimulator.prepareImageForPreview(
    selectedNodes[0].id
  );
  if (requestId !== latestPreviewRequest) return; // superseded

  if (previewData) {
    figma.ui.postMessage({
      type: "VISION_SIMULATOR_PREVIEW_DATA",
      success: true,
      data: previewData,
    });
  } else {
    figma.ui.postMessage({
      type: "VISION_SIMULATOR_PREVIEW_DATA",
      success: false,
      error: "Failed to export image for preview",
    });
  }
}

// Listen for selection changes and update the Vision Lab preview. Waits a
// moment after the last change, so clicking or shift-selecting through several
// layers exports only the one you end on.
const SELECTION_DEBOUNCE_MS = 150;
let selectionTimer: ReturnType<typeof setTimeout> | null = null;

selectionService.onSelectionChange(() => {
  if (selectionTimer !== null) clearTimeout(selectionTimer);
  selectionTimer = setTimeout(() => {
    selectionTimer = null;
    autoLoadVisionSimulatorPreview();
  }, SELECTION_DEBOUNCE_MS);
});

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "ZOOM_TO_NODE":
        const node = await figma.getNodeByIdAsync(
          msg.data?.nodeId || msg.nodeId
        );
        if (node) {
          figma.currentPage.selection = [node as SceneNode];
          figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
        }
        break;

      case "VISION_SIMULATOR_PANEL_MOUNTED":
        visionSimulatorPanelActive = true;
        // Auto-load preview for current selection when panel mounts
        await autoLoadVisionSimulatorPreview();
        break;

      case "VISION_SIMULATOR_PANEL_UNMOUNTED":
        visionSimulatorPanelActive = false;
        break;

      case "VISION_SIMULATOR_LOAD_PRESETS":
        // Load custom presets from storage
        try {
          const presetsData = figma.root.getPluginData(
            "vision-simulator-presets"
          );
          const presets = presetsData ? JSON.parse(presetsData) : [];
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_PRESETS_LOADED",
            presets: presets,
          });
        } catch (error) {
          console.error("[code.ts] Failed to load presets:", error);
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_PRESETS_LOADED",
            presets: [],
          });
        }
        break;

      case "VISION_SIMULATOR_SAVE_PRESETS":
        // Save custom presets to storage
        try {
          const presetsToSave = msg.data?.presets || []; // FIX: Use msg.data.presets

          figma.root.setPluginData(
            "vision-simulator-presets",
            JSON.stringify(presetsToSave)
          );

          // Send confirmation back to UI
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_PRESETS_SAVED",
            success: true,
            count: presetsToSave.length,
          });
        } catch (error) {
          console.error("[code.ts] Failed to save presets:", error);
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_PRESETS_SAVED",
            success: false,
            error: error.message,
          });
        }
        break;

      case "VISION_SIMULATOR_LOAD_SELECTED_PRESET":
        // Load the last selected preset ID from storage
        try {
          const selectedPresetId = figma.root.getPluginData(
            "vision-simulator-selected-preset"
          );
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_SELECTED_PRESET_LOADED",
            presetId: selectedPresetId || null,
          });
        } catch (error) {
          console.error("Failed to load selected preset:", error);
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_SELECTED_PRESET_LOADED",
            presetId: null,
          });
        }
        break;

      case "VISION_SIMULATOR_SAVE_SELECTED_PRESET":
        // Save the selected preset ID to storage
        try {
          const presetId = msg.data?.presetId || ""; // FIX: Use msg.data.presetId
          figma.root.setPluginData(
            "vision-simulator-selected-preset",
            presetId
          );
        } catch (error) {
          console.error("[code.ts] Failed to save selected preset:", error);
        }
        break;

      case "VISION_SIMULATOR_GENERATE": {
        // Step 1 of Quick simulation: export the selected layer once and hand
        // it to the UI, which filters it for each requested simulation.
        // No frame is created until the filtered image comes back.
        const nodesToGenerate = visionSimulator.getSelectedNodes();
        const filters: string[] = msg.data?.filters ?? [];

        if (nodesToGenerate.length === 0) {
          const error = "Select a layer to add a simulation";
          figma.notify(error);
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_GENERATE_RESULT",
            success: false,
            error,
          });
          break;
        }

        const source = nodesToGenerate[0];
        const sourceImage = await visionSimulator.prepareImageForPreview(
          source.id
        );

        if (!sourceImage) {
          const error = "Couldn't export the selected layer";
          figma.notify(error);
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_GENERATE_RESULT",
            success: false,
            error,
          });
          break;
        }

        figma.ui.postMessage({
          type: "VISION_SIMULATOR_PROCESS_FILTER",
          sourceNodeId: source.id,
          filters,
          imageData: sourceImage,
        });
        break;
      }

      case "VISION_SIMULATOR_APPLY_FILTERED_IMAGE": {
        // Step 2 of Quick simulation: the UI has filtered the image; create
        // the frame next to the source (or next to its previous simulations).
        const { sourceNodeId, filter, imageData, label } = msg.data ?? {};
        try {
          const frame = await visionSimulator.createSimulationFrame(
            sourceNodeId,
            filter,
            imageData,
            label || filter
          );
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_IMAGE_APPLIED",
            success: true,
            filter,
            frameId: frame.id,
          });
        } catch (error) {
          console.error("Failed to add simulation:", error);
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_IMAGE_APPLIED",
            success: false,
            filter,
            error: error.message || "Failed to add simulation",
          });
        }
        break;
      }

      case "VISION_SIMULATOR_EXPORT_TO_CANVAS": {
        // Vision Lab: add the current preview to the canvas, in the same row
        // as Quick simulations of the same layer.
        const nodesToExport = visionSimulator.getSelectedNodes();

        if (nodesToExport.length === 0) {
          const error = "Select a layer first";
          figma.notify(error);
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_EXPORT_TO_CANVAS_RESULT",
            success: false,
            error,
          });
          break;
        }

        try {
          const imageData = msg.data?.imageData;
          const label = msg.data?.label || "Vision Simulation";
          const filter = msg.data?.filter || "original";

          if (!imageData) {
            throw new Error("Invalid image data");
          }

          await visionSimulator.createSimulationFrame(
            nodesToExport[0].id,
            filter,
            imageData,
            label
          );

          figma.notify(`Added "${label}" to canvas`);
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_EXPORT_TO_CANVAS_RESULT",
            success: true,
          });
        } catch (error) {
          console.error("Error exporting to canvas:", error);
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_EXPORT_TO_CANVAS_RESULT",
            success: false,
            error: error.message || "Failed to export to canvas",
          });
        }
        break;
      }

      case "get-theme-pref": {
        const value = await figma.clientStorage
          .getAsync(THEME_KEY)
          .catch(() => undefined);
        figma.ui.postMessage({
          type: "theme-pref",
          value: isThemeValue(value) ? value : "auto",
        });
        break;
      }

      case "set-theme-pref":
        if (isThemeValue(msg.value)) {
          await figma.clientStorage
            .setAsync(THEME_KEY, msg.value)
            .catch(() => undefined);
        }
        break;

      case "disclaimer":
        figma.notify(
          "These simulations are approximations for design and learning. They can't show exactly how any one person sees, and they're not a medical tool, so don't use them for diagnosis or treatment.",
          { timeout: 8000 }
        );
        break;

      case "SHOW_NOTIFICATION":
        if (msg.message) {
          figma.notify(msg.message);
        }
        break;

      default:
    }
  } catch (error) {
    console.error("Error handling message:", error);
    figma.ui.postMessage({
      type: msg.type + "_ERROR",
      success: false,
      error: error.message,
    });
  }
};
