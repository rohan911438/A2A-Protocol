import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Coins, Calendar, Zap, Star, Cpu, Target, Wallet } from 'lucide-react';
import { createDeal } from '../services/DealService';
import { useWallet } from '../context/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';

const CreateDeal = () => {
  const navigate = useNavigate();
  const { account, connected } = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    minBudget: '',
    maxBudget: '',
    deadline: '',
    priority: 'Efficient'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const budget = Number(formData.maxBudget);
      const minBudgetRaw = formData.minBudget?.trim();
      const minPrice = minBudgetRaw ? Number(minBudgetRaw) : budget;

      if (!Number.isFinite(budget) || budget <= 0) {
        throw new Error('Budget must be greater than 0');
      }
      if (!Number.isFinite(minPrice) || minPrice <= 0) {
        throw new Error('Minimum offer must be greater than 0');
      }
      if (minPrice > budget) {
        throw new Error('Minimum offer cannot exceed the budget');
      }

      const payload = {
        title: formData.title,
        budget,
        min_price: minPrice,
        deadline: formData.deadline,
        description: formData.description,
        buyer_wallet: connected ? account : null,
      };

      const result = await createDeal(payload);
      navigate('/negotiation-room', { state: { dealId: result.deal_id } });
    } catch (err) {
      setError(err.message || 'Failed to create the deal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-paper relative">
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-clay-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto w-full space-y-12"
      >
        <div className="text-center space-y-4">
          <div className="text-xs font-semibold text-clay-400 uppercase tracking-[0.2em]">New deal</div>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-bark tracking-tight">
            Describe what you need
          </h1>
          <p className="text-bark-muted text-sm max-w-lg mx-auto leading-relaxed">
            Your buyer agent will negotiate with a seller agent to find fair terms, then lock the agreement in a Soroban escrow.
          </p>
        </div>

        <div className="paper-card p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-bark-faint uppercase tracking-widest ml-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. LLM integration pipeline"
                  className="w-full bg-surface border border-line rounded-xl px-5 py-3.5 text-bark placeholder:text-bark-faint focus:outline-none focus:border-clay-400/50 transition-all"
                />
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-bark-faint uppercase tracking-widest ml-1">
                  <Wallet size={12} /> Your wallet
                </label>
                <div className="w-full bg-surface/60 border border-dashed border-line rounded-xl px-5 py-3.5 text-bark-faint font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                  {account || 'Not connected'}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-[11px] font-semibold text-bark-faint uppercase tracking-widest ml-1">
                <FileText size={12} /> Description
              </label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the work, deliverables, and any constraints for negotiation..."
                rows={4}
                className="w-full bg-surface border border-line rounded-xl px-5 py-4 text-bark placeholder:text-bark-faint focus:outline-none focus:border-clay-400/50 transition-all resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-bark-faint uppercase tracking-widest ml-1">
                  <Coins size={12} /> Budget (XLM)
                </label>
                <input
                  type="number"
                  name="maxBudget"
                  required
                  value={formData.maxBudget}
                  onChange={handleChange}
                  placeholder="500"
                  className="w-full bg-surface border border-line rounded-xl px-5 py-3.5 text-bark placeholder:text-bark-faint focus:outline-none focus:border-clay-400/50 transition-all font-mono"
                />
              </div>
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-bark-faint uppercase tracking-widest ml-1">
                  <Calendar size={12} /> Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  required
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full bg-surface border border-line rounded-xl px-5 py-3.5 text-bark focus:outline-none focus:border-clay-400/50 transition-all font-mono [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-semibold text-bark-faint uppercase tracking-widest ml-1">
                <Target size={12} /> Negotiation style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Balanced', icon: <Cpu size={14} /> },
                  { id: 'Efficient', icon: <Zap size={14} /> },
                  { id: 'Premium', icon: <Star size={14} /> }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData(p => ({...p, priority: opt.id}))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                      formData.priority === opt.id
                      ? 'bg-clay-500 text-white border-clay-400'
                      : 'bg-surface border-line text-bark-muted hover:border-clay-400/30'
                    }`}
                  >
                    {opt.icon} {opt.id}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium text-red-300 bg-red-400/10 p-4 rounded-xl border border-red-400/20 text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-clay flex items-center justify-center gap-3 py-4"
            >
              {submitting ? 'Starting negotiation...' : 'Start negotiation'}
              {!submitting && <Zap size={16} />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateDeal;
