"use client";

import { createContext, useContext, useCallback } from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import PlayerABI from "./abi.json";
import { Address } from "viem";

const CONTRACT_ADDRESS = "0x67a9b540693D48f7e6a008D4323c4F831076f780" as Address;

type PlayerData = {
  username: string;
  playerAddress: Address;
  timestamp: bigint;
};

type PlayerDataTuple = [string, Address, bigint];

type ContractContextType = {
  useIsRegistered: (address?: Address, options?: { enabled: boolean }) => {
    data: boolean | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  useGetUsername: (address?: Address, options?: { enabled: boolean }) => {
    data: string | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  useRetrievePlayer: (address?: Address, options?: { enabled: boolean }) => {
    data: PlayerData | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  registerPlayer: (username: string) => Promise<void>;
};

const ContractContext = createContext<ContractContextType | undefined>(undefined);

// ---- Custom hooks for reads ----
function useIsRegistered(address?: Address, options = { enabled: true }) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PlayerABI,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: options.enabled },
  });

  return {
    data: result.data as boolean | undefined,
    isLoading: result.isLoading,
    error: result.error,
  };
}

function useGetUsername(address?: Address, options = { enabled: true }) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PlayerABI,
    functionName: "getUsernameFromAddress",
    args: address ? [address] : undefined,
    query: { enabled: options.enabled },
  });

  return {
    data: result.data as string | undefined,
    isLoading: result.isLoading,
    error: result.error,
  };
}

function useRetrievePlayer(address?: Address, options = { enabled: true }) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PlayerABI,
    functionName: "retrievePlayer",
    args: address ? [address] : undefined,
    query: { enabled: options.enabled },
  });

  return {
    data: result.data
      ? {
          username: (result.data as PlayerDataTuple)[0],
          playerAddress: (result.data as PlayerDataTuple)[1],
          timestamp: (result.data as PlayerDataTuple)[2],
        }
      : undefined,
    isLoading: result.isLoading,
    error: result.error,
  };
}

// ---- Provider ----
export const PlayerContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const registerPlayer = useCallback(
    async (username: string) => {
      if (!userAddress) throw new Error("No wallet connected");
      try {
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: PlayerABI,
          functionName: "registerNewPlayer",
          args: [username],
        });
      } catch (error) {
        console.error("Error registering player:", error);
        throw error;
      }
    },
    [userAddress, writeContractAsync]
  );

  const contextValue: ContractContextType = {
    useIsRegistered,
    useGetUsername,
    useRetrievePlayer,
    registerPlayer,
  };

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
    </ContractContext.Provider>
  );
};

// ---- Hook to consume context ----
export const usePlayerContract = () => {
  const context = useContext(ContractContext);
  if (!context)
    throw new Error(
      "usePlayerContract must be used within a PlayerContractProvider"
    );
  return context;
};