// Variables del juego
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scorePlayer1 = document.querySelector('.score .player1');
const scorePlayer2 = document.querySelector('.score .player2');
const menu = document.querySelector('.menu');
const play1vs1Btn = document.getElementById('play1vs1');
const playVsAIBtn = document.getElementById('playVsAI');
const optionsBtn = document.getElementById('optionsBtn');
const optionsMenu = document.querySelector('.options-menu');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const victoryScreen = document.querySelector('.victory-screen');
const victoryMessage = document.querySelector('.victory-message');
const playAgainBtn = document.getElementById('playAgainBtn');
const mainMenuBtn = document.getElementById('mainMenuBtn');
const exitBtn = document.querySelector('.exit-btn');
const pauseBtn = document.querySelector('.pause-btn');
const confirmExit = document.querySelector('.confirm-exit');
const confirmExitYes = document.getElementById('confirmExitYes');
const confirmExitNo = document.getElementById('confirmExitNo');

// Ajustar tamaño del canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Variables de estado del juego
let gameState = 'menu'; // menu, playing, paused, victory
let gameMode = '1vs1'; // 1vs1, vsAI
let difficulty = 'hard'; // easy, medium, hard
let player1Score = 0;
let player2Score = 0;
let ball = {
    x: 0,
    y: 0,
    radius: 10,
    speedX: 5,
    speedY: 5,
    baseSpeed: 5,
    maxSpeed: 15
};
let paddle1 = {
    x: 20,
    y: canvas.height / 2 - 50,
    width: 15,
    height: 100,
    speed: 8,
    movingUp: false,
    movingDown: false
};
let paddle2 = {
    x: canvas.width - 35,
    y: canvas.height / 2 - 50,
    width: 15,
    height: 100,
    speed: 8,
    movingUp: false,
    movingDown: false
};
let ballTrail = [];
let particles = [];
let lastTime = 0;
let gameStarted = false;
let touchStartY1 = 0;
let touchStartY2 = 0;

// Sonidos
const sounds = {
    paddleHit: new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'), // Sonido corto de base64
    score: new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'),
    victory: new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...')
};

// Inicializar el juego
function initGame() {
    resetBall();
    player1Score = 0;
    player2Score = 0;
    updateScore();
    gameStarted = false;
}

// Reiniciar la pelota
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = ball.baseSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.speedY = ball.baseSpeed * (Math.random() * 2 - 1);
    ballTrail = [];
}

// Actualizar marcador
function updateScore() {
    scorePlayer1.textContent = player1Score;
    scorePlayer2.textContent = player2Score;
    
    // Animación del marcador
    scorePlayer1.classList.add('score-animation');
    scorePlayer2.classList.add('score-animation');
    
    setTimeout(() => {
        scorePlayer1.classList.remove('score-animation');
        scorePlayer2.classList.remove('score-animation');
    }, 500);
}

// Detectar colisiones
function checkCollision() {
    // Colisión con paleta izquierda
    if (ball.x - ball.radius < paddle1.x + paddle1.width &&
        ball.x - ball.radius > paddle1.x &&
        ball.y > paddle1.y &&
        ball.y < paddle1.y + paddle1.height) {
        
        const hitPosition = (ball.y - (paddle1.y + paddle1.height / 2)) / (paddle1.height / 2);
        const angle = hitPosition * Math.PI / 4;
        
        ball.speedX = Math.abs(ball.speedX) * 1.05;
        ball.speedY = ball.speedY + hitPosition * 2;
        
        // Limitar velocidad máxima
        const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        if (speed > ball.maxSpeed) {
            ball.speedX = (ball.speedX / speed) * ball.maxSpeed;
            ball.speedY = (ball.speedY / speed) * ball.maxSpeed;
        }
        
        ball.x = paddle1.x + paddle1.width + ball.radius;
        createParticles(ball.x, ball.y);
        sounds.paddleHit.play();
    }
    
    // Colisión con paleta derecha
    if (ball.x + ball.radius > paddle2.x &&
        ball.x + ball.radius < paddle2.x + paddle2.width &&
        ball.y > paddle2.y &&
        ball.y < paddle2.y + paddle2.height) {
        
        const hitPosition = (ball.y - (paddle2.y + paddle2.height / 2)) / (paddle2.height / 2);
        const angle = hitPosition * Math.PI / 4;
        
        ball.speedX = -Math.abs(ball.speedX) * 1.05;
        ball.speedY = ball.speedY + hitPosition * 2;
        
        // Limitar velocidad máxima
        const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        if (speed > ball.maxSpeed) {
            ball.speedX = (ball.speedX / speed) * ball.maxSpeed;
            ball.speedY = (ball.speedY / speed) * ball.maxSpeed;
        }
        
        ball.x = paddle2.x - ball.radius;
        createParticles(ball.x, ball.y);
        sounds.paddleHit.play();
    }
    
    // Colisión con paredes superior e inferior
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
        createParticles(ball.x, ball.y);
        sounds.paddleHit.play();
    }
    
    // Punto para jugador 2
    if (ball.x - ball.radius < 0) {
        player2Score++;
        updateScore();
        sounds.score.play();
        if (player2Score >= 10) {
            showVictory('JUGADOR 2');
        } else {
            resetBall();
            gameStarted = false;
        }
    }
    
    // Punto para jugador 1
    if (ball.x + ball.radius > canvas.width) {
        player1Score++;
        updateScore();
        sounds.score.play();
        if (player1Score >= 10) {
            showVictory('JUGADOR 1');
        } else {
            resetBall();
            gameStarted = false;
        }
    }
}

// IA para la paleta - MEJORADA Y BALANCEADA
function updateAI() {
    if (gameMode !== 'vsAI') return;
    
    const paddleCenter = paddle2.y + paddle2.height / 2;
    const ballCenter = ball.y;
    
    // Configuración de dificultad balanceada
    const difficultySettings = {
        easy: {
            reactionThreshold: 50,  // Más sensible
            reactionSpeed: 0.7,     // Movimiento más lento
            prediction: 0.3,        // Poca predicción
            errorMargin: 50         // Margen de error grande
        },
        medium: {
            reactionThreshold: 30,  // Muy sensible
            reactionSpeed: 0.9,    // Movimiento rápido
            prediction: 0.6,       // Buena predicción
            errorMargin: 20        // Margen de error pequeño
        },
        hard: {
            reactionThreshold: 10,  // Extremadamente sensible
            reactionSpeed: 1.0,     // Movimiento instantáneo
            prediction: 0.9,        // Excelente predicción
            errorMargin: 5          // Casi sin errores
        }
    };
    
    const settings = difficultySettings[difficulty];
    
    // Calcular posición futura de la pelota
    let predictedY = ballCenter;
    if (ball.speedX > 0) {
        const timeToReach = (paddle2.x - ball.x) / ball.speedX;
        predictedY = ballCenter + ball.speedY * timeToReach * settings.prediction;
        
        // Asegurar que la predicción no salga de la pantalla
        while (predictedY < 0 || predictedY > canvas.height) {
            if (predictedY < 0) predictedY = -predictedY;
            if (predictedY > canvas.height) predictedY = 2 * canvas.height - predictedY;
        }
    }
    
    // Añadir margen de error según dificultad
    predictedY += (Math.random() * 2 - 1) * settings.errorMargin;
    
    // Mover la paleta hacia la posición predicha
    if (predictedY < paddleCenter - settings.reactionThreshold) {
        paddle2.y -= paddle2.speed * settings.reactionSpeed;
    } else if (predictedY > paddleCenter + settings.reactionThreshold) {
        paddle2.y += paddle2.speed * settings.reactionSpeed;
    }
    
    // Mantener la paleta dentro del canvas
    if (paddle2.y < 0) paddle2.y = 0;
    if (paddle2.y + paddle2.height > canvas.height) paddle2.y = canvas.height - paddle2.height;
}

// Actualizar posición de las paletas
function updatePaddles() {
    // Jugador 1
    if (paddle1.movingUp && paddle1.y > 0) {
        paddle1.y -= paddle1.speed;
    }
    if (paddle1.movingDown && paddle1.y + paddle1.height < canvas.height) {
        paddle1.y += paddle1.speed;
    }
    
    // Jugador 2 (solo si no es IA)
    if (gameMode === '1vs1') {
        if (paddle2.movingUp && paddle2.y > 0) {
            paddle2.y -= paddle2.speed;
        }
        if (paddle2.movingDown && paddle2.y + paddle2.height < canvas.height) {
            paddle2.y += paddle2.speed;
        }
    }
}

// Actualizar posición de la pelota
function updateBall() {
    if (!gameStarted || gameState !== 'playing') return;
    
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    
    // Añadir posición a la estela
    ballTrail.push({x: ball.x, y: ball.y});
    if (ballTrail.length > 10) {
        ballTrail.shift();
    }
}

// Actualizar partículas
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].speedX;
        particles[i].y += particles[i].speedY;
        particles[i].alpha -= 0.02;
        
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Crear partículas
function createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 3 + 2,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 6 - 3,
            alpha: 1
        });
    }
}

// Dibujar elementos
function draw() {
    // Limpiar canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar línea central
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Dibujar estela de la pelota
    for (let i = 0; i < ballTrail.length; i++) {
        const alpha = i / ballTrail.length * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(ballTrail[i].x, ballTrail[i].y, ball.radius * (i / ballTrail.length), 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Dibujar pelota
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Efecto glow de la pelota
    const gradient = ctx.createRadialGradient(
        ball.x, ball.y, ball.radius,
        ball.x, ball.y, ball.radius * 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Dibujar paletas
    // Paleta 1 (cian)
    const paddle1Gradient = ctx.createLinearGradient(
        paddle1.x, paddle1.y,
        paddle1.x + paddle1.width, paddle1.y + paddle1.height
    );
    paddle1Gradient.addColorStop(0, '#00ffff');
    paddle1Gradient.addColorStop(1, '#00aaff');
    ctx.fillStyle = paddle1Gradient;
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    
    // Paleta 2 (magenta)
    const paddle2Gradient = ctx.createLinearGradient(
        paddle2.x, paddle2.y,
        paddle2.x + paddle2.width, paddle2.y + paddle2.height
    );
    paddle2Gradient.addColorStop(0, '#ff00ff');
    paddle2Gradient.addColorStop(1, '#ff00aa');
    ctx.fillStyle = paddle2Gradient;
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
    
    // Dibujar partículas
    for (const particle of particles) {
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Mostrar mensaje de inicio solo al comenzar el partido
    if (!gameStarted && gameState === 'playing' && player1Score === 0 && player2Score === 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 30, 300, 60);
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px "Press Start 2P", cursive';
        ctx.textAlign = 'center';
        ctx.fillText('Haz clic para comenzar', canvas.width / 2, canvas.height / 2 + 10);
    }
}

// Bucle del juego
function gameLoop(timestamp) {
    if (gameState === 'playing') {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        updatePaddles();
        updateBall();
        checkCollision();
        updateAI();
        updateParticles();
        draw();
    }
    
    requestAnimationFrame(gameLoop);
}

// Mostrar pantalla de victoria
function showVictory(winner) {
    gameState = 'victory';
    victoryMessage.textContent = `${winner} GANA!`;
    victoryMessage.className = 'victory-message';
    
    if (winner === 'JUGADOR 1') {
        victoryMessage.classList.add('victory-player1');
        victoryMessage.classList.remove('victory-player2');
    } else {
        victoryMessage.classList.add('victory-player2');
        victoryMessage.classList.remove('victory-player1');
    }
    
    victoryScreen.style.display = 'flex';
    sounds.victory.play();
    
    // Crear partículas de celebración
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: Math.random() * 5 + 2,
            speedX: Math.random() * 10 - 5,
            speedY: Math.random() * 10 - 5,
            alpha: 1
        });
    }
}

// Función para pausar/reanudar el juego
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseBtn.textContent = '▶';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseBtn.textContent = 'II';
    }
}

// Event listeners
// Teclado
document.addEventListener('keydown', (e) => {
    if (gameState === 'playing') {
        switch (e.key.toLowerCase()) {
            case 'w':
                paddle1.movingUp = true;
                break;
            case 's':
                paddle1.movingDown = true;
                break;
            case 'arrowup':
                if (gameMode === '1vs1') paddle2.movingUp = true;
                break;
            case 'arrowdown':
                if (gameMode === '1vs1') paddle2.movingDown = true;
                break;
            case 'p':
                togglePause();
                break;
        }
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w':
            paddle1.movingUp = false;
            break;
        case 's':
            paddle1.movingDown = false;
            break;
        case 'arrowup':
            paddle2.movingUp = false;
            break;
        case 'arrowdown':
            paddle2.movingDown = false;
            break;
    }
});

// Touch para móviles
canvas.addEventListener('touchstart', (e) => {
    if (gameState === 'playing') {
        const touchY = e.touches[0].clientY;
        
        // Determinar si el toque es en el lado izquierdo o derecho
        if (e.touches[0].clientX < canvas.width / 2) {
            touchStartY1 = touchY;
            
            // Mover paleta 1
            if (touchY < paddle1.y + paddle1.height / 2) {
                paddle1.movingUp = true;
                paddle1.movingDown = false;
            } else {
                paddle1.movingUp = false;
                paddle1.movingDown = true;
            }
        } else {
            touchStartY2 = touchY;
            
            // Mover paleta 2 (solo en modo 1vs1)
            if (gameMode === '1vs1') {
                if (touchY < paddle2.y + paddle2.height / 2) {
                    paddle2.movingUp = true;
                    paddle2.movingDown = false;
                } else {
                    paddle2.movingUp = false;
                    paddle2.movingDown = true;
                }
            }
        }
    }
    
    // Iniciar juego al tocar la pantalla
    if (!gameStarted && gameState === 'playing') {
        gameStarted = true;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (gameState === 'playing') {
        const touchY = e.touches[0].clientY;
        
        // Mover paleta 1
        if (e.touches[0].clientX < canvas.width / 2) {
            const deltaY = touchY - touchStartY1;
            paddle1.y += deltaY;
            touchStartY1 = touchY;
            
            // Limitar movimiento
            if (paddle1.y < 0) paddle1.y = 0;
            if (paddle1.y + paddle1.height > canvas.height) paddle1.y = canvas.height - paddle1.height;
        } 
        // Mover paleta 2 (solo en modo 1vs1)
        else if (gameMode === '1vs1') {
            const deltaY = touchY - touchStartY2;
            paddle2.y += deltaY;
            touchStartY2 = touchY;
            
            // Limitar movimiento
            if (paddle2.y < 0) paddle2.y = 0;
            if (paddle2.y + paddle2.height > canvas.height) paddle2.y = canvas.height - paddle2.height;
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    paddle1.movingUp = false;
    paddle1.movingDown = false;
    paddle2.movingUp = false;
    paddle2.movingDown = false;
});

// Click para iniciar juego
canvas.addEventListener('click', () => {
    if (!gameStarted && gameState === 'playing') {
        gameStarted = true;
    }
});

// Botones del menú
play1vs1Btn.addEventListener('click', () => {
    gameMode = '1vs1';
    gameState = 'playing';
    menu.classList.add('hidden');
    exitBtn.style.display = 'flex';
    pauseBtn.style.display = 'flex';
    initGame();
});

playVsAIBtn.addEventListener('click', () => {
    gameMode = 'vsAI';
    gameState = 'playing';
    menu.classList.add('hidden');
    exitBtn.style.display = 'flex';
    pauseBtn.style.display = 'flex';
    initGame();
});

optionsBtn.addEventListener('click', () => {
    optionsMenu.classList.add('active');
});

backToMenuBtn.addEventListener('click', () => {
    optionsMenu.classList.remove('active');
});

// Botones de dificultad
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.difficulty;
    });
});

// Botones de victoria
playAgainBtn.addEventListener('click', () => {
    victoryScreen.style.display = 'none';
    initGame();
    gameState = 'playing';
    gameStarted = false;
});

mainMenuBtn.addEventListener('click', () => {
    victoryScreen.style.display = 'none';
    menu.classList.remove('hidden');
    exitBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    gameState = 'menu';
});

// Botón de salida
exitBtn.addEventListener('click', () => {
    confirmExit.classList.add('active');
});

confirmExitYes.addEventListener('click', () => {
    confirmExit.classList.remove('active');
    victoryScreen.style.display = 'none';
    menu.classList.remove('hidden');
    exitBtn.style.display = 'none';
    pauseBtn.style.display = 'none';
    gameState = 'menu';
});

confirmExitNo.addEventListener('click', () => {
    confirmExit.classList.remove('active');
});

// Botón de pausa
pauseBtn.addEventListener('click', togglePause);

// Iniciar bucle del juego
requestAnimationFrame(gameLoop);