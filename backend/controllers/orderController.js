
const Order = require("../models/Order");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { items, total, customer } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res
        .status(400)
        .json({ message: "Customer details missing" });
    }

    const order = new Order({
      items,
      total,
      customer,
    });

    await order.save();

    res.status(201).json({
      message: "Order placed successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Order failed" });
  }
};

// GET ALL ORDERS (ADMIN)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
