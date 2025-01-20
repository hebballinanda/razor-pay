require("dotenv").config();``
const express = require("express");
const app = express();
const Razorpay = require("razorpay");
const path = require("path");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZOR_KEY_ID, // Your Test Key ID
  key_secret: process.env.RAZOR_KEY_SECRET, // Your Test Key Secret
});

// Serve the EJS page
app.get("/", (req, res) => {
  res.render("index", { RAZOR_KEY_ID: process.env.RAZOR_KEY_ID }); // Pass Razorpay key to the frontend
});

// Create Razorpay order
app.post("/createOrder", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // Convert to paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating Razorpay order.");
  }
});

// Verify payment signature
const crypto = require("crypto");

app.post("/verifyPayment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZOR_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.status(200).send("Payment verified successfully!");
  } else {
    res.status(400).send("Payment verification failed!");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
