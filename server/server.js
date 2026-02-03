const admin = require('firebase-admin');

// Initialize Firebase Admin (Wrapped to prevent crash if key is missing)
// Initialize Firebase Admin
try {
    let serviceAccount;

    // Check for Base64 Encoded Environment Variable (Render Fix)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        try {
            const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
            serviceAccount = JSON.parse(json);
            console.log("✅ Loaded Firebase credentials from Base64 env");
        } catch (e) {
            console.error("❌ Failed to decode FIREBASE_SERVICE_ACCOUNT_BASE64:", e.message);
        }
    }
    // Fallback: Check for legacy variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            // Attempt to decode assuming it is base64
            const jsonString = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8');
            serviceAccount = JSON.parse(jsonString);
            console.log("✓ Loaded Firebase Credentials from legacy Env variable");
        } catch (e) {
            console.error("❌ Failed to decode legacy FIREBASE_SERVICE_ACCOUNT:", e.message);
        }
    }

    // Local Development Fallback
    // Local Development Fallback
    if (!serviceAccount) {
        try {
            serviceAccount = require('./serviceAccountKey.json');
            console.log("✅ Loaded Firebase credentials from local file");
        } catch (e) {
            console.log("Local serviceAccountKey.json not found.");
        }
    }

    if (serviceAccount) {
        if (!admin.apps.length) { // Prevent double initialization
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id // Explicitly set it
            });
            console.log("🔥 Firebase Admin Initialized Successfully");
            console.log(`[Firebase] Project: ${admin.app().options.projectId}`);
        }
    } else {
        console.warn("⚠️ Warning: Firebase Admin NOT initialized. Missing credentials (Check serviceAccountKey.json).");
    }
} catch (error) {
    console.error("❌ CRITICAL: Firebase Admin initialization failed:", error);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const Order = require('./models/Order');
const User = require('./models/User');
const Review = require('./models/Review');
const Campaign = require('./models/Campaign');
const Coupon = require('./models/Coupon');
const { startCampaignScheduler, sendCampaignNotification, INDIAN_FESTIVALS } = require('./campaignScheduler');

// Email Transporter for Forgot Password OTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust this in production
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Socket.io Multiplayer Logic
io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on('join-fleet', (fleetCode) => {
        socket.join(fleetCode);
        console.log(`[Socket] User ${socket.id} joined fleet: ${fleetCode}`);

        // Notify others in fleet
        socket.to(fleetCode).emit('fleet-announcement', {
            type: 'USER_JOINED',
            message: `A new member has joined the Fleet.`,
            userId: socket.id
        });
    });

    // User Room for Personal Notifications
    socket.on('join-user-room', (username) => {
        socket.join(username);
        console.log(`[Socket] User ${socket.id} joined personal room: ${username}`);
    });

    socket.on('sync-cart', ({ fleetCode, cartItems, senderName }) => {
        // Broadcast the updated cart to everyone in the room EXCEPT the sender
        socket.to(fleetCode).emit('cart-updated', {
            cartItems,
            updatedBy: senderName
        });
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] User disconnected: ${socket.id}`);
    });
});

// Middleware
app.use(cors());
app.use(bodyParser.json());


// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant_app';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        // Seed Admin
        createDefaultAdmin();
        // Start Campaign Scheduler
        startCampaignScheduler();
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// Seed Default Admin
// Seed Default Admin
async function createDefaultAdmin() {
    try {
        // Check if admin exists by username OR phone to prevent duplicate key errors
        const existingAdmin = await User.findOne({
            $or: [{ username: 'admin' }, { phone: '0000000000' }]
        });

        if (!existingAdmin) {
            const newAdmin = new User({
                username: 'admin',
                email: 'admin@foodexpress.com', // Placeholder email
                password: 'admin', // Will be hashed by pre-save
                phone: '0000000000', // Placeholder phone
                role: 'admin',
                walletBalance: 999999
            });
            await newAdmin.save();
            console.log('👑 Default Admin User Created (username: admin, password: admin)');
        } else {
            // Ensure they have admin role if they exist
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('👑 Admin role assigned to existing user found by username/phone');
            } else {
                console.log('👑 Default Admin already exists and configured.');
            }
        }
    } catch (error) {
        // Ignore duplicate key error if it happens race-condition style
        if (error.code === 11000) {
            console.log('👑 Admin creation skipped (Duplicate key detected - likely already exists).');
        } else {
            console.error('Error creating default admin:', error);
        }
    }
}

// Helper Function: Send Notification & Email to User on Admin Update
async function notifyUserOnAdminUpdate(user, updateType, details) {
    try {
        console.log(`[Admin Update Notification] Sending to ${user.username} for ${updateType}`);

        // Prepare notification message based on update type
        let notificationTitle = '';
        let notificationBody = '';
        let emailSubject = '';
        let emailBody = '';

        switch (updateType) {
            case 'username':
                notificationTitle = '🔔 Username Updated';
                notificationBody = `Your username has been changed to "${details.newUsername}" by an administrator.`;
                emailSubject = 'FoodExpress - Username Updated';
                emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0;">🔔 Account Update</h1>
                        </div>
                        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="color: #333;">Hello ${details.oldUsername || user.username},</h2>
                            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                                Your username has been updated by an administrator.
                            </p>
                            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Old Username:</strong> ${details.oldUsername || 'N/A'}</p>
                                <p style="margin: 5px 0;"><strong>New Username:</strong> <span style="color: #667eea;">${details.newUsername}</span></p>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Please use your new username for future logins.
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                                If you didn't request this change, please contact support immediately.
                            </p>
                        </div>
                    </div>
                `;
                break;

            case 'password':
                notificationTitle = '🔐 Password Reset';
                notificationBody = 'Your password has been reset by an administrator. Please check your email for the new password.';
                emailSubject = 'FoodExpress - Password Reset by Admin';
                emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
                        </div>
                        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="color: #333;">Hello ${user.username},</h2>
                            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                                Your password has been reset by an administrator for security reasons.
                            </p>
                            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                                <p style="margin: 5px 0; color: #856404;"><strong>⚠️ Important:</strong></p>
                                <p style="margin: 5px 0; color: #856404;">Your new temporary password is: <strong style="font-size: 18px; color: #d9534f;">password123</strong></p>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Please login with this temporary password and change it immediately from your profile settings.
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                                If you didn't request this change, please contact support immediately.
                            </p>
                        </div>
                    </div>
                `;
                break;

            case 'wallet':
                const walletChange = details.amount > 0 ? 'credited' : 'debited';
                const walletIcon = details.amount > 0 ? '💰' : '💸';
                notificationTitle = `${walletIcon} Wallet ${details.type}`;
                notificationBody = `₹${Math.abs(details.amount)} has been ${walletChange} to your wallet. Reason: ${details.reason}`;
                emailSubject = `FoodExpress - Wallet ${details.type}`;
                emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0;">${walletIcon} Wallet Update</h1>
                        </div>
                        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="color: #333;">Hello ${user.username},</h2>
                            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                                Your wallet has been updated by an administrator.
                            </p>
                            <div style="background: ${details.amount > 0 ? '#d4edda' : '#f8d7da'}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <p style="margin: 5px 0; color: #333; font-size: 14px;">Transaction Type</p>
                                <p style="margin: 10px 0; color: ${details.amount > 0 ? '#28a745' : '#dc3545'}; font-size: 32px; font-weight: bold;">
                                    ${details.amount > 0 ? '+' : ''}₹${Math.abs(details.amount)}
                                </p>
                                <p style="margin: 5px 0; color: #666; font-size: 14px;">${details.type}</p>
                            </div>
                            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Reason:</strong> ${details.reason}</p>
                                <p style="margin: 5px 0;"><strong>New Balance:</strong> <span style="color: #4facfe; font-size: 18px; font-weight: bold;">₹${details.newBalance}</span></p>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                You can view your complete transaction history in your profile.
                            </p>
                        </div>
                    </div>
                `;
                break;

            default:
                console.log('[Admin Update Notification] Unknown update type:', updateType);
                return;
        }

        // Send Push Notification (FCM)
        const allTokens = new Set(user.fcmTokens || []);
        if (user.fcmToken) allTokens.add(user.fcmToken);
        const targetTokens = Array.from(allTokens).filter(t => t && t.length > 10);

        if (targetTokens.length > 0 && admin.apps.length > 0) {
            try {
                const message = {
                    tokens: targetTokens,
                    notification: {
                        title: notificationTitle,
                        body: notificationBody
                    },
                    data: {
                        type: 'admin_update',
                        updateType: updateType,
                        timestamp: new Date().toISOString()
                    }
                };

                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`[FCM] Admin update notification sent: ${response.successCount} success, ${response.failureCount} failed`);
            } catch (fcmError) {
                console.error('[FCM Error] Failed to send admin update notification:', fcmError.message);
            }
        } else {
            console.log('[FCM Skip] No valid tokens for user:', user.username);
        }

        // Send Email
        if (user.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail({
                    from: `"FoodExpress" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: emailSubject,
                    html: emailBody
                });
                console.log(`[Email] Admin update notification sent to ${user.email}`);
            } catch (emailError) {
                console.error('[Email Error] Failed to send admin update notification:', emailError.message);
            }
        } else {
            console.log('[Email Skip] No email configured for user:', user.username);
        }

    } catch (error) {
        console.error('[Admin Update Notification] Error:', error);
    }
}

// Debugging: Log that routes are initializing
console.log("Initializing Routes...");

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongoConnected: mongoose.connection.readyState === 1,
        socketActive: !!io,
        firebaseInitialized: admin.apps.length > 0,
        firebaseProject: admin.apps.length > 0 ? admin.app().options.projectId : 'N/A',
        timestamp: new Date()
    });
});

// Root Route
app.get('/', (req, res) => {
    res.send('API is Running');
});


// Routes

// GET /api/orders
app.get('/api/orders', async (req, res) => {
    try {
        // Optimization: Limit to last 100 orders to prevent slow loading
        const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/user/:username -> Fetch orders for a specific user
app.get('/api/orders/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const orders = await Order.find({ userName: username }).sort({ createdAt: -1 }).limit(10);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:id -> Fetch single order
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/orders/:id -> Delete an order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Order.findByIdAndDelete(id);
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id/block
app.put('/api/users/:id/block', async (req, res) => {
    try {
        const { isBlocked } = req.body;
        await User.findByIdAndUpdate(req.params.id, { isBlocked });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id/reset-password (Admin Force Reset)
app.put('/api/users/:id/reset-password', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.password = "password123"; // Default temporary password
        await user.save(); // Middleware will hash this

        // Send notification and email about password reset
        await notifyUserOnAdminUpdate(user, 'password', {});

        res.json({ success: true, message: 'Password reset to "password123"' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id (Admin Update User Details)
app.put('/api/users/:id', async (req, res) => {
    try {
        const { username, phone, walletBalance, rank, isBlocked } = req.body;
        const userId = req.params.id;

        // Get the original user data before update
        const originalUser = await User.findById(userId);
        if (!originalUser) return res.status(404).json({ message: 'User not found' });

        // Check for duplicates (if username or phone is being updated)
        if (username || phone) {
            const query = { $or: [] };
            if (username) query.$or.push({ username });
            if (phone) query.$or.push({ phone });

            if (query.$or.length > 0) {
                const existing = await User.findOne({
                    ...query,
                    _id: { $ne: userId } // Exclude current user
                });

                if (existing) {
                    if (existing.username === username) return res.status(400).json({ message: "Username already taken" });
                    if (existing.phone === phone) return res.status(400).json({ message: "Phone number already in use" });
                }
            }
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (phone) updateData.phone = phone;
        if (walletBalance !== undefined) updateData.walletBalance = walletBalance;
        if (rank) updateData.rank = rank;
        if (isBlocked !== undefined) updateData.isBlocked = isBlocked;

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Send notifications for specific changes
        // 1. Username changed
        if (username && username !== originalUser.username) {
            await notifyUserOnAdminUpdate(user, 'username', {
                oldUsername: originalUser.username,
                newUsername: username
            });
        }

        // 2. Wallet balance changed
        if (walletBalance !== undefined && walletBalance !== originalUser.walletBalance) {
            const difference = walletBalance - originalUser.walletBalance;
            await notifyUserOnAdminUpdate(user, 'wallet', {
                type: difference > 0 ? 'Credit' : 'Debit',
                amount: difference,
                reason: 'Admin adjusted wallet balance',
                newBalance: walletBalance
            });
        }

        res.json({ success: true, user });
    } catch (err) {
        // Handle MongoDB duplicate key error specifically
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:username/favorites -> Get user favorites
app.get('/api/users/:username/favorites', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.favorites || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/favorites/toggle -> Toggle favorite status
app.post('/api/users/favorites/toggle', async (req, res) => {
    try {
        const { username, foodId } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const id = Number(foodId);
        if (user.favorites.includes(id)) {
            user.favorites = user.favorites.filter(fav => fav !== id);
        } else {
            user.favorites.push(id);
        }

        await user.save();
        res.json(user.favorites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/users/:id/transaction (Manage User Economy)
app.post('/api/admin/users/:id/transaction', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, amount, description, target } = req.body;
        // target: 'wallet', 'credits', 'xp', 'compensation'
        // type: 'Credit', 'Debit', 'Reset'

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let transactionType = type;
        let transactionDesc = description;
        let transactionAmount = Number(amount) || 0;

        if (target === 'wallet') {
            if (type === 'Credit') {
                user.walletBalance = (user.walletBalance || 0) + transactionAmount;
                transactionDesc = description || "Admin Credit";
            } else if (type === 'Debit') {
                user.walletBalance = Math.max(0, (user.walletBalance || 0) - transactionAmount);
                transactionDesc = description || "Admin Debit";
            }
        } else if (target === 'credits') {
            if (type === 'Credit') {
                user.credits = (user.credits || 0) + transactionAmount;
                transactionDesc = description || "Promo Credits";
            } else if (type === 'Debit') {
                user.credits = Math.max(0, (user.credits || 0) - transactionAmount);
                transactionDesc = description || "Admin Deduction";
            }
        } else if (target === 'xp') {
            if (type === 'Reset') {
                user.xp = 0;
                user.credits = 0; // Resetting XP usually resets associated points
                transactionDesc = "Reward Points Reset";
                transactionAmount = 0;
                transactionType = "Reset";
            }
        } else if (target === 'compensation') {
            // Special Power
            user.walletBalance = (user.walletBalance || 0) + transactionAmount;
            transactionDesc = description || "Compensation for unhappy user";
            transactionType = "Credit";
        }

        user.transactions.push({
            type: transactionType,
            amount: transactionAmount,
            description: transactionDesc,
            date: new Date()
        });

        // Recalculate rank
        user.rank = calculateRank(user.xp);

        await user.save();

        // Send notification and email for wallet changes only
        if (target === 'wallet' || target === 'compensation') {
            const actualAmount = type === 'Debit' ? -transactionAmount : transactionAmount;
            await notifyUserOnAdminUpdate(user, 'wallet', {
                type: transactionType,
                amount: actualAmount,
                reason: transactionDesc,
                newBalance: user.walletBalance
            });
        }

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/orders/:id/cancel -> Cancel an order
app.put('/api/orders/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'Cancelled') {
            order.status = 'Cancelled';

            // Deduct XP and Credits back
            const user = await User.findOne({ username: order.userName });
            if (user) {
                user.xp = Math.max(0, (user.xp || 0) - (order.earnedXp || 0));
                user.credits = Math.max(0, (user.credits || 0) - (order.earnedCredits || 0));

                // Refund used credits if any
                if (order.xpUsed > 0) {
                    const refundCredits = order.xpUsed / 10;
                    user.credits += refundCredits;
                    user.transactions.push({
                        type: 'Credit',
                        amount: refundCredits,
                        description: `Refunded ${refundCredits} CR (XP Usage) for cancelled order ${order._id}`
                    });
                }

                // Refund wallet balance if paymentMethod was wallet
                if (order.paymentMethod === 'wallet') {
                    user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
                    user.transactions.push({
                        type: 'Credit',
                        amount: order.totalAmount,
                        description: `Refund for cancelled order ${order._id}`
                    });
                }

                user.rank = calculateRank(user.xp);

                // Add debit transaction for deducted rewards
                if (order.earnedCredits > 0) {
                    user.transactions.push({
                        type: 'Debit',
                        amount: order.earnedCredits,
                        description: `Deducted ${order.earnedCredits} CR rewards for cancelled order`
                    });
                }
                await user.save();
            }
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/orders/:id/status -> Update order status (Driver)
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const oldStatus = order.status;
        order.status = status;

        // If status changed to Cancelled, deduct rewards
        if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
            const user = await User.findOne({ username: order.userName });
            if (user) {
                user.xp = Math.max(0, (user.xp || 0) - (order.earnedXp || 0));
                user.credits = Math.max(0, (user.credits || 0) - (order.earnedCredits || 0));

                // Refund used credits if any
                if (order.xpUsed > 0) {
                    const refundCredits = order.xpUsed / 10;
                    user.credits += refundCredits;
                    user.transactions.push({
                        type: 'Credit',
                        amount: refundCredits,
                        description: `Refunded ${refundCredits} CR (XP Usage) for cancelled order ${order._id}`
                    });
                }

                // Refund wallet balance if paymentMethod was wallet
                if (order.paymentMethod === 'wallet') {
                    user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
                    user.transactions.push({
                        type: 'Credit',
                        amount: order.totalAmount,
                        description: `Refund for cancelled order ${order._id}`
                    });
                }

                user.rank = calculateRank(user.xp);

                if (order.earnedCredits > 0) {
                    user.transactions.push({
                        type: 'Debit',
                        amount: order.earnedCredits,
                        description: `Deducted ${order.earnedCredits} CR rewards for cancelled order`
                    });
                }
                await user.save();
            }
        }

        const updatedOrder = await order.save();

        // Notify User via Socket
        if (order.userName) {
            io.to(order.userName).emit('order-update', {
                orderId: order._id,
                status: status,
                message: `Order #${order._id.toString().slice(-6)} is now ${status}`
            });

            // Send FCM Notification for Status Update (Multi-Device + Legacy Fallback)
            const user = await User.findOne({ username: order.userName });

            // Collect all valid tokens (Array + Legacy String)
            const allTokens = new Set(user?.fcmTokens || []);
            if (user?.fcmToken) allTokens.add(user.fcmToken);
            const targetTokens = Array.from(allTokens).filter(t => t && t.length > 10);

            if (user && targetTokens.length > 0 && admin.apps.length > 0) {
                try {
                    const message = {
                        tokens: targetTokens,
                        notification: {
                            title: `Order ${status} 🚚`,
                            body: `Your order #${order._id.toString().slice(-6)} is now ${status}.`
                        },
                        data: {
                            orderId: order._id.toString(),
                            status: status
                        }
                    };
                    console.log(`[FCM] Sending multicast message to ${targetTokens.length} tokens for order ${order._id}`);
                    const response = await admin.messaging().sendEachForMulticast(message);
                    console.log(`[FCM] Success: ${response.successCount}, Failure: ${response.failureCount}`);
                    if (response.failureCount > 0) {
                        response.responses.forEach((resp, idx) => {
                            if (!resp.success) {
                                console.error(`[FCM Error] Token ${targetTokens[idx].slice(0, 10)}... failed:`, resp.error.message);
                            }
                        });
                    }

                    // Cleanup failed tokens (Optional enhancement for later)
                } catch (fcmErr) {
                    console.error("[FCM Critical Error]", fcmErr.message);
                }
            }
        }

        res.json(updatedOrder);
    } catch (err) {
        console.error("[Order Status Update Error]", err);
        res.status(500).json({ error: err.message });
    }
});

const calculateRank = (xp) => {
    if (xp >= 2000) return 'Admiral';
    if (xp >= 1000) return 'Commander';
    if (xp >= 500) return 'Captain';
    if (xp >= 200) return 'Lieutenant';
    return 'Cadet';
};

// POST /api/orders
app.post('/api/orders', async (req, res) => {
    try {
        const { userName, items, totalAmount, couponCode, address, paymentMethod, useXp, senderToken } = req.body;
        console.log(`[Order] Received order from ${userName}, Address: ${address}, Method: ${paymentMethod}, Use XP: ${useXp}`);

        // Use case-insensitive lookup for safety
        const user = await User.findOne({ username: { $regex: new RegExp("^" + userName + "$", "i") } });
        let earnedXp = 0;
        let earnedCredits = 0;
        let xpDeducted = 0;
        let finalAmount = totalAmount;

        if (user) {
            // Handle Coupon Usage (Server-Side Verification)
            if (couponCode === 'SAI100') {
                if (user.usedCoupons.includes('SAI100')) {
                    return res.status(400).json({ message: 'Coupon SAI100 already used' });
                }
                user.usedCoupons.push('SAI100');
            }

            // Handle XP Usage (10 XP = 1 CR = 1 Rupee discount)
            if (useXp) {
                const availableCredits = user.credits || 0;
                const discountAvailable = availableCredits; // 1 credit = 1 rupee discount
                const discountToApply = Math.min(discountAvailable, totalAmount);

                if (discountToApply > 0) {
                    user.credits -= discountToApply;
                    xpDeducted = discountToApply * 10;
                    user.xp = Math.max(0, (user.xp || 0) - xpDeducted);
                    finalAmount -= discountToApply;

                    user.transactions.push({
                        type: 'Debit',
                        amount: discountToApply,
                        description: `Used ${discountToApply} CR for discount on order`
                    });
                }
            }

            // Calculate XP Reward for the order (based on final amount)
            if (finalAmount >= 100) {
                earnedXp = 10 + Math.floor((finalAmount - 100.1) / 50) * 5;
            }

            // 10 XP = 1 CR reward
            earnedCredits = earnedXp / 10;

            user.xp = (user.xp || 0) + earnedXp;
            user.credits = (user.credits || 0) + earnedCredits;
            user.rank = calculateRank(user.xp);

            // Add transaction for rewards
            if (earnedCredits > 0) {
                user.transactions.push({
                    type: 'Credit',
                    amount: earnedCredits,
                    description: `Earned ${earnedCredits} CR from Order XP`
                });
            }
            await user.save();
        }

        // --- REFERRAL & CASHBACK SYSTEM ---
        if (user && user.referredBy && !user.isReferralRewardClaimed && finalAmount >= 100) {
            try {
                // Award Referrer
                const referrer = await User.findOne({ username: user.referredBy });
                if (referrer) {
                    referrer.walletBalance = (referrer.walletBalance || 0) + 50;
                    referrer.transactions.push({
                        type: 'Credit',
                        amount: 50,
                        description: `Referral Bonus: ${user.username} placed first order!`,
                        date: new Date()
                    });
                    await referrer.save();

                    // Notify Referrer (Optional: Add FCM here specifically for them)
                }

                // Award Current User (Cashback)
                user.walletBalance = (user.walletBalance || 0) + 50;
                user.transactions.push({
                    type: 'Credit',
                    amount: 50,
                    description: `Welcome Bonus: First Order Cashback`,
                    date: new Date()
                });

                user.isReferralRewardClaimed = true;
                await user.save(); // Save user again with new balance

                console.log(`[Referral] Awarded ₹50 to ${referrer?.username} and ${user.username}`);
            } catch (refErr) {
                console.error("[Referral Error]", refErr);
            }
        }
        // ----------------------------------

        const randomOrderId = Math.floor(100000 + Math.random() * 900000).toString();

        const newOrder = new Order({
            userName,
            items,
            totalAmount: finalAmount,
            address,
            paymentMethod,
            earnedXp,
            earnedCredits,
            xpUsed: xpDeducted,
            orderId: randomOrderId
        });

        let savedOrder;
        try {
            savedOrder = await newOrder.save();
        } catch (saveErr) {
            console.error("[Order Save Error]", saveErr);
            return res.status(500).json({ error: "Database save failed", details: saveErr.message });
        }

        // Automatically delete orders beyond the last 10 for this user
        try {
            const userOrders = await Order.find({ userName }).sort({ createdAt: -1 });
            if (userOrders.length > 10) {
                const ordersToDelete = userOrders.slice(10);
                const idsToDelete = ordersToDelete.map(o => o._id);
                await Order.deleteMany({ _id: { $in: idsToDelete } });
                console.log(`[Cleanup] Deleted ${idsToDelete.length} old orders for ${userName}`);
            }
        } catch (cleanupErr) {
            console.error("[Cleanup Error]", cleanupErr);
        }

        // Collect all tokens and filter out the one that sent the request (senderToken)
        const allTokens = new Set(user?.fcmTokens || []);
        if (user?.fcmToken) allTokens.add(user.fcmToken);

        // PRODUCTION LOGIC: Exclude the device that placed the order
        const targetTokens = Array.from(allTokens).filter(t => t && t.length > 10 && t !== senderToken);

        console.log('[FCM Debug] Notification target check:');
        console.log(`[FCM Debug] User: ${user?.username}`);
        console.log(`[FCM Debug] Sender Token (Excluded): ${senderToken ? senderToken.substring(0, 10) + '...' : 'None'}`);
        console.log(`[FCM Debug] Final Target Count: ${targetTokens.length}`);

        if (user && targetTokens.length > 0 && admin.apps.length > 0) {
            try {
                console.log(`[FCM] Sending to ${targetTokens.length} devices for ${user.username}...`);
                console.log(`[FCM] Targets: ${targetTokens.map(t => t.substring(0, 10) + '...').join(', ')}`);

                const message = {
                    tokens: targetTokens,
                    notification: {
                        title: "🍕 Order Placed Successfully",
                        body: "Your order has been confirmed!"
                    },
                    data: {
                        orderId: savedOrder._id.toString(),
                        shortId: randomOrderId,
                        status: "confirmed"
                    }
                };

                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`[FCM] ✓ Sent: ${response.successCount}, ❌ Failed: ${response.failureCount}`);

                // --- FAULT TOLERANCE: AUTOMATIC TOKEN CLEANUP ---
                if (response.failureCount > 0) {
                    const failedTokens = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            const errorCode = resp.error.code;
                            const errorMessage = resp.error.message;
                            const failedToken = targetTokens[idx];

                            console.error(`[FCM Details] Token failure: ${errorCode} - ${errorMessage}`);

                            if (errorCode === 'messaging/registration-token-not-registered' ||
                                errorCode === 'messaging/invalid-argument') {
                                failedTokens.push(failedToken);
                            }
                        }
                    });

                    if (failedTokens.length > 0) {
                        try {
                            await User.updateOne(
                                { _id: user._id },
                                { $pull: { fcmTokens: { $in: failedTokens } } }
                            );
                            console.log(`[FCM Cleanup] Removed ${failedTokens.length} invalid/expired tokens.`);
                        } catch (cleanupErr) {
                            console.error("[FCM Cleanup Error]", cleanupErr);
                        }
                    }
                }
                // ------------------------------------------------
            } catch (fcmError) {
                console.error(`[FCM Error] Multi-cast failed:`, fcmError.message);
            }
        }
        else {
            console.log("[FCM Skip] No valid tokens found or Admin not initialized.");
        }
        // ------------------------------

        const orderObj = savedOrder.toObject ? savedOrder.toObject() : savedOrder;
        res.status(201).json({ ...orderObj, earnedXp, earnedCredits, xpUsed: xpDeducted });
    } catch (err) {
        console.error("[Critical Order Error]", err);
        res.status(500).json({ error: "Order placement failed", message: err.message });
    }
});

// ========== CAMPAIGN ROUTES ==========

// GET /api/campaigns - Get all campaigns
app.get('/api/campaigns', async (req, res) => {
    try {
        const campaigns = await Campaign.find().sort({ createdAt: -1 });
        res.json(campaigns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/campaigns/active - Get currently active campaigns
app.get('/api/campaigns/active', async (req, res) => {
    try {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const isEndOfMonth = dayOfMonth >= daysInMonth - 2;

        const activeCampaigns = [];

        // Get all active campaigns
        const allActive = await Campaign.find({ isActive: true });

        for (const campaign of allActive) {
            let shouldInclude = false;

            // Check based on campaign type
            if (campaign.type === 'friday' && dayOfWeek === 5) {
                shouldInclude = true;
            } else if (campaign.type === 'monday' && dayOfWeek === 1) {
                shouldInclude = true;
            } else if (campaign.type === 'end_of_month' && isEndOfMonth) {
                shouldInclude = true;
            } else if (campaign.type === 'festival' && campaign.festivalDate) {
                const festDate = new Date(campaign.festivalDate);
                festDate.setHours(0, 0, 0, 0);
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);

                // Show if today is festival or 1 day before
                const diffDays = Math.floor((festDate - today) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 1) {
                    shouldInclude = true;
                }
            } else if (campaign.type === 'custom') {
                // Check date range for custom campaigns
                if (campaign.startDate && campaign.endDate) {
                    if (now >= new Date(campaign.startDate) && now <= new Date(campaign.endDate)) {
                        shouldInclude = true;
                    }
                } else {
                    shouldInclude = true; // Always active custom campaigns
                }
            }

            if (shouldInclude) {
                activeCampaigns.push(campaign);
            }
        }

        res.json(activeCampaigns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/campaigns/festivals - Get festival calendar
app.get('/api/campaigns/festivals', (req, res) => {
    res.json(INDIAN_FESTIVALS);
});

// POST /api/campaigns - Create new campaign (Admin)
app.post('/api/campaigns', async (req, res) => {
    try {
        const campaignData = req.body;
        const newCampaign = new Campaign(campaignData);
        const savedCampaign = await newCampaign.save();
        res.status(201).json(savedCampaign);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/campaigns/:id - Update campaign (Admin)
app.put('/api/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const campaign = await Campaign.findByIdAndUpdate(id, updates, { new: true });
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        res.json(campaign);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/campaigns/:id - Delete campaign (Admin)
app.delete('/api/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Campaign.findByIdAndDelete(id);
        res.json({ message: 'Campaign deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/campaigns/:id/send - Manually send campaign notification (Admin)
app.post('/api/campaigns/:id/send', async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        await sendCampaignNotification(campaign);
        res.json({ message: 'Campaign notification sent successfully', campaign });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== COUPON ROUTES ====================

// GET /api/coupons - Get all coupons (Admin)
app.get('/api/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/coupons/active - Get active coupons (User)
app.get('/api/coupons/active', async (req, res) => {
    try {
        const now = new Date();
        const activeCoupons = await Coupon.find({
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now }
        }).select('-usageCount'); // Hide usage count from users
        res.json(activeCoupons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/coupons/:code/validate - Validate a coupon code
app.get('/api/coupons/:code/validate', async (req, res) => {
    try {
        const { code } = req.params;
        const { orderAmount, username } = req.query;

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ valid: false, message: 'Invalid coupon code' });
        }

        // Check if coupon is valid
        const validityCheck = coupon.isValid();
        if (!validityCheck.valid) {
            return res.json({ valid: false, message: validityCheck.reason });
        }

        // Check per-user limit
        if (username) {
            const user = await User.findOne({ username });
            if (user && user.usedCoupons) {
                const usageCount = user.usedCoupons.filter(c => c === code.toUpperCase()).length;
                if (usageCount >= coupon.perUserLimit) {
                    return res.json({ valid: false, message: 'You have already used this coupon' });
                }
            }
        }

        // Calculate discount if order amount provided
        if (orderAmount) {
            const discountResult = coupon.calculateDiscount(parseFloat(orderAmount));
            if (discountResult.error) {
                return res.json({ valid: false, message: discountResult.error });
            }
            return res.json({
                valid: true,
                coupon: {
                    code: coupon.code,
                    description: coupon.description,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    minOrderAmount: coupon.minOrderAmount
                },
                discount: discountResult.discount,
                finalAmount: discountResult.finalAmount
            });
        }

        res.json({
            valid: true,
            coupon: {
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderAmount: coupon.minOrderAmount
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/coupons - Create new coupon (Admin)
app.post('/api/coupons', async (req, res) => {
    try {
        const couponData = req.body;

        // Convert code to uppercase
        if (couponData.code) {
            couponData.code = couponData.code.toUpperCase();
        }

        const newCoupon = new Coupon(couponData);
        const savedCoupon = await newCoupon.save();
        res.status(201).json(savedCoupon);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/coupons/:id - Update coupon (Admin)
app.put('/api/coupons/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Convert code to uppercase if being updated
        if (updates.code) {
            updates.code = updates.code.toUpperCase();
        }

        const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json(coupon);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/coupons/:id - Delete coupon (Admin)
app.delete('/api/coupons/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json({ message: 'Coupon deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/coupons/:code/apply - Apply coupon to order (Internal use during order creation)
app.post('/api/coupons/:code/apply', async (req, res) => {
    try {
        const { code } = req.params;
        const { username, orderAmount } = req.body;

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        // Validate coupon
        const validityCheck = coupon.isValid();
        if (!validityCheck.valid) {
            return res.status(400).json({ message: validityCheck.reason });
        }

        // Check per-user limit
        const user = await User.findOne({ username });
        if (user && user.usedCoupons) {
            const usageCount = user.usedCoupons.filter(c => c === code.toUpperCase()).length;
            if (usageCount >= coupon.perUserLimit) {
                return res.status(400).json({ message: 'You have already used this coupon' });
            }
        }

        // Calculate discount
        const discountResult = coupon.calculateDiscount(orderAmount);
        if (discountResult.error) {
            return res.status(400).json({ message: discountResult.error });
        }

        // Increment usage count
        coupon.usageCount += 1;
        await coupon.save();

        // Add to user's used coupons
        if (user) {
            if (!user.usedCoupons) {
                user.usedCoupons = [];
            }
            user.usedCoupons.push(code.toUpperCase());
            await user.save();
        }

        res.json({
            success: true,
            discount: discountResult.discount,
            finalAmount: discountResult.finalAmount,
            coupon: {
                code: coupon.code,
                description: coupon.description
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== END COUPON ROUTES ====================


// POST /api/notifications/send - Send Direct Message (Admin)
app.post('/api/notifications/send', async (req, res) => {
    try {
        const { title, body, targetGroup, targetUserId } = req.body;
        console.log(`[Notification] Sending '${title}' to group: ${targetGroup}`);

        let query = {};

        // Target Logic
        if (targetGroup === 'active') {
            // Users with orders in last 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const recentOrders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } }).distinct('userName');
            query = { username: { $in: recentOrders } };
        } else if (targetGroup === 'inactive') {
            // Users with NO orders in last 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const recentOrders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } }).distinct('userName');
            query = { username: { $nin: recentOrders } };
        } else if (targetGroup === 'specific' && targetUserId) {
            query = { _id: targetUserId };
        }
        // 'all' is default empty query {}

        const users = await User.find(query);

        // Collect tokens
        let tokens = [];
        users.forEach(u => {
            if (u.fcmTokens && u.fcmTokens.length > 0) tokens.push(...u.fcmTokens);
            if (u.fcmToken) tokens.push(u.fcmToken);
        });

        // Remove duplicates and invalid
        tokens = [...new Set(tokens)].filter(t => t && t.length > 10);

        if (tokens.length === 0) {
            return res.json({ success: false, message: 'No accessible devices found for this target group.' });
        }

        // Send via FCM
        const message = {
            tokens: tokens,
            notification: {
                title: title,
                body: body
            },
            data: {
                type: 'admin_broadcast',
                timestamp: new Date().toISOString()
            }
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`[Notification] Sent to ${response.successCount} devices.`);

        res.json({
            success: true,
            sentCount: response.successCount,
            failureCount: response.failureCount,
            targetCount: users.length
        });

    } catch (err) {
        console.error("[Notification Error]", err);
        res.status(500).json({ error: err.message });
    }
});

// Review Routes

// GET /api/reviews/summary -> Get average ratings for all food items
app.get('/api/reviews/summary', async (req, res) => {
    try {
        // Fallback to JS aggregation to ensure stability
        const allReviews = await Review.find({}, 'foodId rating').lean(); // Optimization: Only fetch needed fields

        const summaryMap = {};
        allReviews.forEach(r => {
            const fid = r.foodId;
            if (!summaryMap[fid]) {
                summaryMap[fid] = { total: 0, count: 0 };
            }
            summaryMap[fid].total += r.rating;
            summaryMap[fid].count += 1;
        });

        const summary = Object.keys(summaryMap).map(fid => ({
            _id: isNaN(Number(fid)) ? fid : Number(fid),
            averageRating: summaryMap[fid].total / summaryMap[fid].count,
            count: summaryMap[fid].count
        }));

        res.json(summary);
    } catch (err) {
        console.error("[Review Summary Error]", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reviews/:foodId
app.get('/api/reviews/:foodId', async (req, res) => {
    try {
        const reviews = await Review.find({ foodId: req.params.foodId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reviews
app.post('/api/reviews', async (req, res) => {
    try {
        const { foodId, userName, rating, comment } = req.body;
        const newReview = new Review({
            foodId,
            userName,
            rating,
            comment,
            isVerifiedPurchase: true
        });
        const savedReview = await newReview.save();
        res.status(201).json(savedReview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth Routes
// GET /api/users -> Fetch all users (Admin)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id/block -> Block/Unblock User (Admin)
app.put('/api/users/:id/block', async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;
        const user = await User.findByIdAndUpdate(id, { isBlocked }, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/dashboard -> Admin Analytics
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Daily Metrics
        const dailyOrders = await Order.countDocuments({ createdAt: { $gte: today } });
        const dailyRevenueAgg = await Order.aggregate([
            { $match: { createdAt: { $gte: today }, status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const dailyRevenue = dailyRevenueAgg.length > 0 ? dailyRevenueAgg[0].total : 0;

        // Monthly Metrics
        const monthlyOrders = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
        const monthlyRevenueAgg = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const monthlyRevenue = monthlyRevenueAgg.length > 0 ? monthlyRevenueAgg[0].total : 0;

        // Popular Items
        const popularItems = await Order.aggregate([
            { $unwind: '$items' },
            { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            dailyOrders,
            dailyRevenue,
            monthlyOrders,
            monthlyRevenue,
            popularItems
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/redeem-xp - Redeem XP for Wallet Balance
app.post('/api/users/redeem-xp', async (req, res) => {
    try {
        const { username, xpAmount } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(404).json({ message: 'User not found' });
        if ((user.xp || 0) < xpAmount) return res.status(400).json({ message: 'Insufficient XP' });

        // Rate: 10 XP = 1 Credit (Rupee)
        const redeemAmount = Math.floor(xpAmount / 10);
        if (redeemAmount < 1) return res.status(400).json({ message: 'Minimum 10 XP required to redeem ₹1.' });

        user.xp -= (redeemAmount * 10);
        user.walletBalance = (user.walletBalance || 0) + redeemAmount;

        user.transactions.push({
            type: 'Credit',
            amount: redeemAmount,
            description: `Redeemed ${redeemAmount * 10} XP`,
            date: new Date()
        });

        // Recalculate Rank
        user.rank = calculateRank(user.xp);

        await user.save();
        res.json({
            success: true,
            newBalance: user.walletBalance,
            newXp: user.xp,
            newRank: user.rank,
            message: `Successfully redeemed ₹${redeemAmount}!`
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password, phone, referralCode } = req.body;
        console.log(`[Signup Attempt] User: ${username}, Email: ${email}, Phone: ${phone}`);

        // Check if user exists (by username, email, or phone)
        const existingUser = await User.findOne({
            $or: [{ username }, { email }, { phone }]
        });

        if (existingUser) {
            let field = 'User';
            if (existingUser.username === username) field = 'Username';
            else if (existingUser.email === email) field = 'Email';
            else if (existingUser.phone === phone) field = 'Phone number';
            return res.status(400).json({ message: `${field} already registered` });
        }

        // Generate unique referral code for new user
        const myReferralCode = (username.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900)).replace(/\s/g, '');

        let referredBy = null;
        if (referralCode) {
            const referrer = await User.findOne({ referralCode: referralCode });
            if (referrer) {
                referredBy = referrer.username;
            }
        }

        const newUser = new User({
            username,
            email,
            password, // Will be hashed by mongoose middleware
            phone,
            referralCode: myReferralCode,
            referredBy: referredBy
        });

        await newUser.save();
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { phone, password, username } = req.body; // Accept both for backward/admin support



        // Note: Admin credentials are now stored in the database.
        // The default admin is seeded on server start if not exists: user: 'admin', pass: 'admin'

        // Find user by phone (new primary) or username (legacy fallback)
        const user = await User.findOne({
            $or: [{ phone: phone || '' }, { username: username || phone || '' }]
        });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if blocked
        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
        }

        // Check password using bcrypt method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/forgot-password -> Send OTP to Email
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
        await user.save();

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'FoodExpress Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #ff4757;">FoodExpress Password Reset</h2>
                    <p>Hello ${user.username},</p>
                    <p>Your OTP for resetting password is:</p>
                    <div style="font-size: 24px; font-weight: bold; padding: 10px; background: #f8f9fa; text-align: center; border-radius: 5px;">
                        ${otp}
                    </div>
                    <p>This OTP is valid for 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            res.json({ success: true, message: 'OTP sent to your email' });
        } else {
            console.log("SIMULATING EMAIL (No Credentials): OTP is", otp);
            res.json({ success: true, message: 'OTP sent (Simulation Mode: Check Server Logs)', otp: otp });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ success: true, message: 'OTP verified' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP session' });
        }

        // Update password and clear OTP
        user.password = newPassword; // Hashing handled by pre-save
        user.resetPasswordOTP = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:username -> Fetch User Details
app.get('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/test-notification - Send self-test notification
app.post('/api/users/test-notification', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(404).json({ error: "User not found" });

        // Hybrid Token Collection
        const allTokens = new Set(user.fcmTokens || []);
        if (user.fcmToken) allTokens.add(user.fcmToken);
        const targetTokens = Array.from(allTokens).filter(t => t && t.length > 10);

        if (targetTokens.length === 0) {
            return res.status(400).json({ error: "No FCM Tokens found for this user." });
        }

        console.log(`[Test FCM] Sending to ${targetTokens.length} devices for ${username}`);

        const message = {
            tokens: targetTokens,
            notification: {
                title: "🔔 Test Notification",
                body: "If you see this, your Mobile App is fully connected! 🚀"
            },
            data: {
                type: "test",
                timestamp: new Date().toISOString()
            }
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`[Test FCM] Success: ${response.successCount}, Failed: ${response.failureCount}`);

        res.json({
            success: true,
            attempted: targetTokens.length,
            sent: response.successCount,
            failed: response.failureCount
        });

    } catch (err) {
        console.error("Test Notification Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Helper to safely associate FCM token with a user and remove it from others (Shared device fix)
async function associateFcmToken(username, token) {
    if (!token || !username) return;

    // 1. Remove this token from EVERY other user (Clean up shared devices)
    // We search both array and legacy field
    const cleaningResult = await User.updateMany(
        { $or: [{ fcmTokens: token }, { fcmToken: token }] },
        {
            $pull: { fcmTokens: token },
            $set: { fcmToken: '' }
        }
    );

    if (cleaningResult.modifiedCount > 0) {
        console.log(`[FCM] Token detached from ${cleaningResult.modifiedCount} previous accounts.`);
    }

    // 2. Add to the new user (case-insensitive username search for safety)
    const updateResult = await User.findOneAndUpdate(
        { username: { $regex: new RegExp("^" + username + "$", "i") } },
        {
            $addToSet: { fcmTokens: token },
            $set: { fcmToken: token } // Keep legacy field synced
        },
        { new: true }
    );

    if (updateResult) {
        console.log(`[FCM] Token associated with ${updateResult.username}. Current token count: ${updateResult.fcmTokens.length}`);
    } else {
        console.error(`[FCM Error] Could not find user ${username} to associate token.`);
    }
}

// POST /api/users/save-fcm-token -> Save Multi-Device Token
app.post('/api/users/save-fcm-token', async (req, res) => {
    try {
        const { username, token } = req.body;

        if (!token) return res.status(400).json({ message: "Token missing" });
        if (!username) return res.status(400).json({ message: "Username missing" });

        await associateFcmToken(username, token);
        res.json({ success: true });
    } catch (err) {
        console.error("Save token error:", err);
        res.status(500).json({ message: "Failed to save token" });
    }
});

// PUT /api/users/:username -> Update User (Address, Wallet)
// PUT /api/users/:username -> Update User (Address, Wallet, FCM)
app.put('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const updates = req.body;

        // Special handling for FCM Token (Add to array + Cleanup)
        if (updates.fcmToken) {
            await associateFcmToken(username, updates.fcmToken);
            delete updates.fcmToken; // Remove from standard updates
        }

        const user = await User.findOneAndUpdate({ username }, updates, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/logout -> Remove device's FCM token from current user
app.post('/api/users/logout', async (req, res) => {
    try {
        const { username, token } = req.body;
        if (username && token) {
            await User.findOneAndUpdate(
                { username },
                { $pull: { fcmTokens: token } }
            );
            console.log(`[FCM] Token removed for ${username} on logout.`);
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ error: "Logout partially failed" });
    }
});

// POST /api/users/clear-fcm-tokens -> Emergency Cleanup
app.post('/api/users/clear-fcm-tokens', async (req, res) => {
    try {
        const { username } = req.body;
        await User.findOneAndUpdate(
            { username },
            { $set: { fcmTokens: [], fcmToken: '' } }
        );
        res.json({ success: true, message: "All tokens cleared for " + username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// GET /api/reviews -> Get all reviews (for averages)
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve Static Frontend (Production)
const path = require('path');

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongoConnected: mongoose.connection.readyState === 1,
        socketActive: !!io,
        timestamp: new Date()
    });
});

// Serve React App
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes (Orders, Auth, Reviews) are defined above...

// Handle React Routing (Catch-All) - MUST BE LAST
app.get(/(.*)/, (req, res) => {
    const indexPath = path.join(__dirname, '../client/dist/index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('API Running. Frontend not built. Run "npm run build" in client.');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[Error] ${err.stack}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

process.on('uncaughtException', (err) => {
    console.error(`[Uncaught Exception] ${err.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`[Unhandled Rejection] at: ${promise}, reason: ${reason}`);
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB URI Configured: ${!!process.env.MONGO_URI} (Check Render Environment Variables)`);
    if (process.env.MONGO_URI) {
        console.log(`MongoDB URI Host: ${process.env.MONGO_URI.split('@')[1] || 'Hidden/Local'}`);
    }
});
