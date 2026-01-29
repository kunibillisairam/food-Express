import React from 'react';
import './Company.css';

const Company = () => {
    return (
        <div className="company-page">
            {/* Hero Section */}
            <section className="company-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Culinary Excellence</h1>
                    <p className="hero-subtitle">Redefining the art of food delivery since 2024.</p>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="company-section">
                <div className="section-header">
                    <h2 className="section-title">Our Story</h2>
                </div>
                <div className="story-grid">
                    <div className="story-text">
                        <p>
                            FoodExpress began with a simple idea: that great food shouldn't be hard to get.
                            In the bustling streets of Hyderabad, we noticed a gap between premium restaurant
                            experiences and convenient home delivery.
                        </p>
                        <p>
                            Founded by a team of food enthusiasts and tech innovators, we set out to build
                            a platform that doesn't just deliver food, but delivers joy. We partner with the
                            finest local chefs and use cutting-edge technology to ensure your meal arrives
                            fresh, hot, and delicious.
                        </p>
                        <div className="story-stats">
                            <div className="stat-item">
                                <span className="stat-number">50k+</span>
                                <span className="stat-label">Happy Eaters</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">100%</span>
                                <span className="stat-label">Taste Guarantee</span>
                            </div>
                        </div>
                    </div>
                    <div className="story-img-wrapper">
                        {/* Using existing placeholder or relevant image */}
                        <img src="/images/about_us.png" alt="Our Restaurant" />
                    </div>
                </div>
            </section>

            {/* Our Values Section */}
            <section className="company-section">
                <div className="section-header">
                    <h2 className="section-title">Why Choose Us?</h2>
                </div>
                <div className="values-grid">
                    <div className="value-card">
                        <div className="value-icon">🚀</div>
                        <h3 className="value-title">Lightning Fast</h3>
                        <p className="value-desc">
                            Our advanced logistics engine ensures your food travels the shortest route to your doorstep.
                        </p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">🥗</div>
                        <h3 className="value-title">Fresh Ingredients</h3>
                        <p className="value-desc">
                            We source locally and obsess over quality. No frozen shortcuts, just fresh cooking.
                        </p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">💖</div>
                        <h3 className="value-title">Made with Love</h3>
                        <p className="value-desc">
                            Every dish is prepared by chefs who care about the craft, delivering authentic flavors.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <div className="contact-strip">
                <div className="contact-container">
                    <h2 className="contact-title">Get in Touch</h2>
                    <div className="contact-info">
                        <div className="contact-item">
                            <span>📍</span> 123 Food Street, Hyderabad, India
                        </div>
                        <div className="contact-item">
                            <span>📧</span> hello@foodexpress.com
                        </div>
                        <div className="contact-item">
                            <span>📞</span> +91 987 654 3210
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Company;
