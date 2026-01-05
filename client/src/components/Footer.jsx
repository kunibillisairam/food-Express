import React from 'react';

const Footer = () => {
    return (
        <footer className="footer-section" id="contact">
            <div className="footer-content">
                <div className="footer-col">
                    <h3 className="footer-logo">FoodExpress</h3>
                    <p className="footer-text">
                        Craving something delicious? We've got you covered.
                        Order now and experience the taste of quality.
                    </p>
                    <div className="social-links">
                        <span className="social-icon">Instagram</span>
                        <span className="social-icon">Facebook</span>
                        <span className="social-icon">Twitter</span>
                    </div>
                </div>

                <div className="footer-col">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#">Home</a></li>
                        <li><a href="#about">About Us</a></li>
                        <li><a href="#">Menu</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Contact Us</h4>
                    <ul>
                        <li>📍 123 Foodie Lane, Flavor Town</li>
                        <li>📞 +91 98765 43210</li>
                        <li>✉️ support@foodexpress.com</li>
                        <li>⏰ Mon-Sun: 10am - 11pm</li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Newsletter</h4>
                    <p className="footer-text">Subscribe for latest offers!</p>
                    <div className="newsletter-form">
                        <input type="email" placeholder="Your Email" />
                        <button>Subscribe</button>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 FoodExpress. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
