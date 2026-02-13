import { NextRequest, NextResponse } from "next/server";
import { Client } from "@elastic/elasticsearch";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

// Configuración de PostgreSQL
const DB_CONFIG = {
  host: "34.174.97.159",
  port: 5432,
  database: "viacotur",
  user: "viacotur",
  password: "viacotur_pass",
};

// Pool de conexiones de PostgreSQL (lazy initialization)
let pgPool: Pool | null = null;

function getPgPool() {
  if (!pgPool) {
    pgPool = new Pool(DB_CONFIG);
  }
  return pgPool;
}

// Función para obtener el cliente de Elasticsearch (lazy initialization)
function getEsClient() {
  if (!process.env.ELASTICSEARCH_URL || !process.env.ELASTICSEARCH_API_KEY) {
    return null;
  }

  return new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth: {
      apiKey: process.env.ELASTICSEARCH_API_KEY,
    },
  });
}

// Función para guardar en PostgreSQL
async function saveToPostgres(data: any) {
  const pool = getPgPool();

  try {
    const query = `
      INSERT INTO pos_operacional (
        state, company_id, employee_id, check_in, check_out, agreement_id,
        vehicle_id, lunch_hour, km_start, km_end, km_traveled, cost_id,
        fuel_type, fuel, fuel_value, fuel_expenses, km_fuel, gallons,
        feeding_value, feeding, lodging_value, lodging, tolls_value, tolls,
        others_value, others, observations, notes, attachment, attachment_filename
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING id
    `;

    const values = [
      data.state,
      data.company_id,
      data.employee_id,
      data.check_in,
      data.check_out,
      data.agreement_id,
      data.vehicle_id,
      data.lunch_hour,
      data.km_start,
      data.km_end,
      data.km_traveled,
      data.cost_id,
      data.fuel_type,
      data.fuel,
      data.fuel_value,
      data.fuel_expenses,
      data.km_fuel,
      data.gallons,
      data.feeding_value,
      data.feeding,
      data.lodging_value,
      data.lodging,
      data.tolls_value,
      data.tolls,
      data.others_value,
      data.others,
      data.observations,
      data.notes,
      data.attachment || null,
      data.attachment_filename || null,
    ];

    const result = await pool.query(query, values);
    console.log("✅ Datos guardados en PostgreSQL con ID:", result.rows[0]?.id);
    return result.rows[0];
  } catch (error) {
    console.error("⚠️ Error al guardar en PostgreSQL:", error);
    throw error;
  }
}

// Función para crear el índice con mapping de keywords
async function createIndexIfNotExists() {
  const esClient = getEsClient();
  if (!esClient) return;

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
              conductor: { type: "keyword" },
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

    // Guardar en PostgreSQL
    try {
      await saveToPostgres(odooBody);
    } catch (pgError) {
      console.error("⚠️ Error al guardar en PostgreSQL (no crítico):", pgError);
      // No fallar la petición si PostgreSQL falla
    }

    // Enviar los mismos datos a Elasticsearch (sin el attachment que es muy grande)
    try {
      const esClient = getEsClient();
      if (!esClient) {
        console.log("⚠️ Elasticsearch no configurado, saltando indexación");
        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      // Crear índice si no existe (con mapping de keywords)
      await createIndexIfNotExists();

      // Preparar documento sin el attachment (demasiado grande para keyword)
      const { attachment, check_in, check_out, ...docWithoutAttachment } = odooBody;

      // Insertar documento con timestamp y nombres de campos renombrados
      await esClient.index({
        index: process.env.ELASTICSEARCH_INDEX || "pos_operacional",
        document: {
          ...docWithoutAttachment,
          conductor: data.conductor || "", // Nombre del conductor
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
