import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { User } from "./types.js";

type AuthTokenPayload = { sub: number; role: User["role"]; username: string };

export function signToken(user: User): string {
  return jwt.sign({ sub: user.id, role: user.role, username: user.username }, config.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, config.jwtSecret);
  const typedPayload = payload as Record<string, unknown>;
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof typedPayload.sub !== "number" ||
    typeof typedPayload.role !== "string" ||
    typeof typedPayload.username !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: typedPayload.sub,
    role: typedPayload.role as User["role"],
    username: typedPayload.username,
  };
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
