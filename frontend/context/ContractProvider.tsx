// context/ContractProvider.tsx
"use client";
import { createContext, useContext, useCallback } from "react";
import {
  useReadContract,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address } from "viem";
import PlayerABI from "./abi.json";

const CONTRACT_ADDRESS =
  "0x2D526d050199b26cd0d7500FbBb7511E4285EF6f" as Address;

/* ----------------------- Types ----------------------- */
type PlayerData = {
  username: string;
  playerAddress: Address;
  timestamp: bigint;
};
type PlayerDataTuple = [string, Address, bigint];

export type GameSettings = {
  maxPlayers: number;
  privateRoom: string;
  auction: boolean;
  rentInPrison: boolean;
  mortgage: boolean;
  evenBuild: boolean;
  startingCash: bigint;
  randomizePlayOrder: boolean;
};

type GameData = {
  id: string;
  status: number;
  nextPlayer: number;
  winner: Address;
  creator: Address;
  createdAt: bigint;
  numberOfPlayers: number;
  endedAt: bigint;
};
type GameDataTuple = [string, number, Address, Address, bigint, number, bigint];

/* ----------------------- Hooks ----------------------- */
export function useIsRegistered(
  address?: Address,
  options = { enabled: true }
) {
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

export function useGetUsername(address?: Address, options = { enabled: true }) {
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

export function useRetrievePlayer(
  address?: Address,
  options = { enabled: true }
) {
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

export function useCreateGame(
  gameCode: string,
  gameType: string,
  playerSymbol: string,
  numberOfPlayers: number,
  settings: GameSettings
) {
  const {
    writeContractAsync,
    isPending,
    error,
    data: txHash,
  } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const write = useCallback(async (): Promise<string> => {
    const result = await writeContractAsync({
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

    if (!result) throw new Error("Invalid game ID returned from contract");
    return result as string;
  }, [writeContractAsync, gameType, playerSymbol, numberOfPlayers, settings]);

  return { write, isPending, error, txHash, isSuccess };
}

export function useGetGame(gameId?: string, options = { enabled: true }) {
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

/* ----------------------- Context ----------------------- */
type ContractContextType = {
  registerPlayer: (username: string) => Promise<void>;
};
const BlockopolyContext = createContext<ContractContextType | undefined>(
  undefined
);

export const PlayerContractProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const registerPlayer = useCallback(
    async (username: string) => {
      if (!userAddress) throw new Error("No wallet connected");
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: PlayerABI,
        functionName: "registerPlayer",
        args: [username],
      });
    },
    [userAddress, writeContractAsync]
  );

  return (
    <BlockopolyContext.Provider value={{ registerPlayer }}>
      {children}
    </BlockopolyContext.Provider>
  );
};

export const usePlayerContract = () => {
  const context = useContext(BlockopolyContext);
  if (!context)
    throw new Error(
      "usePlayerContract must be used within a PlayerContractProvider"
    );
  return context;
};
