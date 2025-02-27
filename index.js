import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Razorpay from "razorpay";
import nodemailer from "nodemailer"; // ✅ Import Nodemailer
import Booking from "./models/Booking.js";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json()); // Middleware to parse JSON requests
app.use(cors()); // Enable CORS for frontend requests

// ✅ Debugging Logs for Environment Variables
console.log("Mongo URI:", process.env.MONGO_URI);
console.log("Razorpay Key:", process.env.RAZORPAY_KEY_ID);

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Razorpay Setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Nodemailer Setup (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS, // App Password (Google-generated)
  },
});

// ✅ Create Order (Razorpay)
app.post("/create-order", async (req, res) => {
  // console.log("🔹 Received Order Creation Request:", req.body);

  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ message: "Invalid amount!" });
  }

  const options = {
    amount: amount * 100, // Razorpay requires amount in paisa
    currency: "INR",
    receipt: `order_rcptid_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    // console.log("✅ Order Created:", order);
    res.json({ id: order.id, amount });
  } catch (error) {
    // console.error("❌ Order Creation Error:", error);
    res.status(500).json({ message: "Order creation failed", error });
  }
});

// ✅ Save Booking in Database & Send Confirmation Email
app.post("/save-booking", async (req, res) => {
  // console.log("🔹 Received Booking Request:", req.body);
  // Log incoming request

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
    personCount,
    paymentId,
    orderId,
    amount,
  });

  try {
    await booking.save();
    // console.log("✅ Booking Saved Successfully:", booking);

    // ✅ Send Confirmation Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🎟️ Booking Confirmation - Show Booking",
      html: `
        <h2>Hello ${name},</h2>
        <p>Your booking has been confirmed.</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Show Time:</strong> ${showTime}</p>
        <p><strong>Person(s):</strong> ${personCount}</p>
        <p><strong>Amount Paid:</strong> ₹${amount}</p>
        <p>Thank you for choosing Us. We look forward to seeing you!</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      // console.log("✅ Confirmation Email Sent Successfully!");
      res.json({ message: "Booking saved & confirmation email sent!" });
    } catch (emailError) {
      // console.error("❌ Error Sending Email:", emailError);
      res
        .status(500)
        .json({ message: "Booking saved, but email failed!", emailError });
    }
  } catch (error) {
    // console.error("❌ Booking Save Error:", error);
    res.status(500).json({ message: "Error saving booking", error });
  }
});

// ✅ Get all Bookings
app.get("/get-bookings", async (req, res) => {
  // console.log("🔹 Fetching All Bookings...");

  try {
    const bookings = await Booking.find().sort({ date: -1 });
    // console.log(`✅ Found ${bookings.length} Bookings`);
    res.json(bookings);
  } catch (error) {
    // console.error("❌ Error Fetching Bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
