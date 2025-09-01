// app/api/usuario/route.ts
export const runtime = "nodejs";          // fuerza runtime Node (no Edge)
export const dynamic = "force-dynamic";   // evita caché en dev

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get("telegram_id");
  if (!telegramId) {
    return NextResponse.json({ error: "telegram_id requerido" }, { status: 400 });
  }

  try {
    // Llama a tu FastAPI local
    const res = await fetch(
      `http://35.223.72.198:8000/validar_usuario?telegram_id=${encodeURIComponent(telegramId)}`,
      { headers: { Accept: "application/json" } }
    );
    // Si FastAPI respondió con HTML (error, etc.), lo detectamos
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      const text = await res.text();
      return NextResponse.json(
        { error: `FastAPI no devolvió JSON (${res.status})`, preview: text.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ Error comunicando con FastAPI:", error);
    return NextResponse.json({ error: "Error comunicando con FastAPI" }, { status: 500 });
  }
}
