// src/utils/contract.js
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import abi from './abi.json' with { type: 'json' };

dotenv.config();

const { BASE_RPC_URL, CONTRACT_ADDRESS } = process.env;

// Initialize provider
const provider = new ethers.JsonRpcProvider(BASE_RPC_URL, {
  chainId: 84532,
  name: 'base-sepolia',
});

// Verify contract exists
async function verifyContract() {
  try {
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      console.error('No contract found at address:', CONTRACT_ADDRESS);
      throw new Error('No contract deployed at the specified address');
    }
    console.log('Contract code:', code.slice(0, 20) + '...');
  } catch (err) {
    console.error('Failed to verify contract:', err);
    throw err;
  }
}

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

/**
 * Check if a wallet address is registered on-chain
 */
export async function checkIsRegistered(address) {
  try {
    await verifyContract(); // Ensure contract exists before calling
    const result = await contract.isRegistered(address);
    return result;
  } catch (err) {
    console.error('Detailed checkIsRegistered error:', err);
    throw new Error(`Failed to check registration status: ${err.reason || err.message}`);
  }
}

/**
 * Get the username for a wallet address from the contract
 */
export async function getUsername(address) {
  try {
    await verifyContract(); // Ensure contract exists before calling
    const username = await contract.getUsernameFromAddress(address);
    return username;
  } catch (err) {
    console.error('Detailed getUsername error:', err);
    throw new Error(`Failed to get username: ${err.reason || err.message}`);
  }
}

export default contract;