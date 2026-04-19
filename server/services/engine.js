import Order from "../models/order.js";
import Trade from "../models/trade.js";
import User from "../models/user.js";

const statusFor = (order) => {
  if (order.remaining === 0) return "FILLED";
  if (order.remaining < order.quantity) return "PARTIAL";
  return "OPEN";
};

const matchOrder = async (taker) => {
  const oppositeSide = taker.side === "BUY" ? "SELL" : "BUY";
  const priceFilter =
    taker.side === "BUY" ? { $lte: taker.price } : { $gte: taker.price };
  const sort =
    taker.side === "BUY"
      ? { price: 1, createdAt: 1 }
      : { price: -1, createdAt: 1 };

  const trades = [];

  while (taker.remaining > 0) {
    const maker = await Order.findOne({
      symbol: taker.symbol,
      side: oppositeSide,
      price: priceFilter,
      status: { $in: ["OPEN", "PARTIAL"] },
      userId: { $ne: taker.userId },
    }).sort(sort);

    if (!maker) break;

    const fillQty = Math.min(taker.remaining, maker.remaining);
    const fillPrice = maker.price;

    taker.remaining -= fillQty;
    maker.remaining -= fillQty;
    taker.status = statusFor(taker);
    maker.status = statusFor(maker);

    await maker.save();

    const buyOrder = taker.side === "BUY" ? taker : maker;
    const sellOrder = taker.side === "SELL" ? taker : maker;

    const buyer = await User.findById(buyOrder.userId);
    const seller = await User.findById(sellOrder.userId);
    if (!buyer || !seller) break;
    if (!buyer.holdings) buyer.holdings = new Map();
    if (!seller.holdings) seller.holdings = new Map();

    const overpay = (buyOrder.price - fillPrice) * fillQty;
    buyer.cash += overpay;
    buyer.holdings.set(
      taker.symbol,
      (buyer.holdings.get(taker.symbol) || 0) + fillQty,
    );
    seller.cash += fillPrice * fillQty;

    await buyer.save();
    await seller.save();

    const trade = await Trade.create({
      symbol: taker.symbol,
      price: fillPrice,
      quantity: fillQty,
      buyOrderId: buyOrder._id,
      sellOrderId: sellOrder._id,
      buyerId: buyOrder.userId,
      sellerId: sellOrder.userId,
    });

    trades.push(trade);
  }

  await taker.save();
  return trades;
};

export { matchOrder };
