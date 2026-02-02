const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant_app';

async function testOrderUpdate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Get the first order
        const order = await Order.findOne().sort({ createdAt: -1 });
        if (!order) {
            console.log('No orders found in database');
            await mongoose.disconnect();
            return;
        }

        console.log('\n=== Order Found ===');
        console.log('ID:', order._id);
        console.log('Current Status:', order.status);
        console.log('Customer:', order.userName);

        // Try to update it
        console.log('\n=== Attempting Update ===');
        order.status = 'Preparing';
        await order.save();
        console.log('✅ Successfully updated status to:', order.status);

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error('Full error:', err);
    }
}

testOrderUpdate();
