import { useEffect } from "react";

// Wires pointer-drag panning (CSS pixels), wheel zoom (clamped), and
// mouse-parallax onto the target element. State is mutated through viewRef
// + setView so the RAF loop reads it without React re-renders.
export function usePointerNav({ targetRef, viewRef, setView }) {
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return undefined;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(e) {
      if (e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture?.(e.pointerId);
      el.style.cursor = "grabbing";
    }

    function onPointerMove(e) {
      const rect = el.getBoundingClientRect();

      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        const v = viewRef.current;
        setView({
          panPxX: v.panPxX + dx,
          panPxY: v.panPxY + dy,
        });
      } else {
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        // Negative so the world drifts away from the cursor (feels like
        // looking around a 3D scene rather than the cursor dragging it).
        setView({
          targetParallaxPxX: -nx * 36,
          targetParallaxPxY: -ny * 36,
        });
      }
    }

    function onPointerUp(e) {
      dragging = false;
      el.releasePointerCapture?.(e.pointerId);
      el.style.cursor = "grab";
    }

    function onPointerLeave() {
      setView({ targetParallaxPxX: 0, targetParallaxPxY: 0 });
    }

    function onWheel(e) {
      e.preventDefault();
      const v = viewRef.current;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const next = Math.min(4, Math.max(0.3, v.zoom * factor));
      setView({ zoom: next });
    }

    el.style.cursor = "grab";
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("wheel", onWheel);
    };
  }, [targetRef, viewRef, setView]);
}
