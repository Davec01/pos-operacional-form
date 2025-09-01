// app/api/vehiculos-por-persona/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type RawItem = {
  id: number;
  contrato: string;
  responsable: string;
  empleado: string;
  vehiculo: string;        // "Toyota/Prado/EOV152"
  numero_interno: string;  // "021"
  odometer_actual?: number;
};

function norm(s: unknown): string {
  return String(s ?? "").normalize("NFC").trim().toLowerCase();
}

export async function GET(req: NextRequest) {
  const qPersona = (req.nextUrl.searchParams.get("persona") || "").trim();
  if (!qPersona) {
    return NextResponse.json({ error: "persona requerida" }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), "preoperacional.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { items?: RawItem[] };
    const items = parsed.items ?? [];

    const want = norm(qPersona);

    // 1) Contratos donde esa persona figura como empleado
    const contratosDeLaPersona = new Set(
      items.filter((it) => norm(it.empleado) === want).map((it) => it.contrato)
    );

    if (!contratosDeLaPersona.size) {
      return NextResponse.json({
        persona: qPersona,
        contratos: [],
        message: "No se encontraron vehículos para esta persona",
      });
    }

    // 2) Traer TODOS los registros de esos contratos (sin importar el empleado)
    const universe = items.filter((it) => contratosDeLaPersona.has(it.contrato));

    // 3) Agrupar por contrato y deduplicar vehículos
    const contratosMap = new Map<
      string,
      {
        contrato: string;
        responsablesCount: Map<string, number>;
        vehiculos: Array<{
          id: number;
          numeroInterno: string;
          vehiculo: string;
          odometro?: number;
        }>;
      }
    >();

    for (const it of universe) {
      const contrato = it.contrato || "(Sin contrato)";
      if (!contratosMap.has(contrato)) {
        contratosMap.set(contrato, {
          contrato,
          responsablesCount: new Map(),
          vehiculos: [],
        });
      }
      const bucket = contratosMap.get(contrato)!;

      // Contar responsables para elegir el más frecuente si quieres mostrarlo
      const r = it.responsable?.trim() || "";
      if (r) bucket.responsablesCount.set(r, (bucket.responsablesCount.get(r) || 0) + 1);

      // Dedup por número interno (o por texto de vehículo si no hay número)
      const numInt = String(it.numero_interno ?? "").trim();
      const vehTxt = String(it.vehiculo ?? "").trim();

      const ya = bucket.vehiculos.find(
        (v) =>
          (numInt && v.numeroInterno === numInt) ||
          (!numInt && vehTxt && v.vehiculo === vehTxt)
      );
      if (!ya) {
        bucket.vehiculos.push({
          id: it.id,
          numeroInterno: numInt || "-",
          vehiculo: vehTxt || "-",
          odometro: typeof it.odometer_actual === "number" ? it.odometer_actual : undefined,
        });
      }
    }

    // 4) Construir salida ordenada
    const contratos = Array.from(contratosMap.values())
      .map((c) => {
        // responsable "representativo" del contrato (el más frecuente)
        let best: string | undefined = undefined;
        let max = -1;
        for (const [name, count] of c.responsablesCount.entries()) {
          if (count > max) {
            max = count;
            best = name;
          }
        }
        return {
          contrato: c.contrato,
          responsable: best,
          vehiculos: c.vehiculos.sort((a, b) =>
            String(a.numeroInterno).localeCompare(String(b.numeroInterno))
          ),
        };
      })
      .sort((a, b) => a.contrato.localeCompare(b.contrato));

    return NextResponse.json({ persona: qPersona, contratos });
  } catch (err) {
    console.error("Error leyendo preoperacional.json:", err);
    return NextResponse.json({ error: "No se pudo leer el JSON" }, { status: 500 });
  }
}
