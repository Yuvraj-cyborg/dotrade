import jwt from "jsonwebtoken";

export function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
