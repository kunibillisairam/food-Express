import { useRef, useCallback } from 'react';

// Using online sound effects for immediate functionality
const SOUNDS = {
    hover: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", // Short digital blip
    click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", // Mechanical click
    success: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3", // Success chime
    error: "https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3", // Error buzz
    scan: "https://assets.mixkit.co/active_storage/sfx/2324/2324-preview.mp3" // Sci-fi scan
};

export const useSound = () => {
    // We use refs to keep track of Audio objects without re-rendering
    const audioRefs = useRef({});

    // Initialize audio objects lazily
    const getAudio = (type) => {
        if (!audioRefs.current[type]) {
            audioRefs.current[type] = new Audio(SOUNDS[type]);
            audioRefs.current[type].volume = 0.4; // not too loud
        }
        return audioRefs.current[type];
    };

    const playSound = useCallback((type) => {
        try {
            const audio = getAudio(type);
            audio.currentTime = 0; // Reset to start
            audio.play().catch(e => console.log("Audio play failed (user interaction needed first)"));
        } catch (err) {
            console.error("Sound error", err);
        }
    }, []);

    return { playSound };
};

export default useSound;
