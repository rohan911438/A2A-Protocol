import React, { useEffect, useRef } from 'react';
import { prefersLowMotion } from '../utils/perf';

/**
 * Site-wide pointer companion: a small solid dot that tracks the cursor
 * 1:1 with zero lag, and a larger ring that chases it with spring-like lag
 * and swells over anything interactive. This is the main "something is
 * always moving with the cursor" element the rest of the page layers on
 * top of (section pointer-glows, magnetic buttons, card tilt).
 *
 * Implementation notes, matching the conventions already in this codebase
 * (see hooks/useMouseParallax.js):
 * - No React state on the hot path. Position is written straight to the
 *   DOM (`transform`) on `mousemove`, and the ring is advanced by a single
 *   rAF lerp loop. A re-render per mouse move would be unusable.
 * - Purely opt-out: disabled on touch / coarse-pointer devices, when the
 *   visitor asked for reduced motion, and on the low-power path
 *   (`data-perf="low"`, set in App.jsx). In any of those cases the native
 *   cursor is left exactly as-is and nothing renders.
 * - The native cursor is only hidden once this component has mounted and
 *   confirmed it should run, via a class on <html> - so a JS failure can
 *   never leave the page with no visible pointer.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const finePointer = window.matchMedia?.('(pointer: fine)').matches;
    if (!finePointer || prefersLowMotion()) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    root.classList.add('has-custom-cursor');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let hovering = false;
    let down = false;
    let visible = false;
    let frame;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
    };

    // Any element that reads as interactive swells the ring and hollows the
    // dot. `closest` so it also fires for the icon/span inside a button.
    const interactiveSel = 'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="hover"]';
    const onOver = (e) => {
      if (e.target.closest?.(interactiveSel)) hovering = true;
    };
    const onOut = (e) => {
      if (e.target.closest?.(interactiveSel)) hovering = false;
    };
    const onDown = () => { down = true; };
    const onUp = () => { down = false; };
    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const tick = () => {
      // Critically-damped-ish chase: the ring eases ~18% of the remaining
      // gap per frame, so it trails the dot and settles without wobble.
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      const scale = down ? 0.7 : hovering ? 1.9 : 1;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
      ring.style.borderColor = hovering ? 'rgba(179,234,30,0.9)' : 'rgba(179,234,30,0.35)';
      dot.style.opacity = visible ? (hovering ? '0' : '1') : '0';
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mouseout', onOut, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mouseout', onOut);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      root.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[300] h-9 w-9 rounded-full border-2 will-change-transform"
        style={{ opacity: 0, transition: 'opacity 0.3s ease, border-color 0.25s ease' }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[300] h-2 w-2 rounded-full bg-clay-400 will-change-transform shadow-[0_0_12px_rgba(179,234,30,0.8)]"
        style={{ opacity: 0, transition: 'opacity 0.2s ease' }}
      />
    </>
  );
}
