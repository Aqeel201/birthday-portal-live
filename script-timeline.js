// ===== COUNTDOWN TIMER =====
function updateCountdown() {
    const birthday = new Date('2026-07-25T00:00:00');
    const now = new Date();
    const diff = birthday - now;

    if (diff <= 0) {
        document.getElementById('countdown').innerHTML = `
            <div class="countdown-item" style="min-width: auto; padding: 1rem 2rem;">
                <span class="countdown-number" style="font-size: 2rem;">🎂 Happy Birthday! 🎂</span>
            </div>
        `;
        document.querySelector('.countdown-label').textContent = '🎉 Aaj aapka din hai! 🎉';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ===== FLOATING HEARTS =====
function createFloatingHearts() {
    const container = document.getElementById('floatingHearts');
    const hearts = ['💖', '💕', '💗', '💝', '✨', '💫', '🌟', '💜', '🩷', '🤍'];

    for (let i = 0; i < 20; i++) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.fontSize = (Math.random() * 1.5 + 0.8) + 'rem';
        heart.style.animationDuration = (Math.random() * 10 + 8) + 's';
        heart.style.animationDelay = (Math.random() * 15) + 's';
        container.appendChild(heart);
    }
}

createFloatingHearts();

// ===== SCROLL ANIMATIONS =====
function handleScrollAnimations() {
    // Timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top < windowHeight * 0.85) {
            item.classList.add('visible');
        }
    });

    // Reason cards
    const reasonCards = document.querySelectorAll('.reason-card');
    reasonCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top < windowHeight * 0.85) {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 100);
        }
    });
}

window.addEventListener('scroll', handleScrollAnimations);
window.addEventListener('load', handleScrollAnimations);

// ===== CONFETTI =====
function launchConfetti() {
    const colors = ['#ff6b9d', '#c471f5', '#6a82fb', '#06d6a0', '#ffd166', '#ff9a9e', '#fecfef', '#a18cd1'];
    const shapes = ['■', '●', '▲', '★', '♥', '◆'];

    for (let i = 0; i < 120; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.fontSize = (Math.random() * 15 + 8) + 'px';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = (Math.random() * 1.5) + 's';
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 5000);
    }

    // Also create a burst from center
    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.textContent = '♥';
        confetti.style.left = '50vw';
        confetti.style.top = '50vh';
        confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.fontSize = (Math.random() * 20 + 10) + 'px';

        const angle = (Math.PI * 2 * i) / 40;
        const velocity = Math.random() * 300 + 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 200;

        confetti.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        document.body.appendChild(confetti);

        requestAnimationFrame(() => {
            confetti.style.transform = `translate(${tx}px, ${ty}px) rotate(${Math.random() * 720}deg)`;
            confetti.style.opacity = '0';
        });

        setTimeout(() => confetti.remove(), 3000);
    }
}

// ===== MUSIC CONTROL =====
let isPlaying = false;

function toggleMusic() {
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('musicBtn');

    if (isPlaying) {
        audio.pause();
        btn.textContent = '🎵';
        btn.classList.remove('playing');
    } else {
        audio.play().catch(() => {
            // Autoplay blocked — that's okay
            console.log('Add an mp3 file to enable music');
        });
        btn.textContent = '🔊';
        btn.classList.add('playing');
    }
    isPlaying = !isPlaying;
}

// ===== SMOOTH REVEAL ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
    });
});

// ===== PARALLAX EFFECT ON HERO =====
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-content');
    const scrolled = window.scrollY;
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        hero.style.opacity = 1 - (scrolled / window.innerHeight) * 0.8;
    }
});

// ===== CURSOR SPARKLE TRAIL (SUBTLE) =====
let lastSparkle = 0;
document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSparkle < 80) return;
    lastSparkle = now;

    const sparkle = document.createElement('div');
    sparkle.textContent = '✨';
    sparkle.style.position = 'fixed';
    sparkle.style.left = e.clientX + 'px';
    sparkle.style.top = e.clientY + 'px';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.zIndex = '9999';
    sparkle.style.fontSize = '12px';
    sparkle.style.transition = 'all 0.8s ease-out';
    sparkle.style.opacity = '1';
    document.body.appendChild(sparkle);

    requestAnimationFrame(() => {
        sparkle.style.transform = `translate(${(Math.random() - 0.5) * 40}px, -30px) scale(0)`;
        sparkle.style.opacity = '0';
    });

    setTimeout(() => sparkle.remove(), 900);
});
