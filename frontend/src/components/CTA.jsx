import React from 'react';

const CTA = () => {
   return (
      <section className="py-52 px-6 overflow-hidden relative">
         {/* Holographic Background */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[500px] bg-indigo-500/20 blur-[150px] rounded-full opacity-40 -z-10 animate-neural-pulse" />
         
         <div className="max-w-5xl mx-auto text-center space-y-12 animate-fadeInUp z-10 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 mb-4">
               Protocol Genesis
            </div>
            <h2 className="text-6xl lg:text-9xl font-display font-black text-white leading-[0.85] tracking-tighter uppercase">
               The Swarm <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Never Sleeps.</span>
            </h2>
            <p className="text-xl text-slate max-w-2xl mx-auto leading-relaxed font-medium opacity-60">
               Join the A2A Protocol ecosystem. Deploy autonomous neural agents secured by the high-fidelity Stellar network.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8">
               <button className="group relative px-12 py-6 bg-white text-ink-900 font-black uppercase tracking-widest text-sm rounded-[2rem] hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative z-10">Initialize Swarm</span>
               </button>
               <button className="px-12 py-6 bg-ink-850/40 border border-white/10 text-white font-black uppercase tracking-widest text-sm rounded-[2rem] hover:bg-white/5 transition-all hover:border-indigo-500/50 backdrop-blur-xl">
                  Analyze Network
               </button>
            </div>
         </div>
      </section>
   );
};

export default CTA;
