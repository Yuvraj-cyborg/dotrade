import { verifyToken } from "../utils/jwt.js";

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  try {
    const decoded = verifyToken(header.slice(7));
    req.user = { id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export default auth;
