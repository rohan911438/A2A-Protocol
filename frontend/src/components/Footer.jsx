import React from 'react';

const Footer = () => {
  return (
    <footer className="py-16 px-6 bg-ink-900 border-t border-white/5 h-auto relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        <div className="col-span-2 space-y-6">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aqua to-blush flex items-center justify-center">
                 <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              </div>
              <span className="text-xl font-display font-bold text-white uppercase tracking-tight">
                Agentic <span className="text-aqua">Exchange</span>
              </span>
           </div>
           <p className="max-w-xs text-sm text-slate leading-relaxed">
             Empowering the next generation of commerce through autonomous AI negotiating agents on the Algorand blockchain.
           </p>
        </div>

        <div className="space-y-6">
           <h4 className="text-sm font-bold text-white uppercase tracking-widest">Platform</h4>
           <ul className="space-y-4 text-xs font-mono text-slate tracking-tighter uppercase">
             <li><a href="#" className="hover:text-aqua transition-colors">How it works</a></li>
             <li><a href="#" className="hover:text-aqua transition-colors">Pricing</a></li>
             <li><a href="#" className="hover:text-aqua transition-colors">Agent Docs</a></li>
           </ul>
        </div>

        <div className="space-y-6 text-right">
           <h4 className="text-sm font-bold text-white uppercase tracking-widest">Community</h4>
           <ul className="space-y-4 text-xs font-mono text-slate tracking-tighter uppercase">
             <li><a href="#" className="hover:text-aqua transition-colors">Twitter</a></li>
             <li><a href="#" className="hover:text-aqua transition-colors">GitHub</a></li>
             <li><a href="#" className="hover:text-aqua transition-colors">Discord</a></li>
           </ul>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto pt-16 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-slate border-t border-white/5 mt-16">
         <div>© 2026 Agentic Exchange. Built with AI.</div>
         <div className="flex gap-4 uppercase tracking-tighter">
            <span>Powered by Algorand</span>
            <span>Verifiable Agreements</span>
         </div>
      </div>
    </footer>
  );
};

export default Footer;
