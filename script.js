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
let isDragging = false;
let lastX = 0;
let lastY = 0;
let touchStartX = 0;
let touchStartY = 0;

// Mobile control variables
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchControls = {
    up: false,
    down: false,
    left: false,
    right: false
};

// Update the input handling
function initializeControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);

    // Mouse controls
    canvas.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', handleDragging);
    document.addEventListener('mouseup', stopDragging);

    // Touch controls
    canvas.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    // Mobile control buttons
    document.getElementById('up-btn').addEventListener('touchstart', () => touchControls.up = true);
    document.getElementById('down-btn').addEventListener('touchstart', () => touchControls.down = true);
    document.getElementById('left-btn').addEventListener('touchstart', () => touchControls.left = true);
    document.getElementById('right-btn').addEventListener('touchstart', () => touchControls.right = true);

    document.getElementById('up-btn').addEventListener('touchend', () => touchControls.up = false);
    document.getElementById('down-btn').addEventListener('touchend', () => touchControls.down = false);
    document.getElementById('left-btn').addEventListener('touchend', () => touchControls.left = false);
    document.getElementById('right-btn').addEventListener('touchend', () => touchControls.right = false);
}

function startDragging(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
}

function handleDragging(e) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    
    coneX += deltaX;
    coneY += deltaY;
    
    // Keep cone in bounds
    coneX = Math.max(coneSize/2, Math.min(canvas.width - coneSize/2, coneX));
    coneY = Math.max(coneSize/2, Math.min(canvas.height - coneSize/2, coneY));
    
    lastX = e.clientX;
    lastY = e.clientY;
}

function stopDragging() {
    isDragging = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    coneX += deltaX;
    coneY += deltaY;
    
    // Keep cone in bounds
    coneX = Math.max(coneSize/2, Math.min(canvas.width - coneSize/2, coneX));
    coneY = Math.max(coneSize/2, Math.min(canvas.height - coneSize/2, coneY));
    
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchEnd() {
    isDragging = false;
}

// Update the canvas size based on screen size
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth - 40; // Account for padding
    const containerHeight = window.innerHeight * 0.6; // 60% of viewport height
    
    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = canvas.width / canvas.height;
    let newWidth = containerWidth;
    let newHeight = containerWidth / aspectRatio;
    
    // If height is too large, scale based on height instead
    if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = containerHeight * aspectRatio;
    }
    
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
}

// Initialize controls and handle resize
window.addEventListener('load', () => {
    initializeControls();
    resizeCanvas();
    resetGame();
    requestAnimationFrame(update);
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

// Sprinkle class with multiple shapes
class Sprinkle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.eaten = false;
        this.burstTime = 0;
        this.shape = Math.floor(Math.random() * 4); // 0: cross, 1: star, 2: circle, 3: heart
        this.rotation = Math.random() * Math.PI * 2;
    }

    update() {
        if (this.eaten) {
            this.burstTime++;
            this.size -= 1;
        }
        this.rotation += 0.02;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;

        switch(this.shape) {
            case 0: // Cross
                ctx.fillRect(-this.size / 2, -this.size / 6, this.size, this.size / 3);
                ctx.fillRect(-this.size / 6, -this.size / 2, this.size / 3, this.size);
                break;
            
            case 1: // Star
                const spikes = 5;
                const outerRadius = this.size / 2;
                const innerRadius = this.size / 4;
                
                ctx.beginPath();
                for(let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    if(i === 0) {
                        ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                    } else {
                        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
            
            case 2: // Circle with dots
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Add smaller dots around
                for(let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const dotX = Math.cos(angle) * (this.size / 2);
                    const dotY = Math.sin(angle) * (this.size / 2);
                    
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, this.size / 8, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            
            case 3: // Heart
                const heartSize = this.size / 2;
                ctx.beginPath();
                ctx.moveTo(0, heartSize / 2);
                ctx.bezierCurveTo(
                    heartSize / 2, 0,
                    heartSize, heartSize / 2,
                    0, heartSize
                );
                ctx.bezierCurveTo(
                    -heartSize, heartSize / 2,
                    -heartSize / 2, 0,
                    0, heartSize / 2
                );
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}

// Sun class with better movement
class Sun {
    constructor() {
        this.size = 40;
        this.reset();
    }

    reset() {
        // Pick a random starting position outside the canvas
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0: // top
                this.x = Math.random() * canvas.width;
                this.y = -this.size;
                break;
            case 1: // right
                this.x = canvas.width + this.size;
                this.y = Math.random() * canvas.height;
                break;
            case 2: // bottom
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + this.size;
                break;
            case 3: // left
                this.x = -this.size;
                this.y = Math.random() * canvas.height;
                break;
        }

        // Set speed based on position relative to cone
        const angle = Math.atan2(coneY - this.y, coneX - this.x);
        const speed = 2;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Reset if off screen
        if (this.x < -this.size * 2 || 
            this.x > canvas.width + this.size * 2 || 
            this.y < -this.size * 2 || 
            this.y > canvas.height + this.size * 2) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw sun rays
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const innerRadius = this.size / 2;
            const outerRadius = this.size;
            ctx.moveTo(
                Math.cos(angle) * innerRadius,
                Math.sin(angle) * innerRadius
            );
            ctx.lineTo(
                Math.cos(angle) * outerRadius,
                Math.sin(angle) * outerRadius
            );
        }
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw sun body
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFA500';
        ctx.fill();
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

// Update movement logic
function updatePosition() {
    if (keys.ArrowLeft || touchControls.left) coneX -= coneSpeed;
    if (keys.ArrowRight || touchControls.right) coneX += coneSpeed;
    if (keys.ArrowUp || touchControls.up) coneY -= coneSpeed;
    if (keys.ArrowDown || touchControls.down) coneY += coneSpeed;
    
    // Keep the cone within bounds
    coneX = Math.max(coneSize/2, Math.min(canvas.width - coneSize/2, coneX));
    coneY = Math.max(coneSize/2, Math.min(canvas.height - coneSize/2, coneY));
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
        if (dist < (scoopSize / 2 + sun.size / 2) * 0.8) { // Slightly smaller hitbox
            meltTime -= 15; // Reduced damage
            suns.splice(index, 1);
            spawnSun();
        }
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