import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.05 },
  },
};

const wordVariants = {
  hidden: { y: '110%' },
  visible: {
    y: '0%',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Same word-by-word mask reveal as the Hero headline, generalized for any
 * section heading. Splits on spaces, wraps each word in an overflow-hidden
 * clip so it slides up into place - used so every section entrance feels
 * like the same deliberate system, not just the hero.
 */
const RevealHeading = ({ as: Tag = 'h2', text, className = '', once = true }) => {
  const words = text.split(' ');
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.6 }}
    >
      <Tag className={className}>
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-1 -mb-1 mr-[0.28em] last:mr-0">
            <motion.span variants={wordVariants} className="inline-block">
              {word}
            </motion.span>
          </span>
        ))}
      </Tag>
    </motion.div>
  );
};

export default RevealHeading;
