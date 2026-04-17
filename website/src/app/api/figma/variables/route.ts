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

  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/variables/local`,
    { headers: { "X-Figma-Token": token } }
  );

  if (!res.ok) {
    const text = await res.text();
    // If 403, the token likely lacks file_variables:read scope (requires OAuth, not PAT)
    if (res.status === 403) {
      return NextResponse.json(
        { error: "Variables API requires file_variables:read scope. Personal Access Tokens may not have this scope — token data will be extracted from the file structure instead.", needsFallback: true },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
