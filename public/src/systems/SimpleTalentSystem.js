// src/systems/SimpleTalentSystem.js - A simpler, working talent system
export default class SimpleTalentSystem {
  constructor(game) {
    this.game = game;
    this.initialized = false;
    
    // Simple talent data
    this.talents = {
      'damage-boost': {
        name: 'Damage Boost',
        icon: '⚔️',
        description: '+5 Attack per rank',
        maxRank: 5,
        effect: (rank) => ({ attack: rank * 5 })
      },
      'health-boost': {
        name: 'Health Boost', 
        icon: '❤️',
        description: '+20 HP per rank',
        maxRank: 5,
        effect: (rank) => ({ maxHp: rank * 20 })
      },
      'crit-boost': {
        name: 'Critical Boost',
        icon: '💥',
        description: '+5% Crit per rank',
        maxRank: 5,
        effect: (rank) => ({ critChance: rank * 0.05 })
      }
    };
    
    // Don't initialize UI in constructor - wait for manual init
  }
  
  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Set up the talent button
    const talentBtn = document.getElementById('talent-btn');
    if (talentBtn) {
      talentBtn.addEventListener('click', () => this.toggleWindow());
    }
    
    this.updateUI();
  }
  
  toggleWindow() {
    const window = document.getElementById('talent-window');
    if (window) {
      window.classList.toggle('open');
      if (window.classList.contains('open')) {
        this.updateUI();
      }
    }
  }
  
  updateUI() {
    const window = document.getElementById('talent-window');
    if (!window) return;
    
    const player = this.game.player;
    
    let html = `
      <div class="talent-header">
        <h3>Talents</h3>
        <div class="talent-points">Points: ${player.talentPoints}</div>
      </div>
      <div class="simple-talent-list">
    `;
    
    for (const [id, talent] of Object.entries(this.talents)) {
      const currentRank = player.talents[id] || 0;
      const canLearn = player.talentPoints > 0 && currentRank < talent.maxRank;
      
      html += `
        <div class="simple-talent ${canLearn ? 'can-learn' : ''}" data-id="${id}">
          <span class="talent-icon">${talent.icon}</span>
          <div class="talent-info">
            <div class="talent-name">${talent.name}</div>
            <div class="talent-desc">${talent.description}</div>
            <div class="talent-rank">Rank: ${currentRank}/${talent.maxRank}</div>
          </div>
          ${canLearn ? '<button class="learn-btn" data-id="' + id + '">Learn</button>' : ''}
        </div>
      `;
    }
    
    html += '</div>';
    window.innerHTML = html;
    
    // Add click handlers to learn buttons
    const buttons = window.querySelectorAll('.learn-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.learnTalent(btn.dataset.id);
      });
    });
  }
  
  learnTalent(talentId) {
    const player = this.game.player;
    const talent = this.talents[talentId];
    
    if (!talent || player.talentPoints <= 0) return;
    
    const currentRank = player.talents[talentId] || 0;
    if (currentRank >= talent.maxRank) return;
    
    // Learn it!
    player.talents[talentId] = currentRank + 1;
    player.talentPoints--;
    
    console.log(`Learned ${talent.name} rank ${currentRank + 1}`);
    
    // Apply effects
    this.applyEffects();
    
    // Update UI
    this.updateUI();
    this.game.updateHUD();
  }
  
  applyEffects() {
    const player = this.game.player;
    
    // Reset to base stats
    player.stats.attack = 20;
    player.stats.maxHp = 200;
    player.stats.critChance = 0.1;
    
    // Apply talent bonuses
    for (const [id, rank] of Object.entries(player.talents)) {
      if (rank > 0 && this.talents[id]) {
        const effects = this.talents[id].effect(rank);
        for (const [stat, value] of Object.entries(effects)) {
          if (stat in player.stats) {
            player.stats[stat] += value;
          }
        }
      }
    }
    
    // Make sure current HP doesn't exceed max
    if (player.stats.hp > player.stats.maxHp) {
      player.stats.hp = player.stats.maxHp;
    }
  }
}