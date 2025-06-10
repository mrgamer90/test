export class Game {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.territories = [];
    this.players = [];
    this.selectedTerritory = null;
    this.targetTerritory = null;
        
    this.initializeGame();
  }
      
  initializeGame() {
    // Create human player
    this.players.push(new Player(0, '#4CAF50', 'Human'));
        
    // Create AI players
    this.players.push(new Player(1, '#ff6b6b', 'AI Red'));
    this.players.push(new Player(2, '#6b9bff', 'AI Blue'));
    this.players.push(new Player(3, '#ffd93d', 'AI Yellow'));
    this.players.push(new Player(4, '#ff6bff', 'AI Purple'));
        
    // Generate territories
    this.generateTerritories();
        
    // Assign starting territories
    this.assignStartingTerritories();
  }
      
  generateTerritories() {
    const territoryCount = 50;
    const minDistance = 60;
        
    for (let i = 0; i < territoryCount; i++) {
      let x, y;
      let validPosition = false;
      let attempts = 0;
          
      while (!validPosition && attempts < 100) {
        x = Math.random() * (this.width - 100) + 50;
        y = Math.random() * (this.height - 100) + 50;
            
        validPosition = true;
        for (const territory of this.territories) {
          const distance = Math.sqrt((x - territory.x) ** 2 + (y - territory.y) ** 2);
          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }
        attempts++;
      }
          
      if (validPosition) {
        this.territories.push(new Territory(i, x, y));
      }
    }
        
    // Calculate neighbors
    this.calculateNeighbors();
  }
      
  calculateNeighbors() {
    const maxDistance = 120;
        
    for (const territory of this.territories) {
      territory.neighbors = [];
      for (const other of this.territories) {
        if (territory !== other) {
          const distance = Math.sqrt(
            (territory.x - other.x) ** 2 + (territory.y - other.y) ** 2
          );
          if (distance <= maxDistance) {
            territory.neighbors.push(other);
          }
        }
      }
    }
  }
      
  assignStartingTerritories() {
    const shuffled = [...this.territories].sort(() => Math.random() - 0.5);
        
    for (let i = 0; i < this.players.length; i++) {
      if (shuffled[i]) {
        this.assignTerritory(shuffled[i], this.players[i]);
        shuffled[i].army = 10;
      }
    }
  }
      
  assignTerritory(territory, player) {
    if (territory.owner) {
      territory.owner.territories = territory.owner.territories.filter(t => t !== territory);
    }
        
    territory.owner = player;
    player.territories.push(territory);
  }
      
  handleClick(x, y) {
    const clickedTerritory = this.getTerritoryAt(x, y);
        
    if (!clickedTerritory) return;
        
    if (!this.selectedTerritory) {
      if (clickedTerritory.owner === this.players[0]) {
        this.selectedTerritory = clickedTerritory;
      }
    } else {
      if (clickedTerritory === this.selectedTerritory) {
        this.selectedTerritory = null;
      } else if (this.selectedTerritory.neighbors.includes(clickedTerritory)) {
        this.attackTerritory(this.selectedTerritory, clickedTerritory);
        this.selectedTerritory = null;
      } else {
        this.selectedTerritory = clickedTerritory.owner === this.players[0] ? clickedTerritory : null;
      }
    }
  }
      
  getTerritoryAt(x, y) {
    for (const territory of this.territories) {
      const distance = Math.sqrt((x - territory.x) ** 2 + (y - territory.y) ** 2);
      if (distance <= territory.radius) {
        return territory;
      }
    }
    return null;
  }
      
  attackTerritory(attacker, target) {
    if (attacker.army <= 1) return;
        
    const attackPower = Math.floor(attacker.army * 0.8);
    const defensePower = target.army;
        
    if (attackPower > defensePower) {
      // Successful attack
      this.assignTerritory(target, attacker.owner);
      target.army = attackPower - defensePower;
      attacker.army = Math.ceil(attacker.army * 0.2);
    } else {
      // Failed attack
      target.army = defensePower - attackPower;
      attacker.army = Math.ceil(attacker.army * 0.2);
    }
  }
      
  update(deltaTime) {
    // Generate income for all territories
    for (const territory of this.territories) {
      if (territory.owner) {
        territory.army += deltaTime / 1000; // 1 army per second
      }
    }
        
    // Update players
    for (const player of this.players) {
      player.update();
    }
  }
      
  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
  }
}

class Player {
  constructor(id, color, name) {
    this.id = id;
    this.color = color;
    this.name = name;
    this.territories = [];
    this.army = 0;
  }
      
  update() {
    this.army = this.territories.reduce((total, territory) => total + territory.army, 0);
  }
}

class Territory {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.army = 1;
    this.owner = null;
    this.neighbors = [];
  }
}
