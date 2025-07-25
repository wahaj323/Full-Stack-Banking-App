import { useEffect, useState } from 'react';
import { useBankStore } from '../store/useBankStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  CreditCard, 
  Shield, 
  Smartphone,
  RefreshCw,
  ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';

const CardPage = () => {
  // const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { card, isLoading, fetchCard } = useBankStore();
  const navigate = useNavigate();
  
  const [showDetails, setShowDetails] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (authUser) {
      fetchCard();
    }
  }, [authUser, fetchCard]);

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCardNumber = (cardNumber) => {
    if (!cardNumber) return '•••• •••• •••• ••••';
    if (!showDetails) return '•••• •••• •••• ' + cardNumber.slice(-4);
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatCSV = (csv) => {
    if (!csv) return '•••';
    return showDetails ? csv : '•••';
  };

  const formatExpiry = (expiry) => {
    if (!expiry) return '••/••';
    return showDetails ? expiry : '••/••';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading your card...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Debit Card</h1>
            <p className="text-gray-600">Manage your card details and settings</p>
          </div>
        </div>

        {card ? (
          <div className="space-y-8">
            {/* Card Display */}
            <div className="relative">
              {/* Card Front */}
              <div className="relative w-full max-w-md mx-auto">
                <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-2xl p-6 text-white shadow-2xl transform transition-all duration-300 hover:scale-105">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full transform translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full transform -translate-x-12 translate-y-12"></div>
                  </div>
                  
                  {/* Card Header */}
                  <div className="relative z-10 flex justify-between items-start mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium opacity-90">DEBIT</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold tracking-wider">WJ</div>
                      <div className="text-xs opacity-75">BANK</div>
                    </div>
                  </div>

                  {/* Chip */}
                  <div className="relative z-10 w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg mb-4 flex items-center justify-center">
                    <div className="w-8 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-sm"></div>
                  </div>

                  {/* Card Number */}
                  <div className="relative z-10 mb-6">
                    <div className="text-xl font-mono tracking-wider mb-1">
                      {formatCardNumber(card.cardNumber)}
                    </div>
                    <div className="text-xs opacity-75">CARD NUMBER</div>
                  </div>

                  {/* Cardholder and Expiry */}
                  <div className="relative z-10 flex justify-between items-end">
                    <div>
                      <div className="text-sm font-medium tracking-wide">
                        {authUser?.fullName?.toUpperCase() || 'CARDHOLDER'}
                      </div>
                      <div className="text-xs opacity-75">CARDHOLDER NAME</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">
                        {formatExpiry(card.expiryDate)}
                      </div>
                      <div className="text-xs opacity-75">VALID THRU</div>
                    </div>
                  </div>
                </div>

                {/* Card Back Preview (CSV) */}
                <div className="mt-4 bg-gray-800 rounded-2xl p-6 text-white shadow-xl">
                  <div className="h-12 bg-black mb-4 rounded"></div>
                  <div className="flex justify-end">
                    <div className="bg-white text-black px-3 py-1 rounded text-sm font-mono">
                      {formatCSV(card.csv)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-right">CVV</div>
                </div>
              </div>
            </div>

            {/* Card Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Card Details</h2>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    showDetails 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {showDetails ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show Details
                    </>
                  )}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Card Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Card Number</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-gray-900">
                      {formatCardNumber(card.cardNumber)}
                    </div>
                    {showDetails && (
                      <button
                        onClick={() => handleCopy(card.cardNumber, 'cardNumber')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'cardNumber' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-gray-900">
                      {formatExpiry(card.expiryDate)}
                    </div>
                    {showDetails && (
                      <button
                        onClick={() => handleCopy(card.expiryDate, 'expiry')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'expiry' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* CVV */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">CVV</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-gray-900">
                      {formatCSV(card.csv)}
                    </div>
                    {showDetails && (
                      <button
                        onClick={() => handleCopy(card.csv, 'csv')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'csv' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Cardholder Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Cardholder Name</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {authUser?.fullName?.toUpperCase() || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Security Tips</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Never share your card details with anyone</li>
                    <li>• Use secure websites for online payments</li>
                    <li>• Cover your PIN when entering it</li>
                    <li>• Report lost or stolen cards immediately</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/transfer')}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Make Payment</h3>
                    <p className="text-sm text-gray-500">Use your card to send money</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/transactions')}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Transaction History</h3>
                    <p className="text-sm text-gray-500">View all card transactions</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Card Found</h3>
            <p className="text-gray-500">Unable to load your card information</p>
            <button
              onClick={fetchCard}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardPage;