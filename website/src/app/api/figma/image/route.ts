import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fileKey = req.nextUrl.searchParams.get("fileKey");
  const ids = req.nextUrl.searchParams.get("ids");
  const format = req.nextUrl.searchParams.get("format") || "png";
  const token = req.headers.get("x-figma-token");

  if (!token) {
    return NextResponse.json({ error: "Missing x-figma-token header" }, { status: 401 });
  }
  if (!fileKey) {
    return NextResponse.json({ error: "Missing fileKey param" }, { status: 400 });
  }
  if (!ids) {
    return NextResponse.json({ error: "Missing ids param" }, { status: 400 });
  }

  const res = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=${format}`,
    { headers: { "X-Figma-Token": token } }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
