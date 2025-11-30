import { VisionSimulator } from "./utils/vision-simulator";
import { SelectionService } from "./services/selection.service";

// Load all pages for document change monitoring
// This is required before registering documentchange handlers
figma.loadAllPagesAsync();

// Show the plugin UI
figma.showUI(__html__, { width: 400, height: 740 });

// Initialize services
const selectionService = new SelectionService();
const visionSimulator = new VisionSimulator();

// Track Vision Simulator panel state for auto-preview
let visionSimulatorPanelActive = false;

// Function to auto-load vision simulator preview for current selection
async function autoLoadVisionSimulatorPreview() {
  if (!visionSimulatorPanelActive) return;

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

// Listen for selection changes and automatically update vision simulator preview
selectionService.onSelectionChange(async () => {
  // Auto-load vision simulator preview if panel is active
  await autoLoadVisionSimulatorPreview();
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

      case "VISION_SIMULATOR_REQUEST_PREVIEW":
        // Manual preview request (can be removed if no longer needed)
        await autoLoadVisionSimulatorPreview();
        break;

      case "VISION_SIMULATOR_LOAD_PRESETS":
        // Load custom presets from storage
        try {
          const presetsData = figma.root.getPluginData(
            "vision-simulator-presets"
          );
          // console.log(
          //   "[code.ts] Loading presets from storage, raw data:",
          //   presetsData
          // );
          const presets = presetsData ? JSON.parse(presetsData) : [];
          // console.log("[code.ts] Parsed presets:", presets.length, "presets");
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
          // console.log("[code.ts] Received SAVE_PRESETS message, raw msg:", msg);
          const presetsToSave = msg.data?.presets || []; // FIX: Use msg.data.presets
          // console.log("[code.ts] presetsToSave extracted:", presetsToSave);
          // console.log(
          //   "[code.ts] presetsToSave is array?",
          //   Array.isArray(presetsToSave)
          // );
          // console.log("[code.ts] presetsToSave length:", presetsToSave.length);
          // console.log(
          //   "[code.ts] Saving presets to storage:",
          //   presetsToSave.length,
          //   "presets"
          // );
          // console.log(
          //   "[code.ts] Full preset data:",
          //   JSON.stringify(presetsToSave, null, 2)
          // );

          figma.root.setPluginData(
            "vision-simulator-presets",
            JSON.stringify(presetsToSave)
          );

          // Verify the save by reading it back
          const verification = figma.root.getPluginData(
            "vision-simulator-presets"
          );
          // console.log(
          //   "[code.ts] Verification - data saved successfully:",
          //   verification ? "YES" : "NO"
          // );
          // console.log(
          //   "[code.ts] Verification - saved data length:",
          //   verification?.length || 0
          // );

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
          // console.log("[code.ts] Saved selected preset ID:", presetId);
        } catch (error) {
          console.error("[code.ts] Failed to save selected preset:", error);
        }
        break;

      case "VISION_SIMULATOR_GENERATE":
        // Generate canvas copy with filter applied
        const nodesToGenerate = visionSimulator.getSelectedNodes();
        // console.log(
        //   `VISION_SIMULATOR_GENERATE: Found ${nodesToGenerate.length} selected nodes`
        // );

        if (nodesToGenerate.length === 0) {
          figma.notify(
            "Please select an element to generate visual simulation"
          );
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_GENERATE_RESULT",
            success: false,
            error: "Please select an element to generate visual simulation",
          });
        } else {
          try {
            const filter = msg.data?.filter || msg.filter;
            const options = msg.data?.options || msg.options || {};
            // console.log(
            //   `Generating simulation for filter: ${filter}, node: ${nodesToGenerate[0].name}`
            // );

            // Generate simulation for first selected node with single filter
            const generatedIds = await visionSimulator.generateSimulations(
              nodesToGenerate[0],
              [filter], // Single filter in array
              options
            );

            // Apply filter to the generated frame
            const frameId = generatedIds[0];
            // console.log(`Generated frame ID: ${frameId}`);

            // Export original image
            const originalImage = await visionSimulator.prepareImageForPreview(
              nodesToGenerate[0].id
            );
            // console.log(
            //   `Exported original image: ${originalImage ? "success" : "failed"}`
            // );

            if (originalImage) {
              // Send to UI for filter processing
              // console.log(`Sending image to UI for ${filter} processing`);
              figma.ui.postMessage({
                type: "VISION_SIMULATOR_PROCESS_FILTER",
                frameId,
                filter,
                imageData: originalImage,
              });
            } else {
              console.error("Failed to export original image");
            }

            figma.ui.postMessage({
              type: "VISION_SIMULATOR_GENERATE_RESULT",
              success: true,
              filter: filter,
            });
          } catch (error) {
            console.error("Error in VISION_SIMULATOR_GENERATE:", error);
            figma.ui.postMessage({
              type: "VISION_SIMULATOR_GENERATE_RESULT",
              success: false,
              error: error.message || "Failed to generate simulation",
            });
          }
        }
        break;

      case "VISION_SIMULATOR_APPLY_FILTERED_IMAGE":
        // Apply processed image back to canvas frame
        try {
          await visionSimulator.applyFilteredImage(
            msg.data?.frameId || msg.frameId,
            msg.data?.imageData || msg.imageData
          );
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_IMAGE_APPLIED",
            success: true,
            frameId: msg.data?.frameId || msg.frameId,
          });
        } catch (error) {
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_IMAGE_APPLIED",
            success: false,
            error: error.message,
          });
        }
        break;

      case "VISION_SIMULATOR_EXPORT_TO_CANVAS":
        // Export current preview to Figma canvas
        const nodesToExport = visionSimulator.getSelectedNodes();

        if (nodesToExport.length === 0) {
          figma.notify("Please select an element first");
          figma.ui.postMessage({
            type: "VISION_SIMULATOR_EXPORT_TO_CANVAS_RESULT",
            success: false,
            error: "Please select an element first",
          });
        } else {
          try {
            const selectedNode = nodesToExport[0];
            const imageData = msg.data?.imageData;
            const width = msg.data?.width;
            const height = msg.data?.height;
            const label = msg.data?.label || "Vision Simulation";

            if (!imageData || !width || !height) {
              throw new Error("Invalid image data");
            }

            // Save the original selection to restore it later
            const originalSelection = figma.currentPage.selection.slice();

            // Create a frame near the selected node
            const frame = figma.createFrame();
            frame.name = label;
            frame.resize(width, height);

            // Position frame to the right of the selected node
            frame.x = selectedNode.x + selectedNode.width + 50;
            frame.y = selectedNode.y;

            // Create a rectangle to hold the image
            const rect = figma.createRectangle();
            rect.resize(width, height);
            rect.x = 0;
            rect.y = 0;

            // Create image from the data
            const image = figma.createImage(imageData);
            rect.fills = [
              {
                type: "IMAGE",
                scaleMode: "FILL",
                imageHash: image.hash,
              },
            ];

            frame.appendChild(rect);

            // Restore the original selection
            figma.currentPage.selection = originalSelection;

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
        }
        break;

      case "get-theme":
        // Respond with current theme (if needed)
        figma.ui.postMessage({
          type: "theme-changed",
          theme: "light", // You can detect system theme here
        });
        break;

      case "SHOW_NOTIFICATION":
        if (msg.message) {
          figma.notify(msg.message);
        }
        break;

      default:
      // console.log("Unknown message type:", msg.type);
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
