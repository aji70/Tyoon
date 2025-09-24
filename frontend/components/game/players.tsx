// Restructured: Main Players component - now uses extracted hooks and components
'use client'
import { ChevronLeft, Flag, Plus, Handshake, CheckCircle, Repeat, ChevronDown, ChevronUp } from 'lucide-react'
import React, { useState, useMemo } from 'react'
import { PiUsersThree } from 'react-icons/pi';
import { boardData } from '@/data/board-data';

// Extracted: Import custom hooks for specific functionality
import { useGameState } from './hooks/useGameState';
import { useTrading } from './hooks/useTrading';
import { usePropertyManagement } from './hooks/usePropertyManagement';

// Extracted: Import separated components  
import { PlayersList } from './PlayersList';
import { OfferTradeModal } from './modals/OfferTradeModal';

const Players = () => {
  // Extracted: UI state management
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [modalState, setModalState] = useState({
    offerTrade: false,
    manageTrades: false,
    counterTrade: false,
    property: false,
    management: false,
  });

  // Extracted: Use custom hooks for specific functionality
  const gameState = useGameState();
  const trading = useTrading();
  const propertyManagement = usePropertyManagement();

  // Extracted: Compute properties owned by other players for trading
  const otherPlayersProperties = useMemo(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return boardData.filter(
      (property) =>
        property.owner &&
        property.owner !== currentPlayer.username &&
        property.type === 'property'
    ).map((property) => ({
      id: property.id,
      name: property.name,
      ownerUsername: property.ownerUsername || 'Unknown',
      color: property.color || '#FFFFFF',
    }));
  }, [gameState.players, gameState.currentPlayerIndex, boardData]);

  // Extracted: Generate owned properties list for current player
  const ownedPropertiesList = gameState.players[gameState.currentPlayerIndex].properties_owned.map((id: number) => {
    const property = boardData.find((p) => p.id === id);
    return property || { 
      id, 
      name: `Property ${id}`, 
      type: 'unknown' as const,
      owner: gameState.players[gameState.currentPlayerIndex].username, 
      ownerUsername: gameState.players[gameState.currentPlayerIndex].username, 
      rent_site_only: 0, 
      color: '#FFFFFF',
      houses: gameState.ownedProperties[id]?.houses || 0,
      hotels: gameState.ownedProperties[id]?.hotels || 0,
      price: 0,
      rent_one_house: 0,
      rent_two_houses: 0,
      rent_three_houses: 0,
      rent_four_houses: 0,
      rent_hotel: 0,
      cost_of_house: 0,
      is_mortgaged: false,
      group_id: 0,
      position: 'bottom' as const,
      gridPosition: { row: 0, col: 0 },
      icon: '',
    };
  });

  // Extracted: Simplified modal management
  const openModal = (modal: keyof typeof modalState) => {
    setModalState({
      offerTrade: false,
      manageTrades: false,
      counterTrade: false,
      property: false,
      management: false,
      [modal]: true,
    });
    if (modal === 'offerTrade') {
      trading.setSelectedRequestedProperties([]);
    }
  };

  const closeModal = (modal: keyof typeof modalState) => {
    setModalState((prev: typeof modalState) => ({ ...prev, [modal]: false }));
  };

  // Extracted: Sidebar toggle functionality
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleProperties = () => {
    setIsPropertiesOpen(!isPropertiesOpen);
  };

  return (
    <>
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-0 left-0 bg-[#010F10] z-10 lg:hidden text-[#F0F7F7] w-[44px] h-[44px] rounded-e-[12px] flex items-center justify-center border-[1px] border-white/10 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-900 hover:to-indigo-900 hover:shadow-md"
          aria-label="Toggle sidebar"
        >
          <PiUsersThree className="w-6 h-6" />
        </button>
      )}
      
      <aside
        className={`
          h-full overflow-y-auto no-scrollbar bg-[#010F10]/95 backdrop-blur-sm px-5 pb-12 rounded-e-[16px] border-r-[1px] border-white/10
          transition-all duration-300 ease-in-out
          fixed z-20 top-0 left-0 
          transform ${isSidebarOpen ? 'translate-x-0 lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:static lg:transform-none
          ${isSidebarOpen ? 'lg:w-[300px] md:w-3/5 w-full' : 'lg:w-[60px] w-full'}
        `}
      >
        <div className="w-full h-full flex flex-col gap-8">
          {/* Extracted: Header section */}
          <div className="w-full sticky top-0 bg-[#010F10]/95 py-5 flex justify-between items-center">
            <h4 className={`font-[700] font-dmSans text-[18px] text-[#F0F7F7] ${!isSidebarOpen && 'hidden'}`}>
              Players
            </h4>
            <button 
              onClick={toggleSidebar} 
              className="text-[#F0F7F7] lg:hidden transition-colors duration-300 hover:text-cyan-300" 
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <PiUsersThree className="size-[28px]" />}
            </button>
          </div>

          {/* Extracted: Players section - now uses PlayersList component */}
          <div className={`w-full flex flex-col gap-4 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <PlayersList 
              players={gameState.players}
              currentPlayerIndex={gameState.currentPlayerIndex}
              winningPlayerId={gameState.winningPlayerId}
            />
          </div>

          {/* Extracted: Properties section */}
          <div className={`w-full flex flex-col gap-6 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="w-full flex flex-col gap-4">
              <h4 className='font-[700] font-dmSans text-[16px] text-[#F0F7F7]'>My Properties</h4>
              <div className="flex flex-col gap-3">
                <button
                  onClick={toggleProperties}
                  className="flex items-center justify-between w-full px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-[12px] text-[#F0F7F7] text-[13px] font-semibold font-dmSans hover:from-cyan-700 hover:to-teal-700 hover:shadow-[0_0_8px_rgba(45,212,191,0.3)] transition-all duration-300"
                  aria-label={isPropertiesOpen ? "Collapse My Empire" : "Expand My Empire"}
                >
                  <span>My Empire</span>
                  {isPropertiesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {isPropertiesOpen && (
                  <div className="w-full p-4 bg-[#0B191A]/90 backdrop-blur-sm rounded-[16px] shadow-lg border border-white/5">
                    {ownedPropertiesList.length > 0 ? (
                      <ul className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                        {ownedPropertiesList.map((property: any) => (
                          <li
                            key={property.id}
                            className="p-3 bg-[#131F25]/80 rounded-[12px] text-[#F0F7F7] text-[13px] flex items-center gap-3 hover:bg-gradient-to-r hover:from-[#1A262B]/80 hover:to-[#2A3A40]/80 hover:shadow-[0_0_8px_rgba(34,211,238,0.2)] transition-all duration-300 cursor-pointer"
                            onClick={() => propertyManagement.setPropertyId(property.id.toString())}
                            aria-label={`Select property ${property.name}`}
                          >
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: property.color || '#FFFFFF' }}
                            />
                            <div className="flex-1">
                              <span className="font-medium">{property.name}</span>
                              <span className="block text-[11px] text-[#A0B1B8]">
                                ID: {property.id} | Rent: ${property.rent_site_only} | Houses: {property.houses} | Hotels: {property.hotels}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#A0B1B8] text-[13px] text-center">No properties owned yet.</p>
                    )}
                  </div>
                )}

                {/* Extracted: Property action buttons */}
                <button
                  onClick={() => openModal('property')}
                  className="w-full px-4 py-2 rounded-[12px] bg-gradient-to-r from-green-700 to-emerald-700 text-[#F0F7F7] text-[13px] font-semibold font-dmSans flex items-center gap-2 hover:from-green-800 hover:to-emerald-800 hover:shadow-[0_0_12px_rgba(16,185,129,0.5)] hover:scale-105 transition-all duration-300"
                >
                  <Plus className='w-4 h-4' />
                  Property
                </button>
                <button
                  onClick={() => openModal('management')}
                  className="w-full px-4 py-2 rounded-[12px] bg-gradient-to-r from-purple-700 to-indigo-700 text-[#F0F7F7] text-[13px] font-semibold font-dmSans flex items-center gap-2 hover:from-purple-800 hover:to-indigo-800 hover:shadow-[0_0_12px_rgba(168,85,247,0.5)] hover:scale-105 transition-all duration-300"
                >
                  <Plus className='w-4 h-4' />
                  Management
                </button>
                <button
                  onClick={() => {}}
                  className="w-full px-4 py-2 rounded-[12px] bg-gradient-to-r from-red-700 to-pink-700 text-[#F0F7F7] text-[13px] font-semibold font-dmSans flex items-center gap-2 hover:from-red-800 hover:to-pink-800 hover:shadow-[0_0_12px_rgba(239,68,68,0.5)] hover:scale-105 transition-all duration-300"
                >
                  <Flag className='w-4 h-4' />
                  Bankruptcy
                </button>
              </div>
            </div>
          </div>

          {/* Extracted: Trade section */}
          <div className={`w-full flex flex-col gap-6 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="w-full flex flex-col gap-4">
              <h4 className='font-[700] font-dmSans text-[16px] text-[#F0F7F7]'>Trade</h4>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => openModal('offerTrade')}
                  className="w-full px-4 py-2 rounded-[12px] bg-gradient-to-r from-blue-700 to-indigo-700 text-[#F0F7F7] text-[13px] font-semibold font-dmSans flex items-center gap-2 hover:from-blue-800 hover:to-indigo-800 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] hover:scale-105 transition-all duration-300"
                >
                  <Handshake className='w-4 h-4' />
                  Offer Trade
                </button>
                <button
                  onClick={() => openModal('manageTrades')}
                  className="w-full px-4 py-2 rounded-[12px] bg-gradient-to-r from-teal-700 to-cyan-700 text-[#F0F7F7] text-[13px] font-semibold font-dmSans flex items-center gap-2 hover:from-teal-800 hover:to-cyan-800 hover:shadow-[0_0_12px_rgba(45,212,191,0.5)] hover:scale-105 transition-all duration-300"
                >
                  <CheckCircle className='w-4 h-4' />
                  Manage Trades
                </button>
                <button
                  onClick={() => openModal('counterTrade')}
                  className="w-full px-4 py-2 rounded-[12px] bg-gradient-to-r from-purple-700 to-indigo-700 text-[#F0F7F7] text-[13px] font-semibold font-dmSans flex items-center gap-2 hover:from-purple-800 hover:to-indigo-800 hover:shadow-[0_0_12px_rgba(168,85,247,0.5)] hover:scale-105 transition-all duration-300"
                >
                  <Repeat className='w-4 h-4' />
                  Counter Trade
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Extracted: Modals - now use separate components */}
      <OfferTradeModal 
        isOpen={modalState.offerTrade}
        onClose={() => closeModal('offerTrade')}
        tradeInputs={trading.tradeInputs}
        setTradeInputs={trading.setTradeInputs}
        selectedRequestedProperties={trading.selectedRequestedProperties}
        setSelectedRequestedProperties={trading.setSelectedRequestedProperties}
        otherPlayersProperties={otherPlayersProperties}
        onSubmit={() => trading.handleOfferTrade(() => closeModal('offerTrade'))}
        isLoading={trading.isLoading}
        error={trading.error}
      />

      {/* TODO: Create other modal components for manageTrades, counterTrade, property, management */}
      {modalState.manageTrades && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-8 rounded-[16px] w-full max-w-[360px] bg-[#0B191A]/95 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.3)] border border-white/10">
          <h2 className="text-xl font-semibold text-cyan-300 mb-5">Manage Trades</h2>
          <p className="text-[#A0B1B8] text-[13px] text-center mb-4">TODO: Extract to ManageTradesModal component</p>
          <button
            onClick={() => closeModal('manageTrades')}
            className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-[#F0F7F7] text-[13px] rounded-[12px]"
          >
            Close
          </button>
        </div>
      )}

      {modalState.counterTrade && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-8 rounded-[16px] w-full max-w-[360px] bg-[#0B191A]/95 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.3)] border border-white/10">
          <h2 className="text-xl font-semibold text-cyan-300 mb-5">Counter Trade</h2>
          <p className="text-[#A0B1B8] text-[13px] text-center mb-4">TODO: Extract to CounterTradeModal component</p>
          <button
            onClick={() => closeModal('counterTrade')}
            className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-[#F0F7F7] text-[13px] rounded-[12px]"
          >
            Close
          </button>
        </div>
      )}

      {modalState.property && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-8 rounded-[16px] w-full max-w-[360px] bg-[#0B191A]/95 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.3)] border border-white/10">
          <h2 className="text-xl font-semibold text-cyan-300 mb-5">Property Actions</h2>
          <input
            type="number"
            placeholder="Property ID"
            value={propertyManagement.propertyId}
            onChange={(e) => propertyManagement.setPropertyId(e.target.value)}
            className="w-full px-4 py-2 bg-[#131F25]/80 text-[#F0F7F7] text-[13px] rounded-[12px] border border-white/10 mb-3"
          />
          {propertyManagement.error && (
            <p className="text-red-400 text-[13px] text-center mb-4">{propertyManagement.error}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => propertyManagement.handleBuyProperty(
                gameState.players,
                gameState.setPlayers,
                gameState.currentPlayerIndex,
                gameState.ownedProperties,
                gameState.setOwnedProperties,
                () => closeModal('property')
              )}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-[#F0F7F7] text-[13px] rounded-[12px]"
            >
              Buy
            </button>
            <button
              onClick={() => propertyManagement.handlePayTax(
                gameState.players,
                gameState.setPlayers,
                gameState.currentPlayerIndex,
                () => closeModal('property')
              )}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-[#F0F7F7] text-[13px] rounded-[12px]"
            >
              Pay Tax
            </button>
            <button
              onClick={() => closeModal('property')}
              className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-[#F0F7F7] text-[13px] rounded-[12px] col-span-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {modalState.management && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-8 rounded-[16px] w-full max-w-[360px] bg-[#0B191A]/95 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.3)] border border-white/10">
          <h2 className="text-xl font-semibold text-cyan-300 mb-5">Property Management</h2>
          <input
            type="number"
            placeholder="Property ID"
            value={propertyManagement.propertyId}
            onChange={(e) => propertyManagement.setPropertyId(e.target.value)}
            className="w-full px-4 py-2 bg-[#131F25]/80 text-[#F0F7F7] text-[13px] rounded-[12px] border border-white/10 mb-3"
          />
          {propertyManagement.error && (
            <p className="text-red-400 text-[13px] text-center mb-4">{propertyManagement.error}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => propertyManagement.handleBuyHouse(
                gameState.players,
                gameState.setPlayers,
                gameState.currentPlayerIndex,
                gameState.ownedProperties,
                gameState.setOwnedProperties,
                () => closeModal('management')
              )}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-[#F0F7F7] text-[13px] rounded-[12px]"
            >
              Buy House
            </button>
            <button
              onClick={() => propertyManagement.handleBuyHotel(
                gameState.players,
                gameState.setPlayers,
                gameState.currentPlayerIndex,
                gameState.ownedProperties,
                gameState.setOwnedProperties,
                () => closeModal('management')
              )}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-[#F0F7F7] text-[13px] rounded-[12px]"
            >
              Buy Hotel
            </button>
            <button
              onClick={() => closeModal('management')}
              className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-[#F0F7F7] text-[13px] rounded-[12px] col-span-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Players
