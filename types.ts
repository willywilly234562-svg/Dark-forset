
export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  ACCESSORY = 'ACCESSORY',
}

export enum ItemRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  stats: {
    attack?: number;
    defense?: number;
    hpBonus?: number;
  };
  value: number;
}

export type PlayerClass = 'DOCTOR' | 'SOLDIER' | 'NONE';

export interface PlayerStats {
  class: PlayerClass;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  gold: number;
}

export interface EquipmentSlots {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'combat' | 'loot' | 'puzzle' | 'error';
  timestamp: number;
}

export interface PuzzleState {
  isActive: boolean;
  riddle: string | null;
  solutionHash?: string; // Not using hash for AI verification, but keeping structure loosely
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isLoading: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  rank: 'NORMAL' | 'ELITE' | 'BOSS';
  sprite: string; // Visual representation (Emoji/Icon)
  // Combat runtime props
  x: number;
  y: number;
  facing: 'LEFT' | 'RIGHT';
  lastAttackTime: number;
  isHit?: boolean;
}
