import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Terminal, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ChatDemo from './ChatDemo';
import MagneticButton from './MagneticButton';
import CursorOrbit from './CursorOrbit';
import useMouseParallax from '../hooks/useMouseParallax';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  }
};

// Headline words animate in as a staggered mask-reveal (slide up out of a
// clipped line) instead of the whole sentence fading in as one flat block -
// closer to how a title card is cut in film than a typical fade-up.
// headlineVariants is a pure timing container (no visual change of its
// own) so its word children stagger one after another instead of all
// popping in at once.
const headlineVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.15 },
  },
};

const wordVariants = {
  hidden: { y: '110%' },
  visible: {
    y: '0%',
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

// Body copy gets a blur-to-focus reveal rather than a word-by-word split -
// splitting a full sentence into individual words reads as slow/busy for
// paragraph-length text; reserving the word-mask treatment for headlines
// only and using this softer technique for supporting copy is what keeps
// the hierarchy premium instead of everything vying for attention at once.
const blurInVariants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const Word = ({ children, className = '' }) => (
  <span className="inline-block overflow-hidden pb-1 -mb-1">
    <motion.span variants={wordVariants} className={`inline-block ${className}`}>
      {children}
    </motion.span>
  </span>
);

// The headline names the product's three real stages (negotiate, settle,
// pay) - instead of only revealing once, a traveling highlight cycles
// through them continuously, so the sentence keeps demonstrating the
// product's actual flow rather than sitting static after load. Each word
// does a real 3D flip (like a flip-clock digit) as it becomes active,
// rather than just fading color.
const CycleWord = ({ active, children }) => (
  <motion.span
    animate={active ? { rotateX: [90, 0], color: '#B3EA1E' } : { rotateX: 0, color: '#9C9C9C' }}
    transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
    style={{ display: 'inline-block', transformPerspective: 300 }}
    className={`italic transition-[filter] duration-500 ${active ? 'drop-shadow-[0_0_18px_rgba(179,234,30,0.4)]' : ''}`}
  >
    {children}
  </motion.span>
);

const Hero = () => {
  const navigate = useNavigate();
  const { connected, toggleModal, formatAddress, account } = useWallet();
  const sectionRef = useRef(null);
  const [activeVerb, setActiveVerb] = useState(0);

  useEffect(() => {
    // Wait for the initial word-reveal to finish before the cycle starts,
    // so the two animations never visually collide.
    let intervalId;
    const startDelay = setTimeout(() => {
      intervalId = setInterval(() => {
        setActiveVerb((v) => (v + 1) % 3);
      }, 1800);
    }, 1600);
    return () => {
      clearTimeout(startDelay);
      clearInterval(intervalId);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  // Background drifts slower than the foreground as the visitor scrolls
  // past the hero - a cheap, classic depth cue.
  const glowY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // One shared cursor source for every reactive element below: the orbit
  // rings, the ghost wordmark, and the terminal card all move off this
  // instead of each tracking the mouse independently. Smoothing is CSS
  // (transition-transform, applied where each value is used) rather than
  // a JS spring - see useMouseParallax for why.
  const { mouseX, mouseY } = useMouseParallax();
  const ghostX = useTransform(mouseX, [-0.5, 0.5], [-40, 40]);
  const ghostY = useTransform(mouseY, [-0.5, 0.5], [-24, 24]);
  const terminalRotateX = useTransform(mouseY, [-0.5, 0.5], [14, -14]);
  const terminalRotateY = useTransform(mouseX, [-0.5, 0.5], [-14, 14]);
  const terminalX = useTransform(mouseX, [-0.5, 0.5], [-16, 16]);
  const terminalY = useTransform(mouseY, [-0.5, 0.5], [-16, 16]);

  // Belt-and-braces cursor reactivity: a spotlight glow that follows the
  // pointer, using the exact same plain-DOM-mutation technique as
  // SpotlightCard (CSS custom properties set directly via
  // style.setProperty on a native onMouseMove, no framer-motion value
  // pipeline involved at all). If anything about the motion-value-driven
  // effects above is being intercepted by something environment-specific,
  // this one doesn't share any of that machinery, so it's the most
  // reliable "something on screen visibly follows the cursor" signal in
  // the section.
  const handleSpotlightMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleSpotlightMove}
      className="relative pt-44 pb-28 px-6 bg-paper overflow-hidden"
    >
      {/* Cursor spotlight - a glow that tracks the pointer exactly, via
          plain CSS custom properties set on native mousemove (same proven
          technique as SpotlightCard, no framer-motion value pipeline). The
          single most direct "the UI is responding to you" signal in the
          section, layered under everything else. */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(650px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(179,234,30,0.10), transparent 60%)',
        }}
      />

      {/* Cinematic ambient glow - three slow-drifting warm blobs, parallaxed
          against scroll for depth, restrained in opacity so it reads as
          ambient light, not a spotlight. */}
      <motion.div style={{ y: glowY }} className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="animate-aurora-a absolute top-[-15%] left-[8%] w-[700px] h-[500px] bg-clay-500/10 blur-[130px] rounded-full" />
        <div className="animate-aurora-b absolute top-[-5%] right-[5%] w-[550px] h-[420px] bg-moss-500/[0.07] blur-[130px] rounded-full" />
        <div className="animate-aurora-c absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[380px] bg-clay-400/[0.06] blur-[140px] rounded-full" />
      </motion.div>

      <CursorOrbit springX={mouseX} springY={mouseY} />

      {/* Giant ghost wordmark - oversized, near-invisible type sitting behind
          the real content for scale/depth. Pure texture, not meant to be
          read; overflow-hidden on the section clips it at the edges. Drifts
          gently with the cursor for parallax depth, opposite direction from
          the orbit rings so the two layers separate rather than moving as
          one flat plane. */}
      <motion.div
        style={{ x: ghostX, y: ghostY }}
        className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none select-none overflow-hidden transition-transform duration-500 ease-out"
      >
        <span className="font-display font-extrabold text-[26vw] leading-none tracking-tighter text-white/[0.025] whitespace-nowrap">
          A2A
        </span>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ y: contentY, opacity: contentOpacity }}
        className="max-w-4xl w-full mx-auto text-center space-y-8 relative z-10"
      >
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-line text-xs font-medium text-bark-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-moss-500" />
            Live on Stellar Testnet — v1.0.4
          </div>
        </motion.div>

        <motion.h1
          variants={headlineVariants}
          className="text-5xl sm:text-6xl lg:text-7xl font-serif font-medium text-bark tracking-tight leading-[1.08]"
        >
          <span className="block">
            <Word>Autonomous</Word> <Word>agents</Word> <Word>that</Word>{' '}
            <Word><CycleWord active={activeVerb === 0}>negotiate</CycleWord></Word>,
          </span>
          <span className="block">
            <Word><CycleWord active={activeVerb === 1}>settle,</CycleWord></Word> <Word>and</Word>{' '}
            <Word><CycleWord active={activeVerb === 2}>pay</CycleWord></Word> <Word>each</Word> <Word>other.</Word>
          </span>
        </motion.h1>

        <motion.p
          variants={blurInVariants}
          className="text-lg text-bark-muted max-w-2xl mx-auto leading-relaxed"
        >
          A2A Protocol lets AI agents find Pareto-optimal deals, lock terms in a Soroban
          smart escrow, and release payment automatically — no humans in the loop.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
        >
          <MagneticButton
            onClick={() => connected ? navigate('/dashboard') : toggleModal()}
            className="w-full sm:w-auto btn-clay flex items-center justify-center gap-2 group"
          >
            <span>{connected ? 'Open dashboard' : 'Get started'}</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </MagneticButton>

          <MagneticButton
            onClick={() => navigate('/demo')}
            className="w-full sm:w-auto btn-clay-outline flex items-center justify-center gap-2"
          >
            <Terminal size={15} />
            <span>Run demo mode</span>
          </MagneticButton>

          {connected && (
            <span className="text-sm text-bark-faint font-medium px-2">
              Connected: {formatAddress(account)}
            </span>
          )}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="pt-10 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg mx-auto"
        >
          <div className="space-y-1">
            <div className="text-[11px] text-bark-faint font-semibold uppercase tracking-widest">Escrow security</div>
            <div className="text-sm font-medium text-bark">Immutable Soroban contracts</div>
          </div>
          <div className="space-y-1 sm:border-l sm:border-line sm:pl-6">
            <div className="text-[11px] text-bark-faint font-semibold uppercase tracking-widest">Network fee</div>
            <div className="text-sm font-medium text-bark">~0.0001 XLM per contract</div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="pt-14 w-full flex justify-center"
          style={{ perspective: 1200 }}
        >
          {/* The terminal card itself tilts toward the cursor - a concrete,
              visible piece of UI reacting to the visitor, not just
              background decoration. */}
          <motion.div
            style={{ rotateX: terminalRotateX, rotateY: terminalRotateY, x: terminalX, y: terminalY }}
            className="transition-transform duration-500 ease-out"
          >
            <ChatDemo />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
