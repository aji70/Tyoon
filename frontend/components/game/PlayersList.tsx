// Extracted: Player list display component
'use client'

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

interface Props {
  players: Player[];
  currentPlayerIndex: number;
  winningPlayerId: number;
}

export const PlayersList = ({ players, currentPlayerIndex, winningPlayerId }: Props) => {
  return (
    <div className="w-full p-4 bg-[#0B191A]/90 backdrop-blur-sm rounded-[16px] shadow-lg border border-white/5">
      <h5 className="text-[14px] font-semibold text-cyan-300 mb-3">Players</h5>
      <ul className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
        {players.map((player, index) => (
          <li
            key={player.id}
            className={`p-3 bg-[#131F25]/80 rounded-[12px] text-[#F0F7F7] text-[13px] flex items-center gap-3 hover:bg-gradient-to-r hover:from-[#1A262B]/80 hover:to-[#2A3A40]/80 hover:shadow-[0_0_8px_rgba(34,211,238,0.2)] transition-all duration-300 ${
              index === currentPlayerIndex ? 'border-l-4 border-cyan-300' : ''
            }`}
            aria-label={`Player ${player.name}${player.id === winningPlayerId ? ' (Leader)' : ''}`}
          >
            {/* Player token color indicator */}
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ 
                backgroundColor: 
                  player.token === '🚗' ? '#FFBE04' : 
                  player.token === '🚢' ? '#0E8AED' : 
                  player.token === '🐶' ? '#A52A2A' : 
                  player.token === '🎩' ? '#000000' : 
                  player.token === '🐱' ? '#FFD700' : 
                  player.token === '🚲' ? '#228B22' : 
                  player.token === '🛩️' ? '#4682B4' : '#FF4500' 
              }} 
            />
            
            <div className="flex-1">
              <span className="font-medium">
                {player.name}
                {/* Crown for leading player */}
                {player.id === winningPlayerId && <span className="ml-2 text-yellow-400">👑</span>}
                {/* Current player indicator */}
                {index === currentPlayerIndex && <span className="text-[11px] text-cyan-300"> (Me)</span>}
              </span>
              
              <span className="block text-[11px] text-[#A0B1B8]">
                Position: {player.position} | Balance: ${player.balance}
                {/* Jailed status */}
                {player.jailed && <span className="ml-2 text-red-400">(Jailed)</span>}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
