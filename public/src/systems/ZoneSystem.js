// src/systems/ZoneSystem.js - Comprehensive zone and world management
export default class ZoneSystem {
  constructor(game) {
    this.game = game;
    this.currentZone = 0;
    this.zones = this.createZones();
    this.discoveredZones = new Set([0]); // Player starts knowing zone 0
    this.zoneTransitions = this.setupTransitions();
    this.environmentalEffects = {};
    
    this.setupUI();
  }

  createZones() {
    return {
      0: {
        id: 0,
        name: 'Aldenhaven Village',
        description: 'A peaceful farming village where your journey begins.',
        background: 'url(assets/bg.png)',
        music: 'village-theme.mp3',
        ambience: 'birds-chirping.mp3',
        type: 'safe', // safe, dangerous, boss, special
        levelRange: [1, 5],
        weather: 'sunny',
        timeOfDay: 'day',
        discoveryXP: 0,
        specialFeatures: ['shop', 'inn', 'blacksmith'],
        enemies: [],
        resources: ['Wheat', 'Apple', 'Wood'],
        questHub: true
      },

      1: {
        id: 1,
        name: 'Greenwood Plains',
        description: 'Rolling hills dotted with peaceful wildlife and the occasional bandit.',
        background: 'url(assets/bg1.png)',
        music: 'plains-theme.mp3',
        ambience: 'wind-grass.mp3',
        type: 'safe',
        levelRange: [3, 8],
        weather: 'clear',
        timeOfDay: 'day',
        discoveryXP: 50,
        specialFeatures: ['herb-patches'],
        enemies: ['Wolf', 'Bandit Scout'],
        resources: ['Healing Herb', 'Wolf Pelt', 'Wild Berries'],
        connections: [0, 2]
      },

      2: {
        id: 2,
        name: 'Merchant\'s Crossroads',
        description: 'A busy trading post where merchants gather and bandits lurk.',
        background: 'url(assets/bg2.png)',
        music: 'crossroads-theme.mp3',
        ambience: 'marketplace.mp3',
        type: 'neutral',
        levelRange: [5, 12],
        weather: 'partly-cloudy',
        timeOfDay: 'day',
        discoveryXP: 75,
        specialFeatures: ['merchant-stalls', 'tavern', 'notice-board'],
        enemies: ['Bandit', 'Highway Robber'],
        resources: ['Trade Goods', 'Ale', 'Information'],
        connections: [1, 3, 4]
      },

      3: {
        id: 3,
        name: 'Whispering Woods',
        description: 'Ancient woods filled with magical creatures and hidden secrets.',
        background: 'url(assets/bg3.png)',
        music: 'forest-mystery.mp3',
        ambience: 'forest-sounds.mp3',
        type: 'magical',
        levelRange: [8, 15],
        weather: 'misty',
        timeOfDay: 'twilight',
        discoveryXP: 100,
        specialFeatures: ['fairy-rings', 'ancient-trees', 'herb-garden'],
        enemies: ['Forest Spider', 'Wild Boar', 'Pixie Trickster'],
        resources: ['Magical Herbs', 'Enchanted Wood', 'Fairy Dust'],
        connections: [2, 5]
      },

      4: {
        id: 4,
        name: 'Dark Forest',
        description: 'A corrupted woodland where shadows move and evil dwells.',
        background: 'url(assets/bg4.png)',
        music: 'dark-forest.mp3',
        ambience: 'ominous-whispers.mp3',
        type: 'dangerous',
        levelRange: [12, 20],
        weather: 'stormy',
        timeOfDay: 'night',
        discoveryXP: 150,
        specialFeatures: ['corruption-pools', 'twisted-trees'],
        enemies: ['Corrupted Wolf', 'Dark Sprite', 'Corrupted Treant'],
        resources: ['Dark Crystal', 'Corrupted Wood', 'Shadow Essence'],
        connections: [2, 6],
        environmentalDamage: { type: 'corruption', damage: 2, interval: 10000 }
      },

      5: {
        id: 5,
        name: 'Crystal Caverns',
        description: 'Glittering caves filled with precious gems and dangerous creatures.',
        background: 'url(assets/crystal-caves.png)',
        music: 'cave-echoes.mp3',
        ambience: 'dripping-water.mp3',
        type: 'dungeon',
        levelRange: [15, 22],
        weather: 'none',
        timeOfDay: 'none',
        discoveryXP: 200,
        specialFeatures: ['crystal-formations', 'underground-lake'],
        enemies: ['Crystal Spider', 'Cave Troll', 'Gem Guardian'],
        resources: ['Crystal Shard', 'Precious Gems', 'Pure Water'],
        connections: [3, 7],
        lightLevel: 'dim'
      },

      6: {
        id: 6,
        name: 'Shadowlands',
        description: 'A realm between worlds where reality bends and nightmares roam.',
        background: 'url(assets/shadowlands.png)',
        music: 'nightmare-realm.mp3',
        ambience: 'ethereal-winds.mp3',
        type: 'dangerous',
        levelRange: [18, 25],
        weather: 'ethereal',
        timeOfDay: 'eternal-twilight',
        discoveryXP: 250,
        specialFeatures: ['shadow-portals', 'floating-islands'],
        enemies: ['Shadow Wraith', 'Nightmare Beast', 'Void Walker'],
        resources: ['Shadow Essence', 'Ethereal Silk', 'Void Crystal'],
        connections: [4, 8],
        environmentalDamage: { type: 'shadow', damage: 3, interval: 8000 }
      },

      7: {
        id: 7,
        name: 'Orc Stronghold',
        description: 'A fortified orcish settlement built into the mountainside.',
        background: 'url(assets/orc-stronghold.png)',
        music: 'orc-drums.mp3',
        ambience: 'forge-hammering.mp3',
        type: 'hostile',
        levelRange: [20, 28],
        weather: 'harsh',
        timeOfDay: 'day',
        discoveryXP: 300,
        specialFeatures: ['forge', 'war-drums', 'watchtowers'],
        enemies: ['Orc Warrior', 'Orc Shaman', 'Orc Chieftain'],
        resources: ['Orc Steel', 'War Paint', 'Beast Hide'],
        connections: [5, 9],
        hostilityLevel: 'aggressive'
      },

      8: {
        id: 8,
        name: 'Dragon\'s Peak',
        description: 'The highest mountain peak, lair of the ancient dragon.',
        background: 'url(assets/dragons-peak.png)',
        music: 'dragon-lair.mp3',
        ambience: 'mountain-winds.mp3',
        type: 'boss',
        levelRange: [25, 35],
        weather: 'extreme',
        timeOfDay: 'eternal-storm',
        discoveryXP: 500,
        specialFeatures: ['dragon-hoard', 'ancient-altar', 'volcanic-vents'],
        enemies: ['Dragon Whelp', 'Ancient Dragon'],
        resources: ['Dragon Scale', 'Ancient Gold', 'Dragonfire Gem'],
        connections: [6, 9],
        bossZone: true,
        environmentalDamage: { type: 'dragonfire', damage: 5, interval: 12000 }
      },

      9: {
        id: 9,
        name: 'The Forgotten Realm',
        description: 'A mysterious dimension beyond mortal understanding.',
        background: 'url(assets/forgotten-realm.png)',
        music: 'cosmic-mystery.mp3',
        ambience: 'ethereal-void.mp3',
        type: 'special',
        levelRange: [30, 50],
        weather: 'otherworldly',
        timeOfDay: 'timeless',
        discoveryXP: 1000,
        specialFeatures: ['reality-rifts', 'floating-crystals', 'time-distortions'],
        enemies: ['Cosmic Horror', 'Reality Bender', 'Ancient Guardian'],
        resources: ['Cosmic Essence', 'Time Crystal', 'Reality Fragment'],
        connections: [7, 8],
        requiresKey: 'ancient-key',
        postGameContent: true
      }
    };
  }

  setupTransitions() {
    return {
      // Define special transition requirements and effects
      4: { // Dark Forest
        requirement: 'quest-complete:the-merchant-problem',
        warningMessage: 'The path ahead looks dangerous. Are you sure you want to proceed?'
      },
      6: { // Shadowlands
        requirement: 'level:18',
        warningMessage: 'An otherworldly barrier blocks your path. You need more experience.'
      },
      8: { // Dragon's Peak
        requirement: 'quest-available:dragon-awakening',
        warningMessage: 'The dragon\'s presence is overwhelming. You need proper preparation.'
      },
      9: { // Forgotten Realm
        requirement: 'item:ancient-key',
        warningMessage: 'This realm is sealed. You need the Ancient Key to enter.'
      }
    };
  }

  setupUI() {
    // Create zone info display
    const zoneInfoHTML = `
      <div id="zone-info" class="zone-info">
        <div class="zone-name"></div>
        <div class="zone-description"></div>
        <div class="zone-level-range"></div>
      </div>
    `;

    // Create minimap
    const minimapHTML = `
      <div id="minimap" class="minimap">
        <div class="minimap-header">World Map</div>
        <div class="minimap-grid" id="minimap-grid"></div>
        <div class="minimap-legend">
          <div class="legend-item"><span class="safe"></span> Safe</div>
          <div class="legend-item"><span class="dangerous"></span> Dangerous</div>
          <div class="legend-item"><span class="boss"></span> Boss</div>
          <div class="legend-item"><span class="undiscovered"></span> Unknown</div>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', zoneInfoHTML);
    document.body.insertAdjacentHTML('beforeend', minimapHTML);

    // Add map toggle button
    const mapButton = `
      <button id="map-btn" onclick="game.zoneSystem.toggleMinimap()">🗺️</button>
    `;
    document.getElementById('quest-btn').insertAdjacentHTML('afterend', mapButton);

    this.updateZoneDisplay();
    this.createMinimap();
  }

  changeZone(newZoneId, playerX = null) {
    const newZone = this.zones[newZoneId];
    if (!newZone) return false;

    // Check transition requirements
    if (!this.canEnterZone(newZoneId)) {
      return false;
    }

    const oldZoneId = this.currentZone;
    this.currentZone = newZoneId;

    // Discover new zone
    if (!this.discoveredZones.has(newZoneId)) {
      this.discoveredZones.add(newZoneId);
      this.game.player.addXp(newZone.discoveryXP);
      this.game.questSystem.showNotification(`Discovered: ${newZone.name} (+${newZone.discoveryXP} XP)`, 'success');
      
      // Trigger discovery quest updates
      this.game.questSystem.onLocationReached(newZone.name);
    }

    // Apply zone effects
    this.applyZoneEffects(newZone);

    // Update game state
    this.game.state.currentZone = newZoneId;
    this.updateZoneDisplay();
    this.updateMinimap();

    // Emit zone change event
    this.game.events.emit('zone:change', {
      from: oldZoneId,
      to: newZoneId,
      zone: newZone
    });

    return true;
  }

  canEnterZone(zoneId) {
    const transition = this.zoneTransitions[zoneId];
    if (!transition) return true;

    const requirement = transition.requirement;
    
    if (requirement.startsWith('level:')) {
      const requiredLevel = parseInt(requirement.split(':')[1]);
      if (this.game.player.level < requiredLevel) {
        this.game.questSystem.showNotification(transition.warningMessage, 'warning');
        return false;
      }
    }
    
    if (requirement.startsWith('quest-complete:')) {
      const questId = requirement.split(':')[1];
      if (this.game.questSystem.questStates[questId] !== 'completed') {
        this.game.questSystem.showNotification(transition.warningMessage, 'warning');
        return false;
      }
    }
    
    if (requirement.startsWith('quest-available:')) {
      const questId = requirement.split(':')[1];
      if (this.game.questSystem.questStates[questId] !== 'available' && 
          this.game.questSystem.questStates[questId] !== 'active') {
        this.game.questSystem.showNotification(transition.warningMessage, 'warning');
        return false;
      }
    }
    
    if (requirement.startsWith('item:')) {
      const itemId = requirement.split(':')[1];
      const hasItem = this.game.player.inventory.items.some(item => item.id === itemId);
      if (!hasItem) {
        this.game.questSystem.showNotification(transition.warningMessage, 'warning');
        return false;
      }
    }

    return true;
  }

  applyZoneEffects(zone) {
    // Apply background and music
    this.game.gameArea.style.background = zone.background;
    this.game.gameArea.style.backgroundSize = 'cover';

    // Apply environmental damage if present
    if (zone.environmentalDamage) {
      this.startEnvironmentalDamage(zone.environmentalDamage);
    } else {
      this.stopEnvironmentalDamage();
    }

    // Apply lighting effects
    if (zone.lightLevel) {
      this.applyLightingEffect(zone.lightLevel);
    }

    // Weather effects
    this.applyWeatherEffect(zone.weather);
  }

  startEnvironmentalDamage(damageConfig) {
    this.stopEnvironmentalDamage(); // Clear any existing damage
    
    this.environmentalEffects.damageInterval = setInterval(() => {
      if (!this.game.state.inBattle) {
        const actualDamage = this.game.player.takeDamage(damageConfig.damage);
        this.game.questSystem.showNotification(
          `Environmental damage: -${actualDamage} HP (${damageConfig.type})`, 
          'warning'
        );
        this.game.updateHUD();
      }
    }, damageConfig.interval);
  }

  stopEnvironmentalDamage() {
    if (this.environmentalEffects.damageInterval) {
      clearInterval(this.environmentalEffects.damageInterval);
      this.environmentalEffects.damageInterval = null;
    }
  }

  applyLightingEffect(lightLevel) {
    const gameArea = this.game.gameArea;
    gameArea.classList.remove('dim-light', 'dark', 'bright');
    
    switch (lightLevel) {
      case 'dim':
        gameArea.classList.add('dim-light');
        break;
      case 'dark':
        gameArea.classList.add('dark');
        break;
      case 'bright':
        gameArea.classList.add('bright');
        break;
    }
  }

  applyWeatherEffect(weather) {
    // Remove existing weather effects
    document.querySelectorAll('.weather-effect').forEach(el => el.remove());
    
    switch (weather) {
      case 'rain':
        this.createRainEffect();
        break;
      case 'snow':
        this.createSnowEffect();
        break;
      case 'storm':
        this.createStormEffect();
        break;
      case 'misty':
        this.createMistEffect();
        break;
    }
  }

  createRainEffect() {
    const rainContainer = document.createElement('div');
    rainContainer.className = 'weather-effect rain-effect';
    rainContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
    `;
    
    for (let i = 0; i < 100; i++) {
      const drop = document.createElement('div');
      drop.style.cssText = `
        position: absolute;
        width: 2px;
        height: 20px;
        background: rgba(174, 194, 224, 0.6);
        left: ${Math.random() * 100}%;
        animation: rain-fall ${Math.random() * 1 + 0.5}s linear infinite;
        animation-delay: ${Math.random() * 2}s;
      `;
      rainContainer.appendChild(drop);
    }
    
    this.game.gameArea.appendChild(rainContainer);
  }

  createSnowEffect() {
    const snowContainer = document.createElement('div');
    snowContainer.className = 'weather-effect snow-effect';
    snowContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
    `;
    
    for (let i = 0; i < 50; i++) {
      const flake = document.createElement('div');
      flake.textContent = '❄';
      flake.style.cssText = `
        position: absolute;
        color: rgba(255, 255, 255, 0.8);
        left: ${Math.random() * 100}%;
        animation: snow-fall ${Math.random() * 3 + 2}s linear infinite;
        animation-delay: ${Math.random() * 3}s;
      `;
      snowContainer.appendChild(flake);
    }
    
    this.game.gameArea.appendChild(snowContainer);
  }

  createStormEffect() {
    this.createRainEffect();
    
    const lightningContainer = document.createElement('div');
    lightningContainer.className = 'weather-effect lightning-effect';
    lightningContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 6;
      background: rgba(255, 255, 255, 0);
    `;
    
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance per second
        lightningContainer.style.background = 'rgba(255, 255, 255, 0.3)';
        setTimeout(() => {
          lightningContainer.style.background = 'rgba(255, 255, 255, 0)';
        }, 100);
      }
    }, 1000);
    
    this.game.gameArea.appendChild(lightningContainer);
  }

  createMistEffect() {
    const mistContainer = document.createElement('div');
    mistContainer.className = 'weather-effect mist-effect';
    mistContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 4;
      background: radial-gradient(circle, rgba(200, 200, 200, 0.1) 0%, rgba(255, 255, 255, 0.3) 100%);
      animation: mist-flow 10s ease-in-out infinite alternate;
    `;
    
    this.game.gameArea.appendChild(mistContainer);
  }

  updateZoneDisplay() {
    const currentZone = this.zones[this.currentZone];
    const zoneInfo = document.getElementById('zone-info');
    
    if (zoneInfo && currentZone) {
      zoneInfo.querySelector('.zone-name').textContent = currentZone.name;
      zoneInfo.querySelector('.zone-description').textContent = currentZone.description;
      zoneInfo.querySelector('.zone-level-range').textContent = 
        `Recommended Level: ${currentZone.levelRange[0]}-${currentZone.levelRange[1]}`;
      
      // Show zone info briefly
      zoneInfo.classList.add('visible');
      setTimeout(() => {
        zoneInfo.classList.remove('visible');
      }, 4000);
    }
  }

  createMinimap() {
    const minimapGrid = document.getElementById('minimap-grid');
    if (!minimapGrid) return;

    // Create a 3x3 grid representation
    const gridLayout = [
      [null, 5, 7],
      [3, 2, 9],
      [0, 1, 4],
      [null, 6, 8]
    ];

    minimapGrid.innerHTML = '';
    
    gridLayout.forEach((row, rowIndex) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'minimap-row';
      
      row.forEach((zoneId, colIndex) => {
        const cell = document.createElement('div');
        cell.className = 'minimap-cell';
        
        if (zoneId !== null) {
          const zone = this.zones[zoneId];
          const discovered = this.discoveredZones.has(zoneId);
          const current = zoneId === this.currentZone;
          
          cell.className += ` ${discovered ? zone.type : 'undiscovered'}`;
          if (current) cell.className += ' current';
          
          cell.textContent = discovered ? zone.name.substring(0, 3) : '???';
          cell.title = discovered ? zone.name : 'Undiscovered';
          
          if (discovered) {
            cell.addEventListener('click', () => this.fastTravel(zoneId));
          }
        }
        
        rowEl.appendChild(cell);
      });
      
      minimapGrid.appendChild(rowEl);
    });
  }

  updateMinimap() {
    this.createMinimap(); // Recreate to update current position
  }

  toggleMinimap() {
    const minimap = document.getElementById('minimap');
    const isVisible = minimap.style.display !== 'none';
    minimap.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      this.updateMinimap();
    }
  }

  fastTravel(zoneId) {
    const zone = this.zones[zoneId];
    if (!zone || !this.discoveredZones.has(zoneId)) return;
    
    // Check if fast travel is allowed
    if (this.game.state.inBattle) {
      this.game.questSystem.showNotification('Cannot fast travel during combat!', 'warning');
      return;
    }
    
    // Cost gold for fast travel (except to adjacent zones)
    const cost = this.getFastTravelCost(zoneId);
    if (cost > 0) {
      if (this.game.player.gold < cost) {
        this.game.questSystem.showNotification(`Fast travel costs ${cost} gold!`, 'warning');
        return;
      }
      this.game.player.spendGold(cost);
      this.game.questSystem.showNotification(`Fast traveled to ${zone.name} (-${cost} gold)`, 'info');
    }
    
    this.changeZone(zoneId, 100); // Start at left side of zone
    this.game.systems.movement.setPosition(100);
    this.game.paintZone();
  }

  getFastTravelCost(targetZoneId) {
    const currentConnections = this.zones[this.currentZone].connections || [];
    if (currentConnections.includes(targetZoneId)) {
      return 0; // Free travel to adjacent zones
    }
    
    // Calculate distance-based cost
    const distance = Math.abs(targetZoneId - this.currentZone);
    return distance * 10;
  }

  getZoneEnemies(zoneId) {
    const zone = this.zones[zoneId] || this.zones[this.currentZone];
    return zone.enemies || [];
  }

  getZoneResources(zoneId) {
    const zone = this.zones[zoneId] || this.zones[this.currentZone];
    return zone.resources || [];
  }

  getCurrentZone() {
    return this.zones[this.currentZone];
  }

  // Special zone events
  triggerZoneEvent(eventType) {
    const currentZone = this.getCurrentZone();
    
    switch (eventType) {
      case 'boss-defeated':
        if (currentZone.bossZone) {
          this.game.questSystem.showNotification(`${currentZone.name} has been cleansed!`, 'success');
          // Could unlock new areas or change zone properties
        }
        break;
        
      case 'corruption-cleansed':
        if (currentZone.type === 'dangerous') {
          // Transform zone to safer version
          currentZone.type = 'safe';
          this.applyZoneEffects(currentZone);
        }
        break;
    }
  }
}