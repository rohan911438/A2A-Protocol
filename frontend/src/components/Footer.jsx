import React from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const Footer = () => {
  const isHome = useLocation().pathname === '/';

  if (isHome) {
    return (
      <footer className="py-20 px-6 border-t border-line relative z-10 bg-paper-soft">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">

          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface border border-line flex items-center justify-center">
                <img src={logo} className="w-6 h-6 object-contain" alt="Logo" />
              </div>
              <span className="text-lg font-serif font-medium text-bark">A2A Protocol</span>
            </div>
            <p className="max-w-md text-sm text-bark-muted leading-relaxed">
              The trust layer for autonomous agent commerce. Agents negotiate, settle, and pay each other on Stellar, with every transaction backed by a Soroban escrow.
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-moss-500" />
              <span className="text-xs font-medium text-bark-faint">
                Testnet <span className="text-bark">operational</span>
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <h4 className="text-xs font-semibold text-bark uppercase tracking-[0.2em] opacity-70">Product</h4>
            <ul className="space-y-3 text-sm text-bark-muted">
              <li><a href="#how-it-works" className="hover:text-clay-400 transition-colors">How it works</a></li>
              <li><a href="#features" className="hover:text-clay-400 transition-colors">Capabilities</a></li>
              <li><a href="#developer-sdk" className="hover:text-clay-400 transition-colors">Developer SDK</a></li>
            </ul>
          </div>

          <div className="space-y-5">
            <h4 className="text-xs font-semibold text-bark uppercase tracking-[0.2em] opacity-70">Community</h4>
            <ul className="space-y-3 text-sm text-bark-muted">
              <li><a href="https://github.com/rohan911438/A2A-Protocol" target="_blank" rel="noreferrer" className="hover:text-clay-400 transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-clay-400 transition-colors">X / Twitter</a></li>
              <li><a href="#" className="hover:text-clay-400 transition-colors">Discord</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-bark-faint border-t border-line mt-14">
          <div>© 2026 A2A Protocol. Built on Stellar.</div>
          <div className="flex gap-6">
            <span className="hover:text-bark transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-bark transition-colors cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="py-20 px-6 border-t border-white/5 relative z-10 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
        
        <div className="col-span-1 md:col-span-2 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.01)]">
              <img src={logo} className="w-6 h-6 object-contain" alt="Logo" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-display font-black text-white uppercase tracking-tighter">A2A Protocol</span>
              <span className="text-[9px] text-slate font-bold uppercase tracking-[0.3em] opacity-40">Neural Infrastructure</span>
            </div>
          </div>
          <p className="max-w-md text-xs text-slate leading-relaxed font-light opacity-80">
            The decentralized backbone for autonomous agent swarms. Settle, negotiate, and execute complex cross-agent logic on the Stellar network with millisecond finality.
          </p>
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
             <span className="text-[9px] font-mono font-bold text-slate uppercase tracking-widest opacity-60">
               Mainnet: <span className="text-cyan-400">Operational</span>
             </span>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] opacity-50">Systems</h4>
          <ul className="space-y-4 text-[9px] font-bold text-slate tracking-widest uppercase">
            <li><a href="#" className="hover:text-cyan-400 transition-all duration-300 hover:tracking-[0.35em] block">Nexus Core</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-all duration-300 hover:tracking-[0.35em] block">Agent Shards</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-all duration-300 hover:tracking-[0.35em] block">Neural Bridge</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-all duration-300 hover:tracking-[0.35em] block">Protocol Docs</a></li>
          </ul>
        </div>

        <div className="space-y-6 text-right md:text-right">
          <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] opacity-50">Pulse</h4>
          <ul className="space-y-4 text-[9px] font-bold text-slate tracking-widest uppercase">
            <li><a href="#" className="hover:text-purple-400 transition-all duration-300 hover:tracking-[0.35em] block">X / Twitter</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-all duration-300 hover:tracking-[0.35em] block">GitHub Repo</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-all duration-300 hover:tracking-[0.35em] block">Discord Swarm</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-all duration-300 hover:tracking-[0.35em] block">System Logs</a></li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-bold text-slate/40 border-t border-white/5 mt-16 uppercase tracking-[0.2em]">
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
