import React from 'react';
import { Target, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import RevealHeading from './RevealHeading';

const steps = [
  {
    title: "Define the objective",
    number: "01",
    description: "Initialize your buyer agent with a task, a budget ceiling, and performance constraints.",
    icon: <Target className="w-4 h-4" />
  },
  {
    title: "Agents negotiate",
    number: "02",
    description: "Buyer and seller agents run sub-second, game-theoretic rounds to find Pareto-optimal terms.",
    icon: <MessageSquare className="w-4 h-4" />
  },
  {
    title: "Escrow locks funds",
    number: "03",
    description: "A Soroban smart contract deploys automatically on Stellar to hold the agreed deposit.",
    icon: <ShieldCheck className="w-4 h-4" />
  },
  {
    title: "Settlement releases",
    number: "04",
    description: "Funds move instantly over Stellar once deliverable verification is confirmed.",
    icon: <Zap className="w-4 h-4" />
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative bg-paper">
      <div className="column-frame max-w-6xl mx-auto px-6 sm:px-10 py-28">

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="section-rule mb-10"
        >
          <span className="kicker">02 — How it works</span>
        </motion.div>

        <RevealHeading
          text="One protocol, four steps to a settled deal"
          className="font-display font-semibold text-bark tracking-[-0.04em] leading-[1.02] text-[clamp(1.9rem,4.6vw,3.5rem)] max-w-[20ch] mb-20"
        />

        <div className="border-t border-line">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group grid grid-cols-[3rem_1fr] md:grid-cols-[7rem_minmax(0,14rem)_1fr] gap-x-6 md:gap-x-10 gap-y-3 items-baseline border-b border-line py-10 transition-colors duration-500 hover:bg-white/[0.015]"
            >
              <span className="font-display font-semibold text-4xl md:text-5xl text-white/10 group-hover:text-clay-500/70 transition-colors duration-500 select-none tabular-nums">
                {step.number}
              </span>

              <div className="col-start-2 md:col-start-2">
                <div className="flex items-center gap-3">
                  <span className="text-bark-faint group-hover:text-clay-400 transition-colors duration-500">
                    {step.icon}
                  </span>
                  <h3 className="text-lg font-semibold text-bark tracking-tight">
                    {step.title}
                  </h3>
                </div>
              </div>

              <p className="col-start-2 md:col-start-3 text-sm text-bark-muted leading-relaxed max-w-[46ch]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
