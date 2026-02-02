import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Shield, Sword, Coins, ShoppingBag, Tent, Ghost, Zap, Move, Skull, Heart, Wind, Hammer, LogOut, AlertTriangle, Key } from 'lucide-react';
import { PlayerStats, Item, EquipmentSlots, LogEntry, PuzzleState, Enemy, PlayerClass } from './types';
import { INITIAL_PLAYER_STATS, BASIC_ITEMS, MONSTER_NAMES, MONSTER_SPRITES, SHOP_ITEMS } from './constants';
import ItemCard from './components/ItemCard';
import PlayerAvatar from './components/PlayerAvatar';
import SwordAnimation from './components/SwordAnimation';
import ApiKeyModal from './components/ApiKeyModal';
import { generateRiddle, verifyRiddleAnswer, generateLegendaryItem } from './services/geminiService';

// --- Utils ---
const uuid = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// --- CONSTANTS ---
const GAME_SCALE = 1.45; // Zoom factor (Balanced between 1.0 and 1.75)

// Deterministic random for terrain features based on coordinates
const pseudoRandom = (x: number, y: number) => {
    let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return n - Math.floor(n);
};

interface Position {
    x: number;
    y: number;
}

interface CombatState {
    isActive: boolean;
    enemies: Enemy[];
    lastAction: string;
    playerAnimating: boolean;
    playerPos: Position;
    playerFacing: 'LEFT' | 'RIGHT';
    waveCount: number;
    visualEffects: { id: string, x: number, y: number, type: 'dash' | 'thunder' | 'heal' | 'block', timestamp: number }[];
    blockEndTime: number; // Timestamp when block expires
    deathAnimationStart: number | null; // Timestamp for death animation
    killerName: string | null; // Track who killed the player
    isAttacking: boolean; // Animation state for attacking
}

interface CombatResult {
    type: 'VICTORY' | 'DEFEAT';
    enemyName: string; // Name of the one that killed you, or "The Horde"
    xpGain: number;
    goldGain: number;
    drops: Item[];
}

export default function App() {
  // --- State ---
  const [player, setPlayer] = useState<PlayerStats>(INITIAL_PLAYER_STATS);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [equipment, setEquipment] = useState<EquipmentSlots>({ weapon: null, armor: null, accessory: null });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'ADVENTURE' | 'INVENTORY' | 'SHOP' | 'PUZZLE'>('ADVENTURE');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSwordAnimation, setShowSwordAnimation] = useState(false);
  
  // API Key State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Combat State
  const [combat, setCombat] = useState<CombatState>({
    isActive: false,
    enemies: [],
    lastAction: '',
    playerAnimating: false,
    playerPos: { x: 0, y: 0 }, // World Coordinates (0,0 is start)
    playerFacing: 'RIGHT',
    waveCount: 0,
    visualEffects: [],
    blockEndTime: 0,
    deathAnimationStart: null,
    killerName: null,
    isAttacking: false,
  });

  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);

  // Skills State (Cooldowns in ms timestamp)
  const [skillCooldowns, setSkillCooldowns] = useState({
      dash: 0,
      special: 0, // "special" is mapped to E key (Thunder for Soldier, Heal for Doctor)
      block: 0,   // "block" is mapped to Q key
  });

  // Puzzle State
  const [puzzle, setPuzzle] = useState<PuzzleState>({
    isActive: false,
    riddle: null,
    difficulty: 'EASY',
    isLoading: false,
  });
  const [puzzleAnswer, setPuzzleAnswer] = useState('');

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for Real-time Combat Logic
  const playerRef = useRef(player);
  const combatRef = useRef(combat);
  const equipmentRef = useRef(equipment);
  const combatResultRef = useRef(combatResult);
  const skillCooldownsRef = useRef(skillCooldowns);
  const lastPlayerAttackTime = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number>(0);

  // Sync Refs
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { combatRef.current = combat; }, [combat]);
  useEffect(() => { equipmentRef.current = equipment; }, [equipment]);
  useEffect(() => { combatResultRef.current = combatResult; }, [combatResult]);
  useEffect(() => { skillCooldownsRef.current = skillCooldowns; }, [skillCooldowns]);

  // --- Helpers ---
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { id: uuid(), message, type, timestamp: Date.now() }]);
  }, []);

  const scrollToBottom = () => {
    if (logsContainerRef.current) {
        logsContainerRef.current.scrollTo({
            top: logsContainerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // --- API Key Handler ---
  const handleSaveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('gemini_api_key', key);
      setShowApiKeyModal(false);
      addLog("API Key saved securely.", 'info');
  };

  // --- Derived Stats (Helper) ---
  const getStats = (p: PlayerStats, e: EquipmentSlots) => {
    let atk = p.attack;
    let def = p.defense;
    let maxHp = p.maxHp;

    (Object.values(e) as (Item | null)[]).forEach(item => {
      if (item) {
        if (item.stats.attack) atk += item.stats.attack;
        if (item.stats.defense) def += item.stats.defense;
        if (item.stats.hpBonus) maxHp += item.stats.hpBonus;
      }
    });
    return { atk, def, maxHp };
  };

  // --- Input Handling ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const key = e.key.toLowerCase();
          keysPressed.current.add(key);
          
          if (combatRef.current.isActive && !combatResultRef.current && !combatRef.current.deathAnimationStart) {
              if (key === ' ') handleSkill('dash');
              if (key === 'e') handleSkill('special');
              if (key === 'q') handleSkill('block');
          }
      };
      const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
      
      const handleBlur = () => {
          // Clear keys when window loses focus to prevent stuck movement
          keysPressed.current.clear();
      };
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleBlur);
      
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          window.removeEventListener('blur', handleBlur);
      };
  }, []);

  // --- Character Selection ---

  const selectCharacter = (cls: PlayerClass) => {
      const baseStats = cls === 'SOLDIER' 
        ? { hp: 100, maxHp: 100, attack: 10, defense: 3 } // Soldier: Stronger Start
        : { hp: 80, maxHp: 80, attack: 4, defense: 2 };   // Doctor: Weaker Start, but heals

      setPlayer({
          ...INITIAL_PLAYER_STATS,
          ...baseStats,
          class: cls,
      });

      addLog(`You have chosen the path of the ${cls}.`, 'info');
  };

  const retireCharacter = () => {
      // Force stop combat loops to prevent race conditions during reset
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      keysPressed.current.clear();
      
      setCombat({
          isActive: false,
          enemies: [],
          lastAction: '',
          playerAnimating: false,
          playerPos: { x: 0, y: 0 },
          playerFacing: 'RIGHT',
          waveCount: 0,
          visualEffects: [],
          blockEndTime: 0,
          deathAnimationStart: null,
          killerName: null,
          isAttacking: false,
      });
      setCombatResult(null);

      // Reset Player and Inventory
      setPlayer({ ...INITIAL_PLAYER_STATS }); // Spread to ensure new object reference
      setInventory([]);
      setEquipment({ weapon: null, armor: null, accessory: null });
      setLogs([]);
      setActiveTab('ADVENTURE');
      
      addLog("Hero retired. Select a new path.", 'info');
  };

  // --- Skills ---

  const handleSkill = (skill: 'dash' | 'special' | 'block') => {
      const now = Date.now();
      const cooldowns = skillCooldownsRef.current;
      const currentPlayer = playerRef.current;
      const combatState = combatRef.current;

      if (combatState.deathAnimationStart) return;

      if (skill === 'dash') {
          if (now < cooldowns.dash) return;
          
          // DASH LOGIC
          const keys = keysPressed.current;
          let dx = 0;
          let dy = 0;
          
          if (keys.has('w') || keys.has('arrowup')) dy -= 1;
          if (keys.has('s') || keys.has('arrowdown')) dy += 1;
          if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
          if (keys.has('d') || keys.has('arrowright')) dx += 1;

          // Normalize diagonal
          if (dx !== 0 && dy !== 0) {
              dx *= 0.707;
              dy *= 0.707;
          }

          // Default dash direction if standing still (Dash forward/up)
          if (dx === 0 && dy === 0) dy = -1;

          const dashDistance = 20; // Units
          const currentPos = combatRef.current.playerPos;
          
          // Unbounded Movement for Dash
          const newX = currentPos.x + dx * dashDistance;
          const newY = currentPos.y + dy * dashDistance;

          setCombat(prev => ({
              ...prev,
              playerPos: { x: newX, y: newY },
              lastAction: "Dash!",
              visualEffects: [...prev.visualEffects, { id: uuid(), x: currentPos.x, y: currentPos.y, type: 'dash', timestamp: now }]
          }));

          setSkillCooldowns(prev => ({ ...prev, dash: now + 2000 })); // 2s Cooldown
      }

      if (skill === 'block') {
          if (now < cooldowns.block) return;
          
          setCombat(prev => ({
              ...prev,
              blockEndTime: now + 1500, // 1.5s duration
              lastAction: "Guard up!",
              visualEffects: [...prev.visualEffects, { id: uuid(), x: prev.playerPos.x, y: prev.playerPos.y, type: 'block', timestamp: now }]
          }));

          setSkillCooldowns(prev => ({ ...prev, block: now + 4000 })); // 4s Cooldown
      }

      if (skill === 'special') {
          if (now < cooldowns.special) return;

          // SPECIAL LOGIC (Class Dependent)
          
          if (currentPlayer.class === 'SOLDIER') {
              // --- SOLDIER: THUNDER CLAP (Damage AoE) ---
              const { atk } = getStats(currentPlayer, equipmentRef.current);
              const range = 25; // Large radius
              const damageMult = 2.0; // Soldier Skill hits HARD

              const currentCombat = combatRef.current;
              let hits = 0;
              
              const updatedEnemies = currentCombat.enemies.map(enemy => {
                  const dist = calculateDistance(currentCombat.playerPos, { x: enemy.x, y: enemy.y });
                  if (dist <= range) {
                      hits++;
                      const damage = Math.floor(atk * damageMult);
                      return { ...enemy, hp: enemy.hp - damage, isHit: true };
                  }
                  return enemy;
              });

              // Filter dead
              const aliveEnemies: Enemy[] = [];
              updatedEnemies.forEach(e => {
                  if (e.hp <= 0) {
                      handleKillRewards(e);
                  } else {
                      aliveEnemies.push(e);
                  }
              });

              setCombat(prev => ({
                  ...prev,
                  enemies: aliveEnemies,
                  lastAction: hits > 0 ? `Thunder Clap! Hit ${hits} enemies.` : "Thunder Clap missed!",
                  visualEffects: [...prev.visualEffects, { id: uuid(), x: prev.playerPos.x, y: prev.playerPos.y, type: 'thunder', timestamp: now }]
              }));
              
              // Check Wave
              if (aliveEnemies.length === 0 && currentCombat.enemies.length > 0) {
                    setTimeout(() => {
                        if (combatRef.current.isActive && playerRef.current.hp > 0) {
                            spawnWave();
                        }
                    }, 1500);
               }

              setSkillCooldowns(prev => ({ ...prev, special: now + 6000 })); // 6s Cooldown
          
          } else if (currentPlayer.class === 'DOCTOR') {
              // --- DOCTOR: FIELD MEDIC (Heal Self) ---
              const { maxHp } = getStats(currentPlayer, equipmentRef.current);
              const healAmount = Math.floor(maxHp * 0.30); // Heal 30%

              setPlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + healAmount) }));

              setCombat(prev => ({
                  ...prev,
                  lastAction: `Field Medic! Healed ${healAmount} HP.`,
                  visualEffects: [...prev.visualEffects, { id: uuid(), x: prev.playerPos.x, y: prev.playerPos.y, type: 'heal', timestamp: now }]
              }));

              setSkillCooldowns(prev => ({ ...prev, special: now + 8000 })); // 8s Cooldown
          }
      }
  };


  // --- Game Actions ---

  const spawnWave = useCallback(() => {
    const currentLevel = playerRef.current.level;
    const waveSize = Math.floor(Math.random() * 16) + 5; // 5 to 20 enemies
    const newEnemies: Enemy[] = [];
    const playerPos = combatRef.current.playerPos;

    for (let i = 0; i < waveSize; i++) {
        const enemyLevel = Math.max(1, currentLevel + Math.floor(Math.random() * 3) - 1);
        
        // DIFFICULTY SCALING
        let baseHp = enemyLevel * 20; 
        let attack = enemyLevel * 4 + 8; 
        
        // Rarity Roll
        const roll = Math.random();
        let rank: Enemy['rank'] = 'NORMAL';
        let rankMultiplier = 1;
        let namePrefix = "";
        let nameSuffix = "";

        if (roll > 0.95) {
            rank = 'BOSS';
            rankMultiplier = 5; 
            namePrefix = "The Dread ";
            nameSuffix = " the Undying";
            attack = Math.floor(attack * 1.8); 
        } else if (roll > 0.85) {
            rank = 'ELITE';
            rankMultiplier = 2; 
            namePrefix = "Elite ";
            attack = Math.floor(attack * 1.5); 
        }

        const nameIndex = Math.min(Math.floor((enemyLevel - 1) / 2), MONSTER_NAMES.length - 1);
        const baseName = MONSTER_NAMES[nameIndex] || "Unknown Beast";
        const finalName = `${namePrefix}${baseName}${rank === 'BOSS' ? nameSuffix : ''}`;
        const sprite = MONSTER_SPRITES[baseName] || "👾";

        // --- NEW SPAWN LOGIC: RADIAL (INFINITE MAP) ---
        // Spawn slightly further to ensure they are offscreen initially but not too far
        const angle = Math.random() * Math.PI * 2;
        const radius = 70 + Math.random() * 15; // 70 to 85 units away
        
        const spawnX = playerPos.x + Math.cos(angle) * radius;
        const spawnY = playerPos.y + Math.sin(angle) * radius;

        newEnemies.push({
            id: uuid(),
            name: `${finalName} (Lvl ${enemyLevel})`,
            level: enemyLevel,
            hp: Math.floor(baseHp * rankMultiplier),
            maxHp: Math.floor(baseHp * rankMultiplier),
            attack: attack,
            rank: rank,
            sprite: sprite,
            x: spawnX,
            y: spawnY,
            facing: 'LEFT',
            lastAttackTime: 0,
            isHit: false
        });
    }

    setCombat(prev => ({
        ...prev,
        enemies: newEnemies,
        lastAction: `Wave incoming! ${newEnemies.length} hostiles.`,
    }));
    
    addLog(`Encountered ${newEnemies.length} enemies!`, 'combat');
  }, [addLog]);

  const handleLevelUp = (currentXp: number, currentMaxXp: number, currentLevel: number) => {
    if (currentXp >= currentMaxXp) {
      const remainingXp = currentXp - currentMaxXp;
      const newLevel = currentLevel + 1;
      const newMaxXp = Math.floor(currentMaxXp * 1.5);
      
      const pClass = playerRef.current.class;

      // CLASS SCALING
      const hpGain = pClass === 'SOLDIER' ? 20 : 15;
      const atkGain = pClass === 'SOLDIER' ? 4 : 2; 
      const defGain = 1;

      setPlayer(prev => ({
        ...prev,
        level: newLevel,
        xp: remainingXp,
        maxXp: newMaxXp,
        maxHp: prev.maxHp + hpGain, 
        hp: prev.maxHp + hpGain, // Full heal on level up
        attack: prev.attack + atkGain,
        defense: prev.defense + defGain,
      }));
      addLog(`LEVEL UP! You are now level ${newLevel}.`, 'info');
      if (remainingXp >= newMaxXp) {
          handleLevelUp(remainingXp, newMaxXp, newLevel);
      }
    } else {
        setPlayer(prev => ({ ...prev, xp: currentXp }));
    }
  };

  // --- Terrain Generation ---
  
  const getBiomeAt = (x: number, y: number): string => {
    const scale = 0.08; 
    // Simplex-ish noise using sin/cos interaction
    const val = Math.sin(x * scale) + Math.cos(y * scale * 0.8) + Math.sin((x+y)*scale*0.3)*0.5;
    
    if (Math.abs(val) < 0.15) return '#757575'; // Road (Lighter Gray)
    if (val > 0.8) return '#d4b340'; // Field (Bright Gold)
    return '#4a8c52'; // Forest (Medium Green)
  };

  const drawTerrain = (ctx: CanvasRenderingContext2D, width: number, height: number, playerX: number, playerY: number) => {
      const TILE_UNIT_SIZE = 10;
      // ZOOM LOGIC: Increase pixels per unit
      const pxPerUnit = width / (100 / GAME_SCALE); 
      const tilePixelSize = TILE_UNIT_SIZE * pxPerUnit;
      
      const cols = Math.ceil(width / tilePixelSize) + 2;
      const rows = Math.ceil(height / tilePixelSize) + 2;

      const cx = playerX;
      const cy = playerY;

      const startCol = Math.floor(cx / TILE_UNIT_SIZE) - Math.floor(cols / 2);
      const startRow = Math.floor(cy / TILE_UNIT_SIZE) - Math.floor(rows / 2);

      for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
              const tileX = startCol + x;
              const tileY = startRow + y;
              
              const biome = getBiomeAt(tileX, tileY);
              const rand = pseudoRandom(tileX, tileY);
              
              const worldPosTileX = tileX * TILE_UNIT_SIZE;
              const worldPosTileY = tileY * TILE_UNIT_SIZE;
              
              const screenX = (width / 2) + (worldPosTileX - cx) * pxPerUnit;
              const screenY = (height / 2) + (worldPosTileY - cy) * pxPerUnit;
              const drawSize = Math.ceil(tilePixelSize) + 2;

              // Draw Base Tile
              ctx.fillStyle = biome;
              ctx.fillRect(Math.floor(screenX)-1, Math.floor(screenY)-1, drawSize, drawSize);

              // --- DECORATION LOGIC ---
              
              // FOREST TREES (Rectangular)
              if (biome === '#4a8c52' && rand > 0.65) { 
                  // Trees occupy center of tile roughly
                  const treeH = drawSize * 0.75;
                  const treeW = drawSize * 0.25;
                  const baseX = screenX + drawSize * 0.5;
                  const baseY = screenY + drawSize * 0.85;

                  // Trunk
                  ctx.fillStyle = '#5d4037'; // Lighter Wood
                  ctx.fillRect(baseX - treeW/2, baseY - treeH * 0.3, treeW, treeH * 0.3);

                  // Canopy (Rectangular Block)
                  ctx.fillStyle = '#1b5e20'; // Deep Forest Green (Keep dark for contrast)
                  const canopyW = drawSize * 0.6;
                  const canopyH = treeH * 0.75;
                  ctx.fillRect(baseX - canopyW/2, baseY - treeH, canopyW, canopyH);
              }

              // FIELD FLOWERS (Multi-petal)
              if (biome === '#d4b340' && rand > 0.5) {
                  // Random flower color
                  const flowerColor = rand > 0.9 ? '#ff4081' : (rand > 0.75 ? '#448aff' : '#fff176'); 
                  const centerX = screenX + drawSize * (0.3 + (rand % 0.4));
                  const centerY = screenY + drawSize * (0.3 + ((rand*10) % 0.4));
                  const petalSize = drawSize * 0.08;
                  const centerSize = petalSize * 0.8;

                  // Draw 5 petals around center
                  ctx.fillStyle = flowerColor;
                  for (let i = 0; i < 5; i++) {
                      const angle = (i / 5) * Math.PI * 2;
                      const px = centerX + Math.cos(angle) * petalSize;
                      const py = centerY + Math.sin(angle) * petalSize;
                      ctx.beginPath();
                      ctx.arc(px, py, petalSize, 0, Math.PI * 2);
                      ctx.fill();
                  }

                  // Center dot
                  ctx.fillStyle = '#ff6f00'; // Darker Orange Center
                  ctx.beginPath();
                  ctx.arc(centerX, centerY, centerSize, 0, Math.PI * 2);
                  ctx.fill();
              }
          }
      }
  };

  // --- Combat Logic (Game Loop) ---

  const handleHunt = () => {
    if (player.hp <= 0) {
      addLog("You are too weak to fight. Rest first!", 'error');
      return;
    }
    
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    // Instead of immediate black screen timeout, show the Sword Animation
    setShowSwordAnimation(true);
    addLog("Preparing for battle...", 'info');
  };

  const handleAnimationComplete = () => {
      // Logic executed when swords finish clashing
      setShowSwordAnimation(false);
      startCombat();
      
      // Delay re-enabling transition state just a moment so there isn't a flicker
      setTimeout(() => {
          setIsTransitioning(false);
      }, 500);
  };

  const startCombat = () => {
    keysPressed.current.clear(); // Clear keys to prevent stuck movement from previous inputs

    // Note: HP check handled in handleHunt

    setCombatResult(null); 
    setCombat({
        isActive: true,
        enemies: [],
        lastAction: 'Entering the wild...',
        playerAnimating: false,
        playerPos: { x: 0, y: 0 }, // Reset to origin
        playerFacing: 'RIGHT',
        waveCount: 0,
        visualEffects: [],
        blockEndTime: 0,
        deathAnimationStart: null,
        killerName: null,
        isAttacking: false,
    });
    
    // Initial Spawn
    setTimeout(() => spawnWave(), 500);
  };

  const calculateDistance = (p1: Position, p2: Position) => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy);
  };

  // MAIN GAME LOOP
  const updateGame = () => {
      const state = combatRef.current;
      const pStats = playerRef.current;
      
      if (!state.isActive) return;

      // --- DEATH ANIMATION CHECK ---
      if (state.deathAnimationStart) {
          // If dying, skip all movement/logic. Just check timer.
          if (Date.now() - state.deathAnimationStart > 2500) {
                // Animation Finished -> Show Result
                setCombat(prevC => ({ ...prevC, isActive: false, deathAnimationStart: null }));
                setCombatResult({
                    type: 'DEFEAT',
                    enemyName: state.killerName || "The Darkness",
                    xpGain: 0,
                    goldGain: 0,
                    drops: []
                });
          }
          // Continue loop to render the frame (so terrain/sprites stay visible)
          animationFrameRef.current = requestAnimationFrame(updateGame);
          return;
      }

      // 1. Player Movement (INFINITE UNBOUNDED)
      const moveSpeed = 0.8;
      let newPlayerPos = { ...state.playerPos };
      let newPlayerFacing = state.playerFacing;
      
      const keys = keysPressed.current;
      let isMoving = false;

      // REMOVED BOUNDS CLAMPING (Math.max/min)
      if (keys.has('w') || keys.has('arrowup')) { newPlayerPos.y -= moveSpeed; isMoving = true; }
      if (keys.has('s') || keys.has('arrowdown')) { newPlayerPos.y += moveSpeed; isMoving = true; }
      if (keys.has('a') || keys.has('arrowleft')) { 
          newPlayerPos.x -= moveSpeed; 
          newPlayerFacing = 'LEFT';
          isMoving = true;
      }
      if (keys.has('d') || keys.has('arrowright')) { 
          newPlayerPos.x += moveSpeed; 
          newPlayerFacing = 'RIGHT';
          isMoving = true;
      }

      let lastActionUpdate = state.lastAction;
      let playerTookDamage = false;

      // 2. Terrain Rendering
      if (canvasRef.current) {
          const cvs = canvasRef.current;
          // Simple resize check
          if (cvs.width !== cvs.offsetWidth || cvs.height !== cvs.offsetHeight) {
              cvs.width = cvs.offsetWidth;
              cvs.height = cvs.offsetHeight;
          }
          const ctx = cvs.getContext('2d');
          if (ctx) {
              drawTerrain(ctx, cvs.width, cvs.height, newPlayerPos.x, newPlayerPos.y);
          }
      }

      // 3. Enemy Logic (Loop through all)
      const now = Date.now();
      const isBlocking = now < state.blockEndTime;
      
      const newEnemies = state.enemies.map(enemy => {
          // AI (Chase) - Works correctly with absolute world coordinates
          const speedMultiplier = enemy.rank === 'BOSS' ? 0.7 : (enemy.rank === 'ELITE' ? 0.9 : 1.0);
          const enemySpeed = (0.2 + (enemy.level * 0.01)) * speedMultiplier;
          
          let newEnemyX = enemy.x;
          let newEnemyY = enemy.y;
          let newFacing = enemy.facing;
          
          const dx = newPlayerPos.x - newEnemyX;
          const dy = newPlayerPos.y - newEnemyY;
          const dist = Math.sqrt(dx*dx + dy*dy);

          const hitboxSize = enemy.rank === 'BOSS' ? 8 : 5;

          if (dist > hitboxSize) {
              const moveX = (dx / dist) * enemySpeed;
              newEnemyX += moveX;
              newEnemyY += (dy / dist) * enemySpeed;
              
              if (moveX > 0) newFacing = 'RIGHT';
              if (moveX < 0) newFacing = 'LEFT';
          }

          // Attack Logic
          const attackRange = enemy.rank === 'BOSS' ? 12 : 8; 
          
          // Cooldown Logic
          let baseCooldown = 1500 - (enemy.level * 40);
          if (enemy.rank === 'BOSS') baseCooldown *= 0.6; 
          else if (enemy.rank === 'ELITE') baseCooldown *= 0.8;

          const enemyAttackCooldown = Math.max(400, baseCooldown);

          if (dist < attackRange && (now - enemy.lastAttackTime > enemyAttackCooldown)) {
              enemy.lastAttackTime = now;
              playerTookDamage = true;

              const { def } = getStats(pStats, equipmentRef.current);
              const rawDamage = enemy.attack;
              let damageTaken = Math.max(1, rawDamage - Math.floor(def / 2));
              
              if (isBlocking) {
                  damageTaken = Math.floor(damageTaken * 0.25); // 75% Damage Reduction
                  lastActionUpdate = "Blocked!";
              } else {
                  lastActionUpdate = `${enemy.name} hits for ${damageTaken}!`;
              }
              
              setPlayer(prev => {
                  const newHp = Math.max(0, prev.hp - damageTaken);
                  if (newHp <= 0 && prev.hp > 0) {
                      // Trigger DEATH ANIMATION instead of immediate defeat
                      setCombat(prevC => ({ 
                          ...prevC, 
                          deathAnimationStart: Date.now(),
                          killerName: enemy.name,
                          lastAction: "Mortal wound!",
                          visualEffects: [] 
                      }));
                  }
                  return { ...prev, hp: newHp };
              });
          }

          // Reset hit flash
          let isHit = enemy.isHit;
          if (isHit && Math.random() > 0.8) isHit = false; // Randomly clear hit flag for visual decay

          return { ...enemy, x: newEnemyX, y: newEnemyY, facing: newFacing, isHit };
      });

      // Cleanup Visual Effects
      const activeEffects = state.visualEffects.filter(e => now - e.timestamp < 500);

      // Update State (if not dying inside the loop already)
      setCombat(prev => {
          // If we just triggered death inside the map loop, don't overwrite it with movement updates
          if (prev.deathAnimationStart) return prev;

          if (prev.enemies.length !== state.enemies.length) {
               return {
                  ...prev,
                  playerPos: newPlayerPos,
                  playerFacing: newPlayerFacing,
                  playerAnimating: isMoving,
                  lastAction: lastActionUpdate,
                  visualEffects: activeEffects
              };
          }

          return {
              ...prev,
              playerPos: newPlayerPos,
              playerFacing: newPlayerFacing,
              playerAnimating: isMoving,
              enemies: newEnemies,
              lastAction: lastActionUpdate,
              visualEffects: activeEffects
          };
      });

      animationFrameRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
      if (combat.isActive) {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = requestAnimationFrame(updateGame);
      } else {
          cancelAnimationFrame(animationFrameRef.current);
      }
      return () => cancelAnimationFrame(animationFrameRef.current);
  }, [combat.isActive]);


  const attackEnemy = () => {
    if (combat.deathAnimationStart) return; // Cannot attack while dying

    const now = Date.now();
    // Throttle attacks based on animation
    if (combat.isAttacking) return;
    if (now - lastPlayerAttackTime.current < 400) return; // Basic Global Cooldown
    lastPlayerAttackTime.current = now;

    // Trigger Animation
    setCombat(prev => ({ ...prev, isAttacking: true }));
    setTimeout(() => {
        setCombat(prev => ({ ...prev, isAttacking: false }));
    }, 250);

    // Attack Closest Enemy
    if (combat.enemies.length === 0) return;

    // Find Closest
    let closestEnemyIndex = -1;
    let minDist = 999;
    
    combat.enemies.forEach((enemy, index) => {
        const dist = calculateDistance(combat.playerPos, { x: enemy.x, y: enemy.y });
        if (dist < minDist) {
            minDist = dist;
            closestEnemyIndex = index;
        }
    });

    // --- INCREASED ATTACK RANGE ---
    const attackRange = 30; // Increased from 15

    if (closestEnemyIndex === -1 || minDist > attackRange) {
        setCombat(prev => ({ ...prev, lastAction: "Too far away!", isAttacking: true })); // Still animate miss
         setTimeout(() => {
            setCombat(prev => ({ ...prev, isAttacking: false }));
        }, 250);
        return;
    }

    // Process Hit
    const targetEnemy = combat.enemies[closestEnemyIndex];
    const { atk } = getStats(player, equipment);
    const damage = Math.floor(atk * (0.9 + Math.random() * 0.2));
    const newEnemyHp = Math.max(0, targetEnemy.hp - damage);

    // Update Enemies List
    const updatedEnemies = [...combat.enemies];
    
    if (newEnemyHp <= 0) {
        // KILL LOGIC
        updatedEnemies.splice(closestEnemyIndex, 1); // Remove dead enemy
        handleKillRewards(targetEnemy);
        
        setCombat(prev => ({
            ...prev,
            enemies: updatedEnemies,
            lastAction: `Killed ${targetEnemy.name}!`,
            isAttacking: true
        }));

        // Check Wave Clear
        if (updatedEnemies.length === 0) {
             setCombat(prev => ({ ...prev, lastAction: "Wave Clear! Searching..." }));
             setTimeout(() => {
                 if (combatRef.current.isActive && playerRef.current.hp > 0 && !combatRef.current.deathAnimationStart) {
                     spawnWave();
                 }
             }, 1500);
        }

    } else {
        // JUST DAMAGE
        updatedEnemies[closestEnemyIndex] = { 
            ...targetEnemy, 
            hp: newEnemyHp, 
            isHit: true 
        };
        
        setCombat(prev => ({
            ...prev,
            enemies: updatedEnemies,
            lastAction: `Hit ${targetEnemy.name} for ${damage}!`,
            isAttacking: true
        }));
    }
    
    // Reset animation state async (handled by the initial timeout, but just ensuring state consistency in closure)
    setTimeout(() => {
        if(combatRef.current.isActive) {
             setCombat(prev => ({ ...prev, isAttacking: false }));
        }
    }, 250);
  };

  const handleKillRewards = (enemy: Enemy) => {
    const rankMultiplier = enemy.rank === 'BOSS' ? 10 : (enemy.rank === 'ELITE' ? 3 : 1);
    const xpGain = (enemy.level * 15) * rankMultiplier;
    const goldGain = (enemy.level * 25 + Math.floor(Math.random() * 50) + 15) * rankMultiplier;

    // Loot Logic
    let lootChance = 0.15;
    if (enemy.rank === 'ELITE') lootChance = 0.5;
    if (enemy.rank === 'BOSS') lootChance = 1.0; 

    if (Math.random() < lootChance) {
        const loot = BASIC_ITEMS[Math.floor(Math.random() * BASIC_ITEMS.length)];
        const lootItem = { ...loot, id: uuid() };
        setInventory(prev => [...prev, lootItem]);
        addLog(`Looted: ${lootItem.name}!`, 'loot');
    }

    setPlayer(prev => {
        const nextXp = prev.xp + xpGain;
        let level = prev.level;
        let maxXp = prev.maxXp;
        let hp = prev.hp;
        let maxHp = prev.maxHp;
        let atk = prev.attack;
        let def = prev.defense;
        let xp = nextXp;

        const pClass = prev.class;
        const hpGain = pClass === 'SOLDIER' ? 20 : 15;
        const atkGain = pClass === 'SOLDIER' ? 4 : 2;

        while (xp >= maxXp) {
            xp -= maxXp;
            level++;
            maxXp = Math.floor(maxXp * 1.5);
            maxHp += hpGain;
            hp = maxHp; 
            atk += atkGain;
            def += 1;
        }
        return { ...prev, gold: prev.gold + goldGain, xp, maxXp, level, hp, maxHp, attack: atk, defense: def };
    });

    addLog(`Defeated ${enemy.name}! (+${xpGain}XP, +${goldGain}G)`, 'combat');
  };

  const quitCombat = () => {
      // Clear keys
      keysPressed.current.clear();

      setCombat({ isActive: false, enemies: [], lastAction: '', playerAnimating: false, playerPos: {x:0, y:0}, playerFacing: 'RIGHT', waveCount: 0, visualEffects: [], blockEndTime: 0, deathAnimationStart: null, killerName: null, isAttacking: false });
      setCombatResult(null);
  };

  const fleeCombat = (e?: React.MouseEvent) => {
    e?.stopPropagation(); 
    if (combat.deathAnimationStart) return;
    addLog("Returning to camp...", 'info');
    quitCombat();
  };

  const rest = () => {
    const healCost = 10;
    if (player.gold >= healCost) {
        const { maxHp } = getStats(player, equipment);
        setPlayer(prev => ({ ...prev, hp: maxHp, gold: prev.gold - healCost }));
        addLog(`Rested for ${healCost} gold.`, 'info');
    } else {
        addLog("Not enough gold!", 'error');
    }
  };

  // --- Inventory & Shop ---

  const equipItem = (item: Item) => {
    const slot = item.type.toLowerCase() as keyof EquipmentSlots;
    const currentEquipped = equipment[slot];
    
    const newEquipment = { ...equipment, [slot]: item };
    let newInventory = inventory.filter(i => i.id !== item.id);
    
    if (currentEquipped) {
      newInventory.push(currentEquipped);
    }
    
    setEquipment(newEquipment);
    setInventory(newInventory);
    addLog(`Equipped ${item.name}.`, 'info');
  };

  const buyItem = (item: Item) => {
    if (player.gold >= item.value) {
        if (item.id === 'potion-red') {
            const { maxHp } = getStats(player, equipment);
            setPlayer(prev => ({ ...prev, hp: Math.min(maxHp, prev.hp + 50), gold: prev.gold - item.value }));
            addLog("Used Health Potion.", 'info');
            return;
        }

        if (item.id === 'elixir-vitality') {
            const { maxHp } = getStats(player, equipment);
            setPlayer(prev => ({ ...prev, hp: Math.min(maxHp, prev.hp + 150), gold: prev.gold - item.value }));
            addLog("Used Elixir of Vitality.", 'info');
            return;
        }

      setPlayer(prev => ({ ...prev, gold: prev.gold - item.value }));
      const newItem = { ...item, id: uuid() };
      setInventory(prev => [...prev, newItem]);
      addLog(`Bought ${item.name}.`, 'loot');
    } else {
      addLog("Not enough gold!", 'error');
    }
  };

  const sellItem = (item: Item) => {
    setInventory(prev => prev.filter(i => i.id !== item.id));
    const sellValue = Math.floor(item.value / 2);
    setPlayer(prev => ({ ...prev, gold: prev.gold + sellValue }));
    addLog(`Sold ${item.name}.`, 'info');
  };

  // --- Puzzle System (Gemini) ---

  const startPuzzle = async () => {
    if (!apiKey) {
        setShowApiKeyModal(true);
        addLog("API Key required for riddles.", 'error');
        return;
    }

    setPuzzle(prev => ({ ...prev, isLoading: true, isActive: true, riddle: null }));
    addLog("Communing with Spirits...", 'puzzle');
    
    const riddle = await generateRiddle(puzzle.difficulty, apiKey);
    
    setPuzzle(prev => ({ ...prev, isLoading: false, riddle }));
    addLog("A riddle appeared!", 'puzzle');
  };

  const submitPuzzle = async () => {
    if (!puzzleAnswer.trim()) return;
    
    if (!apiKey) {
        setShowApiKeyModal(true);
        addLog("API Key required to check answer.", 'error');
        return;
    }

    setPuzzle(prev => ({ ...prev, isLoading: true }));
    addLog(`Whispered: "${puzzleAnswer}"...`, 'puzzle');

    const isCorrect = await verifyRiddleAnswer(puzzle.riddle!, puzzleAnswer, apiKey);

    if (isCorrect) {
        addLog("Correct! Treasure appears.", 'loot');
        const reward = await generateLegendaryItem(player.level, apiKey);
        setInventory(prev => [...prev, reward]);
        setPuzzle(prev => ({ ...prev, isActive: false, riddle: null }));
        setPuzzleAnswer('');
        addLog(`Got ${reward.name}!`, 'loot');
    } else {
        addLog("Wrong! You take damage.", 'combat');
        setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - 10) }));
        setPuzzle(prev => ({ ...prev, isLoading: false }));
    }
  };

  // --- Render ---

  // CHARACTER SELECTION SCREEN
  if (player.class === 'NONE') {
      return (
          <div className="h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center opacity-30"></div>
               <div className="relative z-10 max-w-4xl w-full">
                   <h1 className="text-5xl cinzel font-bold text-center text-amber-500 mb-12 drop-shadow-lg">Choose Your Path</h1>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       
                       {/* SOLDIER CARD */}
                       <div 
                        onClick={() => selectCharacter('SOLDIER')}
                        className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border-2 border-slate-600 hover:border-amber-500 hover:bg-slate-800 transition-all cursor-pointer group transform hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] flex flex-col items-center text-center"
                       >
                           <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border-2 border-slate-700 group-hover:border-amber-500 overflow-hidden">
                                <PlayerAvatar playerClass="SOLDIER" className="w-full h-full object-contain pixel-render" />
                           </div>
                           <h2 className="text-3xl cinzel font-bold text-white mb-2">The Soldier</h2>
                           <p className="text-slate-400 mb-6 flex-1">
                               A master of warfare forged in the fires of battle. Deals devastating damage but relies on items to heal.
                           </p>
                           <div className="w-full bg-slate-900/50 rounded-lg p-4 text-sm mb-6 space-y-2">
                               <div className="flex justify-between text-slate-300">
                                   <span>Attack</span>
                                   <div className="flex gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span><span className="w-3 h-3 bg-red-500 rounded-full"></span><span className="w-3 h-3 bg-red-500 rounded-full"></span><span className="w-3 h-3 bg-red-500 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span></div>
                               </div>
                               <div className="flex justify-between text-slate-300">
                                   <span>Defense</span>
                                   <div className="flex gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span><span className="w-3 h-3 bg-blue-500 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span></div>
                               </div>
                               <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-700 mt-2">
                                   <span className="font-bold text-yellow-500">Skill (E)</span>
                                   <span>Thunder Clap</span>
                               </div>
                           </div>
                           <button className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-full w-full">Select Soldier</button>
                       </div>

                       {/* DOCTOR CARD */}
                       <div 
                        onClick={() => selectCharacter('DOCTOR')}
                        className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border-2 border-slate-600 hover:border-emerald-500 hover:bg-slate-800 transition-all cursor-pointer group transform hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] flex flex-col items-center text-center"
                       >
                           <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border-2 border-slate-700 group-hover:border-emerald-500 overflow-hidden">
                                <PlayerAvatar playerClass="DOCTOR" className="w-full h-full object-contain pixel-render" />
                           </div>
                           <h2 className="text-3xl cinzel font-bold text-white mb-2">The Doctor</h2>
                           <p className="text-slate-400 mb-6 flex-1">
                               A field medic who understands the frailty of life. Deals lower damage but can self-heal in the heat of combat.
                           </p>
                           <div className="w-full bg-slate-900/50 rounded-lg p-4 text-sm mb-6 space-y-2">
                               <div className="flex justify-between text-slate-300">
                                   <span>Attack</span>
                                   <div className="flex gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span></div>
                               </div>
                               <div className="flex justify-between text-slate-300">
                                   <span>Defense</span>
                                   <div className="flex gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span><span className="w-3 h-3 bg-blue-500 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span><span className="w-3 h-3 bg-slate-700 rounded-full"></span></div>
                               </div>
                               <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-700 mt-2">
                                   <span className="font-bold text-emerald-500">Skill (E)</span>
                                   <span>Field Medic</span>
                               </div>
                           </div>
                           <button className="px-8 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-full w-full">Select Doctor</button>
                       </div>

                   </div>
               </div>
          </div>
      );
  }

  // --- Main Game Render ---

  const { atk, def, maxHp } = getStats(player, equipment);
  const now = Date.now();

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row overflow-hidden font-sans relative">
      
      {/* MODALS */}
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)} 
        onSave={handleSaveApiKey}
        currentKey={apiKey}
      />

      {/* SWORD ANIMATION OVERLAY */}
      {showSwordAnimation && (
          <SwordAnimation onComplete={handleAnimationComplete} />
      )}

      {/* Sidebar: Stats */}
      <aside className="w-full md:w-72 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex flex-col p-3 z-30 shadow-xl">
        <h1 className="text-2xl font-bold text-amber-500 mb-2 cinzel text-center">Riddle & Steel</h1>
        <div className="flex justify-center mb-4">
             <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-amber-500 shadow-lg bg-slate-800 relative">
                 <PlayerAvatar 
                    playerClass={player.class}
                    className="w-full h-full object-contain pixel-render animate-breathe" 
                />
            </div>
        </div>
        <div className="text-center text-xs uppercase tracking-widest text-slate-500 mb-4 font-bold">{player.class}</div>
        
        <div className="space-y-4 mb-4 flex-1">
            <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">Level</span>
                <span className="font-bold text-xl text-white">{player.level}</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${(player.xp / player.maxXp) * 100}%` }}></div>
            </div>

            <hr className="border-slate-800" />

            <div className="grid grid-cols-2 gap-3">
                <div className={`flex flex-col items-center p-3 bg-slate-900 rounded-lg border border-slate-800 transition-colors ${combat.isActive && combat.enemies.some(e => e.lastAttackTime > Date.now() - 200) ? 'border-red-500 bg-red-900/20' : ''}`}>
                    <Activity size={18} className="text-red-500 mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Health</span>
                    <span className="font-bold text-base">{player.hp} / {maxHp}</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <Coins size={18} className="text-yellow-500 mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Gold</span>
                    <span className="font-bold text-base">{player.gold}</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <Sword size={18} className="text-blue-500 mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Atk</span>
                    <span className="font-bold text-base">{atk}</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <Shield size={18} className="text-green-500 mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Def</span>
                    <span className="font-bold text-base">{def}</span>
                </div>
            </div>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 max-h-[30vh]">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Equipment</h3>
            {equipment.weapon ? <ItemCard item={equipment.weapon} isEquipped /> : <div className="p-3 border border-dashed border-slate-700 rounded text-center text-xs text-slate-600">No Weapon</div>}
            {equipment.armor ? <ItemCard item={equipment.armor} isEquipped /> : <div className="p-3 border border-dashed border-slate-700 rounded text-center text-xs text-slate-600">No Armor</div>}
            {equipment.accessory ? <ItemCard item={equipment.accessory} isEquipped /> : <div className="p-3 border border-dashed border-slate-700 rounded text-center text-xs text-slate-600">No Accessory</div>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Navigation */}
        <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between gap-4 px-4 flex-shrink-0 z-[110]">
            <div className="flex-1 flex justify-center gap-4">
                {['ADVENTURE', 'INVENTORY', 'SHOP', 'PUZZLE'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => !combat.isActive && setActiveTab(tab as any)}
                        disabled={combat.isActive}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all 
                        ${activeTab === tab ? 'bg-slate-700 text-white shadow-md transform scale-105' : 'hover:bg-slate-800 text-slate-400'} 
                        ${combat.isActive ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        {tab === 'ADVENTURE' && <Tent size={18} />}
                        {tab === 'INVENTORY' && <ShoppingBag size={18} />}
                        {tab === 'SHOP' && <Coins size={18} />}
                        {tab === 'PUZZLE' && <Ghost size={18} />}
                        <span className="hidden sm:inline font-bold tracking-wide">{tab}</span>
                    </button>
                ))}
            </div>

            {/* API Key Setting Button */}
            <button 
                onClick={() => setShowApiKeyModal(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border 
                ${apiKey ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-amber-900/50 border-amber-500/50 text-amber-500 animate-pulse'} 
                ${combat.isActive ? 'opacity-30 cursor-not-allowed' : ''}`}
                disabled={combat.isActive}
            >
                <Key size={18} />
                <span className="hidden sm:inline font-bold">{apiKey ? 'Configured' : 'Set API Key'}</span>
            </button>
        </nav>

        {/* View Content Wrapper - NO SCROLL for Combat */}
        <div className="flex-1 overflow-hidden relative bg-[url('https://images.unsplash.com/photo-1542259698-2713de42080d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center flex flex-col transition-all duration-1000">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90 pointer-events-none"></div>
            
            {/* Scrollable Container */}
            <div className="relative z-10 flex-1 w-full max-w-[95%] mx-auto p-4 flex flex-col overflow-hidden">
                
                {/* Adventure Tab */}
                {activeTab === 'ADVENTURE' && (
                    <div className="flex-1 flex flex-col items-center justify-center h-full w-full">
                        {!combat.isActive ? (
                            // --- IDLE STATE ---
                            <div className="text-center space-y-10 animate-fade-in py-10">
                                <div className="text-center space-y-4">
                                    <h2 className="text-5xl cinzel font-bold text-white drop-shadow-2xl tracking-wider">The Dark Forest</h2>
                                    <p className="text-slate-300 text-lg">Monsters lurk in the shadows.</p>
                                </div>
                                
                                <div className="flex gap-6 justify-center">
                                    <button 
                                        onClick={handleHunt}
                                        disabled={player.hp <= 0 || isTransitioning}
                                        className="group relative px-10 py-5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl transform active:scale-95 transition-all overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                        <span className="flex items-center gap-3 text-xl"><Sword size={24} /> HUNT</span>
                                    </button>
                                    
                                    <button 
                                        onClick={rest}
                                        className="px-10 py-5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-xl transform active:scale-95 transition-all flex items-center gap-3 text-xl"
                                    >
                                        <Tent size={24} /> REST
                                    </button>

                                    <button 
                                        onClick={retireCharacter}
                                        className="px-10 py-5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl shadow-xl transform active:scale-95 transition-all flex items-center gap-3 text-xl border border-slate-600"
                                    >
                                        <LogOut size={24} /> RETIRE
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // --- COMBAT STATE (INFINITE CAMERA SYSTEM) ---
                            <div 
                                onClick={attackEnemy}
                                className={`w-full h-full bg-slate-900/90 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col cursor-crosshair select-none transition-all duration-1000 ${combat.deathAnimationStart ? 'grayscale' : ''}`}
                            >
                                {/* RED VIGNETTE OVERLAY WHEN DYING */}
                                {combat.deathAnimationStart && (
                                    <div className="absolute inset-0 z-[200] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(100,0,0,0.6)_100%)] animate-pulse-slow"></div>
                                )}

                                {/* DEFEAT SCREEN ONLY */}
                                {combatResult && combatResult.type === 'DEFEAT' && (
                                    <div className="absolute inset-0 z-[120] bg-black/80 flex items-center justify-center animate-fade-in cursor-default" onClick={(e) => e.stopPropagation()}>
                                        <div className="bg-slate-800 p-10 rounded-2xl border-2 border-red-600 text-center max-w-md w-full shadow-2xl transform transition-all scale-100">
                                            <Skull size={64} className="mx-auto text-red-500 mb-6" />
                                            <h2 className="text-4xl cinzel font-bold text-red-500 mb-4">Defeated</h2>
                                            <p className="text-slate-300 mb-8 text-lg">You were slain by <span className="font-bold text-white">{combatResult.enemyName}</span>.</p>
                                            <button 
                                                onClick={quitCombat}
                                                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors text-lg"
                                            >
                                                Return to Camp
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Combat Header */}
                                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0 pointer-events-none z-[100]">
                                    <h3 className="text-red-400 font-bold cinzel flex items-center gap-3 text-lg">
                                        <Sword size={24} /> Encounter (Pos: {Math.round(combat.playerPos.x)}, {Math.round(combat.playerPos.y)})
                                    </h3>
                                    {!combatResult && !combat.deathAnimationStart && combat.enemies.length > 0 && (
                                        <span className="text-sm text-yellow-500 uppercase font-bold tracking-wider animate-pulse flex items-center gap-2">
                                            <Zap size={16} /> Left Click to Attack!
                                        </span>
                                    )}
                                </div>

                                {/* Arena Visual - Canvas System */}
                                <div className="flex-1 relative bg-black overflow-hidden group perspective-[1000px]">
                                    {/* Canvas for Terrain */}
                                    <canvas 
                                        ref={canvasRef}
                                        className="absolute inset-0 w-full h-full"
                                    />
                                    
                                    {/* Vignette & Lighting Overlay */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)] pointer-events-none"></div>

                                    {/* OFF-SCREEN INDICATORS */}
                                    {!combatResult && !combat.deathAnimationStart && combat.enemies.map(enemy => {
                                        // Simple approximation of viewport bounds (assuming square-ish aspect or just clamped to edges)
                                        // Viewport is roughly +/- 50 units scaled by GAME_SCALE. 
                                        // Actually it's percentage based: 0% to 100%. Center is 50%.
                                        const leftPercent = 50 + (enemy.x - combat.playerPos.x) * GAME_SCALE;
                                        const topPercent = 50 + (enemy.y - combat.playerPos.y) * GAME_SCALE;
                                        
                                        const isOffScreen = leftPercent < 5 || leftPercent > 95 || topPercent < 5 || topPercent > 95;

                                        if (!isOffScreen) return null;

                                        // Calculate angle to enemy
                                        const dx = enemy.x - combat.playerPos.x;
                                        const dy = enemy.y - combat.playerPos.y;
                                        const angle = Math.atan2(dy, dx);
                                        
                                        // Position indicator at edge
                                        // Clamp percent to 5-95
                                        const indicatorLeft = Math.max(5, Math.min(95, leftPercent));
                                        const indicatorTop = Math.max(5, Math.min(95, topPercent));
                                        
                                        return (
                                            <div 
                                                key={`ind-${enemy.id}`}
                                                className="absolute w-8 h-8 z-[95] pointer-events-none flex items-center justify-center animate-pulse"
                                                style={{ left: `${indicatorLeft}%`, top: `${indicatorTop}%`, transform: 'translate(-50%, -50%)' }}
                                            >
                                                <div className="relative">
                                                     <AlertTriangle size={24} className="text-red-500 fill-red-900/50" style={{ transform: `rotate(${angle + Math.PI/2}rad)` }} />
                                                     <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* VISUAL EFFECTS (Relative to Player - Scaled) */}
                                    {combat.visualEffects.map(effect => (
                                        <div 
                                            key={effect.id}
                                            className="absolute w-20 h-20 -ml-10 -mt-10 pointer-events-none flex items-center justify-center z-[80]"
                                            style={{ 
                                                left: `${50 + (effect.x - combat.playerPos.x) * GAME_SCALE}%`, 
                                                top: `${50 + (effect.y - combat.playerPos.y) * GAME_SCALE}%` 
                                            }}
                                        >
                                            {effect.type === 'dash' && (
                                                <div className="w-full h-full bg-blue-500/30 rounded-full animate-ping"></div>
                                            )}
                                            {effect.type === 'thunder' && (
                                                <div className="w-[300px] h-[300px] bg-yellow-400/20 rounded-full border-4 border-yellow-400 animate-ping absolute"></div>
                                            )}
                                            {effect.type === 'heal' && (
                                                <div className="w-[120px] h-[120px] bg-emerald-400/20 rounded-full border-4 border-emerald-400 animate-ping absolute"></div>
                                            )}
                                        </div>
                                    ))}


                                    {/* PLAYER SPRITE (ALWAYS CENTERED & LARGER) */}
                                    <div 
                                        className="absolute w-16 h-24 -ml-8 -mt-20 transition-none" 
                                        style={{ 
                                            left: '50%', 
                                            top: '50%',
                                            // FIX: Safe Z-Index Logic. Using Screen Y offset relative to player (which is 0). Base 5000.
                                            zIndex: 5000 
                                        }}
                                    >
                                        <div className={`relative w-full h-full transition-all duration-1000 ease-out origin-bottom ${combat.deathAnimationStart ? 'rotate-90 grayscale brightness-50 translate-y-4' : ''}`} style={{ transform: !combat.deathAnimationStart ? `scaleX(${combat.playerFacing === 'LEFT' ? -1 : 1})` : `scaleX(${combat.playerFacing === 'LEFT' ? -1 : 1}) rotate(90deg)` }}>
                                            
                                            {/* PLAYER AVATAR COMPONENT */}
                                            <PlayerAvatar 
                                                playerClass={player.class} 
                                                isAttacking={combat.isAttacking}
                                                className={`w-full h-full object-contain pixel-render filter drop-shadow-2xl ${combat.playerAnimating && !combat.deathAnimationStart ? 'animate-walk' : (combat.deathAnimationStart ? '' : 'animate-breathe')}`}
                                            />
                                            
                                            {/* BLOCK VISUAL */}
                                            {now < combat.blockEndTime && !combat.deathAnimationStart && (
                                                <div className="absolute inset-0 -m-3 border-4 border-blue-400 rounded-full animate-pulse z-50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                                            )}

                                            {/* NO SHADOW */}
                                        </div>
                                        
                                        {/* HP Bar - RESTORED & RED */}
                                        {!combat.deathAnimationStart && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 text-center pointer-events-none z-[60] opacity-90">
                                                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-900 shadow-md">
                                                    <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(player.hp / maxHp) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ENEMY SPRITES (Relative to Player - Scaled & Larger) */}
                                    {!combatResult && combat.enemies.map((enemy) => {
                                        // FIX: Z-Index based on Screen Y. 
                                        // Objects "lower" on screen (higher Y) should cover objects "higher" on screen.
                                        // Base 5000 + relative offset.
                                        const screenY = (enemy.y - combat.playerPos.y);
                                        const zIndex = 5000 + Math.floor(screenY * 100); 

                                        return (
                                        <div 
                                            key={enemy.id}
                                            className="absolute transition-none flex flex-col items-center justify-end"
                                            style={{ 
                                                left: `${50 + (enemy.x - combat.playerPos.x) * GAME_SCALE}%`, 
                                                top: `${50 + (enemy.y - combat.playerPos.y) * GAME_SCALE}%`,
                                                width: enemy.rank === 'BOSS' ? '10rem' : '4.5rem',
                                                height: enemy.rank === 'BOSS' ? '10rem' : '4.5rem',
                                                transform: 'translate(-50%, -80%)', // Center anchor
                                                zIndex: zIndex
                                            }}
                                        >
                                            <div className="relative w-full h-full transition-transform duration-150" style={{ transform: `scaleX(${enemy.facing === 'LEFT' ? -1 : 1})` }}>
                                                <div className={`w-full h-full 
                                                    ${enemy.isHit ? 'brightness-200 sepia contrast-150' : ''}
                                                    transition-all duration-100
                                                `}>
                                                    <img 
                                                        src={enemy.sprite} 
                                                        alt={enemy.name} 
                                                        className={`w-full h-full object-contain pixel-render animate-breathe`}
                                                    />
                                                </div>
                                                {/* NO SHADOW */}
                                            </div>
                                            
                                            {/* Enemy HP Bar */}
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[120%] space-y-0.5 text-center pointer-events-none z-20">
                                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-900 shadow">
                                                    <div 
                                                        className={`h-full transition-all duration-300 ${enemy.rank === 'BOSS' ? 'bg-amber-600' : 'bg-red-600'}`}
                                                        style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )})}

                                    {/* Damage Numbers / Status Text */}
                                    <div className="absolute top-8 left-0 right-0 text-center w-full z-[90] pointer-events-none">
                                         <span className="inline-block px-6 py-2 bg-black/70 backdrop-blur rounded-full text-base font-mono text-yellow-300 border border-white/20 shadow-xl animate-bounce">
                                            {combat.lastAction}
                                         </span>
                                    </div>
                                </div>

                                {/* Controls - Fixed to bottom of card */}
                                <div className="p-4 bg-slate-800/80 backdrop-blur flex justify-between items-center relative z-[100] flex-shrink-0 border-t border-slate-700">
                                    <div className="flex items-center gap-6 text-sm text-slate-400">
                                        <div className="flex items-center gap-2"><Move size={18} /> <span className="font-bold text-white">WASD</span></div>
                                        <div className="flex items-center gap-2"><Zap size={18} /> <span className="font-bold text-white">Click</span></div>
                                        
                                        {/* Skill Bar */}
                                        <div className="flex gap-3 ml-4 border-l border-slate-600 pl-6">
                                            
                                            {/* DASH Skill */}
                                            <div className="relative group cursor-pointer" onClick={() => handleSkill('dash')}>
                                                <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${now < skillCooldowns.dash ? 'bg-slate-800 border-slate-600 opacity-50' : 'bg-blue-900 border-blue-500 hover:bg-blue-800'}`}>
                                                    <Wind size={20} className="text-white" />
                                                </div>
                                                <span className="absolute -top-2 -right-2 bg-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">SPC</span>
                                                {now < skillCooldowns.dash && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg font-bold text-sm">
                                                        {Math.ceil((skillCooldowns.dash - now) / 1000)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* SPECIAL Skill (Class Dependent) */}
                                            <div className="relative group cursor-pointer" onClick={() => handleSkill('special')}>
                                                 <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all 
                                                    ${now < skillCooldowns.special ? 'bg-slate-800 border-slate-600 opacity-50' : 
                                                      player.class === 'SOLDIER' ? 'bg-yellow-900 border-yellow-500 hover:bg-yellow-800' :
                                                      'bg-emerald-900 border-emerald-500 hover:bg-emerald-800'
                                                    }`}>
                                                    {player.class === 'SOLDIER' ? <Hammer size={20} className="text-white" /> : <Heart size={20} className="text-white" />}
                                                </div>
                                                <span className="absolute -top-2 -right-2 bg-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">E</span>
                                                {now < skillCooldowns.special && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg font-bold text-sm">
                                                        {Math.ceil((skillCooldowns.special - now) / 1000)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* GUARD Skill (New) */}
                                            <div className="relative group cursor-pointer" onClick={() => handleSkill('block')}>
                                                 <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all 
                                                    ${now < skillCooldowns.block ? 'bg-slate-800 border-slate-600 opacity-50' : 
                                                      'bg-blue-950 border-blue-400 hover:bg-blue-900'
                                                    }`}>
                                                    <Shield size={20} className="text-white" />
                                                </div>
                                                <span className="absolute -top-2 -right-2 bg-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">Q</span>
                                                {now < skillCooldowns.block && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg font-bold text-sm">
                                                        {Math.ceil((skillCooldowns.block - now) / 1000)}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                    <button 
                                        onClick={fleeCombat}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow text-sm"
                                    >
                                        <LogOut size={16} />
                                        <span>Flee</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Inventory Tab */}
                {activeTab === 'INVENTORY' && (
                    <div className="animate-fade-in p-4 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto">
                        {inventory.length === 0 ? (
                             <div className="col-span-full text-center text-slate-500 py-20">Inventory is empty. Go hunt!</div>
                        ) : (
                            inventory.map((item) => (
                                <ItemCard 
                                    key={item.id} 
                                    item={item} 
                                    onEquip={equipItem} 
                                    onSell={sellItem}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* Shop Tab */}
                {activeTab === 'SHOP' && (
                    <div className="animate-fade-in p-4">
                        <h2 className="text-center text-2xl cinzel text-yellow-500 mb-6">The Traveling Merchant</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pb-20">
                            {SHOP_ITEMS.map((item) => (
                                <div key={item.id} className="relative group">
                                     <ItemCard item={item} />
                                     <button 
                                        onClick={() => buyItem(item)}
                                        className="absolute bottom-2 right-2 left-2 bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                     >
                                         Buy ({item.value} G)
                                     </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Puzzle Tab */}
                {activeTab === 'PUZZLE' && (
                    <div className="animate-fade-in flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-6">
                        <Ghost size={64} className="text-purple-400 animate-float" />
                        <h2 className="text-3xl cinzel text-purple-300">The Spirit of Riddles</h2>
                        
                        {!puzzle.isActive ? (
                            <div className="space-y-4">
                                <p className="text-slate-400">Challenge the spirit for legendary rewards.</p>
                                <div className="flex gap-4 justify-center">
                                    {(['EASY', 'MEDIUM', 'HARD'] as const).map(diff => (
                                        <button 
                                            key={diff}
                                            onClick={() => {
                                                setPuzzle(p => ({ ...p, difficulty: diff }));
                                                setTimeout(startPuzzle, 0); // Defer to state update
                                            }}
                                            className="px-6 py-2 bg-purple-900/50 hover:bg-purple-800 border border-purple-500/30 rounded-lg text-purple-200 font-bold"
                                        >
                                            {diff}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full bg-slate-800/80 p-8 rounded-2xl border border-purple-500/30 shadow-2xl relative">
                                {puzzle.isLoading ? (
                                    <div className="flex justify-center items-center gap-3 text-purple-300">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xl font-serif italic text-purple-100 mb-8 leading-relaxed">"{puzzle.riddle}"</p>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={puzzleAnswer}
                                                onChange={(e) => setPuzzleAnswer(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && submitPuzzle()}
                                                placeholder="Whisper your answer..."
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                                            />
                                            <button 
                                                onClick={submitPuzzle}
                                                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
                                            >
                                                Speak
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>
            
            {/* LOG CONSOLE OVERLAY - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-[150] w-[350px] pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
                 <div ref={logsContainerRef} className="bg-black/60 backdrop-blur-md rounded-lg p-3 h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pointer-events-auto shadow-2xl border border-white/5">
                    {logs.map(log => (
                        <div key={log.id} className={`text-xs font-mono animate-fade-in
                            ${log.type === 'combat' ? 'text-red-300' : 
                              log.type === 'loot' ? 'text-yellow-300' : 
                              log.type === 'puzzle' ? 'text-purple-300' : 
                              log.type === 'error' ? 'text-red-500 font-bold' : 'text-slate-300'}`}>
                            <span className="opacity-50 mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: "2-digit", minute:"2-digit", second:"2-digit"})}]</span>
                            {log.message}
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-slate-600 text-xs italic text-center mt-10">Journal is empty...</div>}
                 </div>
            </div>

        </div>
      </main>
    </div>
  );
}