import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
          <Route path="/negotiation-room" element={connected ? <NegotiationRoom /> : <Navigate to="/" />} />
          <Route path="/summary" element={connected ? <DealSummary /> : <Navigate to="/" />} />
          <Route path="/dashboard" element={connected ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/active-deal" element={connected ? <ActiveDeal /> : <Navigate to="/" />} />
          <Route path="/completion" element={connected ? <Completion /> : <Navigate to="/" />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <WalletProvider>
        <AppContent />
      </WalletProvider>
    </Router>
  );
}

export default App;
