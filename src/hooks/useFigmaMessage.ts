import { useEffect } from "react";

interface UseFigmaMessageReturn {
  sendMessage: (type: string, data?: any) => void;
}

/**
 * Resolve with the next plugin message of the given type.
 * Call it *before* sending the request, so a fast reply isn't missed.
 */
export function waitForPluginMessage(
  type: string,
  timeoutMs: number = 60000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (msg?.type === type) {
        cleanup();
        resolve(msg);
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Figma took too long to respond"));
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("message", handler);
    };
    window.addEventListener("message", handler);
  });
}

export function useFigmaMessage(): UseFigmaMessageReturn {
  const sendMessage = (type: string, data?: any) => {
    if (typeof parent !== "undefined" && parent.postMessage) {
      parent.postMessage(
        {
          pluginMessage: {
            type,
            data,
          },
        },
        "*"
      );
    }
  };

  return {
    sendMessage,
  };
}
