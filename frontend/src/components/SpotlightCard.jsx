import React, { useRef, useState } from 'react';

/**
 * A flat editorial plate that responds to the cursor with restraint: a very
 * faint light gathers under the pointer and the hairline border firms up.
 * No 3D tilt, no scale lift - those "floating card" cues are exactly what
 * the editorial direction moves away from. The glow is kept only as a quiet
 * "this surface is alive" signal.
 */
const SpotlightCard = ({ children, className = '', glow = 'rgba(179,234,30,0.06)' }) => {
  const ref = useRef(null);
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="paper-card relative overflow-hidden h-full"
    >
      {/* Opacity is driven by JS hover state, not a CSS `hover:` variant -
          this div has pointer-events-none (so it never blocks the card's
          own mouse tracking), and an element with pointer-events: none can
          never match its own :hover pseudo-class. A `hover:opacity-100`
          class here would silently never fire. */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${glow}, transparent 70%)`,
        }}
      />
      {/* Lime corner tick - the signature accent, one small mark per plate. */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-clay-500/0 transition-colors duration-500"
        style={{ borderColor: hovering ? 'rgba(179,234,30,0.5)' : 'rgba(179,234,30,0)' }}
      />
      <div className={`relative z-10 h-full ${className}`}>{children}</div>
    </div>
  );
};

export default SpotlightCard;
