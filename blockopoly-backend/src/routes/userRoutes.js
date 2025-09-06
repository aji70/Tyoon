import express from 'express';
import { pool } from '../config/db.js';
import { checkIsRegistered, getUsername } from '../utils/contract.js';
import { ethers } from 'ethers';

const router = express.Router();

// Save or update username (no blockchain checks)
router.post('/save', async (req, res) => {
  const { walletAddress, username, is_registered } = req.body;

  // Input validation
  if (!walletAddress || !username) {
    return res.status(400).json({ error: 'Wallet address and username are required' });
  }

  // Validate wallet address format
  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  // Validate username
  const sanitizedUsername = username.trim();
  if (sanitizedUsername.length < 3 || sanitizedUsername.length > 255) {
    return res.status(400).json({ error: 'Username must be between 3 and 255 characters' });
  }

  try {
    // Upsert user into database
    const query = `
      INSERT INTO users (wallet_address, username, is_registered, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (wallet_address)
      DO UPDATE SET username = EXCLUDED.username, is_registered = EXCLUDED.is_registered, updated_at = $4
      RETURNING wallet_address, username, is_registered, created_at, updated_at;
    `;
    const values = [
      walletAddress.toLowerCase(),
      sanitizedUsername,
      is_registered ?? true, // Default to true if not provided
      Math.floor(Date.now() / 1000),
    ];
    const { rows } = await pool.query(query, values);

    res.status(201).json({
      message: 'Username saved successfully',
      user: rows[0],
    });
  } catch (error) {
    console.error('Save username error:', error);
    res.status(500).json({ error: 'Failed to save username' });
  }
});

// Register a new user with blockchain validation
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
    // Check if user already exists in the database
    const { rows } = await pool.query(
      'SELECT wallet_address FROM users WHERE wallet_address = $1',
      [walletAddress.toLowerCase()]
    );
    if (rows.length > 0) {
      return res.status(400).json({ error: 'User already exists in database' });
    }

    // Check blockchain registration
    const isRegistered = await checkIsRegistered(walletAddress);
    if (!isRegistered) {
      return res.status(400).json({ error: 'User not registered on blockchain' });
    }

    // Verify username matches blockchain record
    const blockchainUsername = await getUsername(walletAddress);
    if (blockchainUsername !== sanitizedUsername) {
      return res.status(400).json({ error: 'Username does not match blockchain record' });
    }

    // Ensure is_registered is a boolean
    const isRegisteredValue = isRegistered ?? true; // Fallback to true if null/undefined

    const query = `
      INSERT INTO users (wallet_address, username, is_registered, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING wallet_address, username, is_registered, created_at;
    `;
    const values = [
      walletAddress.toLowerCase(),
      sanitizedUsername,
      isRegisteredValue,
      Math.floor(Date.now() / 1000),
    ];
    const { rows: newUser } = await pool.query(query, values);

    res.status(201).json({ message: 'User registered successfully', user: newUser[0] });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
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
    res.status(500).json({ error: 'Failed to fetch user' });
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
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Check user registration status
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