import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const publicAssetsRoot = path.resolve(process.cwd(), "..", "public", "assets");

const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function resolveAssetPath(parts: string[]) {
  const resolvedPath = path.resolve(publicAssetsRoot, ...parts);
  const relativePath = path.relative(publicAssetsRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return "";
  }

  return resolvedPath;
}

export async function GET(_request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  const assetPath = resolveAssetPath(params.path || []);

  if (!assetPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const fileStat = await stat(assetPath);
    if (!fileStat.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const body = await readFile(assetPath);
    const ext = path.extname(assetPath).toLowerCase();

    return new NextResponse(body, {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": contentTypes[ext] || "application/octet-stream"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
