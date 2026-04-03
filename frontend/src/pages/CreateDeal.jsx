import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Coins, Calendar, ShieldCheck, Zap, Star } from 'lucide-react';
import { createDeal } from '../services/DealService';
import { useWallet } from '../context/WalletContext';

const CreateDeal = () => {
  const navigate = useNavigate();
  const { account, connected } = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    minBudget: '',
    maxBudget: '',
    deadline: '',
    priority: 'Quality'
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
      const payload = {
        title: formData.title,
        budget: Number(formData.maxBudget),
        min_price: Number(formData.minBudget),
        deadline: formData.deadline,
        description: formData.description,
        buyer_wallet: connected ? account : null,
      };

      const result = await createDeal(payload);
      navigate('/negotiation-room', { state: { dealId: result.deal_id } });
    } catch (err) {
      setError(err.message || 'Failed to create deal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-aqua/5 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blush/5 blur-[100px] rounded-full -z-10" />

      <div className="max-w-2xl w-full space-y-8 text-center mb-10">
        <h1 className="text-4xl lg:text-5xl font-display font-bold text-white animate-fadeInUp">
          Create a New <span className="text-transparent bg-clip-text bg-gradient-to-r from-aqua to-blush">Deal</span>
        </h1>
        <p className="text-slate max-w-lg mx-auto animate-fadeInUp delay-100">
          Define your requirements and let our autonomous AI agents find the perfect agreement for you.
        </p>
      </div>

      <div className="w-full max-w-2xl bg-ink-800/50 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-soft animate-fadeInUp delay-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate ml-1">
              <Briefcase size={16} className="text-aqua" />
              Task Title
            </label>
            <input 
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Website Development for Fintech"
              className="w-full bg-ink-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate/30 focus:outline-none focus:border-aqua/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate ml-1">
              <FileText size={16} className="text-aqua" />
              Description
            </label>
            <textarea 
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the project scope, requirements, and deliverables..."
              rows={4}
              className="w-full bg-ink-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate/30 focus:outline-none focus:border-aqua/50 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate ml-1">
                  <Coins size={16} className="text-aqua" />
                  Min Budget (ALGO)
                </label>
                <input 
                  type="number"
                  name="minBudget"
                  required
                  value={formData.minBudget}
                  onChange={handleChange}
                  placeholder="300"
                  className="w-full bg-ink-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate/30 focus:outline-none focus:border-aqua/50 transition-colors"
                />
             </div>
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate ml-1">
                  <Coins size={16} className="text-aqua" />
                  Max Budget (ALGO)
                </label>
                <input 
                  type="number"
                  name="maxBudget"
                  required
                  value={formData.maxBudget}
                  onChange={handleChange}
                  placeholder="500"
                  className="w-full bg-ink-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate/30 focus:outline-none focus:border-aqua/50 transition-colors"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate ml-1">
                  <Calendar size={16} className="text-aqua" />
                  Deadline
                </label>
                <input 
                  type="date"
                  name="deadline"
                  required
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full bg-ink-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-aqua/50 transition-colors"
                />
             </div>
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate ml-1 text-[11px] uppercase tracking-widest uppercase">
                  Optimization Priority
                </label>
                <div className="flex gap-2">
                   {['Cheap', 'Fast', 'Quality'].map((opt) => (
                     <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData(p => ({...p, priority: opt}))}
                        className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                          formData.priority === opt 
                          ? 'bg-aqua/10 border-aqua text-aqua transition-transform scale-[1.02]' 
                          : 'bg-ink-900/50 border-white/5 text-slate/50 hover:border-white/20'
                        }`}
                     >
                       {opt === 'Cheap' && <ShieldCheck size={14} className="inline mr-1" />}
                       {opt === 'Fast' && <Zap size={14} className="inline mr-1" />}
                       {opt === 'Quality' && <Star size={14} className="inline mr-1" />}
                       {opt}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          {error && (
            <div className="text-sm text-blush">{error}</div>
          )}

          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-aqua to-blush text-ink-900 font-bold rounded-2xl transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(94,240,255,0.3)] flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? 'Creating...' : 'Start AI Negotiation'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateDeal;
