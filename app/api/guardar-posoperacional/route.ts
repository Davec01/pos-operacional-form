import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

      attachment: data.attachment || false,
      attachment_filename: data.attachment_filename || false,
    };

    // Hacer POST a Odoo con el token
    const response = await fetch(
      "https://viacotur16-qa11-22388022.dev.odoo.com/api/posoperacional/register",
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
