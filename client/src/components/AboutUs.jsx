import React from 'react';

const AboutUs = () => {
    return (
        <section className="about-us-section" id="about">
            <div className="about-content">
                <div className="about-text">
                    <h2 className="section-title">Our Story</h2>
                    <p className="about-description">
                        Welcome to <strong>FoodExpress</strong>, where culinary passion meets diverse flavors.
                        Founded in 2024, we started with a simple mission: to bring the world's most
                        crave-worthy dishes to your table with speed and style.
                    </p>
                    <p className="about-description">
                        From the sizzling spice of our authentic Hyderabadi Biryanis to the comfort of our
                        classic cheese burgers, every dish is crafted with love using the freshest,
                        highest-quality ingredients. We believe food is not just fuel, but an experience
                        that brings people together.
                    </p>
                    <button className="read-more-btn">Read Our Full Story</button>
                </div>
                <div className="about-image-container">
                    <img
                        src="/images/about_us.png"
                        alt="Our Restaurant Interior"
                        className="about-image"
                    />
                    <div className="experience-badge">
                        <span className="years">10+</span>
                        <span className="text">Years of<br />Experience</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutUs;
