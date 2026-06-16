import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { createContent, getContent, updateObjectContent } from "@/lib/microcms";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    endpoint: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
}

function loadFailed() {
  return NextResponse.json(
    { ok: false, message: "読み込みできませんでした。時間をおいて再度お試しください。直らない場合は担当者へ連絡してください。" },
    { status: 502 }
  );
}

function saveFailed() {
  return NextResponse.json(
    { ok: false, message: "保存できませんでした。時間をおいて再度お試しください。直らない場合は担当者へ連絡してください。" },
    { status: 502 }
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isAuthenticatedRequest(request)) {
    return unauthorized();
  }

  try {
    const { endpoint } = await context.params;
    const data = await getContent(endpoint);

    return NextResponse.json({ ok: true, data });
  } catch {
    return loadFailed();
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isAuthenticatedRequest(request)) {
    return unauthorized();
  }

  try {
    const { endpoint } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const data = payload.id ? await updateObjectContent(endpoint, payload) : await createContent(endpoint, payload);

    return NextResponse.json({ ok: true, data });
  } catch {
    return saveFailed();
  }
}
