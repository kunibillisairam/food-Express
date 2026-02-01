const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['friday', 'festival', 'monday', 'end_of_month', 'custom', 'happy_hour'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    emoji: {
        type: String,
        default: '🎉'
    },
    description: {
        type: String,
        required: true
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    autoTrigger: {
        type: Boolean,
        default: true
    },
    foodCategories: [{
        type: String // e.g., 'pizza', 'healthy', 'all'
    }],
    targetTags: [{
        type: String // e.g., 'vegetarian', 'non-veg', 'beverages'
    }],
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    // For Scheduling
    scheduledTime: {
        type: Date
    },
    // For Happy Hour
    startTime: {
        type: String // "HH:MM" 24h format
    },
    endTime: {
        type: String // "HH:MM" 24h format
    },
    festivalName: {
        type: String // For festival type campaigns
    },
    festivalDate: {
        type: Date // Specific festival date
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    lastTriggered: {
        type: Date
    },
    createdBy: {
        type: String,
        default: 'system'
    }
}, {
    timestamps: true
});

// Index for efficient querying
campaignSchema.index({ type: 1, isActive: 1 });
campaignSchema.index({ festivalDate: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
