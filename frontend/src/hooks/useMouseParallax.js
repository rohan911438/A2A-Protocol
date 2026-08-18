import { useEffect } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

/**
 * Tracks the cursor position across the whole viewport, normalized to
 * -0.5..0.5 on each axis and spring-damped so it trails smoothly instead
 * of snapping. Shared by every cursor-reactive element in a section (the
 * orbit rings, the ghost wordmark, the terminal card) so they all move
 * off one consistent source instead of each attaching its own listener.
 */
const useMouseParallax = (springConfig = { stiffness: 40, damping: 20, mass: 0.6 }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMove = (e) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  return { springX, springY };
};

export default useMouseParallax;
