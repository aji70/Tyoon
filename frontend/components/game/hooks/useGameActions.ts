// New hook: Game action handlers - dice rolling, jail, card system
'use client'
import { useState, useCallback } from 'react';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from '@/constants/constants';
import { Player, DiceRoll } from '../types/unified-types';

export const useGameActions = () => {
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<'Chance' | 'CommunityChest' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Roll dice and return the result
  const rollDice = useCallback(() => {
    setIsLoading(true);
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const roll = die1 + die2;
    const rollResult = { die1, die2, total: roll };
    setLastRoll(rollResult);
    setIsLoading(false);
    return rollResult;
  }, []);

  // Draw a random card from Chance or Community Chest deck
  const handleDrawCard = useCallback((type: 'Chance' | 'CommunityChest') => {
    setIsLoading(true);
    const cardList = type === 'Chance' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
    const randomCard = cardList[Math.floor(Math.random() * cardList.length)];
    setSelectedCard(randomCard);
    setSelectedCardType(type);
    setIsLoading(false);
    return randomCard;
  }, []);

  // Process the drawn card and clear selection
  const handleProcessCard = useCallback(() => {
    if (!selectedCard) {
      throw new Error('No card selected to process.');
    }
    
    const cardData = {
      card: selectedCard,
      type: selectedCardType
    };
    
    console.log(`Processing ${selectedCardType} card: ${selectedCard}`);
    setSelectedCard(null);
    setSelectedCardType(null);
    
    return cardData;
  }, [selectedCard, selectedCardType]);

  // Pay jail fine to get out of jail
  const handlePayJailFine = useCallback((
    players: Player[], 
    currentPlayerIndex: number,
    updatePlayers: (players: Player[]) => void
  ) => {
    setIsLoading(true);
    
    const newPlayers = [...players];
    const currentPlayer = { ...newPlayers[currentPlayerIndex] };
    
    if (currentPlayer.jailed && currentPlayer.balance >= 50) {
      currentPlayer.jailed = false;
      currentPlayer.balance -= 50;
      newPlayers[currentPlayerIndex] = currentPlayer;
      updatePlayers(newPlayers);
      setIsLoading(false);
      return true;
    } else {
      setIsLoading(false);
      throw new Error('Cannot pay jail fine: Not in jail or insufficient balance.');
    }
  }, []);

  return {
    lastRoll,
    selectedCard,
    selectedCardType,
    isLoading,
    rollDice,
    handleDrawCard,
    handleProcessCard,
    handlePayJailFine,
  };
};
