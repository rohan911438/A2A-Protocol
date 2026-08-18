import React, { useRef } from 'react';

/**
 * A paper-card that tracks the cursor and reveals a soft warm glow under
 * it on hover. Plain DOM mutation (no React state) so the glow follows the
 * mouse at 60fps without triggering a re-render per pointer move.
 */
const SpotlightCard = ({ children, className = '', glow = 'rgba(217,119,87,0.10)' }) => {
  const ref = useRef(null);

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
      className="paper-card relative overflow-hidden h-full"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(480px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${glow}, transparent 65%)`,
        }}
      />
      <div className={`relative z-10 h-full ${className}`}>{children}</div>
    </div>
  );
};

export default SpotlightCard;
