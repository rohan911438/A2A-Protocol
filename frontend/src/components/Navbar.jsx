import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { LogOut, Wallet, Cpu } from 'lucide-react';

const Navbar = () => {
  const { account, connected, toggleModal, disconnect, formatAddress, balances, network } = useWallet();
  const [showBalance, setShowBalance] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ink-900/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aqua via-indigo-500 to-blush flex items-center justify-center p-[1px]">
             <div className="w-full h-full rounded-[10px] bg-ink-900 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-aqua group-hover:scale-110 transition-transform" />
             </div>
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-xl font-display font-bold text-white tracking-tight uppercase">
              A2A <span className="text-aqua">Protocol</span>
            </span>
            <span className="text-[10px] text-slate font-medium uppercase tracking-[0.2em]">Next-Gen AI Labs</span>
          </div>
          <div className="ml-2 px-2 py-0.5 rounded-md bg-aqua/10 border border-aqua/30 text-[10px] font-mono font-bold text-aqua uppercase tracking-widest">
            {network}
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {!connected ? (
            <NavLink 
              to="/" 
              className={({ isActive }) => `text-sm font-medium transition-all duration-300 ${isActive ? 'text-aqua' : 'text-slate hover:text-white'}`}
            >
              Portal
            </NavLink>
          ) : (
            <div className="flex items-center gap-8">
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `text-sm font-medium transition-all duration-300 relative group ${isActive ? 'text-aqua' : 'text-slate hover:text-white'}`}
              >
                Agent Terminal
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-aqua transition-all duration-300 group-hover:w-full opacity-50"></span>
              </NavLink>
              <NavLink 
                to="/create-deal" 
                className={({ isActive }) => `text-sm font-medium transition-all duration-300 relative group ${isActive ? 'text-aqua' : 'text-slate hover:text-white'}`}
              >
                Provision Agent
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-aqua transition-all duration-300 group-hover:w-full opacity-50"></span>
              </NavLink>
            </div>
          )}
          
          <div className="flex items-center gap-2 relative">
            <button
              onClick={connected ? undefined : toggleModal}
              onMouseEnter={() => connected && setShowBalance(true)}
              onMouseLeave={() => setShowBalance(false)}
              className={`px-6 py-2.5 rounded-xl font-medium shadow-soft transition-all duration-300 flex items-center gap-2 ${
                connected 
                ? 'bg-ink-700 text-aqua border border-aqua/30 cursor-default' 
                : 'bg-gradient-to-r from-aqua to-blush text-ink-900 hover:shadow-[0_0_20px_rgba(94,240,255,0.4)]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              {connected ? `${formatAddress(account)}` : 'Initialize Wallet'}
            </button>
            {connected && showBalance && (
              <div className="absolute top-14 right-0 z-50 rounded-xl bg-ink-800/95 border border-white/10 p-4 min-w-[200px] shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-slate uppercase tracking-wider font-bold">
                    <span>Balances</span>
                    <span className="px-1.5 py-0.5 bg-white/5 rounded">{network}</span>
                  </div>
                  <div className="space-y-2">
                    {balances.length > 0 ? balances.map((b, i) => (
                      <div key={i} className="flex justify-between items-end border-b border-white/5 pb-1 last:border-0">
                        <span className="text-sm font-bold text-white">{parseFloat(b.balance).toFixed(4)}</span>
                        <span className="text-[10px] font-mono text-aqua">{b.asset}</span>
                      </div>
                    )) : (
                      <div className="text-xs text-slate italic">Awaiting network data...</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {connected && (
              <button
                onClick={disconnect}
                className="p-2.5 rounded-xl bg-ink-700 border border-white/10 text-slate hover:text-blush hover:border-blush/30 transition-all duration-300"
                title="Terminate Session"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
