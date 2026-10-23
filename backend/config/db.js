
import mysql from 'mysql2/promise';

let pool;

export function getDbPool() {
  if (
    !process.env.DB_HOST ||
    !process.env.DB_NAME ||
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD
  ) {
    throw new Error('Database environment variables are not configured');
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }

  return pool;
}
