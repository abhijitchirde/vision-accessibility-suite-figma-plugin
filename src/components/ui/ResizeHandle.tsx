import * as React from "react";

/** Keyboard step for resizing with the arrow keys, in pixels */
const KEY_STEP = 20;

const send = (type: string, size?: { width: number; height: number }) =>
  parent.postMessage({ pluginMessage: { type, ...size } }, "*");

/**
 * Grip in the bottom-right corner that resizes the plugin window.
 * Drag it, or focus it and use the arrow keys. The plugin side clamps the
 * size, applies it with figma.ui.resize and remembers it per user.
 */
const ResizeHandle = () => {
  const drag = React.useRef<{
    startX: number;
    startY: number;
    width: number;
    height: number;
    frame: number | null;
    next: { width: number; height: number } | null;
  } | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      // Screen coordinates: the window itself moves under the pointer
      startX: event.screenX,
      startY: event.screenY,
      width: window.innerWidth,
      height: window.innerHeight,
      frame: null,
      next: null,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    state.next = {
      width: Math.round(state.width + event.screenX - state.startX),
      height: Math.round(state.height + event.screenY - state.startY),
    };
    // At most one resize message per animation frame
    if (state.frame === null) {
      state.frame = requestAnimationFrame(() => {
        state.frame = null;
        if (state.next) send("resize-window", state.next);
      });
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (state.frame !== null) cancelAnimationFrame(state.frame);
    if (state.next) send("resize-window", state.next);
    drag.current = null;
    send("save-window-size");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    send("resize-window", {
      width: window.innerWidth + delta[0],
      height: window.innerHeight + delta[1],
    });
    send("save-window-size");
  };

  return (
    <div
      className="resize-handle"
      role="button"
      tabIndex={0}
      aria-label="Resize plugin window (drag, or use the arrow keys)"
      title="Drag to resize"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M9 1 L1 9 M9 5 L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default ResizeHandle;
