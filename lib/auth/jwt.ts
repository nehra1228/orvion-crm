import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "ORVION_SUPER_SECRET_2026";

export function createToken(payload: JwtPayload | object) {
  return jwt.sign(payload, SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET);
}