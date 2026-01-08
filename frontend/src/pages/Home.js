import React, { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import "./Home.css";

function Home({ category, setCategory, goToCategory }) {
  const { addToCart } = useContext(CartContext);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const foodItems = [
  { name: "Cheese Burger", price: 120, category: "burger", offer: "20% OFF", img: "https://images.unsplash.com/photo-1550547660-d9450f859349" },
  { name: "Chicken Burger", price: 150, category: "burger", offer: "NEW", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd" },
  { name: "Veg Noodles", price: 140, category: "noodles", offer: "10% OFF", img: "https://images.unsplash.com/photo-1585032226651-759b368d7246" },
  { name: "Mushroom Fry", price: 160, category: "mushroom", offer: "", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950" },
  { name: "Chicken Kebab", price: 220, category: "kebab", offer: "BEST", img: "https://images.unsplash.com/photo-1604908177522-0407a7c0f5c1" },
  { name: "Kavaabu", price: 180, category: "kavaabu", offer: "", img: "https://images.unsplash.com/photo-1628294895950-9805252327bc" }
];


  // ✅ CATEGORY + SEARCH FILTER
  const filteredItems = foodItems.filter((item) => {
    const matchCategory = category === "all" || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAdd = (item) => {
    addToCart(item);
    setToast(`${item.name} added successfully`);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div className="home">
      <h1>{category === "all" ? "🍽 Our Menu" : category.toUpperCase()}</h1>

      {/* SEARCH BAR */}
      <input
        className="search"
        type="text"
        placeholder="Search food..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* CATEGORY BADGES */}
      {category !== "all" && (
        <div className="category-bar">
          <span className="badge">{category}</span>
          <button className="clear-btn" onClick={() => setCategory("all")}>
            Back to All
          </button>
        </div>
      )}

      {/* FOOD GRID */}
      <div className="food-grid">
        {filteredItems.length === 0 ? (
          <p className="no-items">No items found</p>
        ) : (
          filteredItems.map((item, index) => (
            <div className="food-card" key={index}>
              <img
                src={item.img}
                alt={item.name}
                onClick={() => goToCategory(item.category)}
              />
              <h3 onClick={() => goToCategory(item.category)}>
                {item.name}
              </h3>
              <p>₹{item.price}</p>
              <button onClick={() => handleAdd(item)}>Add to Cart</button>
            </div>
          ))
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Home;

