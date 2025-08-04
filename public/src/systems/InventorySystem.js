// src/systems/InventorySystem.js
export default class InventorySystem {
  constructor(game) {
    this.game = game;
    this.itemDatabase = {
      // Weapons
      'rusty-sword': {
        id: 'rusty-sword',
        name: 'Rusty Sword',
        icon: '🗡️',
        type: 'weapon',
        quality: 'common',
        slot: 'weapon',
        stats: { attack: 5 },
        value: 10,
        stackable: false,
        description: 'A worn blade that has seen better days.'
      },
      'iron-sword': {
        id: 'iron-sword',
        name: 'Iron Sword',
        icon: '⚔️',
        type: 'weapon',
        quality: 'uncommon',
        slot: 'weapon',
        stats: { attack: 10, critChance: 0.02 },
        value: 50,
        stackable: false,
        description: 'A sturdy iron blade.'
      },
      'enchanted-blade': {
        id: 'enchanted-blade',
        name: 'Enchanted Blade',
        icon: '🔥',
        type: 'weapon',
        quality: 'rare',
        slot: 'weapon',
        stats: { attack: 20, critChance: 0.05, spellPower: 10 },
        value: 200,
        stackable: false,
        description: 'A blade humming with magical energy.'
      },
      
      // Armor
      'leather-armor': {
        id: 'leather-armor',
        name: 'Leather Armor',
        icon: '🦺',
        type: 'armor',
        quality: 'common',
        slot: 'armor',
        stats: { defense: 5 },
        value: 15,
        stackable: false,
        description: 'Basic leather protection.'
      },
      'chainmail': {
        id: 'chainmail',
        name: 'Chainmail',
        icon: '🛡️',
        type: 'armor',
        quality: 'uncommon',
        slot: 'armor',
        stats: { defense: 10, maxHp: 20 },
        value: 75,
        stackable: false,
        description: 'Interlocking metal rings provide solid defense.'
      },
      
      // Consumables
      'health-potion': {
        id: 'health-potion',
        name: 'Health Potion',
        icon: '🧪',
        type: 'consumable',
        quality: 'common',
        effect: { heal: 50 },
        value: 20,
        stackable: true,
        maxStack: 20,
        description: 'Restores 50 health points.'
      },
      'mana-potion': {
        id: 'mana-potion',
        name: 'Mana Potion',
        icon: '💙',
        type: 'consumable',
        quality: 'common',
        effect: { mana: 30 },
        value: 25,
        stackable: true,
        maxStack: 20,
        description: 'Restores 30 mana points.'
      },
      
      // Materials
      'wolf-pelt': {
        id: 'wolf-pelt',
        name: 'Wolf Pelt',
        icon: '🐺',
        type: 'material',
        quality: 'common',
        value: 5,
        stackable: true,
        maxStack: 50,
        description: 'A coarse wolf pelt. Used in crafting.'
      },
      'iron-ore': {
        id: 'iron-ore',
        name: 'Iron Ore',
        icon: '⛏️',
        type: 'material',
        quality: 'common',
        value: 3,
        stackable: true,
        maxStack: 100,
        description: 'Raw iron ore. Can be smelted into bars.'
      },
      
      // Quest items
      'ancient-key': {
        id: 'ancient-key',
        name: 'Ancient Key',
        icon: '🗝️',
        type: 'quest',
        quality: 'rare',
        value: 0,
        stackable: false,
        description: 'An ornate key that radiates ancient power.'
      },
      'dragon-scale': {
        id: 'dragon-scale',
        name: 'Dragon Scale',
        icon: '🐉',
        type: 'material',
        quality: 'epic',
        value: 500,
        stackable: true,
        maxStack: 10,
        description: 'A scale from an ancient dragon. Extremely rare.'
      }
    };
    
    this.tooltip = null;
    this.setupUI();
  }

  setupUI() {
    // Create tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'item-tooltip';
    document.body.appendChild(this.tooltip);
    
    // Update bag UI
    this.updateBagUI();
    
    // Add sample items for testing
    if (this.game.player.inventory.items.length === 0) {
      this.addItemToPlayer('rusty-sword', 1);
      this.addItemToPlayer('health-potion', 5);
      this.addItemToPlayer('wolf-pelt', 3);
    }
  }

  updateBagUI() {
    const bagGrid = document.getElementById('bag-grid');
    if (!bagGrid) return;
    
    const INVENTORY_SIZE = 25; // 5x5 grid
    const inventory = this.game.player.inventory.items;
    
    bagGrid.innerHTML = '';
    
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.slotIndex = i;
      
      if (inventory[i]) {
        const item = inventory[i];
        const itemData = this.itemDatabase[item.id];
        
        if (itemData) {
          slot.className = `slot ${itemData.quality}`;
          slot.innerHTML = `
            <span class="item-icon">${itemData.icon}</span>
            ${item.quantity > 1 ? `<span class="stack-count">${item.quantity}</span>` : ''}
          `;
          
          // Add event listeners
          slot.addEventListener('mouseenter', (e) => this.showItemTooltip(e, item));
          slot.addEventListener('mouseleave', () => this.hideItemTooltip());
          slot.addEventListener('click', () => this.handleItemClick(item));
          slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleItemRightClick(item);
          });
        }
      } else {
        slot.className = 'slot empty';
      }
      
      bagGrid.appendChild(slot);
    }
  }

  addItemToPlayer(itemId, quantity = 1) {
    const itemData = this.itemDatabase[itemId];
    if (!itemData) return false;
    
    const inventory = this.game.player.inventory.items;
    
    // If stackable, try to add to existing stack
    if (itemData.stackable) {
      const existingItem = inventory.find(item => item && item.id === itemId);
      if (existingItem) {
        const spaceInStack = itemData.maxStack - existingItem.quantity;
        const amountToAdd = Math.min(quantity, spaceInStack);
        existingItem.quantity += amountToAdd;
        quantity -= amountToAdd;
        
        if (quantity <= 0) {
          this.updateBagUI();
          return true;
        }
      }
    }
    
    // Add new item(s)
    while (quantity > 0 && inventory.length < this.game.player.inventory.maxSlots) {
      const amountToAdd = itemData.stackable ? Math.min(quantity, itemData.maxStack) : 1;
      inventory.push({
        id: itemId,
        quantity: amountToAdd
      });
      quantity -= amountToAdd;
    }
    
    this.updateBagUI();
    return quantity === 0; // Return true if all items were added
  }

  removeItem(item, quantity = 1) {
    const inventory = this.game.player.inventory.items;
    const index = inventory.indexOf(item);
    
    if (index === -1) return false;
    
    if (item.quantity > quantity) {
      item.quantity -= quantity;
    } else {
      inventory.splice(index, 1);
    }
    
    this.updateBagUI();
    return true;
  }

  showItemTooltip(event, item) {
    const itemData = this.itemDatabase[item.id];
    if (!itemData) return;
    
    let tooltipHTML = `
      <div class="item-name ${itemData.quality}">${itemData.name}</div>
      <div class="item-type">${this.formatItemType(itemData.type)}</div>
    `;
    
    // Add stats
    if (itemData.stats) {
      tooltipHTML += '<div class="item-stats">';
      for (const [stat, value] of Object.entries(itemData.stats)) {
        tooltipHTML += `<div>+${value} ${this.formatStatName(stat)}</div>`;
      }
      tooltipHTML += '</div>';
    }
    
    // Add effects
    if (itemData.effect) {
      tooltipHTML += '<div class="item-stats">';
      for (const [effect, value] of Object.entries(itemData.effect)) {
        tooltipHTML += `<div>Use: ${this.formatEffectText(effect, value)}</div>`;
      }
      tooltipHTML += '</div>';
    }
    
    // Add description
    if (itemData.description) {
      tooltipHTML += `<div class="item-description">"${itemData.description}"</div>`;
    }
    
    // Add value
    if (itemData.value > 0) {
      tooltipHTML += `<div class="item-value">Sell Price: ${itemData.value} gold</div>`;
    }
    
    this.tooltip.innerHTML = tooltipHTML;
    this.tooltip.classList.add('visible');
    
    // Position tooltip
    const rect = event.target.getBoundingClientRect();
    this.tooltip.style.left = rect.right + 10 + 'px';
    this.tooltip.style.top = rect.top + 'px';
  }

  hideItemTooltip() {
    this.tooltip.classList.remove('visible');
  }

  handleItemClick(item) {
    const itemData = this.itemDatabase[item.id];
    if (!itemData) return;
    
    if (itemData.type === 'consumable') {
      this.useItem(item);
    } else if (itemData.type === 'weapon' || itemData.type === 'armor') {
      this.equipItem(item);
    }
  }

  handleItemRightClick(item) {
    // Right-click to sell or destroy
    console.log('Right-clicked item:', item);
  }

  useItem(item) {
    const itemData = this.itemDatabase[item.id];
    if (!itemData || itemData.type !== 'consumable') return;
    
    // Apply effects
    if (itemData.effect.heal) {
      this.game.player.heal(itemData.effect.heal);
      console.log(`Used ${itemData.name}, healed for ${itemData.effect.heal}`);
    }
    if (itemData.effect.mana) {
      this.game.player.restoreMana(itemData.effect.mana);
      console.log(`Used ${itemData.name}, restored ${itemData.effect.mana} mana`);
    }
    
    // Remove item
    this.removeItem(item, 1);
    this.game.updateHUD();
  }

  equipItem(item) {
    const itemData = this.itemDatabase[item.id];
    if (!itemData || !itemData.slot) return;
    
    // Unequip current item in slot
    const currentEquipped = this.game.player.inventory.equipment[itemData.slot];
    if (currentEquipped) {
      this.addItemToPlayer(currentEquipped.id, 1);
    }
    
    // Equip new item
    this.game.player.inventory.equipment[itemData.slot] = {
      id: item.id
    };
    
    // Remove from inventory
    this.removeItem(item, 1);
    
    // Update player stats
    this.updatePlayerStats();
    console.log(`Equipped ${itemData.name}`);
  }

  updatePlayerStats() {
    // Recalculate player stats based on equipment
    // This would be more complex in a full implementation
    this.game.updateHUD();
  }

  formatItemType(type) {
    const types = {
      weapon: 'Weapon',
      armor: 'Armor',
      consumable: 'Consumable',
      material: 'Crafting Material',
      quest: 'Quest Item'
    };
    return types[type] || type;
  }

  formatStatName(stat) {
    const stats = {
      attack: 'Attack Power',
      defense: 'Defense',
      critChance: 'Critical Chance',
      spellPower: 'Spell Power',
      maxHp: 'Health'
    };
    return stats[stat] || stat;
  }

  formatEffectText(effect, value) {
    const effects = {
      heal: `Restores ${value} health`,
      mana: `Restores ${value} mana`
    };
    return effects[effect] || `${effect}: ${value}`;
  }

  // Generate random loot
  generateLoot(enemyLevel) {
    const lootTable = [
      { id: 'health-potion', chance: 0.3, minLevel: 1 },
      { id: 'wolf-pelt', chance: 0.2, minLevel: 1 },
      { id: 'iron-ore', chance: 0.15, minLevel: 1 },
      { id: 'iron-sword', chance: 0.05, minLevel: 5 },
      { id: 'chainmail', chance: 0.03, minLevel: 10 },
      { id: 'enchanted-blade', chance: 0.01, minLevel: 20 }
    ];
    
    const drops = [];
    
    for (const loot of lootTable) {
      if (enemyLevel >= loot.minLevel && Math.random() < loot.chance) {
        const quantity = this.itemDatabase[loot.id].stackable ? 
          Math.floor(Math.random() * 3) + 1 : 1;
        drops.push({ id: loot.id, quantity });
      }
    }
    
    return drops;
  }
}