const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testUserUpdate() {
    try {
        // First, fetch all users
        console.log('Fetching all users...');
        const usersResponse = await axios.get(`${API_BASE_URL}/api/users`);
        console.log(`Found ${usersResponse.data.length} users`);

        if (usersResponse.data.length === 0) {
            console.log('No users found to test with');
            return;
        }

        // Get the first non-admin user
        const testUser = usersResponse.data.find(u => u.role !== 'admin') || usersResponse.data[0];
        console.log('\nTest User:', {
            id: testUser._id,
            username: testUser.username,
            phone: testUser.phone,
            walletBalance: testUser.walletBalance,
            rank: testUser.rank
        });

        // Try to update the user
        console.log('\nAttempting to update user...');
        const updateData = {
            username: testUser.username,
            phone: testUser.phone || '1234567890',
            walletBalance: (testUser.walletBalance || 0) + 10,
            rank: testUser.rank || 'Cadet'
        };

        console.log('Update data:', updateData);

        const updateResponse = await axios.put(
            `${API_BASE_URL}/api/users/${testUser._id}`,
            updateData
        );

        console.log('\n✅ Update successful!');
        console.log('Updated user:', updateResponse.data.user);

        // Verify the update by fetching again
        console.log('\nVerifying update...');
        const verifyResponse = await axios.get(`${API_BASE_URL}/api/users`);
        const updatedUser = verifyResponse.data.find(u => u._id === testUser._id);
        console.log('Verified user:', {
            id: updatedUser._id,
            username: updatedUser.username,
            phone: updatedUser.phone,
            walletBalance: updatedUser.walletBalance,
            rank: updatedUser.rank
        });

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testUserUpdate();
