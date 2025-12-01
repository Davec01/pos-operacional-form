import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch("http://35.223.72.198:4001/contratos", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al obtener contratos" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      status: "ok",
      token: data.token,
      contratos: data.items || [],
      total: data.items?.length || 0,
    });
  } catch (error) {
    console.error("Error en /api/contratos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
