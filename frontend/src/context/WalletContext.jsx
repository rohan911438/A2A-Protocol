import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { walletService } from "../services/AlgorandWalletService";

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Sync with localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem("wallet_provider");
    const savedAccount = localStorage.getItem("wallet_account");
    
    if (savedProvider && savedAccount) {
      setAccount(savedAccount);
      setConnected(true);
      setProvider(savedProvider);
      // Attempt to silently reconnect SDK session in background
      walletService.reconnect(savedProvider)
        .then((addr) => {
          if (addr && addr !== savedAccount) {
            setAccount(addr);
            localStorage.setItem("wallet_account", addr);
          }
        })
        .catch(err => {
          console.warn("Background reconnect failed", err);
        });
    }
  }, []);

  const connect = async (walletType) => {
    setConnecting(true);
    setError(null);
    try {
      const address = await walletService[`connect${walletType.charAt(0).toUpperCase() + walletType.slice(1)}`]();
      
      if (address) {
        setAccount(address);
        setConnected(true);
        setProvider(walletType);
        localStorage.setItem("wallet_provider", walletType);
        localStorage.setItem("wallet_account", address);
        setIsModalOpen(false);
      } else {
        throw new Error("No address returned from wallet.");
      }
    } catch (err) {
      console.error(`Connection failed for ${walletType}:`, err);
      setError(err.message || "Failed to connect. Please make sure you select an account in your app.");
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await walletService.disconnect();
      setAccount(null);
      setConnected(false);
      setProvider(null);
      localStorage.removeItem("wallet_provider");
      localStorage.removeItem("wallet_account");
    } catch (err) {
      console.error("Disconnect failed", err);
    }
  };

  const toggleModal = useCallback(() => {
    setError(null);
    setIsModalOpen(prev => !prev);
  }, []);

  const value = {
    account,
    connected,
    connecting,
    provider,
    error,
    isModalOpen,
    connect,
    disconnect,
    toggleModal,
    formatAddress: (addr) => walletService.formatAddress(addr)
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
