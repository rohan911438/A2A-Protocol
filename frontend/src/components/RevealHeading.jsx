import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const wordVariants = {
  hidden: { y: '110%', rotateX: 40, filter: 'blur(6px)' },
  visible: {
    y: '0%',
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

const accentVariants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 } },
};

/**
 * Word-by-word reveal for section headings: each word slips up out of a
 * clip while unblurring and settling from a slight 3D tilt, so every
 * section entrance feels like the same deliberate system, not just the
 * hero. Pass `accent` to draw a short clay rule in under the heading on
 * the same reveal.
 */
const RevealHeading = ({ as: Tag = 'h2', text, className = '', once = true, accent = false }) => {
  const words = text.split(' ');
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.6 }}
      style={{ perspective: 800 }}
    >
      <Tag className={className}>
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-1 -mb-1 mr-[0.28em] last:mr-0">
            <motion.span variants={wordVariants} className="inline-block origin-bottom">
              {word}
            </motion.span>
          </span>
        ))}
      </Tag>
      {accent && (
        <motion.span
          aria-hidden="true"
          variants={accentVariants}
          className="mt-5 block h-0.5 w-14 origin-left rounded-full bg-clay-500"
        />
      )}
    </motion.div>
  );
};

export default RevealHeading;
