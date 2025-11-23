import { ContrastChecker } from "./features/testing/contrast/contrast-checker";
import { TouchTargetsChecker } from "./features/testing/touch-targets/touch-targets-checker";
import { TypographyChecker } from "./features/testing/typography/typography-checker";
import { SelectionService } from "./services/selection.service";
import { StorageService } from "./services/storage.service";

// Load all pages for document change monitoring
// This is required before registering documentchange handlers
figma.loadAllPagesAsync();

// Show the plugin UI
figma.showUI(__html__, { width: 340, height: 600 });

// Initialize services
const storageService = new StorageService();
const selectionService = new SelectionService();
const contrastChecker = new ContrastChecker(selectionService);
const touchTargetsChecker = new TouchTargetsChecker();
const typographyChecker = new TypographyChecker();

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

// Document change listener for typography monitoring
figma.on("documentchange", (event) => {
  if (!typographyMonitoring) return;

  // Check if any changes involve text nodes - just trigger a recheck on any change
  // More efficient than checking each change individually
  debouncedCheckPage();
});

// Listen for selection changes and automatically update contrast check
selectionService.onSelectionChange(async () => {
  // Auto-check when selection changes
  await checkContrastSelection();

  // Auto-check typography if panel is active
  autoCheckTypographySelection();
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

      case "get-theme":
        // Respond with current theme (if needed)
        figma.ui.postMessage({
          type: "theme-changed",
          theme: "light", // You can detect system theme here
        });
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
