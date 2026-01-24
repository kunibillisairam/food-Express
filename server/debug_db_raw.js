const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant_app';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const orders = await db.collection('orders').find({}).toArray();

        console.log('Total Orders in collection "orders":', orders.length);
        if (orders.length > 0) {
            console.log('First order data:');
            console.log(JSON.stringify(orders[0], null, 2));

            console.log('\nAll Usernames in orders:');
            const usernames = [...new Set(orders.map(o => o.userName))];
            usernames.forEach(u => {
                console.log(`- "${u}" (length: ${u ? u.length : 0})`);
            });
        }

        const users = await db.collection('users').find({}).toArray();
        console.log('\nTotal Users in collection "users":', users.length);
        users.forEach(u => {
            console.log(`- "${u.username}" (length: ${u.username ? u.username.length : 0})`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
