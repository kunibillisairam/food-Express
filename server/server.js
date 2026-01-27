const admin = require('firebase-admin');

// Initialize Firebase Admin (Wrapped to prevent crash if key is missing)
try {
    // You must provide this file!
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized");
} catch (error) {
    console.warn("Warning: Firebase Admin NOT initialized. 'serviceAccountKey.json' is missing or invalid. Notifications will be skipped.");
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const Order = require('./models/Order');
const User = require('./models/User');
const Review = require('./models/Review');

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
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Debugging: Log that routes are initializing
console.log("Initializing Routes...");

// Health Check - MOVED TO TOP
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongoConnected: mongoose.connection.readyState === 1,
        socketActive: !!io,
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
        const orders = await Order.find().sort({ createdAt: -1 });
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

            // Send FCM Notification for Status Update
            const user = await User.findOne({ username: order.userName });
            if (user && user.fcmToken && admin.apps.length > 0) {
                try {
                    await admin.messaging().send({
                        token: user.fcmToken,
                        notification: {
                            title: `Order ${status} 🚚`,
                            body: `Your order #${order._id.toString().slice(-6)} is now ${status}.`
                        },
                        data: {
                            orderId: order._id.toString(),
                            status: status
                        }
                    });
                    console.log(`[FCM] Status update notification sent to ${order.userName}`);
                } catch (fcmErr) {
                    console.error("[FCM Error]", fcmErr.message);
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
        const { userName, items, totalAmount, couponCode, address, paymentMethod, useXp } = req.body;
        console.log(`[Order] Received order from ${userName}, Address: ${address}, Method: ${paymentMethod}, Use XP: ${useXp}`);

        const user = await User.findOne({ username: userName });
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
        const savedOrder = await newOrder.save();

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

        // --- FCM NOTIFICATION LOGIC ---
        // Send Push Notification if User has Token
        if (user && user.fcmToken && admin.apps.length > 0) {
            try {
                const message = {
                    token: user.fcmToken,
                    notification: {
                        title: "✅ Order Confirmed!",
                        body: `Your order #${randomOrderId} has been placed successfully and is being prepared.`
                    },
                    data: {
                        orderId: savedOrder._id.toString(),
                        shortId: randomOrderId,
                        status: "confirmed"
                    }
                };

                await admin.messaging().send(message);
                console.log(`[FCM] Notification sent to ${userName}`);
            } catch (fcmError) {
                console.error(`[FCM Error] Failed to send notification to ${userName}:`, fcmError.message);
            }
        } else {
            if (!user) console.log("[FCM Skip] User not found");
            else if (!user.fcmToken) console.log(`[FCM Skip] User ${userName} has no FCM Token`);
            else console.log("[FCM Skip] Firebase Admin not initialized");
        }
        // ------------------------------

        res.status(201).json({ ...savedOrder._doc, earnedXp, earnedCredits, xpUsed: xpDeducted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Review Routes

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

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password, phone } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({ username, password, phone });
        await newUser.save();
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Admin hardcoded check (optional, or move to DB)
        if (username === 'admin' && password === 'admin') {
            return res.json({
                success: true,
                user: { username: 'admin', role: 'admin', walletBalance: 999999 }
            });
        }

        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({ success: true, user });
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

// PUT /api/users/:username -> Update User (Address, Wallet)
app.put('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const updates = req.body;
        const user = await User.findOneAndUpdate({ username }, updates, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reviews/summary -> Get average ratings for all food items
app.get('/api/reviews/summary', async (req, res) => {
    try {
        // Fallback to JS aggregation to ensure stability
        const allReviews = await Review.find({}, 'foodId rating').lean();

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
