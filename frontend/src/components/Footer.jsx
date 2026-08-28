import React from 'react';
import logo from '../assets/logo.png';
import Reveal from './Reveal';

// Link with an underline that wipes in from the left on hover.
const FooterLink = ({ href, external = false, children }) => (
  <a
    href={href}
    {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    className="group relative inline-flex text-bark-muted hover:text-bark transition-colors duration-300"
  >
    {children}
    <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-clay-400 transition-all duration-300 ease-out group-hover:w-full" />
  </a>
);

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
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-moss-400 opacity-70 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-moss-500" />
              </span>
              <span className="text-xs font-medium text-bark-faint">
                Testnet <span className="text-bark">operational</span>
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <h4 className="text-xs font-semibold text-bark uppercase tracking-[0.2em] opacity-70">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><FooterLink href="#how-it-works">How it works</FooterLink></li>
              <li><FooterLink href="#features">Capabilities</FooterLink></li>
              <li><FooterLink href="#developer-sdk">Developer SDK</FooterLink></li>
            </ul>
          </div>

          <div className="space-y-5">
            <h4 className="text-xs font-semibold text-bark uppercase tracking-[0.2em] opacity-70">Community</h4>
            <ul className="space-y-3 text-sm">
              <li><FooterLink href="https://github.com/rohan911438/A2A-Protocol" external>GitHub</FooterLink></li>
              <li><FooterLink href="#">X / Twitter</FooterLink></li>
              <li><FooterLink href="#">Discord</FooterLink></li>
            </ul>
          </div>

        </Reveal>

        <div className="max-w-7xl mx-auto pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-bark-faint border-t border-line mt-14">
          <div>© 2026 A2A Protocol. Built on Stellar.</div>
          <div className="flex gap-6">
            <span className="group relative cursor-pointer text-bark-faint hover:text-bark transition-colors">
              Privacy
              <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-clay-400 transition-all duration-300 ease-out group-hover:w-full" />
            </span>
            <span className="group relative cursor-pointer text-bark-faint hover:text-bark transition-colors">
              Terms
              <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-clay-400 transition-all duration-300 ease-out group-hover:w-full" />
            </span>
          </div>
        </div>
      </footer>
  );
};

export default React.memo(Footer);
