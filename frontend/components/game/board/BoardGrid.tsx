// Extracted: Board grid layout with squares and player tokens
'use client'
import PropertyCard from '../property-card';
import SpecialCard from '../special-card';
import CornerCard from '../corner-card';
import { BoardSquare } from '@/types/game';
import { Player, OwnedProperty } from '../types/unified-types';

interface BoardGridProps {
  boardData: BoardSquare[];
  players: Player[];
  ownedProperties: { [key: number]: OwnedProperty };
  playerTokens: { [key: string]: string };
  currentPlayer: Player | null;
}

export const BoardGrid: React.FC<BoardGridProps> = ({
  boardData,
  players,
  ownedProperties,
  playerTokens,
  currentPlayer
}) => {
  // Calculate grid position for each square on the 11x11 board
  const getGridPosition = (square: BoardSquare) => ({
    gridRowStart: square.gridPosition.row,
    gridColumnStart: square.gridPosition.col,
  });

  // Check if square is in top half (affects hover animations)
  const isTopHalf = (square: BoardSquare) => {
    return square.gridPosition.row === 1; // Top row of the 11x11 grid
  };

  return (
    <div className="w-full bg-[#010F10] aspect-square rounded-lg relative shadow-2xl shadow-cyan-500/10">
      <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-[2px] box-border">
        {/* Center area with game title */}
        <div className="col-start-2 col-span-9 row-start-2 row-span-9 bg-[#010F10] flex flex-col justify-center items-center p-4 relative">
          <h1 className="text-3xl lg:text-5xl font-bold text-[#F0F7F7] font-orbitron text-center mb-4">
            Blockopoly
          </h1>
        </div>

        {/* Board squares */}
        {boardData.map((square, index) => (
          <div
            key={square.id}
            style={getGridPosition(square)}
            className="w-full h-full p-[2px] relative box-border group hover:z-10 transition-transform duration-200"
          >
            <div
              className={`w-full h-full transform group-hover:scale-200 ${
                isTopHalf(square) ? 'origin-top group-hover:origin-bottom group-hover:translate-y-[100px]' : ''
              } group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-transform duration-200`}
            >
              {/* Square content based on type */}
              {square.type === 'property' && (
                <PropertyCard
                  square={square}
                  owner={ownedProperties[square.id]?.owner || null}
                  ownerUsername={ownedProperties[square.id]?.ownerUsername || null}
                  isConnectedPlayer={ownedProperties[square.id]?.owner === currentPlayer?.username}
                />
              )}
              {square.type === 'special' && <SpecialCard square={square} />}
              {square.type === 'corner' && <CornerCard square={square} />}
              
              {/* Player tokens on this square */}
              <div className="absolute bottom-1 left-1 flex flex-wrap gap-1 z-10">
                {players
                  .filter((p) => p.position === index)
                  .map((p) => (
                    <span
                      key={p.id}
                      className={`text-lg md:text-2xl ${p.isNext ? 'border-2 border-cyan-300 rounded' : ''}`}
                    >
                      {p.token || playerTokens[p.username] || ''}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
