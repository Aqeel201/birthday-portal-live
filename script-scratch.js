let soundEnabled = true;
let audioCtx = null;
let scratchSource = null;
let scratchGain = null;

// Track which cards are fully revealed
const revealedCards = new Set();
const totalCards = 4;

// Audio context initialization
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// ===== REALISTIC SCRATCHING SOUND (White Noise + Filters) =====
function startScratchSound() {
    if (!soundEnabled) return;
    initAudio();
    if (scratchSource) return; // Already playing

    try {
        // Create 1-second white noise buffer
        const bufferSize = audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        scratchSource = audioCtx.createBufferSource();
        scratchSource.buffer = noiseBuffer;
        scratchSource.loop = true;

        // Bandpass filter to isolate the paper-like texture frequency (around 3kHz)
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500;
        filter.Q.value = 1.2;

        // Highpass filter to eliminate base noise rumble
        const highpass = audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 1000;

        scratchGain = audioCtx.createGain();
        // Fade in quickly
        scratchGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
        scratchGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.05);

        scratchSource.connect(highpass);
        highpass.connect(filter);
        filter.connect(scratchGain);
        scratchGain.connect(audioCtx.destination);

        scratchSource.start();
    } catch (e) {
        console.log('Audio start error:', e);
    }
}

function stopScratchSound() {
    if (!scratchSource) return;
    try {
        scratchGain.gain.setValueAtTime(scratchGain.gain.value, audioCtx.currentTime);
        scratchGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        
        const tempSource = scratchSource;
        scratchSource = null;
        
        setTimeout(() => {
            try { tempSource.stop(); } catch (e) {}
        }, 150);
    } catch (e) {
        scratchSource = null;
    }
}

function playRevealChime() {
    if (!soundEnabled) return;
    initAudio();
    try {
        const notes = [587.33, 698.46, 880.00, 1046.50, 1318.51]; // D5, F5, A5, C6, E6
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
            
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + idx * 0.08 + 0.3);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(audioCtx.currentTime + idx * 0.08);
            osc.stop(audioCtx.currentTime + idx * 0.08 + 0.3);
        });
    } catch (e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggleBtn');
    btn.textContent = soundEnabled ? '🔊 Sound: On' : '🔇 Sound: Off';
}

// ===== SCRATCH-OFF CARD SETUP =====
function initScratchCards() {
    const canvases = document.querySelectorAll('.scratch-canvas');
    
    canvases.forEach((canvas, index) => {
        const ctx = canvas.getContext('2d');
        const cardId = canvas.closest('.scratch-card-wrapper').id;
        
        // Match canvas logical pixels to display dimensions
        function resize() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            drawOverlay();
        }

        // Draw Gold/Silver metallic gradient overlay
        function drawOverlay() {
            ctx.globalCompositeOperation = 'source-over';
            
            // Silver metallic gradient
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, '#c0c0c0');
            grad.addColorStop(0.3, '#f5f5f5');
            grad.addColorStop(0.5, '#e0e0e0');
            grad.addColorStop(0.8, '#a9a9a9');
            grad.addColorStop(1, '#c0c0c0');
            
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Glitter specks
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            for (let i = 0; i < 150; i++) {
                const sx = Math.random() * canvas.width;
                const sy = Math.random() * canvas.height;
                ctx.fillRect(sx, sy, 2, 2);
            }

            // Draw Card Title on cover
            const labelText = canvas.getAttribute('data-label') || "Scratch Me! 🤫";
            ctx.font = 'bold 16px Outfit, sans-serif';
            ctx.fillStyle = '#4a0e2e';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw clean background pill under text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            const textWidth = ctx.measureText(labelText).width;
            ctx.roundRect(canvas.width / 2 - textWidth / 2 - 15, canvas.height / 2 - 20, textWidth + 30, 40, 20);
            ctx.fill();

            // Label text drawing
            ctx.fillStyle = '#4a0e2e';
            ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);
        }

        // Scratch mechanics
        let isDrawing = false;
        let lastPoint = null;

        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        function scratch(x, y) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 42; // Brush size
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (lastPoint) {
                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(x, y);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(x, y, 21, 0, Math.PI * 2);
                ctx.fill();
            }
            lastPoint = { x, y };
        }

        // Event handlers
        function handleStart(e) {
            isDrawing = true;
            lastPoint = getMousePos(e);
            startScratchSound();
            scratch(lastPoint.x, lastPoint.y);
            e.preventDefault();
        }

        function handleMove(e) {
            if (!isDrawing) return;
            const pos = getMousePos(e);
            scratch(pos.x, pos.y);
            e.preventDefault();
        }

        function handleEnd() {
            if (!isDrawing) return;
            isDrawing = false;
            lastPoint = null;
            stopScratchSound();
            checkClearPercentage();
        }

        // Check if card is cleared enough (e.g. > 45%)
        function checkClearPercentage() {
            if (revealedCards.has(cardId)) return;

            const cleared = getClearedPercentage(ctx, canvas.width, canvas.height);
            if (cleared > 45) {
                revealCardFully();
            }
        }

        function revealCardFully() {
            revealedCards.add(cardId);
            canvas.classList.add('fade-out');
            playRevealChime();

            // Check if all cards have been revealed
            if (revealedCards.size === totalCards) {
                setTimeout(() => {
                    launchConfettiShower();
                }, 800);
            }
        }

        // Calculate cleared percentage by sampling alpha channel
        function getClearedPercentage(ctx, w, h) {
            const imgData = ctx.getImageData(0, 0, w, h);
            const pixels = imgData.data;
            let transparentCount = 0;
            const step = 80; // Performance optimization (sample step)
            
            for (let i = 3; i < pixels.length; i += step) {
                if (pixels[i] === 0) {
                    transparentCount++;
                }
            }
            return (transparentCount / (pixels.length / step)) * 100;
        }

        // Bind Mouse Events
        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);

        // Bind Touch Events
        canvas.addEventListener('touchstart', handleStart);
        canvas.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleEnd);

        // Handle Resizing
        resize();
        window.addEventListener('resize', resize);
        
        // Attach reveal mechanism directly to windows object for manual reset
        canvas.resetCard = () => {
            canvas.classList.remove('fade-out');
            resize();
        };
    });
}

// ===== CELEBRATION SHOWER =====
function launchConfettiShower() {
    const colors = ['#ff477e', '#7209b7', '#ffb703', '#06d6a0', '#4cc9f0', '#ffffff'];
    const shapes = ['♥', '★', '●', '■'];

    for (let i = 0; i < 180; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        conf.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        conf.style.left = `${Math.random() * 100}vw`;
        conf.style.top = `-10px`;
        conf.style.color = colors[Math.floor(Math.random() * colors.length)];
        conf.style.fontSize = `${Math.random() * 18 + 8}px`;
        conf.style.animationDuration = `${Math.random() * 4 + 2}s`;
        conf.style.animationDelay = `${Math.random() * 2}s`;
        document.body.appendChild(conf);

        setTimeout(() => conf.remove(), 6000);
    }
}

// ===== RESET ALL CARDS =====
function resetAllCards() {
    revealedCards.clear();
    const canvases = document.querySelectorAll('.scratch-canvas');
    canvases.forEach(canvas => {
        if (canvas.resetCard) canvas.resetCard();
    });
}

// Initialise everything
document.addEventListener('DOMContentLoaded', () => {
    initScratchCards();
});
