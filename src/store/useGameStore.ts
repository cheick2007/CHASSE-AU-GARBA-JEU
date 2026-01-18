import { create } from 'zustand';

export type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER' | 'VICTORY' | 'PAUSED' | 'LEVEL_TRANSITION';

interface StoreState {
  gameState: GameState;
  score: number;
  health: number;
  maxHealth: number;
  garbaFragments: number;
  level: number;
  inventory: string[];
  armor: number;
  gems: number;
  skins: { color: string; weaponColor: string };
  upgrades: { damage: number; speed: number; maxHealth: number };
  isInvincible: boolean;
  isFirstPerson: boolean;

  // MiniMap Data
  mapObjects: {
    garbas: { x: number, z: number }[];
    gems: { x: number, z: number }[];
    enemies: { x: number, z: number }[];
  };
  playerPosition: { x: number, z: number };
  playerRotation: number;

  setMapObjects: (data: { garbas: { x: number, z: number }[], gems: { x: number, z: number }[], enemies: { x: number, z: number }[] }) => void;
  setPlayerPosition: (x: number, z: number, rot: number) => void;

  // Actions
  setGameState: (state: GameState) => void;
  togglePause: () => void;
  addScore: (amount: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  collectGarba: () => void;
  addToInventory: (item: string) => void;
  resetGame: (difficulty?: 'easy' | 'medium' | 'hard') => void;
  respawnPlayer: () => void;
  nextLevel: () => void;
  setInvincible: (val: boolean) => void;
  setFirstPerson: (val: boolean) => void;

  // Controls State
  controls: {
    moveX: number;
    moveY: number;
    isShooting: boolean;
    isJumping: boolean;
  };
  setControls: (controls: Partial<{ moveX: number; moveY: number; isShooting: boolean; isJumping: boolean }>) => void;

  // Economy Actions
  addGems: (amount: number) => void;
  buySkin: (type: 'player' | 'weapon', color: string, cost: number) => void;
  buyUpgrade: (type: 'health' | 'damage', cost: number) => void;
  saveGame: () => void;
  loadGame: () => void;
}

export const useGameStore = create<StoreState>((set) => ({
  gameState: 'MENU',
  score: 0,
  health: 100,
  maxHealth: 100,
  garbaFragments: 0,
  level: 1,
  inventory: [],
  armor: 0,
  gems: 0,
  skins: { color: '#FF6B35', weaponColor: '#222' },
  upgrades: { damage: 1, speed: 1, maxHealth: 100 },
  isInvincible: false,
  isFirstPerson: false,

  controls: { moveX: 0, moveY: 0, isShooting: false, isJumping: false },
  setControls: (newControls) => set((state) => ({ controls: { ...state.controls, ...newControls } })),

  mapObjects: { garbas: [], gems: [], enemies: [] },
  playerPosition: { x: 0, z: 0 },
  playerRotation: 0,

  setMapObjects: (data) => set({ mapObjects: data }),
  setPlayerPosition: (x, z, rot) => set({ playerPosition: { x, z }, playerRotation: rot }),

  setGameState: (state) => set({ gameState: state }),

  togglePause: () => set((state) => ({
    gameState: state.gameState === 'PLAYING' ? 'PAUSED' : (state.gameState === 'PAUSED' ? 'PLAYING' : state.gameState)
  })),

  addScore: (amount) => set((state) => ({ score: state.score + amount })),

  heal: (amount) => set((state) => ({
    health: Math.min(state.maxHealth, state.health + amount)
  })),

  collectGarba: () => set((state) => {
    const newFragments = state.garbaFragments + 1;
    console.log('Collected Garba. Fragments:', newFragments, 'Level:', state.level);

    // Level Up Condition (3 Fragments per level)
    if (newFragments >= 3) {
      console.log('Triggering Level Transition! Fragments:', newFragments);
      // Trigger Cinematic Transition
      return {
        garbaFragments: 0,
        gameState: 'LEVEL_TRANSITION',
        score: state.score + 1000
      };
    }
    return { garbaFragments: newFragments, score: state.score + 500 };
  }),

  nextLevel: () => set((state) => ({
    level: state.level + 1,
    garbaFragments: 0, // Force reset to be sure
    health: Math.min(state.maxHealth, state.health + 50),
    gameState: 'PLAYING',
    isInvincible: true // Grant brief invincibility and reset position on new level
  })),

  addToInventory: (item) => set((state) => {
    if (item === 'health_pack') {
      return { health: Math.min(state.maxHealth, state.health + 50) };
    }
    if (item === 'armor_pack') {
      return { armor: (state.armor || 0) + 50 };
    }
    return { inventory: [...state.inventory, item] };
  }),

  respawnPlayer: () => set((state) => ({
    health: state.maxHealth,
    armor: 0,
    isInvincible: true,
    gameState: 'PLAYING'
  })),

  setInvincible: (val) => set({ isInvincible: val }),

  setFirstPerson: (val) => set({ isFirstPerson: val }),

  takeDamage: (amount) => set((state) => {
    if (state.isInvincible) return {};

    let damage = amount;
    let newArmor = state.armor || 0;

    // Armor absorption
    if (newArmor > 0) {
      if (newArmor >= damage) {
        newArmor -= damage;
        damage = 0;
      } else {
        damage -= newArmor;
        newArmor = 0;
      }
    }

    const newHealth = Math.max(0, state.health - damage);
    if (newHealth === 0) {
      return { health: 0, armor: 0, gameState: 'GAME_OVER' };
    }
    return {
      health: newHealth,
      armor: newArmor
    };
  }),

  // Economy Actions

  addGems: (amount) => set((state) => ({ gems: state.gems + amount })),

  buySkin: (type, color, cost) => set((state) => {
    if (state.gems >= cost) {
      const newSkins = { ...state.skins };
      if (type === 'player') newSkins.color = color;
      if (type === 'weapon') newSkins.weaponColor = color;
      return { gems: state.gems - cost, skins: newSkins };
    }
    return {};
  }),

  buyUpgrade: (type, cost) => set((state) => {
    if (state.gems >= cost) {
      const newUpgrades = { ...state.upgrades };
      if (type === 'health') {
        newUpgrades.maxHealth += 50;
        return { gems: state.gems - cost, upgrades: newUpgrades, maxHealth: state.maxHealth + 50, health: state.health + 50 }; // Heal on upgrade too
      }
      // Add other upgrades logic here (speed, damage) if implemented in Player/Weapon
      return { gems: state.gems - cost, upgrades: newUpgrades };
    }
    return {};
  }),

  saveGame: () => {
    const state = useGameStore.getState();
    const saveData = {
      level: state.level,
      score: state.score,
      gems: state.gems,
      skins: state.skins,
      upgrades: state.upgrades,
      inventory: state.inventory,
      health: state.health,
      maxHealth: state.maxHealth,
      armor: state.armor,
      playerPosition: state.playerPosition
    };
    localStorage.setItem('zongo_save', JSON.stringify(saveData));
    alert('Partie Sauvegardée ! ✅');
  },

  loadGame: () => {
    const saveString = localStorage.getItem('zongo_save');
    if (saveString) {
      const save = JSON.parse(saveString);
      set({
        level: save.level || 1,
        score: save.score || 0,
        gems: save.gems || 0,
        skins: save.skins || { color: '#FF6B35', weaponColor: '#222' },
        upgrades: save.upgrades || { damage: 1, speed: 1, maxHealth: 100 },
        inventory: save.inventory || [],
        health: save.health || 100,
        maxHealth: save.maxHealth || 100,
        armor: save.armor || 0,
        playerPosition: save.playerPosition || { x: 0, z: 0 },
        gameState: 'PLAYING',
        isInvincible: true // Brief safety on load
      });
      alert('Partie Chargée ! 📂');
    } else {
      alert('Aucune sauvegarde trouvée.');
    }
  },

  resetGame: (difficulty = 'medium') => set({
    gameState: 'PLAYING',
    score: 0,
    health: difficulty === 'easy' ? 150 : difficulty === 'hard' ? 75 : 100,
    maxHealth: difficulty === 'easy' ? 150 : difficulty === 'hard' ? 75 : 100,
    armor: 0,
    garbaFragments: 0,
    level: 1,
    inventory: [],
    // Keep Gems/Skins on Reset? Usually Roguelikes keep currency. 
    // User requested "Save", so simpler to keep resets as "Run Reset" but maybe keep gems?
    // For now, full reset for "New Game". Load Game restores gems.
    gems: 0,
    isInvincible: true,
    isFirstPerson: false
  })
}));
