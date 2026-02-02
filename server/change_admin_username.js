const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // 1. Search for the user with the NEW username
        const alreadyUpdatedUser = await User.findOne({ username: '1234567890' });
        if (alreadyUpdatedUser) {
            console.log('✅ VERIFICATION SUCCESSFUL: User with username "1234567890" exists in the database.');
            console.log('User ID:', alreadyUpdatedUser._id);
            console.log('Role:', alreadyUpdatedUser.role);
            await mongoose.disconnect();
            return;
        }

        // 2. If not found, try to find "admin" (in case it reverted or failed silently)
        console.log('User "1234567890" not found. Searching for "admin"...');
        let user = await User.findOne({ username: 'admin' });

        if (!user) {
            console.log('User "admin" not found either.');
            // fallback search by role
            // Only look for role=admin if we can't find the name
            const admins = await User.find({ role: 'admin' });
            console.log(`Found ${admins.length} admins.`);
            if (admins.length > 0) {
                // Try to pick one
                user = admins[0];
                console.log(`Picking first admin found: ${user.username}`);
            } else {
                console.log('No admins found at all.');
                await mongoose.disconnect();
                return;
            }
        }

        if (user) {
            console.log(`Found user: ${user.username}. Updating username to "1234567890"...`);
            user.username = '1234567890';
            try {
                await user.save();
                console.log(`✅ Successfully changed username to "1234567890" for user id ${user._id}`);
            } catch (err) {
                if (err.code === 11000) {
                    console.log('Error: Username "1234567890" already exists.');
                } else {
                    console.error('Error saving user:', err);
                }
            }
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
