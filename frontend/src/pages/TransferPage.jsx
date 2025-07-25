import { useState, useEffect } from 'react';
import { useBankStore } from '../store/useBankStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  ChevronLeft,
  User,
  CreditCard,
  DollarSign,
  Send,
  Check,
  AlertTriangle,
  Shield,
  RefreshCw,
  ArrowRight,
  Building,
  Mail,
  Phone,
  CheckCircle,
  Loader
} from 'lucide-react';

const TransferPage = () => {
  const { authUser } = useAuthStore();
  const { 
    balance, 
    transfer, 
    isTransferring, 
    formatCurrency, 
    fetchBalance,
    getReceiver
  } = useBankStore();

  // Form states
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientDetails, setRecipientDetails] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Validation states
  const [accountError, setAccountError] = useState('');
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (authUser) {
      fetchBalance();
    }
  }, [authUser, fetchBalance]);

  // Mock recipient verification (in real app, this would be an API call)
  const verifyRecipient = async (accountNumber) => {
    if (!accountNumber || accountNumber.length < 10) {
      setAccountError('Please enter a valid account number');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    setAccountError('');

    try {
      // Check if user is trying to transfer to their own account
      if (accountNumber === authUser?.accountNumber) {
        setVerificationError('Cannot transfer to your own account');
        setRecipientDetails(null);
        return;
      }

      // Call backend API to get receiver details
      const receiverData = await getReceiver(accountNumber);
      
      if (receiverData) {
        setRecipientDetails({
          fullName: receiverData.name,
          bankName: receiverData.bankName || 'WJ Bank', // Fallback if bankName not provided
          email: receiverData.email,
          phone: receiverData.phone || '', // Fallback if phone not provided
          accountNumber: accountNumber
        });
        setVerificationError('');
      } else {
        setVerificationError('Account not found. Please check the account number.');
        setRecipientDetails(null);
      }
    } catch (error) {
      console.error('Error verifying recipient:', error);
      setVerificationError('Error verifying account. Please try again.');
      setRecipientDetails(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const validateAmount = (value) => {
    const numAmount = parseFloat(value);
    if (!value || isNaN(numAmount)) {
      setAmountError('Please enter a valid amount');
      return false;
    }
    if (numAmount <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }
    if (numAmount > balance) {
      setAmountError('Insufficient balance');
      return false;
    }
    if (numAmount < 1) {
      setAmountError('Minimum transfer amount is ₨1');
      return false;
    }
    setAmountError('');
    return true;
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setAmountError('');
    }
  };

  const handleTransfer = async () => {
    if (!recipientDetails || !validateAmount(amount)) {
      return;
    }

    try {
      setTransferError('');
      await transfer({
        receiverAccountNumber: recipientAccount,
        amount: parseFloat(amount),
        description: description || 'Money transfer'
      });
      
      setTransferSuccess(true);
      // Reset form after successful transfer
      setTimeout(() => {
        setRecipientAccount('');
        setRecipientDetails(null);
        setAmount('');
        setDescription('');
        setTransferSuccess(false);
      }, 3000);
    } catch (error) {
      setTransferError(error.message || 'Transfer failed');
    }
  };

  const canTransfer = recipientDetails && amount && !amountError && !isTransferring;

  if (transferSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Successful!</h2>
            <p className="text-gray-600 mb-6">
              {formatCurrency(parseFloat(amount))} has been transferred to {recipientDetails?.fullName}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setTransferSuccess(false);
                  setRecipientAccount('');
                  setRecipientDetails(null);
                  setAmount('');
                  setDescription('');
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Make Another Transfer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
            <p className="text-gray-600">Transfer funds to any WJ Bank account</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(balance)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Recipient Account Input */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Recipient Details</h3>
                <p className="text-sm text-gray-500">Enter the recipient's account number</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipientAccount}
                    onChange={(e) => {
                      setRecipientAccount(e.target.value);
                      setRecipientDetails(null);
                      setVerificationError('');
                      setAccountError('');
                    }}
                    onBlur={() => {
                      if (recipientAccount) {
                        verifyRecipient(recipientAccount);
                      }
                    }}
                    placeholder="Enter 12-digit account number"
                    className="text-gray-800 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength="12"
                  />
                  {isVerifying && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                {accountError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {accountError}
                  </p>
                )}
                {verificationError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {verificationError}
                  </p>
                )}
              </div>

              {/* Recipient Verification Result */}
              {recipientDetails && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Account Verified</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-green-600" />
                      <div>
                        <span className="text-gray-600">Name: </span>
                        <span className="font-medium text-gray-900">{recipientDetails.fullName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-green-600" />
                      <div>
                        <span className="text-gray-600">Bank: </span>
                        <span className="font-medium text-gray-900">{recipientDetails.bankName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-green-600" />
                      <div>
                        <span className="text-gray-600">Email: </span>
                        <span className="font-medium text-gray-900">{recipientDetails.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transfer Amount */}
          {recipientDetails && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Transfer Amount</h3>
                  <p className="text-sm text-gray-500">Enter the amount to transfer</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    min="1"
                    max={balance}
                  />
                  {amountError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {amountError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this transfer for?"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength="100"
                  />
                </div>

                {/* Transfer Summary */}
                {amount && recipientDetails && !amountError && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Transfer Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">To:</span>
                        <span className="font-medium text-blue-900">{recipientDetails.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Amount:</span>
                        <span className="font-bold text-blue-900">{formatCurrency(parseFloat(amount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Transfer Fee:</span>
                        <span className="font-medium text-blue-900">Free</span>
                      </div>
                      <hr className="border-blue-200" />
                      <div className="flex justify-between">
                        <span className="text-blue-700">Total Debit:</span>
                        <span className="font-bold text-blue-900">{formatCurrency(parseFloat(amount))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transfer Error */}
          {transferError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Transfer Failed</span>
              </div>
              <p className="text-red-700 mt-1">{transferError}</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure Transfer</h4>
                <p className="text-sm text-gray-600">
                  Your transfer is protected with bank-grade security. Always verify recipient details before sending money.
                </p>
              </div>
            </div>
          </div>

          {/* Transfer Button */}
          <div className="sticky bottom-4">
            <button
              onClick={handleTransfer}
              disabled={!canTransfer}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                canTransfer
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isTransferring ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Transfer {amount && formatCurrency(parseFloat(amount))}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferPage;