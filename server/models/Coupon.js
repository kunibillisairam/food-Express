const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscountAmount: {
        type: Number,
        default: null // null means no limit
    },
    usageLimit: {
        type: Number,
        default: null // null means unlimited
    },
    usageCount: {
        type: Number,
        default: 0
    },
    perUserLimit: {
        type: Number,
        default: 1 // How many times a single user can use this coupon
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        default: ''
    },
    applicableCategories: [{
        type: String
    }], // Empty array means all categories
    createdBy: {
        type: String,
        default: 'admin'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
couponSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
    const now = new Date();

    // Check if active
    if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };

    // Check date validity
    if (now < this.validFrom) return { valid: false, reason: 'Coupon not yet valid' };
    if (now > this.validUntil) return { valid: false, reason: 'Coupon has expired' };

    // Check usage limit
    if (this.usageLimit && this.usageCount >= this.usageLimit) {
        return { valid: false, reason: 'Coupon usage limit reached' };
    }

    return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (orderAmount) {
    if (orderAmount < this.minOrderAmount) {
        return {
            discount: 0,
            error: `Minimum order amount of ₹${this.minOrderAmount} required`
        };
    }

    let discount = 0;

    if (this.discountType === 'percentage') {
        discount = (orderAmount * this.discountValue) / 100;

        // Apply max discount cap if set
        if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
            discount = this.maxDiscountAmount;
        }
    } else {
        discount = this.discountValue;
    }

    // Discount cannot exceed order amount
    discount = Math.min(discount, orderAmount);

    return {
        discount: Math.round(discount),
        finalAmount: Math.round(orderAmount - discount)
    };
};

module.exports = mongoose.model('Coupon', couponSchema);
