import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { walletService } from "../services/StellarWalletService";

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
  const [balances, setBalances] = useState([]);
  const [network] = useState(import.meta.env.VITE_STELLAR_NETWORK || "TESTNET");

  const isStellarAccount = (value) => typeof value === "string" && /^G[A-Z2-7]{55}$/.test(value);

  // Sync with localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem("wallet_provider");
    const savedAccount = localStorage.getItem("wallet_account");

    if (savedProvider && savedAccount && isStellarAccount(savedAccount)) {
      setAccount(savedAccount);
      setConnected(true);
      setProvider(savedProvider);

      // Attempt to silently reconnect
      walletService.reconnect(savedProvider)
        .then((pubKey) => {
          if (!pubKey || !isStellarAccount(pubKey)) {
            disconnect();
            return;
          }
          if (pubKey !== savedAccount) {
            setAccount(pubKey);
            localStorage.setItem("wallet_account", pubKey);
          }
          fetchBalances(pubKey);
        })
        .catch(err => {
          console.warn("Background reconnect failed", err);
        });
    } else if (savedProvider || savedAccount) {
      localStorage.removeItem("wallet_provider");
      localStorage.removeItem("wallet_account");
    }
  }, []);

  const fetchBalances = async (pubKey) => {
    try {
      const details = await walletService.getAccountDetails(pubKey);
      setBalances(details.balances);
    } catch (err) {
      console.error("Failed to fetch balances", err);
    }
  };

  const connect = async (walletType) => {
    setConnecting(true);
    setError(null);
    try {
      let publicKey;
      if (walletType === 'freighter') {
        publicKey = await walletService.connectFreighter();
      } else if (walletType === 'rabet') {
        publicKey = await walletService.connectRabet();
      } else if (walletType === 'albedo') {
        publicKey = await walletService.connectAlbedo();
      } else {
        throw new Error("Unsupported wallet type.");
      }
      
      if (publicKey) {
        if (!isStellarAccount(publicKey)) {
          throw new Error("Wallet returned an invalid Stellar account. Please select a valid account (G...).");
        }
        setAccount(publicKey);
        setConnected(true);
        setProvider(walletType);
        localStorage.setItem("wallet_provider", walletType);
        localStorage.setItem("wallet_account", publicKey);
        setIsModalOpen(false);
        fetchBalances(publicKey);
      } else {
        throw new Error("No account shared from wallet.");
      }
    } catch (err) {
      console.error(`Connection failed for ${walletType}:`, err);
      setError(err.message || "Failed to connect. Please make sure the extension is installed.");
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
      setBalances([]);
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

  const value = useMemo(() => ({
    account,
    connected,
    connecting,
    provider,
    error,
    isModalOpen,
    balances,
    network,
    fetchBalances,
    connect,
    disconnect,
    toggleModal,
    formatAddress: (addr) => walletService.formatAddress(addr),
    signTransaction: (xdr) => walletService.signTransaction(xdr, network)
  }), [account, connected, connecting, provider, error, isModalOpen, balances, network, fetchBalances, connect, disconnect, toggleModal]);

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
