// One Neon database is shared with other projects. Every table Medico owns starts
// with `medico_`. Never read or write a table without that prefix.
const { neon } = require('@neondatabase/serverless');

let sql = null;
const hasDb = () => Boolean(process.env.DATABASE_URL);

function client() {
  if (!process.env.DATABASE_URL) throw new Error('Database is not connected (DATABASE_URL is missing).');
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}

/** Parameterised query. Throws on failure; public readers catch and fall back. */
const query = (text, params = []) => client().query(text, params);

/** Reject after `ms` so a slow database never hangs a page render. */
const withTimeout = (promise, ms = 2500) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Database timed out.')), ms))]);

module.exports = { query, hasDb, withTimeout };
