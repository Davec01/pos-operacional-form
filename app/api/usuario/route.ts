// app/api/usuario/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get("telegram_id");

  if (!telegramId) {
    return NextResponse.json(
      { error: "telegram_id requerido" },
      { status: 400 }
    );
  }

  try {
    // Consultar el endpoint de empleados
    const response = await fetch("http://35.223.72.198:4001/empleados", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al obtener empleados de Odoo" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Buscar empleado por codigo_pin que coincida con telegram_id
    const empleado = data.items.find(
      (emp: any) => emp.codigo_pin === telegramId
    );

    if (!empleado) {
      return NextResponse.json(
        { error: "Usuario no registrado en el sistema" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      nombre: empleado.nombre,
      documento: empleado.identificacion,
      telegram_id: telegramId,
      empleado_id: empleado.id,
    });
  } catch (error: any) {
    console.error("❌ Error consultando usuario:", error);
    return NextResponse.json(
      { error: "Error consultando empleados de Odoo" },
      { status: 500 }
    );
  }
}
