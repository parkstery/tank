
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import MobileControls from './components/MobileControls';
import { GameStatus, GameState, Tank } from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_RADIUS, 
  INITIAL_ADVICE,
  PLAYER_SPEED
} from './constants';
import { soundManager } from './services/soundService';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  const mobileMoveRef = useRef({ x: 0, y: 0 });
  const mobileFireRef = useRef(false);

  const initGame = useCallback(() => {
    const player: Tank = {
      id: 'player',
      pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      velocity: { x: 0, y: 0 },
      radius: PLAYER_RADIUS,
      angle: 0,
      health: 100,
      maxHealth: 100,
      type: 'player',
      cooldown: 0,
      score: 0,
      speed: PLAYER_SPEED
    };

    setGameState({
      player,
      enemies: [],
      bullets: [],
      particles: [],
      level: 1,
      status: GameStatus.PLAYING,
      advice: INITIAL_ADVICE
    });
    setStatus(GameStatus.PLAYING);
    soundManager.playLevelUp();
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setStatus(GameStatus.GAMEOVER);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#020617] flex flex-col overflow-hidden touch-none font-mono">
      <div className="scanline"></div>
      
      {/* Upper Area: Battlefield - Height Maximized */}
      <div className="flex-1 relative flex items-center justify-center p-0 sm:p-2 bg-black overflow-hidden">
        <div className="relative w-full h-full max-w-5xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x border-slate-800">
          
          {status === GameStatus.START && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 z-50 p-6 text-center">
              <div className="mb-6">
                <h1 className="text-4xl md:text-6xl font-black text-sky-500 mb-2 tracking-tighter italic drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]">
                  SYMBOLIC TANKS
                </h1>
                <p className="text-slate-500 text-xs uppercase tracking-[0.3em]">Pure Combat Edition</p>
              </div>
              <button 
                onClick={initGame}
                className="group relative px-10 py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-4 overflow-hidden"
              >
                <span className="relative z-10 text-lg tracking-widest">START MISSION</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </button>
            </div>
          )}

          {status === GameStatus.GAMEOVER && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/95 z-50">
              <h2 className="text-5xl font-black text-white mb-2 italic">MISSION FAILED</h2>
              <div className="text-xl text-red-400 mb-8 font-mono">SCORE: {gameState?.player.score.toLocaleString()}</div>
              <div className="flex gap-4">
                <button 
                  onClick={initGame}
                  className="px-8 py-3 bg-white text-red-900 font-bold rounded-lg hover:bg-red-100 transition-all shadow-xl"
                >
                  RETRY
                </button>
                <button 
                  onClick={() => setStatus(GameStatus.START)}
                  className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-all"
                >
                  EXIT
                </button>
              </div>
            </div>
          )}

          <GameCanvas 
            status={status} 
            onGameOver={handleGameOver}
            onLevelUp={(lvl) => setGameState(prev => prev ? {...prev, level: lvl} : null)}
            onScoreUpdate={(score) => setGameState(prev => prev ? {...prev, player: {...prev.player, score}} : null)}
            mobileInput={{ move: mobileMoveRef, fire: mobileFireRef }}
          />
        </div>
      </div>

      {/* Lower Area: Controller Deck */}
      <div className="h-48 md:h-64 bg-slate-900 border-t-4 border-slate-800 relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        
        <div className="max-w-4xl w-full h-full relative px-6 flex items-center justify-between">
          <MobileControls 
            onMove={(vec) => mobileMoveRef.current = vec} 
            onFire={(firing) => mobileFireRef.current = firing}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-700 text-[10px] font-bold tracking-[0.5em] uppercase pointer-events-none">
            Tank System Model-20
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
