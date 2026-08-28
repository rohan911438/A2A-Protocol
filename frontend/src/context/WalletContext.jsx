import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { walletService } from "../services/StellarWalletService";

const WalletContext = createContext();

const isStellarAccount = (value) =>
  typeof value === "string" && /^G[A-Z2-7]{55}$/.test(value);

// Read a previously-connected wallet straight out of localStorage so the
// provider can hydrate during the first render (lazy useState initialiser)
// instead of flipping state inside an effect.
const readStoredWallet = () => {
  try {
    const provider = localStorage.getItem("wallet_provider");
    const account = localStorage.getItem("wallet_account");
    if (provider && account && isStellarAccount(account)) {
      return { provider, account };
    }
    if (provider || account) {
      localStorage.removeItem("wallet_provider");
      localStorage.removeItem("wallet_account");
    }
  } catch {
    /* private mode / storage disabled - treat as no stored wallet */
  }
  return { provider: null, account: null };
};

// The context and the hook that reads it live in the same module on
// purpose - every consumer imports `useWallet` from here. Splitting the
// hook out to satisfy react-refresh would churn ~10 import sites for a
// dev-only HMR hint with no runtime effect.
// eslint-disable-next-line react-refresh/only-export-components
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
};

export const WalletProvider = ({ children }) => {
  const [stored] = useState(readStoredWallet);
  const [account, setAccount] = useState(stored.account);
  const [connected, setConnected] = useState(Boolean(stored.account));
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState(stored.provider);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [balances, setBalances] = useState([]);
  const [network] = useState(import.meta.env.VITE_STELLAR_NETWORK || "TESTNET");

  const fetchBalances = useCallback(async (pubKey) => {
    try {
      const details = await walletService.getAccountDetails(pubKey);
      setBalances(details.balances);
    } catch (err) {
      console.error("Failed to fetch balances", err);
    }
  }, []);

  const disconnect = useCallback(async () => {
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
  }, []);

  const connect = useCallback(async (walletType) => {
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
  }, [fetchBalances]);

  // On mount, if we hydrated a wallet from storage, silently reconcile with
  // the live extension and refresh balances. The visible state is already
  // set by the lazy initialisers above, so this effect never sets state
  // synchronously - it only awaits the extension and drops a stale entry.
  useEffect(() => {
    if (!connected || !account) return;
    walletService.reconnect(provider)
      .then((pubKey) => {
        if (!pubKey || !isStellarAccount(pubKey)) {
          disconnect();
          return;
        }
        if (pubKey !== account) {
          setAccount(pubKey);
          localStorage.setItem("wallet_account", pubKey);
        }
        fetchBalances(pubKey);
      })
      .catch((err) => {
        console.warn("Background reconnect failed", err);
      });
    // Mount-only reconciliation; disconnect/fetchBalances are stable.
  }, [disconnect, fetchBalances]); // eslint-disable-line react-hooks/exhaustive-deps

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
