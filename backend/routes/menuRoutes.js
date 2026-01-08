const express = require("express");
const router = express.Router();

// TEMP MENU DATA (can be replaced with DB later)
router.get("/", (req, res) => {
  res.json([
    { name: "Cheese Burger", price: 149 },
    { name: "Chicken Burger", price: 179 },
    { name: "Veg Noodles", price: 129 },
    { name: "Mushroom Fry", price: 159 }
  ]);
});

module.exports = router;
