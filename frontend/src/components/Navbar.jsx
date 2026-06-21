import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { LogOut, Wallet } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { account, connected, toggleModal, disconnect, formatAddress, balances, network } = useWallet();
  const [showBalance, setShowBalance] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-glow group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-500">
            <div className="w-full h-full rounded-[15px] bg-[#000000] flex items-center justify-center overflow-hidden">
              {/* Background neural pulse in icon */}
              <div className="absolute inset-0 bg-indigo-500/10 animate-neural-pulse" />
              <img src={logo} className="w-7 h-7 object-contain z-10 group-hover:scale-110 transition-transform duration-500" alt="Logo" />
            </div>
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-2xl font-display font-bold text-white tracking-tighter uppercase group-hover:text-glow transition-all">
              A2A <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Protocol</span>
            </span>
            <span className="text-[10px] text-slate font-bold uppercase tracking-[0.3em] opacity-70">Neural Swarm Intelligence</span>
          </div>
          <div className="ml-2 px-2.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-[10px] font-mono font-black text-cyan-400 uppercase tracking-tighter shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            {network}
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {!connected ? (
            <NavLink
              to="/"
              className={({ isActive }) => `text-sm font-bold uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-cyan-400 text-glow' : 'text-slate hover:text-white hover:tracking-[0.2em]'}`}
            >
              Nexus
            </NavLink>
          ) : (
            <div className="flex items-center gap-10">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `text-sm font-bold uppercase tracking-widest transition-all duration-300 relative group ${isActive ? 'text-indigo-400 text-glow' : 'text-slate hover:text-white hover:tracking-[0.2em]'}`}
              >
                Control Center
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-500 group-hover:w-full shadow-[0_0_10px_#6366f1]"></span>
              </NavLink>
              <NavLink
                to="/create-deal"
                className={({ isActive }) => `text-sm font-bold uppercase tracking-widest transition-all duration-300 relative group ${isActive ? 'text-purple-400 text-glow' : 'text-slate hover:text-white hover:tracking-[0.2em]'}`}
              >
                Assemble Agent
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-500 group-hover:w-full shadow-[0_0_10px_#a855f7]"></span>
              </NavLink>
            </div>
          )}

          <div className="flex items-center gap-4 relative">
            <button
              onClick={connected ? undefined : toggleModal}
              onMouseEnter={() => connected && setShowBalance(true)}
              onMouseLeave={() => setShowBalance(false)}
              className={`px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-500 flex items-center gap-3 ${connected
                ? 'bg-indigo-500/10 text-cyan-300 border border-cyan-400/30 cursor-default shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95'
                }`}
            >
              <Wallet className="w-4 h-4" />
              {connected ? `${formatAddress(account)}` : 'Initiate Handshake'}
            </button>

            {connected && showBalance && (
              <div className="absolute top-16 right-0 z-50 rounded-2xl bg-ink-850/90 border border-white/10 p-5 min-w-[240px] shadow-2xl backdrop-blur-3xl animate-fadeInUp">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] text-slate uppercase tracking-widest font-black opacity-60">
                    <span>Active Assets</span>
                    <span className="px-2 py-0.5 bg-white/5 rounded-full border border-white/10">{network}</span>
                  </div>
                  <div className="space-y-3">
                    {balances.length > 0 ? balances.map((b, i) => (
                      <div key={i} className="flex justify-between items-end border-b border-white/5 pb-2 last:border-0 group cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors">
                        <span className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">{parseFloat(b.balance).toFixed(4)}</span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">{b.asset}</span>
                      </div>
                    )) : (
                      <div className="text-xs text-slate italic opacity-50">Syncing with Stellar...</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {connected && (
              <button
                onClick={disconnect}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-all duration-300 group"
                title="Deauthorize Session"
              >
                <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
