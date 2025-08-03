// src/core/EventBus.js - Simple event system for decoupled communication
export default class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
  }

  clear() {
    this.events = {};
  }
}