import mongoose from "mongoose";
import connectDB from "./utils/db.js";
import User from "./models/user.js";
import Order from "./models/order.js";
import Trade from "./models/trade.js";
import { SYMBOLS } from "./utils/symbols.js";

const BASE_PRICES = { BTC: 50000, ETH: 3200, SOL: 180, AVAX: 35 };
const HOURS_OF_HISTORY = 48;
const TRADES_PER_HOUR = 6;

const randBetween = (min, max) => Math.random() * (max - min) + min;

const buildTradeHistory = (symbol, buyerId, sellerId) => {
  const trades = [];
  let price = BASE_PRICES[symbol];
  const now = Date.now();

  for (let h = HOURS_OF_HISTORY; h >= 0; h--) {
    for (let i = 0; i < TRADES_PER_HOUR; i++) {
      const ts =
        now - h * 3600 * 1000 + (i / TRADES_PER_HOUR) * 3600 * 1000 + randBetween(-30000, 30000);

      const drift = (Math.random() - 0.5) * price * 0.02;
      price = Math.max(price + drift, price * 0.5);

      trades.push({
        symbol,
        price: +price.toFixed(symbol === "BTC" ? 2 : 4),
        quantity: +randBetween(0.01, 0.5).toFixed(4),
        buyOrderId: new mongoose.Types.ObjectId(),
        sellOrderId: new mongoose.Types.ObjectId(),
        buyerId,
        sellerId,
        createdAt: new Date(ts),
        updatedAt: new Date(ts),
      });
    }
  }
  return trades;
};

const buildOpenBook = (symbol, marketId) => {
  const orders = [];
  const base = BASE_PRICES[symbol];

  for (let i = 1; i <= 5; i++) {
    const spread = i * 0.005;
    orders.push({
      userId: marketId,
      symbol,
      side: "SELL",
      price: +(base * (1 + spread)).toFixed(4),
      quantity: 1,
      remaining: 1,
      status: "OPEN",
    });
    orders.push({
      userId: marketId,
      symbol,
      side: "BUY",
      price: +(base * (1 - spread)).toFixed(4),
      quantity: 1,
      remaining: 1,
      status: "OPEN",
    });
  }
  return orders;
};

const run = async () => {
  await connectDB();

  console.log("Clearing existing orders and trades...");
  await Order.deleteMany({});
  await Trade.deleteMany({});
  await User.deleteMany({ email: { $in: ["market@trade-engine.dev", "seed@trade-engine.dev"] } });

  console.log("Creating market maker + counterparty users...");
  const market = await User.create({
    name: "Market Maker",
    email: "market@trade-engine.dev",
    password: "password123",
    cash: 10_000_000,
    holdings: new Map(SYMBOLS.map((s) => [s, 1000])),
  });
  const seed = await User.create({
    name: "Seed Counterparty",
    email: "seed@trade-engine.dev",
    password: "password123",
    cash: 10_000_000,
    holdings: new Map(SYMBOLS.map((s) => [s, 1000])),
  });

  console.log("Inserting trade history (for candle charts)...");
  const allTrades = SYMBOLS.flatMap((s) => buildTradeHistory(s, market._id, seed._id));
  await Trade.insertMany(allTrades);
  console.log(`  inserted ${allTrades.length} trades across ${SYMBOLS.length} symbols`);

  console.log("Inserting resting orders (for order book)...");
  const allOrders = SYMBOLS.flatMap((s) => buildOpenBook(s, market._id));
  await Order.insertMany(allOrders);
  console.log(`  inserted ${allOrders.length} open orders`);

  console.log("Done.");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
