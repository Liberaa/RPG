// src/core/GameLoop.js - Handles the main game update/render cycle
export default class GameLoop {
  constructor(update, render, targetFPS = 60) {
    this.update = update;
    this.render = render;
    this.targetFPS = targetFPS;
    this.targetFrameTime = 1000 / targetFPS;
    
    this.isRunning = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.lastFpsUpdate = 0;
    
    // Bind the loop method
    this.loop = this.loop.bind(this);
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    // Calculate delta time in seconds
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }

    // Fixed timestep with interpolation
    this.accumulator += deltaTime;
    
    // Update at fixed timestep
    const fixedDeltaTime = this.targetFrameTime / 1000;
    while (this.accumulator >= fixedDeltaTime) {
      this.update(fixedDeltaTime);
      this.accumulator -= fixedDeltaTime;
    }

    // Render with interpolation value
    const interpolation = this.accumulator / fixedDeltaTime;
    this.render(interpolation);

    // Continue loop
    requestAnimationFrame(this.loop);
  }

  getFPS() {
    return this.fps;
  }
}