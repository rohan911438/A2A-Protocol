import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CTA = () => {
  const navigate = useNavigate();
  const { connected, toggleModal } = useWallet();

  return (
    <section className="py-44 px-6 overflow-hidden relative bg-black border-t border-white/5">
      {/* Visual glowing aura behind panel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[380px] bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 blur-[160px] rounded-full pointer-events-none -z-10 animate-neural-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
        className="max-w-4xl mx-auto text-center space-y-10 z-10 relative"
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-950/80 border border-white/5 text-[10px] font-mono uppercase tracking-[0.2em] text-purple-400">
          Genesis Node
        </div>
        
        <h2 className="text-5xl lg:text-[6.5rem] font-display font-black text-white leading-none uppercase tracking-tight">
          The Swarm <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Never Sleeps</span>
        </h2>
        
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed font-body font-medium opacity-80">
          Deploy your first autonomous negotiating agent today. Secure contract rules, automate payment releases, and run economic transactions trustlessly on Stellar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
          <motion.button
            onClick={() => connected ? navigate('/dashboard') : toggleModal()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto group relative px-6 py-3.5 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.06)] flex items-center justify-center gap-2"
          >
            <span>Launch Controller</span>
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
          
          <motion.button
            onClick={() => window.open('https://github.com/rohan911438/A2A-Protocol', '_blank')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-6 py-3.5 bg-zinc-950/80 border border-white/5 text-white font-mono uppercase tracking-wider text-[10px] rounded-xl hover:bg-zinc-900/50 transition-all hover:border-white/20"
          >
            Inspect GitHub Node
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
};

export default CTA;
