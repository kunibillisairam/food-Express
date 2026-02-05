import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import config from '../config';

export default function CampaignBanner() {
    const [campaigns, setCampaigns] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveCampaigns();
    }, []);

    const fetchActiveCampaigns = async () => {
        try {
            const response = await axios.get(`${config}/api/campaigns/active`);
            setCampaigns(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setCampaigns([]); // Ensure it's always an array
            setLoading(false);
        }
    };

    useEffect(() => {
        if (campaigns.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % campaigns.length);
            }, 5000); // Auto-rotate every 5 seconds
            return () => clearInterval(interval);
        }
    }, [campaigns.length]);

    if (loading || campaigns.length === 0) {
        return null;
    }

    const currentCampaign = campaigns[currentIndex];

    return (
        <div className="campaign-banner-wrapper">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentCampaign._id}
                    className="campaign-banner"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="campaign-content">
                        <span className="campaign-emoji">{currentCampaign.emoji}</span>
                        <div className="campaign-text">
                            <h3 className="campaign-title">{currentCampaign.title}</h3>
                            <p className="campaign-description">{currentCampaign.description}</p>
                        </div>
                        {currentCampaign.discountPercentage > 0 && (
                            <div className="campaign-badge">
                                {currentCampaign.discountPercentage}% OFF
                            </div>
                        )}
                    </div>

                    {campaigns.length > 1 && (
                        <div className="campaign-dots">
                            {campaigns.map((_, index) => (
                                <button
                                    key={index}
                                    className={`campaign-dot ${index === currentIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(index)}
                                    aria-label={`Go to campaign ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
