import { ethers } from 'ethers';
import dotenv from 'dotenv';
import abi from './abi.json' assert { type: 'json' }; // adjust path if needed

dotenv.config();

const { BASE_RPC_URL, CONTRACT_ADDRESS } = process.env;

// Provider (connects to Base RPC)
const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);

// Contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

// --- Blockchain helper functions ---

/**
 * Check if a wallet address is registered on-chain
 */
export async function checkIsRegistered(address) {
  try {
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
    const username = await contract.getUsernameFromAddress(address);
    return username;
  } catch (err) {
    console.error('Detailed getUsername error:', err);
    throw new Error(`Failed to get username: ${err.reason || err.message}`);
  }
}

export default contract;
