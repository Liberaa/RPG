// src/systems/QuestSystem.js - Complete quest management system
export default class QuestSystem {
  constructor(game) {
    this.game = game;
    this.questDatabase = {};
    this.questStates = {}; // Track quest completion states
    this.setupQuests();
    this.setupUI();
  }

  setupQuests() {
    this.questDatabase = {
      // Tutorial Chain
      'welcome-to-town': {
        id: 'welcome-to-town',
        title: 'Welcome to Aldenhaven',
        description: 'Talk to Elder Marcus to learn about the village.',
        type: 'talk',
        giver: 'Elder Marcus',
        zone: 0,
        objectives: [
          { id: 'talk-marcus', type: 'talk', target: 'Elder Marcus', completed: false }
        ],
        rewards: { xp: 50, gold: 10 },
        nextQuest: 'first-steps',
        isStoryQuest: true
      },

      'first-steps': {
        id: 'first-steps',
        title: 'First Steps',
        description: 'Kill 3 wolves to prove your combat skills.',
        type: 'kill',
        giver: 'Elder Marcus',
        zone: 1,
        objectives: [
          { id: 'kill-wolves', type: 'kill', target: 'Wolf', count: 3, current: 0, completed: false }
        ],
        rewards: { xp: 100, gold: 25, item: 'leather-boots' },
        nextQuest: 'the-merchant-problem',
        isStoryQuest: true
      },

      'the-merchant-problem': {
        id: 'the-merchant-problem',
        title: 'The Merchant Problem',
        description: 'Investigate the bandit attacks on trade routes.',
        type: 'investigate',
        giver: 'Merchant Gareth',
        zone: 2,
        objectives: [
          { id: 'find-clues', type: 'interact', target: 'Bandit Camp', completed: false },
          { id: 'kill-bandits', type: 'kill', target: 'Bandit', count: 5, current: 0, completed: false }
        ],
        rewards: { xp: 200, gold: 75, item: 'iron-sword' },
        nextQuest: 'the-dark-forest',
        isStoryQuest: true
      },

      'the-dark-forest': {
        id: 'the-dark-forest',
        title: 'Into the Dark Forest',
        description: 'Explore the mysterious Dark Forest and find the source of corruption.',
        type: 'explore',
        giver: 'Sage Elara',
        zone: 4,
        objectives: [
          { id: 'reach-center', type: 'location', target: 'Forest Heart', completed: false },
          { id: 'defeat-corruption', type: 'kill', target: 'Corrupted Treant', count: 1, current: 0, completed: false }
        ],
        rewards: { xp: 500, gold: 150, item: 'nature-staff' },
        nextQuest: 'dragon-awakening',
        isStoryQuest: true
      },

      'dragon-awakening': {
        id: 'dragon-awakening',
        title: 'The Dragon Awakens',
        description: 'Face the ancient dragon that threatens the realm.',
        type: 'boss',
        giver: 'King Aldric',
        zone: 8,
        objectives: [
          { id: 'defeat-dragon', type: 'kill', target: 'Ancient Dragon', count: 1, current: 0, completed: false }
        ],
        rewards: { xp: 1000, gold: 500, item: 'dragon-slayer-blade' },
        isStoryQuest: true,
        isFinalQuest: true
      },

      // Side Quests
      'herb-gathering': {
        id: 'herb-gathering',
        title: 'Herb Gathering',
        description: 'Collect healing herbs for the village healer.',
        type: 'collect',
        giver: 'Healer Maya',
        zone: 3,
        objectives: [
          { id: 'collect-herbs', type: 'collect', target: 'Healing Herb', count: 10, current: 0, completed: false }
        ],
        rewards: { xp: 75, gold: 30, item: 'health-potion' },
        repeatable: true
      },

      'lost-artifact': {
        id: 'lost-artifact',
        title: 'The Lost Artifact',
        description: 'Find the ancient artifact hidden in the Crystal Caves.',
        type: 'treasure',
        giver: 'Scholar Theron',
        zone: 6,
        objectives: [
          { id: 'find-artifact', type: 'collect', target: 'Ancient Artifact', count: 1, current: 0, completed: false }
        ],
        rewards: { xp: 300, gold: 100, item: 'mystic-amulet' },
        requirements: { level: 15 }
      },

      'bounty-hunter': {
        id: 'bounty-hunter',
        title: 'Bounty: Orc Chieftain',
        description: 'Eliminate the dangerous Orc Chieftain terrorizing travelers.',
        type: 'bounty',
        giver: 'Captain Rhodes',
        zone: 7,
        objectives: [
          { id: 'kill-chieftain', type: 'kill', target: 'Orc Chieftain', count: 1, current: 0, completed: false }
        ],
        rewards: { xp: 400, gold: 200, item: 'bounty-hunter-cloak' },
        requirements: { level: 20 }
      }
    };

    // Initialize quest states
    Object.keys(this.questDatabase).forEach(questId => {
      this.questStates[questId] = 'inactive'; // inactive, available, active, completed
    });

    // Make first quest available
    this.questStates['welcome-to-town'] = 'available';
  }

  setupUI() {
    // Create quest log UI
    const questLogHTML = `
      <div id="quest-log" class="quest-panel" style="display: none;">
        <div class="panel-header">
          <h3>📜 Quest Log</h3>
          <button class="close-btn" onclick="game.questSystem.toggleQuestLog()">&times;</button>
        </div>
        <div class="quest-tabs">
          <button class="quest-tab active" data-tab="active">Active</button>
          <button class="quest-tab" data-tab="completed">Completed</button>
          <button class="quest-tab" data-tab="available">Available</button>
        </div>
        <div class="quest-content">
          <div id="quest-list"></div>
        </div>
      </div>
    `;

    // Add quest log button
    const questButton = `
      <button id="quest-btn" onclick="game.questSystem.toggleQuestLog()">📜</button>
    `;

    // Insert into DOM
    document.body.insertAdjacentHTML('beforeend', questLogHTML);
    document.getElementById('talent-btn').insertAdjacentHTML('afterend', questButton);

    // Add quest notification area
    const questNotificationHTML = `
      <div id="quest-notifications" class="quest-notifications"></div>
    `;
    document.body.insertAdjacentHTML('beforeend', questNotificationHTML);

    // Style the quest button
    const questBtn = document.getElementById('quest-btn');
    questBtn.style.cssText = `
      position: absolute;
      right: 135px;
      bottom: 15px;
      width: 50px;
      height: 50px;
      font-size: 1.5rem;
      border: none;
      border-radius: 8px;
      background: #8B4513;
      color: white;
      cursor: pointer;
      z-index: 11;
      transition: all 0.2s;
    `;

    // Add event listeners
    document.querySelectorAll('.quest-tab').forEach(tab => {
      tab.addEventListener('click', () => this.showQuestTab(tab.dataset.tab));
    });

    this.updateQuestLog();
  }

  toggleQuestLog() {
    const questLog = document.getElementById('quest-log');
    const isVisible = questLog.style.display !== 'none';
    questLog.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      this.updateQuestLog();
    }
  }

  showQuestTab(tabName) {
    document.querySelectorAll('.quest-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    this.updateQuestLog(tabName);
  }

  updateQuestLog(activeTab = 'active') {
    const questList = document.getElementById('quest-list');
    if (!questList) return;

    const quests = Object.values(this.questDatabase).filter(quest => {
      return this.questStates[quest.id] === activeTab;
    });

    if (quests.length === 0) {
      questList.innerHTML = `<div class="empty-quests">No ${activeTab} quests</div>`;
      return;
    }

    questList.innerHTML = quests.map(quest => {
      const progress = this.getQuestProgress(quest);
      const isCompleted = this.questStates[quest.id] === 'completed';
      
      return `
        <div class="quest-item ${isCompleted ? 'completed' : ''}" data-quest="${quest.id}">
          <div class="quest-header">
            <h4>${quest.title}</h4>
            <span class="quest-type">${quest.type}</span>
          </div>
          <div class="quest-description">${quest.description}</div>
          <div class="quest-objectives">
            ${quest.objectives.map(obj => `
              <div class="objective ${obj.completed ? 'completed' : ''}">
                ${this.formatObjective(obj)}
              </div>
            `).join('')}
          </div>
          <div class="quest-rewards">
            <strong>Rewards:</strong>
            ${quest.rewards.xp ? `${quest.rewards.xp} XP ` : ''}
            ${quest.rewards.gold ? `${quest.rewards.gold} Gold ` : ''}
            ${quest.rewards.item ? `${quest.rewards.item} ` : ''}
          </div>
          ${activeTab === 'active' ? `
            <div class="quest-actions">
              <button onclick="game.questSystem.trackQuest('${quest.id}')">Track</button>
              ${!quest.isStoryQuest ? `<button onclick="game.questSystem.abandonQuest('${quest.id}')">Abandon</button>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  formatObjective(objective) {
    switch (objective.type) {
      case 'kill':
        return `Kill ${objective.target}: ${objective.current || 0}/${objective.count}`;
      case 'collect':
        return `Collect ${objective.target}: ${objective.current || 0}/${objective.count}`;
      case 'talk':
        return `Talk to ${objective.target}`;
      case 'location':
        return `Reach ${objective.target}`;
      case 'interact':
        return `Interact with ${objective.target}`;
      default:
        return objective.target;
    }
  }

  // Quest Management Methods
  startQuest(questId) {
    if (this.questStates[questId] !== 'available') return false;
    
    const quest = this.questDatabase[questId];
    if (!quest) return false;

    // Check requirements
    if (quest.requirements) {
      if (quest.requirements.level && this.game.player.level < quest.requirements.level) {
        this.showNotification(`You need to be level ${quest.requirements.level} to start this quest.`, 'warning');
        return false;
      }
    }

    this.questStates[questId] = 'active';
    this.showNotification(`Quest Started: ${quest.title}`, 'success');
    this.updateQuestLog();
    
    return true;
  }

  completeQuest(questId) {
    const quest = this.questDatabase[questId];
    if (!quest || this.questStates[questId] !== 'active') return false;

    // Check if all objectives are completed
    const allCompleted = quest.objectives.every(obj => obj.completed);
    if (!allCompleted) return false;

    // Give rewards
    if (quest.rewards.xp) {
      this.game.player.addXp(quest.rewards.xp);
    }
    if (quest.rewards.gold) {
      this.game.player.addGold(quest.rewards.gold);
    }
    if (quest.rewards.item) {
      // Add item to inventory (assuming inventory system exists)
      console.log(`Received item: ${quest.rewards.item}`);
    }

    this.questStates[questId] = 'completed';
    this.showNotification(`Quest Completed: ${quest.title}`, 'success');

    // Start next quest in chain
    if (quest.nextQuest && this.questStates[quest.nextQuest] === 'inactive') {
      this.questStates[quest.nextQuest] = 'available';
      this.showNotification(`New Quest Available: ${this.questDatabase[quest.nextQuest].title}`, 'info');
    }

    this.updateQuestLog();
    return true;
  }

  abandonQuest(questId) {
    const quest = this.questDatabase[questId];
    if (!quest || quest.isStoryQuest) return false;

    this.questStates[questId] = 'available';
    
    // Reset objectives
    quest.objectives.forEach(obj => {
      obj.completed = false;
      if (obj.current !== undefined) obj.current = 0;
    });

    this.showNotification(`Quest Abandoned: ${quest.title}`, 'warning');
    this.updateQuestLog();
    return true;
  }

  trackQuest(questId) {
    // Implementation for quest tracking UI
    this.showNotification(`Now tracking: ${this.questDatabase[questId].title}`, 'info');
  }

  // Progress Tracking
  updateObjective(questId, objectiveId, progress = 1) {
    const quest = this.questDatabase[questId];
    if (!quest || this.questStates[questId] !== 'active') return;

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective || objective.completed) return;

    if (objective.current !== undefined) {
      objective.current = Math.min(objective.current + progress, objective.count);
      if (objective.current >= objective.count) {
        objective.completed = true;
        this.showNotification(`Objective Complete: ${this.formatObjective(objective)}`, 'success');
      }
    } else {
      objective.completed = true;
      this.showNotification(`Objective Complete: ${this.formatObjective(objective)}`, 'success');
    }

    this.updateQuestLog();

    // Check if quest is complete
    if (quest.objectives.every(obj => obj.completed)) {
      this.completeQuest(questId);
    }
  }

  // Event Handlers
  onEnemyKilled(enemyName) {
    Object.values(this.questDatabase).forEach(quest => {
      if (this.questStates[quest.id] === 'active') {
        quest.objectives.forEach(objective => {
          if (objective.type === 'kill' && objective.target === enemyName && !objective.completed) {
            this.updateObjective(quest.id, objective.id, 1);
          }
        });
      }
    });
  }

  onNPCTalk(npcName) {
    Object.values(this.questDatabase).forEach(quest => {
      if (this.questStates[quest.id] === 'active') {
        quest.objectives.forEach(objective => {
          if (objective.type === 'talk' && objective.target === npcName) {
            this.updateObjective(quest.id, objective.id);
          }
        });
      }
    });
  }

  onItemCollected(itemName, amount = 1) {
    Object.values(this.questDatabase).forEach(quest => {
      if (this.questStates[quest.id] === 'active') {
        quest.objectives.forEach(objective => {
          if (objective.type === 'collect' && objective.target === itemName && !objective.completed) {
            this.updateObjective(quest.id, objective.id, amount);
          }
        });
      }
    });
  }

  onLocationReached(locationName) {
    Object.values(this.questDatabase).forEach(quest => {
      if (this.questStates[quest.id] === 'active') {
        quest.objectives.forEach(objective => {
          if (objective.type === 'location' && objective.target === locationName) {
            this.updateObjective(quest.id, objective.id);
          }
        });
      }
    });
  }

  // UI Helpers
  showNotification(message, type = 'info') {
    const notifications = document.getElementById('quest-notifications');
    const notification = document.createElement('div');
    notification.className = `quest-notification ${type}`;
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  getQuestProgress(quest) {
    const completed = quest.objectives.filter(obj => obj.completed).length;
    return `${completed}/${quest.objectives.length}`;
  }

  // Get available quests for NPCs
  getAvailableQuestsForNPC(npcName) {
    return Object.values(this.questDatabase).filter(quest => 
      quest.giver === npcName && this.questStates[quest.id] === 'available'
    );
  }

  getActiveQuestsForNPC(npcName) {
    return Object.values(this.questDatabase).filter(quest => 
      quest.giver === npcName && this.questStates[quest.id] === 'active' &&
      quest.objectives.every(obj => obj.completed)
    );
  }
}