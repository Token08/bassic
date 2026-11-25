import { createHash, randomBytes } from "node:crypto";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
const cookieName = "bassic_google_login";
const cookieOptions = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/api/login/google" };
const randomToken = () => randomBytes(32).toString("base64url");

export async function GET(request: NextRequest) {
  const clientId = process.env.ADMIN_GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.ADMIN_GOOGLE_CLIENT_SECRET?.trim();
  const email = process.env.ADMIN_GOOGLE_EMAIL?.trim().toLowerCase();
  const origin = process.env.ADMIN_GOOGLE_ORIGIN?.trim();
  if (process.env.ADMIN_AUTH_MODE !== "google" || !clientId || !clientSecret || !email || !/^[a-z0-9.]+@gmail\.com$/.test(email) ||
      !origin || !/^https:\/\/[a-z0-9.-]+$/i.test(origin)) {
    return NextResponse.json({ ok: false, message: "Googleログインの設定が必要です。" }, { status: 503 });
  }

  const callback = origin + "/api/login/google";
  if (request.nextUrl.origin !== origin) return NextResponse.redirect(callback);
  const { searchParams } = request.nextUrl;
  const client = new OAuth2Client(clientId, clientSecret, callback);

  if (!searchParams.has("code") && !searchParams.has("error") && !searchParams.has("state")) {
    const flow = { state: randomToken(), nonce: randomToken(), verifier: randomToken() };
    const url = client.generateAuthUrl({
      scope: ["openid", "email"],
      prompt: "select_account",
      state: flow.state,
      code_challenge: createHash("sha256").update(flow.verifier).digest("base64url"),
      code_challenge_method: CodeChallengeMethod.S256
    });
    const authorizationUrl = new URL(url);
    authorizationUrl.searchParams.set("nonce", flow.nonce);
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(cookieName, JSON.stringify(flow), { ...cookieOptions, maxAge: 300 });
    return response;
  }

  function finish(result?: "failed" | "denied") {
    const response = NextResponse.redirect(origin + (result ? "/?login=" + result : "/"));
    response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
    return response;
  }

  try {
    const rawFlow = request.cookies.get(cookieName)?.value;
    const code = searchParams.get("code");
    if (!code || !rawFlow || searchParams.has("error")) return finish("failed");
    const flow = JSON.parse(rawFlow) as { state?: string; nonce?: string; verifier?: string };
    if (!flow.state || !flow.nonce || !flow.verifier || flow.state !== searchParams.get("state")) return finish("failed");
    const { tokens } = await client.getToken({ code, codeVerifier: flow.verifier });
    if (!tokens.id_token) return finish("failed");
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload || payload.nonce !== flow.nonce) return finish("failed");
    if (!payload.email_verified || payload.email?.toLowerCase() !== email || !payload.sub) return finish("denied");
    await setSessionCookie(createSessionToken(payload.sub, email));
    return finish();
  } catch {
    return finish("failed");
  }
}
