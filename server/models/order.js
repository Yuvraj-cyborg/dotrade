import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    side: {
      type: String,
      required: true,
      enum: ["BUY", "SELL"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    remaining: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["OPEN", "PARTIAL", "FILLED", "CANCELLED"],
      default: "OPEN",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
