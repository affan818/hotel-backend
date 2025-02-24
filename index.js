import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Razorpay from "razorpay";
import Booking from "./models/Booking.js";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json()); // Middleware to parse JSON requests
app.use(cors()); // Enable CORS for frontend requests

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Razorpay Setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  const { amount, name, email, mobile, showTime, personCount } = req.body;

  const options = {
    amount: amount * 100, // Razorpay needs amount in paisa
    currency: "INR",
    receipt: `order_rcptid_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ id: order.id, amount });
  } catch (error) {
    res.status(500).json({ message: "Order creation failed", error });
  }
});

// Save Booking in Database
app.post("/save-booking", async (req, res) => {
  console.log("Received Booking Data:", req.body); // Debug log

  const {
    name,
    email,
    mobile,
    showTime,
    date,
    personCount,
    paymentId,
    orderId,
    amount,
  } = req.body;

  if (!personCount) {
    return res.status(400).json({ message: "Person count is missing!" });
  }

  const booking = new Booking({
    name,
    email,
    mobile,
    showTime,
    date,
    personCount, // Ensure it's saved
    paymentId,
    orderId,
    amount,
  });

  try {
    await booking.save();
    res.json({ message: "Booking saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error saving booking", error });
  }
});

// get booking

// Get all bookings
app.get("/get-bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
});

// ✅ Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
