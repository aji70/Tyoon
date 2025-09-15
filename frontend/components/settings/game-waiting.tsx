'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PiTelegramLogoLight } from 'react-icons/pi';
import { FaXTwitter } from 'react-icons/fa6';
import { IoCopyOutline, IoHomeOutline } from 'react-icons/io5';
import { useJoinGame } from '@/context/ContractProvider';

interface Token {
  name: string;
  emoji: string;
  value: number;
}

interface GameState {
  gameId: number;
  code: string;
  maxPlayers: number;
  playersJoined: number;
  players: Array<{ id: string; symbol: string; name: string }>;
  isReady: boolean;
  availableSymbols: { value: string; label: string }[];
}

const tokens: Token[] = [
  { name: 'Hat', emoji: '🎩', value: 0 },
  { name: 'Car', emoji: '🚗', value: 1 },
  { name: 'Dog', emoji: '🐕', value: 2 },
  { name: 'Thimble', emoji: '🧵', value: 3 },
  { name: 'Iron', emoji: '🧼', value: 4 },
  { name: 'Battleship', emoji: '🚢', value: 5 },
  { name: 'Boot', emoji: '👞', value: 6 },
  { name: 'Wheelbarrow', emoji: '🛒', value: 7 },
];


=


const GameWaiting = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameCode = searchParams.get('gameCode')?.toUpperCase();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerSymbol, setPlayerSymbol] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!gameCode) {
      setError('No game code provided. Please enter a valid game code.');
      setLoading(false);
      return;
    }

    const fetchGameState = async () => {
      try {
        const response = await fetch(`https://base-monopoly-production.up.railway.app/api/games/code/${gameCode}`);
        if (!response.ok) {
          throw new Error(`Game ${gameCode} not found: ${response.status} ${response.statusText}`);
        }
        const gameData = await response.json();
        if (gameData.status !== 'PENDING') {
          throw new Error(`Game ${gameCode} has already started or ended.`);
        }

        // Map API response to GameState format
        const fetchedState: GameState = {
          gameId: gameData.id,
          code: gameData.code,
          maxPlayers: gameData.number_of_players,
          playersJoined: gameData.players_joined || 1,
          players: gameData.players || [{ id: 'creator', symbol: '0', name: 'Creator' }], // Adjust based on API response
          isReady: gameData.status === 'PENDING' && gameData.players_joined >= gameData.number_of_players,
          availableSymbols: tokens
            .filter((t) => !gameData.players?.some((p: any) => p.symbol === t.value.toString()))
            .map((t) => ({ value: t.value.toString(), label: `${t.emoji} ${t.name}` })),
        };
        setGameState(fetchedState);
      } catch (err: any) {
        console.error('Error fetching game state:', err);
        setError(err.message || 'Failed to fetch game data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();

    // Polling for real-time updates (replace with WebSocket if available)
    const interval = setInterval(fetchGameState, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [gameCode]);

  // Auto-redirect when ready and joined
  useEffect(() => {
    if (gameState?.isReady && isJoined) {
      const timer = setTimeout(() => {
        router.push(`/game-play?gameId=${gameState.gameId}`);
      }, 2000); // 2s delay for celebration
      return () => clearTimeout(timer);
    }
  }, [gameState?.isReady, isJoined, gameState?.gameId, router]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://base-monopoly-production.up.railway.app');
  const gameUrl = `${baseUrl}/game-waiting?gameCode=${gameCode}`;
  const shareText = `Join my Blockopoly game! Code: ${gameCode}. Waiting room: ${gameUrl}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareText)}`;
  const twitterShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  console.log("Game Code:", gameCode);
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      setError('Failed to copy link. Please try again.');
    }
  };

  const handleJoinGame = async () => {
    if (!playerSymbol || !gameState?.availableSymbols.some((s) => s.value === playerSymbol)) {
      setError('Please select a valid symbol.');
      return;
    }
    if (gameState.playersJoined >= gameState.maxPlayers) {
      setError('Game is full!');
      return;
    }

    try {
      const response = await fetch(`https://base-monopoly-production.up.railway.app/api/games/${gameState.gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: playerSymbol, name: 'Player' }), // Adjust based on API requirements
      });
      if (!response.ok) {
        throw new Error(`Failed to join game: ${response.status} ${response.statusText}`);
      }
      const updatedGame = await response.json();
      setGameState({
        ...gameState,
        playersJoined: updatedGame.players_joined || gameState.playersJoined + 1,
        players: updatedGame.players || [...gameState.players, { id: `player_${Date.now()}`, symbol: playerSymbol, name: 'Player' }],
        availableSymbols: gameState.availableSymbols.filter((s) => s.value !== playerSymbol),
        isReady: updatedGame.status === 'PENDING' && updatedGame.players_joined >= gameState.maxPlayers,
      });
      setIsJoined(true);
      setError(null);
    } catch (err: any) {
      console.error('Error joining game:', err);
      setError(err.message || 'Failed to join game. Please try again.');
    }
  };

  const handleLeaveGame = async () => {
    try {
      const response = await fetch(`https://base-monopoly-production.up.railway.app/api/games/${gameState!.gameId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: playerSymbol }),
      });
      if (!response.ok) {
        throw new Error(`Failed to leave game: ${response.status} ${response.statusText}`);
      }
      const updatedGame = await response.json();
      const symbolObj = {
        value: playerSymbol,
        label: tokens.find((t) => t.value.toString() === playerSymbol)?.emoji + ' ' + tokens.find((t) => t.value.toString() === playerSymbol)?.name || '',
      };
      setGameState({
        ...gameState!,
        playersJoined: updatedGame.players_joined || Math.max(gameState!.playersJoined - 1, 1),
        players: updatedGame.players || gameState!.players.filter((p) => p.symbol !== playerSymbol),
        availableSymbols: [...gameState!.availableSymbols, symbolObj as any],
      });
      setIsJoined(false);
      setPlayerSymbol('');
      setError(null);
    } catch (err: any) {
      console.error('Error leaving game:', err);
      setError(err.message || 'Failed to leave game. Please try again.');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <section className="w-full h-[calc(100dvh-87px)] flex items-center justify-center bg-gray-900">
        <p className="text-[#00F0FF] text-xl font-semibold font-orbitron animate-pulse">Loading game...</p>
      </section>
    );
  }

  if (error || !gameState) {
    return (
      <section className="w-full h-[calc(100dvh-87px)] flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-xl font-semibold font-orbitron mb-4">{error || 'Game not found'}</p>
          <button
            onClick={() => router.push('/join-room')}
            className="bg-[#00F0FF] text-black px-4 py-2 rounded font-orbitron"
          >
            Back to Join Room
          </button>
          <button
            onClick={handleGoHome}
            className="bg-[#00F0FF] text-black px-4 py-2 rounded font-orbitron"
          >
            Go to Home
          </button>
        </div>
      </section>
    );
  }

  const showJoin = !isJoined && gameState.playersJoined < gameState.maxPlayers;
  const showLeave = isJoined && !gameState.isReady;
  const showShare = gameState.playersJoined < gameState.maxPlayers;

  return (
    <section className="w-full h-[calc(100dvh-87px)] bg-settings bg-cover bg-fixed bg-center">
      <main className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#010F10]/90 to-[#010F10]/50 px-4 sm:px-6">
        <div className="w-full max-w-md bg-[#0A1A1B]/80 p-6 sm:p-8 rounded-xl shadow-lg border border-[#00F0FF]/30 backdrop-blur-sm">
          <h2 className="text-2xl sm:text-3xl font-bold font-orbitron mb-6 text-[#F0F7F7] text-center tracking-wide">
            Blockopoly Waiting Room
            <span className="block text-sm text-[#00F0FF] mt-1 font-bold">
              Code: {gameCode}
            </span>
          </h2>

          <div className="text-center space-y-3 mb-6">
            <p className="text-[#869298] text-sm">
              {gameState.isReady ? 'All players joined! Starting soon...' : 'Waiting for players to join...'}
            </p>
            <p className="text-[#00F0FF] text-lg font-semibold">
              Players: {gameState.playersJoined}/{gameState.maxPlayers}
            </p>
            {gameState.players.map((player) => (
              <p key={player.id} className="text-sm text-[#F0F7F7] flex items-center justify-center">
                {tokens.find((t) => t.value.toString() === player.symbol)?.emoji} {player.name}
              </p>
            ))}
          </div>

          {showShare && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={gameUrl}
                  readOnly
                  className="w-full bg-[#0A1A1B] text-[#F0F7F7] p-2 rounded border border-[#00F0FF]/30 focus:outline-none font-orbitron text-sm"
                />
                <button onClick={handleCopyLink} className="flex items-center justify-center bg-[#0A1A1B] text-[#0FF0FC] text-sm font-orbitron font-semibold py-2 px-3 rounded-lg border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 transition-all duration-300">
                  <IoCopyOutline className="w-5 h-5" />
                </button>
              </div>
              {copySuccess && <p className="text-green-400 text-xs text-center">{copySuccess}</p>}
              <div className="flex justify-center gap-4">
                <a
                  href={telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-[#0A1A1B] text-[#0FF0FC] text-sm font-orbitron font-semibold py-2 px-4 rounded-lg border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 transition-all duration-300"
                >
                  <PiTelegramLogoLight className="mr-2 w-5 h-5" />
                  Telegram
                </a>
                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-[#0A1A1B] text-[#0FF0FC] text-sm font-orbitron font-semibold py-2 px-4 rounded-lg border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 transition-all duration-300"
                >
                  <FaXTwitter className="mr-2 w-5 h-5" />
                  X
                </a>
              </div>
            </div>
          )}

          {showJoin && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1 font-orbitron">Choose Your Token</label>
                <select
                  value={playerSymbol}
                  onChange={(e) => setPlayerSymbol(e.target.value)}
                  className="bg-[#0A1A1B] text-[#F0F7F7] p-2 rounded border border-[#00F0FF]/30 focus:outline-none focus:ring-2 focus:ring-[#00F0FF] font-orbitron"
                >
                  <option value="" disabled>Select a token</option>
                  {gameState.availableSymbols.map((symbol) => (
                    <option key={symbol.value} value={symbol.value}>
                      {symbol.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleJoinGame}
                className="w-full bg-[#00F0FF] text-black text-sm font-orbitron font-semibold py-3 rounded-lg hover:bg-[#00D4E6] transition-all duration-300 shadow-md"
                disabled={!playerSymbol}
              >
                Join Game
              </button>
            </div>
          )}

          {showLeave && (
            <button
              onClick={handleLeaveGame}
              className="w-full mt-6 bg-[#FF4D4D] text-white text-sm font-orbitron font-semibold py-3 rounded-lg hover:bg-[#E63939] transition-all duration-300 shadow-md"
            >
              Leave Game
            </button>
          )}

          {gameState.isReady && (
            <p className="text-center text-green-400 text-sm font-orbitron mt-4 animate-pulse">
              🚀 Game starting in 2 seconds...
            </p>
          )}

          <div className="flex justify-between mt-3">
            <button
              onClick={() => router.push('/join-room')}
              className="text-[#0FF0FC] text-sm font-orbitron hover:text-[#00D4E6] transition-colors duration-200"
            >
              Back to Join Room
            </button>
            <button
              onClick={handleGoHome}
              className="flex items-center text-[#0FF0FC] text-sm font-orbitron hover:text-[#00D4E6] transition-colors duration-200"
            >
              <IoHomeOutline className="mr-1 w-4 h-4" />
              Go to Home
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs mt-4 text-center animate-pulse">{error}</p>
          )}
        </div>
      </main>
    </section>
  );
};

export default GameWaiting;