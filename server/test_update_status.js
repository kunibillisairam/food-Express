const axios = require('axios');

async function testUpdate() {
    const orderId = '697f4e297c87224edcdae5ad'; // Valid ID from previous check
    try {
        console.log(`Attempting to update order ${orderId}...`);
        const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, {
            status: 'Preparing'
        });
        console.log('Success:', res.data);
    } catch (err) {
        console.error('Error Details:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

testUpdate();
