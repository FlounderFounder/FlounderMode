// Flappy Fish Game
class FlappyFishGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameContainer = null;
        this.isGameActive = false;
        this.gameStarted = false;
        this.score = 0;
        this.highScore = localStorage.getItem('flappyFishHighScore') || 0;
        
        // Game objects
        this.fish = {
            x: 100,
            y: 300,
            width: 40,
            height: 30,
            velocity: 0,
            gravity: 0.5,
            jumpPower: -8,
            rotation: 0
        };
        
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 200;
        this.pipeSpeed = 2;
        this.lastPipeTime = 0;
        this.pipeInterval = 2000; // 2 seconds
        
        // Game state
        this.gameOver = false;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.createGameContainer();
        this.createCanvas();
        this.setupEventListeners();
        this.createPlayButton();
    }
    
    createGameContainer() {
        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'flappy-fish-game';
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-game-button';
        closeButton.innerHTML = '✕';
        closeButton.title = 'Return to Dictionary';
        closeButton.addEventListener('click', () => {
            this.closeGame();
        });
        this.gameContainer.appendChild(closeButton);
        
        document.body.appendChild(this.gameContainer);
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.display = 'block';
        this.gameContainer.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }
    
    createPlayButton() {
        const playButton = document.createElement('div');
        playButton.className = 'play-button';
        playButton.title = 'Click to play Flappy Fish!';
        playButton.addEventListener('click', () => {
            this.startGame();
        });
        document.body.appendChild(playButton);
    }
    
    setupEventListeners() {
        // Click/tap to jump
        this.canvas.addEventListener('click', () => {
            if (this.gameStarted && !this.gameOver) {
                this.jump();
            }
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameStarted && !this.gameOver) {
                e.preventDefault();
                this.jump();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    startGame() {
        this.gameContainer.classList.add('active');
        this.gameStarted = true;
        this.gameOver = false;
        this.score = 0;
        this.fish.y = this.canvas.height / 2;
        this.fish.velocity = 0;
        this.pipes = [];
        this.lastPipeTime = 0;
        
        this.gameLoop();
    }
    
    jump() {
        this.fish.velocity = this.fish.jumpPower;
    }
    
    update() {
        if (this.gameOver) return;
        
        // Update fish
        this.fish.velocity += this.fish.gravity;
        this.fish.y += this.fish.velocity;
        
        // Fish rotation based on velocity
        this.fish.rotation = Math.min(Math.max(this.fish.velocity * 0.1, -0.5), 0.5);
        
        // Check ground collision
        if (this.fish.y + this.fish.height > this.canvas.height - 50) {
            this.gameOver = true;
            this.endGame();
            return;
        }
        
        // Check ceiling collision
        if (this.fish.y < 0) {
            this.fish.y = 0;
            this.fish.velocity = 0;
        }
        
        // Update pipes
        this.updatePipes();
        
        // Check pipe collisions
        this.checkCollisions();
    }
    
    updatePipes() {
        const currentTime = Date.now();
        
        // Add new pipes
        if (currentTime - this.lastPipeTime > this.pipeInterval) {
            this.addPipe();
            this.lastPipeTime = currentTime;
        }
        
        // Move pipes and remove off-screen ones
        this.pipes = this.pipes.filter(pipe => {
            pipe.x -= this.pipeSpeed;
            return pipe.x + this.pipeWidth > 0;
        });
    }
    
    addPipe() {
        const gapY = Math.random() * (this.canvas.height - this.pipeGap - 100) + 50;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: gapY,
            bottomY: gapY + this.pipeGap,
            bottomHeight: this.canvas.height - gapY - this.pipeGap,
            passed: false
        });
    }
    
    checkCollisions() {
        this.pipes.forEach(pipe => {
            // Check if fish passed the pipe
            if (!pipe.passed && this.fish.x > pipe.x + this.pipeWidth) {
                pipe.passed = true;
                this.score++;
                this.updateHighScore();
            }
            
            // Check collision with pipe
            if (this.fish.x < pipe.x + this.pipeWidth &&
                this.fish.x + this.fish.width > pipe.x) {
                
                // Check top pipe collision
                if (this.fish.y < pipe.topHeight) {
                    this.gameOver = true;
                    this.endGame();
                    return;
                }
                
                // Check bottom pipe collision
                if (this.fish.y + this.fish.height > pipe.bottomY) {
                    this.gameOver = true;
                    this.endGame();
                    return;
                }
            }
        });
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Draw pipes
        this.drawPipes();
        
        // Draw fish
        this.drawFish();
        
        // Draw UI
        this.drawUI();
        
        // Draw game over screen
        if (this.gameOver) {
            this.drawGameOverScreen();
        }
    }
    
    drawFish() {
        this.ctx.save();
        this.ctx.translate(this.fish.x + this.fish.width/2, this.fish.y + this.fish.height/2);
        this.ctx.rotate(this.fish.rotation);
        
        // Fish body
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillRect(-this.fish.width/2, -this.fish.height/2, this.fish.width, this.fish.height);
        
        // Fish tail
        this.ctx.fillStyle = '#FF5252';
        this.ctx.beginPath();
        this.ctx.moveTo(-this.fish.width/2, -this.fish.height/2);
        this.ctx.lineTo(-this.fish.width/2 - 15, 0);
        this.ctx.lineTo(-this.fish.width/2, this.fish.height/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Fish eye
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.fish.width/4, -this.fish.height/4, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(this.fish.width/4 + 2, -this.fish.height/4, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawPipes() {
        this.pipes.forEach(pipe => {
            // Top pipe
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Bottom pipe
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight);
            
            // Pipe caps
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, this.pipeWidth + 10, 20);
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 20);
        });
    }
    
    drawUI() {
        // Score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 32px "Roboto Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 50);
        
        // High score
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px "Roboto Mono", monospace';
        this.ctx.fillText(`High Score: ${this.highScore}`, 20, 80);
        
        // Instructions
        if (!this.gameStarted) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 24px "Roboto Mono", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Click or press SPACE to jump!', this.canvas.width/2, this.canvas.height/2 + 100);
        }
    }
    
    drawGameOverScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game over text
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.font = 'bold 48px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER!', this.canvas.width/2, this.canvas.height/2 - 50);
        
        // Final score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 32px "Roboto Mono", monospace';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width/2, this.canvas.height/2);
        
        // High score
        if (this.score === this.highScore && this.score > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px "Roboto Mono", monospace';
            this.ctx.fillText('NEW HIGH SCORE!', this.canvas.width/2, this.canvas.height/2 + 40);
        }
        
        // Restart instructions
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.font = 'bold 20px "Roboto Mono", monospace';
        this.ctx.fillText('Click anywhere to restart', this.canvas.width/2, this.canvas.height/2 + 80);
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyFishHighScore', this.highScore);
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        
        // Add click listener for restart
        const restartHandler = () => {
            this.canvas.removeEventListener('click', restartHandler);
            this.startGame();
        };
        
        setTimeout(() => {
            this.canvas.addEventListener('click', restartHandler);
        }, 1000);
    }
    
    gameLoop() {
        this.update();
        this.render();
        
        if (this.gameStarted) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    closeGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.gameContainer.classList.remove('active');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Notify the event manager that this event has ended
        if (window.randomEventManager) {
            window.randomEventManager.endEvent('flappy-fish');
        }
    }
    
    destroy() {
        this.closeGame();
        
        if (this.gameContainer && this.gameContainer.parentNode) {
            this.gameContainer.parentNode.removeChild(this.gameContainer);
        }
        
        // Remove play button
        const playButton = document.querySelector('.play-button');
        if (playButton && playButton.parentNode) {
            playButton.parentNode.removeChild(playButton);
        }
    }
}

// Initialize the Flappy Fish game using the random event manager
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('test-page.html')) {
        window.randomEventManager.registerEvent('flappy-fish', 0.1, () => {
            return new FlappyFishGame();
        });
    }
});
