import Trade from "../models/trade.js";
import { isValidSymbol } from "../utils/symbols.js";

const listTrades = async (req, res) => {
  const { symbol } = req.query;

  if (symbol && !isValidSymbol(symbol)) {
    return res.status(400).json({ message: "Invalid symbol" });
  }

  const filter = symbol ? { symbol } : {};
  const trades = await Trade.find(filter).sort({ createdAt: 1 }).limit(2000);
  return res.json({ trades });
};

export { listTrades };
