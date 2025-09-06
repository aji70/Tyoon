// src/utils/contract.js
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import abi from './abi.json' with { type: 'json' };

dotenv.config();

const { BASE_RPC_URL = 'https://sepolia.base-rpc.com', CONTRACT_ADDRESS } = process.env;

// Initialize provider
const provider = new ethers.JsonRpcProvider(BASE_RPC_URL, {
  chainId: 84532,
  name: 'base-sepolia',
}, {
  staticNetwork: true,
});

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

// Verify contract exists (optional, kept for debugging)
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

// Run verification at startup
verifyContract().catch((err) => {
  console.error('Initial contract verification failed:', err);
});

// Export contract for potential future use
export default contract;