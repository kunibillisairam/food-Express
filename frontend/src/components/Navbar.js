import "./Navbar.css";

function Navbar({ setPage, goToCategory, category }) {
  const isAdmin = localStorage.getItem("admin") === "true";
  const cats = ["burger", "noodles", "mushroom", "kebab", "kavaabu"];

  return (
    <div className="navbar">
      <div className="logo" onClick={() => goToCategory("all")}>
        🍽 Royal Feast
      </div>

      <div className="nav-links">
        {cats.map((cat) => (
          <button
            key={cat}
            className={category === cat ? "active" : ""}
            onClick={() => goToCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="nav-actions">
        <button onClick={() => setPage("cart")}>🛒</button>

        {!isAdmin && (
          <button onClick={() => setPage("login")}>Login</button>
        )}

        {isAdmin && (
          <>
            <button onClick={() => setPage("admin")}>
              Admin Orders
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("admin");
                setPage("home");
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;



