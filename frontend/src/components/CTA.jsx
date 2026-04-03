import React from 'react';

const CTA = () => {
  return (
    <section className="py-40 px-6 bg-ink-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-r from-aqua/20 to-blush/20 blur-[100px] rounded-full opacity-50 -z-10" />

      <div className="max-w-4xl mx-auto text-center space-y-10 animate-fadeInUp">
        <h2 className="text-5xl lg:text-7xl font-display font-extrabold text-white leading-tight uppercase">
          Agentic <br />Future is Now.
        </h2>
        <p className="text-xl text-slate max-w-xl mx-auto leading-relaxed">
          Join the A2A Protocol ecosystem. Deploy autonomous negotiation agents secured by the Stellar network.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button className="px-10 py-5 bg-white text-ink-900 font-bold rounded-2xl hover:bg-mist transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            Initialize Your Agent
          </button>
          <button className="px-10 py-5 bg-ink-700 border border-white/10 text-white font-bold rounded-2xl hover:bg-ink-600 transition-all">
            Join the Network
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
