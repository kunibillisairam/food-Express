import { useCallback } from 'react';

const audioCtxContainer = {
    ctx: null
};

export const useSound = () => {

    const getContext = () => {
        if (!audioCtxContainer.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtxContainer.ctx = new AudioContext();
            }
        }
        return audioCtxContainer.ctx;
    };

    // Sci-fi Synthesizer using Web Audio API
    const playSynth = (type) => {
        try {
            const ctx = getContext();
            if (!ctx) return;

            // Mobile Browser requirement: Resume context if suspended
            if (ctx.state === 'suspended') {
                ctx.resume().catch(e => console.error("Audio resume failed", e));
            }

            // Master Gain
            const masterGain = ctx.createGain();
            masterGain.connect(ctx.destination);
            masterGain.gain.value = 1.0; // Volume

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);

            const now = ctx.currentTime;

            switch (type) {
                case 'success':
                    // Ascending Chime (Order Confirmed)
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(523.25, now); // C5
                    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
                    osc.frequency.linearRampToValueAtTime(1046.50, now + 0.3); // C6

                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

                    osc.start(now);
                    osc.stop(now + 1);
                    break;

                case 'click':
                    // Short, sharp tech click
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(1200, now);
                    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

                    osc.start(now);
                    osc.stop(now + 0.05);
                    break;

                case 'hover':
                    // Very short soft tick
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1200, now);

                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.03);

                    osc.start(now);
                    osc.stop(now + 0.05);
                    break;

                case 'scan':
                    // Complex Sci-fi 'Fabricating' Sound
                    // Oscillator 1: Base drone/sweep
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(100, now);
                    osc.frequency.linearRampToValueAtTime(600, now + 1.0); // Power up sweep

                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
                    gain.gain.setValueAtTime(0.2, now + 0.8);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

                    osc.start(now);
                    osc.stop(now + 1.0);

                    // Oscillator 2: High frequency jitter/texture
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(masterGain);

                    osc2.type = 'square';
                    osc2.frequency.setValueAtTime(400, now);
                    // Rapid frequency modulation for "data processing" feel
                    for (let i = 0; i < 10; i++) {
                        osc2.frequency.setValueAtTime(400 + (Math.random() * 500), now + (i * 0.1));
                    }

                    gain2.gain.setValueAtTime(0.05, now);
                    gain2.gain.linearRampToValueAtTime(0, now + 1.0);

                    osc2.start(now);
                    osc2.stop(now + 1.0);
                    break;

                case 'error':
                    // Buzz
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(150, now);
                    osc.frequency.linearRampToValueAtTime(100, now + 0.2);

                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

                    osc.start(now);
                    osc.stop(now + 0.3);
                    break;
                case 'init':
                    // Silent sound to unlock audio on iOS/Mobile
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, now);
                    gain.gain.setValueAtTime(0, now);
                    osc.start(now);
                    osc.stop(now + 0.01);
                    break;

                default:
                    break;
            }

        } catch (err) {
            console.error("Audio synth error:", err);
        }
    };

    const playSound = useCallback((type) => {
        playSynth(type);
    }, []);

    return { playSound };
};

export default useSound;
