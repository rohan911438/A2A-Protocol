import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import ChatDemo from './ChatDemo';

const Hero = () => {
  const navigate = useNavigate();
  const { connected, toggleModal } = useWallet();
  return (
    <section className="relative min-h-screen pt-32 pb-20 px-6 flex items-center justify-center overflow-hidden bg-grid-fade">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-aqua/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blush/10 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Content */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-[0.2em] text-slate animate-fadeInUp">
            <span className="w-1.5 h-1.5 rounded-full bg-aqua" />
            Empowering the Agentic Economy
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-display font-bold text-white leading-[1.1] animate-fadeInUp delay-100">
            Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-aqua to-blush">AI Agents</span> That Negotiate & Close Deals
          </h1>
          
          <p className="text-xl text-slate max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fadeInUp delay-200">
            Let AI handle pricing, agreements, and payments — secured by the blockchain. The most efficient way to trade services and assets.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fadeInUp delay-300">
            <button 
              onClick={() => connected ? navigate('/dashboard') : toggleModal()}
              className="px-8 py-4 bg-gradient-to-r from-aqua to-blush text-ink-900 font-bold rounded-xl transition-transform hover:scale-105 hover:shadow-[0_0_30px_rgba(94,240,255,0.3)]"
            >
              {connected ? 'Go to Dashboard' : 'Start a Deal'}
            </button>
            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
              Watch Demo
            </button>
          </div>

          {/* Social Proof / Stats can go here */}
          <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 opacity-40 animate-fadeInUp delay-500">
             <div className="text-center lg:text-left">
                <div className="text-2xl font-display font-bold text-white">1.2M+</div>
                <div className="text-[10px] uppercase tracking-widest text-slate">Negotiations</div>
             </div>
             <div className="text-center lg:text-left">
                <div className="text-2xl font-display font-bold text-white">$45M+</div>
                <div className="text-[10px] uppercase tracking-widest text-slate">Vol Securing</div>
             </div>
          </div>
        </div>

        {/* Right Content - Chat Demo */}
        <div className="flex justify-center lg:justify-end animate-fadeInUp delay-400">
          <ChatDemo />
        </div>
      </div>
    </section>
  );
};

export default Hero;
