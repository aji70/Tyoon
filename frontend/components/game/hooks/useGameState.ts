// Extracted: Game state management - players, current player, winning player
'use client'
import { useState, useMemo, useCallback } from 'react';
import { Player, OwnedProperty } from '../types/unified-types';

export const useGameState = () => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 0, name: 'Aji', username: 'Aji', position: 0, balance: 1500, jailed: false, properties_owned: [1, 3], isNext: true, token: '🚗' },
    { id: 1, name: 'Signor', username: 'Signor', position: 5, balance: 1200, jailed: false, properties_owned: [], isNext: false, token: '🚢' },
    { id: 2, name: 'Luna', username: 'Luna', position: 10, balance: 1800, jailed: false, properties_owned: [5], isNext: false, token: '🐶' },
    { id: 3, name: 'Rex', username: 'Rex', position: 15, balance: 900, jailed: true, properties_owned: [], isNext: false, token: '🎩' },
    { id: 4, name: 'Mira', username: 'Mira', position: 20, balance: 2000, jailed: false, properties_owned: [7, 9], isNext: false, token: '🐱' },
    { id: 5, name: 'Zoe', username: 'Zoe', position: 25, balance: 1100, jailed: false, properties_owned: [], isNext: false, token: '🚲' },
    { id: 6, name: 'Finn', username: 'Finn', position: 30, balance: 1600, jailed: false, properties_owned: [11], isNext: false, token: '🛩️' },
    { id: 7, name: 'Tara', username: 'Tara', position: 35, balance: 1300, jailed: false, properties_owned: [], isNext: false, token: '🚀' },
  ]);
  
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  
  const [ownedProperties, setOwnedProperties] = useState<{ [key: number]: OwnedProperty }>({
    1: { owner: 'Aji', ownerUsername: 'Aji', token: '🚗', houses: 0, hotels: 0 },
    3: { owner: 'Aji', ownerUsername: 'Aji', token: '🚗', houses: 0, hotels: 0 },
    5: { owner: 'Luna', ownerUsername: 'Luna', token: '🐶', houses: 0, hotels: 0 },
    7: { owner: 'Mira', ownerUsername: 'Mira', token: '🐱', houses: 0, hotels: 0 },
    9: { owner: 'Mira', ownerUsername: 'Mira', token: '🐱', houses: 0, hotels: 0 },
    11: { owner: 'Finn', ownerUsername: 'Finn', token: '🛩️', houses: 0, hotels: 0 },
  });

  // Extracted: Calculate winning player based on balance
  const winningPlayerId = useMemo(() => {
    return players.reduce((max: Player, player: Player) => player.balance > max.balance ? player : max, players[0]).id;
  }, [players]);

  // End current player's turn and move to next player
  const handleEndTurn = useCallback((updateGame?: (player: Player, nextPlayer: Player) => void) => {
    setPlayers((prevPlayers) => {
      const newPlayers = [...prevPlayers];
      newPlayers[currentPlayerIndex].isNext = false;
      
      const nextIndex = (currentPlayerIndex + 1) % newPlayers.length;
      newPlayers[nextIndex].isNext = true;
      
      // Update game state if callback provided
      if (updateGame) {
        updateGame(newPlayers[nextIndex], newPlayers[(nextIndex + 1) % newPlayers.length]);
      }
      
      setCurrentPlayerIndex(nextIndex);
      return newPlayers;
    });
  }, [currentPlayerIndex, setPlayers, setCurrentPlayerIndex]);

  // Update player position after dice roll
  const updatePlayerPosition = useCallback((playerId: number, rollAmount: number) => {
    setPlayers((prevPlayers) => {
      const newPlayers = [...prevPlayers];
      const playerIndex = newPlayers.findIndex(p => p.id === playerId);
      
      if (playerIndex !== -1) {
        const currentPlayer = { ...newPlayers[playerIndex] };
        let newPosition = (currentPlayer.position + rollAmount) % 40;
        if (newPosition < 0) newPosition += 40;
        
        currentPlayer.position = newPosition;
        newPlayers[playerIndex] = currentPlayer;
      }
      
      return newPlayers;
    });
  }, [setPlayers]);

  return {
    players,
    setPlayers,
    currentPlayerIndex,
    setCurrentPlayerIndex,
    ownedProperties,
    setOwnedProperties,
    winningPlayerId,
    handleEndTurn,
    updatePlayerPosition,
  };
};
