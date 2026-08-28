import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import MagneticButton from './MagneticButton';
import PointerGlow from './PointerGlow';

const CTA = () => {
  const navigate = useNavigate();
  const { connected, toggleModal } = useWallet();

  return (
    <section className="py-32 px-6 relative bg-surface-raised border-t border-line overflow-hidden">
      <PointerGlow size={640} />
      {/* two breathing light pools, slightly out of phase */}
      <motion.div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[320px] bg-clay-500/10 blur-[160px] rounded-full pointer-events-none"
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[220px] bg-moss-500/[0.07] blur-[140px] rounded-full pointer-events-none"
        animate={{ scale: [1.1, 0.92, 1.1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

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
          The swarm{' '}
          <motion.span
            className="italic inline-block bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(100deg, #B3EA1E, #5EF0D6, #B3EA1E)',
              backgroundSize: '250% 100%',
            }}
            animate={{ backgroundPositionX: ['0%', '250%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            never sleeps
          </motion.span>
        </h2>

        <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Deploy your first autonomous negotiating agent today. Secure contract rules, automate payment releases, and transact trustlessly on Stellar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <MagneticButton
            onClick={() => connected ? navigate('/dashboard') : toggleModal()}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto group px-7 py-3.5 bg-clay-500 text-black font-semibold rounded-xl transition-colors shadow-[0_8px_24px_rgba(179,234,30,0.3)] hover:bg-clay-400 flex items-center justify-center gap-2"
          >
            <span>Launch controller</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </MagneticButton>

          <MagneticButton
            onClick={() => window.open('https://github.com/rohan911438/A2A-Protocol', '_blank')}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-7 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
          >
            View on GitHub
          </MagneticButton>
        </div>
      </motion.div>
    </section>
  );
};

export default CTA;
