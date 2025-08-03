// src/entities/NPC.js - Base NPC class
export default class NPC {
  constructor(name, type, x, zone, img, maxHp = 100, defeated = false, respawnChance = 0.5) {
    this.id = `${name}_${zone}_${x}`; // Unique ID
    this.name = name;
    this.type = type; // 'enemy', 'friendly', 'merchant', 'quest'
    this.x = x;
    this.zone = zone;
    this.img = img;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.defeated = defeated;
    this.respawnChance = respawnChance;
    this.respawnAt = null;
    
    // Combat stats for enemies
    if (this.type === 'enemy') {
      this.attack = Math.floor(maxHp / 20) + 10;
      this.defense = Math.floor(maxHp / 40) + 5;
      this.xpReward = Math.floor(maxHp / 4);
      this.goldReward = Math.floor(maxHp / 10) + 5;
    }
    
    // Dialogue for friendly NPCs
    if (this.type === 'friendly') {
      this.dialogue = this.generateDialogue();
    }
  }

  get isEnemy() {
    return this.type === 'enemy';
  }

  get isFriendly() {
    return this.type === 'friendly' || this.type === 'merchant' || this.type === 'quest';
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  generateDialogue() {
    // Default dialogues - can be overridden
    const dialogues = {
      'Boblin': [
        "Hello traveler! Welcome to our humble village.",
        "Be careful in the eastern zones, dangerous creatures lurk there!",
        "Have you visited the merchant? He has some interesting wares."
      ],
      'Kukas': [
        "The ancient dragon in zone 4 guards incredible treasures...",
        "I used to be an adventurer like you, then I took an arrow to the knee.",
        "Press 'K' if you need a quick boost. But shh, don't tell anyone!"
      ],
      'BOB': [
        "BOB IS BOB. BOB LIKES YOU.",
        "BOB KNOWS SECRET. PRESS K FOR POWER.",
        "BOB THINKS YOU STRONG. GO FIGHT BIG BOSS!"
      ]
    };
    
    return dialogues[this.name] || ["Hello there!", "Nice weather today.", "Safe travels!"];
  }

  getRandomDialogue() {
    if (!this.dialogue || this.dialogue.length === 0) return "...";
    return this.dialogue[Math.floor(Math.random() * this.dialogue.length)];
  }

  // For future quest system
  hasQuest() {
    return this.type === 'quest' && this.questId;
  }

  // For future merchant system
  getShopInventory() {
    if (this.type !== 'merchant') return null;
    
    // Example shop inventory
    return [
      { id: 'potion_hp', name: 'Health Potion', price: 50, icon: '🧪' },
      { id: 'sword_iron', name: 'Iron Sword', price: 200, icon: '⚔️' },
      { id: 'armor_leather', name: 'Leather Armor', price: 150, icon: '🛡️' }
    ];
  }
}