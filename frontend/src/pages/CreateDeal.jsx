import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Coins, Calendar, ShieldCheck, Zap, Star, Activity, Terminal, Shield, Cpu, Target } from 'lucide-react';
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
        throw new Error('Allocation ceiling must be greater than 0');
      }
      if (!Number.isFinite(minPrice) || minPrice <= 0) {
        throw new Error('Minimum offer must be greater than 0');
      }
      if (minPrice > budget) {
        throw new Error('Minimum offer cannot exceed allocation ceiling');
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
      setError(err.message || 'Failed to initialize protocol');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen flex flex-col items-center relative overflow-hidden selection:bg-indigo-500/30 selection:text-stellar-cyan">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full space-y-16 z-10"
      >
        <div className="text-center space-y-8">
           <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
              <Activity size={14} /> Agent Genesis
           </div>
           
           <h1 className="text-6xl md:text-7xl font-display font-black text-white uppercase tracking-tighter leading-none">
             Protocol <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-stellar-cyan">Synthesis</span>
           </h1>
           
           <p className="text-slate text-sm max-w-lg mx-auto font-medium opacity-60 leading-relaxed italic">
             Configure your requirements and deploy a neural agent to negotiate sovereign terms on the Stellar network.
           </p>
        </div>

        <div className="glass-morphism border border-white/10 p-10 md:p-14 rounded-[4rem] backdrop-blur-3xl shadow-2xl relative group">
           <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] blur-[120px] -z-10 group-hover:bg-indigo-500/[0.07] transition-all duration-1000" />
           
           <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <label className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">
                       <Terminal size={14} /> Protocol Subject
                    </label>
                    <input 
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. LLM Integration Pipeline"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-slate/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all font-medium"
                    />
                 </div>
                 
                 <div className="space-y-4">
                    <label className="flex items-center gap-3 text-[10px] font-black text-stellar-cyan uppercase tracking-[0.3em] ml-2">
                       <Shield size={14} /> Node Identity
                    </label>
                    <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-slate/40 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap border-dashed">
                       {account || 'ANONYMOUS_UNLINKED'}
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">
                    <FileText size={14} /> Strategic Constraints / Context
                 </label>
                 <textarea 
                   name="description"
                   required
                   value={formData.description}
                   onChange={handleChange}
                   placeholder="Specify parameters for agent negotiation logic..."
                   rows={4}
                   className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 py-6 text-white placeholder:text-slate/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all font-medium resize-none leading-relaxed"
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <label className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">
                       <Coins size={14} /> Allocation Ceiling (XLM)
                    </label>
                    <input 
                      type="number"
                      name="maxBudget"
                      required
                      value={formData.maxBudget}
                      onChange={handleChange}
                      placeholder="500"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-slate/20 focus:outline-none focus:border-indigo-500/50 transition-all font-mono font-bold"
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">
                       <Calendar size={14} /> Expiration Epoch
                    </label>
                    <input 
                      type="date"
                      name="deadline"
                      required
                      value={formData.deadline}
                      onChange={handleChange}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono font-bold appearance-none invert hue-rotate-180 opacity-60"
                    />
                 </div>
              </div>

              <div className="space-y-6">
                 <label className="flex items-center gap-3 text-[10px] font-black text-stellar-cyan uppercase tracking-[0.4em] ml-2">
                    <Target size={14} /> Agent Negotiation Bias
                 </label>
                 <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'Balanced', icon: <Cpu size={14} /> },
                      { id: 'Efficient', icon: <Zap size={14} /> },
                      { id: 'Premium', icon: <Star size={14} /> }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData(p => ({...p, priority: opt.id}))}
                        className={`flex items-center justify-center gap-3 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                          formData.priority === opt.id 
                          ? 'bg-indigo-500 text-white border-indigo-400 shadow-glow' 
                          : 'bg-white/[0.02] border-white/5 text-slate/40 hover:border-white/20'
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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-mono font-bold text-red-400 bg-red-400/5 p-4 rounded-2xl border border-red-400/10 uppercase tracking-widest text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-7 bg-white text-ink-900 font-black rounded-3xl transition-all hover:scale-[1.02] hover:shadow-glow flex items-center justify-center gap-4 mt-8 uppercase tracking-[0.3em] text-xs relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-indigo-500/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-3">
                    {submitting ? 'Calibrating Neural Layers...' : 'Initialize Sovereign Protocol'} 
                    <Zap size={20} className={submitting ? 'animate-pulse' : ''} />
                </span>
              </button>

           </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateDeal;
