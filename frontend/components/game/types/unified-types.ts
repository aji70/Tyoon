// Unified types for game board restructuring
export interface Player {
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

export interface OwnedProperty {
  owner: string;
  ownerUsername: string;
  token: string;
  houses: number;
  hotels: number;
}

export interface Game {
  id: string;
  currentPlayer: string;
  nextPlayer: string;
}

export interface CurrentProperty {
  id: number;
  name: string;
  type: string;
  owner: string | null;
  ownerUsername: string | null;
  rent_site_only: number;
}

export interface DiceRoll {
  die1: number;
  die2: number;
  total: number;
}
