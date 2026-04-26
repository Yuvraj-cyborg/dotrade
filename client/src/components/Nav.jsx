import { NavLink, useNavigate } from "react-router-dom";
import { LineChart, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";

const linkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-soft text-brand"
      : "text-muted hover:bg-gray-100 hover:text-ink"
  }`;

const Nav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 shadow-sm ring-1 ring-black/10">
              <img src="/logo.png" alt="Dotrade" className="h-5 w-5 object-contain" />
            </div>
            <span className="text-sm font-semibold">Dotrade</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard size={14} /> Dashboard
            </NavLink>
            <NavLink to="/trade" className={linkClass}>
              <LineChart size={14} /> Trade
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-ink">{user?.name}</p>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-medium text-muted hover:bg-gray-50 hover:text-ink"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Nav;
