// Extracted: Card display modal for Chance and Community Chest cards
'use client'

interface CardModalProps {
  selectedCard: string | null;
  selectedCardType: 'Chance' | 'CommunityChest' | null;
  onProcess: () => void;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  selectedCard,
  selectedCardType,
  onProcess,
  onClose
}) => {
  if (!selectedCard || !selectedCardType) {
    return null;
  }

  return (
    <div
      className="mt-4 p-3 rounded-lg w-full max-w-sm bg-cover bg-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1620283088057-7d4241262d45'), linear-gradient(to bottom, rgba(14, 40, 42, 0.8), rgba(14, 40, 42, 0.8))`,
      }}
    >
      <h3 className="text-base font-semibold text-cyan-300 mb-2">
        {selectedCardType === 'CommunityChest' ? 'Community Chest' : 'Chance'} Card
      </h3>
      
      <p className="text-sm text-gray-300">{selectedCard}</p>
      
      <div className="flex gap-2 mt-2">
        <button
          onClick={onProcess}
          aria-label="Process the drawn card"
          className="px-2 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs rounded-full hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
          disabled={!selectedCardType}
        >
          Process
        </button>
        
        <button
          onClick={onClose}
          aria-label="Close card"
          className="px-2 py-1 bg-gradient-to-r from-gray-500 to-gray-700 text-white text-xs rounded-full hover:from-gray-600 hover:to-gray-800 transform hover:scale-105 transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};
