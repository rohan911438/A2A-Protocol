import React from 'react';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="py-20 px-6 border-t border-white/5 relative z-10 bg-ink-900/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
        
        <div className="col-span-1 md:col-span-2 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-glow">
              <img src={logo} className="w-6 h-6 object-contain" alt="Logo" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-display font-black text-white uppercase tracking-tighter">A2A Protocol</span>
              <span className="text-[10px] text-slate font-bold uppercase tracking-[0.3em] opacity-40">Neural Infrastructure</span>
            </div>
          </div>
          <p className="max-w-md text-sm text-slate leading-relaxed font-medium opacity-80">
            The decentralized backbone for autonomous agent swarms. Settle, negotiate, and execute complex cross-agent logic on the Stellar network with millisecond finality.
          </p>
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
             <span className="text-[10px] font-mono font-bold text-slate uppercase tracking-widest opacity-60">
               Mainnet: <span className="text-cyan-400">Operational</span>
             </span>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] opacity-50">Systems</h4>
          <ul className="space-y-4 text-[10px] font-bold text-slate tracking-widest uppercase">
            <li><a href="#" className="hover:text-cyan-400 transition-all hover:tracking-[0.4em]">Nexus Core</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-all hover:tracking-[0.4em]">Agent Shards</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-all hover:tracking-[0.4em]">Neural Bridge</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-all hover:tracking-[0.4em]">Protocol Docs</a></li>
          </ul>
        </div>

        <div className="space-y-6 text-right md:text-right">
          <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] opacity-50">Pulse</h4>
          <ul className="space-y-4 text-[10px] font-bold text-slate tracking-widest uppercase">
            <li><a href="#" className="hover:text-purple-400 transition-all hover:tracking-[0.4em]">X / Twitter</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-all hover:tracking-[0.4em]">GitHub Repo</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-all hover:tracking-[0.4em]">Discord Swarm</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-all hover:tracking-[0.4em]">System Logs</a></li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-slate/40 border-t border-white/5 mt-16 uppercase tracking-[0.2em]">
        <div>© 2026 Neural Swarm Systems. Distributed Autonomous Entity.</div>
        <div className="flex gap-8">
          <span className="hover:text-white transition-colors cursor-pointer">Privacy Matrix</span>
          <span className="hover:text-white transition-colors cursor-pointer">Protocol Terms</span>
          <span className="hover:text-white transition-colors cursor-pointer">Stellar Core</span>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
