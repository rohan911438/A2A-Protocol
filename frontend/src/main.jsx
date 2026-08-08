import './polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Filter out noisy browser extension conflicts (Phantom/MetaMask redefining
// window.ethereum) without swallowing real errors. Dev-only: shipping this
// in production risks silently dropping unrelated errors that happen to
// share a substring with these patterns.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args[0]?.toString() || '';
    if (
      msg.includes('isDefaultWallet') ||
      msg.includes('Cannot redefine property: ethereum') ||
      msg.includes('evmAsk.js') ||
      args[1]?.message?.includes('isDefaultWallet')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
