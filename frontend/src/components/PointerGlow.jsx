import React, { useEffect, useRef } from 'react';
import { prefersLowMotion } from '../utils/perf';

/**
 * A soft radius of light that follows the pointer inside whichever section
 * it's dropped into - the same trick the Hero uses, packaged so every
 * section can share it. Drop it as the first child of a `position: relative`
 * section; it fills the section, sits behind the content, and never eats
 * pointer events.
 *
 * Uses a native `mousemove` listener writing CSS custom properties directly
 * (no React state, no re-render), and fades the glow out when the pointer
 * leaves the section. Inert on the low-power path.
 */
export default function PointerGlow({
  color = 'rgba(179,234,30,0.10)',
  size = 520,
  className = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const section = el?.parentElement;
    if (!el || !section) return undefined;
    if (prefersLowMotion()) return undefined;

    const onMove = (e) => {
      const rect = section.getBoundingClientRect();
      el.style.setProperty('--px', `${e.clientX - rect.left}px`);
      el.style.setProperty('--py', `${e.clientY - rect.top}px`);
      el.style.opacity = '1';
    };
    const onLeave = () => {
      el.style.opacity = '0';
    };

    section.addEventListener('mousemove', onMove, { passive: true });
    section.addEventListener('mouseleave', onLeave);
    return () => {
      section.removeEventListener('mousemove', onMove);
      section.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ${className}`}
      style={{
        background: `radial-gradient(${size}px circle at var(--px, 50%) var(--py, 50%), ${color}, transparent 65%)`,
      }}
    />
  );
}
