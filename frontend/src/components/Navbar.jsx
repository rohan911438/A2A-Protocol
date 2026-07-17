import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { LogOut, Wallet } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { account, connected, toggleModal, disconnect, formatAddress, balances, network } = useWallet();
  const [showBalance, setShowBalance] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-xl bg-zinc-950 border border-white/5 p-[1px] shadow-[0_0_20px_rgba(255,255,255,0.01)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] group-hover:border-zinc-800 transition-all duration-500">
            <div className="w-full h-full rounded-[10px] bg-[#000000] flex items-center justify-center overflow-hidden">
              {/* Background neural pulse in icon */}
              <div className="absolute inset-0 bg-white/[0.01] animate-neural-pulse" />
              <img src={logo} className="w-8 h-8 object-contain z-10 group-hover:scale-105 transition-transform duration-500" alt="Logo" />
            </div>
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-xl font-display font-bold text-white tracking-tighter uppercase group-hover:text-glow-white transition-all">
              A2A <span className="text-zinc-500 font-normal group-hover:text-zinc-400 transition-colors">PROTOCOL</span>
            </span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Neural Swarm Intelligence</span>
          </div>
          <div className="ml-2 px-2 py-0.5 rounded-full bg-zinc-950 border border-white/5 text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-tighter shadow-[0_0_15px_rgba(255,255,255,0.01)]">
            {network}
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {!connected ? (
            <NavLink
              to="/"
              className={({ isActive }) => `text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-white text-glow-white font-extrabold' : 'text-zinc-500 hover:text-white'}`}
            >
              Nexus
            </NavLink>
          ) : (
            <div className="flex items-center gap-10">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `text-[11px] font-bold uppercase tracking-widest transition-all duration-300 relative group ${isActive ? 'text-white font-extrabold' : 'text-zinc-500 hover:text-white'}`}
              >
                Control Center
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-white transition-all duration-500 group-hover:w-full shadow-[0_0_10px_rgba(255,255,255,0.4)]"></span>
              </NavLink>
              <NavLink
                to="/create-deal"
                className={({ isActive }) => `text-[11px] font-bold uppercase tracking-widest transition-all duration-300 relative group ${isActive ? 'text-white font-extrabold' : 'text-zinc-500 hover:text-white'}`}
              >
                Assemble Agent
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-white transition-all duration-500 group-hover:w-full shadow-[0_0_10px_rgba(255,255,255,0.4)]"></span>
              </NavLink>
            </div>
          )}

          <div className="flex items-center gap-4 relative">
            <button
              onClick={connected ? undefined : toggleModal}
              onMouseEnter={() => connected && setShowBalance(true)}
              onMouseLeave={() => setShowBalance(false)}
              className={`px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-500 flex items-center gap-2.5 ${connected
                  ? 'bg-zinc-950 border border-zinc-800 text-white cursor-default shadow-[inset_0_0_15px_rgba(255,255,255,0.03)]'
                  : 'bg-white text-black hover:bg-zinc-100 hover:scale-102 active:scale-98 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              {connected ? `${formatAddress(account)}` : 'Initiate Handshake'}
            </button>

            {connected && showBalance && (
              <div className="absolute top-16 right-0 z-50 rounded-2xl bg-zinc-950/95 border border-zinc-900 p-5 min-w-[240px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl animate-fadeInUp animate-floaty">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                    <span>Active Assets</span>
                    <span className="px-2 py-0.5 bg-zinc-900 rounded-full border border-zinc-800">{network}</span>
                  </div>
                  <div className="space-y-3">
                    {balances.length > 0 ? balances.map((b, i) => (
                      <div key={i} className="flex justify-between items-end border-b border-zinc-900/60 pb-2 last:border-0 group cursor-pointer hover:bg-zinc-900/40 p-1 rounded-lg transition-colors">
                        <span className="text-sm font-black text-white group-hover:text-white transition-colors">{parseFloat(b.balance).toFixed(4)}</span>
                        <span className="text-[10px] font-mono text-zinc-400 font-bold">{b.asset}</span>
                      </div>
                    )) : (
                      <div className="text-xs text-zinc-600 italic">Syncing with Stellar...</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {connected && (
              <button
                onClick={disconnect}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700 hover:bg-zinc-900/20 transition-all duration-300 group"
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
