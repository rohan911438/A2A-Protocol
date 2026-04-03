import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Ship, Rabbit } from 'lucide-react';
import ChatDemo from './ChatDemo';

const Hero = () => {
  const navigate = useNavigate();
  const { connected, toggleModal, formatAddress, account } = useWallet();
  
  return (
    <section className="relative min-h-screen pt-32 pb-20 px-6 flex items-center justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center z-10">
        {/* Left Content */}
        <div className="space-y-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 animate-fadeInUp shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" />
            Neural Economic Layer
          </div>

          <h1 className="text-6xl lg:text-8xl font-display font-black text-white leading-[0.95] tracking-tighter animate-fadeInUp delay-100">
            Autonomous Agents <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Negotiate, Transact,</span> <br/>
            <span className="text-slate/40">& Execute.</span>
          </h1>

          <p className="text-xl text-slate max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fadeInUp delay-200 font-medium opacity-80">
            A2A Protocol enables AI agents to interact and perform real economic transactions using Stellar-based payments. Secure, autonomous, and lightning-fast.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 animate-fadeInUp delay-300">
            <button
              onClick={() => connected ? navigate('/dashboard') : toggleModal()}
              className="group relative px-10 py-5 bg-indigo-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all duration-500 hover:scale-105 shadow-glow hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10">Launch Agent</span>
            </button>
            
            <button 
              onClick={connected ? undefined : toggleModal}
              className={`px-10 py-5 font-black uppercase tracking-widest text-sm rounded-2xl transition-all duration-300 border ${
                connected 
                ? 'bg-white/10 border-cyan-400/30 text-cyan-400 cursor-default shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]' 
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-indigo-500/50'
              }`}
            >
              {connected ? `Connected: ${formatAddress(account)}` : 'Connect Wallet'}
            </button>
          </div>

          <div className="pt-12 flex items-center justify-center lg:justify-start gap-12 opacity-50 animate-fadeInUp delay-500 border-t border-white/5">
            <div className="flex items-center gap-4 group cursor-default">
               <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/30 transition-all">
                  <Ship className="w-5 h-5 text-indigo-400" />
               </div>
               <div>
                  <div className="text-xl font-display font-black text-white uppercase tracking-tighter">Freighter</div>
                  <div className="text-[8px] uppercase tracking-[0.3em] text-slate font-bold">Supported</div>
               </div>
            </div>
            <div className="flex items-center gap-4 group cursor-default">
               <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-cyan-400/30 transition-all">
                  <Rabbit className="w-5 h-5 text-cyan-400" />
               </div>
               <div>
                  <div className="text-xl font-display font-black text-white uppercase tracking-tighter">Rabet</div>
                  <div className="text-[8px] uppercase tracking-[0.3em] text-slate font-bold">Supported</div>
               </div>
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
