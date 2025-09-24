// Extracted: All trading functionality - offer, accept, reject, counter trades
'use client'
import { useState } from 'react';

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

export const useTrading = () => {
  const [tradeInputs, setTradeInputs] = useState<TradeInputs>({
    to: '',
    offeredPropertyIds: '',
    requestedPropertyIds: '',
    cashAmount: '0',
    cashDirection: 'offer',
    tradeType: 'property_for_property',
    tradeId: '',
    originalOfferId: '',
  });

  const [selectedRequestedProperties, setSelectedRequestedProperties] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted: Handle offering a trade to another player
  const handleOfferTrade = (onClose: () => void) => {
    if (!tradeInputs.to || !tradeInputs.offeredPropertyIds || (!selectedRequestedProperties.length && tradeInputs.tradeType !== 'property_for_cash') || (tradeInputs.cashAmount === '0' && ['property_for_cash', 'cash_for_property'].includes(tradeInputs.tradeType))) {
      setError('Please fill all required trade fields.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const tradeData = {
      ...tradeInputs,
      requestedPropertyIds: selectedRequestedProperties.join(','),
      cashOffer: tradeInputs.cashDirection === 'offer' ? tradeInputs.cashAmount : '0',
      cashRequest: tradeInputs.cashDirection === 'request' ? tradeInputs.cashAmount : '0',
    };
    
    console.log('Offering trade:', tradeData);
    
    // Reset form after successful submission
    resetTradeInputs();
    setIsLoading(false);
    onClose();
  };

  // Extracted: Handle accepting a trade offer
  const handleAcceptTrade = (onClose: () => void) => {
    if (!tradeInputs.tradeId) {
      setError('Please enter a trade ID.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    console.log(`Accepting trade ID ${tradeInputs.tradeId}`);
    
    setTradeInputs((prev: TradeInputs) => ({ ...prev, tradeId: '' }));
    setIsLoading(false);
    onClose();
  };

  // Extracted: Handle rejecting a trade offer
  const handleRejectTrade = (onClose: () => void) => {
    if (!tradeInputs.tradeId) {
      setError('Please enter a trade ID.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    console.log(`Rejecting trade ID ${tradeInputs.tradeId}`);
    
    setTradeInputs((prev: TradeInputs) => ({ ...prev, tradeId: '' }));
    setIsLoading(false);
    onClose();
  };

  // Extracted: Handle making a counter-offer to a trade
  const handleCounterTrade = (onClose: () => void) => {
    if (!tradeInputs.originalOfferId || !tradeInputs.offeredPropertyIds || !tradeInputs.requestedPropertyIds) {
      setError('Please fill all counter trade fields.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    console.log('Countering trade:', tradeInputs);
    
    resetTradeInputs();
    setIsLoading(false);
    onClose();
  };

  // Extracted: Handle approving a counter-trade offer
  const handleApproveCounterTrade = (onClose: () => void) => {
    if (!tradeInputs.tradeId) {
      setError('Please enter a trade ID.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    console.log(`Approving counter trade ID ${tradeInputs.tradeId}`);
    
    setTradeInputs((prev: TradeInputs) => ({ ...prev, tradeId: '' }));
    setIsLoading(false);
    onClose();
  };

  // Extracted: Reset all trade form inputs
  const resetTradeInputs = () => {
    setTradeInputs({
      to: '',
      offeredPropertyIds: '',
      requestedPropertyIds: '',
      cashAmount: '0',
      cashDirection: 'offer',
      tradeType: 'property_for_property',
      tradeId: '',
      originalOfferId: '',
    });
    setSelectedRequestedProperties([]);
  };

  return {
    tradeInputs,
    setTradeInputs,
    selectedRequestedProperties,
    setSelectedRequestedProperties,
    isLoading,
    error,
    setError,
    handleOfferTrade,
    handleAcceptTrade,
    handleRejectTrade,
    handleCounterTrade,
    handleApproveCounterTrade,
    resetTradeInputs,
  };
};
