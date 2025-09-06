// config/db.js
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      wallet_address VARCHAR(42) PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      is_registered BOOLEAN NOT NULL,
      balance NUMERIC(78, 0) DEFAULT 0,
      last_game NUMERIC(78, 0) DEFAULT 0,
      active BOOLEAN DEFAULT FALSE,
      total_games_played NUMERIC(78, 0) DEFAULT 0,
      total_games_completed NUMERIC(78, 0) DEFAULT 0,
      total_games_won NUMERIC(78, 0) DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT
    );
  `;
  try {
    await pool.query(query);
    console.log('Users table created or already exists');
  } catch (error) {
    console.error('Error creating users table:', error.message);
    throw error;
  }
};

const connectDB = async () => {
  console.log('PostgreSQL Config:', {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD ? '[REDACTED]' : undefined,
  });

  try {
    await pool.connect();
    console.log('PostgreSQL connected');
    await createUsersTable(); // Create table after connection
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
};

export { pool, connectDB };