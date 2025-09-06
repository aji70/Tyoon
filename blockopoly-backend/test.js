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
    const get_username = await contract.getUsernameFromAddress("0x4246a99db07c10fce03ab238f68e5003ac5264a1");
    console.log("getUsernameFromAddress:", get_username);
  } catch (err) {
    console.error("Call failed:", err);
  }
}

main();
