import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@prisma/client";
import { prisma } from "../db.js";
import { env } from "../config.js";

const ALLOWED_DOMAIN = "@logisly.com";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(env.auth.jwksUri));
  }
  return jwks;
}

export type AuthedRequest = Request & { user?: User };

export function roleForEmail(email: string): "admin" | "reporter" {
  return env.adminEmails.includes(email.toLowerCase()) ? "admin" : "reporter";
}

export function isAllowedEmail(email: string, emailVerified: boolean): boolean {
  if (!emailVerified) return false;
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  // Keycloak access tokens often put client id in `azp` and `aud: account`.
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: env.auth.issuer,
  });

  const expected = env.auth.audience;
  if (expected) {
    const aud = payload.aud;
    const audOk =
      aud === expected || (Array.isArray(aud) && aud.includes(expected));
    const azpOk = payload.azp === expected;
    if (!audOk && !azpOk) {
      throw new Error("Invalid token audience");
    }
  }

  return payload;
}

export async function upsertUserFromClaims(payload: JWTPayload): Promise<User> {
  const emailRaw = typeof payload.email === "string" ? payload.email : "";
  const email = emailRaw.toLowerCase();
  const emailVerified =
    payload.email_verified === true || payload.email_verified === "true";
  const sub = typeof payload.sub === "string" ? payload.sub : "";

  if (!email || !sub || !isAllowedEmail(email, emailVerified)) {
    const err = new Error("Hanya akun @logisly.com");
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }

  const name =
    (typeof payload.name === "string" && payload.name.trim()) ||
    (typeof payload.preferred_username === "string" &&
      payload.preferred_username.trim()) ||
    email;
  const role = roleForEmail(email);

  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      role,
      authSub: sub,
      lastLoginAt: new Date(),
    },
    update: {
      name,
      role,
      authSub: sub,
      lastLoginAt: new Date(),
    },
  });
}

export function getUser(req: Request): User | undefined {
  return (req as AuthedRequest).user;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = header.slice("Bearer ".length).trim();
    const payload = await verifyAccessToken(token);
    (req as AuthedRequest).user = await upsertUserFromClaims(payload);
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    const status =
      (err as Error & { statusCode?: number }).statusCode === 403 ? 403 : 401;
    if (status === 403) {
      res.status(403).json({ error: message });
      return;
    }
    console.warn("[auth] token rejected:", message);
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = getUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}

export function isAdmin(user: User): boolean {
  return user.role === "admin";
}
