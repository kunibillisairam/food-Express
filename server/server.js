const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const Order = require('./models/Order');

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
        const orders = await Order.find({ userName: username }).sort({ createdAt: -1 });
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
        order.status = 'Cancelled';
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
        order.status = status;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
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
        const { userName, items, totalAmount, couponCode, address, paymentMethod } = req.body;
        console.log(`[Order] Received order from ${userName}, Address: ${address}, Method: ${paymentMethod}`);

        // Handle Coupon Usage (Server-Side Verification)
        if (couponCode === 'SAI100') {
            const userMatched = await User.findOneAndUpdate(
                { username: userName, usedCoupons: { $ne: 'SAI100' } },
                { $addToSet: { usedCoupons: 'SAI100' } },
                { new: true }
            );
            if (!userMatched) {
                const userExists = await User.findOne({ username: userName });
                if (userExists) return res.status(400).json({ message: 'Coupon SAI100 already used' });
            }
        }

        // Calculate XP: 100-150 -> 10, 151-200 -> 15, etc.
        let earnedXp = 0;
        if (totalAmount >= 100) {
            earnedXp = 10 + Math.floor((totalAmount - 100) / 50) * 5;
        }

        // 10 XP = 1 CR
        const earnedCredits = earnedXp / 10;

        const user = await User.findOne({ username: userName });
        if (user) {
            user.xp = (user.xp || 0) + earnedXp;
            user.credits = (user.credits || 0) + earnedCredits;
            user.rank = calculateRank(user.xp);

            // Add transaction for credits
            if (earnedCredits > 0) {
                user.transactions.push({
                    type: 'Credit',
                    amount: earnedCredits,
                    description: `Earned ${earnedCredits} CR from Order XP`
                });
            }
            await user.save();
        }

        const newOrder = new Order({
            userName,
            items,
            totalAmount,
            address,
            paymentMethod
        });
        const savedOrder = await newOrder.save();
        res.status(201).json({ ...savedOrder._doc, earnedXp, earnedCredits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Review Routes
const Review = require('./models/Review');

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
const User = require('./models/User');

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

// GET /api/reviews -> Get all reviews (for averages)
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('Restaurant API is running');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
