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
      icon: <Ship className="w-6 h-6 text-aqua" />,
      description: "Official Stellar browser extension",
      color: "bg-aqua/10 border-aqua/20 hover:border-aqua/50",
      installed: availableWallets.freighter?.installed,
      installLink: "https://www.freighter.app/"
    },
    {
      id: "rabet",
      name: "Rabet",
      icon: <Rabbit className="w-6 h-6 text-lime" />,
      description: "Modern Stellar wallet for everyone",
      color: "bg-lime/10 border-lime/20 hover:border-lime/50",
      installed: availableWallets.rabet?.installed,
      installLink: "https://rabet.io/"
    },
    {
      id: "albedo",
      name: "Albedo",
      icon: <Zap className="w-6 h-6 text-blush" />,
      description: "Secure web-based Stellar signer",
      color: "bg-blush/10 border-blush/20 hover:border-blush/50",
      installed: true,
      installLink: "https://albedo.link/"
    }
  ];

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleModal}
          className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-ink-800 border border-white/10 rounded-3xl shadow-soft overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-display font-bold text-white">Connect Wallet</h2>
              <p className="text-xs text-slate">Select a Stellar provider to interact with A2A Protocol</p>
            </div>
            <button
              onClick={toggleModal}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 rounded-xl bg-blush/10 border border-blush/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-blush flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blush leading-tight">{error}</p>
              </motion.div>
            )}

            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                disabled={connecting}
                onClick={() => wallet.installed ? connect(wallet.id) : null}
                className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                  wallet.color
                } ${!wallet.installed ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-ink-900 flex items-center justify-center border border-white/5 group-hover:border-white/20">
                  {wallet.icon}
                </div>
                
                <div className="flex-grow text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase tracking-tight">{wallet.name}</span>
                    {!wallet.installed && (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-slate font-mono">
                        Not Installed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate mt-0.5">{wallet.description}</p>
                </div>

                {!wallet.installed && wallet.installLink && (
                  <a
                    href={wallet.installLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 hover:bg-white/10 rounded-lg text-aqua transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {connecting && (
                  <div className="absolute inset-0 bg-ink-800/50 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 animate-spin text-aqua" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="p-6 bg-ink-900/50 text-center border-t border-white/5">
            <p className="text-xs text-slate">
              By connecting, you agree to A2A Protocol's <br />
              <span className="text-aqua cursor-pointer hover:underline">Terms of Service</span> and <span className="text-aqua cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalletModal;
