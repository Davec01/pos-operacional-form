import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch("http://35.223.72.198:4001/empleados", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al obtener empleados" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extraer solo la información necesaria y ordenar alfabéticamente
    const empleados = data.items
      .map((emp: any) => ({
        id: emp.id,
        nombre: emp.nombre,
        contrato: emp.contrato,
        agreement_id: emp.agreement_id || null, // ID del contrato en Odoo
        puesto_trabajo: emp.puesto_trabajo,
        telefono_movil_laboral: emp.telefono_movil_laboral,
      }))
      .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));

    return NextResponse.json({
      status: "ok",
      token: data.token, // Incluir el token para uso posterior
      empleados,
      total: empleados.length,
    });
  } catch (error) {
    console.error("Error en /api/empleados:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
