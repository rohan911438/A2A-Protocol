import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, Share2, Trophy, ShieldCheck, Inbox, Loader2 } from 'lucide-react';
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
  const summary = dealRecord?.data?.request?.description || 'Escrow payment released on the Stellar network.';

  const finalDeal = {
    title: dealRecord?.data?.request?.description || "Deal completed",
    price: finalPrice,
    summary
  };

  if (loadingData) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-paper flex flex-col items-center justify-center">
        <Loader2 className="text-clay-400 animate-spin" size={32} />
        <p className="mt-5 text-bark-faint text-sm">Loading settlement...</p>
      </div>
    );
  }

  if (!dealId || !dealRecord) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-paper flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-20 h-20 rounded-2xl bg-surface border border-line flex items-center justify-center mx-auto">
          <Inbox size={32} className="text-bark-faint" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-serif font-medium text-bark">No deal found</h1>
          <p className="text-bark-muted text-sm max-w-xs mx-auto">Select a completed deal from your dashboard to view its settlement summary.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-clay"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-paper relative">
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-moss-400/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto w-full text-center space-y-10"
      >
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-moss-400/10 border border-moss-400/25 text-xs font-semibold text-moss-400">
            <ShieldCheck size={13} /> Settlement complete
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-medium text-bark tracking-tight">
            Deal completed
          </h1>
        </div>

        <div className="paper-card p-8 md:p-12 space-y-10 text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-line pb-8">
            <div className="text-center md:text-left space-y-2">
              <div className="text-[11px] font-semibold text-clay-400 uppercase tracking-widest">Final disbursement</div>
              <div className="text-4xl font-serif font-medium text-bark">
                {finalDeal.price} <span className="text-xs text-bark-faint font-sans">XLM</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-moss-400/10 border border-moss-400/20">
              <Trophy size={18} className="text-moss-400" />
              <span className="text-xs font-semibold text-bark">Verified on-chain</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-bark-faint uppercase tracking-widest">Deal summary</h3>
            <p className="text-base text-bark-muted leading-relaxed italic border-l-2 border-clay-500/30 pl-6">
              "{finalDeal.summary}"
            </p>
          </div>

          <div className="pt-8 space-y-6 border-t border-line text-center">
            <h3 className="text-[11px] font-semibold text-bark-faint uppercase tracking-widest">Rate this deal</h3>
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110 focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  <Star
                    size={30}
                    fill={(hover || rating) >= star ? '#D97757' : 'transparent'}
                    className={`transition-all duration-300 ${
                      (hover || rating) >= star
                      ? 'text-clay-500'
                      : 'text-bark-faint/40'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full btn-clay flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <button
              className="w-full py-3.5 rounded-xl bg-surface border border-line text-bark font-medium text-sm hover:border-clay-400/30 transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={16} /> Export summary
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Completion;
