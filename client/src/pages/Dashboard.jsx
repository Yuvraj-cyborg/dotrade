import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Wallet, Coins, CheckCircle2 } from "lucide-react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

const SYMBOLS = ["BTC", "ETH", "SOL", "AVAX"];

const statusStyles = {
  OPEN: "bg-blue-50 text-blue-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  FILLED: "bg-success-soft text-success",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const Stat = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-xl border border-line bg-surface p-5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">
        <Icon size={15} />
      </div>
    </div>
    <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </div>
);

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    api
      .listOrders()
      .then(({ orders }) => setOrders(orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCount = orders.filter(
    (o) => o.status === "OPEN" || o.status === "PARTIAL",
  ).length;
  const filledCount = orders.filter((o) => o.status === "FILLED").length;

  const cash = user?.cash ?? 0;
  const holdings = user?.holdings || {};
  const hasAnyHolding = SYMBOLS.some((s) => (holdings[s] || 0) > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your simulated trading account.
          </p>
        </div>
        <Link to="/trade">
          <Button>
            New order <ArrowUpRight size={14} />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          icon={Wallet}
          label="Cash balance"
          value={`$${cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />
        <Stat
          icon={Coins}
          label="Open orders"
          value={openCount}
          hint="Including partial fills"
        />
        <Stat
          icon={CheckCircle2}
          label="Filled orders"
          value={filledCount}
        />
      </div>

      <Card title="Holdings" description="Tokens currently in your portfolio">
        {!hasAnyHolding ? (
          <p className="py-8 text-center text-sm text-muted">
            You don't hold any tokens yet. Place a buy order to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SYMBOLS.map((s) => {
              const qty = holdings[s] || 0;
              return (
                <div
                  key={s}
                  className="rounded-lg border border-line bg-surface px-4 py-3"
                >
                  <p className="text-xs font-medium text-muted">{s}</p>
                  <p className="mt-1 font-mono text-lg font-semibold tracking-tight">
                    {qty.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card
        title="Recent orders"
        description="Your latest 10 orders"
        actions={
          <Link to="/trade" className="text-xs font-medium text-brand hover:underline">
            View trade page
          </Link>
        }
        className="overflow-hidden"
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium">No orders yet</p>
            <p className="mt-1 text-xs text-muted">
              Place your first order from the trade page.
            </p>
          </div>
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-t border-line bg-gray-50 text-left text-xs font-medium text-muted">
                  <th className="px-5 py-2.5">Symbol</th>
                  <th className="px-5 py-2.5">Side</th>
                  <th className="px-5 py-2.5 text-right">Price</th>
                  <th className="px-5 py-2.5 text-right">Qty</th>
                  <th className="px-5 py-2.5 text-right">Remaining</th>
                  <th className="px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((o) => (
                  <tr key={o._id} className="border-t border-line">
                    <td className="px-5 py-3 font-mono font-medium">{o.symbol}</td>
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

export default Dashboard;
