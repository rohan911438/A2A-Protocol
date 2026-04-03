import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, ArrowLeft, Share2, PartyPopper, Trophy } from 'lucide-react';
import { getDeal } from '../services/DealService';

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
  const summary = dealRecord?.data?.request?.description || 'Escrow payment released on Algorand TestNet.';

  const finalDeal = {
    title: dealRecord?.data?.request?.description || "Deal Completed",
    price: finalPrice,
    summary
  };

  if (loadingData) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-aqua/20 border-t-aqua animate-spin" />
        <p className="mt-4 text-slate font-mono text-xs uppercase tracking-widest">Loading completion data...</p>
      </div>
    );
  }

  if (!dealId || !dealRecord) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
           <Trophy size={40} className="text-slate/20" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white italic">No Completion Found</h1>
        <p className="text-slate text-sm max-w-xs mx-auto">Please select a completed deal from your dashboard to view its final settlement and certificate.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-8 py-3 bg-white text-ink-900 font-bold rounded-xl hover:scale-105 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-ink-900 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-lime/5 to-transparent -z-10" />
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -right-20 w-80 h-80 bg-aqua/5 blur-[80px] rounded-full -z-10" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full text-center space-y-10"
      >
        <div className="space-y-6">
           <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="w-24 h-24 bg-lime/10 border border-lime/20 rounded-full flex items-center justify-center mx-auto relative"
           >
              <CheckCircle2 size={48} className="text-lime" />
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-lime rounded-full"
              />
           </motion.div>
           
           <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white italic">Deal Successfully Completed</h1>
              <p className="text-slate text-sm max-w-md mx-auto italic">The transaction for your deal has been finalized and released from escrow.</p>
           </div>
        </div>

        <div className="bg-ink-800/50 border border-white/5 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl shadow-soft space-y-8 relative group">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 pb-6">
              <div className="text-center md:text-left">
                 <div className="text-[10px] uppercase font-mono text-slate tracking-widest mb-1">Final Settlement</div>
                 <div className="text-4xl font-display font-bold text-white">{finalDeal.price}.00 ALGO</div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                 <Trophy size={16} className="text-aqua" />
                 <span className="text-xs font-bold text-white uppercase tracking-tighter italic">Top Tier Delivery</span>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-xs uppercase font-mono text-slate tracking-widest text-left font-bold">Project Summary</h3>
              <p className="text-slate text-sm leading-relaxed text-left italic">
                 {finalDeal.summary}
              </p>
           </div>

           <div className="pt-4 space-y-4 border-t border-white/5">
              <h3 className="text-xs uppercase font-mono text-slate tracking-widest font-bold">Rate the Negotiation</h3>
              <div className="flex justify-center gap-3">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <button
                     key={star}
                     type="button"
                     className="transition-all hover:scale-125 focus:outline-none"
                     onClick={() => setRating(star)}
                     onMouseEnter={() => setHover(star)}
                     onMouseLeave={() => setHover(0)}
                   >
                     <Star
                       size={32}
                       fill={(hover || rating) >= star ? '#5EF0FF' : 'transparent'}
                       className={(hover || rating) >= star ? 'text-aqua' : 'text-slate/20'}
                     />
                   </button>
                 ))}
              </div>
              <p className="text-[10px] text-slate/40 italic">Your feedback helps improve the AI Agent training models.</p>
           </div>

           <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-white text-ink-900 font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                 <ArrowLeft size={18} /> Back to Dashboard
              </button>
              <button 
                className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                 <Share2 size={18} /> Share Results
              </button>
           </div>
        </div>

        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-aqua/5 border border-aqua/10">
           <PartyPopper size={16} className="text-aqua" />
           <span className="text-[10px] font-mono text-aqua uppercase tracking-widest font-bold">Transaction Confirmed</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Completion;
