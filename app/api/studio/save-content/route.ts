import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const CONTENT_PATH = path.join(process.cwd(), "data/site-content.json");

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development" }, { status: 403 });
  }

  const body = await request.json();
  if (!body?.cards || typeof body.cards !== "object") {
    return NextResponse.json({ error: "Malformed content payload" }, { status: 400 });
  }

  await fs.writeFile(CONTENT_PATH, JSON.stringify(body, null, 2) + "\n", "utf-8");
  return NextResponse.json({ ok: true });
}
