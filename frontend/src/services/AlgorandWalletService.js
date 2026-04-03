import { PeraWalletConnect } from "@perawallet/connect";
import { DeflyWalletConnect } from "@blockshake/defly-connect";
import algosdk from "algosdk";
import { Buffer } from "buffer";

class AlgorandWalletService {
  constructor() {
    this.peraWallet = new PeraWalletConnect();
    this.deflyWallet = new DeflyWalletConnect();
    this.selectedWallet = null;
  }

  /**
   * Detects available wallet extensions.
   */
  async detectWallets() {
    return {
      pera: { id: 'pera', name: 'Pera Wallet', installed: true, extensionInstalled: !!window?.algorand?.isPera },
      defly: { id: 'defly', name: 'Defly Wallet', installed: true, extensionInstalled: !!window?.algorand?.isDefly },
      algosigner: { id: 'algosigner', name: 'AlgoSigner', installed: typeof window !== 'undefined' && !!window.AlgoSigner, extensionInstalled: typeof window !== 'undefined' && !!window.AlgoSigner }
    };
  }

  /**
   * Connects to Pera Wallet.
   */
  async connectPera() {
    try {
      const accounts = await this.peraWallet.connect();
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts shared. Please select an account in your Pera app.");
      }

      // Standard Pera v1 disconnect handling
      this.peraWallet.connector?.on("disconnect", () => this.disconnect());
      
      this.selectedWallet = 'pera';
      return accounts[0];
    } catch (error) {
      if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
        throw error;
      }
    }
  }

  /**
   * Connects to Defly Wallet.
   */
  async connectDefly() {
    try {
      const accounts = await this.deflyWallet.connect();

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts shared. Please select an account in your Defly app.");
      }

      this.deflyWallet.connector?.on("disconnect", () => this.disconnect());
      
      this.selectedWallet = 'defly';
      return accounts[0];
    } catch (error) {
      if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
        throw error;
      }
    }
  }

  /**
   * Connects to AlgoSigner.
   */
  async connectAlgoSigner() {
    if (typeof window.AlgoSigner === "undefined") {
      throw new Error("AlgoSigner not installed");
    }

    await window.AlgoSigner.connect();
    const accounts = await window.AlgoSigner.accounts({
      ledger: "MainNet",
    });

    if (accounts.length === 0) {
      throw new Error("No accounts found in AlgoSigner");
    }

    this.selectedWallet = 'algosigner';
    return accounts[0].address;
  }

  /**
   * Reconnects to an existing session.
   */
  async reconnect(savedProvider) {
    try {
      let accounts = [];
      if (savedProvider === 'pera') {
        accounts = await this.peraWallet.reconnectSession();
        if (accounts.length > 0) {
          this.peraWallet.connector?.on("disconnect", () => this.disconnect());
          this.selectedWallet = 'pera';
          return accounts[0];
        }
      } else if (savedProvider === 'defly') {
        accounts = await this.deflyWallet.reconnectSession();
        if (accounts.length > 0) {
          this.deflyWallet.connector?.on("disconnect", () => this.disconnect());
          this.selectedWallet = 'defly';
          return accounts[0];
        }
      } else if (savedProvider === 'algosigner') {
        return await this.connectAlgoSigner();
      }
    } catch (e) {
      console.error(`Reconnect failed for ${savedProvider}`, e);
    }
    return null;
  }

  /**
   * Disconnects everything and reloads the page to clear all provider memory.
   */
  async disconnect() {
    try {
      if (this.selectedWallet === 'pera') {
        await this.peraWallet.disconnect();
      } else if (this.selectedWallet === 'defly') {
        await this.deflyWallet.disconnect();
      }
    } catch (e) {}
    
    this.selectedWallet = null;
    localStorage.removeItem("wallet_provider");
    localStorage.removeItem("wallet_account");
    window.location.reload();
  }

  /**
   * Helper to truncate address for UI.
   */
  formatAddress(address) {
    if (!address || typeof address !== 'string') return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Sign one or more base64-encoded unsigned transactions.
   */
  async signTransactions(unsignedTxns, ledger = "TestNet") {
    const txns = Array.isArray(unsignedTxns) ? unsignedTxns : [unsignedTxns];

    const toBytes = (b64) => Buffer.from(b64, 'base64');
    const toBase64 = (bytes) => Buffer.from(bytes).toString('base64');
    const toTxn = (b64) => algosdk.decodeUnsignedTransaction(toBytes(b64));

    if (this.selectedWallet === "pera") {
      const signerTxns = txns.map((t) => ({ txn: toTxn(t) }));
      // Pera v1.x expects a grouped array [SignerTransaction[]]
      const signed = await this.peraWallet.signTransaction([signerTxns]);
      // Robust flattening for v1.x response
      const signedArray = Array.isArray(signed) 
        ? (Array.isArray(signed[0]) ? signed.flat() : signed) 
        : [signed];
      return signedArray.filter(s => s !== null).map((s) => toBase64(s));
    }

    if (this.selectedWallet === "defly") {
      const signerTxns = txns.map((t) => ({ txn: toTxn(t) }));
      const signed = await this.deflyWallet.signTransaction([signerTxns]);
      const signedArray = Array.isArray(signed) 
        ? (Array.isArray(signed[0]) ? signed.flat() : signed) 
        : [signed];
      return signedArray.filter(s => s !== null).map((s) => toBase64(s));
    }

    if (this.selectedWallet === "algosigner") {
      const signerTxns = txns.map((t) => ({ txn: t, ledger }));
      const signed = await window.AlgoSigner.signTxn(signerTxns);
      const signedArray = Array.isArray(signed) ? signed : [signed];
      return signedArray.map((s) => s.blob);
    }

    throw new Error("No wallet connected");
  }
}

export const walletService = new AlgorandWalletService();
