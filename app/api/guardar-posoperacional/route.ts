import { NextRequest, NextResponse } from "next/server";
import { Client } from "@elastic/elasticsearch";

export const dynamic = "force-dynamic";

// Configurar cliente de Elasticsearch
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL!,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY!,
  },
});

// Función para crear el índice con mapping de keywords
async function createIndexIfNotExists() {
  const indexName = process.env.ELASTICSEARCH_INDEX || "pos_operacional";

  try {
    const exists = await esClient.indices.exists({ index: indexName });

    if (!exists) {
      await esClient.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              // Campos de texto
              state: { type: "keyword" },
              cost_id: { type: "keyword" },
              fuel_type: { type: "keyword" },
              observations: { type: "keyword" },
              notes: { type: "keyword" },
              attachment_filename: { type: "keyword" },
              odoo_response: { type: "keyword" },

              // Campos numéricos
              company_id: { type: "integer" },
              employee_id: { type: "integer" },
              agreement_id: { type: "integer" },
              vehicle_id: { type: "integer" },
              lunch_hour: { type: "float" },
              km_start: { type: "float" },
              km_end: { type: "float" },
              km_traveled: { type: "float" },
              fuel_value: { type: "float" },
              km_fuel: { type: "float" },
              gallons: { type: "float" },
              feeding_value: { type: "float" },
              lodging_value: { type: "float" },
              tolls_value: { type: "float" },
              others_value: { type: "float" },

              // Campos booleanos
              fuel: { type: "boolean" },
              fuel_expenses: { type: "boolean" },
              feeding: { type: "boolean" },
              lodging: { type: "boolean" },
              tolls: { type: "boolean" },
              others: { type: "boolean" },
              has_attachment: { type: "boolean" },

              // Fechas
              entrada: { type: "date", format: "yyyy-MM-dd HH:mm:ss" },
              salida: { type: "date", format: "yyyy-MM-dd HH:mm:ss" },
              timestamp: { type: "date" },
            },
          },
        },
      });
      console.log(`✅ Índice '${indexName}' creado con mapping de keywords`);
    }
  } catch (error) {
    console.error("⚠️ Error al crear índice de Elasticsearch:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validar que tengamos el token
    if (!data.token) {
      return NextResponse.json(
        { error: "Token de autenticación requerido" },
        { status: 400 }
      );
    }

    // Preparar el body según el formato de Odoo
    const odooBody = {
      state: "draft",
      company_id: 1,
      employee_id: data.employee_id,

      check_in: data.check_in,
      check_out: data.check_out,

      agreement_id: data.agreement_id,
      vehicle_id: data.vehicle_id,
      lunch_hour: data.lunch_hour || 1.0,
      km_start: data.km_start || 0,
      km_end: data.km_end || 0,
      km_traveled: data.km_traveled || 0,
      cost_id: data.cost_id || "",

      fuel_type: data.fuel_type || "diesel",
      fuel: data.fuel || false,
      fuel_value: data.fuel_value || 0,
      fuel_expenses: data.fuel_expenses || false,
      km_fuel: data.km_fuel || 0,
      gallons: data.gallons || 0,

      feeding_value: data.feeding_value || 0,
      feeding: data.feeding || false,
      lodging_value: data.lodging_value || 0,
      lodging: data.lodging || false,
      tolls_value: data.tolls_value || 0,
      tolls: data.tolls || false,
      others_value: data.others_value || 0,
      others: data.others || false,

      observations: data.observations || "",
      notes: data.notes || "",

      // Archivo adjunto (PDF o imagen)
      attachment: data.attachment || false,
      attachment_filename: data.attachment_filename || false,
    };

    // Hacer POST a Odoo Producción
    const response = await fetch(
      "https://www.viacotur.com/api/posoperacional/register",
      // "https://viacotur16-qa13-28046660.dev.odoo.com/api/posoperacional/register",

      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify(odooBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error de Odoo:", errorData);
      return NextResponse.json(
        { error: "Error al registrar en Odoo", details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Enviar los mismos datos a Elasticsearch (sin el attachment que es muy grande)
    try {
      // Crear índice si no existe (con mapping de keywords)
      await createIndexIfNotExists();

      // Preparar documento sin el attachment (demasiado grande para keyword)
      const { attachment, check_in, check_out, ...docWithoutAttachment } = odooBody;

      // Insertar documento con timestamp y nombres de campos renombrados
      await esClient.index({
        index: process.env.ELASTICSEARCH_INDEX || "pos_operacional",
        document: {
          ...docWithoutAttachment,
          entrada: check_in, // Renombrar check_in a entrada
          salida: check_out, // Renombrar check_out a salida
          timestamp: new Date().toISOString(), // Timestamp solo para Elasticsearch
          odoo_response: JSON.stringify(result),
          has_attachment: !!attachment, // Solo guardamos si tiene attachment o no
        },
      });
      console.log("✅ Datos guardados en Elasticsearch");
    } catch (esError) {
      console.error("⚠️ Error al guardar en Elasticsearch (no crítico):", esError);
      // No fallar la petición si Elasticsearch falla
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error al guardar POS-OPERACIONAL:", error);
    return NextResponse.json(
      { error: "Error al guardar en Odoo" },
      { status: 500 }
    );
  }
}
