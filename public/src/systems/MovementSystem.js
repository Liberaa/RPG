// src/systems/MovementSystem.js - Fixed movement with zone integration
export default class MovementSystem {
  constructor(game) {
    this.game = game;
    this.speed = 480;
    this.spriteWidth = 165;
    this.areaWidth = 950;
    
    // Movement state
    this.leftHeld = false;
    this.rightHeld = false;
    this.x = 100;
    
    // DOM references
    this.wrapper = document.getElementById('character-wrapper');
    this.sprite = document.getElementById('character');
    
    this.setupControls();
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      // Don't move during dialogue or battles
      if (this.game.state.inBattle || this.game.npcSystem?.currentDialogue) {
        return;
      }
      
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') {
        this.leftHeld = true;
        this.sprite?.classList.add('face-left');
      }
      if (k === 'd' || k === 'arrowright') {
        this.rightHeld = true;
        this.sprite?.classList.remove('face-left');
      }
    });

    document.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.leftHeld = false;
      if (k === 'd' || k === 'arrowright') this.rightHeld = false;
    });
  }

  update(deltaTime) {
    // Don't move during battles, cutscenes, or dialogue
    if (this.game.state.inBattle || 
        this.game.state.paused || 
        (this.game.npcSystem && this.game.npcSystem.currentDialogue)) {
      return;
    }

    let newX = this.x;
    
    // Calculate movement
    if (this.leftHeld) newX -= this.speed * deltaTime;
    if (this.rightHeld) newX += this.speed * deltaTime;

    // Check zone boundaries
    if (newX < 0) {
      // Try to go to previous zone
      const currentZone = this.game.state.currentZone;
      if (currentZone > 0) {
        const success = this.game.changeZone(currentZone - 1);
        if (success) {
          newX = this.areaWidth - this.spriteWidth;
        } else {
          newX = 0; // Blocked by zone requirements
        }
      } else {
        newX = 0; // Already at first zone
      }
    }
    
    if (newX + this.spriteWidth > this.areaWidth) {
      // Try to go to next zone
      const currentZone = this.game.state.currentZone;
      const maxZones = this.game.getMaxZones();
      if (currentZone < maxZones - 1) {
        const success = this.game.changeZone(currentZone + 1);
        if (success) {
          newX = 0;
        } else {
          newX = this.areaWidth - this.spriteWidth; // Blocked by zone requirements
        }
      } else {
        newX = this.areaWidth - this.spriteWidth; // Already at last zone
      }
    }

    this.x = newX;
    
    // Check collisions with NPCs or trigger random encounters
    this.checkInteractions();
  }

  checkInteractions() {
    // Check for NPC interactions (if NPC system exists)
    if (this.game.npcSystem) {
      const npc = this.game.npcSystem.checkNPCInteraction(this.x, this.game.state.currentZone);
      if (npc) {
        // Show interaction hint or auto-interact
        console.log(`Near NPC: ${npc.name}`);
      }
    }
    
    // Check for random encounters in dangerous zones
    if (this.game.zoneSystem) {
      const currentZone = this.game.zoneSystem.getCurrentZone();
      if (currentZone && (currentZone.type === 'dangerous' || currentZone.type === 'hostile')) {
        // Random encounter chance
        if (Math.random() < 0.005) { // 0.5% chance per frame when moving
          const enemies = this.game.zoneSystem.getZoneEnemies(this.game.state.currentZone);
          if (enemies.length > 0) {
            const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
            console.log(`Random encounter: ${randomEnemy}`);
            this.game.startBattle(randomEnemy);
          }
        }
      }
    }
  }

  render() {
    // Update character position
    if (this.wrapper) {
      this.wrapper.style.transform = `translateX(${this.x}px)`;
    }
  }

  setPosition(x) {
    this.x = Math.max(0, Math.min(x, this.areaWidth - this.spriteWidth));
  }

  getPosition() {
    return this.x;
  }

  stop() {
    this.leftHeld = false;
    this.rightHeld = false;
  }
}