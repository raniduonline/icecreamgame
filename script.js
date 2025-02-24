const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const meltPercentDisplay = document.getElementById('meltPercent');
const gameOverDisplay = document.getElementById('gameOver');

// Game variables
let score = 0;
let meltTime = 100;
const maxMeltTime = 100;
const coneSize = 60;
let scoopSize = 60;
const minScoopSize = 20;
let coneX = canvas.width / 2;
let coneY = canvas.height / 2;
let coneSpeed = 5;
let sprinkles = [];
let suns = [];
const maxSprinkles = 15;
const maxSuns = 3;
let gameOver = false;

// Input handling
let keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Mobile control variables
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchControls = {
    up: false,
    down: false,
    left: false,
    right: false
};

// Canvas scaling
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth - 40; // Account for padding
    const scale = containerWidth / canvas.width;
    
    if (scale < 1) {
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = (canvas.height * scale) + 'px';
    } else {
        canvas.style.width = '';
        canvas.style.height = '';
    }
}

// Mobile controls setup
function setupMobileControls() {
    const buttons = {
        'up-btn': 'up',
        'down-btn': 'down',
        'left-btn': 'left',
        'right-btn': 'right'
    };

    for (let btnId in buttons) {
        const btn = document.getElementById(btnId);
        const direction = buttons[btnId];
        
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchControls[direction] = true;
        });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchControls[direction] = false;
        });
    }
}

// Update movement logic to include touch controls
function updatePosition() {
    if (keys.ArrowLeft || touchControls.left) coneX -= coneSpeed;
    if (keys.ArrowRight || touchControls.right) coneX += coneSpeed;
    if (keys.ArrowUp || touchControls.up) coneY -= coneSpeed;
    if (keys.ArrowDown || touchControls.down) coneY += coneSpeed;
    
    // Keep the cone within bounds
    coneX = Math.max(coneSize/2, Math.min(canvas.width - coneSize/2, coneX));
    coneY = Math.max(coneSize/2, Math.min(canvas.height - coneSize/2, coneY));
}

// Initialize mobile features
window.addEventListener('load', () => {
    resizeCanvas();
    if (isMobile) {
        setupMobileControls();
    }
});

window.addEventListener('resize', resizeCanvas);

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Update your game over handling
gameOverDisplay.addEventListener('click', resetGame);
gameOverDisplay.addEventListener('touchend', (e) => {
    e.preventDefault();
    resetGame();
});

// Sprinkle class
class Sprinkle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        this.eaten = false;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.burstTime = 0;
        this.shape = ['heart', 'star', 'circle', 'square', 'hexagon', 'rectangle', 'clover'][Math.floor(Math.random() * 7)];
    }
    update() {
        if (this.eaten) {
            this.x += this.speedX;
            this.y += this.speedY;
            this.size -= 0.5;
            this.burstTime += 1;
        }
    }
    draw() {
        if (this.size <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        switch (this.shape) {
            case 'heart':
                const s = this.size / 2;
                ctx.moveTo(0, s);
                ctx.bezierCurveTo(-s * 1.5, -s, -s, -s * 1.5, 0, -s * 2);
                ctx.bezierCurveTo(s, -s * 1.5, s * 1.5, -s, 0, s);
                break;
            case 'star':
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * this.size, -Math.sin((18 + i * 72) * Math.PI / 180) * this.size);
                    ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * this.size * 0.5, -Math.sin((54 + i * 72) * Math.PI / 180) * this.size * 0.5);
                }
                ctx.closePath();
                break;
            case 'circle':
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
                break;
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    ctx.lineTo(Math.cos(i * Math.PI / 3) * this.size / 2, Math.sin(i * Math.PI / 3) * this.size / 2);
                }
                ctx.closePath();
                break;
            case 'rectangle':
                ctx.rect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
                break;
            case 'clover':
                for (let i = 0; i < 3; i++) {
                    ctx.arc(Math.cos(i * 2 * Math.PI / 3) * this.size / 3, Math.sin(i * 2 * Math.PI / 3) * this.size / 3, this.size / 3, 0, Math.PI * 2);
                }
                break;
        }
        ctx.fill();
        ctx.closePath();
        if (this.eaten && this.burstTime < 10) {
            ctx.beginPath();
            ctx.arc(0, 0, this.burstTime * 2, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - this.burstTime / 10})`;
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Sun class with bouncing
class Sun {
    constructor() {
        this.x = Math.random() * (canvas.width - 30) + 15;
        this.y = -20; // Start above screen
        this.size = 30;
        this.speedY = 1 + Math.random() * 1; // Slower fall (1–2)
        this.speedX = (Math.random() - 0.5) * 2; // Horizontal bounce (-1 to 1)
    }
    update() {
        this.y += this.speedY; // Fall downward
        this.x += this.speedX; // Move horizontally
        // Bounce off left and right edges
        if (this.x - this.size / 2 < 0) {
            this.x = this.size / 2;
            this.speedX = -this.speedX;
        } else if (this.x + this.size / 2 > canvas.width) {
            this.x = canvas.width - this.size / 2;
            this.speedX = -this.speedX;
        }
        // Reset to top if off bottom
        if (this.y > canvas.height + this.size) {
            this.y = -20;
            this.x = Math.random() * (canvas.width - 30) + 15;
            this.speedX = (Math.random() - 0.5) * 2; // New horizontal speed
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; // Golden sun
        ctx.fill();
        // Rays
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFA500'; // Orange rays
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            ctx.moveTo(Math.cos(angle) * this.size / 2, Math.sin(angle) * this.size / 2);
            ctx.lineTo(Math.cos(angle) * this.size, Math.sin(angle) * this.size);
        }
        ctx.stroke();
        ctx.restore();
    }
}

// Spawn functions
function spawnSprinkle() {
    const x = Math.random() * (canvas.width - 20) + 10;
    const y = Math.random() * (canvas.height - 20) + 10;
    sprinkles.push(new Sprinkle(x, y));
}

function spawnSun() {
    suns.push(new Sun());
}

// Draw ice cream cone with dripping effect
function drawCone() {
    ctx.save();
    ctx.translate(coneX, coneY);
    // Draw cone
    ctx.beginPath();
    ctx.moveTo(-coneSize / 3, -coneSize / 6);
    ctx.lineTo(coneSize / 3, -coneSize / 6);
    ctx.lineTo(0, coneSize / 2);
    ctx.closePath();
    ctx.fillStyle = '#DEB887';
    ctx.fill();
    // Draw scoop
    ctx.beginPath();
    ctx.arc(0, -coneSize / 6 - scoopSize / 2, scoopSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFDAB9';
    ctx.fill();
    // Dripping effect
    if (meltTime < maxMeltTime * 0.8) {
        ctx.beginPath();
        ctx.moveTo(-scoopSize / 4, -coneSize / 6);
        ctx.quadraticCurveTo(0, coneSize / 4, scoopSize / 4, -coneSize / 6);
        ctx.fillStyle = 'rgba(255, 218, 185, 0.7)';
        ctx.fill();
    }
    ctx.restore();
}

// Game loop
function update() {
    if (gameOver) return;

    // Move cone
    updatePosition();

    // Melting mechanic (slower)
    meltTime -= 0.05;
    scoopSize = minScoopSize + (meltTime / maxMeltTime) * (60 - minScoopSize);
    const meltPercent = Math.floor((1 - meltTime / maxMeltTime) * 100);
    meltPercentDisplay.textContent = `Melted: ${meltPercent}%`;
    if (meltTime <= 0) {
        gameOver = true;
        gameOverDisplay.style.display = 'block';
    }

    // Update and check sprinkles
    sprinkles.forEach((sprinkle, index) => {
        sprinkle.update();
        if (!sprinkle.eaten) {
            const dist = Math.hypot(sprinkle.x - coneX, sprinkle.y - coneY);
            if (dist < scoopSize / 2 + sprinkle.size / 2) {
                sprinkle.eaten = true;
                score += 10;
                meltTime = Math.min(meltTime + 20, maxMeltTime);
                scoreDisplay.textContent = `Score: ${score}`;
                spawnSprinkle();
            }
        }
        if (sprinkle.size <= 0 || sprinkle.burstTime > 20) sprinkles.splice(index, 1);
    });

    // Update and check suns
    suns.forEach((sun, index) => {
        sun.update();
        const dist = Math.hypot(sun.x - coneX, sun.y - coneY);
        if (dist < scoopSize / 2 + sun.size / 2) {
            meltTime -= 20; // Melt faster on hit
            suns.splice(index, 1);
            spawnSun();
        }
        // No need to check off-screen here since update() handles reset
    });

    // Maintain counts
    while (sprinkles.length < maxSprinkles) spawnSprinkle();
    while (suns.length < maxSuns) spawnSun();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw everything
    drawCone();
    sprinkles.forEach(sprinkle => sprinkle.draw());
    suns.forEach(sun => sun.draw());

    requestAnimationFrame(update);
}

// Restart game
document.addEventListener('keydown', (e) => {
    if (gameOver && e.key === 'r') {
        score = 0;
        meltTime = maxMeltTime;
        scoopSize = 60;
        coneX = canvas.width / 2;
        coneY = canvas.height / 2;
        sprinkles = [];
        suns = [];
        for (let i = 0; i < maxSprinkles; i++) spawnSprinkle();
        for (let i = 0; i < maxSuns; i++) spawnSun();
        gameOver = false;
        gameOverDisplay.style.display = 'none';
        scoreDisplay.textContent = `Score: ${score}`;
        meltPercentDisplay.textContent = `Melted: 0%`;
        update();
    }
});

// Start the game
for (let i = 0; i < maxSprinkles; i++) spawnSprinkle();
for (let i = 0; i < maxSuns; i++) spawnSun();
update();

function resetGame() {
    score = 0;
    meltTime = maxMeltTime;
    scoopSize = 60;
    coneX = canvas.width / 2;
    coneY = canvas.height / 2;
    sprinkles = [];
    suns = [];
    for (let i = 0; i < maxSprinkles; i++) spawnSprinkle();
    for (let i = 0; i < maxSuns; i++) spawnSun();
    gameOver = false;
    gameOverDisplay.style.display = 'none';
    scoreDisplay.textContent = `Score: ${score}`;
    meltPercentDisplay.textContent = `Melted: 0%`;
    update();
}