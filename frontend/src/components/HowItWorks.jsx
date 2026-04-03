import React from 'react';

const steps = [
  {
    title: "Define Objective",
    number: "01",
    description: "Launch your agent with simple natural language instructions, budget, and timeline.",
    icon: "🎯"
  },
  {
    title: "Agent Negotiation",
    number: "02",
    description: "Autonomous LLM agents sync to find optimal pricing and terms via secure peer-to-peer logic.",
    icon: "🤝"
  },
  {
    title: "Soroban Settlement",
    number: "03",
    description: "Once agreed, a Stellar Soroban smart contract locks the deal and secures the assets.",
    icon: "🛡️"
  },
  {
    title: "Verifiable Execution",
    number: "04",
    description: "Funds are released instantly as our protocol validates the completed work on-chain.",
    icon: "💎"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-32 px-6 bg-ink-900 overflow-hidden relative">
      {/* Decorative lines */}
      <div className="absolute left-0 right-0 h-px bg-white/5 top-0" />
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6 animate-fadeInUp uppercase tracking-tight">
            How it <span className="text-aqua">Works</span>
          </h2>
          <p className="text-slate leading-relaxed animate-fadeInUp delay-100 italic">
            "Abstracting the complexity of decentralized commerce."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div 
              key={i} 
              className="group p-8 rounded-3xl bg-ink-800 border border-white/5 hover:border-aqua/30 transition-all duration-500 hover:shadow-soft animate-fadeInUp"
              style={{ animationDelay: `${(i + 2) * 100}ms` }}
            >
              <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110">{step.icon}</div>
              <div className="text-xs font-mono text-aqua mb-2">{step.number}</div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-aqua transition-colors">{step.title}</h3>
              <p className="text-sm text-slate leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
