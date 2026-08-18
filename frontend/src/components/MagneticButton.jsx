import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Wraps a button/link and makes it drift a few pixels toward the cursor on
 * hover, springing back on leave - a small, deliberate "someone designed
 * this" touch rather than a static rectangle. Subtle by design (max ~10px)
 * so it reads as polish, not a gimmick.
 */
const MagneticButton = ({ as: Component = 'button', className = '', children, strength = 14, ...props }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.4 });

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const relY = (e.clientY - rect.top - rect.height / 2) / rect.height;
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const MotionComponent = motion.create ? motion.create(Component) : motion(Component);

  return (
    <MotionComponent
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default MagneticButton;
