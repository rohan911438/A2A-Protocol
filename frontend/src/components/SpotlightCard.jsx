import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * A paper-card that tracks the cursor: a soft warm glow follows the pointer,
 * and the card tilts slightly in 3D toward it (perspective + rotateX/Y),
 * springing back flat on leave. Two classic "someone designed this" cues
 * combined on one element rather than a static box that just changes
 * border color on hover.
 */
const SpotlightCard = ({ children, className = '', glow = 'rgba(179,234,30,0.10)' }) => {
  const ref = useRef(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 220, damping: 20, mass: 0.5 });
  const springRotateY = useSpring(rotateY, { stiffness: 220, damping: 20, mass: 0.5 });
  const scale = useSpring(1, { stiffness: 220, damping: 20 });

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    el.style.setProperty('--spot-x', `${px}px`);
    el.style.setProperty('--spot-y', `${py}px`);

    const relX = (px / rect.width) - 0.5;
    const relY = (py / rect.height) - 0.5;
    rotateY.set(relX * 6);
    rotateX.set(relY * -6);
  };

  const handleMouseEnter = () => scale.set(1.012);
  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springRotateX, rotateY: springRotateY, scale, transformPerspective: 800 }}
      className="paper-card relative overflow-hidden h-full"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(480px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${glow}, transparent 65%)`,
        }}
      />
      <div className={`relative z-10 h-full ${className}`}>{children}</div>
    </motion.div>
  );
};

export default SpotlightCard;
