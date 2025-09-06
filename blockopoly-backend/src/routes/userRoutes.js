import express from 'express';
import { pool } from '../config/db.js';
import { ethers } from 'ethers';

const router = express.Router();

// Save or update username (no blockchain checks) - Kept for reference, but unused
router.post('/save', async (req, res) => {
  const { walletAddress, username, is_registered } = req.body;

  if (!walletAddress || !username) {
    return res.status(400).json({ error: 'Wallet address and username are required' });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const sanitizedUsername = username.trim();
  if (sanitizedUsername.length < 3 || sanitizedUsername.length > 255) {
    return res.status(400).json({ error: 'Username must be between 3 and 255 characters' });
  }

  try {
    const query = `
      INSERT INTO users (
        wallet_address, username, is_registered, balance, last_game, active,
        total_games_played, total_games_completed, total_games_won, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (wallet_address)
      DO UPDATE SET 
        username = EXCLUDED.username, 
        is_registered = EXCLUDED.is_registered, 
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const values = [
      walletAddress.toLowerCase(),
      sanitizedUsername,
      is_registered ?? true,
      0,
      null, // last_game
      false, // active
      0, // total_games_played
      0, // total_games_completed
      0, // total_games_won
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000),
    ];
    const { rows } = await pool.query(query, values);

    res.status(201).json({
      message: 'Username saved successfully',
      user: rows[0],
    });
  } catch (error) {
    console.error('Save username error:', error);
    res.status(500).json({ error: 'Failed to save username: ' + error.message });
  }
});

// Register a new user (no blockchain validation, trusts frontend)
router.post('/register', async (req, res) => {
  const { walletAddress, username } = req.body;

  if (!walletAddress || !username) {
    return res.status(400).json({ error: 'Wallet address and username are required' });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const sanitizedUsername = username.trim();
  if (sanitizedUsername.length < 3 || sanitizedUsername.length > 255) {
    return res.status(400).json({ error: 'Username must be between 3 and 255 characters' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT wallet_address FROM users WHERE wallet_address = $1',
      [walletAddress.toLowerCase()]
    );
    if (rows.length > 0) {
      return res.status(400).json({ error: 'User already exists in database' });
    }

    const query = `
      INSERT INTO users (
        wallet_address, username, is_registered, balance, last_game, active,
        total_games_played, total_games_completed, total_games_won, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      walletAddress.toLowerCase(),
      sanitizedUsername,
      true, // Assume registered since frontend succeeded
      0,
      null, // last_game
      false, // active
      0, // total_games_played
      0, // total_games_completed
      0, // total_games_won
      Math.floor(Date.now() / 1000),
    ];
    const { rows: newUser } = await pool.query(query, values);

    res.status(201).json({ message: 'User registered successfully', user: newUser[0] });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user: ' + error.message });
  }
});

// Fetch user by address
router.get('/:address', async (req, res) => {
  const { address } = req.params;

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [
      address.toLowerCase(),
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: 'Failed to fetch user: ' + error.message });
  }
});

// Update user username
router.put('/:address', async (req, res) => {
  const { address } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const query = `
      UPDATE users
      SET username = $1, updated_at = $2
      WHERE wallet_address = $3
      RETURNING *;
    `;
    const values = [username, Math.floor(Date.now() / 1000), address.toLowerCase()];
    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user: rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user: ' + error.message });
  }
});

// Check user registration status (optional, kept for completeness)
router.get('/:address/status', async (req, res) => {
  const { address } = req.params;

  try {
    const { rows } = await pool.query('SELECT is_registered, username FROM users WHERE wallet_address = $1', [
      address.toLowerCase(),
    ]);
    if (rows.length === 0) {
      return res.json({ isRegistered: false, username: null });
    }
    res.json({ isRegistered: rows[0].is_registered, username: rows[0].username });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check registration status: ' + error.message });
  }
});

export default router;