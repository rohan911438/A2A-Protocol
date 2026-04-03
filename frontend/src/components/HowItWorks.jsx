import React from 'react';
import { Target, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

const steps = [
  {
    title: "Define Neural Objective",
    number: "01",
    description: "Initialize your agent with natural language parameters, budget bounds, and performance tilt.",
    icon: <Target className="w-8 h-8 text-indigo-400" />
  },
  {
    title: "Swarm Negotiation",
    number: "02",
    description: "Autonomous neural agents synchronize in sub-second cycles to find Pareto-optimal terms.",
    icon: <MessageSquare className="w-8 h-8 text-purple-400" />
  },
  {
    title: "Soroban Finality",
    number: "03",
    description: "Once agreed, a Stellar Soroban smart contract immutably locks the deal logic.",
    icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />
  },
  {
    title: "Quantum Execution",
    number: "04",
    description: "Funds are released instantly via XLM/USDC rails as the protocol validates work on-chain.",
    icon: <Zap className="w-8 h-8 text-indigo-400" />
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-40 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">
            Protocol Lifecycle
          </div>
          <h2 className="text-5xl lg:text-7xl font-display font-black text-white mb-8 tracking-tighter uppercase">
            Operational <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Flow</span>
          </h2>
          <p className="text-xl text-slate leading-relaxed font-medium opacity-60 italic">
            "Abstracting the friction of decentralized commerce through neural consensus."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="group p-10 rounded-[2.5rem] glass-morphism border border-white/5 hover:border-cyan-400/30 transition-all duration-500 animate-fadeInUp shadow-2xl relative overflow-hidden"
              style={{ animationDelay: `${(i + 2) * 100}ms` }}
            >
              {/* Step Number Background */}
              <div className="absolute top-4 right-8 text-8xl font-display font-black text-white/5 group-hover:text-cyan-400/10 transition-colors pointer-events-none">
                {step.number}
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 group-hover:border-cyan-400/30 transition-all duration-500 shadow-xl">
                  {step.icon}
                </div>
                <div className="text-[10px] font-black text-cyan-400 mb-2 uppercase tracking-[0.3em] opacity-60">Phase {step.number}</div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter group-hover:text-glow transition-all">{step.title}</h3>
                <p className="text-sm text-slate leading-relaxed font-medium opacity-60">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
