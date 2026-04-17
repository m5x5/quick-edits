import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fileKey = req.nextUrl.searchParams.get("fileKey");
  const token = req.headers.get("x-figma-token");

  if (!token) {
    return NextResponse.json({ error: "Missing x-figma-token header" }, { status: 401 });
  }
  if (!fileKey) {
    return NextResponse.json({ error: "Missing fileKey param" }, { status: 400 });
  }

  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=2`, {
    headers: { "X-Figma-Token": token },
  });

  if (!res.ok) {
    const text = await res.text();
    const headers: Record<string, string> = {};
    const retryAfter = res.headers.get("retry-after");
    if (retryAfter) headers["retry-after"] = retryAfter;
    return NextResponse.json({ error: text }, { status: res.status, headers });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
