import { NextResponse } from "next/server";
import { getAdminEnvChecks } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const checks = getAdminEnvChecks();
  const missing = checks.filter((check) => !check.present);

  return NextResponse.json({
    ok: missing.length === 0,
    checks,
    missing
  });
}
