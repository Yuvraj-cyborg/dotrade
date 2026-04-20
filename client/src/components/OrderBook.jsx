const fmtPrice = (n) =>
  n == null
    ? "—"
    : n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

const fmtQty = (n) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 4 });

const Row = ({ level, side, maxQty, onClick }) => {
  const pct = Math.min(100, (level.quantity / maxQty) * 100);
  const bar = side === "ask" ? "bg-danger-soft" : "bg-success-soft";
  const color = side === "ask" ? "text-danger" : "text-success";
  const align = side === "ask" ? "left-0" : "right-0";

  return (
    <button
      type="button"
      onClick={() => onClick(level)}
      className="relative grid w-full grid-cols-[1fr_1fr_auto] items-center gap-3 px-3 py-1 text-left text-xs hover:bg-gray-50"
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 ${align} ${bar}`}
        style={{ width: `${pct}%`, opacity: 0.35 }}
      />
      <span className={`relative font-mono font-semibold ${color}`}>
        {fmtPrice(level.price)}
      </span>
      <span className="relative text-right font-mono text-muted tabular-nums">
        {fmtQty(level.quantity)}
      </span>
      <span className="relative w-6 text-right font-mono text-[10px] text-muted/70 tabular-nums">
        {level.orders}
      </span>
    </button>
  );
};

const Column = ({ title, levels, side, maxQty, onClick, emptyLabel }) => (
  <div className="flex flex-col">
    <div className="flex items-center justify-between border-b border-line bg-gray-50 px-3 py-2">
      <span
        className={`text-xs font-semibold ${
          side === "ask" ? "text-danger" : "text-success"
        }`}
      >
        {title}
      </span>
      <span className="text-[10px] text-muted">
        {levels.length} level{levels.length === 1 ? "" : "s"}
      </span>
    </div>
    <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
      <span>Price</span>
      <span className="text-right">Qty</span>
      <span className="w-6 text-right">#</span>
    </div>
    {levels.length === 0 ? (
      <p className="px-3 py-6 text-center text-xs text-muted">{emptyLabel}</p>
    ) : (
      levels
        .slice(0, 10)
        .map((level) => (
          <Row
            key={`${side}-${level.price}`}
            level={level}
            side={side}
            maxQty={maxQty}
            onClick={onClick}
          />
        ))
    )}
  </div>
);

const OrderBook = ({ book, onPick }) => {
  const { bids = [], asks = [], lastPrice } = book || {};
  const maxQty = Math.max(
    1,
    ...bids.map((b) => b.quantity),
    ...asks.map((a) => a.quantity),
  );

  const bestAsk = asks[0]?.price;
  const bestBid = bids[0]?.price;
  const spread =
    bestAsk != null && bestBid != null ? bestAsk - bestBid : null;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 border-b border-line bg-gray-50 px-4 py-2 text-xs">
        <span className="text-muted">
          Best bid{" "}
          <span className="font-mono font-semibold text-success">
            ${fmtPrice(bestBid)}
          </span>
        </span>
        <span className="text-muted">
          Last{" "}
          <span className="font-mono font-semibold text-ink">
            ${fmtPrice(lastPrice)}
          </span>
        </span>
        <span className="text-muted">
          Best ask{" "}
          <span className="font-mono font-semibold text-danger">
            ${fmtPrice(bestAsk)}
          </span>
        </span>
        <span className="text-muted">
          Spread{" "}
          <span className="font-mono font-semibold text-ink">
            ${fmtPrice(spread)}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
        <Column
          title="Bids (click to sell)"
          levels={bids}
          side="bid"
          maxQty={maxQty}
          onClick={(l) => onPick(l, "SELL")}
          emptyLabel="No bids resting"
        />
        <Column
          title="Asks (click to buy)"
          levels={asks}
          side="ask"
          maxQty={maxQty}
          onClick={(l) => onPick(l, "BUY")}
          emptyLabel="No asks resting"
        />
      </div>
    </div>
  );
};

export default OrderBook;
