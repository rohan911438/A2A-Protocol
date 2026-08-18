import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, ExternalLink, Loader2, AlertCircle, Ship, Rabbit, Sparkles } from "lucide-react";
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
      icon: <Ship className="w-6 h-6 text-clay-400" />,
      description: "Official Stellar browser extension",
      installed: availableWallets.freighter?.installed,
      installLink: "https://www.freighter.app/"
    },
    {
      id: "rabet",
      name: "Rabet",
      icon: <Rabbit className="w-6 h-6 text-moss-400" />,
      description: "Modern Stellar wallet for everyone",
      installed: availableWallets.rabet?.installed,
      installLink: "https://rabet.io/"
    },
    {
      id: "albedo",
      name: "Albedo",
      icon: <Sparkles className="w-6 h-6 text-clay-300" />,
      description: "Secure web-based Stellar signer",
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
           className="absolute inset-0 bg-paper-deep/90 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           className="relative w-full max-w-md paper-card overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-line flex items-center justify-between">
             <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-clay-500/10 border border-clay-500/20 text-[10px] font-semibold text-clay-400 mb-1">
                   <ShieldCheck size={11} /> Connect wallet
                </div>
                <h2 className="text-2xl font-serif font-medium text-bark">Connect a wallet</h2>
                <p className="text-xs text-bark-faint">Sign in with a Stellar wallet to create and manage deals</p>
             </div>
             <button
               onClick={toggleModal}
               className="p-2.5 bg-surface hover:bg-surface-raised border border-line rounded-xl transition-all text-bark-faint hover:text-bark"
             >
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="p-8 space-y-5">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200 leading-tight">{error}</p>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-3">
               {wallets.map((wallet) => (
                 <button
                   key={wallet.id}
                   disabled={connecting}
                   onClick={() => (wallet.id === "freighter" || wallet.installed) ? connect(wallet.id) : null}
                   className={`w-full group relative flex items-center gap-4 p-4 rounded-xl bg-surface border border-line transition-all duration-300 ${
                     !wallet.installed ? 'opacity-50 cursor-not-allowed' : 'hover:border-clay-400/40'
                   }`}
                 >
                   <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-surface-raised flex items-center justify-center border border-line">
                     {wallet.icon}
                   </div>

                   <div className="flex-grow text-left">
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-semibold text-bark">{wallet.name}</span>
                       {!wallet.installed && (
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised border border-line text-bark-faint font-medium">
                           Not installed
                         </span>
                       )}
                     </div>
                     <p className="text-xs text-bark-faint mt-0.5">{wallet.description}</p>
                   </div>

                   {!wallet.installed && wallet.installLink && (
                     <a
                       href={wallet.installLink}
                       target="_blank"
                       rel="noopener noreferrer"
                       onClick={(e) => e.stopPropagation()}
                       className="p-2.5 bg-surface-raised hover:bg-line rounded-xl text-clay-400 transition-all border border-line"
                     >
                       <ExternalLink className="w-4 h-4" />
                     </a>
                   )}

                   {connecting && (
                     <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
                       <div className="flex flex-col items-center gap-2">
                         <Loader2 className="w-6 h-6 animate-spin text-clay-400" />
                         <span className="text-[11px] font-medium text-clay-400">Connecting...</span>
                       </div>
                     </div>
                   )}
                 </button>
               ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-surface text-center border-t border-line">
            <p className="text-[11px] text-bark-faint leading-relaxed">
              By connecting, you agree to the <span className="text-clay-400 cursor-pointer hover:underline">Terms</span> and <span className="text-clay-400 cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalletModal;
