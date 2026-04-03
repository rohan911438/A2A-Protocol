import { 
  getPublicKey, 
  signTransaction, 
  isConnected, 
  getNetwork 
} from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

class StellarWalletService {
  constructor() {
    this.selectedWallet = null;
    this.horizonUrl = import.meta.env.VITE_HORIZON_URL || "https://horizon-testnet.stellar.org";
    this.networkPassphrase = import.meta.env.VITE_NETWORK_PASSPHRASE || StellarSdk.Networks.TESTNET;
    this.server = new StellarSdk.Horizon.Server(this.horizonUrl);
  }

  /**
   * Detects available Stellar wallets.
   */
  async detectWallets() {
    const freighterInstalled = await isConnected();
    const rabetInstalled = typeof window !== 'undefined' && !!window.rabet;
    const albedoInstalled = true; // Albedo is web-based, always "available"

    return {
      freighter: { 
        id: 'freighter', 
        name: 'Freighter', 
        installed: freighterInstalled, 
        icon: '🚢' 
      },
      rabet: { 
        id: 'rabet', 
        name: 'Rabet', 
        installed: rabetInstalled, 
        icon: '🐰' 
      },
      albedo: { 
        id: 'albedo', 
        name: 'Albedo', 
        installed: albedoInstalled, 
        icon: '✨' 
      }
    };
  }

  /**
   * Connects to Freighter Wallet.
   */
  async connectFreighter() {
    try {
      const publicKey = await getPublicKey();
      if (!publicKey) {
        throw new Error("User declined connection or no account found.");
      }
      this.selectedWallet = 'freighter';
      return publicKey;
    } catch (error) {
      console.error("Freighter connection failed:", error);
      throw error;
    }
  }

  /**
   * Connects to Rabet Wallet.
   */
  async connectRabet() {
    if (typeof window.rabet === "undefined") {
      throw new Error("Rabet extension not installed.");
    }
    try {
      const result = await window.rabet.connect();
      if (result && result.publicKey) {
        this.selectedWallet = 'rabet';
        return result.publicKey;
      }
      throw new Error("Failed to get public key from Rabet.");
    } catch (error) {
      console.error("Rabet connection failed:", error);
      throw error;
    }
  }

  /**
   * Reconnects to an existing session.
   */
  async reconnect(savedProvider) {
    if (savedProvider === 'freighter') {
      const connected = await isConnected();
      if (connected) {
        return await this.connectFreighter();
      }
    } else if (savedProvider === 'rabet') {
      if (typeof window.rabet !== 'undefined') {
        return await this.connectRabet();
      }
    }
    return null;
  }

  /**
   * Disconnects the wallet.
   */
  async disconnect() {
    this.selectedWallet = null;
    localStorage.removeItem("wallet_provider");
    localStorage.removeItem("wallet_account");
    // Unlike Algorand SDKs, Stellar extensions don't usually require an explicit "disconnect" call 
    // to clear state, but we clear our local state.
  }

  /**
   * Helper to truncate address for UI.
   */
  formatAddress(address) {
    if (!address || typeof address !== 'string') return "";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }

  /**
   * Sign a Stellar transaction (XDR).
   */
  async signTransaction(xdr, network = "TESTNET") {
    if (this.selectedWallet === "freighter") {
      const signedXdr = await signTransaction(xdr, {
        network: network.toUpperCase()
      });
      return signedXdr;
    }

    if (this.selectedWallet === "rabet") {
      const result = await window.rabet.sign(xdr, network.toLowerCase());
      return result.xdr;
    }

    throw new Error("No wallet connected or wallet does not support signing.");
  }

  /**
   * Fetches account details and balances.
   */
  async getAccountDetails(publicKey) {
    try {
      const account = await this.server.loadAccount(publicKey);
      return {
        balances: account.balances.map(b => ({
          asset: b.asset_type === 'native' ? 'XLM' : b.asset_code,
          balance: b.balance,
          issuer: b.asset_issuer
        })),
        sequence: account.sequenceNumber()
      };
    } catch (error) {
      console.error("Failed to fetch account details:", error);
      return { balances: [], sequence: null };
    }
  }
}

export const walletService = new StellarWalletService();
