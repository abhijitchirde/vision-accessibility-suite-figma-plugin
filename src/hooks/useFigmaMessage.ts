import { useEffect } from "react";

interface UseFigmaMessageReturn {
  sendMessage: (type: string, data?: any) => void;
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
