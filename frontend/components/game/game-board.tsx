// Restructured: Main game board using shared hooks and extracted components
'use client';
import React, { useState, useEffect, Component, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BoardSquare } from '@/types/game';
import { boardData } from '@/data/board-data';
import { PLAYER_TOKENS } from '@/constants/constants';

// Import shared hooks
import { useGameState } from './hooks/useGameState';
import { usePropertyManagement } from './hooks/usePropertyManagement';
import { useGameActions } from './hooks/useGameActions';

// Import extracted components
import { BoardGrid } from './board/BoardGrid';
import { GameActions } from './board/GameActions';
import { CardModal } from './board/CardModal';

// Import unified types
import { Player, Game, CurrentProperty } from './types/unified-types';

// Error boundary for handling React errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('Game board error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-400 text-center">Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

const GameBoard: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Shared hooks for game state management
  const {
    players,
    setPlayers,
    currentPlayerIndex,
    setCurrentPlayerIndex,
    ownedProperties,
    setOwnedProperties,
    handleEndTurn,
    updatePlayerPosition,
  } = useGameState();

  const propertyManagement = usePropertyManagement();
  const { handleBuyProperty, handlePayRent } = propertyManagement;

  const {
    lastRoll,
    selectedCard,
    selectedCardType,
    isLoading: actionsLoading,
    rollDice,
    handleDrawCard,
    handleProcessCard,
    handlePayJailFine,
  } = useGameActions();

  // Local state for game board specific functionality
  const [game, setGame] = useState<Game | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentProperty, setCurrentProperty] = useState<CurrentProperty | null>(null);
  const [playerTokens] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize game from URL params
  useEffect(() => {
    const gameIdParam = searchParams.get('gameId');
    const playerParam = searchParams.get('player');
    
    if (gameIdParam) setGameId(gameIdParam);
    if (playerParam) {
      try {
        const playerData = JSON.parse(decodeURIComponent(playerParam));
        setPlayer(playerData);
      } catch (error) {
        console.error('Error parsing player data:', error);
      }
    }
  }, [searchParams]);

  // Update current property when player position changes
  const updateCurrentProperty = () => {
    const currentPlayer = players[currentPlayerIndex];
    const square = boardData.find((s) => s.id === currentPlayer.position);
    if (square) {
      setCurrentProperty({
        id: square.id,
        name: square.name || 'Unknown',
        type: square.type,
        owner: ownedProperties[square.id]?.owner || null,
        ownerUsername: ownedProperties[square.id]?.ownerUsername || null,
        rent_site_only: square.rent_site_only || 0,
      });
    } else {
      setCurrentProperty(null);
    }
  };

  // Handle dice roll with position update
  const handleRollDice = () => {
    const rollResult = rollDice();
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer) {
      updatePlayerPosition(currentPlayer.id, rollResult.total);
      updateCurrentProperty();
    }
  };

  // Handle turn ending with game state update
  const handleTurnEnd = () => {
    if (selectedCard) {
      setError('You must process the drawn card before ending your turn.');
      return;
    }
    
    handleEndTurn((currentPlayer: Player, nextPlayer: Player) => {
      setPlayer(currentPlayer);
      setGame((prev) => prev ? {
        ...prev,
        currentPlayer: currentPlayer.username,
        nextPlayer: nextPlayer.username
      } : null);
    });
    
    updateCurrentProperty();
  };

  // Handle jail fine payment
  const handleJailFine = () => {
    try {
      const updatePlayersFunction = (updatedPlayers: Player[]) => setPlayers(updatedPlayers);
      handlePayJailFine(players, currentPlayerIndex, updatePlayersFunction);
      
      if (player) {
        setPlayer({ ...player, jailed: false, balance: player.balance - 50 });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error paying jail fine');
    }
  };

  // Handle card processing
  const handleCardProcess = () => {
    try {
      const cardData = handleProcessCard();
      console.log('Processed card:', cardData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error processing card');
    }
  };

  // Handle rent payment with property ID
  const handleRentPayment = (propertyId: number) => {
    try {
      const onClose = () => {
        // Clear any rent input state
      };
      
      handlePayRent(
        players,
        setPlayers,
        currentPlayerIndex,
        ownedProperties,
        propertyId.toString(),
        onClose
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error paying rent');
    }
  };

  // Handle game end
  const handleEndGame = () => {
    setIsLoading(true);
    setError(null);
    setGameId(null);
    router.push('/');
    setIsLoading(false);
  };

  // Handle leaving game
  const handleLeaveGame = () => {
    setIsLoading(true);
    setError(null);
    router.push('/');
    setIsLoading(false);
  };

  // Handle card modal close
  const handleCardClose = () => {
    // This will be handled by the hook's internal state
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1e] to-[#1a1f2e] text-white flex flex-col lg:flex-row justify-center items-start p-4 gap-6">
        
        {/* Players Sidebar - Import existing players component */}
        <div className="w-full lg:w-1/3 max-w-lg">
          <div className="bg-[#010F10]/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold text-cyan-300 mb-4">Players</h2>
            <p className="text-gray-400 text-sm">Player management will be integrated here</p>
          </div>
        </div>

        {/* Board Section */}
        <div className="flex justify-center items-start w-full lg:w-2/3 max-w-[800px] mt-[-1rem]">
          <div className="relative">
            <BoardGrid
              boardData={boardData}
              players={players}
              ownedProperties={ownedProperties}
              playerTokens={playerTokens}
              currentPlayer={player}
            />
            
            {/* Game Actions Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
              <GameActions
                isLoading={isLoading || actionsLoading}
                error={error}
                lastRoll={lastRoll}
                rollDice={handleRollDice}
                handleDrawCard={handleDrawCard}
                handlePayJailFine={handleJailFine}
                handleEndTurn={handleTurnEnd}
                handleEndGame={handleEndGame}
                handleLeaveGame={handleLeaveGame}
                payRent={handleRentPayment}
              />
            </div>
            
            {/* Card Modal Overlay */}
            <CardModal
              selectedCard={selectedCard}
              selectedCardType={selectedCardType}
              onProcess={handleCardProcess}
              onClose={handleCardClose}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default GameBoard;
