// lib/db.ts
import { Pool } from 'pg';

export const pool = new Pool({
  user: "viacotur",                // o "admin"
  host: "34.174.97.159",           // no 'localhost' si está en otro host
  database: "viacotur",
  password: "viacotur_pass",       // o "P@ssw0rd"
  port: 5432,
});
