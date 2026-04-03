import './polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Log a check to verify polyfills are correctly loaded from index.html
if (typeof window !== 'undefined') {
  console.log('[DAPP_DEBUG] Polyfills Check - Buffer:', !!window.Buffer, 'process:', !!window.process);
  
  // Filter out noisy browser extension errors (Phantom, MetaMask conflicts)
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
