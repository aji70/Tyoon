// Extracted: Property management - buy, sell, mortgage, houses, hotels
'use client'
import { useState, Dispatch, SetStateAction } from 'react';
import { boardData } from '@/data/board-data';

interface Property {
  id: number;
  name: string;
  type: string;
  owner: string | null;
  ownerUsername: string | null;
  rent_site_only: number;
  houses: number;
  hotels: number;
}

interface OwnedProperty {
  owner: string;
  ownerUsername: string;
  token: string;
  houses: number;
  hotels: number;
}

interface Player {
  id: number;
  name: string;
  username: string;
  position: number;
  balance: number;
  jailed: boolean;
  properties_owned: number[];
  isNext: boolean;
  token: string;
}

export const usePropertyManagement = () => {
  const [propertyId, setPropertyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentProperty, setCurrentProperty] = useState<Property | null>({
    id: 0,
    name: 'Go',
    type: 'corner',
    owner: null,
    ownerUsername: null,
    rent_site_only: 0,
    houses: 0,
    hotels: 0,
  });

  // Extracted: Purchase a property for current player
  const handleBuyProperty = (
    players: Player[], 
    setPlayers: Dispatch<SetStateAction<Player[]>>,
    currentPlayerIndex: number,
    ownedProperties: { [key: number]: OwnedProperty },
    setOwnedProperties: Dispatch<SetStateAction<{ [key: number]: OwnedProperty }>>,
    onClose: () => void
  ) => {
    if (!propertyId || !currentProperty || currentProperty.owner) {
      setError('Cannot buy: Invalid property ID or property already owned.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const square = boardData.find((s) => s.id === Number(propertyId));
    if (square && square.type === 'property' && square.price) {
      setPlayers((prevPlayers: Player[]) => {
        const newPlayers = [...prevPlayers];
        const currentPlayer = { ...newPlayers[currentPlayerIndex] };
        
        if (currentPlayer.balance >= square.price) {
          currentPlayer.balance -= square.price;
          currentPlayer.properties_owned.push(square.id);
          newPlayers[currentPlayerIndex] = currentPlayer;
          
          setOwnedProperties((prev: { [key: number]: OwnedProperty }) => ({
            ...prev,
            [square.id]: {
              owner: currentPlayer.username,
              ownerUsername: currentPlayer.username,
              token: currentPlayer.token,
              houses: 0,
              hotels: 0,
            },
          }));
          
          setCurrentProperty((prev: Property | null) => prev ? { 
            ...prev, 
            owner: currentPlayer.username, 
            ownerUsername: currentPlayer.username, 
            houses: 0, 
            hotels: 0 
          } : null);
        } else {
          setError('Insufficient balance to buy property.');
        }
        
        return newPlayers;
      });
    }
    
    setPropertyId('');
    setIsLoading(false);
    onClose();
  };

  // Extracted: Pay tax when landing on tax squares
  const handlePayTax = (
    players: Player[], 
    setPlayers: Dispatch<SetStateAction<Player[]>>,
    currentPlayerIndex: number,
    onClose: () => void
  ) => {
    if (!propertyId || !currentProperty || currentProperty.name !== 'Tax') {
      setError('Invalid tax square or property ID.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const square = boardData.find((s) => s.id === Number(propertyId));
    if (square && square.type === 'special' && square.price) {
      setPlayers((prevPlayers: Player[]) => {
        const newPlayers = [...prevPlayers];
        const currentPlayer = { ...newPlayers[currentPlayerIndex] };
        
        if (currentPlayer.balance >= square.price) {
          currentPlayer.balance -= square.price;
          newPlayers[currentPlayerIndex] = currentPlayer;
        } else {
          setError('Insufficient balance to pay tax.');
        }
        
        return newPlayers;
      });
    }
    
    setPropertyId('');
    setIsLoading(false);
    onClose();
  };

  // Extracted: Build a house on owned property
  const handleBuyHouse = (
    players: Player[], 
    setPlayers: Dispatch<SetStateAction<Player[]>>,
    currentPlayerIndex: number,
    ownedProperties: { [key: number]: OwnedProperty },
    setOwnedProperties: Dispatch<SetStateAction<{ [key: number]: OwnedProperty }>>,
    onClose: () => void
  ) => {
    if (!propertyId || ownedProperties[Number(propertyId)]?.owner !== players[currentPlayerIndex].username) {
      setError('Cannot buy house: Invalid property ID or not owned.');
      return;
    }
    
    const square = boardData.find((s) => s.id === Number(propertyId));
    if (!square || square.type !== 'property' || !square.cost_of_house || 
        ownedProperties[Number(propertyId)].houses >= 4 || 
        ownedProperties[Number(propertyId)].hotels > 0) {
      setError('Cannot buy house: Invalid property, max houses reached, or hotel already built.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    setPlayers((prevPlayers: Player[]) => {
      const newPlayers = [...prevPlayers];
      const currentPlayer = { ...newPlayers[currentPlayerIndex] };
      
      if (currentPlayer.balance >= square.cost_of_house) {
        currentPlayer.balance -= square.cost_of_house;
        newPlayers[currentPlayerIndex] = currentPlayer;
        
        setOwnedProperties((prev: { [key: number]: OwnedProperty }) => ({
          ...prev,
          [Number(propertyId)]: {
            ...prev[Number(propertyId)],
            houses: prev[Number(propertyId)].houses + 1,
          },
        }));
        
        setCurrentProperty((prev: Property | null) => prev && prev.id === Number(propertyId) ? 
          { ...prev, houses: prev.houses + 1 } : prev);
      } else {
        setError('Insufficient balance to buy house.');
      }
      
      return newPlayers;
    });
    
    setPropertyId('');
    setIsLoading(false);
    onClose();
  };

  // Extracted: Build a hotel on owned property (requires 4 houses)
  const handleBuyHotel = (
    players: Player[], 
    setPlayers: Dispatch<SetStateAction<Player[]>>,
    currentPlayerIndex: number,
    ownedProperties: { [key: number]: OwnedProperty },
    setOwnedProperties: Dispatch<SetStateAction<{ [key: number]: OwnedProperty }>>,
    onClose: () => void
  ) => {
    if (!propertyId || ownedProperties[Number(propertyId)]?.owner !== players[currentPlayerIndex].username) {
      setError('Cannot buy hotel: Invalid property ID or not owned.');
      return;
    }
    
    const square = boardData.find((s) => s.id === Number(propertyId));
    if (!square || square.type !== 'property' || !square.cost_of_house || 
        ownedProperties[Number(propertyId)].houses < 4 || 
        ownedProperties[Number(propertyId)].hotels > 0) {
      setError('Cannot buy hotel: Invalid property, requires 4 houses, or hotel already built.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Hotel cost is typically 5x house cost
    const hotelCost = square.cost_of_house * 5;
    
    setPlayers((prevPlayers: Player[]) => {
      const newPlayers = [...prevPlayers];
      const currentPlayer = { ...newPlayers[currentPlayerIndex] };
      
      if (currentPlayer.balance >= hotelCost) {
        currentPlayer.balance -= hotelCost;
        newPlayers[currentPlayerIndex] = currentPlayer;
        
        setOwnedProperties((prev: { [key: number]: OwnedProperty }) => ({
          ...prev,
          [Number(propertyId)]: {
            ...prev[Number(propertyId)],
            houses: 0, // Houses are replaced by hotel
            hotels: 1,
          },
        }));
        
        setCurrentProperty((prev: Property | null) => prev && prev.id === Number(propertyId) ? 
          { ...prev, houses: 0, hotels: 1 } : prev);
      } else {
        setError('Insufficient balance to buy hotel.');
      }
      
      return newPlayers;
    });
    
    setPropertyId('');
    setIsLoading(false);
    onClose();
  };

  return {
    propertyId,
    setPropertyId,
    isLoading,
    error,
    setError,
    currentProperty,
    setCurrentProperty,
    handleBuyProperty,
    handlePayTax,
    handleBuyHouse,
    handleBuyHotel,
    // Simplified for now - can add sell/mortgage functions later
  };
};
