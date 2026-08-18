import React from 'react';
import { motion, useTransform } from 'framer-motion';

/**
 * Ambient decorative orbit rings behind the Hero content. Two layers of
 * motion at once: each ring spins continuously on its own (pure CSS,
 * cheap), while the whole cluster tilts in 3D toward wherever the cursor
 * is on the page. mouseX/mouseY come from the shared useMouseParallax
 * source; smoothing is a plain CSS transition (see transition-transform
 * below), not a JS spring, so it can't be silently disabled by the app's
 * reduced-motion mode on lower-end devices.
 */
const CursorOrbit = ({ springX: mouseX, springY: mouseY }) => {
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [22, -22]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-22, 22]);

  return (
    <div
      className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none overflow-hidden"
      style={{ perspective: 1000 }}
      aria-hidden="true"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="relative w-[560px] h-[560px] max-w-[90vw] max-h-[90vw] transition-transform duration-500 ease-out"
      >
        <div className="animate-orbit-a absolute inset-0 rounded-full border border-clay-500/[0.16]" />
        <div className="animate-orbit-b absolute inset-10 rounded-full border border-moss-500/[0.14] border-dashed" />
        <div className="animate-orbit-c absolute inset-24 rounded-full border border-clay-400/[0.12]" />

        <div className="animate-orbit-a absolute inset-0">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-clay-500/70 shadow-[0_0_14px_rgba(179,234,30,0.6)]" />
        </div>
        <div className="animate-orbit-b absolute inset-10">
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-moss-500/70 shadow-[0_0_12px_rgba(34,221,190,0.6)]" />
        </div>
      </motion.div>
    </div>
  );
};

export default CursorOrbit;
