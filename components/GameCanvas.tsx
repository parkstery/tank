
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
  GameStatus, 
  Vector, 
  Tank, 
  Bullet, 
  Particle 
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  COLORS, 
  PLAYER_SPEED, 
  BULLET_SPEED, 
  SHOOT_COOLDOWN,
  PLAYER_RADIUS,
  ENEMY_RADIUS,
  BULLET_RADIUS
} from '../constants';
import { soundManager } from '../services/soundService';

interface Item {
  id: string;
  pos: Vector;
  type: 'health';
  timer: number; 
}

interface GameCanvasProps {
  status: GameStatus;
  onGameOver: (score: number) => void;
  onLevelUp: (level: number) => void;
  onScoreUpdate: (score: number) => void;
  mobileInput?: {
    move: React.MutableRefObject<{ x: number; y: number }>;
    fire: React.MutableRefObject<boolean>;
  };
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, onGameOver, onLevelUp, onScoreUpdate, mobileInput }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const hitFlashRef = useRef<number>(0);
  const UI_HEIGHT = 75; // 상단 HUD 높이
  
  const playerRef = useRef<Tank>({
    id: 'player',
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 + UI_HEIGHT },
    velocity: { x: 0, y: 0 },
    radius: PLAYER_RADIUS,
    angle: 0,
    health: 100,
    maxHealth: 100,
    type: 'player',
    cooldown: 0,
    score: 0,
    speed: PLAYER_SPEED
  });

  const enemiesRef = useRef<Tank[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<Vector>({ x: 0, y: 0 });
  const levelRef = useRef<number>(1);

  const getPlayerDamage = () => 25 * Math.pow(1.2, levelRef.current - 1);

  const spawnHealthItem = useCallback(() => {
    itemsRef.current.push({
      id: Math.random().toString(),
      pos: { 
        x: 100 + Math.random() * (CANVAS_WIDTH - 200), 
        y: UI_HEIGHT + 100 + Math.random() * (CANVAS_HEIGHT - UI_HEIGHT - 200) 
      },
      type: 'health',
      timer: 300 // 5 seconds
    });
  }, []);

  const spawnEnemy = useCallback(() => {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * CANVAS_WIDTH; y = -50; }
    else if (side === 1) { x = CANVAS_WIDTH + 50; y = Math.random() * CANVAS_HEIGHT; }
    else if (side === 2) { x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 50; }
    else { x = -50; y = Math.random() * CANVAS_HEIGHT; }

    const enemy: Tank = {
      id: Math.random().toString(),
      pos: { x, y },
      velocity: { x: 0, y: 0 },
      radius: ENEMY_RADIUS,
      angle: 0,
      health: 20 + levelRef.current * 15,
      maxHealth: 20 + levelRef.current * 15,
      type: 'enemy',
      cooldown: 60,
      score: 0,
      speed: 1.5 + (levelRef.current * 0.12)
    };
    enemiesRef.current.push(enemy);
  }, []);

  const createExplosion = (pos: Vector, color: string) => {
    soundManager.playExplosion();
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { ...pos },
        velocity: { 
          x: (Math.random() - 0.5) * 6, 
          y: (Math.random() - 0.5) * 6 
        },
        life: 1.0,
        color
      });
    }
  };

  const update = () => {
    if (status !== GameStatus.PLAYING) return;

    const p = playerRef.current;
    if (hitFlashRef.current > 0) hitFlashRef.current -= 0.05;

    // Movement
    let dx = 0, dy = 0;
    if (keysRef.current.has('w') || keysRef.current.has('arrowup')) dy -= p.speed;
    if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) dy += p.speed;
    if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) dx -= p.speed;
    if (keysRef.current.has('d') || keysRef.current.has('arrowright')) dx += p.speed;

    if (mobileInput && (mobileInput.move.current.x !== 0 || mobileInput.move.current.y !== 0)) {
      dx = mobileInput.move.current.x * p.speed;
      dy = mobileInput.move.current.y * p.speed;
    }

    p.pos.x += dx;
    p.pos.y += dy;
    
    // Boundary Clamping (Request #2): Prevents tank from going outside battlefield
    p.pos.x = Math.max(p.radius, Math.min(CANVAS_WIDTH - p.radius, p.pos.x));
    p.pos.y = Math.max(UI_HEIGHT + p.radius, Math.min(CANVAS_HEIGHT - p.radius, p.pos.y));

    // Aiming
    const isMobileInput = mobileInput && (mobileInput.move.current.x !== 0 || mobileInput.move.current.y !== 0 || mobileInput.fire.current);
    if (isMobileInput && enemiesRef.current.length > 0) {
      let closestEnemy = enemiesRef.current[0];
      let minDist = Infinity;
      enemiesRef.current.forEach(e => {
        const d = Math.sqrt((p.pos.x - e.pos.x)**2 + (p.pos.y - e.pos.y)**2);
        if (d < minDist) { minDist = d; closestEnemy = e; }
      });
      p.angle = Math.atan2(closestEnemy.pos.y - p.pos.y, closestEnemy.pos.x - p.pos.x);
    } else {
      p.angle = Math.atan2(mouseRef.current.y - p.pos.y, mouseRef.current.x - p.pos.x);
    }

    // Shooting
    if (p.cooldown > 0) p.cooldown--;
    const isFiring = keysRef.current.has('CLICK') || (mobileInput?.fire.current);
    
    if (isFiring && p.cooldown <= 0) {
      soundManager.playShoot();
      bulletsRef.current.push({
        id: Math.random().toString(),
        ownerId: 'player',
        pos: { 
          x: p.pos.x + Math.cos(p.angle) * p.radius, 
          y: p.pos.y + Math.sin(p.angle) * p.radius 
        },
        velocity: { 
          x: Math.cos(p.angle) * BULLET_SPEED, 
          y: Math.sin(p.angle) * BULLET_SPEED 
        },
        radius: BULLET_RADIUS,
        angle: p.angle,
        health: 1,
        maxHealth: 1,
        damage: getPlayerDamage()
      });
      p.cooldown = SHOOT_COOLDOWN;
    }

    // Entities
    bulletsRef.current = bulletsRef.current.filter(b => {
      b.pos.x += b.velocity.x; b.pos.y += b.velocity.y;
      return b.pos.x > -50 && b.pos.x < CANVAS_WIDTH + 50 && b.pos.y > -50 && b.pos.y < CANVAS_HEIGHT + 50;
    });

    enemiesRef.current.forEach(e => {
      const dist = Math.sqrt((p.pos.x - e.pos.x)**2 + (p.pos.y - e.pos.y)**2);
      const angle = Math.atan2(p.pos.y - e.pos.y, p.pos.x - e.pos.x);
      e.angle = angle;
      if (dist > 180) {
        e.pos.x += Math.cos(angle) * e.speed;
        e.pos.y += Math.sin(angle) * e.speed;
      }
      if (e.cooldown > 0) e.cooldown--;
      if (e.cooldown <= 0 && dist < 450) {
        bulletsRef.current.push({
          id: Math.random().toString(), ownerId: e.id,
          pos: { x: e.pos.x, y: e.pos.y },
          velocity: { x: Math.cos(angle) * (BULLET_SPEED - 1.5), y: Math.sin(angle) * (BULLET_SPEED - 1.5) },
          radius: BULLET_RADIUS, angle, health: 1, maxHealth: 1,
          damage: 10 + levelRef.current * 4
        });
        e.cooldown = Math.max(30, 90 - (levelRef.current * 3)); 
      }
    });

    // Item Interaction: Refill + 10% Max HP Increase (Request #3)
    itemsRef.current = itemsRef.current.filter(item => {
      item.timer--;
      const d = Math.sqrt((item.pos.x - p.pos.x)**2 + (item.pos.y - p.pos.y)**2);
      if (d < p.radius + 15) {
        p.maxHealth *= 1.10; // 10% increase per PM Request
        p.health = p.maxHealth; 
        soundManager.playLevelUp(); 
        createExplosion(item.pos, COLORS.ACCENT);
        return false;
      }
      return item.timer > 0;
    });

    // Collisions
    bulletsRef.current = bulletsRef.current.filter(b => {
      let hit = false;
      if (b.ownerId === 'player') {
        enemiesRef.current.forEach(e => {
          const d = Math.sqrt((b.pos.x - e.pos.x)**2 + (b.pos.y - e.pos.y)**2);
          if (d < b.radius + e.radius) {
            e.health -= b.damage; hit = true;
            soundManager.playHit(); createExplosion(b.pos, COLORS.BULLET);
          }
        });
      } else {
        const d = Math.sqrt((b.pos.x - p.pos.x)**2 + (b.pos.y - p.pos.y)**2);
        if (d < b.radius + p.radius) {
          p.health -= b.damage; hit = true; hitFlashRef.current = 0.35;
          soundManager.playHit(); createExplosion(b.pos, COLORS.PLAYER);
        }
      }
      return !hit;
    });

    enemiesRef.current = enemiesRef.current.filter(e => {
      if (e.health <= 0) {
        p.score += 100 * levelRef.current;
        onScoreUpdate(p.score);
        createExplosion(e.pos, COLORS.ENEMY);
        return false;
      }
      return true;
    });

    if (p.health <= 0) onGameOver(p.score);

    particlesRef.current.forEach(pt => {
      pt.pos.x += pt.velocity.x; pt.pos.y += pt.velocity.y; pt.life -= 0.02;
    });
    particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);

    // Level Up: HP Reset/Refill
    if (enemiesRef.current.length === 0 && status === GameStatus.PLAYING) {
      levelRef.current += 1;
      p.health = p.maxHealth; 
      
      soundManager.playLevelUp();
      onLevelUp(levelRef.current);
      
      if (levelRef.current >= 5) spawnHealthItem();

      const enemyCount = Math.min(15, 3 + levelRef.current);
      for (let i = 0; i < enemyCount; i++) spawnEnemy();
    }
  };

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    const p = playerRef.current;
    
    // Top Bar Background
    ctx.fillStyle = 'rgba(2, 6, 23, 0.98)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, UI_HEIGHT);
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, UI_HEIGHT); ctx.lineTo(CANVAS_WIDTH, UI_HEIGHT); ctx.stroke();

    // Score & Level
    ctx.font = 'bold 14px "JetBrains Mono"';
    ctx.fillStyle = COLORS.UI_TEXT; ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${p.score.toLocaleString()}`, 20, 30);
    ctx.font = '900 24px "JetBrains Mono"';
    ctx.fillStyle = COLORS.PLAYER; ctx.textAlign = 'center';
    ctx.fillText(`STAGE ${levelRef.current}`, CANVAS_WIDTH / 2, 45);

    // Segmented Armor Bar
    const barWidth = 250;
    const barHeight = 22;
    const barX = CANVAS_WIDTH - 270;
    const barY = 25;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const baseCap = 100;
    const bonusCap = Math.max(0, p.maxHealth - baseCap);
    const totalMax = p.maxHealth;
    const baseSegmentWidth = (baseCap / totalMax) * barWidth;
    const bonusSegmentWidth = (bonusCap / totalMax) * barWidth;

    const currentBaseHP = Math.min(baseCap, p.health);
    const baseFillWidth = (currentBaseHP / baseCap) * baseSegmentWidth;
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(barX, barY, baseFillWidth, barHeight);

    if (bonusCap > 0) {
      const currentBonusHP = Math.max(0, p.health - baseCap);
      const bonusFillWidth = (currentBonusHP / bonusCap) * bonusSegmentWidth;
      const bonusStartX = barX + baseSegmentWidth;
      
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bonusStartX, barY); ctx.lineTo(bonusStartX, barY + barHeight); ctx.stroke();

      ctx.fillStyle = COLORS.ACCENT;
      ctx.fillRect(bonusStartX, barY, bonusFillWidth, barHeight);
    }
    
    ctx.font = 'bold 11px "JetBrains Mono"';
    ctx.fillStyle = COLORS.UI_TEXT; ctx.textAlign = 'center';
    ctx.fillText(`${Math.round((p.health/p.maxHealth)*100)}% INTEGRITY`, barX + barWidth/2, barY + 16);

    ctx.textAlign = 'right';
    ctx.font = 'bold 9px "JetBrains Mono"';
    ctx.fillText('CORE / REINFORCED', barX - 10, barY + 15);

    ctx.font = '9px "JetBrains Mono"';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.BULLET;
    ctx.fillText(`ATK: ${Math.round(getPlayerDamage())}`, 20, 60);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.ACCENT;
    ctx.fillText(`TOTAL DURABILITY: ${Math.round(p.maxHealth)}`, CANVAS_WIDTH - 20, 60);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = COLORS.BG; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid
    ctx.strokeStyle = COLORS.GRID; ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

    // Items
    itemsRef.current.forEach(item => {
      const isExpiring = item.timer < 90;
      if (isExpiring && Math.floor(Date.now() / 150) % 2 === 0) return;
      
      ctx.fillStyle = COLORS.ACCENT; 
      ctx.shadowBlur = 20; ctx.shadowColor = COLORS.ACCENT;
      
      ctx.save();
      ctx.translate(item.pos.x, item.pos.y);
      ctx.rotate(Date.now() / 500);
      ctx.fillRect(-12, -12, 24, 24);
      ctx.restore();

      ctx.fillStyle = '#fff';
      ctx.fillRect(item.pos.x - 2, item.pos.y - 8, 4, 16); 
      ctx.fillRect(item.pos.x - 8, item.pos.y - 2, 16, 4);
      ctx.shadowBlur = 0;
    });

    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = pt.life; ctx.fillStyle = pt.color; ctx.fillRect(pt.pos.x, pt.pos.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;

    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.ownerId === 'player' ? COLORS.BULLET : COLORS.ENEMY;
      ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2); ctx.fill();
    });

    enemiesRef.current.forEach(e => {
      ctx.save(); ctx.translate(e.pos.x, e.pos.y); ctx.rotate(e.angle);
      ctx.fillStyle = COLORS.ENEMY; ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
      ctx.fillStyle = '#b91c1c'; ctx.fillRect(e.radius * 0.5, -5, e.radius * 1.2, 10);
      ctx.restore();
      ctx.fillStyle = '#444'; ctx.fillRect(e.pos.x - 20, e.pos.y - 30, 40, 4);
      ctx.fillStyle = COLORS.ENEMY; ctx.fillRect(e.pos.x - 20, e.pos.y - 30, 40 * (e.health / e.maxHealth), 4);
    });

    const p = playerRef.current;
    ctx.save(); ctx.translate(p.pos.x, p.pos.y); ctx.rotate(p.angle);
    ctx.fillStyle = COLORS.PLAYER; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillRect(p.radius * 0.5, -6, p.radius * 1.5, 12); ctx.restore();

    if (hitFlashRef.current > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${hitFlashRef.current})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    drawUI(ctx);
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) { update(); draw(ctx); }
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [status, mobileInput]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      playerRef.current = { 
        ...playerRef.current, 
        pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 + UI_HEIGHT }, 
        health: 100, maxHealth: 100, score: 0 
      };
      levelRef.current = 1;
      enemiesRef.current = []; bulletsRef.current = []; particlesRef.current = []; itemsRef.current = [];
      spawnEnemy();
    }
  }, [status, spawnEnemy]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) { mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }; }
    };
    const handleMouseDown = () => keysRef.current.add('CLICK');
    const handleMouseUp = () => keysRef.current.delete('CLICK');

    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown); window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameLoop]);

  return (
    <canvas 
      ref={canvasRef} 
      width={CANVAS_WIDTH} 
      height={CANVAS_HEIGHT}
      style={{ backgroundColor: COLORS.BG }}
      className="w-full h-full object-contain cursor-crosshair"
    />
  );
};

export default GameCanvas;
