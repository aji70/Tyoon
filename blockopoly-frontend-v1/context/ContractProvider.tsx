"use client";

import { createContext, useContext, useCallback } from "react";
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import PlayerABI from "./abi.json";
import { Address } from "viem";

const CONTRACT_ADDRESS = "0x1d4a01Bb4e7B6403DE7C09C987Ad72ef80EBea09" as Address;

type PlayerData = {
  username: string;
  playerAddress: Address;
  timestamp: bigint;
};

type PlayerDataTuple = [string, Address, bigint];

type GameSettings = {
  maxPlayers: number;
  privateRoom: boolean;
  auction: boolean;
  rentInPrison: boolean;
  mortgage: boolean;
  evenBuild: boolean;
  startingCash: bigint;
  randomizePlayOrder: boolean;
};

type GameData = {
  id: string;
  status: number; // 0: Pending, 1: Ongoing, 2: Ended
  nextPlayer: Address;
  winner: Address;
  createdAt: bigint;
  numberOfPlayers: number;
  endedAt: bigint;
};

type GameDataTuple = [string, number, Address, Address, bigint, number, bigint];

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
  useCreateGame: (
    gameType: number,
    playerSymbol: number,
    numberOfPlayers: number,
    settings: GameSettings
  ) => {
    write: () => Promise<string>; // Returns gameId
    isPending: boolean;
    error: Error | null;
    txHash: Address | undefined;
    isSuccess: boolean;
  };
  useGetGame: (gameId?: string, options?: { enabled: boolean }) => {
    data: GameData | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  registerPlayer: (username: string) => Promise<void>;
};

// Create context
const BlockopolyContext = createContext<ContractContextType | undefined>(undefined);

// Custom hooks for reads
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
    functionName: "addressToUsername",
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
    functionName: "players",
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

function useCreateGame(
  gameType: number,
  playerSymbol: number,
  numberOfPlayers: number,
  settings: GameSettings
) {
  const { writeContractAsync, isPending, error, data: txHash } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const write = useCallback(async (): Promise<string> => {
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: PlayerABI,
        functionName: "createGame",
        args: [
          gameType,
          playerSymbol,
          numberOfPlayers,
          [
            settings.maxPlayers,
            settings.privateRoom,
            settings.auction,
            settings.rentInPrison,
            settings.mortgage,
            settings.evenBuild,
            settings.startingCash,
            settings.randomizePlayOrder,
          ],
        ],
      });
      // Listen for GameCreated event to get gameId
      // Assuming event listener is set up elsewhere (e.g., in backend)
      // For simplicity, return a placeholder gameId (replace with actual event parsing)
      return new Promise((resolve) => {
        // Mock event listener (replace with Web3.js/ethers.js listener)
        setTimeout(() => resolve("ABCDE"), 1000);
      });
    } catch (error) {
      console.error("Error creating game:", error);
      throw error;
    }
  }, [writeContractAsync, gameType, playerSymbol, numberOfPlayers, settings]);

  return { write, isPending, error, txHash, isSuccess };
}

function useGetGame(gameId?: string, options = { enabled: true }) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PlayerABI,
    functionName: "getGame",
    args: gameId ? [gameId] : undefined,
    query: { enabled: options.enabled && !!gameId },
  });

  return {
    data: result.data
      ? {
          id: (result.data as GameDataTuple)[0],
          status: (result.data as GameDataTuple)[1],
          nextPlayer: (result.data as GameDataTuple)[2],
          winner: (result.data as GameDataTuple)[3],
          createdAt: (result.data as GameDataTuple)[4],
          numberOfPlayers: (result.data as GameDataTuple)[5],
          endedAt: (result.data as GameDataTuple)[6],
        }
      : undefined,
    isLoading: result.isLoading,
    error: result.error,
  };
}

// Provider
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
    useCreateGame,
    useGetGame,
    registerPlayer,
  };

  return (
    <BlockopolyContext.Provider value={contextValue}>
      {children}
    </BlockopolyContext.Provider>
  );
};

// Hook to consume context
export const usePlayerContract = () => {
  const context = useContext(BlockopolyContext);
  if (!context)
    throw new Error(
      "usePlayerContract must be used within a PlayerContractProvider"
    );
  return context;
};