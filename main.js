import { Game } from './game.js';
import { AI } from './ai.js';
import { Renderer } from './renderer.js';

class GameManager {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.game = new Game(50, 50);
    this.renderer = new Renderer(this.ctx);
    this.ai = new AI(this.game);
    this.isRunning = false;
    this.aiEnabled = false;
    this.gameSpeed = 100; // milliseconds between updates
    
    this.setupEventListeners();
    this.setupConsoleCommands();
    this.resize();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          this.toggleGame();
          break;
        case 'KeyA':
          e.preventDefault();
          this.toggleAI();
          break;
        case 'KeyR':
          e.preventDefault();
          this.resetGame();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.changeSpeed(0.8);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.changeSpeed(1.25);
          break;
      }
    });

    // UI button events
    document.getElementById('startBtn').addEventListener('click', () => this.toggleGame());
    document.getElementById('aiBtn').addEventListener('click', () => this.toggleAI());
    document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
    document.getElementById('speedSlider').addEventListener('input', (e) => {
      this.gameSpeed = parseInt(e.target.value);
      document.getElementById('speedValue').textContent = `${this.gameSpeed}ms`;
    });
  }

  setupConsoleCommands() {
    // Make game accessible from console
    window.territorialGame = {
      start: () => this.startGame(),
      stop: () => this.stopGame(),
      toggle: () => this.toggleGame(),
      enableAI: () => this.enableAI(),
      disableAI: () => this.disableAI(),
      toggleAI: () => this.toggleAI(),
      reset: () => this.resetGame(),
      setSpeed: (speed) => this.setSpeed(speed),
      getStats: () => this.getGameStats(),
      autoplay: (enable = true) => {
        if (enable) {
          this.enableAI();
          this.startGame();
          console.log('AI Autoplay enabled and game started');
        } else {
          this.disableAI();
          console.log('AI Autoplay disabled');
        }
      }
    };

    console.log('Territorial.io Console Commands Available:');
    console.log('territorialGame.autoplay() - Enable AI autoplay');
    console.log('territorialGame.autoplay(false) - Disable AI autoplay');
    console.log('territorialGame.start() - Start game');
    console.log('territorialGame.stop() - Stop game');
    console.log('territorialGame.reset() - Reset game');
    console.log('territorialGame.setSpeed(ms) - Set game speed');
    console.log('territorialGame.getStats() - Get game statistics');
  }

  resize() {
    this.canvas.width = window.innerWidth * 0.8;
    this.canvas.height = window.innerHeight * 0.7;
  }

  startGame() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop();
      this.updateUI();
      console.log('Game started');
    }
  }

  stopGame() {
    this.isRunning = false;
    this.updateUI();
    console.log('Game stopped');
  }

  toggleGame() {
    if (this.isRunning) {
      this.stopGame();
    } else {
      this.startGame();
    }
  }

  enableAI() {
    this.aiEnabled = true;
    this.updateUI();
    console.log('AI enabled - Game will play automatically');
  }

  disableAI() {
    this.aiEnabled = false;
    this.updateUI();
    console.log('AI disabled');
  }

  toggleAI() {
    if (this.aiEnabled) {
      this.disableAI();
    } else {
      this.enableAI();
    }
  }

  resetGame() {
    this.stopGame();
    this.game = new Game(50, 50);
    this.ai = new AI(this.game);
    this.render();
    this.updateUI();
    console.log('Game reset');
  }

  setSpeed(speed) {
    this.gameSpeed = Math.max(10, Math.min(1000, speed));
    document.getElementById('speedSlider').value = this.gameSpeed;
    document.getElementById('speedValue').textContent = `${this.gameSpeed}ms`;
    console.log(`Game speed set to ${this.gameSpeed}ms`);
  }

  changeSpeed(multiplier) {
    this.setSpeed(Math.round(this.gameSpeed * multiplier));
  }

  getGameStats() {
    const stats = {
      turn: this.game.turn,
      players: this.game.players.length,
      territories: this.game.map.flat().filter(cell => cell.owner !== -1).length,
      totalArmies: this.game.players.reduce((sum, p) => sum + p.armies, 0),
      aiEnabled: this.aiEnabled,
      gameRunning: this.isRunning,
      gameSpeed: this.gameSpeed
    };
    console.table(stats);
    return stats;
  }

  gameLoop() {
    if (!this.isRunning) return;

    // Update game state
    this.game.update();

    // Run AI if enabled
    if (this.aiEnabled) {
      this.ai.makeMove();
    }

    // Render
    this.render();

    // Schedule next update
    setTimeout(() => this.gameLoop(), this.gameSpeed);
  }

  render() {
    this.renderer.render(this.game);
  }

  updateUI() {
    const startBtn = document.getElementById('startBtn');
    const aiBtn = document.getElementById('aiBtn');
    
    startBtn.textContent = this.isRunning ? 'Stop' : 'Start';
    startBtn.className = this.isRunning ? 'btn btn-danger' : 'btn btn-success';
    
    aiBtn.textContent = this.aiEnabled ? 'Disable AI' : 'Enable AI';
    aiBtn.className = this.aiEnabled ? 'btn btn-warning' : 'btn btn-primary';
    
    document.getElementById('status').textContent = 
      `Turn: ${this.game.turn} | AI: ${this.aiEnabled ? 'ON' : 'OFF'} | Speed: ${this.gameSpeed}ms`;
  }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
  const gameManager = new GameManager();
  gameManager.render();
  
  // Auto-enable AI and start game for autoplay demo
  setTimeout(() => {
    console.log('Starting AI autoplay demo...');
    gameManager.enableAI();
    gameManager.startGame();
  }, 1000);
});
