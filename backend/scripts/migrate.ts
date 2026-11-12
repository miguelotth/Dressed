import { readFile } from 'node:fs/promises';
import { pool } from '../src/db.js';
const filename = new URL('../sql/schema.sql',import.meta.url);
try {
  const sql=await readFile(filename,'utf8');
  await pool.query(sql);
  console.log('Banco LookLoop: tabelas e índices criados/verificados.');
} catch(e){console.error('Falha na migração:',e);process.exitCode=1;}
finally{await pool.end();}
