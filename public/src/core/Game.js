// src/core/Game.js - Enhanced game controller with quest, zone, and NPC systems
import EventBus from './EventBus.js';
import GameLoop from './GameLoop.js';
import Player from '../entities/Player.js';
import MovementSystem from '../systems/MovementSystem.js';
import QuestSystem from '../systems/QuestSystem.js';
import ZoneSystem from '../systems/ZoneSystem.js';
import NPCSystem from '../systems/NPCSystem.js';

export default class Game {
  constructor(config) {
    this.config = config;
    this.events = new EventBus();
    
    // Core components
    this.player = null;
    this.gameLoop = null;
    
    // Systems
    this.systems = {};
    this.questSystem = null;
    this.zoneSystem = null;
    this.npcSystem = null;
    
    // Game state
    this.state = {
      currentZone: config.startingZone || 0,
      gameTime: 0,
      paused: false,
      inBattle: false
    };
    
    // Battle system
    this.currentEnemy = null;
    
    // DOM references
    this.gameArea = document.getElementById('game-area');
    this.battleScene = document.getElementById('battle-scene');
    
    // UI references
    this.ui = {
      hpBar: document.querySelector('#hud .hp span'),
      xpBar: document.querySelector('#hud .xp span'),
      xpLabel: document.getElementById('xp-label'),
      lvlLabel: document.getElementById('lvl'),
      hpLabel: document.getElementById('hp-label'),
      goldSpan: document.getElementById('gold'),
      bagGrid: document.getElementById('bag-grid')
    };
    
    // Interval references
    this.passiveRegenInterval = null;
    this.regenInterval = null;
  }

  async initialize() {
    console.log('Initializing enhanced game...');
    
    // Create player
    this.player = new Player(this.config.playerName || 'Artemis');
    
    // Initialize core systems
    this.systems.movement = new MovementSystem(this);
    
    // Initialize new systems
    this.questSystem = new QuestSystem(this);
    this.zoneSystem = new ZoneSystem(this);
    this.npcSystem = new NPCSystem(this);
    
    // Create game loop
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this),
      this.config.fps || 60
    );
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initial render
    this.paintZone();
    this.updateHUD();
    
    // Start passive regeneration
    this.startPassiveRegen();
    
    console.log('Enhanced game initialized!');
  }

  start() {
    this.gameLoop.start();
    this.events.emit('game:start');
  }

  update(deltaTime) {
    if (this.state.paused) return;
    
    // Update game time
    this.state.gameTime += deltaTime;
    
    // Update systems
    Object.values(this.systems).forEach(system => {
      if (system.update) system.update(deltaTime);
    });
  }

  render(interpolation) {
    // Render systems
    Object.values(this.systems).forEach(system => {
      if (system.render) system.render(interpolation);
    });
  }

  setupEventListeners() {
    // Player events
    this.player.events.on('damage', () => this.updateHUD());
    this.player.events.on('heal', () => this.updateHUD());
    this.player.events.on('xp:gain', () => this.updateHUD());
    this.player.events.on('levelup', (data) => {
      console.log(`Level up! Now level ${data.level}`);
      this.questSystem.showNotification(`Level Up! You are now level ${data.level}!`, 'success');
      
      // Update talent point display
      const talentPointsEl = document.getElementById('talent-points');
      if (talentPointsEl) {
        talentPointsEl.textContent = this.player.talentPoints;
      }
      this.updateHUD();
    });
    this.player.events.on('gold:gain', () => this.updateHUD());
    
    // Zone change events
    this.events.on('zone:change', (data) => {
      console.log(`Zone changed from ${data.from} to ${data.to}: ${data.zone.name}`);
      this.paintZone();
    });
    
    // Dev shortcuts
    document.addEventListener('keypress', (e) => {
      if (e.key === 'k') {
        this.player.addXp(100);
        this.player.addGold(50);
        this.player.talentPoints += 1;
        console.log(`Debug boost applied!`);
        
        // Update talent point display
        const talentPointsElement = document.getElementById('talent-points');
        if (talentPointsElement) {
          talentPointsElement.textContent = this.player.talentPoints;
        }
        
        this.updateHUD();
      }
    });
    
    // Pause
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.togglePause();
      }
    });
    
    // UI buttons
    const bagBtn = document.getElementById('bag-btn');
    const bagWin = document.getElementById('bag-window');
    const talentBtn = document.getElementById('talent-btn');
    const talentWin = document.getElementById('talent-window');
    const hambBtn = document.getElementById('hamburger');
    const sidePanel = document.getElementById('side-panel');
    
    bagBtn?.addEventListener('click', () => {
      bagWin.classList.toggle('open');
    });
    talentBtn?.addEventListener('click', () => {
      talentWin.classList.toggle('open');
    });
    hambBtn?.addEventListener('click', () => sidePanel.classList.toggle('open'));
  }

  // ─── ZONE MANAGEMENT ─────────────────────────
  changeZone(newZoneId) {
    return this.zoneSystem.changeZone(newZoneId);
  }

  paintZone() {
    const currentZone = this.zoneSystem.getCurrentZone();
    if (!currentZone) return;
    
    // Apply zone background
    this.gameArea.style.background = currentZone.background;
    this.gameArea.style.backgroundSize = 'cover';
    
    // Draw NPCs for current zone
    this.drawNPCs();
  }

  drawNPCs() {
    let npcContainer = document.getElementById('npc-container');
    if (!npcContainer) {
      npcContainer = document.createElement('div');
      npcContainer.id = 'npc-container';
      this.gameArea.appendChild(npcContainer);
    }
    
    npcContainer.innerHTML = '';
    
    const npcsInZone = this.npcSystem.getNPCsInZone(this.state.currentZone);
    
    for (const npc of npcsInZone) {
      const el = document.createElement('div');
      el.className = `npc ${npc.type}`;
      el.style.left = npc.x + 'px';
      
      // Add quest indicators
      const availableQuests = this.questSystem.getAvailableQuestsForNPC(npc.name);
      const completableQuests = this.questSystem.getActiveQuestsForNPC(npc.name);
      
      if (availableQuests.length > 0) {
        el.classList.add('has-quest');
      } else if (completableQuests.length > 0) {
        el.classList.add('quest-complete');
      }
      
      el.innerHTML = `<img src="${npc.img}" /><div class="name">${npc.name}</div>`;
      
      // Add click handler for dialogue
      el.addEventListener('click', () => {
        this.npcSystem.startDialogue(npc.id);
      });
      
      npcContainer.appendChild(el);
    }
  }

  getMaxZones() {
    return Object.keys(this.zoneSystem.zones).length;
  }

  // ─── BATTLE SYSTEM ───────────────────────────
  startBattle(enemy) {
    if (this.state.inBattle) return;
    
    this.state.inBattle = true;
    this.systems.movement.stop();
    
    // Create enemy from zone data
    const currentZone = this.zoneSystem.getCurrentZone();
    const enemyName = enemy.name || enemy;
    const enemyData = this.createEnemyFromZone(enemyName, currentZone);
    
    this.currentEnemy = enemyData;
    
    // Set up battle UI
    const enemyImg = document.getElementById('battle-enemy-img');
    const heroImg = document.getElementById('battle-hero-img');
    const enemySprite = document.getElementById('battle-enemy-sprite');
    const heroSprite = document.getElementById('battle-hero-sprite');
    
    if (enemyImg) enemyImg.src = enemyData.img || 'assets/enemy.png';
    if (heroImg) heroImg.src = 'assets/player.png';
    if (enemySprite) enemySprite.src = enemyData.img || 'assets/enemy.png';
    if (heroSprite) heroSprite.src = 'assets/player.png';
    
    // Show battle scene
    this.gameArea.style.display = 'none';
    this.battleScene.classList.remove('hidden');
    this.battleScene.classList.add('visible');
    this.battleScene.style.display = 'flex';
    
    console.log('Battle started against:', enemyData.name);
    
    this.updateBattleUI();
    
    // Make battle functions available globally
    window.attackEnemy = () => this.attackEnemy();
    window.fleeBattle = () => this.fleeBattle();
  }

  createEnemyFromZone(enemyName, zone) {
    const baseStats = {
      'Wolf': { hp: 80, attack: 15, defense: 5, xp: 30, gold: 10, img: 'assets/wolf.png' },
      'Bandit Scout': { hp: 120, attack: 20, defense: 8, xp: 50, gold: 20, img: 'assets/bandit.png' },
      'Bandit': { hp: 180, attack: 25, defense: 12, xp: 75, gold: 35, img: 'assets/bandit.png' },
      'Highway Robber': { hp: 220, attack: 30, defense: 15, xp: 100, gold: 50, img: 'assets/robber.png' },
      'Forest Spider': { hp: 150, attack: 22, defense: 8, xp: 60, gold: 15, img: 'assets/spider.png' },
      'Wild Boar': { hp: 200, attack: 28, defense: 18, xp: 80, gold: 25, img: 'assets/boar.png' },
      'Corrupted Wolf': { hp: 250, attack: 35, defense: 20, xp: 120, gold: 40, img: 'assets/corrupted-wolf.png' },
      'Corrupted Treant': { hp: 800, attack: 60, defense: 40, xp: 500, gold: 200, img: 'assets/treant.png' },
      'Crystal Spider': { hp: 300, attack: 40, defense: 25, xp: 150, gold: 60, img: 'assets/crystal-spider.png' },
      'Cave Troll': { hp: 600, attack: 55, defense: 35, xp: 300, gold: 120, img: 'assets/troll.png' },
      'Shadow Wraith': { hp: 400, attack: 50, defense: 15, xp: 200, gold: 80, img: 'assets/wraith.png' },
      'Orc Warrior': { hp: 500, attack: 45, defense: 30, xp: 250, gold: 100, img: 'assets/orc.png' },
      'Orc Chieftain': { hp: 1200, attack: 80, defense: 50, xp: 800, gold: 400, img: 'assets/orc-chief.png' },
      'Ancient Dragon': { hp: 3000, attack: 120, defense: 80, xp: 2000, gold: 1000, img: 'assets/dragon.png' }
    };
    
    const stats = baseStats[enemyName] || baseStats['Wolf'];
    
    // Scale stats based on zone level
    const levelMultiplier = 1 + (zone.levelRange[0] - 1) * 0.1;
    
    return {
      name: enemyName,
      maxHp: Math.floor(stats.hp * levelMultiplier),
      hp: Math.floor(stats.hp * levelMultiplier),
      attack: Math.floor(stats.attack * levelMultiplier),
      defense: Math.floor(stats.defense * levelMultiplier),
      xpReward: Math.floor(stats.xp * levelMultiplier),
      goldReward: Math.floor(stats.gold * levelMultiplier),
      img: stats.img
    };
  }

  attackEnemy() {
    if (!this.currentEnemy) return;
    
    const heroSprite = document.getElementById('battle-hero-sprite');
    const enemySprite = document.getElementById('battle-enemy-sprite');
    
    // Hero attacks
    const { damage, isCrit } = this.player.calculateDamage();
    this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damage);
    
    // Apply lifesteal
    if (this.player.lifesteal && damage > 0) {
      const healAmount = Math.floor(damage * this.player.lifesteal);
      this.player.heal(healAmount);
    }
    
    heroSprite?.classList.add('attack');
    this.showDamagePopup(damage, isCrit);
    setTimeout(() => heroSprite?.classList.remove('attack'), 250);
    
    // Check if enemy is defeated
    if (this.currentEnemy.hp <= 0) {
      setTimeout(() => this.endBattle(true), 500);
      return;
    }
    
    // Enemy retaliates
    setTimeout(() => {
      let enemyDamage = Math.floor(this.currentEnemy.attack * (0.8 + Math.random() * 0.4));
      
      // Apply player's damage reduction
      if (this.player.damageReduction) {
        enemyDamage = Math.floor(enemyDamage * (1 - this.player.damageReduction));
      }
      
      const actualDamage = this.player.takeDamage(enemyDamage);
      
      enemySprite?.classList.add('attack');
      this.showHeroDamagePopup(actualDamage);
      this.updateBattleUI();
      
      setTimeout(() => enemySprite?.classList.remove('attack'), 250);
      
      if (this.player.stats.hp <= 0) {
        this.endBattle(false);
      }
    }, 600);
    
    this.updateBattleUI();
  }

  fleeBattle() {
    this.questSystem.showNotification('You fled from battle!', 'warning');
    this.endBattle(false);
  }

  endBattle(won) {
    this.battleScene.classList.remove('visible');
    this.battleScene.style.display = 'none';
    this.gameArea.style.display = 'block';
    
    if (won && this.currentEnemy) {
      // Give rewards
      const xpReward = this.currentEnemy.xpReward;
      const goldReward = this.currentEnemy.goldReward;
      
      this.player.addXp(xpReward);
      this.player.addGold(goldReward);
      
      this.questSystem.showNotification(
        `Victory! +${xpReward} XP, +${goldReward} Gold`, 
        'success'
      );
      
      // Trigger quest objectives
      this.questSystem.onEnemyKilled(this.currentEnemy.name);
      
      // Check for special zone events
      if (this.currentEnemy.name === 'Ancient Dragon') {
        this.zoneSystem.triggerZoneEvent('boss-defeated');
      }
    } else if (!won) {
      // Handle defeat
      if (this.player.stats.hp <= 0) {
        this.questSystem.showNotification('You have been defeated! Returning to village...', 'warning');
        this.state.currentZone = 0;
        this.zoneSystem.currentZone = 0;
        this.systems.movement.setPosition(100);
        this.player.stats.hp = Math.floor(this.player.stats.maxHp * 0.5); // Revive with half HP
        this.paintZone();
      }
    }
    
    this.state.inBattle = false;
    this.currentEnemy = null;
    this.updateHUD();
  }

  updateBattleUI() {
    const heroHp = document.getElementById('battle-hero-hp');
    const heroBar = document.getElementById('battle-hero-hp-bar');
    const enemyHp = document.getElementById('battle-enemy-hp');
    const enemyBar = document.getElementById('battle-enemy-hp-bar');
    
    if (heroHp) heroHp.textContent = `${this.player.stats.hp}/${this.player.stats.maxHp}`;
    if (heroBar) heroBar.style.width = (this.player.stats.hp / this.player.stats.maxHp * 100) + '%';
    
    if (this.currentEnemy) {
      if (enemyHp) enemyHp.textContent = `${this.currentEnemy.name}: ${this.currentEnemy.hp}/${this.currentEnemy.maxHp}`;
      if (enemyBar) enemyBar.style.width = (this.currentEnemy.hp / this.currentEnemy.maxHp * 100) + '%';
    }
  }

  showDamagePopup(amount, isCrit = false) {
    const popup = document.getElementById('damage-popup');
    if (!popup) return;
    
    popup.textContent = `-${amount}`;
    popup.className = isCrit ? 'damage-popup critical' : 'damage-popup';
    popup.classList.remove('hidden');
    popup.style.animation = 'none';
    void popup.offsetWidth;
    popup.style.animation = '';
    
    setTimeout(() => popup.classList.add('hidden'), 800);
  }

  showHeroDamagePopup(amount) {
    const popup = document.getElementById('hero-damage-popup');
    if (!popup) return;
    
    popup.textContent = `-${amount}`;
    popup.classList.remove('hidden');
    popup.style.animation = 'none';
    void popup.offsetWidth;
    popup.style.animation = '';
    
    setTimeout(() => popup.classList.add('hidden'), 800);
  }

  // ─── MOVEMENT & COLLISION ────────────────────
  checkNPCCollisions(playerX) {
    // Check for NPC dialogue interactions
    const npc = this.npcSystem.checkNPCInteraction(playerX, this.state.currentZone);
    if (npc) {
      // Show interaction prompt or auto-start dialogue
      return npc;
    }
    
    // Check for enemy encounters (random encounters in dangerous zones)
    const currentZone = this.zoneSystem.getCurrentZone();
    if (currentZone.type === 'dangerous' && Math.random() < 0.01) { // 1% chance per frame
      const enemies = this.zoneSystem.getZoneEnemies(this.state.currentZone);
      if (enemies.length > 0) {
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        this.startBattle(randomEnemy);
      }
    }
    
    return null;
  }

  // ─── HUD MANAGEMENT ──────────────────────────
  updateHUD() {
    const player = this.player;
    const ui = this.ui;
    
    // HP bar
    if (ui.hpBar) ui.hpBar.style.width = (player.stats.hp / player.stats.maxHp) * 100 + '%';
    if (ui.hpLabel) ui.hpLabel.textContent = `${player.stats.hp}/${player.stats.maxHp}`;
    
    // XP bar
    if (ui.xpBar) ui.xpBar.style.width = (player.xp / player.xpToNext) * 100 + '%';
    if (ui.xpLabel) ui.xpLabel.textContent = `${player.xp}/${player.xpToNext}`;
    
    // Level
    if (ui.lvlLabel) ui.lvlLabel.textContent = `Lv ${player.level}`;
    
    // Gold
    if (ui.goldSpan) ui.goldSpan.textContent = player.gold;
    
    // Update stats display
    const statsDisplay = document.getElementById('stats-display');
    if (statsDisplay) {
      statsDisplay.innerHTML = `
        <div>Attack: ${Math.floor(player.stats.attack)}</div>
        <div>Defense: ${Math.floor(player.stats.defense)}</div>
        <div>Crit: ${Math.floor(player.stats.critChance * 100)}%</div>
        <div>Max HP: ${player.stats.maxHp}</div>
        <div>Max MP: ${player.stats.maxMp}</div>
        <div>Zone: ${this.zoneSystem.getCurrentZone().name}</div>
      `;
    }
  }

  // ─── REGENERATION ────────────────────────────
  startPassiveRegen() {
    if (this.passiveRegenInterval) return;
    
    this.passiveRegenInterval = setInterval(() => {
      // Only regen when not in battle
      if (!this.state.inBattle && this.player.stats.hp < this.player.stats.maxHp) {
        // Base regen: 2% of max HP per second
        let regenAmount = Math.ceil(this.player.stats.maxHp * 0.02);
        
        // Add talent regen bonus
        if (this.player.regen) {
          regenAmount += this.player.regen;
        }
        
        this.player.heal(regenAmount);
        this.updateHUD();
      }
    }, 1000);
  }

  // ─── MERCHANT SYSTEM ─────────────────────────
  openMerchant(npc) {
    console.log('Opening merchant for:', npc.name);
    // This would integrate with the existing merchant system
    // For now, just show a message
    this.questSystem.showNotification(`${npc.name}'s shop - Coming soon!`, 'info');
  }

  // ─── UTILITY METHODS ─────────────────────────
  togglePause() {
    this.state.paused = !this.state.paused;
    this.events.emit('game:pause', this.state.paused);
    console.log(this.state.paused ? 'Game paused' : 'Game resumed');
  }

  getDebugInfo() {
    return {
      fps: this.gameLoop ? this.gameLoop.getFPS() : 0,
      zone: this.state.currentZone,
      zoneName: this.zoneSystem.getCurrentZone().name,
      playerPos: this.systems.movement ? this.systems.movement.getPosition() : 0,
      playerLevel: this.player ? this.player.level : 1,
      gameTime: Math.floor(this.state.gameTime),
      activeQuests: Object.values(this.questSystem.questStates).filter(state => state === 'active').length
    };
  }

  // ─── SAVE/LOAD SYSTEM ────────────────────────
  saveGame() {
    const saveData = {
      player: this.player.serialize(),
      currentZone: this.state.currentZone,
      gameTime: this.state.gameTime,
      discoveredZones: Array.from(this.zoneSystem.discoveredZones),
      questStates: this.questSystem.questStates,
      questObjectives: {}
    };
    
    // Save quest objective progress
    Object.values(this.questSystem.questDatabase).forEach(quest => {
      saveData.questObjectives[quest.id] = quest.objectives;
    });
    
    localStorage.setItem('epicAdventureGame_save', JSON.stringify(saveData));
    this.questSystem.showNotification('Game saved!', 'success');
    
    return saveData;
  }

  loadGame() {
    try {
      const saveData = JSON.parse(localStorage.getItem('epicAdventureGame_save'));
      if (!saveData) {
        this.questSystem.showNotification('No save data found!', 'warning');
        return false;
      }
      
      // Load player data
      this.player.deserialize(saveData.player);
      
      // Load world state
      this.state.currentZone = saveData.currentZone;
      this.state.gameTime = saveData.gameTime;
      this.zoneSystem.currentZone = saveData.currentZone;
      this.zoneSystem.discoveredZones = new Set(saveData.discoveredZones);
      
      // Load quest states
      this.questSystem.questStates = saveData.questStates;
      if (saveData.questObjectives) {
        Object.entries(saveData.questObjectives).forEach(([questId, objectives]) => {
          if (this.questSystem.questDatabase[questId]) {
            this.questSystem.questDatabase[questId].objectives = objectives;
          }
        });
      }
      
      // Update displays
      this.paintZone();
      this.updateHUD();
      this.questSystem.updateQuestLog();
      this.zoneSystem.updateMinimap();
      
      this.questSystem.showNotification('Game loaded!', 'success');
      return true;
      
    } catch (error) {
      console.error('Failed to load game:', error);
      this.questSystem.showNotification('Failed to load save data!', 'warning');
      return false;
    }
  }
}