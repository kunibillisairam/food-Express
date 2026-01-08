const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 5000;

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

        if (order.status !== 'Pending') {
            return res.status(400).json({ message: 'Cannot cancel order. It is already being prepared or delivered.' });
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

// POST /api/orders
app.post('/api/orders', async (req, res) => {
    try {
        const { userName, items, totalAmount, couponCode } = req.body;
        console.log(`[Order] Received order from ${userName}, Coupon: ${couponCode}, Amount: ${totalAmount}`);

        // Handle Coupon Usage (Server-Side Verification)
        if (couponCode === 'SAI100') {
            console.log(`[Order] Processing SAI100 for ${userName} (Atomic Check)`);

            // Atomic Operation: Find user AND ensure coupon not used. 
            const user = await User.findOneAndUpdate(
                {
                    username: userName,
                    usedCoupons: { $ne: 'SAI100' }
                },
                {
                    $addToSet: { usedCoupons: 'SAI100' }
                },
                { new: true }
            );

            if (!user) {
                const userExists = await User.findOne({ username: userName });
                if (userExists) {
                    console.log(`[Order] SAI100 already used by ${userName} (Blocked by Atomic Check)`);
                    return res.status(400).json({ message: 'Coupon SAI100 already used' });
                } else {
                    console.log(`[Order] User NOT found: ${userName}`);
                }
            } else {
                console.log(`[Order] SAI100 successfully applied and marked for ${userName}`);
            }
        }

        const newOrder = new Order({
            userName,
            items,
            totalAmount
        });
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (err) {
        console.error(`[Order] Error: ${err.message}`);
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
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ message: 'Phone number already exists' });
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

// GET /api/users -> Get all users (Admin)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
