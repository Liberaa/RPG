// src/systems/TalentSystem.js
export default class TalentSystem {
  constructor(game) {
    this.game = game;
    this.talentTrees = {
      combat: {
        name: 'Combat',
        icon: '⚔️',
        talents: [
          {
            id: 'blade-flurry',
            name: 'Blade Flurry',
            icon: '🗡️',
            maxRank: 5,
            row: 0,
            col: 0,
            description: 'Increases attack speed by {value}%',
            values: [2, 4, 6, 8, 10],
            requires: [],
            effect: (rank) => ({ attackSpeed: rank * 0.02 })
          },
          {
            id: 'critical-strike',
            name: 'Critical Strike',
            icon: '💥',
            maxRank: 5,
            row: 0,
            col: 1,
            description: 'Increases critical chance by {value}%',
            values: [3, 6, 9, 12, 15],
            requires: [],
            effect: (rank) => ({ critChance: rank * 0.03 })
          },
          {
            id: 'weapon-mastery',
            name: 'Weapon Mastery',
            icon: '⚔️',
            maxRank: 3,
            row: 1,
            col: 0,
            description: 'Increases weapon damage by {value}%',
            values: [5, 10, 15],
            requires: ['blade-flurry'],
            effect: (rank) => ({ weaponDamage: rank * 0.05 })
          },
          {
            id: 'double-strike',
            name: 'Double Strike',
            icon: '⚡',
            maxRank: 1,
            row: 2,
            col: 1,
            description: '20% chance to attack twice',
            values: [20],
            requires: ['critical-strike'],
            effect: (rank) => ({ doubleStrike: 0.2 })
          }
        ]
      },
      defense: {
        name: 'Defense',
        icon: '🛡️',
        talents: [
          {
            id: 'iron-skin',
            name: 'Iron Skin',
            icon: '🛡️',
            maxRank: 5,
            row: 0,
            col: 0,
            description: 'Reduces damage taken by {value}%',
            values: [2, 4, 6, 8, 10],
            requires: [],
            effect: (rank) => ({ damageReduction: rank * 0.02 })
          },
          {
            id: 'health-boost',
            name: 'Health Boost',
            icon: '❤️',
            maxRank: 5,
            row: 0,
            col: 1,
            description: 'Increases max health by {value}',
            values: [20, 40, 60, 80, 100],
            requires: [],
            effect: (rank) => ({ bonusHealth: rank * 20 })
          }
        ]
      },
      magic: {
        name: 'Magic',
        icon: '✨',
        talents: [
          {
            id: 'mana-pool',
            name: 'Mana Pool',
            icon: '💧',
            maxRank: 5,
            row: 0,
            col: 0,
            description: 'Increases max mana by {value}',
            values: [10, 20, 30, 40, 50],
            requires: [],
            effect: (rank) => ({ bonusMana: rank * 10 })
          },
          {
            id: 'spell-power',
            name: 'Spell Power',
            icon: '🔮',
            maxRank: 5,
            row: 0,
            col: 1,
            description: 'Increases spell damage by {value}%',
            values: [5, 10, 15, 20, 25],
            requires: [],
            effect: (rank) => ({ spellPower: rank * 0.05 })
          }
        ]
      }
    };
    
    this.selectedTree = 'combat';
    this.setupUI();
  }

  setupUI() {
    // Replace the simple talent list with a proper talent tree UI
    const talentWindow = document.getElementById('talent-window');
    if (!talentWindow) return;

    talentWindow.innerHTML = `
      <div class="talent-header">
        <h3>Talents</h3>
        <div class="talent-points">Points: <span id="talent-points">${this.game.player.talentPoints || 0}</span></div>
      </div>
      <div class="talent-tabs">
        ${Object.entries(this.talentTrees).map(([key, tree]) => `
          <button class="talent-tab ${key === this.selectedTree ? 'active' : ''}" data-tree="${key}">
            ${tree.icon} ${tree.name}
          </button>
        `).join('')}
      </div>
      <div class="talent-tree-container">
        <div id="talent-tree" class="talent-tree"></div>
      </div>
      <div class="talent-info">
        <div id="talent-tooltip" class="talent-tooltip hidden"></div>
      </div>
    `;

    // Add event listeners
    const tabs = talentWindow.querySelectorAll('.talent-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.selectedTree = tab.dataset.tree;
        this.render();
      });
    });

    this.render();
  }

  render() {
    const tree = this.talentTrees[this.selectedTree];
    const treeElement = document.getElementById('talent-tree');
    if (!treeElement) return;

    // Create a 4x6 grid for talents
    const grid = Array(4).fill(null).map(() => Array(6).fill(null));
    
    // Place talents in grid
    tree.talents.forEach(talent => {
      if (talent.row < 4 && talent.col < 6) {
        grid[talent.row][talent.col] = talent;
      }
    });

    // Render the grid
    treeElement.innerHTML = grid.map((row, rowIndex) => 
      row.map((talent, colIndex) => {
        if (!talent) {
          return '<div class="talent-slot empty"></div>';
        }
        
        const playerTalent = this.game.player.talents[talent.id] || 0;
        const canLearn = this.canLearnTalent(talent);
        const isMaxed = playerTalent >= talent.maxRank;
        
        return `
          <div class="talent-slot ${canLearn ? 'available' : 'locked'} ${isMaxed ? 'maxed' : ''}" 
               data-talent-id="${talent.id}">
            <div class="talent-icon">${talent.icon}</div>
            <div class="talent-rank">${playerTalent}/${talent.maxRank}</div>
          </div>
        `;
      }).join('')
    ).join('');

    // Update tab styles
    const tabs = document.querySelectorAll('.talent-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tree === this.selectedTree);
    });

    // Add click handlers
    const slots = treeElement.querySelectorAll('.talent-slot:not(.empty)');
    slots.forEach(slot => {
      slot.addEventListener('click', (e) => this.handleTalentClick(e));
      slot.addEventListener('mouseenter', (e) => this.showTooltip(e));
      slot.addEventListener('mouseleave', () => this.hideTooltip());
    });
  }

  canLearnTalent(talent) {
    // Check if player has points
    if (this.game.player.talentPoints <= 0) return false;
    
    // Check if already maxed
    const currentRank = this.game.player.talents[talent.id] || 0;
    if (currentRank >= talent.maxRank) return false;
    
    // Check requirements
    for (const req of talent.requires) {
      const reqRank = this.game.player.talents[req] || 0;
      const reqTalent = this.findTalent(req);
      if (!reqTalent || reqRank < reqTalent.maxRank) return false;
    }
    
    return true;
  }

  findTalent(id) {
    for (const tree of Object.values(this.talentTrees)) {
      const talent = tree.talents.find(t => t.id === id);
      if (talent) return talent;
    }
    return null;
  }

  handleTalentClick(e) {
    const talentId = e.currentTarget.dataset.talentId;
    const talent = this.findTalent(talentId);
    
    if (!talent || !this.canLearnTalent(talent)) return;
    
    // Learn the talent
    this.game.player.addTalent(talentId);
    
    // Apply effects
    this.applyTalentEffects();
    
    // Update UI
    this.render();
    document.getElementById('talent-points').textContent = this.game.player.talentPoints;
  }

  showTooltip(e) {
    const talentId = e.currentTarget.dataset.talentId;
    const talent = this.findTalent(talentId);
    if (!talent) return;
    
    const tooltip = document.getElementById('talent-tooltip');
    const currentRank = this.game.player.talents[talentId] || 0;
    const nextRank = Math.min(currentRank + 1, talent.maxRank);
    
    let description = talent.description;
    if (currentRank < talent.maxRank) {
      description = description.replace('{value}', talent.values[nextRank - 1]);
    } else {
      description = description.replace('{value}', talent.values[currentRank - 1]);
    }
    
    tooltip.innerHTML = `
      <div class="tooltip-title">${talent.name}</div>
      <div class="tooltip-rank">Rank ${currentRank}/${talent.maxRank}</div>
      <div class="tooltip-description">${description}</div>
      ${talent.requires.length > 0 ? `<div class="tooltip-requires">Requires: ${talent.requires.join(', ')}</div>` : ''}
      ${currentRank < talent.maxRank ? '<div class="tooltip-cost">Cost: 1 talent point</div>' : '<div class="tooltip-maxed">Maxed</div>'}
    `;
    
    tooltip.classList.remove('hidden');
  }

  hideTooltip() {
    const tooltip = document.getElementById('talent-tooltip');
    tooltip.classList.add('hidden');
  }

  applyTalentEffects() {
    // This would apply all talent effects to the player
    // For now, just log
    console.log('Applying talent effects...');
  }
}