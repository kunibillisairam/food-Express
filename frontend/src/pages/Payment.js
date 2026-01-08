import "./Payment.css";

function Payment({ setPage }) {
  return (
    <div className="payment">
      <h1>💳 Payment</h1>

      <div className="payment-box">
        <label>
          <input type="radio" name="pay" defaultChecked /> Cash on Delivery
        </label>

        <label>
          <input type="radio" name="pay" /> UPI
        </label>

        <label>
          <input type="radio" name="pay" /> Debit / Credit Card
        </label>
        <button onClick={() => setPage("payment-success")}>
  Confirm Payment
</button>

        
      </div>
    </div>
  );
}

export default Payment;
