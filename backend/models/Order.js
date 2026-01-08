const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: String,
  items: Array,
  total: Number,
  coupon: String,
  status: {
    type: String,
    default: "Pending"
  }
});

module.exports = mongoose.model("Order", orderSchema);
