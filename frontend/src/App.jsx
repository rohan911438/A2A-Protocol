import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WalletModal from './components/WalletModal';
import NeuralBackground from './components/NeuralBackground';
import { WalletProvider, useWallet } from './context/WalletContext';

// Pages
import Home from './pages/Home';
import CreateDeal from './pages/CreateDeal';
import NegotiationRoom from './pages/NegotiationRoom';
import DealSummary from './pages/DealSummary';
import Dashboard from './pages/Dashboard';
import ActiveDeal from './pages/ActiveDeal';
import Completion from './pages/Completion';
import DemoMode from './pages/DemoMode';

function AppContent() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen font-body selection:bg-indigo-500/30 selection:text-cyan-400 flex flex-col transition-colors duration-500">
      <NeuralBackground />
      <Navbar />
      <WalletModal />


      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-deal" element={connected ? <CreateDeal /> : <Navigate to="/" />} />
          <Route path="/negotiation-room" element={<NegotiationRoom />} />
          <Route path="/summary" element={connected ? <DealSummary /> : <Navigate to="/" />} />
          <Route path="/dashboard" element={connected ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/active-deal" element={connected ? <ActiveDeal /> : <Navigate to="/" />} />
          <Route path="/completion" element={connected ? <Completion /> : <Navigate to="/" />} />
          <Route path="/demo" element={<DemoMode />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 8;
    const memory = navigator.deviceMemory || 8;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || cores <= 4 || memory <= 4) {
      setReduceMotion(true);
      document.documentElement.setAttribute('data-perf', 'low');
    }
  }, []);

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <Router>
        <WalletProvider>
          <AppContent />
        </WalletProvider>
      </Router>
    </MotionConfig>
  );
}

export default App;
