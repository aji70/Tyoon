import { ethers } from "ethers";
import dotenv from "dotenv";
import abi from "./src/utils/abi.json" with { type: "json" };

dotenv.config();

async function main() {
  console.log("RPC:", process.env.BASE_RPC_URL);
  console.log("Contract:", process.env.CONTRACT_ADDRESS);

  const provider = new ethers.JsonRpcProvider(
    process.env.BASE_RPC_URL,
    {
      chainId: 84532,
      name: "base-sepolia"
    }
  );

  const code = await provider.getCode(process.env.CONTRACT_ADDRESS);
  console.log("Contract code:", code === "0x" ? "NO CONTRACT FOUND" : code.slice(0, 20) + "...");

  if (code === "0x") return;

  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

  try {
    const registered = await contract.getUsernameFromAddress("0x09c5096AD92A3eb3b83165a4d177a53D3D754197");
    console.log("getUsernameFromAddress:", registered);
  } catch (err) {
    console.error("Call failed:", err);
  }
}

main();
