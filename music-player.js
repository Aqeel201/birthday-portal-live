(function () {
    if (window.__birthdayMusicPlayer) return;
    window.__birthdayMusicPlayer = true;

    let audioCtx = null;
    let masterGain = null;
    let loopTimer = null;
    let enabled = true;
    let started = false;
    let activeNodes = [];

    function createUi() {
        const style = document.createElement("style");
        style.textContent = `
            .birthday-music-toggle {
                position: fixed;
                left: 1rem;
                bottom: 1rem;
                z-index: 300;
                width: 46px;
                height: 46px;
                border: 1px solid rgba(255,255,255,0.28);
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                background: rgba(14, 10, 30, 0.74);
                box-shadow: 0 12px 30px rgba(0,0,0,0.32);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                font-size: 1.05rem;
                line-height: 1;
                cursor: pointer;
                transition: transform 0.18s ease, background 0.18s ease, opacity 0.18s ease;
            }

            .birthday-music-toggle:hover {
                transform: translateY(-1px) scale(1.04);
                background: rgba(255, 71, 126, 0.86);
            }

            .birthday-music-toggle.is-off {
                opacity: 0.62;
                background: rgba(14, 10, 30, 0.58);
            }

            @media (max-width: 520px) {
                .birthday-music-toggle {
                    left: 0.85rem;
                    bottom: 0.85rem;
                    width: 42px;
                    height: 42px;
                    font-size: 0.98rem;
                }
            }
        `;
        document.head.appendChild(style);

        const button = document.createElement("button");
        button.className = "birthday-music-toggle";
        button.type = "button";
        button.setAttribute("aria-label", "Turn background music off");
        button.title = "Music on";
        document.body.appendChild(button);

        button.addEventListener("click", () => {
            enabled = !enabled;
            if (enabled) {
                startMusic();
            } else {
                stopMusic();
            }
            updateUi();
        });

        updateUi();
        startMusic();
        armUserGestureStart();
    }

    function ensureAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = 0;
            masterGain.connect(audioCtx.destination);
        }

        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }
    }

    function armUserGestureStart() {
        const resume = (event) => {
            if (event.target && event.target.closest && event.target.closest(".birthday-music-toggle")) return;
            if (!enabled) return;
            startMusic();
        };

        window.addEventListener("pointerdown", resume, { passive: true });
        window.addEventListener("keydown", resume, { passive: true });
        window.addEventListener("touchstart", resume, { passive: true });
    }

    function playTone(freq, start, duration, options = {}) {
        if (!enabled || !masterGain) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const level = options.level || 0.05;

        osc.type = options.type || "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(level, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + duration + 0.08);

        activeNodes.push({ osc, gain });
        osc.addEventListener("ended", () => {
            activeNodes = activeNodes.filter((node) => node.osc !== osc);
            try { gain.disconnect(); } catch (error) {}
        });
    }

    function playChord(freqs, start, duration) {
        freqs.forEach((freq) => playTone(freq, start, duration, {
            type: "triangle",
            level: 0.016
        }));
    }

    function playBaneenLoop() {
        if (!enabled || !audioCtx) return;

        const start = audioCtx.currentTime + 0.08;
        const phrase = [
            [0.0, 392.00, 0.45], [0.5, 392.00, 0.28], [0.9, 440.00, 0.62], [1.65, 392.00, 0.62],
            [2.4, 523.25, 0.62], [3.15, 493.88, 0.9],
            [4.4, 392.00, 0.45], [4.9, 392.00, 0.28], [5.3, 440.00, 0.62], [6.05, 392.00, 0.62],
            [6.8, 587.33, 0.62], [7.55, 523.25, 0.95],
            [8.9, 329.63, 0.7], [9.75, 392.00, 0.7], [10.6, 440.00, 0.85], [11.65, 392.00, 0.95],
            [12.9, 349.23, 0.8], [13.85, 329.63, 0.8], [14.8, 293.66, 1.0], [16.0, 261.63, 1.25]
        ];
        const chords = [
            [0, [261.63, 329.63, 392.00]],
            [4.2, [220.00, 261.63, 329.63]],
            [8.4, [246.94, 293.66, 392.00]],
            [12.6, [261.63, 329.63, 392.00]]
        ];

        chords.forEach(([offset, freqs]) => playChord(freqs, start + offset, 3.8));
        phrase.forEach(([offset, freq, duration]) => {
            playTone(freq, start + offset, duration, { type: "sine", level: 0.046 });
            playTone(freq * 2, start + offset + 0.03, duration * 0.62, { type: "triangle", level: 0.01 });
        });
    }

    function startMusic() {
        if (!enabled) return;

        ensureAudio();
        started = true;
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.18);

        if (!loopTimer) {
            playBaneenLoop();
            loopTimer = window.setInterval(playBaneenLoop, 17600);
        }
        updateUi();
    }

    function stopMusic() {
        if (loopTimer) {
            window.clearInterval(loopTimer);
            loopTimer = null;
        }

        if (audioCtx && masterGain) {
            masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
            masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
        }

        activeNodes.forEach(({ osc, gain }) => {
            try { gain.gain.cancelScheduledValues(audioCtx.currentTime); } catch (error) {}
            try { gain.gain.setValueAtTime(0, audioCtx.currentTime); } catch (error) {}
            try { osc.stop(); } catch (error) {}
        });
        activeNodes = [];
        started = false;
        updateUi();
    }

    function updateUi() {
        const button = document.querySelector(".birthday-music-toggle");
        if (!button) return;

        button.textContent = enabled ? "🔊" : "🔇";
        button.classList.toggle("is-off", !enabled);
        button.setAttribute("aria-label", enabled ? "Turn background music off" : "Turn background music on");
        button.title = enabled ? "Music on" : "Music off";
    }

    document.addEventListener("DOMContentLoaded", createUi);
})();
