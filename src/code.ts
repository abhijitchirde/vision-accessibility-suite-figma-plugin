import { ContrastChecker } from './features/testing/contrast/contrast-checker';
import { SelectionService } from './services/selection.service';
import { StorageService } from './services/storage.service';

// Show the plugin UI
figma.showUI(__html__, { width: 400, height: 600 });

// Initialize services
const storageService = new StorageService();
const selectionService = new SelectionService();
const contrastChecker = new ContrastChecker(selectionService);

// Function to check contrast for current selection
async function checkContrastSelection() {
  try {
    const selection = selectionService.getCurrentSelection();

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'CONTRAST_RESULT',
        success: false,
        error: 'Please select a layer to check contrast',
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
        type: 'CONTRAST_RESULT',
        success: true,
        data: result,
      });
    } else {
      // console.log('Result is falsy, sending error message');
      figma.ui.postMessage({
        type: 'CONTRAST_RESULT',
        success: false,
        error: 'This layer has no fill or stroke color to check',
      });
    }
  } catch (error) {
    console.error('Error in checkContrastSelection:', error);
    figma.ui.postMessage({
      type: 'CONTRAST_RESULT',
      success: false,
      error: error.message || 'An error occurred',
    });
  }
}

// Listen for selection changes and automatically update contrast check
selectionService.onSelectionChange(async () => {
  // Auto-check when selection changes
  await checkContrastSelection();
});

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'CHECK_CONTRAST_SELECTION':
        await checkContrastSelection();
        break;

      case 'CHECK_CONTRAST_PAGE':
        const results = await contrastChecker.checkPage();
        figma.ui.postMessage({
          type: 'CONTRAST_PAGE_RESULT',
          success: true,
          data: results,
        });
        break;

      case 'get-theme':
        // Respond with current theme (if needed)
        figma.ui.postMessage({
          type: 'theme-changed',
          theme: 'light', // You can detect system theme here
        });
        break;

      default:
        console.log('Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    figma.ui.postMessage({
      type: msg.type + '_ERROR',
      success: false,
      error: error.message,
    });
  }
};
