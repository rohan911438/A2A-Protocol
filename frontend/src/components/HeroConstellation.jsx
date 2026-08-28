import React, { useEffect, useRef } from 'react';
import { prefersLowMotion } from '../utils/perf';

/**
 * A living lattice of drifting nodes behind the hero headline. On its own
 * it's a slow ambient constellation - nodes float, and near-neighbours link
 * with hairline edges. The cursor is a real force in the field: nodes are
 * pushed out of its way and the ones within reach throw a bright line to
 * it, so the whole structure visibly parts and reforms around the pointer.
 *
 * Canvas, one rAF loop, DPR-aware. Fully skipped on the reduced-motion /
 * low-power / coarse-pointer paths (see utils/perf.js) - it renders nothing
 * and starts no loop there.
 */
export default function HeroConstellation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return undefined;
    if (prefersLowMotion()) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let nodes = [];

    // Pointer, in canvas-local px. Parked far off-screen until first move.
    const pointer = { x: -9999, y: -9999 };
    const LINK_DIST = 132;
    const POINTER_DIST = 220;

    const seedNodes = () => {
      const target = Math.max(28, Math.min(90, Math.round((width * height) / 15000)));
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        // slight warm/cool split so the field isn't monochrome
        warm: Math.random() > 0.5,
      }));
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    // `mouseleave` on document only fires when the cursor actually exits the
    // viewport - no per-element boundary noise, so the cursor lines don't
    // flicker while the pointer is still on the page.
    document.addEventListener('mouseleave', onLeave);

    let frame;
    const step = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];

        // Cursor repulsion - the field opens up around the pointer.
        const pdx = p.x - pointer.x;
        const pdy = p.y - pointer.y;
        const pd = Math.hypot(pdx, pdy);
        if (pd < POINTER_DIST && pd > 0.01) {
          const f = (1 - pd / POINTER_DIST) * 0.9;
          p.vx += (pdx / pd) * f;
          p.vy += (pdy / pd) * f;
        }

        // Drift + damping so nodes settle back to a lazy float after a shove.
        p.vx *= 0.94;
        p.vy *= 0.94;
        // Clamp top speed so a near-direct hit glides away instead of
        // snapping - keeps the motion smooth rather than chaotic.
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > 6) {
          p.vx = (p.vx / sp) * 6;
          p.vy = (p.vy / sp) * 6;
        }
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around the edges.
        if (p.x < -20) p.x = width + 20;
        else if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        else if (p.y > height + 20) p.y = -20;

        // Line to the cursor when in range.
        if (pd < POINTER_DIST) {
          const a = (1 - pd / POINTER_DIST) * 0.5;
          ctx.strokeStyle = `rgba(179,234,30,${a.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }

        // Links to nearby nodes.
        for (let j = i + 1; j < nodes.length; j++) {
          const q = nodes[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            const a = (1 - d / LINK_DIST) * 0.16;
            ctx.strokeStyle = `rgba(196,214,168,${a.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // The node itself.
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = p.warm ? 'rgba(179,234,30,0.55)' : 'rgba(94,240,214,0.5)';
        ctx.fill();
      }

      // Soft halo on the cursor node.
      if (pointer.x > -9000) {
        const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 90);
        g.addColorStop(0, 'rgba(179,234,30,0.10)');
        g.addColorStop(1, 'rgba(179,234,30,0)');
        ctx.fillStyle = g;
        ctx.fillRect(pointer.x - 90, pointer.y - 90, 180, 180);
      }

      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
    />
  );
}
