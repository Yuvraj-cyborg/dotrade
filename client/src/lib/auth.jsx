import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, clearToken } from "./api.js";

const AuthContext = createContext(null);

const USER_KEY = "trade-engine-user";

const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const writeUser = (nextUser) => {
    setUserState(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const persist = (nextUser, token) => {
    writeUser(nextUser);
    setToken(token);
  };

  const login = async (email, password) => {
    const { user: u, token } = await api.login({ email, password });
    persist(u, token);
  };

  const register = async (name, email, password) => {
    const { user: u, token } = await api.register({ name, email, password });
    persist(u, token);
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUserState(null);
  };

  const setUser = (nextUser) => {
    if (nextUser) writeUser(nextUser);
  };

  const refreshUser = async () => {
    const { user: u } = await api.me();
    writeUser(u);
    return u;
  };

  useEffect(() => {
    const onExpired = () => setUserState(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const isAuthed = !!user && !!getToken();

  return (
    <AuthContext.Provider
      value={{ user, isAuthed, login, register, logout, setUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
