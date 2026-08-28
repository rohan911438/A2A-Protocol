import React from 'react';
import { motion } from 'framer-motion';

/**
 * Generic "enters as you scroll to it" wrapper. Everything that scrolls into
 * view on this site should arrive the same way - a short blur-and-lift into
 * focus - so the page reads as one deliberate system instead of a stack of
 * independently-built sections. Section headings keep the sharper
 * word-by-word mask (RevealHeading); this is for the surrounding blocks.
 *
 * Respects reduced motion automatically: framer-motion's MotionConfig in
 * App.jsx forces these variants to a plain instant state when the visitor
 * (or a low-power device) has asked for less motion.
 */
const DIR = { up: 24, down: -24, none: 0 };

const Reveal = ({
  children,
  as = 'div',
  direction = 'up',
  delay = 0,
  amount = 0.35,
  once = true,
  className = '',
  ...rest
}) => {
  const MotionTag = motion[as] || motion.div;
  const y = DIR[direction] ?? 24;

  return (
    <MotionTag
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
};

export default Reveal;
