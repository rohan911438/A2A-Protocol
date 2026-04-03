import React from 'react';

const features = [
  {
    title: "AI Negotiation Engine",
    description: "Powered by Gemini 2.5, our agents can handle complex trade-offs, timelines, and budgets.",
    icon: "🧠"
  },
  {
    title: "Trustless Escrow on Algorand",
    description: "Every deal is secured by highly scalable, low-cost smart contracts on the Algorand blockchain.",
    icon: "🏗️"
  },
  {
    title: "Milestone-Based Payments",
    description: "Release funds proportionally as work is verified, reducing risk for both buyers and sellers.",
    icon: "💰"
  },
  {
    title: "Reputation System",
    description: "Build an on-chain identity based on successfully completed deals and positive feedback.",
    icon: "📉"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-32 px-6 bg-ink-900 overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          <div className="space-y-8 max-w-lg">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6 animate-fadeInUp">
              Unmatched <span className="text-blush">Security</span> & Dynamic Agreements
            </h2>
            <p className="text-slate leading-relaxed animate-fadeInUp delay-100">
              Agentic Exchange is more than just a marketplace; it's an evolving decentralized negotiation layer that makes every deal more efficient.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
               <div 
                 key={i} 
                 className="p-8 rounded-3xl bg-ink-800 border border-white/5 hover:bg-ink-700/50 transition-all duration-300 animate-fadeInUp"
                 style={{ animationDelay: `${(i + 2) * 100}ms` }}
               >
                 <div className="text-2xl mb-4 grayscale group-hover:grayscale-0 transition-all">{feature.icon}</div>
                 <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                 <p className="text-sm text-slate leading-relaxed">
                   {feature.description}
                 </p>
               </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Features;
