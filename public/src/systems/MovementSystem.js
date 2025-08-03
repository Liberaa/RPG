// src/systems/MovementSystem.js - Handles all player movement and collision
export default class MovementSystem {
  constructor(game) {
    this.game = game;
    this.speed = 480;
    this.spriteWidth = 65;
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
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') {
        this.leftHeld = true;
        this.sprite.classList.add('face-left');
      }
      if (k === 'd' || k === 'arrowright') {
        this.rightHeld = true;
        this.sprite.classList.remove('face-left');
      }
    });

    document.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.leftHeld = false;
      if (k === 'd' || k === 'arrowright') this.rightHeld = false;
    });
  }

  update(deltaTime) {
    // Don't move during battles or cutscenes
    if (this.game.state.inBattle || this.game.state.paused) return;

    let newX = this.x;
    
    // Calculate movement
    if (this.leftHeld) newX -= this.speed * deltaTime;
    if (this.rightHeld) newX += this.speed * deltaTime;

    // Check zone boundaries
    if (newX < 0) {
      if (this.game.state.currentZone > 0) {
        this.game.changeZone(this.game.state.currentZone - 1);
        newX = this.areaWidth - this.spriteWidth;
      } else {
        newX = 0;
      }
    }
    
    if (newX + this.spriteWidth > this.areaWidth) {
      const maxZone = this.game.getMaxZones() - 1;
      if (this.game.state.currentZone < maxZone) {
        this.game.changeZone(this.game.state.currentZone + 1);
        newX = 0;
      } else {
        newX = this.areaWidth - this.spriteWidth;
      }
    }

    this.x = newX;
    
    // Check collisions with NPCs
    this.checkNPCCollisions();
  }

  checkNPCCollisions() {
    const npcs = this.game.getNPCsInCurrentZone();
    
    for (const npc of npcs) {
      if (npc.defeated) continue;
      
      const distance = Math.abs(npc.x - this.x);
      if (distance < 60) {
        if (npc.type === 'enemy') {
          this.game.startBattle(npc);
          return;
        } else if (npc.type === 'friendly') {
          // TODO: Start dialogue
          this.game.events.emit('npc:interact', npc);
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
    this.x = x;
  }

  getPosition() {
    return this.x;
  }

  stop() {
    this.leftHeld = false;
    this.rightHeld = false;
  }
}