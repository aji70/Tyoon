"use client";
import React, { useState } from "react";
import { FaUsers } from "react-icons/fa6";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/game-switch";
import { MdPrivateConnectivity } from "react-icons/md";
import { RiAuctionFill } from "react-icons/ri";
import { GiBank, GiPrisoner } from "react-icons/gi";
import { IoBuild } from "react-icons/io5";
import { FaHandHoldingDollar } from "react-icons/fa6";
import { AiOutlineDollarCircle } from "react-icons/ai";
import { FaRandom } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { usePlayerContract } from "@/context/ContractProvider";
import { toast } from "react-toastify";
import { generateGameCode } from "@/lib/utils/games";

// Define settings interface
interface Settings {
  code: string;
  symbol: string;
  maxPlayers: string;
  privateRoom: boolean;
  auction: boolean;
  rentInPrison: boolean;
  mortgage: boolean;
  evenBuild: boolean;
  startingCash: string;
  randomPlayOrder: boolean;
}

const GameSettings = () => {
  const router = useRouter();
  const { address } = useAccount();
  const { useIsRegistered, useCreateGame } = usePlayerContract();

  const [settings, setSettings] = useState<Settings>({
    code: generateGameCode(),
    symbol: "car",
    maxPlayers: "2",
    privateRoom: false,
    auction: false,
    rentInPrison: false,
    mortgage: false,
    evenBuild: false,
    startingCash: "100",
    randomPlayOrder: false,
  });

  const { data: isUserRegistered, isLoading: isRegisteredLoading } =
    useIsRegistered(address, {
      enabled: !!address,
    });

  const gameType = settings.privateRoom ? 1 : 0; // 0: PublicGame, 1: PrivateGame
  const playerSymbol = 0; // Default to Hat
  const numberOfPlayers = Number.parseInt(settings.maxPlayers, 10);

  const {
    write: createGame,
    isPending,
    error: contractError,
    txHash,
  } = useCreateGame(gameType, playerSymbol, numberOfPlayers, {
    maxPlayers: numberOfPlayers,
    privateRoom: settings.privateRoom,
    auction: settings.auction,
    rentInPrison: settings.rentInPrison,
    mortgage: settings.mortgage,
    evenBuild: settings.evenBuild,
    startingCash: BigInt(settings.startingCash),
    randomizePlayOrder: settings.randomPlayOrder,
  });

  const handleSettingChange = (
    key: keyof Settings,
    value: string | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePlay = async () => {
    if (!address) {
      toast.error("Please connect your wallet", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    if (!isUserRegistered) {
      toast.error("Please register before creating a game", {
        position: "top-right",
        autoClose: 5000,
      });
      router.push("/");
      return;
    }

    const toastId = toast.loading("Creating game...", {
      position: "top-right",
    });

    try {
      console.log("Calling createGame with settings:", settings); // Debug log
      const gameId = await createGame();
      if (!gameId || gameId === 0n) {
        throw new Error("Invalid game ID retrieved");
      }

      const gameIdStr = gameId.toString(); // Convert bigint to string for URL
      console.log(
        "Game created with ID:",
        gameIdStr,
        "Transaction hash:",
        txHash
      ); // Debug log

      toast.update(toastId, {
        render: `Game created successfully! Starting game with ID: ${gameIdStr}`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        onClose: () => router.push(`/game-room-loading?gameId=${gameIdStr}`),
      });
    } catch (err: any) {
      console.error("Error creating game:", err, "Transaction hash:", txHash);
      toast.update(toastId, {
        render:
          contractError?.message ||
          err.message ||
          "Failed to create game. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  if (isRegisteredLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="font-orbitron text-[#00F0FF] text-[16px]">
          Checking registration status...
        </p>
      </div>
    );
  }

  return (
    <section className="w-full min-h-screen bg-settings bg-cover bg-fixed bg-center">
      <main className="w-full h-auto py-20 flex flex-col items-center justify-start bg-[#010F101F] backdrop-blur-[12px] px-4">
        <div className="w-full flex flex-col items-center mb-4">
          <h2 className="text-[#F0F7F7] font-orbitron md:text-[24px] text-[20px] font-[700] text-center">
            Game Settings
          </h2>
          <p className="text-[#869298] text-[16px] font-dmSans text-center">
            Since you&apos;re creating a private game room, you get to choose
            how you want your game to go
          </p>
        </div>

        {/* First Setting */}
        <div className="w-full max-w-[792px] bg-[#010F10] rounded-[12px] border-[1px] border-[#003B3E] md:p-[40px] p-[20px] flex flex-col gap-4">
          {/* Maximum Players */}
          <div className="w-full flex justify-between items-center">
            <div className="flex items-start md:gap-3 gap-2">
              <FaUsers className="md:w-6 md:h-6 w-5 h-5 mt-1.5 text-[#F0F7F7]" />
              <div className="flex flex-col">
                <h4 className="text-[#F0F7F7] md:text-[22px] text-[20px] font-dmSans font-[600]">
                  Maximum Players
                </h4>
                <p className="text-[#455A64] font-[500] font-dmSans text-[16px]">
                  How many players can join the game.
                </p>
              </div>
            </div>
            <Select
              onValueChange={(value) =>
                handleSettingChange("maxPlayers", value)
              }
              defaultValue={settings.maxPlayers}
            >
              <SelectTrigger className="w-[80px] data-[size=default]:h-[40px] text-[#73838B] border-[1px] border-[#263238]">
                <SelectValue className="text-[#F0F7F7]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="7">7</SelectItem>
                <SelectItem value="8">8</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Private Room */}
          <div className="w-full flex justify-between items-center">
            <div className="flex items-start md:gap-3 gap-2">
              <MdPrivateConnectivity className="md:w-6 md:h-6 w-5 h-5 mt-1.5 text-[#F0F7F7]" />
              <div className="flex flex-col">
                <h4 className="text-[#F0F7F7] md:text-[22px] text-[20px] font-dmSans font-[600]">
                  Private Room
                </h4>
                <p className="text-[#455A64] font-[500] font-dmSans text-[16px]">
                  Private rooms can be accessed using the room URL only.
                </p>
              </div>
            </div>
            <Switch
              id="private-room"
              checked={settings.privateRoom}
              onCheckedChange={(checked) =>
                handleSettingChange("privateRoom", checked)
              }
            />
          </div>
        </div>

        <div className="w-full flex flex-col items-center mt-20 mb-4">
          <h2 className="text-[#F0F7F7] font-orbitron md:text-[24px] text-[20px] font-[700] text-center">
            Gameplay Rules
          </h2>
          <p className="text-[#869298] text-[16px] font-dmSans text-center">
            Set the rules for the game in your private game room
          </p>
        </div>

        {/* Second Setting */}
        <div className="w-full max-w-[792px] bg-[#010F10] rounded-[12px] border-[1px] border-[#003B3E] md:p-[40px] p-[20px] flex flex-col gap-5">
          {/* Auction */}
          <div className="w-full flex justify-between items-start">
            <div className="flex items-start md:gap-3 gap-2 max-w-[550px]">
              <RiAuctionFill className="md:w-6 md:h-6 w-5 h-5 mt-1.5 text-[#F0F7F7]" />
              <div className="flex flex-col flex-1">
                <h4 className="text-[#F0F7F7] md:text-[22px] text-[20px] font-dmSans font-[600]">
                  Auction
                </h4>
                <p className="text-[#455A64] font-[500] font-dmSans text-[16px]">
                  If someone skips purchasing a property during auction, it will
                  be sold to the highest bidder.
                </p>
              </div>
            </div>
            <Switch
              id="auction"
              checked={settings.auction}
              onCheckedChange={(checked) =>
                handleSettingChange("auction", checked)
              }
            />
          </div>

          {/* Rent In Prison */}
          <div className="w-full flex justify-between items-start">
            <div className="flex items-start md:gap-3 gap-2 max-w-[550px]">
              <GiPrisoner className="md:w-6 md:h-6 w-5 h-5 mt-1.5 text-[#F0F7F7]" />
              <div className="flex flex-col flex-1">
                <h4 className="text-[#F0F7F7] md:text-[22px] text-[20px] font-dmSans font-[600] capitalize">
                  Rent In Prison
                </h4>
                <p className="text-[#455A64] font-[500] font-dmSans text-[16px]">
                  Rent will be collected when landing on properties of a player
                  in prison.
                </p>
              </div>
            </div>
            <Switch
              id="rent-in-prison"
              checked={settings.rentInPrison}
              onCheckedChange={(checked) =>
                handleSettingChange("rentInPrison", checked)
              }
            />
          </div>

          {/* Mortgage */}
          <div className="w-full flex justify-between items-start">
            <div className="flex items-start md:gap-3 gap-2 max-w-[550px]">
              <GiBank className="md:w-6 md:h-6 w-5 h-5 mt-1.5 text-[#F0F7F7]" />
              <div className="flex flex-col flex-1">
                <h4 className="text-[#F0F7F7] md:text-[22px] text-[20px] font-dmSans font-[600]">
                  Mortgage
                </h4>
                <p className="text-[#455A64] font-[500] font-dmSans text-[16px]">
                  Mortgage properties to earn 50% of their cost, but you
                  won&apos;t get paid rent when players land on them.
                </p>
              </div>
            </div>
            <Switch
              id="mortgage"
              checked={settings.mortgage}
              onCheckedChange={(checked) =>
                handleSettingChange("mortgage", checked)
              }
            />
          </div>

          {/* Even Build */}
          <div className="w-full flex justify-between items-start">
            <div className="flex items-start md:gap-3 gap-2 max-w-[550px]">
              <IoBuild className="md:w-6 md:h-6 w-5 h-5 mt-1.5 text-[#F0F7F7]" />
              <div className="flex flex-col flex-1">
                <h4 className="text-[#F0F7F7] md:text-[22px] text-[20px] font-dmSans font-[600] capitalize">
                  Even Build
                </h4>
                <p className="text-[#455A64] font-[500] font-dmSans text-[16px]">
                  Houses and hotels must be built up and sold off evenly within
                  a property set.
                </p>
              </div>
            </div>
            <Switch
              id="even-build"
              checked={settings.evenBuild}
              onCheckedChange={(checked) =>
                handleSettingChange("evenBuild", checked)
              }
            />
          </div>

          {/* Starting Cash */}
          <div className="w-full flex justify-between items-start">
            <div className="flex items-start md:gap-3 gap-2 max-w-[550px]">
              <FaHandHoldingDollar className="md:w-6 md:h-6 w-5 h-5 mt-1.5 text-[#F0F7F7]" />
              <div className="flex flex-col flex-1">
                <h4 className="text-[#F0F7F7] md:text-[22px] text-[20px] font-dmSans font-[600] capitalize">
                  Starting Cash
                </h4>
                <p className="text-[#455A64] font-[500] font-dmSans text-[16px]">
                  Adjust how much players can start the game with.
                </p>
              </div>
            </div>
            <Select
              onValueChange={(value) =>
                handleSettingChange("startingCash", value)
              }
              defaultValue={settings.startingCash}
            >
              <SelectTrigger className="w-[120px] data-[size=default]:h-[40px] text-[#73838B] border-[1px] border-[#263238]">
                <AiOutlineDollarCircle className="md:w-3 md:h-3 text-[#73838B]" />
                <SelectValue className="text-[#F0F7F7]" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="300">300</SelectItem>
                <SelectItem value="400">400</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
                <SelectItem value="1500">1500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Randomize Play Order */}
          <div className="w-full flex justify-between items-start">
            <div className="flex items-start md:gap-3 gap-2 max-w-[550px]">
              <FaRandom className="md:w-6 md:h-6 w-5 h-5 mt-1.5 text-[#F0F7F7]" />
              <div className="flex flex-col flex-1">
                <h4 className="text-[#F0F7F7] md:text-[22px] text-[20px] font-dmSans font-[600] capitalize">
                  Randomize Play Order
                </h4>
                <p className="text-[#455A64] font-[500] font-dmSans text-[16px]">
                  Randomly reorder players at the beginning of the game.
                </p>
              </div>
            </div>
            <Switch
              id="random-play"
              checked={settings.randomPlayOrder}
              onCheckedChange={(checked) =>
                handleSettingChange("randomPlayOrder", checked)
              }
            />
          </div>
        </div>

        <div className="w-full max-w-[792px] flex justify-end mt-12">
          <button
            type="button"
            onClick={handlePlay}
            className="relative group w-[260px] h-[52px] bg-transparent border-none p-0 overflow-hidden cursor-pointer"
            disabled={isPending || isRegisteredLoading}
          >
            <svg
              width="260"
              height="52"
              viewBox="0 0 260 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
            >
              <path
                d="M10 1H250C254.373 1 256.996 6.85486 254.601 10.5127L236.167 49.5127C235.151 51.0646 233.42 52 231.565 52H10C6.96244 52 4.5 49.5376 4.5 46.5V9.5C4.5 6.46243 6.96243 4 10 4Z"
                fill="#00F0FF"
                stroke="#0E282A"
                strokeWidth={1}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[#010F10] text-[18px] -tracking-[2%] font-orbitron font-[700] z-10">
              {isPending ? "Creating..." : "Play"}
            </span>
          </button>
        </div>
      </main>
    </section>
  );
};

export default GameSettings;
