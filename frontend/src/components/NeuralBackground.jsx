import React, { useEffect, useRef } from 'react';

const NeuralBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check performance settings
    const lowPerf = typeof document !== 'undefined' && document.documentElement.getAttribute('data-perf') === 'low';
    if (lowPerf) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Config parameters
    const particleCount = 65;
    const connectionDist = 125;
    const mouseConnectionDist = 180;
    
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2 + 1,
          pulse: Math.random() * Math.PI,
          pulseSpeed: 0.01 + Math.random() * 0.02
        });
      }
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Initial setup
    handleResize();

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Dark, premium deep-space background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Render subtle radial meshes behind nodes
      const gradient = ctx.createRadialGradient(
        w / 2, h / 2, 50,
        w / 2, h / 2, Math.max(w, h)
      );
      gradient.addColorStop(0, '#050308');
      gradient.addColorStop(0.5, '#010103');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Draw faint grid lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw particles and connection lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Update positions
        p1.x += p1.vx;
        p1.y += p1.vy;
        p1.pulse += p1.pulseSpeed;

        // Interactive mouse hover feedback - gentle push
        if (mouseRef.current.active) {
          const dx = p1.x - mouseRef.current.x;
          const dy = p1.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseConnectionDist) {
            const force = (mouseConnectionDist - dist) / mouseConnectionDist;
            p1.x += (dx / dist) * force * 1.1;
            p1.y += (dy / dist) * force * 1.1;
          }
        }

        // Bound collision checks
        if (p1.x < 0 || p1.x > w) p1.vx *= -1;
        if (p1.y < 0 || p1.y > h) p1.vy *= -1;
        
        // Keep particles within bounding container
        p1.x = Math.max(0, Math.min(w, p1.x));
        p1.y = Math.max(0, Math.min(h, p1.y));

        // Pulsating glowing radius
        const currentRadius = p1.radius + Math.sin(p1.pulse) * 0.5;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, currentRadius, 0, Math.PI * 2);
        
        // Vary colors between indigo, cyan and violet
        if (i % 3 === 0) {
          ctx.fillStyle = `rgba(34, 211, 238, ${0.25 + Math.sin(p1.pulse) * 0.1})`; // Cyan
        } else if (i % 3 === 1) {
          ctx.fillStyle = `rgba(99, 102, 241, ${0.25 + Math.sin(p1.pulse) * 0.1})`; // Indigo
        } else {
          ctx.fillStyle = `rgba(168, 85, 247, ${0.25 + Math.sin(p1.pulse) * 0.1})`; // Purple
        }
        ctx.fill();

        // Connect lines to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.11;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw active user connection to cursor
        if (mouseRef.current.active) {
          const dx = p1.x - mouseRef.current.x;
          const dy = p1.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseConnectionDist) {
            const alpha = (1 - dist / mouseConnectionDist) * 0.15;
            // Draw interactive glowing connection
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const lowPerf = typeof document !== 'undefined' && document.documentElement.getAttribute('data-perf') === 'low';

  if (lowPerf) {
    return (
      <div className="fixed inset-0 -z-20 overflow-hidden bg-black">
        {/* Simple visual design fallback for low-power engines */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 pointer-events-none block"
      style={{ background: '#000000' }}
    />
  );
};

export default React.memo(NeuralBackground);
