import { useEffect } from 'react';
import { useMotionValue } from 'framer-motion';

/**
 * Tracks the cursor position across the whole viewport, normalized to
 * -0.5..0.5 on each axis. Deliberately does NOT use useSpring: framer's
 * MotionConfig reducedMotion setting (this app sets it to "always" on
 * lower-end devices - see App.jsx, triggered by something as common as a
 * quad-core CPU) disables spring/tween animations, which silently killed
 * the smoothing here and made the whole effect look like it wasn't
 * running at all. Raw motion values bound via the `style` prop aren't
 * gated by reducedMotion, and smoothing is done with a plain CSS
 * `transition: transform` on the consuming element instead (see the
 * `transition-transform` classes where these values are used) - the
 * browser interpolates the inline transform framer writes, no JS spring
 * involved, so it can't be silently disabled the same way.
 */
const useMouseParallax = () => {
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

  return { mouseX, mouseY };
};

export default useMouseParallax;
