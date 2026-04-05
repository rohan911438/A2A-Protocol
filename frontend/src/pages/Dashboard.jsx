import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, TrendingUp, CheckCircle2, ArrowRight, Coins, Activity, Shield, Terminal, Cpu, Zap, Search, Database } from 'lucide-react';
import { listDeals, approveDeal, rejectDeal, recordOnchainAccept, fundDeal } from '../services/DealService';
import { useWallet } from '../context/WalletContext';
import { getCreateDealTxn, getContractInfo, submitSignedXdr } from '../services/ContractService';
import NeuralBackground from '../components/NeuralBackground';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [deals, setDeals] = useState([]);
  const [contractInfo, setContractInfo] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const { account, connected, signTransaction, fetchBalances } = useWallet();

  const loadDeals = () => {
    listDeals()
      .then((data) => {
        const items = Object.entries(data || {}).map(([id, record]) => ({
          id,
          status: record.status || 'created',
          data: record.data || {},
        }));
        setDeals(items);
      })
      .catch(() => setDeals([]));
  };

  useEffect(() => {
    loadDeals();
  }, []);
  
  useEffect(() => {
    getContractInfo()
      .then(setContractInfo)
      .catch(() => {});
  }, []);

  const normalized = useMemo(() => deals.map((deal) => {
    const request = deal.data?.request || deal.data || {};
    const title = request?.title || request?.description?.split('—')[0]?.trim() || request?.description || 'Agent Module';
    const finalPrice = deal.data?.result?.final_price || deal.data?.final_price || request?.budget || 0;
    const statusKey = (deal.status || '').toLowerCase();
    
    let displayStatus = 'Negotiating';
    let route = '/negotiation-room';
    let actionLabel = 'Resume Session';
    let colorClass = 'bg-stellar-cyan/10 border-stellar-cyan/30 text-stellar-cyan';

    if (statusKey === 'rejected') {
      displayStatus = 'Terminated';
      route = '/dashboard';
      actionLabel = 'Dismiss';
      colorClass = 'bg-red-400/10 border-red-400/30 text-red-400';
    } else if (statusKey === 'negotiated' || statusKey === 'success') {
      displayStatus = 'Consensus';
      route = '/summary';
      actionLabel = 'Audit Offer';
      colorClass = 'bg-indigo-400/10 border-indigo-400/30 text-indigo-400';
    } else if (statusKey === 'active') {
      displayStatus = 'Live Escrow';
      route = '/active-deal';
      actionLabel = 'Monitor Rails';
      colorClass = 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400';
    } else if (statusKey === 'completed') {
      displayStatus = 'Finalized';
      route = '/completion';
      actionLabel = 'Settle Archive';
      colorClass = 'bg-white/10 border-white/20 text-white';
    }

    return {
      id: deal.id,
      title,
      price: Math.round(finalPrice),
      status: displayStatus,
      route,
      actionLabel,
      colorClass,
      data: deal.data,
    };
  }), [deals]);

  const activeDeals = normalized.filter((d) => d.status !== 'Finalized' && d.status !== 'Terminated');
  const completedDeals = normalized.filter((d) => d.status === 'Finalized');
  const dealsNeedingYourApproval = normalized.filter((deal) => {
    if (deal.status !== 'Consensus') return false;
    const request = deal.data?.request || deal.data || {};
    const buyerWallet = request?.buyer_wallet || '';
    const sellerWallet = deal.data?.seller_wallet || '';
    const approvals = deal.data?.approvals || { buyer: false, seller: false };
    const isBuyer = account && buyerWallet && account.toLowerCase() === buyerWallet.toLowerCase();
    const isSeller = account && sellerWallet && account.toLowerCase() === sellerWallet.toLowerCase();
    if (isBuyer) return !approvals.buyer;
    if (isSeller) return !approvals.seller;
    return false;
  });

  const currentDeals = activeTab === 'active' ? activeDeals : completedDeals;

  const handleApprove = async (deal) => {
    const request = deal.data?.request || deal.data || {};
    const buyerWallet = request?.buyer_wallet || '';
    const sellerWallet = deal.data?.seller_wallet || '';
    const role = account && account.toLowerCase() === buyerWallet.toLowerCase() ? 'buyer' : account && account.toLowerCase() === sellerWallet.toLowerCase() ? 'seller' : null;
    
    if (!role) return;
    if (!connected || !account) {
      setActionStatus('Connect wallet to sign on Stellar.');
      return;
    }
    if (!/^G[A-Z2-7]{55}$/.test(account)) {
      setActionStatus('Invalid wallet account selected. Reconnect wallet and choose a Stellar account (G...).');
      return;
    }

    setActionLoading(true);
    setActionStatus('Interacting with A2A Protocol logic...');
    try {
      await approveDeal(deal.id, role);
      
      if (role === 'buyer') {
        const amount = Math.max(Math.round(deal.price || 0), 0);
        const milestones = [amount]; 
        
        const { xdr } = await getCreateDealTxn(account, deal.id, amount, milestones);
        const signedXdr = await signTransaction(xdr);
        const { tx_hash } = await submitSignedXdr(signedXdr);
        
        await recordOnchainAccept(deal.id, 'buyer', tx_hash);
        await fundDeal(deal.id, tx_hash);
        
        setActionStatus(`Deal funded on Stellar. Hash: ${tx_hash.substring(0, 10)}...`);
        await fetchBalances(); 
      } else {
        setActionStatus('Offer accepted. Waiting for buyer settlement.');
      }
      
      loadDeals();
    } catch (err) {
      setActionStatus(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (deal) => {
    const request = deal.data?.request || deal.data || {};
    const buyerWallet = request?.buyer_wallet || '';
    const sellerWallet = deal.data?.seller_wallet || '';
    const role = account && account.toLowerCase() === buyerWallet.toLowerCase() ? 'buyer' : account && account.toLowerCase() === sellerWallet.toLowerCase() ? 'seller' : null;
    if (!role) return;
    await rejectDeal(deal.id, role);
    loadDeals();
  };

  return (
    <div className="pt-28 pb-32 px-6 min-h-screen flex flex-col items-center relative overflow-hidden selection:bg-indigo-500/30 selection:text-stellar-cyan">
      <NeuralBackground />

      <div className="max-w-6xl mx-auto w-full space-y-16 z-10">
        
        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                <Terminal size={14} /> System Command
             </div>
             <h1 className="text-6xl font-display font-black text-white uppercase tracking-tighter leading-none">
               Protocol <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-stellar-cyan">Terminal</span>
             </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
               <div className="px-5 py-3 glass-morphism rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="text-right">
                     <div className="text-[8px] font-black text-slate uppercase tracking-widest opacity-40">Account Node</div>
                     <div className="text-[11px] font-mono font-bold text-white">{account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'DEAUTHORIZED'}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                     <Shield size={18} />
                  </div>
               </div>
               <Link to="/create-deal" className="group relative px-8 py-5 bg-white text-ink-900 rounded-2xl font-black shadow-glow transition-all hover:scale-105 uppercase tracking-widest text-[11px] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative z-10 flex items-center gap-2">Deploy New Agent <Zap size={14} /></span>
               </Link>
          </div>
        </div>

        {/* Action Status Ticker */}
        <AnimatePresence>
            {actionStatus && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-4 rounded-2xl bg-stellar-cyan/5 border border-stellar-cyan/10 flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-stellar-cyan animate-pulse shadow-[0_0_10px_#22d3ee]" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-stellar-cyan/80">{actionStatus}</span>
                    </div>
                    <button onClick={() => setActionStatus('')} className="text-[9px] font-black text-slate uppercase tracking-widest hover:text-white transition-colors">Dismiss</button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Active Channels', value: activeDeals.length, icon: <Activity className="text-stellar-cyan" />, desc: 'Real-time syncing' },
            { label: 'Network Settle', value: completedDeals.length, icon: <CheckCircle2 className="text-emerald-400" />, desc: 'Immutable Archive' },
            { label: 'Queue Load', value: dealsNeedingYourApproval.length, icon: <Cpu className="text-cyber-purple" />, desc: 'Awaiting Auth' }
          ].map((stat) => (
            <div key={stat.label} className="p-8 rounded-[3rem] glass-morphism border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all duration-500 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10">
                <div className="text-[10px] font-black text-slate uppercase tracking-[0.4em] mb-2 opacity-40">{stat.label}</div>
                <div className="text-5xl font-display font-black text-white mb-2 tracking-tighter">{stat.value}</div>
                <div className="text-[9px] font-mono text-indigo-400/60 uppercase tracking-widest font-black">{stat.desc}</div>
              </div>
              <div className="w-16 h-16 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500/20 transition-all duration-500 shadow-xl">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Notification Panel (Authorizations) */}
        <AnimatePresence>
          {dealsNeedingYourApproval.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                <Shield size={14} className="text-indigo-500" /> Authorized Handshake Required
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dealsNeedingYourApproval.map((deal) => (
                  <div key={deal.id} className="p-10 rounded-[3rem] glass-morphism border-2 border-indigo-500/20 flex flex-col gap-8 shadow-2xl relative group overflow-hidden">
                     <div className="absolute inset-0 bg-indigo-500/[0.03] animate-pulse" />
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter">{deal.title}</h3>
                            <div className="text-sm font-mono font-bold text-stellar-cyan flex items-center gap-3">
                              <Coins size={16} /> {deal.price} XLM
                            </div>
                          </div>
                          <div className="text-[9px] px-3 py-1 bg-white/5 rounded-full text-indigo-400 font-black uppercase tracking-widest border border-indigo-500/20">
                            Logic Locked
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleApprove(deal)}
                            disabled={actionLoading}
                            className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-glow hover:scale-105 transition-all"
                          >
                            Authorize XDR
                          </button>
                          <button
                            onClick={() => handleReject(deal)}
                            disabled={actionLoading}
                            className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                          >
                            Decline
                          </button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content (Deals List) */}
        <div className="space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-8 border-b border-white/5 pb-8">
              <div className="flex items-center gap-3 p-1.5 glass-morphism rounded-2xl border border-white/5 relative overflow-hidden">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`relative z-10 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'active' ? 'bg-white text-ink-900 shadow-xl' : 'text-slate hover:text-white'}`}
                >
                  Active Channels
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`relative z-10 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'completed' ? 'bg-white text-ink-900 shadow-xl' : 'text-slate hover:text-white'}`}
                >
                  Archive
                </button>
              </div>
              
              <div className="hidden sm:flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                 <Search size={16} className="text-slate/40" />
                 <input type="text" placeholder="QUERY PROTOCOL..." className="bg-transparent border-none outline-none text-[10px] font-mono font-bold text-white placeholder:text-slate/20 uppercase tracking-widest w-40" />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="wait">
              {currentDeals.map((deal, i) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative glass-morphism border border-white/5 rounded-[3.5rem] p-10 hover:border-indigo-500/40 transition-all duration-500 flex flex-col justify-between min-h-[320px] shadow-2xl overflow-hidden"
                >
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${deal.colorClass}`}>
                        {deal.status}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform">
                         <Database size={18} className="text-slate/40 group-hover:text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-display font-black text-white mb-6 group-hover:text-glow transition-all line-clamp-2 uppercase tracking-tight leading-tight">{deal.title}</h3>
                    <div className="text-3xl font-mono font-black text-white/90 flex items-center gap-2">
                       {deal.price} <span className="text-[10px] text-slate opacity-40">XLM</span>
                    </div>
                  </div>

                  <div className="pt-10 relative z-10">
                    <button 
                      onClick={() => navigate(deal.route, { state: { dealId: deal.id } })}
                      className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-ink-900 transition-all duration-500 flex items-center justify-center gap-3 group/btn shadow-xl"
                    >
                      {deal.actionLabel} <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform duration-500" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {currentDeals.length === 0 && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center py-32 glass-morphism rounded-[4rem] border border-dashed border-white/10"
            >
              <div className="inline-flex p-10 rounded-[3rem] bg-indigo-500/5 mb-8">
                 <LayoutDashboard size={64} className="text-indigo-500/20" />
              </div>
              <p className="text-2xl font-display font-black text-white/20 uppercase tracking-tighter italic">Awaiting Protocol Deployment...</p>
              <p className="text-[10px] font-mono font-bold text-slate/40 uppercase tracking-[0.4em] mt-4">Node status: IDLE</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
