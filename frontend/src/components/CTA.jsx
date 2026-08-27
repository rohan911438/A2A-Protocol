import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import MagneticButton from './MagneticButton';

const CTA = () => {
  const navigate = useNavigate();
  const { connected, toggleModal } = useWallet();

  return (
    <section className="relative bg-paper overflow-hidden">
      <div className="column-frame max-w-6xl mx-auto px-6 sm:px-10 pt-28 pb-40">

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="section-rule mb-16"
        >
          <span className="kicker">Genesis node</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-semibold text-white tracking-[-0.05em] leading-[0.88] text-[clamp(3rem,13vw,9rem)]"
        >
          The swarm<br />
          <span className="italic text-clay-500">never sleeps</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 text-base text-bark-muted leading-relaxed max-w-[48ch]"
        >
          Deploy your first autonomous negotiating agent today. Secure contract rules, automate payment releases, and transact trustlessly on Stellar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 border-t border-line pt-8 flex flex-wrap items-center gap-x-10 gap-y-4"
        >
          <MagneticButton
            onClick={() => (connected ? navigate('/dashboard') : toggleModal())}
            whileTap={{ scale: 0.98 }}
            className="btn-clay inline-flex items-center gap-2 group"
          >
            <span>Launch controller</span>
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </MagneticButton>

          <MagneticButton
            onClick={() => window.open('https://github.com/rohan911438/A2A-Protocol', '_blank')}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-bark-muted hover:text-bark transition-colors group"
          >
            <span className="border-b border-transparent group-hover:border-clay-500/60 pb-0.5 transition-colors">
              View on GitHub
            </span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </MagneticButton>
        </motion.div>

      </div>
    </section>
  );
};

export default CTA;
