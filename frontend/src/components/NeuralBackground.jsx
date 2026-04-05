import React, { useMemo } from 'react';

const NeuralBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1.5,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 14 + Math.random() * 8,
    }));
  }, []);

  const lowPerf = typeof document !== 'undefined' && document.documentElement.getAttribute('data-perf') === 'low';

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden bg-ink-900">
      {/* Deep Space Gradient */}
      <div className="absolute inset-0 bg-stellar-mesh opacity-40" />

      {lowPerf ? (
        <>
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.18) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-500/8 blur-[80px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-cyan-400/8 blur-[80px] rounded-full" />
        </>
      ) : (
        <>
      {/* Animated Grid */}
      <div 
        className="absolute inset-0 opacity-[0.15] animate-grid-move"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.4) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Living Network Particles */}
      <div className="absolute inset-0 mask-radial-faded">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-cyan-400/20 blur-[2px] animate-particle"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              top: `${p.top}%`,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Scanner Line Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-[2px] w-full top-0 animate-scan-line" />
        </>
      )}
    </div>
  );
};

export default React.memo(NeuralBackground);
