import { NextRequest, NextResponse } from "next/server";
import { poolQA } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get("telegram_id");

    console.log("🔍 [vehiculo-asignado] Recibido telegram_id:", telegramId);

    if (!telegramId) {
      return NextResponse.json(
        { error: "telegram_id es requerido" },
        { status: 400 }
      );
    }

    // Consultar estado_vehiculos para obtener el vehiculo_id del conductor
    // Filtrar por estado='activo' y desactivado_en=NULL
    console.log("📊 [vehiculo-asignado] Consultando estado_vehiculos...");
    const result = await poolQA.query(
      `SELECT vehiculo_id, vehiculo_nombre, estado, conductor_nombre
       FROM public.estado_vehiculos
       WHERE telegram_user_id = $1
         AND estado = 'activo'
         AND desactivado_en IS NULL
       ORDER BY id DESC
       LIMIT 1`,
      [telegramId]
    );

    console.log("✅ [vehiculo-asignado] Resultado de la query:", {
      telegram_id: telegramId,
      rows_count: result.rows.length,
      rows: result.rows
    });

    if (result.rows.length === 0) {
      console.log("❌ [vehiculo-asignado] No se encontró vehículo para telegram_id:", telegramId);
      return NextResponse.json(
        {
          error: "No se encontró vehículo asignado para este conductor",
          telegram_id: telegramId,
          debug: "No hay registros activos en estado_vehiculos"
        },
        { status: 404 }
      );
    }

    const { vehiculo_id, vehiculo_nombre, conductor_nombre } = result.rows[0];
    console.log("✅ [vehiculo-asignado] Vehículo encontrado en BD:", {
      vehiculo_id,
      vehiculo_nombre,
      conductor_nombre
    });

    // Ahora buscar en el endpoint /flota para obtener detalles completos
    console.log("🌐 [vehiculo-asignado] Consultando endpoint de flota...");
    const flotaResponse = await fetch("http://35.223.72.198:4001/flota", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!flotaResponse.ok) {
      console.log("❌ [vehiculo-asignado] Error en respuesta de flota:", flotaResponse.status);
      throw new Error("Error al consultar el endpoint de flota");
    }

    const flotaData = await flotaResponse.json();
    const token = flotaData.token || null;

    console.log("📦 [vehiculo-asignado] Datos de flota recibidos:", {
      total_items: flotaData.items?.length,
      buscando_id: vehiculo_id
    });

    // Buscar el vehículo específico por ID
    const vehiculo = flotaData.items.find(
      (v: any) => v.id === vehiculo_id
    );

    if (vehiculo) {
      console.log("✅ [vehiculo-asignado] Vehículo encontrado en flota:", {
        id: vehiculo.id,
        nombre: vehiculo.nombre,
        matricula: vehiculo.matricula
      });
    } else {
      console.log("❌ [vehiculo-asignado] Vehículo NO encontrado en flota. ID buscado:", vehiculo_id);
    }

    if (!vehiculo) {
      console.log("❌ [vehiculo-asignado] Vehículo no encontrado en flota");
      return NextResponse.json(
        {
          error: "Vehículo no encontrado en flota",
          vehiculo_id,
          vehiculo_nombre,
          debug: `El vehículo con ID ${vehiculo_id} existe en estado_vehiculos pero no en /flota`
        },
        { status: 404 }
      );
    }

    // Retornar el vehículo con todos sus detalles
    const respuesta = {
      vehiculo: {
        id: vehiculo.id,
        nombre: vehiculo.nombre,
        matricula: vehiculo.matricula,
        numero_interno: vehiculo.numero_interno,
        modelo: vehiculo.modelo,
        ultimo_odometro: vehiculo.ultimo_odometro,
        conductor: vehiculo.conductor,
        estado: vehiculo.estado,
        contrato: vehiculo.contrato,
        tipo_solicitud: vehiculo.tipo_solicitud,
        capacidad_pasajeros: vehiculo.capacidad_pasajeros,
      },
      token,
    };

    console.log("✅ [vehiculo-asignado] Retornando vehículo:", respuesta.vehiculo);
    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("❌ [vehiculo-asignado] Error general:", error);
    return NextResponse.json(
      { error: "Error al obtener vehículo asignado", details: String(error) },
      { status: 500 }
    );
  }
}
