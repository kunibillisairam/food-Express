import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import AdminOrders from "./pages/AdminOrders";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";

function App() {
  const [page, setPage] = useState("home");
  const [category, setCategory] = useState("all");

  const goToCategory = (cat) => {
    setCategory(cat);
    setPage("home");
  };

  return (
    <>
      {!["login", "signup", "admin-login"].includes(page) && (
        <Navbar
          setPage={setPage}
          category={category}
          goToCategory={goToCategory}
        />
      )}

      {page === "home" && (
        <Home
          category={category}
          setCategory={setCategory}
          goToCategory={goToCategory}
        />
      )}

      {page === "cart" && <Cart />}
      {page === "login" && <Login setPage={setPage} />}
      {page === "signup" && <Signup setPage={setPage} />}
      {page === "admin-login" && <AdminLogin setPage={setPage} />}
      {page === "payment" && <Payment setPage={setPage} />}
      {page === "payment-success" && (
  <PaymentSuccess setPage={setPage} />
)}

      {page === "admin" && <AdminOrders setPage={setPage} />}
    </>
  );
}

export default App;

