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
      staggerChildren: 0.18,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 75,
      damping: 16
    }
  }
};

const wordVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 14
    }
  }
};

const titleLine1 = "Autonomous Agents That".split(" ");
const titleLine2 = "Negotiate & Transact.".split(" ");

const Hero = () => {
  const navigate = useNavigate();
  const { connected, toggleModal, formatAddress, account } = useWallet();
  
  return (
    <section className="relative min-h-screen pt-36 pb-24 px-6 flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* 
        Removed all colored glow background coordinates to ensure the theme is complete pitch black.
        Retained the interactive mouse canvas background behind this section.
      */}

      {/* Main Container - Framer Motion Centered Flow */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl w-full mx-auto text-center space-y-10 z-10"
      >
        
        {/* Status Badge */}
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-[9px] font-mono uppercase tracking-[0.2em] text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            A2A_CORE_NODE_V1.0.4 // TESTNET:ACTIVE
          </div>
        </motion.div>

        {/* Headline - Centered high-end typography stagger & shimmer animation */}
        <motion.h1 
          variants={{
            hidden: { opacity: 1 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
          className="text-4xl sm:text-6xl lg:text-7xl font-display text-white tracking-tight leading-[1.08] max-w-5xl mx-auto font-black uppercase"
        >
          <span className="block sm:inline-block">
            {titleLine1.map((word, i) => (
              <motion.span 
                key={i} 
                variants={wordVariants} 
                className="inline-block mr-2.5 last:mr-0 text-glow-white"
              >
                {word}
              </motion.span>
            ))}
          </span>{' '}
          <br className="hidden sm:inline" />
          <span className="italic block sm:inline-block mt-1.5 sm:mt-0 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 animate-shimmer-glow">
            {titleLine2.map((word, i) => (
              <motion.span 
                key={i} 
                variants={wordVariants} 
                className="inline-block mr-2.5 last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        {/* Centered Spec Divider Row */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-center gap-4 text-[9px] font-mono text-zinc-400 uppercase tracking-[0.25em] font-bold"
        >
          <span>A2A Swarm Protocol</span>
          <span className="text-zinc-800 font-normal">•</span>
          <span>Stellar Soroban Escrow</span>
          <span className="text-zinc-800 font-normal">•</span>
          <span>v1.0.4-Alpha</span>
        </motion.div>

        {/* Centered Tagline - Bright White Writing */}
        <motion.p 
          variants={itemVariants}
          className="text-sm sm:text-base text-zinc-450 max-w-2xl mx-auto leading-relaxed font-body font-medium opacity-80"
        >
          A2A Protocol enables AI agents to coordinate, negotiate Pareto-optimal agreements, deploy Soroban-based smart escrows, and execute payments automatically on Stellar.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <button
            onClick={() => connected ? navigate('/dashboard') : toggleModal()}
            className="w-full sm:w-auto group px-6 py-3.5 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all duration-300 hover:bg-zinc-100 hover:scale-102 active:scale-98 shadow-[0_0_35px_rgba(255,255,255,0.06)] flex items-center justify-center gap-2"
          >
            <span>Launch Swarm Controller</span>
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          
          <button 
            onClick={connected ? undefined : toggleModal}
            className={`w-full sm:w-auto px-6 py-3.5 font-mono uppercase tracking-wider text-[10px] rounded-xl transition-all duration-300 border ${
              connected 
              ? 'bg-zinc-950 border-white/10 text-white cursor-default shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]' 
              : 'bg-zinc-950 border-white/5 text-white hover:bg-zinc-900 hover:border-white/20'
            }`}
          >
            {connected ? `Connected: ${formatAddress(account)}` : 'Initiate Handshake'}
          </button>

          <button
            onClick={() => navigate('/demo')}
            className="w-full sm:w-auto px-6 py-3.5 font-mono uppercase tracking-wider text-[10px] rounded-xl transition-all duration-300 border bg-zinc-950 border-white/5 text-white hover:bg-zinc-900 hover:border-white/20 flex items-center justify-center gap-2"
          >
            <Terminal size={11} />
            <span>Run Demo Mode</span>
          </button>
        </motion.div>

        {/* Technical Specs Columns - High Contrast White text */}
        <motion.div 
          variants={itemVariants}
          className="pt-8 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl mx-auto"
        >
          <div className="space-y-1 flex flex-col items-center">
            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">SEC_AUDIT_STATUS</div>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Soroban Escrow Immutability
            </div>
          </div>
          <div className="space-y-1 sm:border-l sm:border-zinc-900 sm:pl-6 flex flex-col items-center">
            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">NETWORK_GAS_LIMIT</div>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              ~0.0001 XLM / Contract
            </div>
          </div>
        </motion.div>

        {/* Centered Terminal Simulator */}
        <motion.div 
          variants={itemVariants}
          className="pt-16 w-full max-w-2xl mx-auto flex justify-center"
        >
          <ChatDemo />
        </motion.div>

      </motion.div>
    </section>
  );
};

export default Hero;
