import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { deleteContent, updateContent } from "@/lib/microcms";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    endpoint: string;
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { endpoint, id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const data = await updateContent(endpoint, id, payload);

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, message: "保存できませんでした。時間をおいて再度お試しください。直らない場合は担当者へ連絡してください。" },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { endpoint, id } = await context.params;
    await deleteContent(endpoint, id);

    return NextResponse.json({ ok: true, data: { id } });
  } catch {
    return NextResponse.json(
      { ok: false, message: "削除できませんでした。時間をおいて再度お試しください。直らない場合は担当者に連絡してください。" },
      { status: 502 }
    );
  }
}
