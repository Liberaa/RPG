// main.js - Entry point that bootstraps the game (COMPLETE WORKING VERSION)
import Game from './src/core/Game.js';

// Game configuration
const config = {
  width: 950,
  height: 550,
  fps: 60,
  startingZone: 0,
  playerName: 'Artemis',
  debug: true,
  pauseOnBlur: true
};

// Global game instance
let game = null;

// Initialize the game when DOM is ready
async function init() {
  try {
    console.log('Starting game initialization...');
    
    // Create game instance
    game = new Game(config);
    
    // Initialize game systems
    await game.initialize();
    
    // Make game globally accessible
    window.game = game;
    
    // Set up global functions for HTML onclick handlers
    setupGlobalFunctions();
    
    // Start the game
    game.start();
    
    console.log('Game started successfully!');
    console.log('Available functions:', Object.keys(window).filter(k => k.includes('Quest') || k.includes('Talent') || k.includes('attack') || k.includes('flee')));
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
    alert('Failed to load game. Please refresh the page.');
  }
}

// Set up global functions for HTML elements
function setupGlobalFunctions() {
  // Make game accessible
  window.game = game;
  
  // Quest system functions
  window.acceptQuest = (questId) => {
    console.log('Global acceptQuest called:', questId);
    if (game && game.acceptQuest) {
      game.acceptQuest(questId);
    } else {
      console.error('Game or acceptQuest method not available');
    }
  };
  
  window.turnInQuest = (questId) => {
    console.log('Global turnInQuest called:', questId);
    if (game && game.turnInQuest) {
      game.turnInQuest(questId);
    } else {
      console.error('Game or turnInQuest method not available');
    }
  };
  
  window.closeDialogue = () => {
    console.log('Global closeDialogue called');
    if (game && game.closeDialogue) {
      game.closeDialogue();
    } else {
      console.error('Game or closeDialogue method not available');
    }
  };
  
  // Battle system functions
  window.attackEnemy = () => {
    console.log('Global attackEnemy called');
    if (game && game.attackEnemy) {
      game.attackEnemy();
    } else {
      console.error('Game or attackEnemy method not available');
    }
  };
  
  window.fleeBattle = () => {
    console.log('Global fleeBattle called');
    if (game && game.fleeBattle) {
      game.fleeBattle();
    } else {
      console.error('Game or fleeBattle method not available');
    }
  };
  
  // Talent system functions
  window.learnTalent = (type) => {
    console.log('Global learnTalent called:', type);
    if (game && game.learnTalent) {
      game.learnTalent(type);
    } else {
      console.error('Game or learnTalent method not available');
    }
  };
  
  // Legacy talent function for backwards compatibility
  window.spendTalentPoint = (type) => {
    console.log('Global spendTalentPoint called:', type);
    if (game && game.learnTalent) {
      game.learnTalent(type);
    } else {
      console.error('Game or learnTalent method not available');
    }
  };
  
  // UI toggle functions
  window.toggleQuestLog = () => {
    console.log('Global toggleQuestLog called');
    if (game && game.toggleQuestLog) {
      game.toggleQuestLog();
    } else {
      console.error('Game or toggleQuestLog method not available');
    }
  };
  
  console.log('All global functions set up successfully');
}

// Start initialization when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle window focus/blur for auto-pause
if (config.pauseOnBlur) {
  window.addEventListener('blur', () => {
    if (game && game.state && !game.state.paused) {
      console.log('Window lost focus - pausing game');
      game.togglePause();
    }
  });
  
  window.addEventListener('focus', () => {
    if (game && game.state && game.state.paused) {
      console.log('Window gained focus - resuming game');
      game.togglePause();
    }
  });
}

// Debug helpers
if (config.debug) {
  // Show debug info periodically
  setInterval(() => {
    if (game && game.gameLoop && game.getDebugInfo) {
      const debugInfo = game.getDebugInfo();
      if (debugInfo.fps > 0) {
        console.log(`[DEBUG] FPS: ${debugInfo.fps} | Zone: ${debugInfo.zoneName} | Level: ${debugInfo.playerLevel} | Talents: ${debugInfo.talentPoints}`);
      }
    }
  }, 10000);
}