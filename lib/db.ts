// lib/db.ts
import { Pool } from 'pg';

// Pool para la base de datos principal (usuarios_registrados, estado_vehiculos, pos_operacional)
// Credenciales desde variables de entorno (Cloud Run / .env.local)
export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT || 5432),
});

// Alias para mantener compatibilidad (ambos apuntan a la misma BD)
export const poolQA = pool;
