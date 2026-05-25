import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const basicAuth = Buffer.from("Vi4c0:P@ssw0rd").toString("base64");
    const response = await fetch("http://35.223.72.198:4001/flota", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al obtener vehículos" },
        { status: response.status }
      );
    }

    const data = await response.json();

    const vehiculos = data.items
      .map((v: any) => ({
        id: v.id,
        nombre: v.nombre,
        matricula: v.matricula,
        numero_interno: v.numero_interno,
        modelo: v.modelo,
        ultimo_odometro: v.ultimo_odometro,
        conductor: v.conductor,
        estado: v.estado,
        contrato: v.contrato,
      }))
      .sort((a: any, b: any) => {
        if (a.numero_interno && b.numero_interno) {
          return a.numero_interno.localeCompare(b.numero_interno);
        }
        return a.nombre.localeCompare(b.nombre);
      });

    return NextResponse.json({
      status: "ok",
      token: data.token,
      vehiculos,
      total: vehiculos.length,
    });
  } catch (error) {
    console.error("Error en /api/vehiculos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
