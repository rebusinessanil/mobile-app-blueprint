import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance: Enable passive event listeners globally
const supportsPassive = (() => {
  let passive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: () => { passive = true; return true; }
    });
    window.addEventListener('test', null as any, opts);
    window.removeEventListener('test', null as any, opts);
  } catch (e) {}
  return passive;
})();

// Make touch events passive by default for smoother scrolling
if (supportsPassive) {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    let newOptions = options;
    if (['touchstart', 'touchmove', 'wheel', 'mousewheel'].includes(type)) {
      if (typeof options === 'boolean') {
        newOptions = { capture: options, passive: true };
      } else if (typeof options === 'object' || options === undefined) {
        newOptions = { ...options, passive: options?.passive ?? true };
      }
    }
    return originalAddEventListener.call(this, type, listener, newOptions);
  };
}

// Render app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
