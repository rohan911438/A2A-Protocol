import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Terminal, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ChatDemo from './ChatDemo';
import MagneticButton from './MagneticButton';
import useMouseParallax from '../hooks/useMouseParallax';

// Slower, more deliberate entrance - one thing resolves, then the next,
// rather than a flurry.
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
  },
};

// Headline words slide up out of a clipped line, staggered - the signature
// motion of the whole page, kept, just paced a touch slower.
const headlineVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.25 },
  },
};

const wordVariants = {
  hidden: { y: '110%' },
  visible: {
    y: '0%',
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
  },
};

const blurInVariants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
  },
};

const Word = ({ children, className = '' }) => (
  <span className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em]">
    <motion.span variants={wordVariants} className={`inline-block ${className}`}>
      {children}
    </motion.span>
  </span>
);

// The headline names the product's three real stages (negotiate, settle,
// pay). A quiet travelling marker moves through them: the active word turns
// to the lime signature and gets a hairline underline. No flip, no glow
// storm - just a slow, legible shift.
const CycleWord = ({ active, children }) => (
  <span className="relative inline-block italic">
    <motion.span
      animate={{ color: active ? '#B3EA1E' : '#6E6E6E' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="inline-block"
    >
      {children}
    </motion.span>
    <motion.span
      className="absolute -bottom-1 left-0 h-px bg-clay-500"
      animate={{ scaleX: active ? 1 : 0, opacity: active ? 1 : 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{ originX: 0, width: '100%' }}
    />
  </span>
);

const Hero = () => {
  const navigate = useNavigate();
  const { connected, toggleModal, formatAddress, account } = useWallet();
  const sectionRef = useRef(null);
  const [activeVerb, setActiveVerb] = useState(0);

  useEffect(() => {
    let intervalId;
    const startDelay = setTimeout(() => {
      intervalId = setInterval(() => {
        setActiveVerb((v) => (v + 1) % 3);
      }, 3400);
    }, 2200);
    return () => {
      clearTimeout(startDelay);
      clearInterval(intervalId);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const { mouseX, mouseY } = useMouseParallax();
  const ghostX = useTransform(mouseX, [-0.5, 0.5], [-30, 30]);
  const ghostY = useTransform(mouseY, [-0.5, 0.5], [-18, 18]);
  const artifactRotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6]);
  const artifactRotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);

  const handleSpotlightMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleSpotlightMove}
      className="relative pt-40 pb-24 bg-paper overflow-hidden"
    >
      {/* Cursor spotlight - a single, restrained pointer-tracking wash. */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(700px circle at var(--spot-x, 30%) var(--spot-y, 40%), rgba(179,234,30,0.05), transparent 60%)',
        }}
      />

      {/* One faint atmospheric drift, far behind everything. */}
      <motion.div style={{ y: glowY }} className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="animate-aurora-a absolute top-[-20%] left-[-10%] w-[720px] h-[520px] bg-clay-500/[0.06] blur-[150px] rounded-full" />
        <div className="animate-aurora-c absolute top-[0%] right-[-15%] w-[620px] h-[420px] bg-moss-500/[0.05] blur-[150px] rounded-full" />
      </motion.div>

      {/* Oversized ghost wordmark, bled off the right edge as editorial
          texture and scale reference - not meant to be read. */}
      <motion.div
        style={{ x: ghostX, y: ghostY }}
        className="absolute right-[-8vw] top-[38%] -z-10 pointer-events-none select-none transition-transform duration-700 ease-out"
      >
        <span className="font-display font-extrabold text-[34vw] leading-none tracking-[-0.05em] text-white/[0.028] whitespace-nowrap">
          A2A
        </span>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ y: contentY, opacity: contentOpacity }}
        className="column-frame max-w-6xl mx-auto px-6 sm:px-10 relative z-10"
      >
        {/* Kicker rule */}
        <motion.div variants={itemVariants} className="section-rule mb-14">
          <span className="kicker text-bark-muted">A2A Protocol</span>
          <span className="kicker">Agent economy on Stellar</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-12 items-end">
          {/* Headline + copy - the anchor, left-aligned, wide measure */}
          <div className="lg:col-span-9">
            <motion.div variants={itemVariants} className="mb-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-moss-500" />
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-bark-faint">
                Live on Stellar Testnet — v1.0.4
              </span>
            </motion.div>

            <motion.h1
              variants={headlineVariants}
              className="font-display font-semibold text-bark tracking-[-0.045em] leading-[0.94] text-[clamp(2.5rem,8.4vw,6.75rem)]"
            >
              <span className="block">
                <Word>Autonomous</Word> <Word>agents</Word>
              </span>
              <span className="block">
                <Word>that</Word>{' '}
                <Word><CycleWord active={activeVerb === 0}>negotiate</CycleWord></Word>,
              </span>
              <span className="block">
                <Word><CycleWord active={activeVerb === 1}>settle</CycleWord></Word>{' '}
                <Word>&amp;</Word>{' '}
                <Word><CycleWord active={activeVerb === 2}>pay</CycleWord></Word>{' '}
                <Word>each</Word> <Word>other.</Word>
              </span>
            </motion.h1>

            <motion.p
              variants={blurInVariants}
              className="mt-10 text-[15px] sm:text-base text-bark-muted leading-relaxed max-w-[52ch]"
            >
              A2A Protocol lets AI agents find Pareto-optimal deals, lock terms in a Soroban
              smart escrow, and release payment automatically — no humans in the loop.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <MagneticButton
                onClick={() => (connected ? navigate('/dashboard') : toggleModal())}
                className="btn-clay inline-flex items-center gap-2 group"
              >
                <span>{connected ? 'Open dashboard' : 'Get started'}</span>
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </MagneticButton>

              <MagneticButton
                onClick={() => navigate('/demo')}
                className="inline-flex items-center gap-2 text-sm font-medium text-bark-muted hover:text-bark transition-colors group"
              >
                <Terminal size={14} />
                <span className="border-b border-transparent group-hover:border-clay-500/60 pb-0.5 transition-colors">
                  Run demo mode
                </span>
              </MagneticButton>

              {connected && (
                <span className="font-mono text-xs text-bark-faint">
                  {formatAddress(account)}
                </span>
              )}
            </motion.div>
          </div>

          {/* Technical rail - the spec sheet, right column on desktop */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-3 flex flex-col divide-y divide-line border-y border-line lg:border-l lg:border-y-0 lg:divide-y lg:pl-8"
          >
            <div className="py-5 lg:pt-0">
              <div className="font-mono text-[10px] text-bark-faint uppercase tracking-[0.28em]">Escrow security</div>
              <div className="mt-1.5 text-sm font-medium text-bark">Immutable Soroban contracts</div>
            </div>
            <div className="py-5 lg:pb-0">
              <div className="font-mono text-[10px] text-bark-faint uppercase tracking-[0.28em]">Network fee</div>
              <div className="mt-1.5 text-sm font-medium text-bark">~0.0001 XLM per contract</div>
            </div>
          </motion.div>
        </div>

        {/* The demo, framed as a titled artifact plate rather than a floating card */}
        <motion.div variants={itemVariants} className="mt-20" style={{ perspective: 1400 }}>
          <div className="section-rule mb-6">
            <span className="kicker">Live negotiation — agent transcript</span>
          </div>
          <motion.div
            style={{ rotateX: artifactRotateX, rotateY: artifactRotateY }}
            className="transition-transform duration-700 ease-out flex justify-center"
          >
            <ChatDemo />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
