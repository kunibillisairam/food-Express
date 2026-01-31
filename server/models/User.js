const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const transactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['Credit', 'Debit'], required: true },
    amount: { type: Number, required: true },
    description: String,
    date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String, default: '' },
    walletBalance: { type: Number, default: 0 },
    credits: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    rank: { type: String, default: 'Cadet' },
    transactions: [transactionSchema],
    usedCoupons: { type: [String], default: [] },
    role: { type: String, default: 'user' },
    fcmTokens: { type: [String], default: [] }, // Multi-device support
    fcmToken: { type: String, default: '' }, // Legacy Fallback

    // Reset Password Fields
    resetPasswordOTP: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    // Referral System
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null }, // Username of referrer
    isReferralRewardClaimed: { type: Boolean, default: false },

    // Personal Info
    dob: { type: Date, default: null }
}, { timestamps: true });

// Password Hashing Middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
