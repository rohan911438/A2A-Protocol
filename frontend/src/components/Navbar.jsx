import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import { LogOut, Wallet } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { account, connected, toggleModal, disconnect, formatAddress, balances, network } = useWallet();
  const [showBalance, setShowBalance] = useState(false);
  const isHome = useLocation().pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/85 border-b border-line backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center overflow-hidden group-hover:border-clay-400/40 transition-colors duration-300">
            <img src={logo} className="w-7 h-7 object-contain group-hover:scale-105 transition-transform duration-500" alt="Logo" />
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-lg font-serif font-medium text-bark tracking-tight">
              A2A <span className="text-bark-faint font-normal">Protocol</span>
            </span>
            <span className="text-[9px] text-bark-faint font-semibold uppercase tracking-[0.25em]">Agent Economy on Stellar</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-9">
          {isHome ? (
            <>
              <a href="#how-it-works" className="text-[13px] font-medium text-bark-muted hover:text-bark transition-colors duration-300">How it works</a>
              <a href="#features" className="text-[13px] font-medium text-bark-muted hover:text-bark transition-colors duration-300">Capabilities</a>
              <a href="#developer-sdk" className="text-[13px] font-medium text-bark-muted hover:text-bark transition-colors duration-300">Developers</a>
            </>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `text-[13px] font-medium transition-colors duration-300 relative pb-1 ${isActive ? 'text-bark' : 'text-bark-muted hover:text-bark'}`}
              >
                {({ isActive }) => (
                  <>
                    Dashboard
                    {isActive && <motion.span layoutId="nav-underline" transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="absolute -bottom-0.5 left-0 right-0 h-px bg-clay-400" />}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/create-deal"
                className={({ isActive }) => `text-[13px] font-medium transition-colors duration-300 relative pb-1 ${isActive ? 'text-bark' : 'text-bark-muted hover:text-bark'}`}
              >
                {({ isActive }) => (
                  <>
                    New deal
                    {isActive && <motion.span layoutId="nav-underline" transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="absolute -bottom-0.5 left-0 right-0 h-px bg-clay-400" />}
                  </>
                )}
              </NavLink>
            </>
          )}

          <div className="flex items-center gap-3 relative">
            <button
              onClick={connected ? undefined : toggleModal}
              onMouseEnter={() => connected && setShowBalance(true)}
              onMouseLeave={() => setShowBalance(false)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-300 flex items-center gap-2 ${connected
                  ? 'bg-surface border border-line text-bark cursor-default'
                  : 'bg-clay-500 text-white hover:bg-clay-600 shadow-[0_6px_18px_rgba(217,119,87,0.25)]'
                }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              {connected ? formatAddress(account) : 'Connect wallet'}
            </button>

            {connected && showBalance && (
              <div className="absolute top-14 right-0 z-50 rounded-2xl bg-surface border border-line p-5 min-w-[240px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-fadeInUp">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] text-bark-faint uppercase tracking-widest font-bold">
                    <span>Active assets</span>
                    <span className="px-2 py-0.5 bg-paper-deep rounded-full">{network}</span>
                  </div>
                  <div className="space-y-3">
                    {balances.length > 0 ? balances.map((b, i) => (
                      <div key={i} className="flex justify-between items-end border-b border-line pb-2 last:border-0">
                        <span className="text-sm font-bold text-bark">{parseFloat(b.balance).toFixed(4)}</span>
                        <span className="text-[10px] font-mono text-bark-muted font-bold">{b.asset}</span>
                      </div>
                    )) : (
                      <div className="text-xs text-bark-faint italic">Syncing with Stellar...</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {connected && (
              <button
                onClick={disconnect}
                className="p-2.5 rounded-xl bg-surface border border-line text-bark-faint hover:text-clay-400 hover:border-clay-400/40 transition-all duration-300"
                title="Disconnect wallet"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
