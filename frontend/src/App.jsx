import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig, AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { Loader2 } from 'lucide-react';
// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WalletModal from './components/WalletModal';
import { WalletProvider, useWallet } from './context/WalletContext';

// Home is the first thing most visitors (and judges) see, so it stays in
// the main bundle for the fastest first paint. Every other route is only
// reached after a click, so it's lazy-loaded - keeps the initial JS payload
// down instead of shipping the whole app (negotiation chat, escrow flows,
// demo walkthrough, ...) up front.
import Home from './pages/Home';
const CreateDeal = lazy(() => import('./pages/CreateDeal'));
const NegotiationRoom = lazy(() => import('./pages/NegotiationRoom'));
const DealSummary = lazy(() => import('./pages/DealSummary'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ActiveDeal = lazy(() => import('./pages/ActiveDeal'));
const Completion = lazy(() => import('./pages/Completion'));
const DemoMode = lazy(() => import('./pages/DemoMode'));

function RouteFallback() {
  return (
    <div className="pt-40 pb-20 px-6 min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="text-clay-400 animate-spin" size={28} />
    </div>
  );
}

const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-clay-500 origin-left z-[150]"
      aria-hidden="true"
    />
  );
}

function AppContent() {
  const { connected } = useWallet();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-paper font-body selection:bg-clay-500/30 selection:text-clay-400 flex flex-col transition-colors duration-500">
      <div className="grain-overlay" aria-hidden="true" />
      <ScrollProgressBar />
      <Navbar />
      <WalletModal />

      <main className="flex-grow">
        <Suspense fallback={<RouteFallback />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={pageTransition.transition}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/create-deal" element={connected ? <CreateDeal /> : <Navigate to="/" />} />
                <Route path="/negotiation-room" element={<NegotiationRoom />} />
                <Route path="/summary" element={connected ? <DealSummary /> : <Navigate to="/" />} />
                <Route path="/dashboard" element={connected ? <Dashboard /> : <Navigate to="/" />} />
                <Route path="/active-deal" element={connected ? <ActiveDeal /> : <Navigate to="/" />} />
                <Route path="/completion" element={connected ? <Completion /> : <Navigate to="/" />} />
                <Route path="/demo" element={<DemoMode />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
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
