import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const cookieName = "bassic_admin_session";
const maxAgeSeconds = 60 * 60 * 12;

type SessionPayload = {
  exp: number;
  nonce: string;
};

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 24) {
    throw new Error("ADMIN_SESSION_SECRET must be set to at least 24 characters.");
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function createSessionToken() {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    nonce: randomBytes(16).toString("hex")
  };
  const encoded = toBase64Url(JSON.stringify(payload));

  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token?: string | null) {
  if (!token) {
    return false;
  }

  const [encoded, signature] = token.split(".");

  if (!encoded || !signature || !safeCompare(signature, sign(encoded))) {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as SessionPayload;

    return Boolean(payload.exp && payload.exp > Math.floor(Date.now() / 1000));
  } catch {
    return false;
  }
}

export function isAuthenticatedRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(cookieName)?.value);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function getCookieName() {
  return cookieName;
}
