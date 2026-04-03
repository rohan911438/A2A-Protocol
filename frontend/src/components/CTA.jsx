import React from 'react';

const CTA = () => {
  return (
    <section className="py-40 px-6 bg-ink-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-r from-aqua/20 to-blush/20 blur-[100px] rounded-full opacity-50 -z-10" />

      <div className="max-w-4xl mx-auto text-center space-y-10 animate-fadeInUp">
        <h2 className="text-5xl lg:text-7xl font-display font-extrabold text-white leading-tight">
          Let AI Handle <br />Your Deals.
        </h2>
        <p className="text-xl text-slate max-w-xl mx-auto leading-relaxed">
          Join the first autonomous negotiation marketplace. Secure, verifiable, and intelligent agreements starting now.
        </p>
        <button className="px-10 py-5 bg-white text-ink-900 font-bold rounded-2xl hover:bg-mist transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
          Start Your First Deal
        </button>
      </div>
    </section>
  );
};

export default CTA;
