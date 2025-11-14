// Flappy Bird 游戏主逻辑
class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 游戏状态
        this.gameState = 'ready'; // ready, playing, gameOver
        this.score = 0;
        this.highScore = localStorage.getItem('flappyHighScore') || 0;
        
        // 小鸟属性
        this.bird = {
            x: 80,
            y: this.height / 2,
            width: 34,
            height: 24,
            velocity: 0,
            gravity: 0.25,
            jump: -6,
            rotation: 0
        };
        
        // 管道数组
        this.pipes = [];
        this.pipeWidth = 80;
        this.pipeGap = 150;
        this.pipeSpeed = 2;
        this.pipeSpawnRate = 90; // 每90帧生成一个管道
        
        // 地面
        this.groundHeight = 100;
        this.groundY = this.height - this.groundHeight;
        this.groundOffset = 0;
        
        // 帧计数
        this.frameCount = 0;
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化显示
        this.updateDisplay();
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    bindEvents() {
        // 点击事件
        this.canvas.addEventListener('click', () => {
            this.handleInput();
        });
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });
        
        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    handleInput() {
        switch (this.gameState) {
            case 'ready':
                this.startGame();
                break;
            case 'playing':
                this.birdJump();
                break;
            case 'gameOver':
                // 游戏结束时点击无效，需要点击重新开始按钮
                break;
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('restartBtn').style.display = 'inline-block';
        this.birdJump(); // 游戏开始时也给小鸟一个跳跃
    }
    
    birdJump() {
        this.bird.velocity = this.bird.jump;
        this.bird.rotation = -20; // 向上飞时的角度
    }
    
    resetGame() {
        // 重置游戏状态
        this.gameState = 'ready';
        this.score = 0;
        
        // 重置小鸟
        this.bird.x = 80;
        this.bird.y = this.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        
        // 清空管道
        this.pipes = [];
        
        // 重置UI
        document.getElementById('gameOverModal').style.display = 'none';
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('restartBtn').style.display = 'none';
        
        this.updateDisplay();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState === 'playing') {
            this.frameCount++;
            
            // 更新小鸟物理
            this.updateBird();
            
            // 生成新管道
            if (this.frameCount % this.pipeSpawnRate === 0) {
                this.generatePipe();
            }
            
            // 更新管道
            this.updatePipes();
            
            // 更新地面滚动
            this.groundOffset = (this.groundOffset + this.pipeSpeed) % 40;
            
            // 检查碰撞
            this.checkCollisions();
        } else if (this.gameState === 'ready') {
            // 待机状态下的小鸟动画
            this.bird.y += Math.sin(this.frameCount * 0.1) * 0.5;
            this.bird.rotation = Math.sin(this.frameCount * 0.1) * 10;
        }
    }
    
    updateBird() {
        // 应用重力
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // 根据速度调整旋转角度
        if (this.bird.velocity > 0) {
            this.bird.rotation = Math.min(this.bird.velocity * 3, 90);
        }
        
        // 地面碰撞检测
        if (this.bird.y + this.bird.height >= this.groundY) {
            this.bird.y = this.groundY - this.bird.height;
            this.gameOver();
        }
        
        // 天花板碰撞检测
        if (this.bird.y <= 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
    }
    
    generatePipe() {
        const minHeight = 50;
        const maxHeight = this.height - this.groundHeight - this.pipeGap - minHeight;
        const pipeHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.width,
            topHeight: pipeHeight,
            bottomY: pipeHeight + this.pipeGap,
            bottomHeight: this.groundHeight + this.pipeGap + minHeight - pipeHeight,
            passed: false
        });
    }
    
    updatePipes() {
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            
            // 移除离开屏幕的管道
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
                continue;
            }
            
            // 检查是否通过管道（计分）
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.updateDisplay();
            }
        }
    }
    
    checkCollisions() {
        for (const pipe of this.pipes) {
            // 检查是否与管道碰撞
            if (this.bird.x < pipe.x + this.pipeWidth &&
                this.bird.x + this.bird.width > pipe.x) {
                
                // 检查是否撞到上管道或下管道
                if (this.bird.y < pipe.topHeight ||
                    this.bird.y + this.bird.height > pipe.bottomY) {
                    this.gameOver();
                    return;
                }
            }
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyHighScore', this.highScore);
        }
        
        // 显示游戏结束弹窗
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('modalHighScore').textContent = this.highScore;
        document.getElementById('gameOverModal').style.display = 'flex';
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制背景天空
        this.drawSky();
        
        // 绘制管道
        this.drawPipes();
        
        // 绘制小鸟
        this.drawBird();
        
        // 绘制地面
        this.drawGround();
        
        // 绘制游戏状态提示
        this.drawGameState();
    }
    
    drawSky() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8E8');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height - this.groundHeight);
    }
    
    drawPipes() {
        this.ctx.fillStyle = '#27ae60';
        this.ctx.strokeStyle = '#2d3436';
        this.ctx.lineWidth = 3;
        
        for (const pipe of this.pipes) {
            // 上管道
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // 上管道帽子
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, this.pipeWidth + 10, 30);
            this.ctx.strokeRect(pipe.x - 5, pipe.topHeight - 30, this.pipeWidth + 10, 30);
            
            // 下管道
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.height - pipe.bottomY - this.groundHeight);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, this.height - pipe.bottomY - this.groundHeight);
            
            // 下管道帽子
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 30);
            this.ctx.strokeRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 30);
        }
    }
    
    drawBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(this.bird.rotation * Math.PI / 180);
        
        // 小鸟身体
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 小鸟翅膀
        this.ctx.fillStyle = '#e67e22';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, 0, 8, 6, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 小鸟眼睛
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(5, -3, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(6, -3, 2, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 小鸟嘴巴
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.width / 2 - 2, 0);
        this.ctx.lineTo(this.bird.width / 2 + 5, 2);
        this.ctx.lineTo(this.bird.width / 2 - 2, 4);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawGround() {
        // 绘制地面
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundY, this.width, this.groundHeight);
        
        // 绘制草地
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(0, this.groundY, this.width, 20);
        
        // 绘制滚动图案
        this.ctx.fillStyle = '#2ecc71';
        for (let x = -this.groundOffset; x < this.width; x += 40) {
            this.ctx.fillRect(x, this.groundY + 20, 20, 10);
        }
    }
    
    drawGameState() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        
        if (this.gameState === 'ready') {
            this.ctx.fillText('点击开始游戏!', this.width / 2, this.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('点击屏幕或按空格键让小鸟飞行', this.width / 2, this.height / 2 + 30);
        }
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new FlappyBird();
});
