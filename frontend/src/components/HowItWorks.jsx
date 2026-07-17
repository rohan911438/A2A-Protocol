import React from 'react';
import { Target, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    title: "Define Objective",
    number: "01",
    description: "Initialize your buyer agent with normal task criteria, maximum budget boundaries, and performance constraints.",
    icon: <Target className="w-6 h-6 text-indigo-400" />
  },
  {
    title: "Swarm Negotiation",
    number: "02",
    description: "Agents compete in sub-second game-theoretic negotiation rounds to identify Pareto-optimal price and SLA values.",
    icon: <MessageSquare className="w-6 h-6 text-purple-400" />
  },
  {
    title: "Soroban Escrow",
    number: "03",
    description: "A secure Soroban smart contract is deployed automatically on Stellar to lock agreement parameters and deposits.",
    icon: <ShieldCheck className="w-6 h-6 text-cyan-400" />
  },
  {
    title: "Quantum Settlement",
    number: "04",
    description: "Funds are released instantly via XLM/USDC Stellar rails once deliverable verification proof is completed.",
    icon: <Zap className="w-6 h-6 text-indigo-400" />
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-36 px-6 relative overflow-hidden bg-black border-t border-white/5">
      {/* Background glow highlights */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto z-10 relative">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-28 space-y-6"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-950/80 border border-white/5 text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-400">
            Execution Lifecycle
          </div>
          <h2 className="text-4xl lg:text-[4.5rem] font-display font-black text-white leading-none uppercase tracking-tight">
            Operational Flow
          </h2>
          <p className="text-sm text-slate-400 font-body font-medium max-w-xl mx-auto leading-relaxed opacity-80">
            A2A Protocol abstracts the friction of multi-agent commerce into a highly organized four-phase transaction lifecycle.
          </p>
        </motion.div>

        {/* Timeline Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          
          {/* Horizontal Connector Line for Desktop */}
          <div className="hidden lg:block absolute top-[68px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 -z-10" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group p-8 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/10 transition-all duration-500 shadow-2xl relative flex flex-col justify-between min-h-[300px] cursor-default"
            >
              {/* Step counter tag */}
              <div className="absolute top-6 right-8 text-[32px] font-mono font-bold text-zinc-900/40 group-hover:text-zinc-800 transition-colors duration-500 select-none">
                {step.number}
              </div>

              <div>
                {/* Icon wrapper */}
                <div className="w-12 h-12 rounded-xl bg-black border border-white/5 flex items-center justify-center mb-10 group-hover:border-white/10 transition-all duration-300">
                  {step.icon}
                </div>
                
                {/* Phase tag */}
                <span className="text-[9px] font-mono font-bold text-cyan-400/70 uppercase tracking-widest block mb-2">
                  Phase {step.number}
                </span>

                <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-4">
                  {step.title}
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-light opacity-95">
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
