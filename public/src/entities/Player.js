// src/entities/Player.js - Enhanced player class with events
import EventBus from '../core/EventBus.js';

export default class Player {
  constructor(name = 'Artemis') {
    this.name = name;
    this.events = new EventBus();
    
    // Core stats
    this.stats = {
      maxHp: 200,
      hp: 200,
      maxMp: 50,
      mp: 50,
      attack: 20,
      defense: 10,
      speed: 100,
      critChance: 0.1,
      critDamage: 1.5
    };
    
    // Level & Experience
    this.level = 1;
    this.maxLevel = 110;
    this.xp = 0;
    this.xpToNext = 100;
    
    // Resources
    this.gold = 10;
    
    // Inventory
    this.inventory = {
      items: [],
      maxSlots: 24,
      equipment: {
        weapon: null,
        armor: null,
        accessory: null
      }
    };
    
    // Talents
    this.talents = {};
    this.talentPoints = 0;
    
    // Quests
    this.quests = {
      active: [],
      completed: []
    };
    
    // Battle stats
    this.inCombat = false;
    this.combatStats = {
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      damageTaken: 0
    };
  }

  // ─── HEALTH & MANA ───────────────────────────
  takeDamage(amount) {
    const actualDamage = Math.max(0, amount - this.getDefense());
    this.stats.hp = Math.max(0, this.stats.hp - actualDamage);
    
    this.combatStats.damageTaken += actualDamage;
    this.events.emit('damage', { amount: actualDamage });
    
    if (this.stats.hp === 0) {
      this.events.emit('death');
      this.combatStats.deaths++;
    }
    
    return actualDamage;
  }

  heal(amount) {
    const oldHp = this.stats.hp;
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    const healedAmount = this.stats.hp - oldHp;
    
    if (healedAmount > 0) {
      this.events.emit('heal', { amount: healedAmount });
    }
    
    return healedAmount;
  }

  restoreMana(amount) {
    const oldMp = this.stats.mp;
    this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + amount);
    return this.stats.mp - oldMp;
  }

  // ─── EXPERIENCE & LEVELING ───────────────────
  addXp(amount) {
    if (this.level >= this.maxLevel) return;
    
    this.xp += amount;
    this.events.emit('xp:gain', { amount });

    while (this.xp >= this.xpToNext && this.level < this.maxLevel) {
      this.xp -= this.xpToNext;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.xpToNext = Math.floor(this.xpToNext * 1.15);
    
    // Increase stats
    const oldStats = { ...this.stats };
    this.stats.maxHp += 20;
    this.stats.maxMp += 5;
    this.stats.attack += 3;
    this.stats.defense += 2;
    
    // Full heal on level up
    this.stats.hp = this.stats.maxHp;
    this.stats.mp = this.stats.maxMp;
    
    // Grant talent point every 5 levels
    if (this.level % 5 === 0) {
      this.talentPoints++;
    }
    
    this.events.emit('levelup', {
      level: this.level,
      statsGained: {
        maxHp: this.stats.maxHp - oldStats.maxHp,
        maxMp: this.stats.maxMp - oldStats.maxMp,
        attack: this.stats.attack - oldStats.attack,
        defense: this.stats.defense - oldStats.defense
      }
    });
  }

  // ─── COMBAT CALCULATIONS ─────────────────────
  getAttack() {
    let attack = this.stats.attack;
    
    // Add weapon damage
    if (this.inventory.equipment.weapon) {
      attack += this.inventory.equipment.weapon.stats.attack || 0;
    }
    
    // Add talent bonuses
    // TODO: Calculate from talent system
    
    return attack;
  }

  getDefense() {
    let defense = this.stats.defense;
    
    // Add armor defense
    if (this.inventory.equipment.armor) {
      defense += this.inventory.equipment.armor.stats.defense || 0;
    }
    
    return defense;
  }

  getCritChance() {
    return this.stats.critChance;
  }

  calculateDamage() {
    let damage = this.getAttack();
    
    // Check for critical hit
    if (Math.random() < this.getCritChance()) {
      damage *= this.stats.critDamage;
      return { damage: Math.floor(damage), isCrit: true };
    }
    
    return { damage, isCrit: false };
  }

  // ─── INVENTORY MANAGEMENT ────────────────────
  addItem(item) {
    if (this.inventory.items.length >= this.inventory.maxSlots) {
      this.events.emit('inventory:full');
      return false;
    }
    
    this.inventory.items.push(item);
    this.events.emit('item:add', item);
    return true;
  }

  removeItem(itemId) {
    const index = this.inventory.items.findIndex(item => item.id === itemId);
    if (index === -1) return false;
    
    const [item] = this.inventory.items.splice(index, 1);
    this.events.emit('item:remove', item);
    return true;
  }

  equipItem(item) {
    if (!item.slot) return false;
    
    // Unequip current item in slot
    const currentEquipped = this.inventory.equipment[item.slot];
    if (currentEquipped) {
      this.addItem(currentEquipped);
    }
    
    // Equip new item
    this.inventory.equipment[item.slot] = item;
    this.removeItem(item.id);
    
    this.events.emit('item:equip', item);
    return true;
  }

  // ─── RESOURCES ───────────────────────────────
  addGold(amount) {
    this.gold += amount;
    this.events.emit('gold:gain', { amount });
  }

  spendGold(amount) {
    if (this.gold < amount) return false;
    
    this.gold -= amount;
    this.events.emit('gold:spend', { amount });
    return true;
  }

  // ─── TALENT SYSTEM ───────────────────────────
  addTalent(talentId) {
    if (this.talentPoints <= 0) return false;
    
    this.talents[talentId] = (this.talents[talentId] || 0) + 1;
    this.talentPoints--;
    
    this.events.emit('talent:learn', { talentId, rank: this.talents[talentId] });
    return true;
  }

  // ─── SAVE/LOAD ───────────────────────────────
  serialize() {
    return {
      name: this.name,
      stats: this.stats,
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      gold: this.gold,
      inventory: this.inventory,
      talents: this.talents,
      talentPoints: this.talentPoints,
      quests: this.quests,
      combatStats: this.combatStats
    };
  }

  deserialize(data) {
    Object.assign(this, data);
  }
}