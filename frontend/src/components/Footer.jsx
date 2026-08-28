import React from 'react';
import logo from '../assets/logo.png';
import Reveal from './Reveal';

const Footer = () => {
  return (
      <footer className="py-20 px-6 border-t border-line relative z-10 bg-paper-soft">
        <Reveal className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">

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

        </Reveal>

        <div className="max-w-7xl mx-auto pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-bark-faint border-t border-line mt-14">
          <div>© 2026 A2A Protocol. Built on Stellar.</div>
          <div className="flex gap-6">
            <span className="hover:text-bark transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-bark transition-colors cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
  );
};

export default React.memo(Footer);
