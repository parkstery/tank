
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  LEVEL_UP = 'LEVEL_UP'
}

export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector;
  velocity: Vector;
  radius: number;
  angle: number;
  health: number;
  maxHealth: number;
}

export interface Tank extends Entity {
  type: 'player' | 'enemy';
  cooldown: number;
  score: number;
  speed: number;
}

export interface Bullet extends Entity {
  ownerId: string;
  damage: number;
}

export interface Particle {
  id: string;
  pos: Vector;
  velocity: Vector;
  life: number;
  color: string;
}

export interface GameState {
  player: Tank;
  enemies: Tank[];
  bullets: Bullet[];
  particles: Particle[];
  level: number;
  status: GameStatus;
  advice: string;
}
