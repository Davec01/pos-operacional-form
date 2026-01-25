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
      console.log("❌ [usuario] No se encontró empleado con codigo_pin:", telegramId);
      return NextResponse.json(
        { error: "Usuario no registrado en el sistema" },
        { status: 404 }
      );
    }

    // Verificar que el empleado sea Conductor
    if (empleado.puesto_trabajo !== "Conductor") {
      console.log("❌ [usuario] Empleado encontrado pero no es Conductor:", {
        nombre: empleado.nombre,
        puesto_trabajo: empleado.puesto_trabajo
      });
      return NextResponse.json(
        {
          error: "Acceso solo para Conductores",
          detalle: `Tu puesto de trabajo es "${empleado.puesto_trabajo || 'No asignado'}". Este formulario es exclusivo para Conductores.`
        },
        { status: 403 }
      );
    }

    console.log("✅ [usuario] Conductor autorizado:", empleado.nombre);

    return NextResponse.json({
      nombre: empleado.nombre,
      documento: empleado.identificacion,
      telegram_id: telegramId,
      empleado_id: empleado.id,
      puesto_trabajo: empleado.puesto_trabajo,
    });
  } catch (error: any) {
    console.error("❌ Error consultando usuario:", error);
    return NextResponse.json(
      { error: "Error consultando empleados de Odoo" },
      { status: 500 }
    );
  }
}
