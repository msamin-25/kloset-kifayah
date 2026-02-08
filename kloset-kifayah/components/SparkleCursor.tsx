
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

const SparkleCursor: React.FC = () => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCoords({ x: e.clientX, y: e.clientY });
    
    // Calculate distance moved to determine if we should spawn a sparkle
    const dist = Math.hypot(e.clientX - lastPos.current.x, e.clientY - lastPos.current.y);
    
    if (dist > 15) { // Only spawn when moving enough to feel like a trail
      const id = Date.now() + Math.random();
      const newSparkle: Sparkle = {
        id,
        x: e.clientX + (Math.random() - 0.5) * 10,
        y: e.clientY + (Math.random() - 0.5) * 10,
        size: Math.random() * 8 + 4, // Smaller, more delicate size
        color: Math.random() > 0.4 ? '#D4A5A5' : '#FFFFFF', // Mix of rose and white light
        rotation: Math.random() * 360
      };

      setSparkles((prev) => [...prev.slice(-20), newSparkle]);
      lastPos.current = { x: e.clientX, y: e.clientY };
      
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== id));
      }, 700);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Elegant tapered star path
  const SparklePath = "M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z";

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Main Cursor Sparkle */}
      <div 
        className="absolute transition-transform duration-75 ease-out text-rose glow-sparkle"
        style={{ 
          left: coords.x, 
          top: coords.y, 
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px'
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d={SparklePath} />
        </svg>
      </div>

      {/* Trail of Sparkles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle glow-sparkle"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            color: sparkle.color,
            transform: `translate(-50%, -50%) rotate(${sparkle.rotation}deg)`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d={SparklePath} />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default SparkleCursor;
