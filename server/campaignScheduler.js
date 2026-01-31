const cron = require('node-cron');
const Campaign = require('./models/Campaign');
const User = require('./models/User');
const admin = require('firebase-admin');

// Festival calendar for India (2026)
const INDIAN_FESTIVALS = [
    { name: 'Republic Day', date: new Date('2026-01-26'), emoji: '🇮🇳' },
    { name: 'Holi', date: new Date('2026-03-14'), emoji: '🎨' },
    { name: 'Eid al-Fitr', date: new Date('2026-04-04'), emoji: '🌙' },
    { name: 'Independence Day', date: new Date('2026-08-15'), emoji: '🇮🇳' },
    { name: 'Raksha Bandhan', date: new Date('2026-08-28'), emoji: '🎀' },
    { name: 'Janmashtami', date: new Date('2026-09-06'), emoji: '🦚' },
    { name: 'Ganesh Chaturthi', date: new Date('2026-09-13'), emoji: '🐘' },
    { name: 'Dussehra', date: new Date('2026-10-13'), emoji: '🏹' },
    { name: 'Diwali', date: new Date('2026-11-01'), emoji: '🪔' },
    { name: 'Christmas', date: new Date('2026-12-25'), emoji: '🎄' },
    { name: 'New Year', date: new Date('2026-12-31'), emoji: '🎊' }
];

// Send FCM notification to all users
async function sendCampaignNotification(campaign) {
    try {
        // Fetch users who have either fcmToken (legacy) or items in fcmTokens (multi-device)
        const users = await User.find({
            $or: [
                { fcmToken: { $exists: true, $ne: null, $ne: '' } },
                { fcmTokens: { $exists: true, $not: { $size: 0 } } }
            ]
        });

        if (users.length === 0) {
            console.log('No users with FCM tokens found');
            return;
        }

        // Collect all unique tokens from all users
        let allTokens = new Set();
        users.forEach(user => {
            if (user.fcmToken) allTokens.add(user.fcmToken);
            if (user.fcmTokens && user.fcmTokens.length > 0) {
                user.fcmTokens.forEach(t => allTokens.add(t));
            }
        });

        const tokens = Array.from(allTokens).filter(token => token && token.length > 10);

        if (tokens.length === 0) {
            console.log('No valid FCM tokens found');
            return;
        }

        const message = {
            notification: {
                title: `${campaign.emoji} ${campaign.title}`,
                body: campaign.description
            },
            data: {
                type: 'campaign',
                campaignId: campaign._id.toString(),
                discount: campaign.discountPercentage.toString()
            }
        };

        // Send to all tokens in batches of 500 (FCM limit)
        const batchSize = 500;
        for (let i = 0; i < tokens.length; i += batchSize) {
            const batch = tokens.slice(i, i + batchSize);
            try {
                const response = await admin.messaging().sendEachForMulticast({
                    tokens: batch,
                    ...message
                });
                console.log(`✅ Sent campaign notification to ${response.successCount}/${batch.length} users`);
            } catch (error) {
                console.error('Error sending batch notifications:', error);
            }
        }

        // Mark notification as sent
        campaign.notificationSent = true;
        campaign.lastTriggered = new Date();
        await campaign.save();

    } catch (error) {
        console.error('Error sending campaign notifications:', error);
    }
}

// Check and trigger campaigns based on current day/date
async function checkAndTriggerCampaigns() {
    try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, 5 = Friday
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const isEndOfMonth = dayOfMonth >= daysInMonth - 2; // Last 3 days of month

        console.log(`🔍 Checking campaigns - Day: ${dayOfWeek}, Date: ${dayOfMonth}`);

        // Friday campaigns
        if (dayOfWeek === 5) {
            await handleCampaignType('friday', 'Weekend Deals 🍕',
                'Get ready for the weekend with amazing pizza deals!', 15, ['pizza', 'burgers']);
        }

        // Monday campaigns (Healthy food)
        if (dayOfWeek === 1) {
            await handleCampaignType('monday', 'Healthy Food 🥗',
                'Start your week healthy! Special discounts on salads and healthy meals.', 20, ['salads', 'healthy']);
        }

        // End of month campaigns
        if (isEndOfMonth) {
            await handleCampaignType('end_of_month', 'Cashback 💰',
                'End of month cashback! Get cashback on all orders.', 10, ['all']);
        }

        // Festival campaigns
        await checkFestivalCampaigns(now);

        // Birthday campaigns
        await checkBirthdayCampaigns(now);

    } catch (error) {
        console.error('Error in campaign scheduler:', error);
    }
}

// Check Birthday Campaigns
async function checkBirthdayCampaigns(now) {
    try {
        const month = now.getMonth() + 1; // 1-12
        const day = now.getDate();

        // Find users with birthday today
        const birthdayUsers = await User.find({
            $expr: {
                $and: [
                    { $eq: [{ $month: "$dob" }, month] },
                    { $eq: [{ $dayOfMonth: "$dob" }, day] }
                ]
            }
        });

        if (birthdayUsers.length === 0) return;

        console.log(`🎂 Found ${birthdayUsers.length} users with birthday today!`);

        // Send notifications individually (Personalized)
        for (const user of birthdayUsers) {
            // Check if we already sent birthday wish this year? 
            // We can assume scheduler runs once daily or we check a flag.
            // For simplicity, we trust the scheduler runs effectively or we accept duplicate wishes if restarted.
            // Ideally, store 'lastBirthdayWishYear' in User model. But let's skip for MVP.

            if (user.fcmToken || (user.fcmTokens && user.fcmTokens.length > 0)) {
                const tokens = [...(user.fcmTokens || []), user.fcmToken].filter(t => t && t.length > 10);
                if (tokens.length === 0) continue;

                const message = {
                    notification: {
                        title: `Happy Birthday ${user.username}! 🎂`,
                        body: `To celebrate your special day, here is a special gift for you! Use code BDAY25 for 25% OFF!`
                    },
                    data: {
                        type: 'birthday',
                        userId: user._id.toString()
                    }
                };

                // Send
                try {
                    await admin.messaging().sendEachForMulticast({ tokens, ...message });
                    console.log(`Sent birthday wish to ${user.username}`);
                } catch (e) {
                    console.error("Failed to send birthday wish", e);
                }
            }
        }

    } catch (error) {
        console.error("Error checking birthdays:", error);
    }
}

// Handle specific campaign type
async function handleCampaignType(type, title, description, discount, categories) {
    try {
        // Check if campaign already triggered today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let campaign = await Campaign.findOne({
            type: type,
            isActive: true,
            autoTrigger: true,
            lastTriggered: { $gte: today }
        });

        if (campaign) {
            console.log(`Campaign ${type} already triggered today`);
            return;
        }

        // Find or create campaign
        campaign = await Campaign.findOne({ type: type, isActive: true });

        if (!campaign) {
            // Create default campaign
            campaign = new Campaign({
                type: type,
                title: title,
                emoji: title.split(' ').pop(),
                description: description,
                discountPercentage: discount,
                foodCategories: categories,
                isActive: true,
                autoTrigger: true,
                createdBy: 'system'
            });
            await campaign.save();
            console.log(`✨ Created new ${type} campaign`);
        }

        // Send notification
        await sendCampaignNotification(campaign);
        console.log(`📢 Triggered ${type} campaign: ${title}`);

    } catch (error) {
        console.error(`Error handling ${type} campaign:`, error);
    }
}

// Check for festival campaigns
async function checkFestivalCampaigns(now) {
    try {
        // Check if today or tomorrow is a festival
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (const festival of INDIAN_FESTIVALS) {
            const festivalDate = new Date(festival.date);
            festivalDate.setHours(0, 0, 0, 0);

            // Trigger on festival day
            if (festivalDate.getTime() === today.getTime()) {
                await handleFestivalCampaign(festival, festivalDate, true);
            }

            // Pre-trigger one day before
            if (festivalDate.getTime() === tomorrow.getTime()) {
                await handleFestivalCampaign(festival, festivalDate, false);
            }
        }
    } catch (error) {
        console.error('Error checking festival campaigns:', error);
    }
}

// Handle festival campaign
async function handleFestivalCampaign(festival, festivalDate, isToday) {
    try {
        // Check if already triggered
        const campaign = await Campaign.findOne({
            type: 'festival',
            festivalName: festival.name,
            festivalDate: festivalDate,
            lastTriggered: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (campaign) {
            console.log(`Festival campaign for ${festival.name} already triggered`);
            return;
        }

        // Create or update festival campaign
        const prefix = isToday ? '' : 'Tomorrow: ';
        let festivalCampaign = await Campaign.findOne({
            type: 'festival',
            festivalName: festival.name,
            festivalDate: festivalDate
        });

        if (!festivalCampaign) {
            festivalCampaign = new Campaign({
                type: 'festival',
                title: `${prefix}${festival.name} Special`,
                emoji: festival.emoji,
                description: `${prefix}Celebrate ${festival.name} with exclusive discounts! 🎉`,
                discountPercentage: 25,
                foodCategories: ['all'],
                isActive: true,
                autoTrigger: true,
                festivalName: festival.name,
                festivalDate: festivalDate,
                createdBy: 'system'
            });
        } else {
            festivalCampaign.title = `${prefix}${festival.name} Special`;
            festivalCampaign.description = `${prefix}Celebrate ${festival.name} with exclusive discounts! 🎉`;
            festivalCampaign.isActive = true;
        }

        await festivalCampaign.save();
        await sendCampaignNotification(festivalCampaign);
        console.log(`🎊 Triggered festival campaign: ${festival.name}`);

    } catch (error) {
        console.error(`Error handling festival campaign for ${festival.name}:`, error);
    }
}

// Initialize default campaigns in database
async function initializeDefaultCampaigns() {
    try {
        const defaultCampaigns = [
            {
                type: 'friday',
                title: 'Weekend Deals',
                emoji: '🍕',
                description: 'Get ready for the weekend with amazing pizza deals!',
                discountPercentage: 15,
                foodCategories: ['pizza', 'burgers'],
                isActive: true,
                autoTrigger: true
            },
            {
                type: 'monday',
                title: 'Healthy Food',
                emoji: '🥗',
                description: 'Start your week healthy! Special discounts on salads and healthy meals.',
                discountPercentage: 20,
                foodCategories: ['salads', 'healthy'],
                isActive: true,
                autoTrigger: true
            },
            {
                type: 'end_of_month',
                title: 'Cashback',
                emoji: '💰',
                description: 'End of month cashback! Get cashback on all orders.',
                discountPercentage: 10,
                foodCategories: ['all'],
                isActive: true,
                autoTrigger: true
            }
        ];

        for (const campaignData of defaultCampaigns) {
            const existing = await Campaign.findOne({ type: campaignData.type });
            if (!existing) {
                await Campaign.create(campaignData);
                console.log(`✅ Created default ${campaignData.type} campaign`);
            }
        }

        console.log('✅ Default campaigns initialized');
    } catch (error) {
        console.error('Error initializing default campaigns:', error);
    }
}

// Start campaign scheduler
function startCampaignScheduler() {
    console.log('🚀 Starting campaign scheduler...');

    // Initialize default campaigns
    initializeDefaultCampaigns();

    // Check campaigns every hour
    cron.schedule('0 * * * *', () => {
        console.log('⏰ Running hourly campaign check...');
        checkAndTriggerCampaigns();
    });

    // Also check at 9 AM daily (prime time for notifications)
    cron.schedule('0 9 * * *', () => {
        console.log('🌅 Running morning campaign check...');
        checkAndTriggerCampaigns();
    });

    // Check immediately on startup
    setTimeout(() => {
        console.log('🔍 Running initial campaign check...');
        checkAndTriggerCampaigns();
    }, 5000); // 5 second delay after server start

    console.log('✅ Campaign scheduler started successfully');
}

module.exports = {
    startCampaignScheduler,
    checkAndTriggerCampaigns,
    sendCampaignNotification,
    INDIAN_FESTIVALS
};
