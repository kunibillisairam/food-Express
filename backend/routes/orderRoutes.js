const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

router.get("/", async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

router.post("/", async (req, res) => {
  const { user, coupon } = req.body;

  if (coupon === "SAI100") {
    const existingOrder = await Order.findOne({ user, coupon: "SAI100" });
    if (existingOrder) {
      return res.status(400).json({ message: "SAI100 only for one time pre new user" });
    }
  }

  await Order.create(req.body);
  res.json({ message: "Order placed" });
});

module.exports = router;

