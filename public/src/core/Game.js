// src/core/Game.js - Main game controller that manages everything
import EventBus from './EventBus.js';
import GameLoop from './GameLoop.js';
import Player from '../entities/Player.js';
import NPC from '../entities/NPC.js';
import MovementSystem from '../systems/MovementSystem.js';

export default class Game {
  constructor(config) {
    this.config = config;
    this.events = new EventBus();
    
    // Core components
    this.player = null;
    this.gameLoop = null;
    
    // Systems
    this.systems = {};
    
    // Game state
    this.state = {
      currentZone: config.startingZone || 0,
      gameTime: 0,
      paused: false,
      inBattle: false
    };
    
    // Game data
    this.zones = [
      { backgroundImage: 'url(assets/bg.png)' },
      { backgroundImage: 'url(assets/bg1.png)' },
      { backgroundImage: 'url(assets/bg2.png)' },
      { backgroundImage: 'url(assets/bg3.png)' },
      { backgroundImage: 'url(assets/bg4.png)' }
    ];
    
    this.npcs = [
      new NPC('Boblin', 'friendly', 300, 0, 'assets/friendly.png'),
      new NPC('Kukas', 'friendly', 600, 0, 'assets/friendly.png'),
      new NPC('Merchant', 'enemy', 200, 1, 'assets/enemy.png', 320, false, 0.01),
      new NPC('Merchant', 'enemy', 500, 1, 'assets/enemy.png', 120, false, 0.01),
      new NPC('BOB', 'friendly', 450, 2, 'assets/friendly.png'),
      new NPC('Merchant', 'enemy', 500, 4, 'assets/boss.png', 720, false, 0.01),
    ];
    
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
      bagGrid: document.getElementById('bag-grid'),
      talentList: document.getElementById('talent-list')
    };
    
    // Current battle
    this.currentEnemy = null;
  }

  async initialize() {
    console.log('Initializing game...');
    
    // Create player
    this.player = new Player(this.config.playerName || 'Artemis');
    
    // Initialize systems
    this.systems.movement = new MovementSystem(this);
    
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
    
    console.log('Game initialized!');
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
    
    // Update HUD
    this.updateHUD();
  }

  setupEventListeners() {
    // Player events
    this.player.events.on('damage', () => this.updateHUD());
    this.player.events.on('heal', () => this.updateHUD());
    this.player.events.on('xp:gain', () => this.updateHUD());
    this.player.events.on('levelup', (data) => {
      console.log(`Level up! Now level ${data.level}`);
      this.updateHUD();
    });
    this.player.events.on('gold:gain', () => this.updateHUD());
    
    // Dev shortcuts
    document.addEventListener('keypress', (e) => {
      if (e.key === 'k') {
        this.player.addXp(20);
        this.player.addGold(5);
      }
    });
    
    // Pause
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.togglePause();
      }
    });
    
    // UI buttons (keeping your existing functionality)
    const bagBtn = document.getElementById('bag-btn');
    const bagWin = document.getElementById('bag-window');
    const talentBtn = document.getElementById('talent-btn');
    const talentWin = document.getElementById('talent-window');
    const hambBtn = document.getElementById('hamburger');
    const sidePanel = document.getElementById('side-panel');
    
    bagBtn?.addEventListener('click', () => bagWin.classList.toggle('open'));
    talentBtn?.addEventListener('click', () => talentWin.classList.toggle('open'));
    hambBtn?.addEventListener('click', () => sidePanel.classList.toggle('open'));
  }

  // ─── ZONE MANAGEMENT ─────────────────────────
  changeZone(zoneId) {
    this.state.currentZone = zoneId;
    this.paintZone();
    this.events.emit('zone:change', zoneId);
  }

  paintZone() {
    const zone = this.zones[this.state.currentZone];
    if (!zone) return;
    
    this.gameArea.style.background = zone.backgroundImage;
    this.gameArea.style.backgroundSize = 'cover';
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
    
    const npcsInZone = this.getNPCsInCurrentZone();
    for (const npc of npcsInZone) {
      if (npc.isEnemy && npc.defeated) {
        const chance = npc.respawnChance ?? 0.5;
        if (Math.random() >= chance) continue;
        npc.defeated = false;
        npc.hp = npc.maxHp;
      }
      
      const el = document.createElement('div');
      el.className = `npc ${npc.type}`;
      el.style.left = npc.x + 'px';
      el.innerHTML = `<img src="${npc.img}" /><div class="name">${npc.name}</div>`;
      npcContainer.appendChild(el);
    }
  }

  getNPCsInCurrentZone() {
    return this.npcs.filter(npc => npc.zone === this.state.currentZone);
  }

  getMaxZones() {
    return this.zones.length;
  }

  // ─── BATTLE SYSTEM (temporary - will be moved) ───
  startBattle(npc) {
    if (this.state.inBattle) return;
    
    this.state.inBattle = true;
    this.systems.movement.stop();
    
    if (!('hp' in npc)) npc.hp = npc.maxHp;
    
    this.currentEnemy = {
      ...npc,
      ref: npc,
      hp: npc.hp,
      maxHp: npc.maxHp
    };
    
    // Set up battle UI - Check if elements exist
    const enemyImg = document.getElementById('battle-enemy-img');
    const heroImg = document.getElementById('battle-hero-img');
    const enemySprite = document.getElementById('battle-enemy-sprite');
    const heroSprite = document.getElementById('battle-hero-sprite');
    
    if (enemyImg) enemyImg.src = npc.img || 'assets/enemy.png';
    if (heroImg) heroImg.src = 'assets/player.png';
    if (enemySprite) enemySprite.src = npc.img || 'assets/enemy.png';
    if (heroSprite) heroSprite.src = 'assets/player.png';
    
    // Show battle scene with inline styles to override any CSS conflicts
    this.gameArea.style.display = 'none';
    this.battleScene.classList.remove('hidden');
    this.battleScene.classList.add('visible');
    
    // Force positioning with inline styles
    this.battleScene.style.position = 'fixed';
    this.battleScene.style.top = '50%';
    this.battleScene.style.left = '50%';
    this.battleScene.style.transform = 'translate(-50%, -50%)';
    this.battleScene.style.zIndex = '9999';
    this.battleScene.style.display = 'flex';
    
    console.log('Battle started against:', npc.name);
    
    this.updateBattleUI();
    
    // Make battle functions available globally (temporary)
    window.attackEnemy = () => this.attackEnemy();
    window.fleeBattle = () => this.fleeBattle();
  }

  attackEnemy() {
    const heroSprite = document.getElementById('battle-hero-sprite');
    const enemySprite = document.getElementById('battle-enemy-sprite');
    
    // Hero attacks
    const { damage, isCrit } = this.player.calculateDamage();
    this.currentEnemy.hp -= damage;
    
    heroSprite.classList.add('attack');
    this.showDamagePopup(damage, isCrit);
    setTimeout(() => heroSprite.classList.remove('attack'), 250);
    
    // Enemy retaliates after delay
    setTimeout(() => {
      if (this.currentEnemy.hp <= 0) {
        this.endBattle(true);
        return;
      }
      
      const enemyDamage = Math.floor(15 + Math.random() * 10);
      const actualDamage = this.player.takeDamage(enemyDamage);
      
      enemySprite.classList.add('attack');
      this.showHeroDamagePopup(actualDamage);
      this.updateBattleUI();
      
      setTimeout(() => enemySprite.classList.remove('attack'), 250);
      
      if (this.player.stats.hp <= 0) {
        this.endBattle(false);
      }
    }, 300);
  }

  fleeBattle() {
    this.endBattle(false);
  }

  endBattle(won) {
    this.battleScene.classList.remove('visible');
    this.gameArea.style.display = 'block';
    
    // Reset inline styles
    this.battleScene.style.position = '';
    this.battleScene.style.top = '';
    this.battleScene.style.left = '';
    this.battleScene.style.transform = '';
    this.battleScene.style.zIndex = '';
    this.battleScene.style.display = '';
    
    if (won) {
      const xpReward = 50;
      const goldReward = 20;
      
      this.player.addXp(xpReward);
      this.player.addGold(goldReward);
      this.player.combatStats.kills++;
      
      if (this.currentEnemy.ref) {
        this.currentEnemy.ref.defeated = true;
      }
    } else {
      // Reset on death
      if (this.player.stats.hp <= 0) {
        this.state.currentZone = 0;
        this.systems.movement.setPosition(100);
        this.player.heal(this.player.stats.maxHp);
        this.paintZone();
      }
    }
    
    this.state.inBattle = false;
    this.currentEnemy = null;
    this.updateHUD();
    this.paintZone();
  }

  updateBattleUI() {
    const heroHp = document.getElementById('battle-hero-hp');
    const heroBar = document.getElementById('battle-hero-hp-bar');
    const enemyHp = document.getElementById('battle-enemy-hp');
    const enemyBar = document.getElementById('battle-enemy-hp-bar');
    
    heroHp.textContent = `${this.player.stats.hp}/${this.player.stats.maxHp}`;
    heroBar.style.width = (this.player.stats.hp / this.player.stats.maxHp * 100) + '%';
    
    enemyHp.textContent = `${this.currentEnemy.name}: ${this.currentEnemy.hp}/${this.currentEnemy.maxHp}`;
    enemyBar.style.width = (this.currentEnemy.hp / this.currentEnemy.maxHp * 100) + '%';
  }

  showDamagePopup(amount, isCrit = false) {
    const popup = document.getElementById('damage-popup');
    popup.textContent = `-${amount}`;
    popup.className = isCrit ? 'damage-popup critical' : 'damage-popup';
    popup.classList.remove('hidden');
    popup.style.animation = 'none';
    void popup.offsetWidth;
    popup.style.animation = '';
    
    setTimeout(() => popup.classList.add('hidden'), 600);
  }

  showHeroDamagePopup(amount) {
    const popup = document.getElementById('hero-damage-popup');
    popup.textContent = `-${amount}`;
    popup.classList.remove('hidden');
    popup.style.animation = 'none';
    void popup.offsetWidth;
    popup.style.animation = '';
    
    setTimeout(() => popup.classList.add('hidden'), 600);
  }

  // ─── HUD MANAGEMENT ─────────────────────────
  updateHUD() {
    const player = this.player;
    const ui = this.ui;
    
    // HP bar
    ui.hpBar.style.width = (player.stats.hp / player.stats.maxHp) * 100 + '%';
    ui.hpLabel.textContent = `${player.stats.hp}/${player.stats.maxHp}`;
    
    // XP bar
    ui.xpBar.style.width = (player.xp / player.xpToNext) * 100 + '%';
    ui.xpLabel.textContent = `${player.xp}/${player.xpToNext}`;
    
    // Level
    ui.lvlLabel.textContent = `Lv ${player.level}`;
    
    // Gold
    ui.goldSpan.textContent = player.gold;
    
    // Bag grid
    const BAG_SIZE = 24;
    ui.bagGrid.innerHTML = Array.from({ length: BAG_SIZE }, (_, i) => {
      const item = player.inventory.items[i];
      if (!item) return '<div class="slot empty"></div>';
      const icon = item.icon ?? item.name[0];
      return `<div class="slot">${icon}</div>`;
    }).join('');
    
    // Talents
    ui.talentList.innerHTML = Object.entries(player.talents)
      .map(([id, rank]) => `<li>${id} (Rank ${rank})</li>`)
      .join('');
  }

  // ─── UTILITY METHODS ─────────────────────────
  togglePause() {
    this.state.paused = !this.state.paused;
    this.events.emit('game:pause', this.state.paused);
    console.log(this.state.paused ? 'Game paused' : 'Game resumed');
  }

  getDebugInfo() {
    return {
      fps: this.gameLoop.getFPS(),
      zone: this.state.currentZone,
      playerPos: this.systems.movement.getPosition(),
      playerLevel: this.player.level,
      gameTime: Math.floor(this.state.gameTime)
    };
  }
}