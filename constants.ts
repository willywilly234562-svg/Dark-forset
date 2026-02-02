
import { Item, ItemRarity, ItemType, PlayerStats, PlayerClass } from "./types";

export const INITIAL_PLAYER_STATS: PlayerStats = {
  class: 'NONE',
  level: 1,
  xp: 0,
  maxXp: 100,
  hp: 50,
  maxHp: 50,
  attack: 5,
  defense: 2,
  gold: 0,
};

// --- CUSTOM PIXEL ART SVGS ---

// 1. DOCTOR (White coat, peach skin, brown hair)
const DOCTOR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" shape-rendering="crispEdges">
  <rect x="8" y="2" width="8" height="4" fill="%235D4037" />
  <rect x="6" y="4" width="2" height="4" fill="%235D4037" />
  <rect x="16" y="4" width="2" height="2" fill="%235D4037" />
  <rect x="8" y="6" width="8" height="6" fill="%23FFCCBC" />
  <rect x="10" y="8" width="2" height="2" fill="%23000" />
  <rect x="14" y="8" width="2" height="2" fill="%23000" />
  <rect x="6" y="12" width="12" height="14" fill="%23F5F5F5" />
  <rect x="4" y="12" width="2" height="8" fill="%23F5F5F5" />
  <rect x="18" y="12" width="2" height="8" fill="%23F5F5F5" />
  <rect x="10" y="12" width="4" height="2" fill="%23B3E5FC" />
  <rect x="11" y="14" width="2" height="6" fill="%231E88E5" />
  <rect x="4" y="20" width="2" height="2" fill="%23FFCCBC" />
  <rect x="18" y="20" width="2" height="2" fill="%23FFCCBC" />
  <rect x="8" y="26" width="2" height="4" fill="%233E2723" />
  <rect x="14" y="26" width="2" height="4" fill="%233E2723" />
</svg>`;

// 2. SOLDIER (Knight with Shield and Sword)
const SOLDIER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <rect x="8" y="2" width="8" height="8" fill="%23333" />
  <rect x="10" y="4" width="4" height="4" fill="%23111" />
  <rect x="11" y="4" width="2" height="6" fill="%23111" />
  <rect x="9" y="10" width="6" height="8" fill="%23EEE" />
  <rect x="9" y="18" width="2" height="4" fill="%23333" />
  <rect x="13" y="18" width="2" height="4" fill="%23333" />
  <rect x="4" y="10" width="8" height="10" rx="1" fill="%23FFF" />
  <rect x="4" y="10" width="8" height="10" rx="1" fill="none" stroke="%23333" stroke-width="0.5" />
  <path d="M8 11V19 M5 14H11" stroke="%232563EB" stroke-width="2" />
  <rect x="5" y="11" width="2" height="2" fill="%23F59E0B" />
  <rect x="9" y="17" width="2" height="2" fill="%23F59E0B" />
  <rect x="16" y="8" width="2" height="10" fill="%239CA3AF" />
  <rect x="15" y="14" width="4" height="2" fill="%23F59E0B" />
  <rect x="16" y="16" width="2" height="3" fill="%235D4037" />
</svg>`;

// 3. WOLF (Grey beast)
const WOLF_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <rect x="6" y="10" width="12" height="8" fill="%239E9E9E" />
  <rect x="6" y="18" width="2" height="4" fill="%23757575" />
  <rect x="8" y="18" width="2" height="4" fill="%23616161" />
  <rect x="14" y="18" width="2" height="4" fill="%23757575" />
  <rect x="16" y="18" width="2" height="4" fill="%23616161" />
  <rect x="4" y="6" width="6" height="6" fill="%239E9E9E" />
  <rect x="2" y="8" width="2" height="2" fill="%23424242" />
  <rect x="6" y="7" width="2" height="2" fill="%23000" />
  <rect x="6" y="4" width="2" height="2" fill="%23757575" />
  <rect x="18" y="10" width="2" height="4" fill="%239E9E9E" />
  <rect x="19" y="12" width="2" height="2" fill="%23757575" />
</svg>`;

// 4. ZOMBIE (Green skin, Blue suit)
const ZOMBIE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" shape-rendering="crispEdges">
  <rect x="8" y="4" width="8" height="8" fill="%23AED581" />
  <rect x="9" y="7" width="2" height="2" fill="%23FFF" />
  <rect x="13" y="7" width="2" height="2" fill="%23FFF" />
  <rect x="9" y="10" width="6" height="1" fill="%2333691E" />
  <rect x="10" y="9" width="1" height="1" fill="%23B71C1C" />
  <rect x="6" y="12" width="12" height="10" fill="%23283593" />
  <rect x="11" y="12" width="2" height="10" fill="%23FFF" />
  <rect x="11" y="14" width="2" height="4" fill="%23B71C1C" />
  <rect x="4" y="12" width="2" height="8" fill="%23283593" />
  <rect x="18" y="12" width="2" height="8" fill="%23283593" />
  <rect x="4" y="20" width="2" height="2" fill="%23AED581" />
  <rect x="18" y="20" width="2" height="2" fill="%23AED581" />
  <rect x="8" y="22" width="3" height="8" fill="%231A237E" />
  <rect x="13" y="22" width="3" height="8" fill="%231A237E" />
  <rect x="8" y="30" width="3" height="2" fill="%23000" />
  <rect x="13" y="30" width="3" height="2" fill="%23000" />
</svg>`;


export const PLAYER_SPRITES: Record<PlayerClass, string> = {
    'SOLDIER': SOLDIER_SVG,
    'DOCTOR': DOCTOR_SVG,
    'NONE': '👻'
};

export const BASIC_ITEMS: Item[] = [
  {
    id: 'basic-sword',
    name: 'Rusty Sword',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    description: 'Better than using your fists, but barely.',
    stats: { attack: 2 },
    value: 10,
  },
  {
    id: 'wooden-club',
    name: 'Wooden Club',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    description: 'A heavy branch found in the woods.',
    stats: { attack: 3 },
    value: 12,
  },
  {
    id: 'short-bow',
    name: 'Short Bow',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    description: 'Good for hunting small game.',
    stats: { attack: 4 },
    value: 18,
  },
  {
    id: 'leather-tunic',
    name: 'Leather Tunic',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    description: 'Smells of sweat and old cow.',
    stats: { defense: 2 },
    value: 15,
  },
  {
    id: 'wooden-shield',
    name: 'Wooden Shield',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    description: 'Splinters easily, but better than skin.',
    stats: { defense: 1, hpBonus: 5 },
    value: 12,
  },
  {
    id: 'lucky-pebble',
    name: 'Lucky Pebble',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.COMMON,
    description: 'Just a smooth rock, but it feels lucky.',
    stats: { hpBonus: 2 },
    value: 5,
  },
];

export const SHOP_ITEMS: Item[] = [
  // --- CONSUMABLES ---
  {
    id: 'potion-red',
    name: 'Health Potion',
    type: ItemType.ACCESSORY, 
    rarity: ItemRarity.COMMON,
    description: 'Instantly heals 50 HP (Consumed on purchase).',
    stats: { hpBonus: 0 },
    value: 25,
  },
  {
    id: 'elixir-vitality',
    name: 'Elixir of Vitality',
    type: ItemType.ACCESSORY, 
    rarity: ItemRarity.RARE,
    description: 'Instantly heals 150 HP (Consumed on purchase).',
    stats: { hpBonus: 0 },
    value: 75,
  },

  // --- COMMON WEAPONS ---
  {
    id: 'iron-sword',
    name: 'Iron Sword',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    description: 'Standard issue soldier blade.',
    stats: { attack: 5 },
    value: 50,
  },
  {
    id: 'heavy-mace',
    name: 'Heavy Mace',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    description: 'Simple, heavy, effective.',
    stats: { attack: 6 },
    value: 60,
  },

  // --- RARE WEAPONS ---
  {
    id: 'steel-saber',
    name: 'Steel Saber',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    description: 'Finely balanced curved blade.',
    stats: { attack: 12 },
    value: 250,
  },
  {
    id: 'assassin-dagger',
    name: 'Assassin Dagger',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    description: 'Coated in a thin layer of venom.',
    stats: { attack: 14 },
    value: 300,
  },
  {
    id: 'great-axe',
    name: 'Great Axe',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    description: 'Requires two hands and great strength.',
    stats: { attack: 16 },
    value: 350,
  },

  // --- EPIC WEAPONS ---
  {
    id: 'magma-blade',
    name: 'Magma Blade',
    type: ItemType.WEAPON,
    rarity: ItemRarity.EPIC,
    description: 'Warm to the touch. Burns enemies.',
    stats: { attack: 25 },
    value: 1200,
  },
  {
    id: 'void-bow',
    name: 'Void Bow',
    type: ItemType.WEAPON,
    rarity: ItemRarity.EPIC,
    description: 'Arrows fired vanish and reappear in the target.',
    stats: { attack: 28 },
    value: 1400,
  },

  // --- LEGENDARY WEAPONS ---
  {
    id: 'dragon-slayer',
    name: 'Dragon Slayer',
    type: ItemType.WEAPON,
    rarity: ItemRarity.LEGENDARY,
    description: 'A colossal slab of iron meant for killing beasts.',
    stats: { attack: 45, hpBonus: 50 },
    value: 5000,
  },
  {
    id: 'mjolnir-replica',
    name: 'Thunder Hammer',
    type: ItemType.WEAPON,
    rarity: ItemRarity.LEGENDARY,
    description: 'Crackles with the energy of the storm.',
    stats: { attack: 50 },
    value: 5500,
  },

  // --- MYTHIC WEAPONS ---
  {
    id: 'excalibur',
    name: 'Excalibur',
    type: ItemType.WEAPON,
    rarity: ItemRarity.MYTHIC,
    description: 'The sword of promised victory. Blinds enemies with its light.',
    stats: { attack: 80, defense: 20, hpBonus: 200 },
    value: 25000,
  },
  {
    id: 'soul-reaper',
    name: 'Soul Reaper',
    type: ItemType.WEAPON,
    rarity: ItemRarity.MYTHIC,
    description: 'A scythe that harvests the souls of the living.',
    stats: { attack: 95 },
    value: 30000,
  },

  // --- ARMOR ---
  {
    id: 'chainmail',
    name: 'Chainmail',
    type: ItemType.ARMOR,
    rarity: ItemRarity.RARE,
    description: 'Interlinked rings provide decent protection.',
    stats: { defense: 6, hpBonus: 10 },
    value: 200,
  },
  {
    id: 'plate-breastplate',
    name: 'Iron Breastplate',
    type: ItemType.ARMOR,
    rarity: ItemRarity.RARE,
    description: 'Solid iron plate protection.',
    stats: { defense: 9 },
    value: 280,
  },
  {
    id: 'elven-cloak',
    name: 'Elven Cloak',
    type: ItemType.ARMOR,
    rarity: ItemRarity.EPIC,
    description: 'Light as a feather, hard as diamond.',
    stats: { defense: 15, hpBonus: 50 },
    value: 1500,
  },
  {
    id: 'obsidian-armor',
    name: 'Obsidian Plate',
    type: ItemType.ARMOR,
    rarity: ItemRarity.LEGENDARY,
    description: 'Forged in the heart of a volcano.',
    stats: { defense: 30, hpBonus: 100 },
    value: 6000,
  },
  {
    id: 'demon-king-armor',
    name: 'Demon King\'s Armor',
    type: ItemType.ARMOR,
    rarity: ItemRarity.MYTHIC,
    description: 'Radiates an aura of absolute dominance.',
    stats: { defense: 60, attack: 20, hpBonus: 500 },
    value: 40000,
  },

  // --- ACCESSORIES ---
  {
    id: 'amulet-strength',
    name: 'Amulet of Might',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.RARE,
    description: 'You feel a surge of power.',
    stats: { attack: 5 },
    value: 250,
  },
  {
    id: 'ring-protection',
    name: 'Ring of Protection',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.RARE,
    description: 'Magically deflects minor blows.',
    stats: { defense: 4, hpBonus: 20 },
    value: 300,
  },
  {
    id: 'phoenix-feather',
    name: 'Phoenix Feather',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.EPIC,
    description: 'Warm to the touch, restores vitality.',
    stats: { hpBonus: 100, defense: 5 },
    value: 1000,
  },
  {
    id: 'dragon-eye',
    name: 'Dragon Eye',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.LEGENDARY,
    description: 'See the weakness in all things.',
    stats: { attack: 20, defense: 10 },
    value: 4500,
  },
  {
    id: 'eternity-ring',
    name: 'Ring of Eternity',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.MYTHIC,
    description: 'Time bends around the wearer.',
    stats: { attack: 30, defense: 30, hpBonus: 300 },
    value: 50000,
  },
];

export const MONSTER_NAMES = [
    "Starving Wolf", "Fresh Corpse",
    "Wild Wolf", "Shambling Zombie",
    "Pack Hunter", "Rotting Walker",
    "Dire Wolf", "Infected Villager",
    "Timber Wolf", "Plague Carrier",
    "Alpha Wolf", "Crypt Ghoul",
    "Shadow Wolf", "Armored Zombie",
    "Frost Wolf", "Undead Knight",
    "Hellhound", "Lich Minion",
    "Fenrir Spawn", "Zombie King"
];

export const MONSTER_SPRITES: Record<string, string> = {
    // Wolves
    "Starving Wolf": WOLF_SVG,
    "Wild Wolf": WOLF_SVG,
    "Pack Hunter": WOLF_SVG,
    "Dire Wolf": WOLF_SVG,
    "Timber Wolf": WOLF_SVG,
    "Alpha Wolf": WOLF_SVG,
    "Shadow Wolf": WOLF_SVG,
    "Frost Wolf": WOLF_SVG,
    "Hellhound": WOLF_SVG,
    "Fenrir Spawn": WOLF_SVG,

    // Zombies
    "Fresh Corpse": ZOMBIE_SVG,
    "Shambling Zombie": ZOMBIE_SVG,
    "Rotting Walker": ZOMBIE_SVG,
    "Infected Villager": ZOMBIE_SVG,
    "Plague Carrier": ZOMBIE_SVG,
    "Crypt Ghoul": ZOMBIE_SVG,
    "Armored Zombie": ZOMBIE_SVG,
    "Undead Knight": ZOMBIE_SVG,
    "Lich Minion": ZOMBIE_SVG,
    "Zombie King": ZOMBIE_SVG,
};
