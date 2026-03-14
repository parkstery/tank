
import React, { useState, useRef } from 'react';

interface MobileControlsProps {
  onMove: (vector: { x: number; y: number }) => void;
  onFire: (isFiring: boolean) => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onFire }) => {
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const joystickBaseRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    updateJoystick(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    updateJoystick(clientX, clientY);
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;
    
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }
    
    setJoystickPos({ x: dx, y: dy });
    onMove({ x: dx / maxRadius, y: dy / maxRadius });
  };

  const handleEnd = () => {
    setIsDragging(false);
    setJoystickPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  return (
    <div className="w-full h-full flex items-center justify-between relative">
      {/* Navigation Stick (Left) */}
      <div className="flex flex-col items-center gap-2">
        <div 
          className="w-32 h-32 md:w-40 md:h-40 bg-slate-800 rounded-full border-4 border-slate-700 shadow-inner flex items-center justify-center relative touch-none select-none"
          ref={joystickBaseRef}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          {/* Stick Head */}
          <div 
            className="w-14 h-14 md:w-16 md:h-16 bg-slate-600 rounded-full border-4 border-slate-500 shadow-[0_5px_15px_rgba(0,0,0,0.5)] transition-transform duration-75 pointer-events-none"
            style={{ 
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)` 
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white/10 to-transparent"></div>
          </div>
        </div>
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Navigation</span>
      </div>

      {/* Fire Button (Right) */}
      <div className="flex flex-col items-center gap-2">
        <button 
          className="w-28 h-28 md:w-36 md:h-36 bg-red-700 rounded-full border-4 border-red-800 shadow-[0_8px_0_rgb(153,27,27),0_15px_20px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0_4px_0_rgb(153,27,27),0_8px_10px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all touch-none select-none group"
          onMouseDown={() => onFire(true)}
          onMouseUp={() => onFire(false)}
          onMouseLeave={() => onFire(false)}
          onTouchStart={(e) => { e.preventDefault(); onFire(true); }}
          onTouchEnd={(e) => { e.preventDefault(); onFire(false); }}
        >
          <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-b from-red-500/20 to-transparent p-4">
             <span className="text-red-100 font-black text-2xl md:text-3xl italic tracking-tighter drop-shadow-md group-active:scale-95 transition-transform">FIRE</span>
          </div>
        </button>
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Weapon System</span>
      </div>
    </div>
  );
};

export default MobileControls;
