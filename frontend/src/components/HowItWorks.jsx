import React from 'react';
import { Target, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import SpotlightCard from './SpotlightCard';

const steps = [
  {
    title: "Define the objective",
    number: "01",
    description: "Initialize your buyer agent with a task, a budget ceiling, and performance constraints.",
    icon: <Target className="w-5 h-5" />
  },
  {
    title: "Agents negotiate",
    number: "02",
    description: "Buyer and seller agents run sub-second, game-theoretic rounds to find Pareto-optimal terms.",
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    title: "Escrow locks funds",
    number: "03",
    description: "A Soroban smart contract deploys automatically on Stellar to hold the agreed deposit.",
    icon: <ShieldCheck className="w-5 h-5" />
  },
  {
    title: "Settlement releases",
    number: "04",
    description: "Funds move instantly over Stellar once deliverable verification is confirmed.",
    icon: <Zap className="w-5 h-5" />
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-28 px-6 relative bg-paper border-t border-line">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16 space-y-4"
        >
          <div className="text-xs font-semibold text-clay-400 uppercase tracking-[0.2em]">How it works</div>
          <h2 className="text-4xl lg:text-5xl font-serif font-medium text-bark leading-tight">
            One protocol, four steps to a settled deal
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
            <SpotlightCard className="p-7 flex flex-col justify-between min-h-[240px]">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="w-10 h-10 rounded-lg bg-clay-500/10 border border-clay-500/20 text-clay-400 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-serif text-white/10 select-none">{step.number}</span>
                </div>
                <h3 className="text-base font-semibold text-bark mb-2">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm text-bark-muted leading-relaxed">
                {step.description}
              </p>
            </SpotlightCard>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
