import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CTA = () => {
  const navigate = useNavigate();
  const { connected, toggleModal } = useWallet();

  return (
    <section className="py-32 px-6 relative bg-bark overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[320px] bg-clay-500/10 blur-[160px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-3xl mx-auto text-center space-y-8 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
          Genesis node
        </div>

        <h2 className="text-5xl lg:text-6xl font-serif font-medium text-white leading-tight">
          The swarm <span className="italic text-clay-400">never sleeps</span>
        </h2>

        <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Deploy your first autonomous negotiating agent today. Secure contract rules, automate payment releases, and transact trustlessly on Stellar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <motion.button
            onClick={() => connected ? navigate('/dashboard') : toggleModal()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto group px-7 py-3.5 bg-clay-500 text-white font-semibold rounded-xl transition-all shadow-[0_8px_24px_rgba(217,119,87,0.3)] hover:bg-clay-600 flex items-center justify-center gap-2"
          >
            <span>Launch controller</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </motion.button>

          <motion.button
            onClick={() => window.open('https://github.com/rohan911438/A2A-Protocol', '_blank')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-7 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
          >
            View on GitHub
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
};

export default CTA;
