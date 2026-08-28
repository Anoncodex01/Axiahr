/**
 * Edge Runtime compatible JWT utilities
 * Use this in middleware / edge API routes
 */

import { jwtVerify, SignJWT } from "jose";

// ----- ENVIRONMENT CHECKS -----
const RAW_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;
const RAW_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

if (!RAW_SECRET) {
  throw new Error("Missing NEXT_PUBLIC_JWT_SECRET environment variable");
}

// Convert secret → Uint8Array (required by jose in Edge runtime)
const SECRET = new TextEncoder().encode(RAW_SECRET);

// ----- EXPIRATION PARSER -----
function parseExpires(exp: string): number {
  const match = exp.match(/^(\d+)([dhm])$/i);

  if (!match) {
    throw new Error(
      `Invalid JWT_EXPIRES_IN format "${exp}". Use formats like "7d", "12h", "30m".`
    );
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60; // days → seconds
    case "h":
      return value * 60 * 60; // hours → seconds
    case "m":
      return value * 60; // minutes → seconds
    default:
      throw new Error("Invalid time unit in expiration");
  }
}

const EXPIRES_IN_SECONDS = parseExpires(RAW_EXPIRES);

// ======================================================
//  VERIFY JWT (EDGE RUNTIME SAFE)
// ======================================================
export async function verifyTokenEdge(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch (err: any) {
    if (err.code === "ERR_JWT_EXPIRED") {
      throw new Error("Token expired");
    }
    if (err.code === "ERR_JWT_INVALID") {
      throw new Error("Invalid token signature");
    }
    throw new Error(`Token verification failed: ${err.message}`);
  }
}

// ======================================================
//  GENERATE JWT (OPTIONAL FOR EDGE)
// ======================================================
export async function generateTokenEdge(payload: Record<string, any>) {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + EXPIRES_IN_SECONDS)
    .sign(SECRET);
}
