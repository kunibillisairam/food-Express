const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    items: [
        {
            name: { type: String, required: true },
            price: { type: String, required: true }, // Keeping consistent with user prompt which implies simple data
            quantity: { type: Number, required: true },
            image: { type: String }
        }
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
