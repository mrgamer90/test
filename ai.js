export class AI {
  constructor(game) {
    this.game = game;
    this.updateInterval = 1000; // AI makes decisions every second
    this.lastUpdate = 0;
    this.currentStrategy = 'Analyzing';
    this.strategies = ['Expand', 'Fortify', 'Attack Weak', 'Opportunistic'];
  }
      
  update(deltaTime) {
    this.lastUpdate += deltaTime;
        
    if (this.lastUpdate >= this.updateInterval) {
      this.makeDecisions();
      this.lastUpdate = 0;
    }
  }
      
  makeDecisions() {
    // Only control AI players (not human player at index 0)
    for (let i = 1; i < this.game.players.length; i++) {
      const player = this.game.players[i];
      if (player.territories.length > 0) {
        this.executeStrategy(player);
      }
    }
  }
      
  executeStrategy(player) {
    const strategy = this.selectStrategy(player);
    this.currentStrategy = strategy;
        
    switch (strategy) {
      case 'Expand':
        this.expandStrategy(player);
        break;
      case 'Fortify':
        this.fortifyStrategy(player);
        break;
      case 'Attack Weak':
        this.attackWeakStrategy(player);
        break;
      case 'Opportunistic':
        this.opportunisticStrategy(player);
        break;
    }
  }
      
  selectStrategy(player) {
    const territoryCount = player.territories.length;
    const totalArmy = player.army;
    const averageArmyPerTerritory = totalArmy / territoryCount;
        
    // Analyze threats and opportunities
    const threats = this.analyzeThreatLevel(player);
    const opportunities = this.findOpportunities(player);
        
    if (threats.high > 0) {
      return 'Fortify';
    } else if (opportunities.length > 0 && averageArmyPerTerritory > 5) {
      return 'Opportunistic';
    } else if (territoryCount < 10) {
      return 'Expand';
    } else {
      return 'Attack Weak';
    }
  }
      
  expandStrategy(player) {
    // Find neutral territories adjacent to player's territories
    const expansionTargets = this.findExpansionTargets(player);
        
    if (expansionTargets.length > 0) {
      const bestTarget = this.selectBestExpansionTarget(expansionTargets, player);
      if (bestTarget) {
        this.executeAttack(bestTarget.attacker, bestTarget.target);
      }
    }
  }
      
  fortifyStrategy(player) {
    // Strengthen territories that are under threat
    const threatenedTerritories = this.findThreatenedTerritories(player);
        
    for (const territory of threatenedTerritories) {
      const supporters = this.findSupporterTerritories(territory, player);
      if (supporters.length > 0) {
        // Transfer army from strongest supporter
        const strongestSupporter = supporters.reduce((a, b) => 
          a.army > b.army ? a : b
        );
            
        if (strongestSupporter.army > territory.army + 5) {
          this.transferArmy(strongestSupporter, territory);
        }
      }
    }
  }
      
  attackWeakStrategy(player) {
    // Find weak enemy territories that can be conquered
    const weakTargets = this.findWeakTargets(player);
        
    if (weakTargets.length > 0) {
      const bestAttack = this.selectBestAttack(weakTargets);
      if (bestAttack) {
        this.executeAttack(bestAttack.attacker, bestAttack.target);
      }
    }
  }
      
  opportunisticStrategy(player) {
    // Look for high-value targets or strategic positions
    const strategicTargets = this.findStrategicTargets(player);
        
    if (strategicTargets.length > 0) {
      const bestOpportunity = this.evaluateOpportunities(strategicTargets, player);
      if (bestOpportunity) {
        this.executeAttack(bestOpportunity.attacker, bestOpportunity.target);
      }
    }
  }
      
  findExpansionTargets(player) {
    const targets = [];
        
    for (const territory of player.territories) {
      for (const neighbor of territory.neighbors) {
        if (!neighbor.owner && territory.army > 2) {
          targets.push({
            attacker: territory,
            target: neighbor,
            cost: neighbor.army,
            value: this.calculateTerritoryValue(neighbor)
          });
        }
      }
    }
        
    return targets;
  }
      
  findWeakTargets(player) {
    const targets = [];
        
    for (const territory of player.territories) {
      for (const neighbor of territory.neighbors) {
        if (neighbor.owner && neighbor.owner !== player) {
          const attackPower = Math.floor(territory.army * 0.8);
          if (attackPower > neighbor.army && territory.army > 3) {
            targets.push({
              attacker: territory,
              target: neighbor,
              successChance: attackPower / neighbor.army,
              value: this.calculateTerritoryValue(neighbor)
            });
          }
        }
      }
    }
        
    return targets;
  }
      
  findStrategicTargets(player) {
    const targets = [];
        
    for (const territory of player.territories) {
      for (const neighbor of territory.neighbors) {
        if (neighbor.owner && neighbor.owner !== player) {
          const strategicValue = this.calculateStrategicValue(neighbor, player);
          const attackPower = Math.floor(territory.army * 0.8);
              
          if (attackPower > neighbor.army * 0.7 && strategicValue > 5) {
            targets.push({
              attacker: territory,
              target: neighbor,
              strategicValue: strategicValue,
              successChance: attackPower / neighbor.army
            });
          }
        }
      }
    }
        
    return targets;
  }
      
  calculateTerritoryValue(territory) {
    let value = 1;
        
    // Value increases with number of connections
    value += territory.neighbors.length * 0.5;
        
    // Value increases if it's neutral (easier to capture)
    if (!territory.owner) {
      value += 2;
    }
        
    // Value increases based on position (center of map is more valuable)
    const centerX = this.game.width / 2;
    const centerY = this.game.height / 2;
    const distanceFromCenter = Math.sqrt(
      (territory.x - centerX) ** 2 + (territory.y - centerY) ** 2
    );
    const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
    value += (1 - distanceFromCenter / maxDistance) * 2;
        
    return value;
  }
      
  calculateStrategicValue(territory, player) {
    let value = this.calculateTerritoryValue(territory);
        
    // Higher value if it connects player's territories
    const ownedNeighbors = territory.neighbors.filter(n => 
      n.owner === player
    ).length;
    value += ownedNeighbors * 2;
        
    // Higher value if it's a chokepoint
    const neutralNeighbors = territory.neighbors.filter(n => !n.owner).length;
    value += neutralNeighbors;
        
    return value;
  }
      
  analyzeThreatLevel(player) {
    let highThreats = 0;
    let mediumThreats = 0;
        
    for (const territory of player.territories) {
      for (const neighbor of territory.neighbors) {
        if (neighbor.owner && neighbor.owner !== player) {
          const enemyAttackPower = Math.floor(neighbor.army * 0.8);
          if (enemyAttackPower > territory.army) {
            highThreats++;
          } else if (enemyAttackPower > territory.army * 0.7) {
            mediumThreats++;
          }
        }
      }
    }
        
    return { high: highThreats, medium: mediumThreats };
  }
      
  findOpportunities(player) {
    const opportunities = [];
        
    for (const territory of player.territories) {
      if (territory.army > 5) {
        const weakNeighbors = territory.neighbors.filter(n => 
          n.owner && n.owner !== player && n.army < territory.army * 0.6
        );
            
        opportunities.push(...weakNeighbors.map(target => ({
          attacker: territory,
          target: target
        })));
      }
    }
        
    return opportunities;
  }
      
  selectBestExpansionTarget(targets, player) {
    return targets.reduce((best, current) => {
      const currentScore = current.value / (current.cost + 1);
      const bestScore = best ? best.value / (best.cost + 1) : 0;
      return currentScore > bestScore ? current : best;
    }, null);
  }
      
  selectBestAttack(targets) {
    return targets.reduce((best, current) => {
      const currentScore = current.successChance * current.value;
      const bestScore = best ? best.successChance * best.value : 0;
      return currentScore > bestScore ? current : best;
    }, null);
  }
      
  evaluateOpportunities(targets, player) {
    return targets.reduce((best, current) => {
      const currentScore = current.strategicValue * current.successChance;
      const bestScore = best ? best.strategicValue * best.successChance : 0;
      return currentScore > bestScore ? current : best;
    }, null);
  }
      
  executeAttack(attacker, target) {
    this.game.attackTerritory(attacker, target);
  }
      
  transferArmy(from, to) {
    const transferAmount = Math.floor((from.army - to.army) / 2);
    if (transferAmount > 0) {
      from.army -= transferAmount;
      to.army += transferAmount;
    }
  }
      
  findThreatenedTerritories(player) {
    return player.territories.filter(territory => {
      return territory.neighbors.some(neighbor => 
        neighbor.owner && 
        neighbor.owner !== player && 
        Math.floor(neighbor.army * 0.8) > territory.army
      );
    });
  }
      
  findSupporterTerritories(territory, player) {
    return territory.neighbors.filter(neighbor => 
      neighbor.owner === player && neighbor.army > territory.army + 2
    );
  }
}
