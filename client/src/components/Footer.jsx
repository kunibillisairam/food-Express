import React from 'react';

const Footer = () => {
    return (
        <footer className="footer-section" id="contact">
            <div className="footer-content">
                <div className="footer-logo">FoodExpress</div>
                <div className="footer-links-minimal">
                    <a href="#">Home</a>
                    <a href="#about">About</a>
                    <a href="#food-explore">Menu</a>
                    <a href="#contact">Contact</a>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 FoodExpress. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;

