import React from 'react';

const NeuralBackground = () => {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden bg-ink-900">
      {/* Deep Space Gradient */}
      <div className="absolute inset-0 bg-stellar-mesh opacity-40" />
      
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
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400/20 blur-[2px] animate-particle"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 10 + 's',
              animationDuration: 15 + Math.random() * 10 + 's'
            }}
          />
        ))}
      </div>

      {/* Scanner Line Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-[2px] w-full top-0 animate-[scan_8s_linear_infinite]" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}} />
    </div>
  );
};

export default NeuralBackground;
