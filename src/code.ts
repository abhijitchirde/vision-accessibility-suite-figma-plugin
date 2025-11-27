import { ContrastChecker } from "./features/testing/contrast/contrast-checker";
import { TouchTargetsChecker } from "./features/testing/touch-targets/touch-targets-checker";
import { TypographyChecker } from "./features/testing/typography/typography-checker";
import { VisionSimulator } from "./features/testing/vision-simulator/vision-simulator";
import { AltTextManager } from "./features/annotation/alt-text/alt-text-manager";
import { FocusOrderManager } from "./features/annotation/focus-order/focus-order-manager";
import { SelectionService } from "./services/selection.service";
import { StorageService } from "./services/storage.service";
import { AnnotationService } from "./services/annotation.service";

// Load all pages for document change monitoring
// This is required before registering documentchange handlers
figma.loadAllPagesAsync();

// Show the plugin UI
figma.showUI(__html__, { width: 400, height: 800 });

// Initialize services
const storageService = new StorageService();
const selectionService = new SelectionService();
const annotationService = new AnnotationService();
const contrastChecker = new ContrastChecker(selectionService);
const touchTargetsChecker = new TouchTargetsChecker();
const typographyChecker = new TypographyChecker();
const visionSimulator = new VisionSimulator();
const altTextManager = new AltTextManager(storageService, annotationService);
const focusOrderManager = new FocusOrderManager(storageService, selectionService);

// Track Typography panel state for auto-check
let typographyPanelActive = false;
let typographyCheckMode: "page" | "selection" | null = null;
let typographyMonitoring = false;
let monitoringDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let typographyCheckOptions = {
  checkFontSize: true,
  checkLineHeight: true,
  checkLineLength: true,
  checkLetterSpacing: true,
  checkTextAlign: true,
  checkFontWeight: true,
};

// Track Vision Simulator panel state for auto-preview
let visionSimulatorPanelActive = false;

// Track Alt-Text Manager panel state for annotation checks
let altTextPanelActive = false;

// Function to check for deleted annotations when selection changes
async function checkForDeletedAnnotations() {
  if (!altTextPanelActive) return;

  // Get all image nodes with alt text data and check annotations
  const imageNodes = await altTextManager.getAllImageNodesWithAltText();

  // Check if any annotations are missing
  const hasDeletedAnnotations = imageNodes.some(
    (node) => node.altTextData?.annotationMissing === true
  );

  // If we found deleted annotations, notify the UI to refresh
  if (hasDeletedAnnotations) {
    figma.ui.postMessage({
      type: "ALT_TEXT_UPDATED",
      success: true,
    });
  }
}

// Function to sync canvas selection to plugin UI
async function syncCanvasSelectionToUI() {
  if (!altTextPanelActive) return;

  const selection = figma.currentPage.selection;

  // If nothing is selected, clear selection in UI
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: "ALT_TEXT_NODE_DESELECTED",
    });
    return;
  }

  const selectedNode = selection[0];

  // Check if selected node is an annotation group
  if (selectedNode.type === 'GROUP' && selectedNode.name.startsWith('a11y-annotation')) {
    const targetNodeId = selectedNode.getPluginData('targetNodeId');
    if (targetNodeId) {
      // User selected an annotation, sync to its target node
      figma.ui.postMessage({
        type: "ALT_TEXT_NODE_SELECTED",
        nodeId: targetNodeId,
      });
      return;
    }
  }

  // Check if selected node is an image node (has image fill)
  if ('fills' in selectedNode && Array.isArray(selectedNode.fills)) {
    const hasImageFill = selectedNode.fills.some(
      (fill) => fill.type === 'IMAGE' && fill.visible !== false
    );

    if (hasImageFill) {
      // User selected an image node, sync to UI
      figma.ui.postMessage({
        type: "ALT_TEXT_NODE_SELECTED",
        nodeId: selectedNode.id,
      });
    }
  }
}

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

// Function to check contrast for current selection
async function checkContrastSelection() {
  try {
    const selection = selectionService.getCurrentSelection();

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: "CONTRAST_RESULT",
        success: false,
        error: "Please select a layer to check contrast",
      });
      return;
    }

    // Use the first selected node
    const node = selection[0];

    // Debug logs (uncomment for debugging)
    // console.log('Checking node:', node.type, node.name);
    // console.log('Has fills:', 'fills' in node);
    // console.log('Has strokes:', 'strokes' in node);
    // if ('fills' in node) {
    //   console.log('Fills:', node.fills);
    //   console.log('Fills is array?', Array.isArray(node.fills));
    //   console.log('Fills length:', Array.isArray(node.fills) ? node.fills.length : 'N/A');
    //   if (Array.isArray(node.fills) && node.fills.length > 0) {
    //     console.log('First fill:', node.fills[0]);
    //     console.log('First fill type:', node.fills[0].type);
    //     console.log('First fill visible:', node.fills[0].visible);
    //     if (node.fills[0].type === 'SOLID') {
    //       console.log('First fill color:', node.fills[0].color);
    //     }
    //   }
    // }
    // if ('strokes' in node) {
    //   console.log('Strokes:', node.strokes);
    // }

    // Try to check contrast on the selected node
    // console.log('About to call checkAnyNode');
    const result = contrastChecker.checkAnyNode(node);
    // console.log('checkAnyNode returned:', result);

    if (result) {
      // console.log('Result is truthy, sending success message');
      figma.ui.postMessage({
        type: "CONTRAST_RESULT",
        success: true,
        data: result,
      });
    } else {
      // console.log('Result is falsy, sending error message');
      figma.ui.postMessage({
        type: "CONTRAST_RESULT",
        success: false,
        error: "This layer has no fill or stroke color to check",
      });
    }
  } catch (error) {
    console.error("Error in checkContrastSelection:", error);
    figma.ui.postMessage({
      type: "CONTRAST_RESULT",
      success: false,
      error: error.message || "An error occurred",
    });
  }
}

// Function to auto-check typography for current selection
function autoCheckTypographySelection() {
  if (!typographyPanelActive) return;

  // Don't auto-check when user explicitly clicked "Check Page"
  if (typographyCheckMode === "page") return;

  const selection = figma.currentPage.selection;

  // If no selection, clear results and reset to initial state
  if (selection.length === 0) {
    typographyCheckMode = null;
    figma.ui.postMessage({
      type: "TYPOGRAPHY_RESULT",
      success: true,
      data: [],
    });
    return;
  }

  // Check if selection has any text nodes
  const hasTextNodes = selection.some((node) => {
    if (node.type === "TEXT") return true;
    if ("children" in node) {
      // Check if any children are text nodes
      const checkChildren = (n: BaseNode): boolean => {
        if (n.type === "TEXT") return true;
        if ("children" in n) {
          return n.children.some(checkChildren);
        }
        return false;
      };
      return checkChildren(node);
    }
    return false;
  });

  if (hasTextNodes) {
    typographyCheckMode = "selection";
    const results = typographyChecker.checkSelection(typographyCheckOptions);
    figma.ui.postMessage({
      type: "TYPOGRAPHY_RESULT",
      success: true,
      data: results,
    });
  }
}

// Function to check page typography with debouncing
function debouncedCheckPage() {
  if (!typographyMonitoring) return;

  // Clear existing timer
  if (monitoringDebounceTimer) {
    clearTimeout(monitoringDebounceTimer);
  }

  // Set new timer
  monitoringDebounceTimer = setTimeout(() => {
    const results = typographyChecker.checkPage(typographyCheckOptions);
    figma.ui.postMessage({
      type: "TYPOGRAPHY_RESULT",
      success: true,
      data: results,
    });
  }, 500); // Wait 500ms after last change before checking
}

// Document change listener for typography monitoring and annotation deletion detection
figma.on("documentchange", (event) => {
  // Handle typography monitoring
  if (typographyMonitoring) {
    // Check if any changes involve text nodes - just trigger a recheck on any change
    // More efficient than checking each change individually
    debouncedCheckPage();
  }

  // Handle annotation deletion detection
  if (altTextPanelActive) {
    // Check if any nodes were deleted
    const hasDeletedNodes = event.documentChanges.some(
      (change) => change.type === "DELETE"
    );

    if (hasDeletedNodes) {
      // Check for deleted annotations and refresh UI if needed
      checkForDeletedAnnotations();
    }
  }
});

// Listen for selection changes and automatically update contrast check
selectionService.onSelectionChange(async () => {
  // Auto-check when selection changes
  await checkContrastSelection();

  // Auto-check typography if panel is active
  autoCheckTypographySelection();

  // Auto-load vision simulator preview if panel is active
  await autoLoadVisionSimulatorPreview();

  // Sync canvas selection to alt-text panel UI
  await syncCanvasSelectionToUI();
});

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "CHECK_CONTRAST_SELECTION":
        await checkContrastSelection();
        break;

      case "CHECK_CONTRAST_PAGE":
        const results = await contrastChecker.checkPage();
        figma.ui.postMessage({
          type: "CONTRAST_PAGE_RESULT",
          success: true,
          data: results,
        });
        break;

      case "CHECK_TOUCH_TARGETS_PAGE":
        const touchTargetsPageResults = touchTargetsChecker.checkPage({
          platform: msg.data?.platform || msg.platform || "web",
          level: msg.data?.level || msg.level || "AA",
        });
        figma.ui.postMessage({
          type: "TOUCH_TARGETS_RESULT",
          success: true,
          data: touchTargetsPageResults,
        });
        break;

      case "CHECK_TOUCH_TARGETS_SELECTION":
        // For selection, check all selected nodes (user knows what's interactive)
        const touchTargetsSelectionResults = touchTargetsChecker.checkSelection(
          {
            platform: msg.data?.platform || msg.platform || "web",
            level: msg.data?.level || msg.level || "AA",
          },
          true
        ); // Skip interactive detection - check whatever user selected
        figma.ui.postMessage({
          type: "TOUCH_TARGETS_RESULT",
          success: true,
          data: touchTargetsSelectionResults,
        });
        break;

      case "FIX_TOUCH_TARGET":
        const fixed = await touchTargetsChecker.fixNode(
          msg.data?.nodeId || msg.nodeId,
          msg.data?.requiredWidth || msg.requiredWidth,
          msg.data?.requiredHeight || msg.requiredHeight
        );
        figma.ui.postMessage({
          type: "TOUCH_TARGET_FIXED",
          success: fixed,
          nodeId: msg.data?.nodeId || msg.nodeId,
        });
        break;

      case "CHECK_TYPOGRAPHY_PAGE":
        typographyCheckMode = "page";
        const typographyPageResults = typographyChecker.checkPage(
          msg.data || {}
        );
        figma.ui.postMessage({
          type: "TYPOGRAPHY_RESULT",
          success: true,
          data: typographyPageResults,
        });
        break;

      case "CHECK_TYPOGRAPHY_SELECTION":
        typographyCheckMode = "selection";
        const typographySelectionResults = typographyChecker.checkSelection(
          msg.data || {}
        );
        figma.ui.postMessage({
          type: "TYPOGRAPHY_RESULT",
          success: true,
          data: typographySelectionResults,
        });
        break;

      case "TYPOGRAPHY_BULK_FIX":
        try {
          console.log("Received TYPOGRAPHY_BULK_FIX request", {
            nodeCount: (msg.data?.nodeIds || []).length,
            options: msg.data?.options,
          });
          const fixedCount = await typographyChecker.applyBulkFixes(
            msg.data?.nodeIds || [],
            msg.data?.options || {}
          );
          console.log("Bulk fix completed, fixed count:", fixedCount);
          figma.ui.postMessage({
            type: "TYPOGRAPHY_BULK_FIXED",
            success: true,
            fixedCount,
          });
        } catch (bulkFixError) {
          console.error("Error during bulk fix:", bulkFixError);
          figma.ui.postMessage({
            type: "TYPOGRAPHY_BULK_FIXED",
            success: false,
            error: bulkFixError.message || "Failed to apply bulk fixes",
          });
        }
        break;

      case "ZOOM_TO_NODE":
        const node = await figma.getNodeByIdAsync(
          msg.data?.nodeId || msg.nodeId
        );
        if (node) {
          figma.currentPage.selection = [node as SceneNode];
          figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
        }
        break;

      case "TYPOGRAPHY_PANEL_MOUNTED":
        typographyPanelActive = true;
        if (msg.data?.options) {
          typographyCheckOptions = msg.data.options;
        }
        // Auto-check current selection when panel mounts
        autoCheckTypographySelection();
        break;

      case "START_TYPOGRAPHY_MONITORING":
        typographyCheckMode = "page";
        typographyMonitoring = true;
        if (msg.data) {
          typographyCheckOptions = msg.data;
        }
        // Run initial check
        const initialResults = typographyChecker.checkPage(
          typographyCheckOptions
        );
        figma.ui.postMessage({
          type: "TYPOGRAPHY_RESULT",
          success: true,
          data: initialResults,
        });
        break;

      case "STOP_TYPOGRAPHY_MONITORING":
        typographyMonitoring = false;
        typographyCheckMode = null;
        if (monitoringDebounceTimer) {
          clearTimeout(monitoringDebounceTimer);
          monitoringDebounceTimer = null;
        }
        break;

      case "TYPOGRAPHY_PANEL_UNMOUNTED":
        typographyPanelActive = false;
        typographyCheckMode = null;
        typographyMonitoring = false;
        if (monitoringDebounceTimer) {
          clearTimeout(monitoringDebounceTimer);
          monitoringDebounceTimer = null;
        }
        break;

      case "TYPOGRAPHY_UPDATE_OPTIONS":
        if (msg.data?.options) {
          typographyCheckOptions = msg.data.options;
        }
        // Re-check with new options
        if (typographyMonitoring) {
          debouncedCheckPage();
        } else {
          autoCheckTypographySelection();
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
          console.log("[code.ts] Loading presets from storage, raw data:", presetsData);
          const presets = presetsData ? JSON.parse(presetsData) : [];
          console.log("[code.ts] Parsed presets:", presets.length, "presets");
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
          console.log("[code.ts] Received SAVE_PRESETS message, raw msg:", msg);
          const presetsToSave = msg.data?.presets || []; // FIX: Use msg.data.presets
          console.log("[code.ts] presetsToSave extracted:", presetsToSave);
          console.log("[code.ts] presetsToSave is array?", Array.isArray(presetsToSave));
          console.log("[code.ts] presetsToSave length:", presetsToSave.length);
          console.log("[code.ts] Saving presets to storage:", presetsToSave.length, "presets");
          console.log("[code.ts] Full preset data:", JSON.stringify(presetsToSave, null, 2));

          figma.root.setPluginData(
            "vision-simulator-presets",
            JSON.stringify(presetsToSave)
          );

          // Verify the save by reading it back
          const verification = figma.root.getPluginData("vision-simulator-presets");
          console.log("[code.ts] Verification - data saved successfully:", verification ? "YES" : "NO");
          console.log("[code.ts] Verification - saved data length:", verification?.length || 0);

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
          console.log("[code.ts] Saved selected preset ID:", presetId);
        } catch (error) {
          console.error("[code.ts] Failed to save selected preset:", error);
        }
        break;

      case "VISION_SIMULATOR_GENERATE":
        // Generate canvas copy with filter applied
        const nodesToGenerate = visionSimulator.getSelectedNodes();
        console.log(
          `VISION_SIMULATOR_GENERATE: Found ${nodesToGenerate.length} selected nodes`
        );

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
            console.log(
              `Generating simulation for filter: ${filter}, node: ${nodesToGenerate[0].name}`
            );

            // Generate simulation for first selected node with single filter
            const generatedIds = await visionSimulator.generateSimulations(
              nodesToGenerate[0],
              [filter], // Single filter in array
              options
            );

            // Apply filter to the generated frame
            const frameId = generatedIds[0];
            console.log(`Generated frame ID: ${frameId}`);

            // Export original image
            const originalImage = await visionSimulator.prepareImageForPreview(
              nodesToGenerate[0].id
            );
            console.log(
              `Exported original image: ${originalImage ? "success" : "failed"}`
            );

            if (originalImage) {
              // Send to UI for filter processing
              console.log(`Sending image to UI for ${filter} processing`);
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
            rect.fills = [{
              type: 'IMAGE',
              scaleMode: 'FILL',
              imageHash: image.hash,
            }];

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

      case "LOAD_ALT_TEXT_IMAGES":
        // Load all image nodes on the page with their alt text data
        // Mark panel as active for annotation deletion detection
        altTextPanelActive = true;
        try {
          const imageNodesData = await altTextManager.getAllImageNodesWithAltText();
          const stats = await altTextManager.getStats();
          figma.ui.postMessage({
            type: "ALT_TEXT_IMAGE_NODES",
            success: true,
            data: {
              nodes: imageNodesData,
              stats: stats,
            },
          });
        } catch (error) {
          console.error("Error loading alt text images:", error);
          figma.ui.postMessage({
            type: "ALT_TEXT_IMAGE_NODES",
            success: false,
            error: error.message || "Failed to load image nodes",
          });
        }
        break;

      case "ALT_TEXT_PANEL_CLOSED":
        // Alt-text panel was closed/unmounted
        altTextPanelActive = false;
        break;

      case "GET_ALT_TEXT_DATA":
        // Get alt text data for a specific node
        try {
          const nodeId = msg.data?.nodeId || msg.nodeId;
          const node = await figma.getNodeByIdAsync(nodeId) as SceneNode;
          const altTextData = await altTextManager.getAltTextForNode(nodeId);
          figma.ui.postMessage({
            type: "ALT_TEXT_DATA",
            success: true,
            data: altTextData,
            nodeName: node?.name || "",
          });
        } catch (error) {
          console.error("Error getting alt text data:", error);
          figma.ui.postMessage({
            type: "ALT_TEXT_DATA",
            success: false,
            error: error.message,
          });
        }
        break;

      case "VALIDATE_ALT_TEXT":
        // Validate alt text
        try {
          const altText = msg.data?.altText || msg.altText || "";
          const isDecorative = msg.data?.isDecorative || msg.isDecorative || false;
          const validation = altTextManager.validateAltText(altText, isDecorative);
          figma.ui.postMessage({
            type: "ALT_TEXT_VALIDATED",
            success: true,
            validation: validation,
          });
        } catch (error) {
          console.error("Error validating alt text:", error);
          figma.ui.postMessage({
            type: "ALT_TEXT_VALIDATED",
            success: false,
            error: error.message,
          });
        }
        break;

      case "SAVE_ALT_TEXT":
        // Save alt text for a node
        try {
          const nodeId = msg.data?.nodeId || msg.nodeId;
          const altText = msg.data?.altText || msg.altText || "";
          const isDecorative = msg.data?.isDecorative || msg.isDecorative || false;

          const savedData = await altTextManager.setAltText(nodeId, altText, isDecorative);

          if (savedData) {
            figma.ui.postMessage({
              type: "ALT_TEXT_SAVED",
              success: true,
              data: savedData,
            });
            // Notify UI to refresh the list
            figma.ui.postMessage({
              type: "ALT_TEXT_UPDATED",
              success: true,
            });
            figma.notify(isDecorative ? "Marked as decorative" : "Alt text saved");
          } else {
            throw new Error("Failed to save alt text");
          }
        } catch (error) {
          console.error("Error saving alt text:", error);
          figma.ui.postMessage({
            type: "ALT_TEXT_SAVED",
            success: false,
            error: error.message || "Failed to save alt text",
          });
        }
        break;

      case "REMOVE_ALT_TEXT":
        // Remove alt text from a node
        try {
          const nodeId = msg.data?.nodeId || msg.nodeId;
          const removed = await altTextManager.removeAltText(nodeId);

          if (removed) {
            figma.ui.postMessage({
              type: "ALT_TEXT_REMOVED",
              success: true,
              nodeId: nodeId,
            });
            figma.ui.postMessage({
              type: "ALT_TEXT_UPDATED",
              success: true,
            });
            figma.notify("Alt text removed");
          } else {
            throw new Error("Failed to remove alt text");
          }
        } catch (error) {
          console.error("Error removing alt text:", error);
          figma.ui.postMessage({
            type: "ALT_TEXT_REMOVED",
            success: false,
            error: error.message,
          });
        }
        break;

      case "SCROLL_AND_ZOOM_TO_NODE":
        // Scroll and zoom to a specific node
        try {
          const nodeId = msg.data?.nodeId || msg.nodeId;
          const success = await altTextManager.scrollAndZoomToNode(nodeId);

          if (!success) {
            figma.notify("Could not find the element");
          }
        } catch (error) {
          console.error("Error scrolling to node:", error);
        }
        break;

      case "RESTORE_ANNOTATION":
        // Restore a deleted annotation
        try {
          const nodeId = msg.data?.nodeId || msg.nodeId;
          const success = await altTextManager.restoreAnnotation(nodeId);

          if (success) {
            figma.notify("Annotation restored");
            figma.ui.postMessage({
              type: "ALT_TEXT_UPDATED",
              success: true,
            });
          } else {
            figma.notify("Failed to restore annotation");
          }
        } catch (error) {
          console.error("Error restoring annotation:", error);
          figma.notify("Failed to restore annotation");
        }
        break;

      case "GET_FOCUS_ORDER":
        // Get all focus order items for current page
        try {
          const items = await focusOrderManager.getFocusOrder();
          const stats = await focusOrderManager.getStats();
          figma.ui.postMessage({
            type: "FOCUS_ORDER_LOADED",
            success: true,
            data: {
              items: items,
              stats: stats,
            },
          });
        } catch (error) {
          console.error("Error loading focus order:", error);
          figma.ui.postMessage({
            type: "FOCUS_ORDER_LOADED",
            success: false,
            error: error.message,
          });
        }
        break;

      case "ADD_FOCUS_ORDER_ITEM":
        // Add currently selected node(s) to focus order
        try {
          const result = await focusOrderManager.addSelectedToFocusOrder();
          if (result.success) {
            figma.notify("Added to focus order");
            figma.ui.postMessage({
              type: "FOCUS_ORDER_ITEM_ADDED",
              success: true,
              data: {
                items: result.items,
              },
            });
          } else {
            figma.notify(result.error || "Failed to add item");
            figma.ui.postMessage({
              type: "FOCUS_ORDER_ITEM_ADDED",
              success: false,
              error: result.error,
            });
          }
        } catch (error) {
          console.error("Error adding focus order item:", error);
          figma.ui.postMessage({
            type: "FOCUS_ORDER_ITEM_ADDED",
            success: false,
            error: error.message,
          });
        }
        break;

      case "REMOVE_FOCUS_ORDER_ITEM":
        // Remove an item from focus order
        try {
          const nodeIdToRemove = msg.data?.nodeId || msg.nodeId;
          const result = await focusOrderManager.removeFocusOrderItem(nodeIdToRemove);
          if (result.success) {
            figma.notify("Removed from focus order");
            figma.ui.postMessage({
              type: "FOCUS_ORDER_ITEM_REMOVED",
              success: true,
              data: {
                items: result.items,
              },
            });
          } else {
            figma.notify(result.error || "Failed to remove item");
            figma.ui.postMessage({
              type: "FOCUS_ORDER_ITEM_REMOVED",
              success: false,
              error: result.error,
            });
          }
        } catch (error) {
          console.error("Error removing focus order item:", error);
          figma.ui.postMessage({
            type: "FOCUS_ORDER_ITEM_REMOVED",
            success: false,
            error: error.message,
          });
        }
        break;

      case "REORDER_FOCUS_ITEMS":
        // Reorder focus items (after drag-and-drop)
        try {
          const itemsToReorder = msg.data?.items || msg.items;
          const result = await focusOrderManager.reorderFocusItems(itemsToReorder);
          if (result.success) {
            figma.ui.postMessage({
              type: "FOCUS_ORDER_REORDERED",
              success: true,
              data: {
                items: result.items,
              },
            });
          } else {
            figma.notify(result.error || "Failed to reorder items");
            figma.ui.postMessage({
              type: "FOCUS_ORDER_REORDERED",
              success: false,
              error: result.error,
            });
          }
        } catch (error) {
          console.error("Error reordering focus items:", error);
          figma.ui.postMessage({
            type: "FOCUS_ORDER_REORDERED",
            success: false,
            error: error.message,
          });
        }
        break;

      case "TOGGLE_FOCUS_ANNOTATIONS":
        // Toggle visibility of focus order annotations
        try {
          const visible = msg.data?.visible ?? msg.visible ?? true;
          await focusOrderManager.toggleAnnotationsVisibility(visible);
        } catch (error) {
          console.error("Error toggling focus annotations:", error);
        }
        break;

      case "ZOOM_TO_FOCUS_ITEM":
        // Zoom to a focus order item
        try {
          const focusNodeId = msg.data?.nodeId || msg.nodeId;
          const success = await focusOrderManager.zoomToItem(focusNodeId);
          if (!success) {
            figma.notify("Could not find the element");
          }
        } catch (error) {
          console.error("Error zooming to focus item:", error);
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
        console.log("Unknown message type:", msg.type);
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
