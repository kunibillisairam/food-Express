import React, { useState, useEffect, useContext } from 'react';
import { foodData } from '../data/foodData';
import { CartContext } from '../context/CartContext';
import './VoiceCommander.css';
import useSound from '../hooks/useSound';

const VoiceCommander = ({ setView, setSearchTerm, setCategory }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [message, setMessage] = useState('');
    const { addToCart } = useContext(CartContext);
    const { playSound } = useSound();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
    }

    const startListening = () => {
        if (!recognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        playSound('scan');
        setIsListening(true);
        setTranscript('');
        setMessage('Listening for command...');
        recognition.start();
    };

    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript.toLowerCase();
            setTranscript(result);
            processCommand(result);
        };

        recognition.onspeechend = () => {
            recognition.stop();
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            setMessage("Error: " + event.error);
        };
    }, []);

    const processCommand = (cmd) => {
        let cleanCmd = cmd.replace(/^computer,?/, '').trim();
        setMessage(`Detected: "${cleanCmd}"`);

        // Search Command
        if (cleanCmd.includes('search for')) {
            const query = cleanCmd.split('search for')[1].trim();
            setSearchTerm(query);
            setCategory('All');
            setView('home');
            setMessage(`Searching for ${query}...`);
            playSound('click');
        }
        // Add to Cart Command
        else if (cleanCmd.includes('add') && cleanCmd.includes('to cart')) {
            const itemName = cleanCmd.replace('add', '').replace('to cart', '').trim();
            const item = foodData.find(f => f.name.toLowerCase().includes(itemName) || itemName.includes(f.name.toLowerCase()));

            if (item) {
                addToCart(item);
                setMessage(`${item.name} added to cart!`);
                playSound('click');
            } else {
                setMessage(`Could not find "${itemName}"`);
            }
        }
        else {
            setMessage("Unknown command. Try 'search for burgers' or 'add burger to cart'");
        }

        setTimeout(() => setMessage(''), 5000);
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
