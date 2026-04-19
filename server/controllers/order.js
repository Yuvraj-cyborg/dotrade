import Order from "../models/order.js";
import User from "../models/user.js";
import Trade from "../models/trade.js";
import { matchOrder } from "../services/engine.js";
import { SYMBOLS, isValidSymbol } from "../utils/symbols.js";

const placeOrder = async (req, res, side) => {
  const { symbol, price, quantity } = req.body;

  if (!symbol || price == null || quantity == null) {
    return res
      .status(400)
      .json({ message: "symbol, price, and quantity are required" });
  }
  if (!isValidSymbol(symbol)) {
    return res
      .status(400)
      .json({ message: `symbol must be one of ${SYMBOLS.join(", ")}` });
  }
  if (price <= 0 || quantity <= 0) {
    return res
      .status(400)
      .json({ message: "price and quantity must be greater than 0" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ message: "User not found — please log in again" });
  }
  if (!user.holdings) user.holdings = new Map();

  if (side === "BUY") {
    const cost = price * quantity;
    if (user.cash < cost) {
      return res.status(400).json({
        message: `Insufficient cash: need $${cost.toFixed(2)}, have $${user.cash.toFixed(2)}`,
      });
    }
    user.cash -= cost;
    await user.save();
  } else {
    const held = user.holdings.get(symbol) || 0;
    if (held < quantity) {
      return res.status(400).json({
        message: `Insufficient ${symbol}: need ${quantity}, have ${held}`,
      });
    }
    user.holdings.set(symbol, held - quantity);
    await user.save();
  }

  const order = await Order.create({
    userId: req.user.id,
    symbol,
    side,
    price,
    quantity,
    remaining: quantity,
  });

  const trades = await matchOrder(order);
  const updatedUser = await User.findById(req.user.id);

  return res.status(201).json({ order, trades, user: updatedUser });
};

const buyOrder = (req, res) => placeOrder(req, res, "BUY");
const sellOrder = (req, res) => placeOrder(req, res, "SELL");

const listMyOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });
  return res.json({ orders });
};

const cancelOrder = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.status === "FILLED" || order.status === "CANCELLED") {
    return res
      .status(400)
      .json({ message: `Cannot cancel a ${order.status} order` });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ message: "User not found — please log in again" });
  }
  if (!user.holdings) user.holdings = new Map();

  if (order.side === "BUY") {
    user.cash += order.price * order.remaining;
  } else {
    user.holdings.set(
      order.symbol,
      (user.holdings.get(order.symbol) || 0) + order.remaining,
    );
  }
  await user.save();

  order.status = "CANCELLED";
  await order.save();

  return res.json({ order, user });
};

const getOrderBook = async (req, res) => {
  const { symbol } = req.params;
  if (!isValidSymbol(symbol)) {
    return res.status(400).json({ message: "Invalid symbol" });
  }

  const levels = await Order.aggregate([
    {
      $match: {
        symbol,
        status: { $in: ["OPEN", "PARTIAL"] },
      },
    },
    {
      $group: {
        _id: { side: "$side", price: "$price" },
        quantity: { $sum: "$remaining" },
        orders: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        side: "$_id.side",
        price: "$_id.price",
        quantity: 1,
        orders: 1,
      },
    },
  ]);

  const bids = levels
    .filter((l) => l.side === "BUY")
    .sort((a, b) => b.price - a.price)
    .slice(0, 15);
  const asks = levels
    .filter((l) => l.side === "SELL")
    .sort((a, b) => a.price - b.price)
    .slice(0, 15);

  const lastTrade = await Trade.findOne({ symbol }).sort({ createdAt: -1 });

  return res.json({
    symbol,
    bids,
    asks,
    lastPrice: lastTrade?.price ?? null,
  });
};

export { buyOrder, sellOrder, listMyOrders, cancelOrder, getOrderBook };
