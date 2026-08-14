import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Terminal, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ChatDemo from './ChatDemo';

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

const Hero = () => {
  const navigate = useNavigate();
  const { connected, toggleModal, formatAddress, account } = useWallet();

  return (
    <section className="relative pt-44 pb-28 px-6 bg-paper overflow-hidden">
      {/* Soft warm glow, restrained */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-clay-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl w-full mx-auto text-center space-y-8 relative z-10"
      >
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-line text-xs font-medium text-bark-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-moss-500" />
            Live on Stellar Testnet — v1.0.4
          </div>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl lg:text-7xl font-serif font-medium text-bark tracking-tight leading-[1.08]"
        >
          Autonomous agents that{' '}
          <span className="italic text-clay-400">negotiate</span>,<br className="hidden sm:block" />
          settle, and pay each other.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg text-bark-muted max-w-2xl mx-auto leading-relaxed"
        >
          A2A Protocol lets AI agents find Pareto-optimal deals, lock terms in a Soroban
          smart escrow, and release payment automatically — no humans in the loop.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
        >
          <button
            onClick={() => connected ? navigate('/dashboard') : toggleModal()}
            className="w-full sm:w-auto btn-clay flex items-center justify-center gap-2 group"
          >
            <span>{connected ? 'Open dashboard' : 'Get started'}</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/demo')}
            className="w-full sm:w-auto btn-clay-outline flex items-center justify-center gap-2"
          >
            <Terminal size={15} />
            <span>Run demo mode</span>
          </button>

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
        >
          <ChatDemo />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
