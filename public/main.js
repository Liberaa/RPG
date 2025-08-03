// main.js - Entry point that bootstraps the game
import Game from './src/core/Game.js';

// Game configuration
const config = {
  width: 950,
  height: 550,
  fps: 60,
  startingZone: 0,
  playerName: 'Artemis',
  debug: true, // Enable debug mode for development
  pauseOnBlur: true
};

// Global game instance (for debugging)
let game = null;

// Initialize the game when DOM is ready
async function init() {
  try {
    console.log('Starting game initialization...');
    
    // Show loading indicator (if you have one)
    showLoadingScreen();
    
    // Create game instance
    game = new Game(config);
    
    // Initialize game systems
    await game.initialize();
    
    // Make game globally accessible in debug mode
    if (config.debug) {
      window.game = game;
      console.log('Debug mode enabled. Access game via window.game');
    }
    
    // Hide loading screen
    hideLoadingScreen();
    
    // Start the game
    game.start();
    
    console.log('Game started successfully!');
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
    showError('Failed to load game. Please refresh the page.');
  }
}

// Loading screen functions
function showLoadingScreen() {
  // For now, just log. You can add a loading screen later
  console.log('Loading game assets...');
}

function hideLoadingScreen() {
  // Remove loading screen when ready
  console.log('Loading complete!');
}

function showError(message) {
  console.error(message);
  // You could show an error modal here
  alert(message);
}

// Start initialization when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already loaded
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
}

// Debug helpers
if (config.debug) {
  // Show FPS counter
  setInterval(() => {
    if (game && game.gameLoop) {
      const debugInfo = game.getDebugInfo();
      console.log(`FPS: ${debugInfo.fps} | Zone: ${debugInfo.zone} | Time: ${debugInfo.gameTime}s`);
    }
  }, 5000);
}