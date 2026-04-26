import { useEffect, useMemo, useRef, useState } from "react";
import { init, dispose } from "klinecharts";
import { X, TrendingUp } from "lucide-react";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import Card from "../components/Card.jsx";
import OrderBook from "../components/OrderBook.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

const SYMBOLS = ["BTC", "ETH", "SOL", "AVAX"];
const BUCKET_MS = 3600 * 1000;
const BOOK_POLL_MS = 4000;

const aggregateCandles = (trades, intervalMs = BUCKET_MS) => {
  const buckets = new Map();
  for (const t of trades) {
    const ts = new Date(t.createdAt).getTime();
    const bucket = Math.floor(ts / intervalMs) * intervalMs;
    const existing = buckets.get(bucket);
    if (!existing) {
      buckets.set(bucket, {
        timestamp: bucket,
        open: t.price,
        high: t.price,
        low: t.price,
        close: t.price,
        volume: t.quantity,
      });
    } else {
      existing.high = Math.max(existing.high, t.price);
      existing.low = Math.min(existing.low, t.price);
      existing.close = t.price;
      existing.volume += t.quantity;
    }
  }
  return Array.from(buckets.values()).sort(
    (a, b) => a.timestamp - b.timestamp,
  );
};

const chartStyles = {
  grid: {
    horizontal: { color: "#f3f4f6" },
    vertical: { color: "#f3f4f6" },
  },
  candle: {
    bar: {
      upColor: "#17b26a",
      downColor: "#f04438",
      upBorderColor: "#17b26a",
      downBorderColor: "#f04438",
      upWickColor: "#17b26a",
      downWickColor: "#f04438",
    },
    tooltip: {
      text: { color: "#111827" },
    },
    priceMark: {
      last: { show: true, line: { show: true } },
    },
  },
  xAxis: { axisLine: { color: "#e5e7eb" }, tickText: { color: "#6b7280" } },
  yAxis: { axisLine: { color: "#e5e7eb" }, tickText: { color: "#6b7280" } },
  crosshair: {
    horizontal: { line: { color: "#9ca3af" } },
    vertical: { line: { color: "#9ca3af" } },
  },
};

const statusStyles = {
  OPEN: "bg-blue-50 text-blue-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  FILLED: "bg-success-soft text-success",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const Trade = () => {
  const { user, setUser } = useAuth();
  const [symbol, setSymbol] = useState("BTC");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [side, setSide] = useState("BUY");
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [book, setBook] = useState({ bids: [], asks: [], lastPrice: null });
  const [loadingChart, setLoadingChart] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const chartRef = useRef(null);
  const containerRef = useRef(null);

  const candles = useMemo(() => aggregateCandles(trades), [trades]);
  const lastPrice = book.lastPrice ?? (trades.length ? trades[trades.length - 1].price : null);

  const loadOrders = () => {
    api
      .listOrders()
      .then(({ orders }) => setOrders(orders))
      .catch(() => {});
  };

  const loadTrades = (sym) => {
    setLoadingChart(true);
    api
      .listTrades(sym)
      .then(({ trades }) => setTrades(trades))
      .catch(() => setTrades([]))
      .finally(() => setLoadingChart(false));
  };

  const loadBook = (sym) => {
    api
      .orderBook(sym)
      .then(setBook)
      .catch(() => setBook({ bids: [], asks: [], lastPrice: null }));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    loadTrades(symbol);
    loadBook(symbol);
    const id = setInterval(() => loadBook(symbol), BOOK_POLL_MS);
    return () => clearInterval(id);
  }, [symbol]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = init(el);
    chart.setStyles(chartStyles);
    chart.setPriceVolumePrecision(2, 4);
    chartRef.current = chart;

    return () => {
      dispose(el);
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyNewData(candles);
  }, [candles]);

  const myOpenForSymbol = orders.filter(
    (o) =>
      o.symbol === symbol && (o.status === "OPEN" || o.status === "PARTIAL"),
  );

  const pickLevel = (level, nextSide) => {
    setSide(nextSide);
    setPrice(String(level.price));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const body = {
        symbol,
        price: Number(price),
        quantity: Number(quantity),
      };
      const fn = side === "BUY" ? api.buyOrder : api.sellOrder;
      const { order, trades: fills, user: updatedUser } = await fn(body);
      setUser(updatedUser);
      if (fills.length > 0) {
        const totalQty = fills.reduce((s, t) => s + t.quantity, 0);
        const avgPx =
          fills.reduce((s, t) => s + t.price * t.quantity, 0) / totalQty;
        setNotice(
          `Filled ${totalQty.toFixed(4)} ${symbol} @ avg $${avgPx.toFixed(2)} (${fills.length} fill${fills.length > 1 ? "s" : ""})`,
        );
      } else {
        setNotice(`Order resting in book at $${Number(price).toFixed(2)}`);
      }
      setPrice("");
      setQuantity("");
      loadOrders();
      loadBook(symbol);
      if (fills.length > 0) loadTrades(symbol);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id) => {
    try {
      const { user: updatedUser } = await api.cancelOrder(id);
      if (updatedUser) setUser(updatedUser);
      loadOrders();
      loadBook(symbol);
    } catch (err) {
      setError(err.message);
    }
  };

  const held = user?.holdings?.[symbol] || 0;
  const cash = user?.cash ?? 0;

  const bestAsk = book.asks?.[0]?.price;
  const bestBid = book.bids?.[0]?.price;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trade</h1>
          <p className="mt-1 text-sm text-muted">
            Tap an order book level to pre-fill the price, then submit.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-line bg-white p-1">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                symbol === s
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface px-4 py-3">
          <p className="text-xs text-muted">Last price</p>
          <p className="mt-0.5 font-mono text-base font-semibold">
            {lastPrice != null
              ? `$${lastPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface px-4 py-3">
          <p className="text-xs text-muted">Best bid / ask</p>
          <p className="mt-0.5 font-mono text-xs font-semibold">
            <span className="text-success">
              {bestBid != null ? `$${bestBid.toFixed(2)}` : "—"}
            </span>
            <span className="mx-1 text-muted">/</span>
            <span className="text-danger">
              {bestAsk != null ? `$${bestAsk.toFixed(2)}` : "—"}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface px-4 py-3">
          <p className="text-xs text-muted">Your {symbol}</p>
          <p className="mt-0.5 font-mono text-base font-semibold">
            {held.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface px-4 py-3">
          <p className="text-xs text-muted">Available cash</p>
          <p className="mt-0.5 font-mono text-base font-semibold">
            ${cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title={`${symbol} / USD`}
          className="lg:col-span-2"
          actions={
            <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success">
              <TrendingUp size={12} /> Live
            </span>
          }
        >
          <div className="relative">
            <div ref={containerRef} className="h-[380px] w-full" />
            {!loadingChart && candles.length === 0 && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/70">
                <p className="text-sm text-muted">
                  No trades yet for {symbol}.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card
          title={`New ${side === "BUY" ? "buy" : "sell"} order`}
          description={`Trading ${symbol}`}
        >
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setSide("BUY")}
              className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                side === "BUY" ? "bg-success text-white" : "text-muted"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide("SELL")}
              className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                side === "SELL" ? "bg-danger text-white" : "text-muted"
              }`}
            >
              Sell
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <Input
              label="Price (USD)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Quantity"
              type="number"
              step="0.0001"
              min="0"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />

            {price && quantity && (
              <div className="rounded-lg border border-line bg-gray-50 px-3 py-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Total</span>
                  <span className="font-mono font-medium text-ink">
                    $
                    {(Number(price) * Number(quantity)).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 2 },
                    )}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs text-success">
                {notice}
              </div>
            )}

            <Button
              type="submit"
              variant={side === "BUY" ? "success" : "danger"}
              size="lg"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : `${side === "BUY" ? "Buy" : "Sell"} ${symbol}`}
            </Button>
          </form>
        </Card>
      </div>

      <Card
        title={`${symbol} order book`}
        description="Click any row to prefill the price and side"
        bodyClassName="p-0"
      >
        <OrderBook book={book} onPick={pickLevel} />
      </Card>

      <Card
        title={`My open ${symbol} orders`}
        description="Click cancel to close a resting order"
      >
        {myOpenForSymbol.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No open orders for {symbol}
          </p>
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-t border-line bg-gray-50 text-left text-xs font-medium text-muted">
                  <th className="px-5 py-2.5">Side</th>
                  <th className="px-5 py-2.5 text-right">Price</th>
                  <th className="px-5 py-2.5 text-right">Qty</th>
                  <th className="px-5 py-2.5 text-right">Remaining</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {myOpenForSymbol.map((o) => (
                  <tr key={o._id} className="border-t border-line">
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          o.side === "BUY"
                            ? "bg-success-soft text-success"
                            : "bg-danger-soft text-danger"
                        }`}
                      >
                        {o.side}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono">
                      ${o.price.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{o.quantity}</td>
                    <td className="px-5 py-3 text-right font-mono">{o.remaining}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusStyles[o.status]}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => cancel(o._id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-gray-100 hover:text-danger"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Trade;
