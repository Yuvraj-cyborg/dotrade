import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import Nav from "./Nav.jsx";

const ProtectedRoute = () => {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;
