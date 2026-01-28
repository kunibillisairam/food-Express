const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['Credit', 'Debit'], required: true },
    amount: { type: Number, required: true },
    description: String,
    date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In a real app, hash this!
    phone: { type: String, required: true },
    address: { type: String, default: '' },
    walletBalance: { type: Number, default: 0 },
    credits: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    rank: { type: String, default: 'Cadet' },
    transactions: [transactionSchema],
    usedCoupons: { type: [String], default: [] },
    role: { type: String, default: 'user' },
    fcmTokens: { type: [String], default: [] }, // Multi-device support
    fcmToken: { type: String, default: '' } // Legacy Fallback
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
