/**
 * MediQ Database Migration & Seed Runner
 * Applies schema.sql and seed.sql to the target PostgreSQL database
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'mediq_healthcare',
    user: process.env.POSTGRES_USER || 'mediq_admin',
    password: process.env.POSTGRES_PASSWORD || 'mediq_secure_password_2026',
  });

  console.log('🔄 Connecting to PostgreSQL database...');
  try {
    await client.connect();
    console.log('✅ Connected successfully.');

    const schemaPath = path.resolve(__dirname, '../src/db/schema.sql');
    const seedPath = path.resolve(__dirname, '../src/db/seed.sql');

    console.log('📄 Executing schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Tables, foreign keys, constraints, and indexes created.');

    console.log('🌱 Executing seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('✅ Demo seed data populated.');

    // Quick verification
    const hospitalCount = await client.query('SELECT COUNT(*) FROM hospitals;');
    const doctorCount = await client.query('SELECT COUNT(*) FROM doctors;');
    const tokenCount = await client.query('SELECT COUNT(*) FROM opd_tokens;');

    console.log('\n--- MediQ Database Summary ---');
    console.log(`Hospitals: ${hospitalCount.rows[0].count}`);
    console.log(`Doctors:   ${doctorCount.rows[0].count}`);
    console.log(`Tokens:    ${tokenCount.rows[0].count}`);
    console.log('-------------------------------\n');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Execute when called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration();
}

export { runMigration };
