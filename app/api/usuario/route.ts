// app/api/usuario/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get("telegram_id");

  if (!telegramId) {
    return NextResponse.json(
      { error: "telegram_id requerido" },
      { status: 400 }
    );
  }

  try {
    // Consultar en la tabla usuarios_registrados de PostgreSQL
    const result = await pool.query(
      `SELECT nombre, documento, telegram_id
       FROM public.usuarios_registrados
       WHERE telegram_id = $1
       LIMIT 1`,
      [telegramId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no registrado en el sistema" },
        { status: 404 }
      );
    }

    const usuario = result.rows[0];

    return NextResponse.json({
      nombre: usuario.nombre,
      documento: usuario.documento,
      telegram_id: usuario.telegram_id,
    });
  } catch (error: any) {
    console.error("❌ Error consultando usuario:", error);
    return NextResponse.json(
      { error: "Error consultando base de datos" },
      { status: 500 }
    );
  }
}
