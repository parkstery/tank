
import React from 'react';

interface HUDProps {
  score: number;
  level: number;
  health: number;
}

const HUD: React.FC<HUDProps> = ({ score, level, health }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Score</p>
          <p className="text-3xl font-black text-white">{score.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Level</p>
          <p className="text-xl font-bold text-sky-400">STAGE {level}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          <span>Armor Integrity</span>
          <span>{Math.max(0, Math.floor(health))}%</span>
        </div>
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div 
            className={`h-full transition-all duration-300 ${
              health > 50 ? 'bg-sky-500' : health > 20 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, health)}%` }}
          >
            <div className="w-full h-full animate-pulse bg-white/10"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
          <p className="text-[8px] text-slate-500 uppercase">Ammunition</p>
          <p className="text-xs font-bold text-slate-300">UNLIMITED</p>
        </div>
        <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
          <p className="text-[8px] text-slate-500 uppercase">Weapon</p>
          <p className="text-xs font-bold text-slate-300">PULSE CANNON</p>
        </div>
      </div>
    </div>
  );
};

export default HUD;
