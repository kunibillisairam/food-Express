
let audioCtx = null;

const getAudioContext = () => {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    return audioCtx;
};

export const playSciFiClick = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => console.warn('AudioContext resume failed', err));
    }

    const t = ctx.currentTime;

    // Create oscillator
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sci-fi friendly sine/triangle mix? just sine is cleaner
    osc.type = 'sine';

    // Frequency sweep for "beep" with random variation
    const startFreq = 1000 + Math.random() * 400; // 1000-1400Hz
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, t + 0.1);

    // Volume envelope (clicky)
    gainNode.gain.setValueAtTime(0.05, t); // quiet
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.1);
};

export const playBoop = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch((err) => console.warn('AudioContext resume failed', err));

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.15);

    gainNode.gain.setValueAtTime(0.05, t);
    gainNode.gain.linearRampToValueAtTime(0, t + 0.15);

    osc.start(t);
    osc.stop(t + 0.15);
}

export const initGlobalSound = () => {
    const handleClick = (e) => {
        // Intercept clicks on interactive elements
        const interactive = e.target.closest('button, a, [role="button"], input[type="button"], input[type="submit"], .clickable');
        if (interactive) {
            playSciFiClick();
        }
    };

    window.addEventListener('click', handleClick);

    // Return cleanup function
    return () => {
        window.removeEventListener('click', handleClick);
    };
};
