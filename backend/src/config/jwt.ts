import path from "node:path";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const secret = process.env.SECRET_KEY;
if (!secret) {
  throw new Error("Missing SECRET_KEY in environment variables");
}

const jwtSecret = secret;
const issuer = process.env.JWT_ISSUER ?? "hisabkitab";
const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";

export function signToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, jwtSecret, {
    expiresIn: expiresIn as never,
    issuer,
  } as any);
}

export function verifyToken(token: string) {
  return jwt.verify(token, jwtSecret, {
    issuer,
  } as any);
}

export function extractBearerToken(headerValue?: string) {
  if (!headerValue) return undefined;

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : undefined;
}
