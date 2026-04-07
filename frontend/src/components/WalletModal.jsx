import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Layers, ShieldCheck, ExternalLink, Loader2, AlertCircle, Ship, Rabbit, Zap } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { walletService } from "../services/StellarWalletService";

const WalletModal = () => {
  const { isModalOpen, toggleModal, connect, connecting, error } = useWallet();
  const [availableWallets, setAvailableWallets] = useState({
    freighter: { installed: false, name: "Freighter" },
    rabet: { installed: false, name: "Rabet" },
    albedo: { installed: true, name: "Albedo" }
  });

  useEffect(() => {
    const checkWallets = async () => {
      const detected = await walletService.detectWallets();
      setAvailableWallets(detected);
    };
    if (isModalOpen) {
      checkWallets();
    }
  }, [isModalOpen]);

  const wallets = [
    {
      id: "freighter",
      name: "Freighter",
      icon: <Ship className="w-6 h-6 text-indigo-400" />,
      description: "Official Stellar browser extension",
      color: "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/50",
      installed: availableWallets.freighter?.installed,
      installLink: "https://www.freighter.app/"
    },
    {
      id: "rabet",
      name: "Rabet",
      icon: <Rabbit className="w-6 h-6 text-cyan-400" />,
      description: "Modern Stellar wallet for everyone",
      color: "bg-cyan-400/5 border-cyan-400/20 hover:border-cyan-400/50",
      installed: availableWallets.rabet?.installed,
      installLink: "https://rabet.io/"
    },
    {
      id: "albedo",
      name: "Albedo",
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      description: "Secure web-based Stellar signer",
      color: "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50",
      installed: true,
      installLink: "https://albedo.link/"
    }
  ];

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={toggleModal}
           className="absolute inset-0 bg-ink-900/90 backdrop-blur-xl"
        />

        {/* Modal */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 30 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.9, y: 30 }}
           className="relative w-full max-w-lg glass-morphism border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-10 border-b border-white/5 flex items-center justify-between relative overflow-hidden">
             {/* Decorative Background for header */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
             
             <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">
                   Security Protocol
                </div>
                <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Sign Into <span className="text-glow">Swarm</span></h2>
                <p className="text-xs text-slate font-medium opacity-60 tracking-wider">Authorize your neural identity to interact with A2A Protocol</p>
             </div>
             <button
               onClick={toggleModal}
               className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-slate hover:text-white"
             >
               <X className="w-6 h-6" />
             </button>
          </div>

          <div className="p-10 space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-start gap-4 mb-4"
              >
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300 font-medium leading-tight">{error}</p>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-4">
               {wallets.map((wallet) => (
                 <button
                   key={wallet.id}
                   disabled={connecting}
                   onClick={() => (wallet.id === "freighter" || wallet.installed) ? connect(wallet.id) : null}
                   className={`w-full group relative flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-500 ${
                     wallet.color
                   } ${!wallet.installed ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                 >
                   <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-ink-900/50 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all shadow-xl">
                     {wallet.icon}
                   </div>
                   
                   <div className="flex-grow text-left">
                     <div className="flex items-center gap-2">
                       <span className="text-lg font-black text-white uppercase tracking-tighter group-hover:text-glow transition-all">{wallet.name}</span>
                       {!wallet.installed && (
                         <span className="text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate font-black">
                           Absent
                         </span>
                       )}
                     </div>
                     <p className="text-xs text-slate font-medium opacity-60 mt-1">{wallet.description}</p>
                   </div>

                   {!wallet.installed && wallet.installLink && (
                     <a
                       href={wallet.installLink}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={(e) => e.stopPropagation()}
                       className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-cyan-400 transition-all border border-white/10"
                     >
                       <ExternalLink className="w-4 h-4" />
                     </a>
                   )}

                   {connecting && (
                     <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-md flex items-center justify-center rounded-[2rem] z-20">
                       <div className="flex flex-col items-center gap-3">
                         <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Syncing...</span>
                       </div>
                     </div>
                   )}
                 </button>
               ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-10 bg-white/5 text-center border-t border-white/5">
            <p className="text-[10px] text-slate font-bold uppercase tracking-[0.2em] opacity-40 leading-relaxed">
              By initializing handshake, you opt-in to the Swarm <br />
              <span className="text-indigo-400 cursor-pointer hover:underline">Neural Terms</span> and <span className="text-cyan-400 cursor-pointer hover:underline">Privacy Matrix</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalletModal;
