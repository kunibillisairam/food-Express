import "./PaymentSuccess.css";

function PaymentSuccess({ setPage }) {
  return (
    <div className="success-page">
      <div className="success-card">
        <h1>✅ Payment Successful</h1>
        <p>Your order has been placed successfully.</p>

        <div className="success-actions">
          <button onClick={() => setPage("home")}>
            Back to Home
          </button>

          <button onClick={() => setPage("admin")}>
            View Admin Orders
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
