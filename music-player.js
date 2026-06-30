(function () {
    if (window.__birthdayMusicPlayer) return;
    window.__birthdayMusicPlayer = true;

    const STORE_KEY = "birthday_music_track";
    const tracks = {
        love: "Love",
        birthday: "Baneen Jan"
    };

    let audioCtx = null;
    let masterGain = null;
    let isPlaying = false;
    let activeTrack = localStorage.getItem(STORE_KEY) || "love";
    let loopTimer = null;

    function createUi() {
        const style = document.createElement("style");
        style.textContent = `
            .birthday-music-player {
                position: fixed;
                left: 1rem;
                bottom: 1rem;
                z-index: 250;
                display: flex;
                align-items: center;
                gap: 0.45rem;
                padding: 0.45rem;
                border: 1px solid rgba(255,255,255,0.22);
                border-radius: 999px;
                background: rgba(12, 10, 28, 0.72);
                color: #fff;
                box-shadow: 0 12px 32px rgba(0,0,0,0.28);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                font-family: Outfit, system-ui, sans-serif;
            }
            .birthday-music-player button {
                border: 0;
                border-radius: 999px;
                min-height: 34px;
                padding: 0.5rem 0.75rem;
                color: inherit;
                background: rgba(255,255,255,0.1);
                font: inherit;
                font-size: 0.76rem;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.18s ease, background 0.18s ease;
                white-space: nowrap;
            }
            .birthday-music-player button:hover {
                transform: translateY(-1px);
                background: rgba(255,255,255,0.18);
            }
            .birthday-music-player .music-main.is-playing {
                background: linear-gradient(135deg, #ff477e, #ffb703);
                color: #19091a;
            }
            .birthday-music-player .music-track.is-active {
                background: rgba(255,255,255,0.92);
                color: #2b1138;
            }
            @media (max-width: 520px) {
                .birthday-music-player {
                    right: 0.75rem;
                    left: 0.75rem;
                    bottom: 0.75rem;
                    justify-content: center;
                    gap: 0.35rem;
                    border-radius: 18px;
                }
                .birthday-music-player button {
                    min-height: 32px;
                    padding: 0.45rem 0.58rem;
                    font-size: 0.7rem;
                }
            }
        `;
        document.head.appendChild(style);

        const player = document.createElement("div");
        player.className = "birthday-music-player";
        player.innerHTML = `
            <button class="music-main" type="button" title="Play soft background music">Music Off</button>
            <button class="music-track" type="button" data-track="love" title="Soft romantic background loop">Love</button>
            <button class="music-track" type="button" data-track="birthday" title="Happy Birthday Baneen Jan tune">Birthday</button>
        `;
        document.body.appendChild(player);

        player.querySelector(".music-main").addEventListener("click", togglePlayback);
        player.querySelectorAll(".music-track").forEach((button) => {
            button.addEventListener("click", () => {
                activeTrack = button.dataset.track;
                localStorage.setItem(STORE_KEY, activeTrack);
                updateUi();
                if (isPlaying) startLoop();
            });
        });
        updateUi();
    }

    function ensureAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = 0.22;
            masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
    }

    function playTone(freq, start, duration, options = {}) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = options.type || "sine";
        osc.frequency.setValueAtTime(freq, start);
        if (options.slideTo) {
            osc.frequency.exponentialRampToValueAtTime(options.slideTo, start + duration * 0.85);
        }
        const level = options.level || 0.09;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(level, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + duration + 0.08);
    }

    function playChord(freqs, start, duration, level) {
        freqs.forEach((freq) => playTone(freq, start, duration, {
            type: "triangle",
            level: level || 0.028
        }));
    }

    function playLoveLoop() {
        const start = audioCtx.currentTime + 0.08;
        const notes = [
            [0.0, 329.63, 0.9], [0.9, 392.00, 0.8], [1.8, 440.00, 1.0], [3.0, 392.00, 1.1],
            [4.2, 349.23, 0.9], [5.1, 392.00, 0.8], [6.0, 329.63, 1.2], [7.6, 293.66, 1.0],
            [8.8, 329.63, 0.8], [9.7, 392.00, 0.8], [10.6, 440.00, 1.2], [12.0, 493.88, 1.2]
        ];
        const chords = [
            [0, [261.63, 329.63, 392.00]],
            [4, [220.00, 261.63, 329.63]],
            [8, [246.94, 293.66, 392.00]],
            [12, [261.63, 329.63, 392.00]]
        ];

        chords.forEach(([offset, freqs]) => playChord(freqs, start + offset, 3.8, 0.018));
        notes.forEach(([offset, freq, duration]) => {
            playTone(freq, start + offset, duration, { type: "sine", level: 0.055 });
            playTone(freq * 2, start + offset + 0.02, duration * 0.7, { type: "triangle", level: 0.012 });
        });
    }

    function playBirthdayTune() {
        const start = audioCtx.currentTime + 0.08;
        const G = 392.00, A = 440.00, B = 493.88, C = 523.25, D = 587.33, E = 659.25, F = 698.46, G2 = 783.99;
        const beat = 0.42;
        const notes = [
            [0, G, 0.55], [0.55, G, 0.35], [1, A, 0.8], [1.9, G, 0.8], [2.8, C, 0.8], [3.7, B, 1.1],
            [5.0, G, 0.55], [5.55, G, 0.35], [6.0, A, 0.8], [6.9, G, 0.8], [7.8, D, 0.8], [8.7, C, 1.1],
            [10.0, G, 0.55], [10.55, G, 0.35], [11.0, G2, 0.8], [11.9, E, 0.8], [12.8, C, 0.8], [13.7, B, 0.8], [14.6, A, 1.1],
            [16.0, F, 0.55], [16.55, F, 0.35], [17.0, E, 0.8], [17.9, C, 0.8], [18.8, D, 0.8], [19.7, C, 1.4]
        ];
        const chords = [
            [0, [261.63, 329.63, 392.00]],
            [5, [261.63, 329.63, 392.00]],
            [10, [349.23, 440.00, 523.25]],
            [16, [261.63, 329.63, 392.00]]
        ];

        chords.forEach(([offset, freqs]) => playChord(freqs, start + offset, 4.3, 0.016));
        notes.forEach(([offset, freq, duration]) => {
            playTone(freq, start + offset * beat, duration * beat, { type: "triangle", level: 0.06 });
        });
    }

    function startLoop() {
        stopLoop(false);
        ensureAudio();
        isPlaying = true;
        if (activeTrack === "birthday") {
            playBirthdayTune();
            loopTimer = window.setInterval(playBirthdayTune, 9500);
        } else {
            playLoveLoop();
            loopTimer = window.setInterval(playLoveLoop, 12800);
        }
        updateUi();
    }

    function stopLoop(update = true) {
        if (loopTimer) {
            window.clearInterval(loopTimer);
            loopTimer = null;
        }
        isPlaying = false;
        if (update) updateUi();
    }

    function togglePlayback() {
        if (isPlaying) {
            stopLoop();
        } else {
            startLoop();
        }
    }

    function updateUi() {
        const main = document.querySelector(".birthday-music-player .music-main");
        if (!main) return;
        main.textContent = isPlaying ? "Music On" : "Music Off";
        main.classList.toggle("is-playing", isPlaying);
        document.querySelectorAll(".birthday-music-player .music-track").forEach((button) => {
            const isActive = button.dataset.track === activeTrack;
            button.classList.toggle("is-active", isActive);
            button.textContent = tracks[button.dataset.track] || button.dataset.track;
        });
    }

    document.addEventListener("DOMContentLoaded", createUi);
})();
