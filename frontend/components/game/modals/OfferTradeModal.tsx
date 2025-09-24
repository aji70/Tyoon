// Extracted: Modal for offering trades to other players
'use client'
import { ChevronLeft, Handshake } from 'lucide-react';

interface TradeInputs {
  to: string;
  offeredPropertyIds: string;
  requestedPropertyIds: string;
  cashAmount: string;
  cashDirection: 'offer' | 'request';
  tradeType: 'property_for_property' | 'property_for_cash' | 'cash_for_property';
  tradeId: string;
  originalOfferId: string;
}

interface OtherPlayerProperty {
  id: number;
  name: string;
  ownerUsername: string;
  color: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tradeInputs: TradeInputs;
  setTradeInputs: (inputs: TradeInputs) => void;
  selectedRequestedProperties: number[];
  setSelectedRequestedProperties: (props: number[]) => void;
  otherPlayersProperties: OtherPlayerProperty[];
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

export const OfferTradeModal = ({
  isOpen,
  onClose,
  tradeInputs,
  setTradeInputs,
  selectedRequestedProperties,
  setSelectedRequestedProperties,
  otherPlayersProperties,
  onSubmit,
  isLoading,
  error,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-8 rounded-[16px] w-full max-w-[360px] bg-[#0B191A]/95 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.3)] border border-white/10 overflow-y-auto max-h-[85vh]">
      <h2 className="text-xl font-semibold text-cyan-300 mb-5">
        <Handshake className="w-6 h-6 inline mr-2" />
        Offer Trade
      </h2>
      
      {isLoading && <p className="text-cyan-300 text-[13px] text-center mb-4">Loading...</p>}
      {error && <p className="text-red-400 text-[13px] text-center mb-4">{error}</p>}
      
      <div className="mb-5 space-y-3">
        {/* Player selection */}
        <input
          type="text"
          placeholder="To Player Username"
          value={tradeInputs.to}
          onChange={(e) => setTradeInputs({ ...tradeInputs, to: e.target.value })}
          className="w-full px-4 py-2 bg-[#131F25]/80 text-[#F0F7F7] text-[13px] rounded-[12px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
          aria-label="Enter recipient username"
        />
        
        {/* Properties to offer */}
        <input
          type="text"
          placeholder="Offered Property IDs (comma-separated)"
          value={tradeInputs.offeredPropertyIds}
          onChange={(e) => setTradeInputs({ ...tradeInputs, offeredPropertyIds: e.target.value })}
          className="w-full px-4 py-2 bg-[#131F25]/80 text-[#F0F7F7] text-[13px] rounded-[12px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
          aria-label="Enter offered property IDs"
        />
        
        {/* Properties to request */}
        <div>
          <label className="block text-[#F0F7F7] text-[13px] mb-1">Select Requested Properties</label>
          <div className="max-h-[150px] overflow-y-auto no-scrollbar bg-[#131F25]/80 rounded-[12px] border border-white/10 p-2">
            {otherPlayersProperties.length > 0 ? (
              otherPlayersProperties.map((property) => (
                <div
                  key={property.id}
                  className={`p-2 flex items-center gap-2 cursor-pointer rounded-[8px] transition-colors duration-200 ${
                    selectedRequestedProperties.includes(property.id)
                      ? 'bg-cyan-600/50'
                      : 'hover:bg-[#1A262B]/80'
                  }`}
                  onClick={() =>
                    setSelectedRequestedProperties(
                      selectedRequestedProperties.includes(property.id)
                        ? selectedRequestedProperties.filter((id) => id !== property.id)
                        : [...selectedRequestedProperties, property.id]
                    )
                  }
                  aria-label={`Select property ${property.name}`}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: property.color }}
                  />
                  <span className="text-[#F0F7F7] text-[12px]">
                    {property.name} (Owned by {property.ownerUsername})
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[#A0B1B8] text-[12px] text-center">
                No properties available to request.
              </p>
            )}
          </div>
        </div>
        
        {/* Trade type selection */}
        <div>
          <label className="block text-[#F0F7F7] text-[13px] mb-1">Trade Type</label>
          <select
            value={tradeInputs.tradeType}
            onChange={(e) =>
              setTradeInputs({
                ...tradeInputs,
                tradeType: e.target.value as TradeInputs['tradeType'],
              })
            }
            className="w-full px-4 py-2 bg-[#131F25]/80 text-[#F0F7F7] text-[13px] rounded-[12px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
            aria-label="Select trade type"
          >
            <option value="property_for_property">Property for Property</option>
            <option value="property_for_cash">Property for Cash</option>
            <option value="cash_for_property">Cash for Property</option>
          </select>
        </div>
        
        {/* Cash amount */}
        <div>
          <label className="block text-[#F0F7F7] text-[13px] mb-1">Cash Amount</label>
          <input
            type="number"
            placeholder="Cash Amount"
            value={tradeInputs.cashAmount}
            onChange={(e) => setTradeInputs({ ...tradeInputs, cashAmount: e.target.value })}
            className="w-full px-4 py-2 bg-[#131F25]/80 text-[#F0F7F7] text-[13px] rounded-[12px] border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
            aria-label="Enter cash amount"
          />
        </div>
        
        {/* Cash direction */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-[#F0F7F7] text-[13px]">
            <input
              type="radio"
              name="cashDirection"
              value="offer"
              checked={tradeInputs.cashDirection === 'offer'}
              onChange={() => setTradeInputs({ ...tradeInputs, cashDirection: 'offer' })}
              className="text-cyan-500 focus:ring-cyan-500"
              aria-label="Offer cash"
            />
            Offer Cash
          </label>
          <label className="flex items-center gap-2 text-[#F0F7F7] text-[13px]">
            <input
              type="radio"
              name="cashDirection"
              value="request"
              checked={tradeInputs.cashDirection === 'request'}
              onChange={() => setTradeInputs({ ...tradeInputs, cashDirection: 'request' })}
              className="text-cyan-500 focus:ring-cyan-500"
              aria-label="Request cash"
            />
            Request Cash
          </label>
        </div>
        
        {/* Submit button */}
        <button
          onClick={onSubmit}
          disabled={isLoading}
          aria-label="Offer a trade"
          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-[#F0F7F7] text-[13px] rounded-[12px] hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Offer Trade'}
        </button>
      </div>
      
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close offer trade modal"
        className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-[#F0F7F7] text-[13px] rounded-[12px] hover:from-gray-700 hover:to-gray-900 hover:shadow-[0_0_12px_rgba(107,114,128,0.5)] hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        <ChevronLeft className="w-4 h-4 inline mr-2" />
        Close
      </button>
    </div>
  );
};
