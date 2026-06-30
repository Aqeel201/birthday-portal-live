// ===== GAME STATE =====
let currentStep = 1;
let poppedCount = 0;
const totalBalloonsToPop = 7;
let soundEnabled = true;

// Sweet notes revealed after popping regular balloons
const popNotes = [
    "Aap bohot special hain! 🥰",
    "Aapki smile dunya ki sabse pyari cheez hai! 🌻",
    "Aapki smile dekh ke mera din ban jata hai! ☀️",
    "Aap mujhe hamesha khush rakhti hain! 🤗",
    "Aap ek anmol tohfa hain! 💎",
    "Aapke saath har pal yaadgar hai! 💖",
    "Main aapse bohot pyaar karta hoon! ❤️"
];

// Balloon colors
const balloonColors = [
    '#ff477e', // Pink
    '#7209b7', // Purple
    '#4cc9f0', // Cyan
    '#06d6a0', // Mint
    '#ffb703', // Orange-Gold
    '#ff7096', // Light Pink
    '#3a0ca3'  // Dark Purple
];

// ===== BACKGROUND BUBBLES =====
function initBackgroundBubbles() {
    const container = document.getElementById('bubbleBg');
    container.innerHTML = '';
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bg-bubble';
        const size = Math.random() * 60 + 20;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 8 + 6}s`;
        bubble.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(bubble);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initBackgroundBubbles();
});

// ===== SYNTHESIZED SOUND EFFECTS (Web Audio API) =====
function playPopSound() {
    if (!soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        // Pitch rises quickly like a pop
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
        console.log('Audio error:', e);
    }
}

function playSuccessSound() {
    if (!soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (ascending chime)
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
            
            gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.25);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime + idx * 0.08);
            osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
        });
    } catch (e) {}
}

function playErrorSound() {
    if (!soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggleBtn');
    btn.textContent = soundEnabled ? '🔊 Sound: On' : '🔇 Sound: Off';
}

// ===== LEVEL 1: QUIZ SYSTEM =====
function checkAnswer(step, isCorrect, element) {
    const feedback = document.getElementById('quizFeedback');
    
    // Disable other option clicks during evaluation
    const currentQuestion = document.getElementById(`q${step}`);
    const buttons = currentQuestion.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.style.pointerEvents = 'none');

    if (isCorrect) {
        element.classList.add('correct-choice');
        feedback.style.color = '#06d6a0';
        feedback.textContent = 'Wah! Bilkul Sahi Jawab! 😍';
        playSuccessSound();

        setTimeout(() => {
            feedback.textContent = '';
            currentQuestion.classList.remove('active');
            
            if (step < 3) {
                currentStep = step + 1;
                document.getElementById(`q${currentStep}`).classList.add('active');
            } else {
                // Unlock Level 2
                transitionToScreen('balloonScreen');
                startBalloonGame();
            }
        }, 1200);
    } else {
        element.classList.add('wrong-choice');
        feedback.style.color = '#e63946';
        feedback.textContent = 'Oops! Dobara socho, yeh sahi nahi hai! 😜';
        playErrorSound();

        setTimeout(() => {
            element.classList.remove('wrong-choice');
            feedback.textContent = '';
            buttons.forEach(btn => btn.style.pointerEvents = 'auto');
        }, 1200);
    }
}

// ===== SCREEN TRANSITIONS =====
function transitionToScreen(screenId) {
    const screens = document.querySelectorAll('.game-screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    setTimeout(() => {
        document.getElementById(screenId).classList.add('active');
    }, 100);
}

// ===== LEVEL 2: BALLOON GAME =====
function startBalloonGame() {
    poppedCount = 0;
    document.getElementById('popCount').textContent = '0';
    const container = document.getElementById('balloonContainer');
    container.innerHTML = '';

    // Spawn 7 regular balloons sequentially
    for (let i = 0; i < totalBalloonsToPop; i++) {
        setTimeout(() => {
            createSingleBalloon(i);
        }, i * 400);
    }
}

function createSingleBalloon(index) {
    const container = document.getElementById('balloonContainer');
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    
    // Distribute horizontally
    const leftPos = 10 + (index * 12) + (Math.random() * 5);
    balloon.style.left = `${leftPos}%`;
    
    // Vary colors
    const color = balloonColors[index % balloonColors.length];
    balloon.style.backgroundColor = color;
    balloon.style.color = color; // For the triangular tail color matching
    
    // Vary speed and rotation
    const duration = 12 + Math.random() * 6;
    balloon.style.animationDuration = `${duration}s`;
    balloon.style.setProperty('--rot', `${(Math.random() - 0.5) * 20}deg`);

    // Click handler
    balloon.addEventListener('click', (e) => {
        popBalloon(balloon, e.clientX, e.clientY, popNotes[index]);
    });

    container.appendChild(balloon);

    // If balloon floats off screen without being popped, recreate it
    balloon.addEventListener('animationend', () => {
        if (!balloon.classList.contains('popped')) {
            balloon.remove();
            createSingleBalloon(index);
        }
    });
}

function popBalloon(balloon, clickX, clickY, message) {
    if (balloon.classList.contains('popped')) return;

    balloon.classList.add('popped');
    playPopSound();
    
    // Create floating sweet text note
    createPopNote(clickX, clickY, message);

    poppedCount++;
    document.getElementById('popCount').textContent = poppedCount;

    // Remove from DOM after animation completes
    setTimeout(() => {
        balloon.remove();
    }, 200);

    // Once all 7 regular balloons are popped, spawn the Giant Golden Heart Balloon
    if (poppedCount === totalBalloonsToPop) {
        setTimeout(() => {
            spawnGiantHeartBalloon();
        }, 1500);
    }
}

function createPopNote(x, y, text) {
    const note = document.createElement('div');
    note.className = 'pop-note';
    note.textContent = text;
    note.style.left = `${x - 60}px`;
    note.style.top = `${y - 20}px`;
    document.body.appendChild(note);

    setTimeout(() => {
        note.remove();
    }, 2500);
}

// ===== SPAWN GIANT GOLDEN BALLOON =====
function spawnGiantHeartBalloon() {
    const container = document.getElementById('balloonContainer');
    const giant = document.createElement('div');
    giant.className = 'balloon giant-heart';
    
    // Center alignment
    giant.style.setProperty('--startX', `${window.innerWidth / 2 - 70}px`);
    
    const content = document.createElement('div');
    content.className = 'giant-text';
    content.innerHTML = 'TAP TO UNLOCK<br>🎁';
    giant.appendChild(content);

    giant.addEventListener('click', (e) => {
        popGiantHeart(giant, e.clientX, e.clientY);
    });

    container.appendChild(giant);
}

function popGiantHeart(giant, clickX, clickY) {
    giant.classList.add('popped');
    playPopSound();
    playSuccessSound();

    // Increment scoreboard to 8/8
    document.getElementById('popCount').textContent = '8';

    // Massive confetti burst
    launchMegaConfetti();

    setTimeout(() => {
        giant.remove();
        transitionToScreen('wishScreen');
    }, 800);
}

// ===== CONFETTI AND SUCCESS EFFECTS =====
function launchMegaConfetti() {
    const colors = ['#ff477e', '#7209b7', '#ffb703', '#06d6a0', '#4cc9f0', '#ffffff'];
    const shapes = ['■', '●', '▲', '★', '♥'];

    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `-10px`;
        confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.fontSize = `${Math.random() * 18 + 8}px`;
        confetti.style.animationDuration = `${Math.random() * 3.5 + 2}s`;
        confetti.style.animationDelay = `${Math.random() * 1.5}s`;
        document.body.appendChild(confetti);

        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// ===== REPLAY GAME =====
function restartGame() {
    currentStep = 1;
    poppedCount = 0;
    
    // Reset option classes
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.classList.remove('correct-choice', 'wrong-choice');
        btn.style.pointerEvents = 'auto';
    });

    // Reset feedback
    document.getElementById('quizFeedback').textContent = '';

    // Reset questions view
    const questions = document.querySelectorAll('.question-container');
    questions.forEach(q => q.classList.remove('active'));
    document.getElementById('q1').classList.add('active');

    // Go to first screen
    transitionToScreen('quizScreen');
}
