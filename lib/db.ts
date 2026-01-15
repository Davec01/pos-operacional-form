// lib/db.ts
import { Pool } from 'pg';

// Pool para la base de datos principal (usuarios_registrados, estado_vehiculos, pos_operacional)
export const pool = new Pool({
  user: "viacotur",
  host: "34.174.97.159",
  database: "viacotur",            // Base de datos principal
  password: "viacotur_pass",
  port: 5432,
});

// Alias para mantener compatibilidad (ambos apuntan a la misma BD)
export const poolQA = pool;
