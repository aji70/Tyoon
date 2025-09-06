import { ethers } from 'ethers';
const provider = new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/g8riPvuz6RyNrAHHdsVvLL6mnRls0Iug');
async function testNetwork() {
  try {
    const network = await provider.getNetwork();
    console.log('Network:', {
      chainId: network.chainId.toString(),
      name: network.name,
    });
  } catch (error) {
    console.error('Error connecting to network:', error.message);
  }
}
testNetwork();