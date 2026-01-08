const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    foodId: { type: Number, required: true }, // Matches id in foodData.js
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    isVerifiedPurchase: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
