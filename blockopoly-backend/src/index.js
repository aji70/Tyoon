import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';

// Load .env file and log variables
dotenv.config();
console.log('Loaded Environment Variables:', {
  PORT: process.env.PORT,
  PG_HOST: process.env.PG_HOST,
  PG_PORT: process.env.PG_PORT,
  PG_DATABASE: process.env.PG_DATABASE,
  PG_USER: process.env.PG_USER,
  PG_PASSWORD: process.env.PG_PASSWORD,
  BASE_RPC_URL: process.env.BASE_RPC_URL,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
});

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Connect to PostgreSQL
connectDB();

// Routes
app.use('/api/users', userRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});