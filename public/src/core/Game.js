// src/core/Game.js - Complete working game with all features
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
    
    // Battle system
    this.currentEnemy = null;
    
    // Simple quest system
    this.quests = {
      'welcome-to-town': { completed: false, active: false },
      'kill-wolves': { completed: false, active: false, progress: 0, target: 3 }
    };
    
    // Game data
    this.zones = [
      { 
        backgroundImage: 'url(assets/bg.png)', 
        name: 'Aldenhaven Village',
        enemies: []
      },
      { 
        backgroundImage: 'url(assets/bg1.png)', 
        name: 'Greenwood Plains',
        enemies: ['Wolf', 'Bandit Scout']
      },
      { 
        backgroundImage: 'url(assets/bg2.png)', 
        name: 'Merchant Crossroads',
        enemies: ['Bandit', 'Highway Robber']
      },
      { 
        backgroundImage: 'url(assets/bg3.png)', 
        name: 'Whispering Woods',
        enemies: ['Forest Spider', 'Wild Boar']
      },
      { 
        backgroundImage: 'url(assets/bg4.png)', 
        name: 'Dark Forest',
        enemies: ['Corrupted Wolf', 'Dark Sprite']
      }
    ];
    
    this.npcs = [
      new NPC('Elder Marcus', 'friendly', 300, 0, 'assets/friendly.png'),
      new NPC('Blacksmith', 'friendly', 600, 0, 'assets/friendly.png'),
      new NPC('Wolf', 'enemy', 200, 1, 'assets/enemy.png', 80),
      new NPC('Bandit Scout', 'enemy', 500, 1, 'assets/enemy.png', 120),
      new NPC('Merchant', 'friendly', 450, 2, 'assets/friendly.png'),
      new NPC('Bandit', 'enemy', 300, 2, 'assets/enemy.png', 150),
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
      bagGrid: document.getElementById('bag-grid')
    };
    
    // Interval references
    this.passiveRegenInterval = null;
  }

  async initialize() {
    console.log('Initializing game...');
    
    // Create player
    this.player = new Player(this.config.playerName || 'Artemis');
    
    // Initialize core systems
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
    
    // Start passive regeneration
    this.startPassiveRegen();
    
    console.log('Game initialized successfully!');
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
      this.showNotification(`Level Up! You are now level ${data.level}!`, 'success');
      
      // Update talent point display
      const talentPointsEl = document.getElementById('talent-points');
      if (talentPointsEl) {
        talentPointsEl.textContent = this.player.talentPoints;
      }
      this.updateHUD();
    });
    this.player.events.on('gold:gain', () => this.updateHUD());
    
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
        this.showNotification('Debug boost applied! (+100 XP, +50 Gold, +1 Talent Point)', 'success');
      }
      
      // Interact with NPCs (E key)
      if (e.key === 'e') {
        this.interactWithNearbyNPC();
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
      console.log('Bag button clicked');
      bagWin?.classList.toggle('open');
    });
    talentBtn?.addEventListener('click', () => {
      console.log('Talent button clicked');
      talentWin?.classList.toggle('open');
    });
    hambBtn?.addEventListener('click', () => sidePanel?.classList.toggle('open'));
  }

  // ─── ZONE MANAGEMENT ─────────────────────────
  changeZone(newZoneId) {
    if (newZoneId >= 0 && newZoneId < this.zones.length) {
      this.state.currentZone = newZoneId;
      this.paintZone();
      console.log(`Changed to zone ${newZoneId}: ${this.zones[newZoneId].name}`);
      this.showNotification(`Entered: ${this.zones[newZoneId].name}`, 'info');
      return true;
    }
    return false;
  }

  paintZone() {
    const zone = this.zones[this.state.currentZone];
    if (!zone) return;
    
    // Apply zone background
    this.gameArea.style.background = zone.backgroundImage;
    this.gameArea.style.backgroundSize = 'cover';
    
    // Draw NPCs
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
    
    const npcsInZone = this.npcs.filter(npc => npc.zone === this.state.currentZone);
    
    for (const npc of npcsInZone) {
      // Skip defeated enemies (with respawn chance)
      if (npc.isEnemy && npc.defeated) {
        const chance = npc.respawnChance ?? 0.5;
        if (Math.random() >= chance) continue;
        npc.defeated = false;
        npc.hp = npc.maxHp;
      }
      
      const el = document.createElement('div');
      el.className = `npc ${npc.type}`;
      el.style.left = npc.x + 'px';
      
      // Add quest indicators for friendly NPCs
      if (npc.type === 'friendly') {
        if (npc.name === 'Elder Marcus' && !this.quests['welcome-to-town'].completed) {
          el.classList.add('has-quest');
        }
      }
      
      el.innerHTML = `<img src="${npc.img}" /><div class="name">${npc.name}</div>`;
      
      // Add click handler
      el.addEventListener('click', () => {
        if (npc.type === 'enemy') {
          this.startBattle(npc);
        } else {
          this.startDialogue(npc);
        }
      });
      
      npcContainer.appendChild(el);
    }
  }

  interactWithNearbyNPC() {
    const playerX = this.systems.movement.getPosition();
    const npcsInZone = this.npcs.filter(npc => npc.zone === this.state.currentZone);
    
    for (const npc of npcsInZone) {
      const distance = Math.abs(npc.x - playerX);
      if (distance < 80) { // Close enough to interact
        if (npc.type === 'enemy') {
          this.startBattle(npc);
        } else {
          this.startDialogue(npc);
        }
        return;
      }
    }
    
    this.showNotification('No one nearby to interact with. Get closer to NPCs.', 'info');
  }

  getMaxZones() {
    return this.zones.length;
  }

  // ─── SIMPLE DIALOGUE SYSTEM ──────────────────
  startDialogue(npc) {
    console.log(`Talking to ${npc.name}`);
    
    let message = '';
    let hasQuest = false;
    
    switch (npc.name) {
      case 'Elder Marcus':
        if (!this.quests['welcome-to-town'].active && !this.quests['welcome-to-town'].completed) {
          message = `Welcome to Aldenhaven, ${this.player.name}! We've been having trouble with wolves attacking our livestock. Could you help us by defeating 3 wolves in the plains to the east?`;
          hasQuest = true;
        } else if (this.quests['welcome-to-town'].active) {
          message = `How goes the wolf hunt? We need you to defeat ${this.quests['kill-wolves'].target - this.quests['kill-wolves'].progress} more wolves.`;
        } else {
          message = "Thank you for helping our village! You are always welcome here.";
        }
        break;
        
      case 'Blacksmith':
        message = "Welcome to my forge! I craft the finest weapons and armor in the land. (Shop coming soon!)";
        break;
        
      case 'Merchant':
        message = "Greetings, traveler! I have goods from across the realm. (Trading system coming soon!)";
        break;
        
      default:
        message = npc.getRandomDialogue ? npc.getRandomDialogue() : "Hello there!";
    }
    
    // Show dialogue
    this.showDialogue(npc.name, message, hasQuest ? 'welcome-to-town' : null);
  }

  showDialogue(npcName, message, questId = null) {
    const dialogueDiv = document.createElement('div');
    dialogueDiv.className = 'simple-dialogue';
    dialogueDiv.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      max-width: 600px;
      text-align: center;
      z-index: 1000;
      border: 2px solid #8B6914;
    `;
    
    let html = `
      <h3>${npcName}</h3>
      <p>${message}</p>
      <div style="margin-top: 15px;">
    `;
    
    if (questId) {
      html += `<button onclick="game.acceptQuest('${questId}')" style="margin-right: 10px; padding: 10px 20px; background: #4CAF50; border: none; border-radius: 5px; color: white; cursor: pointer;">Accept Quest</button>`;
    }
    
    html += `<button onclick="game.closeDialogue()" style="padding: 10px 20px; background: #666; border: none; border-radius: 5px; color: white; cursor: pointer;">Close</button>`;
    html += `</div>`;
    
    dialogueDiv.innerHTML = html;
    document.body.appendChild(dialogueDiv);
    
    // Auto-close after 10 seconds if no quest
    if (!questId) {
      setTimeout(() => {
        if (dialogueDiv.parentNode) {
          dialogueDiv.remove();
        }
      }, 10000);
    }
  }

  acceptQuest(questId) {
    this.quests[questId].active = true;
    console.log(`Accepted quest: ${questId}`);
    
    if (questId === 'welcome-to-town') {
      this.quests['kill-wolves'].active = true;
      this.showNotification('Quest accepted: Kill 3 wolves in the plains!', 'success');
    }
    
    this.closeDialogue();
    this.paintZone(); // Refresh NPCs to remove quest marker
  }

  closeDialogue() {
    const dialogues = document.querySelectorAll('.simple-dialogue');
    dialogues.forEach(d => d.remove());
  }

  // ─── BATTLE SYSTEM ───────────────────────────
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
    
    // Set up battle UI
    const enemyImg = document.getElementById('battle-enemy-img');
    const heroImg = document.getElementById('battle-hero-img');
    const enemySprite = document.getElementById('battle-enemy-sprite');
    const heroSprite = document.getElementById('battle-hero-sprite');
    
    if (enemyImg) enemyImg.src = npc.img || 'assets/enemy.png';
    if (heroImg) heroImg.src = 'assets/player.png';
    if (enemySprite) enemySprite.src = npc.img || 'assets/enemy.png';
    if (heroSprite) heroSprite.src = 'assets/player.png';
    
    // Show battle scene
    this.gameArea.style.display = 'none';
    this.battleScene.classList.remove('hidden');
    this.battleScene.classList.add('visible');
    this.battleScene.style.display = 'flex';
    
    console.log('Battle started against:', npc.name);
    this.showNotification(`Battle started against: ${npc.name}!`, 'warning');
    
    this.updateBattleUI();
    
    // Make battle functions available globally
    window.attackEnemy = () => this.attackEnemy();
    window.fleeBattle = () => this.fleeBattle();
  }

  attackEnemy() {
    if (!this.currentEnemy) return;
    
    const heroSprite = document.getElementById('battle-hero-sprite');
    const enemySprite = document.getElementById('battle-enemy-sprite');
    
    // Hero attacks
    const { damage, isCrit } = this.player.calculateDamage();
    this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damage);
    
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
      let enemyDamage = Math.floor(15 + Math.random() * 10);
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
    this.showNotification('You fled from battle!', 'warning');
    this.endBattle(false);
  }

  endBattle(won) {
    this.battleScene.classList.remove('visible');
    this.battleScene.style.display = 'none';
    this.gameArea.style.display = 'block';
    
    if (won && this.currentEnemy) {
      // Give rewards
      const xpReward = 50;
      const goldReward = 20;
      
      this.player.addXp(xpReward);
      this.player.addGold(goldReward);
      
      this.showNotification(`Victory! +${xpReward} XP, +${goldReward} Gold`, 'success');
      
      // Update quest progress
      if (this.quests['kill-wolves'].active && this.currentEnemy.name === 'Wolf') {
        this.quests['kill-wolves'].progress++;
        this.showNotification(`Wolves killed: ${this.quests['kill-wolves'].progress}/${this.quests['kill-wolves'].target}`, 'info');
        
        if (this.quests['kill-wolves'].progress >= this.quests['kill-wolves'].target) {
          this.quests['kill-wolves'].completed = true;
          this.quests['welcome-to-town'].completed = true;
          this.showNotification('Quest completed! Return to Elder Marcus for your reward!', 'success');
        }
      }
      
      if (this.currentEnemy.ref) {
        this.currentEnemy.ref.defeated = true;
      }
    } else if (!won && this.player.stats.hp <= 0) {
      // Handle defeat
      this.showNotification('You have been defeated! Returning to village...', 'warning');
      this.state.currentZone = 0;
      this.systems.movement.setPosition(100);
      this.player.stats.hp = Math.floor(this.player.stats.maxHp * 0.5);
      this.paintZone();
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

  // ─── TALENT SYSTEM ───────────────────────────
  spendTalentPoint(type) {
    console.log('Spending talent point:', type);
    
    if (this.player.talentPoints <= 0) {
      console.log('No talent points available');
      this.showNotification('No talent points available!', 'warning');
      return;
    }
    
    this.player.talentPoints--;
    
    switch(type) {
      case 'attack':
        this.player.stats.attack += 5;
        this.showNotification('Attack increased by 5!', 'success');
        break;
      case 'health':
        this.player.stats.maxHp += 20;
        this.player.stats.hp += 20;
        this.showNotification('Max HP increased by 20!', 'success');
        break;
      case 'crit':
        this.player.stats.critChance += 0.05;
        this.showNotification('Crit chance increased by 5%!', 'success');
        break;
      default:
        this.player.talentPoints++; // Refund if invalid
        console.log('Unknown talent type');
        return;
    }
    
    // Update displays
    const talentPointsEl = document.getElementById('talent-points');
    if (talentPointsEl) {
      talentPointsEl.textContent = this.player.talentPoints;
    }
    
    this.updateHUD();
    console.log(`Talent improved: ${type}`);
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
      const currentZone = this.zones[this.state.currentZone]?.name || 'Unknown';
      
      statsDisplay.innerHTML = `
        <div>Attack: ${Math.floor(player.stats.attack)}</div>
        <div>Defense: ${Math.floor(player.stats.defense)}</div>
        <div>Crit: ${Math.floor(player.stats.critChance * 100)}%</div>
        <div>Max HP: ${player.stats.maxHp}</div>
        <div>Max MP: ${player.stats.maxMp}</div>
        <div>Zone: ${currentZone}</div>
        <div>Talent Points: ${player.talentPoints}</div>
      `;
    }
  }

  // ─── NOTIFICATION SYSTEM ─────────────────────
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `game-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 1000;
      max-width: 350px;
      border-left: 4px solid ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : type === 'error' ? '#F44336' : '#2196F3'};
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 4000);
  }

  // ─── REGENERATION ────────────────────────────
  startPassiveRegen() {
    if (this.passiveRegenInterval) return;
    
    this.passiveRegenInterval = setInterval(() => {
      // Only regen when not in battle
      if (!this.state.inBattle && this.player.stats.hp < this.player.stats.maxHp) {
        // Base regen: 2% of max HP per second
        const regenAmount = Math.ceil(this.player.stats.maxHp * 0.02);
        this.player.heal(regenAmount);
        this.updateHUD();
      }
    }, 1000);
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
      zoneName: this.zones[this.state.currentZone]?.name || 'Unknown',
      playerPos: this.systems.movement ? this.systems.movement.getPosition() : 0,
      playerLevel: this.player ? this.player.level : 1,
      gameTime: Math.floor(this.state.gameTime),
      talentPoints: this.player ? this.player.talentPoints : 0
    };
  }
}

// Make game functions globally available for HTML onclick handlers
window.spendTalentPoint = (type) => {
  console.log('Global spendTalentPoint called with:', type);
  if (window.game && window.game.spendTalentPoint) {
    window.game.spendTalentPoint(type);
  } else {
    console.error('Game instance not found or spendTalentPoint method missing');
  }
};

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    to { transform: translateX(100%); opacity: 0; }
  }
  .has-quest::after {
    content: "!";
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: #FFD700;
    color: #000;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.1); }
  }
`;
document.head.appendChild(style);