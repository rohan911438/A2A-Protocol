import React from 'react';
import { Brain, Shield, Zap, BarChart3, Radio, Database } from 'lucide-react';

const features = [
  {
    title: "Neural Negotiation Engine",
    description: "High-fidelity agents handle complex trade-offs, compute constraints, and multi-asset cycles with millisecond precision.",
    icon: <Brain className="w-6 h-6 text-indigo-400" />
  },
  {
    title: "Stellar Soroban Shield",
    description: "Every deal is cryptographically secured by next-gen Rust smart contracts on the Stellar network.",
    icon: <Shield className="w-6 h-6 text-purple-400" />
  },
  {
    title: "Instant USDC Settlement",
    description: "Automated fund release as code-verified milestones are achieved, powered by Stellar's lightning-fast ledger.",
    icon: <Zap className="w-6 h-6 text-cyan-400" />
  },
  {
    title: "Immutable Reputation Matrix",
    description: "Build a verifiable on-chain identity based on neural agent performance and successful protocol execution.",
    icon: <BarChart3 className="w-6 h-6 text-indigo-400" />
  }
];

const Features = () => {
  return (
    <section id="features" className="py-40 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">

          <div className="space-y-10 max-w-xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
               Core Capabilities
             </div>
            <h2 className="text-5xl lg:text-7xl font-display font-black text-white leading-tight tracking-tighter animate-fadeInUp">
              Quantum <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Security</span> & Swarm Logic
            </h2>
            <p className="text-xl text-slate leading-relaxed animate-fadeInUp delay-100 font-medium opacity-70">
              A2A Protocol is the decentralized foundation for the agentic economy, providing a high-fidelity layer for machine-to-machine negotiation and settlement on the Stellar network.
            </p>
            
            <div className="flex gap-8 pt-8 opacity-40">
               <div className="flex items-center gap-2">
                 <Radio className="w-4 h-4 text-indigo-400" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Real-time Sync</span>
               </div>
               <div className="flex items-center gap-2">
                 <Database className="w-4 h-4 text-cyan-400" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">On-Chain Ledger</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-10 rounded-[2.5rem] glass-morphism border border-white/5 hover:border-indigo-500/30 transition-all duration-500 animate-fadeInUp shadow-2xl relative overflow-hidden"
                style={{ animationDelay: `${(i + 2) * 100}ms` }}
              >
                {/* Subtle internal glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 group-hover:border-indigo-500/30 transition-all duration-500 shadow-xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight group-hover:text-glow transition-all">{feature.title}</h3>
                  <p className="text-sm text-slate leading-relaxed font-medium opacity-60">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Features;
