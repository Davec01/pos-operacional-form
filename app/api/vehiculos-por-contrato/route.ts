import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contrato = searchParams.get("contrato");

    if (!contrato) {
      return NextResponse.json(
        { error: "El parámetro 'contrato' es requerido" },
        { status: 400 }
      );
    }

    const response = await fetch("http://35.223.72.198:4001/flota", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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

    // Filtrar vehículos por contrato y extraer información relevante
    const vehiculosFiltrados = data.items
      .filter((vehiculo: any) => vehiculo.contrato === contrato)
      .map((vehiculo: any) => ({
        id: vehiculo.id,
        nombre: vehiculo.nombre,
        matricula: vehiculo.matricula,
        numero_interno: vehiculo.numero_interno,
        modelo: vehiculo.modelo,
        ultimo_odometro: vehiculo.ultimo_odometro,
        conductor: vehiculo.conductor,
        estado: vehiculo.estado,
        tipo_solicitud: vehiculo.tipo_solicitud,
        capacidad_pasajeros: vehiculo.capacidad_pasajeros,
      }))
      .sort((a: any, b: any) => {
        // Ordenar por número interno si existe, sino por nombre
        if (a.numero_interno && b.numero_interno) {
          return a.numero_interno.localeCompare(b.numero_interno);
        }
        return a.nombre.localeCompare(b.nombre);
      });

    return NextResponse.json({
      status: "ok",
      token: data.token, // Incluir el token para uso posterior
      contrato,
      vehiculos: vehiculosFiltrados,
      total: vehiculosFiltrados.length,
    });
  } catch (error) {
    console.error("Error en /api/vehiculos-por-contrato:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
