// src/systems/NPCSystem.js - Enhanced NPC management with dialogue and quests
export default class NPCSystem {
  constructor(game) {
    this.game = game;
    this.npcs = this.createNPCs();
    this.currentDialogue = null;
    this.setupDialogueUI();
  }

  createNPCs() {
    return {
      // Zone 0 - Aldenhaven Village
      'elder-marcus': {
        id: 'elder-marcus',
        name: 'Elder Marcus',
        type: 'quest',
        zone: 0,
        x: 300,
        img: 'assets/elder.png',
        dialogue: {
          greeting: [
            "Welcome to Aldenhaven, young traveler!",
            "Our village has been peaceful for generations.",
            "But lately, strange things have been happening..."
          ],
          quest: {
            'welcome-to-town': {
              available: [
                "Ah, a new face! We don't get many visitors.",
                "Would you be willing to help our village?",
                "There have been wolf attacks on our livestock."
              ],
              active: [
                "How goes your task?",
                "The wolves grow bolder each day."
              ],
              complete: [
                "Excellent work! You've proven yourself capable.",
                "Here's your reward, and I have another task..."
              ]
            }
          },
          general: [
            "The ancient dragon sleeps in the mountain peaks.",
            "Long ago, heroes walked these lands.",
            "Knowledge is the greatest treasure of all."
          ]
        },
        questsAvailable: ['welcome-to-town'],
        shop: null
      },

      'blacksmith-thorin': {
        id: 'blacksmith-thorin',
        name: 'Blacksmith Thorin',
        type: 'merchant',
        zone: 0,
        x: 700,
        img: 'assets/blacksmith.png',
        dialogue: {
          greeting: [
            "Welcome to my forge!",
            "I craft the finest weapons and armor.",
            "What can I make for you today?"
          ],
          general: [
            "My grandfather forged weapons for dragon slayers.",
            "Good steel requires patience and skill.",
            "I can upgrade your equipment... for a price."
          ]
        },
        shop: {
          type: 'blacksmith',
          items: [
            { id: 'iron-sword', price: 100, stock: 5 },
            { id: 'steel-armor', price: 200, stock: 3 },
            { id: 'iron-shield', price: 75, stock: 4 },
            { id: 'weapon-upgrade-kit', price: 50, stock: 10 }
          ],
          services: ['repair', 'upgrade', 'enchant']
        }
      },

      'healer-maya': {
        id: 'healer-maya',
        name: 'Healer Maya',
        type: 'merchant',
        zone: 0,
        x: 500,
        img: 'assets/healer.png',
        dialogue: {
          greeting: [
            "Blessings upon you, child.",
            "I sense you carry wounds of both body and spirit.",
            "How may I aid you in your journey?"
          ],
          general: [
            "Nature provides all the medicine we need.",
            "A healthy spirit leads to a healthy body.",
            "The herbs in Whispering Woods are especially potent."
          ]
        },
        questsAvailable: ['herb-gathering'],
        shop: {
          type: 'healer',
          items: [
            { id: 'health-potion', price: 25, stock: 20 },
            { id: 'mana-potion', price: 30, stock: 15 },
            { id: 'antidote', price: 15, stock: 10 },
            { id: 'healing-salve', price: 40, stock: 8 }
          ]
        }
      },

      // Zone 1 - Greenwood Plains
      'farmer-bran': {
        id: 'farmer-bran',
        name: 'Farmer Bran',
        type: 'friendly',
        zone: 1,
        x: 200,
        img: 'assets/farmer.png',
        dialogue: {
          greeting: [
            "Oh my! Another traveler!",
            "These wolves have been terrible for my livestock.",
            "Please be careful out there!"
          ],
          general: [
            "The harvest was good this year, despite the troubles.",
            "My grandfather used to tell stories of great heroes.",
            "The road to the crossroads can be dangerous."
          ]
        }
      },

      // Zone 2 - Merchant's Crossroads
      'merchant-gareth': {
        id: 'merchant-gareth',
        name: 'Merchant Gareth',
        type: 'quest',
        zone: 2,
        x: 400,
        img: 'assets/merchant.png',
        dialogue: {
          greeting: [
            "Greetings, traveler! Care to see my wares?",
            "I have goods from across the realm!",
            "Business has been... challenging lately."
          ],
          quest: {
            'the-merchant-problem': {
              available: [
                "These bandit attacks are ruining trade!",
                "I'll pay handsomely for someone to deal with them.",
                "They have a camp somewhere in the dark woods."
              ],
              active: [
                "Any luck finding those bandits?",
                "The other merchants are getting nervous."
              ],
              complete: [
                "The trade routes are safe again!",
                "You've earned every coin of this reward!"
              ]
            }
          }
        },
        questsAvailable: ['the-merchant-problem'],
        shop: {
          type: 'general',
          items: [
            { id: 'travel-rations', price: 10, stock: 50 },
            { id: 'rope', price: 15, stock: 20 },
            { id: 'torch', price: 5, stock: 30 },
            { id: 'map-fragment', price: 100, stock: 1 }
          ]
        }
      },

      'tavern-keeper-mira': {
        id: 'tavern-keeper-mira',
        name: 'Tavern Keeper Mira',
        type: 'informant',
        zone: 2,
        x: 600,
        img: 'assets/tavern-keeper.png',
        dialogue: {
          greeting: [
            "Welcome to the Crossroads Tavern!",
            "What'll it be? Ale or information?",
            "I hear all the best stories here."
          ],
          general: [
            "That scholar Theron is looking for adventurers.",
            "The forest to the north has been acting strange.",
            "I wouldn't go to the Shadowlands without protection.",
            "Dragon sightings have increased recently."
          ],
          rumors: [
            "They say there's treasure in the Crystal Caverns.",
            "The Orc Chieftain has a bounty on his head.",
            "Some claim to have seen the ancient dragon flying.",
            "The Forgotten Realm is said to exist beyond reality."
          ]
        }
      },

      // Zone 3 - Whispering Woods
      'sage-elara': {
        id: 'sage-elara',
        name: 'Sage Elara',
        type: 'quest',
        zone: 3,
        x: 350,
        img: 'assets/sage.png',
        dialogue: {
          greeting: [
            "The forest spirits whisper of your coming.",
            "You carry the scent of destiny, young one.",
            "The balance of nature is in peril."
          ],
          quest: {
            'the-dark-forest': {
              available: [
                "The corruption spreads from the Dark Forest.",
                "An ancient evil stirs in the forest's heart.",
                "Only by cleansing the source can we stop it."
              ],
              active: [
                "The spirits are restless. Have you found the source?",
                "Be wary - corruption changes all it touches."
              ],
              complete: [
                "The forest breathes easier now.",
                "You have done a great service to nature itself."
              ]
            }
          }
        },
        questsAvailable: ['the-dark-forest']
      },

      // Zone 5 - Crystal Caverns
      'scholar-theron': {
        id: 'scholar-theron',
        name: 'Scholar Theron',
        type: 'quest',
        zone: 5,
        x: 300,
        img: 'assets/scholar.png',
        dialogue: {
          greeting: [
            "Fascinating! Another explorer of the depths!",
            "These crystal formations are truly remarkable.",
            "I'm researching the ancient civilizations."
          ],
          quest: {
            'lost-artifact': {
              available: [
                "I've discovered references to a powerful artifact.",
                "It's hidden somewhere deep in these caverns.",
                "The knowledge it contains could change everything!"
              ],
              active: [
                "Any sign of the artifact?",
                "The crystal guardians may be protecting it."
              ],
              complete: [
                "Incredible! This artifact is beyond my wildest dreams!",
                "The knowledge contained within... astounding!"
              ]
            }
          }
        },
        questsAvailable: ['lost-artifact']
      },

      // Zone 7 - Orc Stronghold
      'captain-rhodes': {
        id: 'captain-rhodes',
        name: 'Captain Rhodes',
        type: 'quest',
        zone: 7,
        x: 150,
        img: 'assets/captain.png',
        dialogue: {
          greeting: [
            "Soldier! What brings you to this war zone?",
            "The orcs have been more aggressive lately.",
            "We need all the help we can get!"
          ],
          quest: {
            'bounty-hunter': {
              available: [
                "There's a bounty on the Orc Chieftain's head.",
                "He's been leading raids on our supply lines.",
                "Take him down and claim your reward!"
              ],
              active: [
                "Have you found the Chieftain yet?",
                "Our scouts report increased orc activity."
              ],
              complete: [
                "The Chieftain is dead? Outstanding work!",
                "This should buy us some peace for a while."
              ]
            }
          }
        },
        questsAvailable: ['bounty-hunter']
      },

      // Zone 8 - Dragon's Peak
      'king-aldric': {
        id: 'king-aldric',
        name: 'King Aldric',
        type: 'quest',
        zone: 8,
        x: 400,
        img: 'assets/king.png',
        dialogue: {
          greeting: [
            "So, you are the hero the prophecies spoke of.",
            "The realm's fate hangs in the balance.",
            "The dragon must be stopped, whatever the cost."
          ],
          quest: {
            'dragon-awakening': {
              available: [
                "The ancient dragon has awakened from its slumber.",
                "It threatens to destroy everything we hold dear.",
                "You are our last hope, chosen one."
              ],
              active: [
                "The dragon grows stronger with each passing day.",
                "May the gods grant you strength in battle."
              ],
              complete: [
                "The dragon is slain! The realm is saved!",
                "Your name will be remembered for all eternity!"
              ]
            }
          }
        },
        questsAvailable: ['dragon-awakening']
      }
    };
  }

  setupDialogueUI() {
    const dialogueHTML = `
      <div id="dialogue-window" class="dialogue-window" style="display: none;">
        <div class="dialogue-header">
          <div class="npc-portrait">
            <img id="dialogue-npc-img" src="" alt="NPC">
          </div>
          <div class="npc-info">
            <h3 id="dialogue-npc-name"></h3>
            <div id="dialogue-npc-title"></div>
          </div>
          <button class="close-btn" onclick="game.npcSystem.closeDialogue()">&times;</button>
        </div>
        <div class="dialogue-content">
          <div id="dialogue-text"></div>
          <div id="dialogue-options"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', dialogueHTML);
  }

  startDialogue(npcId) {
    const npc = this.npcs[npcId];
    if (!npc) return;

    this.currentDialogue = npc;
    this.showDialogueWindow(npc);
    
    // Pause movement
    this.game.systems.movement.stop();
    
    // Trigger talk quest objectives
    this.game.questSystem.onNPCTalk(npc.name);
  }

  showDialogueWindow(npc) {
    const window = document.getElementById('dialogue-window');
    const npcImg = document.getElementById('dialogue-npc-img');
    const npcName = document.getElementById('dialogue-npc-name');
    const npcTitle = document.getElementById('dialogue-npc-title');
    
    npcImg.src = npc.img;
    npcName.textContent = npc.name;
    npcTitle.textContent = this.getNPCTitle(npc);
    
    window.style.display = 'block';
    
    this.showGreeting(npc);
  }

  showGreeting(npc) {
    const dialogueText = document.getElementById('dialogue-text');
    const options = document.getElementById('dialogue-options');
    
    const greeting = this.getRandomLine(npc.dialogue.greeting);
    dialogueText.textContent = greeting;
    
    // Generate dialogue options
    const optionsHTML = this.generateDialogueOptions(npc);
    options.innerHTML = optionsHTML;
  }

  generateDialogueOptions(npc) {
    let options = [];
    
    // Quest options
    if (npc.questsAvailable) {
      npc.questsAvailable.forEach(questId => {
        const questState = this.game.questSystem.questStates[questId];
        const quest = this.game.questSystem.questDatabase[questId];
        
        if (questState === 'available') {
          options.push({
            text: `"Tell me about ${quest.title}"`,
            action: `showQuest('${questId}')`
          });
        } else if (questState === 'active' && this.canCompleteQuest(questId)) {
          options.push({
            text: `"I've completed the task!" (Complete Quest)`,
            action: `completeQuest('${questId}')`
          });
        }
      });
    }
    
    // Shop option
    if (npc.shop) {
      options.push({
        text: `"Let me see your wares." (Shop)`,
        action: `openShop('${npc.id}')`
      });
    }
    
    // General talk
    options.push({
      text: `"Tell me about this area."`,
      action: `showGeneralTalk()`
    });
    
    // Rumors (for informants)
    if (npc.type === 'informant') {
      options.push({
        text: `"Any interesting rumors?"`,
        action: `showRumors()`
      });
    }
    
    // Goodbye
    options.push({
      text: `"Farewell."`,
      action: `closeDialogue()`
    });
    
    return options.map(option => 
      `<button class="dialogue-option" onclick="game.npcSystem.${option.action}">${option.text}</button>`
    ).join('');
  }

  showQuest(questId) {
    const npc = this.currentDialogue;
    const quest = this.game.questSystem.questDatabase[questId];
    const dialogueText = document.getElementById('dialogue-text');
    const options = document.getElementById('dialogue-options');
    
    const questDialogue = npc.dialogue.quest[questId].available;
    dialogueText.textContent = this.getRandomLine(questDialogue);
    
    options.innerHTML = `
      <button class="dialogue-option accept-quest" onclick="game.npcSystem.acceptQuest('${questId}')">
        "I'll help you." (Accept Quest)
      </button>
      <button class="dialogue-option" onclick="game.npcSystem.showGreeting(game.npcSystem.currentDialogue)">
        "Let me think about it."
      </button>
    `;
  }

  acceptQuest(questId) {
    const success = this.game.questSystem.startQuest(questId);
    const dialogueText = document.getElementById('dialogue-text');
    
    if (success) {
      dialogueText.textContent = "Thank you! I knew I could count on you.";
      setTimeout(() => {
        this.closeDialogue();
      }, 2000);
    } else {
      dialogueText.textContent = "I'm afraid you're not ready for this task yet.";
    }
  }

  completeQuest(questId) {
    const success = this.game.questSystem.completeQuest(questId);
    const npc = this.currentDialogue;
    const dialogueText = document.getElementById('dialogue-text');
    
    if (success) {
      const completeDialogue = npc.dialogue.quest[questId].complete;
      dialogueText.textContent = this.getRandomLine(completeDialogue);
      
      setTimeout(() => {
        this.closeDialogue();
      }, 3000);
    } else {
      dialogueText.textContent = "You haven't completed all the objectives yet.";
    }
  }

  canCompleteQuest(questId) {
    const quest = this.game.questSystem.questDatabase[questId];
    if (!quest) return false;
    
    return quest.objectives.every(obj => obj.completed);
  }

  showGeneralTalk() {
    const npc = this.currentDialogue;
    const dialogueText = document.getElementById('dialogue-text');
    const options = document.getElementById('dialogue-options');
    
    const generalLine = this.getRandomLine(npc.dialogue.general);
    dialogueText.textContent = generalLine;
    
    options.innerHTML = `
      <button class="dialogue-option" onclick="game.npcSystem.showGreeting(game.npcSystem.currentDialogue)">
        "Tell me more."
      </button>
      <button class="dialogue-option" onclick="game.npcSystem.closeDialogue()">
        "Farewell."
      </button>
    `;
  }

  showRumors() {
    const npc = this.currentDialogue;
    const dialogueText = document.getElementById('dialogue-text');
    const options = document.getElementById('dialogue-options');
    
    const rumor = this.getRandomLine(npc.dialogue.rumors);
    dialogueText.textContent = rumor;
    
    options.innerHTML = `
      <button class="dialogue-option" onclick="game.npcSystem.showRumors()">
        "Any other rumors?"
      </button>
      <button class="dialogue-option" onclick="game.npcSystem.showGreeting(game.npcSystem.currentDialogue)">
        "Back to main topics."
      </button>
      <button class="dialogue-option" onclick="game.npcSystem.closeDialogue()">
        "Thanks for the information."
      </button>
    `;
  }

  openShop(npcId) {
    const npc = this.npcs[npcId];
    if (!npc || !npc.shop) return;
    
    this.closeDialogue();
    this.game.openMerchant(npc);
  }

  closeDialogue() {
    const window = document.getElementById('dialogue-window');
    window.style.display = 'none';
    this.currentDialogue = null;
  }

  getNPCTitle(npc) {
    const titles = {
      'quest': 'Quest Giver',
      'merchant': 'Merchant',
      'friendly': 'Villager',
      'informant': 'Information Broker',
      'enemy': 'Hostile'
    };
    return titles[npc.type] || 'NPC';
  }

  getRandomLine(lines) {
    if (!lines || lines.length === 0) return "...";
    return lines[Math.floor(Math.random() * lines.length)];
  }

  // Get NPCs for current zone
  getNPCsInZone(zoneId) {
    return Object.values(this.npcs).filter(npc => npc.zone === zoneId);
  }

  // Check for NPC interactions
  checkNPCInteraction(playerX, zoneId) {
    const npcsInZone = this.getNPCsInZone(zoneId);
    
    for (const npc of npcsInZone) {
      const distance = Math.abs(npc.x - playerX);
      if (distance < 60) {
        if (npc.type !== 'enemy') {
          return npc;
        }
      }
    }
    return null;
  }

  // Update NPC states based on quest progress
  updateNPCStates() {
    Object.values(this.npcs).forEach(npc => {
      if (npc.questsAvailable) {
        npc.questsAvailable.forEach(questId => {
          const questState = this.game.questSystem.questStates[questId];
          // Could update NPC appearance or dialogue based on quest state
        });
      }
    });
  }
}