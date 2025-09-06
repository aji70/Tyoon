import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

console.log('Loaded Environment Variables in env.js:', {
  PORT: process.env.PORT,
  PG_HOST: process.env.PG_HOST,
  PG_PORT: process.env.PG_PORT,
  PG_DATABASE: process.env.PG_DATABASE,
  PG_USER: process.env.PG_USER,
  PG_PASSWORD: process.env.PG_PASSWORD ? '[REDACTED]' : undefined,
  BASE_RPC_URL: process.env.BASE_RPC_URL,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
});

export default dotenv;