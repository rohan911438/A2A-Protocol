import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import ChatDemo from './ChatDemo';

const Hero = () => {
  const navigate = useNavigate();
  const { connected, toggleModal } = useWallet();
  return (
    <section className="relative min-h-screen pt-32 pb-20 px-6 flex items-center justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center z-10">
        {/* Left Content */}
        <div className="space-y-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 animate-fadeInUp shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" />
            Stellar Soroban Infrastructure
          </div>

          <h1 className="text-6xl lg:text-8xl font-display font-black text-white leading-[0.95] tracking-tighter animate-fadeInUp delay-100">
            A2A <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Swarm</span> <br/>
            <span className="text-slate/40">Protocol</span>
          </h1>

          <p className="text-xl text-slate max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fadeInUp delay-200 font-medium opacity-80">
            Deploy autonomous neural agents that negotiate, settle, and execute high-fidelity deals on the Stellar network. Pure logic. Zero friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 animate-fadeInUp delay-300">
            <button
              onClick={() => connected ? navigate('/dashboard') : toggleModal()}
              className="group relative px-10 py-5 bg-indigo-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all duration-500 hover:scale-105 shadow-glow hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10">{connected ? 'Access Nexus' : 'Initialize Protocol'}</span>
            </button>
            <button className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-white/10 transition-all duration-300 hover:border-indigo-500/50">
              Technical Docs
            </button>
          </div>

          <div className="pt-12 flex items-center justify-center lg:justify-start gap-12 opacity-50 animate-fadeInUp delay-500 border-t border-white/5">
            <div className="text-center lg:text-left group cursor-default">
              <div className="text-3xl font-display font-black text-white uppercase tracking-tighter group-hover:text-indigo-400 transition-colors">Soroban</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate font-bold">Base Layer</div>
            </div>
            <div className="text-center lg:text-left group cursor-default">
              <div className="text-3xl font-display font-black text-white uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">USDC</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate font-bold">Settlement</div>
            </div>
          </div>
        </div>

        {/* Right Content - Chat Demo */}
        <div className="flex justify-center lg:justify-end animate-fadeInUp delay-400 relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[150px] rounded-full -z-10 animate-neural-pulse" />
          <ChatDemo />
        </div>
      </div>
    </section>
  );
};

export default Hero;
