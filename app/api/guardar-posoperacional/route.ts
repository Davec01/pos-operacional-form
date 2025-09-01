import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
// import { Pool } from 'pg'

// const pool = new Pool({
//   user: 'viacotur',
//   host: 'localhost',       // o la IP de tu contenedor
//   database: 'viacotur',
//   password: 'viacotur_pass',
//   port: 5432,
// })

export async function POST(req: Request) {
  const data = await req.json()

  try {
    // const query = `
    //   INSERT INTO pos_operacional (
    //     telegram_id,
    //     empleado,
    //     contrato,
    //     vehiculo,
    //     fecha_entrada,
    //     fecha_salida,
    //     km_final,
    //     planilla_servicios_nombre,
    //     tanqueo,
    //     tipo_combustible,
    //     km_final_combustible,
    //     tanqueo_gastos,
    //     galones_tanqueados,
    //     total_facturas_combustible,
    //     facturas_combustible,
    //     tiene_gastos_operacionales,
    //     total_factura_alimentacion,
    //     facturas_alimentacion,
    //     total_factura_hospedaje,
    //     facturas_hospedaje,
    //     total_factura_peajes,
    //     facturas_peajes,
    //     total_factura_otros,
    //     facturas_otros,
    //     observaciones
    //   ) VALUES (
    //     $1, $2, $3, $4, $5, $6,
    //     $7, $8, $9, $10, $11, $12,
    //     $13, $14, $15, $16, $17,
    //     $18, $19, $20, $21, $22, $23,
    //     $24, $25
    //   )
    // `

    // const values = [
    //   data.telegram_id,
    //   data.empleado,
    //   data.contrato,
    //   data.vehiculo,
    //   data.fechaEntrada,
    //   data.fechaSalida,
    //   data.kmFinal,
    //   data.planillaServiciosNombre || null,
    //   data.tanqueo || false,
    //   data.tipoCombustible || null,
    //   data.kmFinalCombustible || null,
    //   data.tanqueoGastos || false,
    //   data.galonesTanqueados || null,
    //   data.totalFacturasCombustible || null,
    //   data.facturasCombustible || [],
    //   data.tieneGastosOperacionales || false,
    //   data.totalFacturaAlimentacion || null,
    //   data.facturasAlimentacion || [],
    //   data.totalFacturaHospedaje || null,
    //   data.facturasHospedaje || [],
    //   data.totalFacturaPeajes || null,
    //   data.facturasPeajes || [],
    //   data.totalFacturaOtros || null,
    //   data.facturasOtros || [],
    //   data.observaciones || null
    // ]

  const query = `
    INSERT INTO pos_operacional (
      telegram_id,
      empleado,
      contrato,
      vehiculo,
      fecha_entrada,
      fecha_salida,
      km_final,
      observaciones
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8
    )
  `

  const values = [
    data.telegram_id,
    data.empleado,
    data.contrato,
    data.vehiculo,
    data.fechaEntrada,
    data.fechaSalida,
    data.kmFinal,
    data.observaciones || null
  ]


    await pool.query(query, values)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al guardar POS-OPERACIONAL:', error)
    return NextResponse.json({ error: 'Error al guardar en BD' }, { status: 500 })
  }
}
