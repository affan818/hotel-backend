import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  showTime: { type: String, required: true },
  date: { type: String, required: true },
  paymentId: { type: String, required: true },
  personCount: { type: Number, required: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  // date: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", BookingSchema);
