import express from 'express';
import { pool } from '../config/db.js';
import { checkIsRegistered, getUsername } from '../utils/contract.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/register', async (req, res) => {
  const { walletAddress, username } = req.body;

  if (!walletAddress || !username) {
    return res.status(400).json({ error: 'Wallet address and username are required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress.toLowerCase()]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const isRegistered = await checkIsRegistered(walletAddress);
    if (!isRegistered) {
      return res.status(400).json({ error: 'User not registered on blockchain' });
    }

    const query = `
      INSERT INTO users (wallet_address, username, is_registered)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [walletAddress.toLowerCase(), username, isRegistered];
    const { rows: newUser } = await pool.query(query, values);

    res.status(201).json({ message: 'User registered successfully', user: newUser[0] });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.get('/:address', async (req, res) => {
  const { address } = req.params;

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [address.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/:address', async (req, res) => {
  const { address } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const query = `
      UPDATE users
      SET username = $1, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $2
      RETURNING *;
    `;
    const values = [username, address.toLowerCase()];
    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user: rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/:address/status', async (req, res) => {
  const { address } = req.params;

  try {
    const isRegistered = await checkIsRegistered(address);
    const username = isRegistered ? await getUsername(address) : null;
    res.json({ isRegistered, username });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check registration status' });
  }
});

export default router;