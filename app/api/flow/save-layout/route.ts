import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const SCENE_PATH = path.join(process.cwd(), "data/flow-scene.json");

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development" }, { status: 403 });
  }

  const body = await request.json();
  if (!Array.isArray(body?.nodes)) {
    return NextResponse.json({ error: "Malformed layout payload" }, { status: 400 });
  }

  await fs.writeFile(SCENE_PATH, JSON.stringify(body, null, 2) + "\n", "utf-8");
  return NextResponse.json({ ok: true });
}
