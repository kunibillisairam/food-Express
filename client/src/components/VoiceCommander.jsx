import React, { useState, useEffect, useContext } from 'react';
import { foodData, categories } from '../data/foodData';
import { CartContext } from '../context/CartContext';
import './VoiceCommander.css';
import useSound from '../hooks/useSound';

const VoiceCommander = ({ setView, setSearchTerm, setCategory }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [message, setMessage] = useState('');
    const { addToCart } = useContext(CartContext);
    const { playSound } = useSound();

    const recognition = React.useMemo(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return null;
        const rec = new SpeechRecognition();
        rec.continuous = true; // Keep listening until we manually stop or it times out
        rec.lang = 'en-US';
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        return rec;
    }, []);

    const startListening = () => {
        if (!recognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        if (isListening) {
            recognition.stop();
            return;
        }

        try {
            playSound('scan');
            setTranscript('');
            setMessage('Listening...');
            recognition.start();
        } catch (err) {
            console.error("Failed to start recognition:", err);
        }
    };

    useEffect(() => {
        if (!recognition) return;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const finalResult = event.results[i][0].transcript.toLowerCase();
                    setTranscript(finalResult);
                    processCommand(finalResult);
                    recognition.stop(); // Stop after a command is detected
                } else {
                    interimTranscript += event.results[i][0].transcript;
                    setTranscript(interimTranscript);
                }
            }
        };

        recognition.onerror = (event) => {
            if (event.error !== 'no-speech') {
                console.error("Speech recognition error:", event.error);
                setMessage("Error: " + event.error);
                setIsListening(false);
            }
        };

        return () => {
            recognition.stop();
        };
    }, [recognition]);

    const processCommand = (cmd) => {
        let cleanCmd = cmd.replace(/^computer,?/, '').trim();
        setMessage(`Detected: "${cleanCmd}"`);

        // 1. Navigation Commands
        const navCommands = [
            { phrases: ['cart', 'basket', 'checkout'], view: 'cart' },
            { phrases: ['profile', 'account', 'my info', 'user'], view: 'profile' },
            { phrases: ['orders', 'previous', 'history'], view: 'my-orders' },
            { phrases: ['home', 'menu', 'food', 'catalogue'], view: 'home' },
            { phrases: ['pay', 'payment', 'final step'], view: 'payment' },
            { phrases: ['fabricator', 'synthesizer', 'create'], view: 'fabricator' },
            { phrases: ['delivery', 'tracker', 'track'], view: 'quantum-tracker' }
        ];

        for (const nav of navCommands) {
            if (nav.phrases.some(p => cleanCmd.includes(p)) &&
                (cleanCmd.includes('open') || cleanCmd.includes('go to') || cleanCmd.includes('show') || cleanCmd.includes('proceed'))) {
                setView(nav.view);
                setMessage(`Directing to ${nav.view.replace('-', ' ')}...`);
                playSound('success');
                setTimeout(() => { setMessage(''); setTranscript(''); }, 3000);
                return;
            }
        }

        // Special Quick Actions
        if (cleanCmd.includes('checkout') || cleanCmd.includes('payment') || cleanCmd.includes('pay now')) {
            setView('payment');
            setMessage("Initiating payment sequence...");
            playSound('success');
            setTimeout(() => { setMessage(''); setTranscript(''); }, 3000);
            return;
        }

        // 2. Flexible Search: "search for X", "find X", "show me X", "lookup X"
        const searchMatch = cleanCmd.match(/(?:search for|find|show me|look up|get|display)\s+(.+)/i);
        const searchSimple = cleanCmd.startsWith('search ') ? cleanCmd.replace('search ', '') : null;

        const query = searchMatch ? searchMatch[1].trim() : searchSimple;

        if (query) {
            setSearchTerm(query);
            setCategory('All');
            setView('home');
            setMessage(`Materializing ${query}...`);
            playSound('success');
            setTimeout(() => { setMessage(''); setTranscript(''); }, 3000);
            return;
        }

        // 3. Flexible Add to Cart: "add X to cart", "get me X", "put X in cart", "add X"
        const cartMatch = cleanCmd.match(/(?:add|put|get)\s+(.+?)(?:\s+to cart|\s+in cart|$)/i);

        if (cartMatch) {
            const itemName = cartMatch[1].trim();

            // Smarter matching
            const target = itemName.toLowerCase();
            const item = foodData.find(f => {
                const fName = f.name.toLowerCase();
                return fName === target || fName.includes(target) || target.includes(fName) ||
                    fName.split(' ').some(word => word.length > 3 && target.includes(word));
            });

            if (item) {
                addToCart(item);
                setMessage(`${item.name} synthesized!`);
                playSound('success');
                setTimeout(() => { setMessage(''); setTranscript(''); }, 3000);
                return;
            } else {
                if (itemName.length > 2) {
                    setMessage(`Could not identify "${itemName}" in database.`);
                    playSound('error');
                    setTimeout(() => { setMessage(''); setTranscript(''); }, 3000);
                }
            }
        }

        // 4. Smart Search Fallback: If just a food name or category is mentioned
        const isCategory = categories.some(cat => cat.toLowerCase() === cleanCmd || (cleanCmd.length > 3 && cat.toLowerCase().includes(cleanCmd)));
        const isItem = foodData.some(item => item.name.toLowerCase().includes(cleanCmd));

        if (isCategory || isItem) {
            setSearchTerm(cleanCmd);
            setCategory('All');
            setView('home');
            setMessage(`Locating ${cleanCmd}...`);
            playSound('success');
            setTimeout(() => {
                setMessage('');
                setTranscript('');
            }, 3000);
            return;
        }

        // 5. Reset Command: "reset", "clear", "original"
        if (cleanCmd.includes('reset') || cleanCmd.includes('clear') || cleanCmd.includes('original')) {
            setSearchTerm('');
            setCategory('All');
            setView('home');
            setMessage("Restoring original menu state...");
            playSound('success');
            setTimeout(() => {
                setMessage('');
                setTranscript('');
            }, 3000);
            return;
        }

        setMessage("Command not understood. Try 'open cart' or 'search pizza'.");
        playSound('error');

        setTimeout(() => {
            setMessage('');
            setTranscript('');
        }, 3000);
    };

    return (
        <div className="voice-commander-container">
            <button
                className={`computer-btn ${isListening ? 'listening' : ''}`}
                onClick={startListening}
                title="Voice Commands"
            >
                <div className="btn-inner">
                    <span className="computer-text">COMPUTER</span>
                    <div className="pulse-ring"></div>
                </div>
            </button>
            {message && (
                <div className="voice-feedback fade-in">
                    <div className="voice-message">{message}</div>
                    {transcript && <div className="voice-transcript">"{transcript}"</div>}
                </div>
            )}
        </div>
    );
};

export default VoiceCommander;
