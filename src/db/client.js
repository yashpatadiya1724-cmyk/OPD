/**
 * MediQ PostgreSQL Connection Pool & Transaction Helper
 * Manages connections for EMR records, ABDM profiles, and the double-entry billing ledger.
 */
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'mediq_healthcare',
  user: process.env.POSTGRES_USER || 'mediq_admin',
  password: process.env.POSTGRES_PASSWORD || 'mediq_secure_password_2026',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Execute a query with automatic client checkout and release
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters for parameterized statements
 */
export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  return { ...res, duration };
}

/**
 * Run operations inside an ACID transaction block
 * @param {Function} callback - Function receiving the transactional client
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Record a double-entry ledger transaction atomically
 * Ensures SUM(debit) == SUM(credit)
 */
export async function recordLedgerEntry({ transactionRef, debitAccount, creditAccount, amount, currency = 'INR', description }) {
  if (!amount || amount <= 0) {
    throw new Error('Ledger transaction amount must be greater than zero');
  }

  return withTransaction(async (client) => {
    const insertQuery = `
      INSERT INTO double_entry_ledger (transaction_ref, debit_account, credit_account, amount, currency, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const res = await client.query(insertQuery, [
      transactionRef,
      debitAccount,
      creditAccount,
      amount,
      currency,
      description,
    ]);
    return res.rows[0];
  });
}
