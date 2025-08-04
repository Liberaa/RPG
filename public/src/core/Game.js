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
    
    // Merchant state
    this.merchantOpen = false;
    this.currentMerchant = null;
    
    // Talent levels tracking
    this.talentLevels = {
      attack: 0,
      crit: 0,
      speed: 0,
      lifesteal: 0,
      health: 0,
      defense: 0,
      regen: 0,
      toughness: 0,
      greed: 0,
      wisdom: 0,
      lucky: 0,
      swift: 0
    };
    
    // Talent max levels
    this.talentMaxLevels = {
      attack: 10,
      crit: 10,
      speed: 5,
      lifesteal: 5,
      health: 10,
      defense: 10,
      regen: 5,
      toughness: 5,
      greed: 5,
      wisdom: 5,
      lucky: 5,
      swift: 5
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
    
    // Interval references
    this.passiveRegenInterval = null;
    this.regenInterval = null;
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
    
    // Start passive regeneration
    this.startPassiveRegen();
    
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
  }

  setupEventListeners() {
    // Player events
    this.player.events.on('damage', () => this.updateHUD());
    this.player.events.on('heal', () => this.updateHUD());
    this.player.events.on('xp:gain', () => this.updateHUD());
    this.player.events.on('levelup', (data) => {
      console.log(`Level up! Now level ${data.level}`);
      console.log(`Gained 1 talent point! Total: ${data.talentPoints}`);
      // Update talent point display
      const talentPointsEl = document.getElementById('talent-points');
      if (talentPointsEl) {
        talentPointsEl.textContent = data.talentPoints;
      }
      this.updateHUD();
    });
    this.player.events.on('gold:gain', () => this.updateHUD());
    
    // Dev shortcuts
    document.addEventListener('keypress', (e) => {
      if (e.key === 'k') {
        this.player.addXp(20);
        this.player.addGold(5);
        this.player.talentPoints += 1;
        console.log(`Talent points: ${this.player.talentPoints}`);
        
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
      console.log('Bag button clicked');
      bagWin.classList.toggle('open');
    });
    talentBtn?.addEventListener('click', () => {
      console.log('Talent button clicked');
      talentWin.classList.toggle('open');
    });
    hambBtn?.addEventListener('click', () => sidePanel.classList.toggle('open'));
  }

  // ─── OUT OF COMBAT REGENERATION ─────────────
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
    
    // Show battle scene with inline styles
    this.gameArea.style.display = 'none';
    this.battleScene.classList.remove('hidden');
    this.battleScene.classList.add('visible');
    
    // Force positioning
    this.battleScene.style.position = 'fixed';
    this.battleScene.style.top = '50%';
    this.battleScene.style.left = '50%';
    this.battleScene.style.transform = 'translate(-50%, -50%)';
    this.battleScene.style.zIndex = '9999';
    this.battleScene.style.display = 'flex';
    
    console.log('Battle started against:', npc.name);
    
    this.updateBattleUI();
    
    // Make battle functions available globally
    window.attackEnemy = () => this.attackEnemy();
    window.fleeBattle = () => this.fleeBattle();
  }

  attackEnemy() {
    const heroSprite = document.getElementById('battle-hero-sprite');
    const enemySprite = document.getElementById('battle-enemy-sprite');
    
    // Hero attacks
    const { damage, isCrit } = this.player.calculateDamage();
    this.currentEnemy.hp -= damage;
    
    // Apply lifesteal
    if (this.player.lifesteal && damage > 0) {
      const healAmount = Math.floor(damage * this.player.lifesteal);
      this.player.heal(healAmount);
      console.log(`Lifestealed ${healAmount} HP`);
    }
    
    heroSprite.classList.add('attack');
    this.showDamagePopup(damage, isCrit);
    setTimeout(() => heroSprite.classList.remove('attack'), 250);
    
    // Enemy retaliates after delay
    const attackDelay = this.player.attackSpeed ? 300 / this.player.attackSpeed : 300;
    
    setTimeout(() => {
      if (this.currentEnemy.hp <= 0) {
        this.endBattle(true);
        return;
      }
      
      let enemyDamage = Math.floor(15 + Math.random() * 10);
      
      // Apply damage reduction
      if (this.player.damageReduction) {
        enemyDamage = Math.floor(enemyDamage * (1 - this.player.damageReduction));
      }
      
      const actualDamage = this.player.takeDamage(enemyDamage);
      
      enemySprite.classList.add('attack');
      this.showHeroDamagePopup(actualDamage);
      this.updateBattleUI();
      
      setTimeout(() => enemySprite.classList.remove('attack'), 250);
      
      if (this.player.stats.hp <= 0) {
        this.endBattle(false);
      }
    }, attackDelay);
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
      // Apply XP and gold bonuses
      let xpReward = 50;
      let goldReward = 20;
      
      if (this.player.xpBonus) {
        xpReward = Math.floor(xpReward * this.player.xpBonus);
      }
      if (this.player.goldBonus) {
        goldReward = Math.floor(goldReward * this.player.goldBonus);
      }
      
      this.player.addXp(xpReward);
      this.player.addGold(goldReward);
      this.player.combatStats.kills++;
      
      console.log(`Victory! Gained ${xpReward} XP and ${goldReward} gold`);
      
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
    
    // Update stats display
    const statsDisplay = document.getElementById('stats-display');
    if (statsDisplay) {
      statsDisplay.innerHTML = `
        <div>Attack: ${player.stats.attack}</div>
        <div>Defense: ${player.stats.defense}</div>
        <div>Crit: ${Math.floor(player.stats.critChance * 100)}%</div>
        <div>Max HP: ${player.stats.maxHp}</div>
        <div>Max MP: ${player.stats.maxMp}</div>
        ${player.talentBonuses?.doubleStrike ? `<div>Double Strike: ${Math.floor(player.talentBonuses.doubleStrike * 100)}%</div>` : ''}
        ${player.talentBonuses?.damageReduction ? `<div>Damage Reduction: ${Math.floor(player.talentBonuses.damageReduction * 100)}%</div>` : ''}
      `;
    }
  }

  // ─── TALENT SYSTEM ─────────────────────────
  spendTalentPoint(type) {
    if (this.player.talentPoints <= 0) {
      console.log('No talent points available');
      return;
    }
    
    // Check if talent is maxed
    if (this.talentLevels[type] >= this.talentMaxLevels[type]) {
      console.log(`${type} talent is already maxed`);
      return;
    }
    
    this.player.talentPoints--;
    this.talentLevels[type]++;
    
    switch(type) {
      // Combat talents
      case 'attack':
        this.player.stats.attack += 5;
        console.log('Attack increased to', this.player.stats.attack);
        break;
      case 'crit':
        this.player.stats.critChance += 0.05;
        console.log('Crit chance increased to', Math.floor(this.player.stats.critChance * 100) + '%');
        break;
      case 'speed':
        this.player.attackSpeed = (this.player.attackSpeed || 1) * 1.1;
        console.log('Attack speed increased by 10%');
        break;
      case 'lifesteal':
        this.player.lifesteal = (this.player.lifesteal || 0) + 0.1;
        console.log('Lifesteal increased to', Math.floor(this.player.lifesteal * 100) + '%');
        break;
        
      // Defense talents
      case 'health':
        this.player.stats.maxHp += 25;
        this.player.stats.hp += 25;
        console.log('Max HP increased to', this.player.stats.maxHp);
        break;
      case 'defense':
        this.player.stats.defense += 3;
        console.log('Defense increased to', this.player.stats.defense);
        break;
      case 'regen':
        this.player.regen = (this.player.regen || 0) + 2;
        console.log('HP regen increased to', this.player.regen, 'per second');
        this.startRegen();
        break;
      case 'toughness':
        this.player.damageReduction = (this.player.damageReduction || 0) + 0.05;
        console.log('Damage reduction increased to', Math.floor(this.player.damageReduction * 100) + '%');
        break;
        
      // Utility talents
      case 'greed':
        this.player.goldBonus = (this.player.goldBonus || 1) * 1.2;
        console.log('Gold bonus increased by 20%');
        break;
      case 'wisdom':
        this.player.xpBonus = (this.player.xpBonus || 1) * 1.15;
        console.log('XP bonus increased by 15%');
        break;
      case 'lucky':
        this.player.dropBonus = (this.player.dropBonus || 1) * 1.1;
        console.log('Item drop chance increased by 10%');
        break;
      case 'swift':
        this.systems.movement.speed = this.systems.movement.speed * 1.15;
        console.log('Movement speed increased by 15%');
        break;
    }
    
    // Update displays
    document.getElementById('talent-points').textContent = this.player.talentPoints;
    const levelEl = document.getElementById(`${type}-level`);
    if (levelEl) {
      levelEl.textContent = this.talentLevels[type];
    }
    this.updateHUD();
  }
  
  startRegen() {
    if (this.regenInterval) return;
    
    this.regenInterval = setInterval(() => {
      if (this.player.regen && this.player.stats.hp < this.player.stats.maxHp) {
        this.player.heal(this.player.regen);
      }
    }, 1000);
  }

  // ─── MERCHANT SYSTEM ─────────────────────────
  openMerchant(npc) {
    this.merchantOpen = true;
    this.currentMerchant = npc;
    
    const window = document.getElementById('merchant-window');
    const nameEl = document.getElementById('merchant-name');
    const goldEl = document.getElementById('merchant-gold');
    
    if (nameEl) nameEl.textContent = `${npc.name}'s Shop`;
    if (goldEl) goldEl.textContent = this.player.gold;
    
    // Show buy tab by default
    this.showMerchantTab('buy');
    
    // Display shop items
    this.updateMerchantItems();
    
    if (window) window.style.display = 'flex';
    
    // Pause movement
    this.systems.movement.stop();
  }
  
  closeMerchant() {
    this.merchantOpen = false;
    this.currentMerchant = null;
    const window = document.getElementById('merchant-window');
    if (window) window.style.display = 'none';
  }
  
  showMerchantTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.merchant-tab').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show/hide content
    if (tab === 'buy') {
      const buyTab = document.getElementById('buy-tab');
      const sellTab = document.getElementById('sell-tab');
      if (buyTab) buyTab.style.display = 'block';
      if (sellTab) sellTab.style.display = 'none';
      this.updateMerchantItems();
    } else {
      const buyTab = document.getElementById('buy-tab');
      const sellTab = document.getElementById('sell-tab');
      if (buyTab) buyTab.style.display = 'none';
      if (sellTab) sellTab.style.display = 'block';
      this.updateSellItems();
    }
  }
  
  updateMerchantItems() {
    const container = document.getElementById('merchant-items');
    if (!container || !this.currentMerchant) return;
    
    const items = this.currentMerchant.getShopInventory();
    if (!items) return;
    
    if (!this.itemDatabase) {
      // Create a temporary item database reference
      this.itemDatabase = {
        'health-potion': { name: 'Health Potion', icon: '🧪', description: 'Restores 50 HP', value: 50 },
        'mana-potion': { name: 'Mana Potion', icon: '💙', description: 'Restores 30 MP', value: 60 },
        'iron-sword': { name: 'Iron Sword', icon: '⚔️', description: '+10 Attack', value: 200 },
        'leather-armor': { name: 'Leather Armor', icon: '🦺', description: '+5 Defense', value: 150 },
        'chainmail': { name: 'Chainmail', icon: '🛡️', description: '+10 Defense, +20 HP', value: 400 },
        'enchanted-blade': { name: 'Enchanted Blade', icon: '🔥', description: '+20 Attack, +5% Crit', value: 800 },
        'iron-ore': { name: 'Iron Ore', icon: '⛏️', description: 'Crafting material', value: 20 },
        'wolf-pelt': { name: 'Wolf Pelt', icon: '🐺', description: 'Crafting material', value: 30 }
      };
    }
    
    container.innerHTML = items.map(item => {
      const itemData = this.itemDatabase[item.id];
      if (!itemData) return '';
      
      const canAfford = this.player.gold >= item.price;
      
      return `
        <div class="merchant-item ${canAfford ? '' : 'unaffordable'}">
          <span class="item-icon">${itemData.icon}</span>
          <div class="item-info">
            <div class="item-name">${itemData.name}</div>
            <div class="item-desc">${itemData.description}</div>
            <div class="item-stock">Stock: ${item.quantity}</div>
          </div>
          <div class="item-price">
            <div>${item.price} gold</div>
            <button onclick="game.buyItem('${item.id}', ${item.price})" 
                    ${canAfford && item.quantity > 0 ? '' : 'disabled'}>
              Buy
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
  
  updateSellItems() {
    const container = document.getElementById('sell-items');
    if (!container) return;
    
    const inventory = this.player.inventory.items;
    
    if (inventory.length === 0) {
      container.innerHTML = '<div class="empty-inventory">Your inventory is empty</div>';
      return;
    }
    
    container.innerHTML = inventory.map((item, index) => {
      const itemData = this.itemDatabase[item.id];
      if (!itemData) return '';
      
      // Sell price is 50% of buy price
      const sellPrice = Math.floor((itemData.value || 10) * 0.5);
      
      return `
        <div class="merchant-item">
          <span class="item-icon">${itemData.icon}</span>
          <div class="item-info">
            <div class="item-name">${itemData.name}</div>
            <div class="item-quantity">Quantity: ${item.quantity || 1}</div>
          </div>
          <div class="item-price">
            <div>${sellPrice} gold</div>
            <button onclick="game.sellItem(${index}, ${sellPrice})">Sell</button>
          </div>
        </div>
      `;
    }).join('');
  }
  
  buyItem(itemId, price) {
    if (this.player.gold < price || !this.currentMerchant) return;
    
    // Find the item in shop
    const shopItems = this.currentMerchant.getShopInventory();
    const shopItem = shopItems.find(item => item.id === itemId);
    
    if (!shopItem || shopItem.quantity <= 0) return;
    
    // Deduct gold
    this.player.gold -= price;
    shopItem.quantity--;
    
    // Add item to player inventory
    const existingItem = this.player.inventory.items.find(item => item.id === itemId);
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      this.player.inventory.items.push({ id: itemId, quantity: 1 });
    }
    
    console.log(`Bought ${itemId} for ${price} gold`);
    
    // Update displays
    const merchantGoldEl = document.getElementById('merchant-gold');
    if (merchantGoldEl) merchantGoldEl.textContent = this.player.gold;
    this.updateMerchantItems();
    this.updateHUD();
  }
  
  sellItem(index, price) {
    const item = this.player.inventory.items[index];
    if (!item) return;
    
    // Add gold
    this.player.gold += price;
    
    // Remove item or reduce quantity
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.player.inventory.items.splice(index, 1);
    }
    
    console.log(`Sold item for ${price} gold`);
    
    // Update displays
    const merchantGoldEl = document.getElementById('merchant-gold');
    if (merchantGoldEl) merchantGoldEl.textContent = this.player.gold;
    this.updateSellItems();
    this.updateHUD();
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
      playerPos: this.systems.movement ? this.systems.movement.getPosition() : 0,
      playerLevel: this.player ? this.player.level : 1,
      gameTime: Math.floor(this.state.gameTime)
    };
  }
}