import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBankStore } from '../store/useBankStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Send, 
  Eye, 
  EyeOff, 
  RefreshCw,
  ChevronRight,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Wallet,
  History,
  Settings,
  PlusCircle,
  ArrowRight,
  Shield,
  Smartphone
} from 'lucide-react';
import { useState } from 'react';

const HomePage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [showBalance, setShowBalance] = useState(true);
  
  const {
    balance,
    recentTransactions,
    isLoading,
    initializeBankData,
    fetchBalance,
    fetchTransactions,
    formatCurrency,
    formatDateTime,
    getTransactionTypeConfig
  } = useBankStore();

  useEffect(() => {
    if (authUser) {
      initializeBankData();
    }
  }, [authUser, initializeBankData]);

  const handleRefresh = async () => {
    await Promise.all([fetchBalance(), fetchTransactions()]);
  };

  const getTransactionDisplayData = (transaction) => {
    const config = getTransactionTypeConfig(transaction.type);
    
    let displayName = '';
    let accountNumber = '';
    let prefix = '';

    switch (transaction.type) {
      case 'send':
        displayName = transaction.receiverName || 'Unknown';
        accountNumber = transaction.receiverAccountNumber || '';
        prefix = 'To: ';
        break;
      case 'receive':
        displayName = transaction.senderName || 'Unknown';
        accountNumber = transaction.senderAccountNumber || '';
        prefix = 'From: ';
        break;
      case 'payment':
        displayName = 'Online Payment';
        accountNumber = 'Merchant';
        prefix = 'To: ';
        break;
      default:
        displayName = 'Transaction';
        accountNumber = '';
    }

    return { displayName, accountNumber, prefix, config };
  };

  // Calculate quick stats
  const totalSent = recentTransactions
    .filter(t => t.type === 'send')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalReceived = recentTransactions
    .filter(t => t.type === 'receive')
    .reduce((sum, t) => sum + t.amount, 0);

  if (isLoading && recentTransactions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading your banking data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {authUser?.fullName?.split(' ')[0]}
              </h1>
              <p className="text-gray-600">Here's what's happening with your account today</p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-3 hover:bg-white rounded-xl transition-all shadow-sm border border-gray-200"
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Balance Card */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Total Balance</p>
                    <p className="text-xs text-blue-200 opacity-75">Available for spending</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-3 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all"
                >
                  {showBalance ? (
                    <Eye className="w-5 h-5 text-white" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>

              <div className="mb-8">
                <div className="text-5xl font-bold mb-2">
                  {showBalance ? formatCurrency(balance) : '••••••••'}
                </div>
                <p className="text-blue-100 text-sm">
                  Account: {authUser?.accountNumber}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/transfer')}
                  className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-xl p-4 transition-all flex items-center justify-center gap-3"
                >
                  <Send className="w-5 h-5" />
                  <span className="text-gray-700 font-medium">Send Money</span>
                </button>
                <button
                  onClick={() => navigate('/card')}
                  className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-xl p-4 transition-all flex items-center justify-center gap-3"
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-gray-700 font-medium">My Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Money Sent</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSent)}</p>
                <p className="text-xs text-gray-500 mt-1">This period</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Money Received</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
                <p className="text-xs text-gray-500 mt-1">This period</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{recentTransactions.length}</p>
                <p className="text-xs text-gray-500 mt-1">Recent activity</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                    <p className="text-sm text-gray-500 mt-1">Your latest transactions</p>
                  </div>
                  <Link
                    to="/transactions"
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl font-medium text-sm transition-all"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {recentTransactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                    <p className="text-gray-500 mb-6">Start by making your first transfer or payment</p>
                    <button
                      onClick={() => navigate('/transfer')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Make Transfer
                    </button>
                  </div>
                ) : (
                  recentTransactions.slice(0, 5).map((transaction) => {
                    const { displayName, accountNumber, prefix, config } = getTransactionDisplayData(transaction);
                    
                    return (
                      <div key={transaction._id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          {/* Transaction Icon */}
                          <div className={`w-12 h-12 rounded-xl ${config.bgColor} ${config.borderColor} border flex items-center justify-center flex-shrink-0`}>
                            {transaction.type === 'send' && <ArrowUpRight className={`w-5 h-5 ${config.color}`} />}
                            {transaction.type === 'receive' && <ArrowDownLeft className={`w-5 h-5 ${config.color}`} />}
                            {transaction.type === 'payment' && <CreditCard className={`w-5 h-5 ${config.color}`} />}
                          </div>

                          {/* Transaction Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 truncate">
                                {prefix}{displayName}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full ${config.bgColor} ${config.color} font-medium flex-shrink-0`}>
                                {config.label}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {accountNumber && accountNumber !== 'Merchant' && (
                                <span className="font-mono">•••• {accountNumber.slice(-4)} • </span>
                              )}
                              <span>{formatDateTime(transaction.createdAt)}</span>
                            </div>
                            {transaction.description && transaction.description !== 'Money transfer' && (
                              <p className="text-xs text-gray-400 mt-1 truncate">{transaction.description}</p>
                            )}
                          </div>

                          {/* Amount */}
                          <div className="text-right">
                            <p className={`font-bold text-lg ${config.color}`}>
                              {transaction.type === 'send' ? '' : '+'}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {recentTransactions.length > 0 && (
                <div className="p-6 border-t border-gray-100">
                  <Link
                    to="/transactions"
                    className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl transition-colors font-medium"
                  >
                    View All {recentTransactions.length} Transactions
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/transfer"
                  className="flex items-center gap-4 p-4 hover:bg-blue-50 rounded-xl transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Send className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Send Money</h4>
                    <p className="text-sm text-gray-500">Transfer to any account</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>

                <Link
                  to="/card"
                  className="flex items-center gap-4 p-4 hover:bg-purple-50 rounded-xl transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">My Cards</h4>
                    <p className="text-sm text-gray-500">Manage your cards</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </Link>

                <Link
                  to="/transactions"
                  className="flex items-center gap-4 p-4 hover:bg-green-50 rounded-xl transition-all group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <History className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Transaction History</h4>
                    <p className="text-sm text-gray-500">View all transactions</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-4 p-4 hover:bg-orange-50 rounded-xl transition-all group"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Profile Settings</h4>
                    <p className="text-sm text-gray-500">Account management</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                </Link>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Your Account is Secure</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Your transactions are protected with advanced encryption and fraud monitoring.
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Learn more →
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Banking Promo */}
            {/* <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-gray-800" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Banking on the Go</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Download our mobile app for instant notifications and quick transfers.
                  </p>
                  <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all">
                    Get the App
                  </button>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;