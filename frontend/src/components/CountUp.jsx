import React, { useEffect, useRef } from 'react';
import { useMotionValue, useTransform, animate, motion } from 'framer-motion';

/**
 * Animates a number counting up from 0 to `value` whenever `value` changes.
 * Small, purely presentational delight for stat tiles - no layout impact,
 * falls back to an instant jump under prefers-reduced-motion via framer's
 * own MotionConfig handling.
 */
const CountUp = ({ value, duration = 0.8, className = '' }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(count, value, { duration, ease: [0.22, 1, 0.36, 1] });
    prevValue.current = value;
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <motion.span className={className}>{rounded}</motion.span>;
};

export default CountUp;
