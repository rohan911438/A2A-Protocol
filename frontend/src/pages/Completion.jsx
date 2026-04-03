import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Star, ArrowLeft, Share2, PartyPopper, Trophy, ShieldCheck, Database, Zap, Activity } from 'lucide-react';
import { getDeal } from '../services/DealService';
import NeuralBackground from '../components/NeuralBackground';

const Completion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [dealRecord, setDealRecord] = useState(null);

  const dealId = location.state?.dealId || null;

  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!dealId) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    getDeal(dealId)
      .then((res) => {
        setDealRecord(res);
        setLoadingData(false);
      })
      .catch(() => {
        setLoadingData(false);
      });
  }, [dealId]);

  const finalPrice = dealRecord?.data?.result?.final_price || 0;
  const summary = dealRecord?.data?.request?.description || 'Escrow payment released on Stellar Network.';

  const finalDeal = {
    title: dealRecord?.data?.request?.description || "Protocol Finalized",
    price: finalPrice,
    summary
  };

  if (loadingData) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <NeuralBackground />
        <div className="w-16 h-16 rounded-2xl border-2 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center">
            <Activity className="text-indigo-400" size={24} />
        </div>
        <p className="mt-6 text-mist/60 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Retrieving Settlement Data...</p>
      </div>
    );
  }

  if (!dealId || !dealRecord) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
        <NeuralBackground />
        <div className="w-24 h-24 rounded-[2.5rem] glass-morphism border border-white/5 flex items-center justify-center mx-auto shadow-2xl">
          <Database size={40} className="text-slate/20" />
        </div>
        <div className="space-y-4">
            <h1 className="text-4xl font-display font-black text-white uppercase tracking-tighter italic">Archive Not Found</h1>
            <p className="text-slate text-xs max-w-xs mx-auto font-medium opacity-60">Please select a completed protocol from your terminal to view final settlement snapshots.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-12 py-5 bg-white text-ink-900 font-black rounded-2xl hover:scale-105 transition-all shadow-glow uppercase tracking-widest text-[11px]"
        >
          Return to Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen flex flex-col items-center relative overflow-hidden selection:bg-indigo-500/30 selection:text-stellar-cyan">
      <NeuralBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl w-full text-center space-y-16 z-10"
      >
        <div className="space-y-8">
           <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
              <ShieldCheck size={14} /> Settlement Formalized
           </div>
           
           <h1 className="text-6xl md:text-7xl font-display font-black text-white uppercase tracking-tighter leading-tight">
             Protocol <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-stellar-cyan via-indigo-400 to-cyber-purple">Resolved</span>
           </h1>
        </div>

        <div className="glass-morphism border border-white/10 p-12 md:p-16 rounded-[4rem] backdrop-blur-3xl shadow-2xl space-y-12 relative group overflow-hidden">
           <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/[0.03] blur-[120px] -z-10 group-hover:bg-emerald-400/[0.07] transition-all duration-1000" />
           
           <div className="flex flex-col md:flex-row justify-between items-center gap-10 border-b border-white/5 pb-10">
              <div className="text-center md:text-left space-y-2">
                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Final Disbursement</div>
                 <div className="text-5xl font-display font-black text-white tracking-tighter">
                   {finalDeal.price} <span className="text-xs font-mono text-slate opacity-40">XLM</span>
                 </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-400/5 border border-emerald-400/10 shadow-inner">
                 <Trophy size={20} className="text-emerald-400" />
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Verified Proof</span>
              </div>
           </div>

           <div className="space-y-6 text-left">
              <h3 className="text-[10px] font-black text-slate uppercase tracking-[0.4em] mb-4 opacity-40">Agreement Metadata</h3>
              <p className="text-lg font-medium text-white/80 leading-relaxed italic border-l-2 border-indigo-500/30 pl-8">
                 "{finalDeal.summary}"
              </p>
           </div>

           <div className="pt-10 space-y-8 border-t border-white/5">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Protocol Efficiency Metric</h3>
              <div className="flex justify-center gap-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="transition-all hover:scale-125 focus:outline-none group/star"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <Star
                      size={40}
                      fill={(hover || rating) >= star ? '#22d3ee' : 'transparent'}
                      className={`transition-all duration-300 ${
                        (hover || rating) >= star 
                        ? 'text-stellar-cyan drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                        : 'text-white/5 group-hover/star:text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-bold text-slate/40 uppercase tracking-[0.4em]">Neural feedback requested for agent optimization</p>
           </div>

           <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-6 bg-white text-ink-900 font-black rounded-3xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-glow uppercase tracking-widest text-[11px]"
              >
                <ArrowLeft size={18} /> Terminal Home
              </button>
              <button
                className="w-full py-6 bg-white/5 border border-white/10 text-white font-black rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
              >
                <Share2 size={18} /> Export Snapshot
              </button>
           </div>
        </div>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="inline-flex items-center gap-4 px-8 py-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-md"
        >
           <PartyPopper size={20} className="text-indigo-400" />
           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Block 48,291,012 • TX Confirmed</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Completion;
