// Extracted: Game action buttons and controls
'use client'
import { useState } from 'react';
import { Player, DiceRoll } from '../types/unified-types';

interface GameActionsProps {
  // State
  isLoading: boolean;
  error: string | null;
  lastRoll: DiceRoll | null;
  
  // Handlers
  rollDice: () => void;
  handleDrawCard: (type: 'Chance' | 'CommunityChest') => void;
  handlePayJailFine: () => void;
  handleEndTurn: () => void;
  handleEndGame: () => void;
  handleLeaveGame: () => void;
  
  // Rent payment functionality
  payRent: (propertyId: number) => void;
}

export const GameActions: React.FC<GameActionsProps> = ({
  isLoading,
  error,
  lastRoll,
  rollDice,
  handleDrawCard,
  handlePayJailFine,
  handleEndTurn,
  handleEndGame,
  handleLeaveGame,
  payRent
}) => {
  const [showRentInput, setShowRentInput] = useState(false);
  const [propertyId, setPropertyId] = useState('');

  const handlePayRent = () => {
    const id = parseInt(propertyId);
    if (!isNaN(id) && id > 0) {
      payRent(id);
      setPropertyId('');
      setShowRentInput(false);
    }
  };

  const handleCancelRent = () => {
    setPropertyId('');
    setShowRentInput(false);
  };

  return (
    <div
      className="p-4 rounded-lg w-full max-w-sm bg-cover bg-center"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1620283088057-7d4241262d45'), linear-gradient(to bottom, rgba(14, 40, 42, 0.8), rgba(14, 40, 42, 0.8))`,
      }}
    >
      <h2 className="text-base font-semibold text-cyan-300 mb-3">Game Actions</h2>
      
      {isLoading && (
        <p className="text-cyan-300 text-sm text-center mb-2">Loading...</p>
      )}
      
      <div className="flex flex-col gap-2">
        {/* Roll Dice Button */}
        <button
          onClick={rollDice}
          aria-label="Roll the dice to move your player"
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-full hover:from-cyan-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200"
        >
          Roll Dice
        </button>
        
        {/* Dice Roll Result */}
        {lastRoll && (
          <p className="text-gray-300 text-sm text-center">
            Rolled: <span className="font-bold text-white">{lastRoll.die1} + {lastRoll.die2} = {lastRoll.total}</span>
          </p>
        )}
        
        {/* Rent Payment Input */}
        {showRentInput && (
          <div className="flex flex-col gap-2">
            <input
              type="number"
              placeholder="Property ID for Rent"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-2 py-1 mb-2 bg-gray-800 text-white text-xs rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Enter property ID for rent"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePayRent}
                aria-label="Confirm rent payment"
                className="px-2 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs rounded-full hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-200"
              >
                Confirm Rent
              </button>
              <button
                onClick={handleCancelRent}
                aria-label="Cancel rent payment"
                className="px-2 py-1 bg-gradient-to-r from-gray-500 to-gray-700 text-white text-xs rounded-full hover:from-gray-600 hover:to-gray-800 transform hover:scale-105 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Action Buttons Grid */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setShowRentInput(true)}
            aria-label="Pay rent for the property"
            className="px-2 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs rounded-full hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-200"
          >
            Pay Rent
          </button>
          
          <button
            onClick={handleEndTurn}
            aria-label="End your turn"
            className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200"
          >
            End Turn
          </button>
          
          <button
            onClick={handlePayJailFine}
            aria-label="Pay jail fine"
            className="px-2 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full hover:from-pink-600 hover:to-rose-600 transform hover:scale-105 transition-all duration-200"
          >
            Pay Jail Fine
          </button>
          
          <button
            onClick={() => handleDrawCard('Chance')}
            aria-label="Draw a Chance card"
            className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-lime-500 text-white text-xs rounded-full hover:from-yellow-600 hover:to-lime-600 transform hover:scale-105 transition-all duration-200"
          >
            Draw Chance
          </button>
          
          <button
            onClick={() => handleDrawCard('CommunityChest')}
            aria-label="Draw a Community Chest card"
            className="px-2 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs rounded-full hover:from-teal-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200"
          >
            Draw CChest
          </button>
          
          <button
            onClick={handleEndGame}
            aria-label="End the game"
            className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200"
          >
            End Game
          </button>
          
          <button
            onClick={handleLeaveGame}
            aria-label="Leave the game"
            className="px-2 py-1 bg-gradient-to-r from-gray-500 to-gray-700 text-white text-xs rounded-full hover:from-gray-600 hover:to-gray-800 transform hover:scale-105 transition-all duration-200"
          >
            Leave Game
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
};
