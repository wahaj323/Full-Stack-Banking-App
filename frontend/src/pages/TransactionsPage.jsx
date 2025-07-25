import { useState, useEffect, useMemo } from 'react';
import { useBankStore } from '../store/useBankStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  ChevronLeft,
  Search,
  Filter,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  RefreshCw,
  ChevronDown,
  X,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Eye,
  SortAsc,
  SortDesc,
  MoreVertical
} from 'lucide-react';

const TransactionsPage = () => {
  const { authUser } = useAuthStore();
  const {
    transactions,
    isLoading,
    fetchTransactions,
    formatCurrency,
    formatDateTime,
    getTransactionTypeConfig
  } = useBankStore();

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    if (authUser) {
      fetchTransactions();
    }
  }, [authUser, fetchTransactions]);

  // Calculate transaction statistics
  const transactionStats = useMemo(() => {
    const totalSent = transactions
      .filter(t => t.type === 'send')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalReceived = transactions
      .filter(t => t.type === 'receive')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPayments = transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthTransactions = transactions.filter(
      t => new Date(t.createdAt) >= thisMonth
    );

    return {
      totalSent,
      totalReceived,
      totalPayments,
      totalTransactions: transactions.length,
      thisMonthCount: thisMonthTransactions.length,
      thisMonthAmount: thisMonthTransactions.reduce((sum, t) => 
        t.type === 'receive' ? sum + t.amount : sum - t.amount, 0
      )
    };
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.senderName?.toLowerCase().includes(searchLower) ||
          transaction.receiverName?.toLowerCase().includes(searchLower) ||
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.senderAccountNumber?.includes(searchTerm) ||
          transaction.receiverAccountNumber?.includes(searchTerm)
        );
      });
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(t => new Date(t.createdAt) >= startDate);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'name':
          aValue = (a.senderName || a.receiverName || '').toLowerCase();
          bValue = (b.senderName || b.receiverName || '').toLowerCase();
          break;
        default: // date
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [transactions, searchTerm, selectedType, dateRange, sortBy, sortOrder]);

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

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Description', 'Amount', 'Balance Change'].join(','),
      ...filteredTransactions.map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.type,
        `"${t.description || 'N/A'}"`,
        t.amount,
        t.type === 'receive' ? `+${t.amount}` : `-${t.amount}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading your transactions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600">View and manage all your transactions</p>
          </div>
          <button
            onClick={fetchTransactions}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sent</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(transactionStats.totalSent)}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Received</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(transactionStats.totalReceived)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-xl font-bold text-blue-600">
                  {transactionStats.thisMonthCount}
                </p>
                <p className="text-xs text-gray-500">transactions</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                <p className="text-xl font-bold text-gray-900">
                  {transactionStats.totalTransactions}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">All Types</option>
                <option value="send">Sent</option>
                <option value="receive">Received</option>
                <option value="payment">Payments</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last 3 Months</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
              >
                <Filter className="w-4 h-4" />
                More
              </button>

              <button
                onClick={exportTransactions}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="name">Name</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {sortOrder === 'asc' ? (
                      <SortAsc className="w-4 h-4 text-gray-600" />
                    ) : (
                      <SortDesc className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
          {(searchTerm || selectedType !== 'all' || dateRange !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setDateRange('all');
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedType !== 'all' || dateRange !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'You haven\'t made any transactions yet'
                }
              </p>
              {!searchTerm && selectedType === 'all' && dateRange === 'all' && (
                <button
                  onClick={() => window.location.href = '/transfer'}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Make Your First Transfer
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => {
                const { displayName, accountNumber, prefix, config } = getTransactionDisplayData(transaction);
                
                return (
                  <div 
                    key={transaction._id} 
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Transaction Type Icon */}
                        <div className={`w-12 h-12 rounded-full ${config.bgColor} ${config.borderColor} border flex items-center justify-center flex-shrink-0`}>
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
                              <span className="font-mono">Account: {accountNumber} • </span>
                            )}
                            <span>{formatDateTime(transaction.createdAt)}</span>
                          </div>
                          {transaction.description && transaction.description !== 'Money transfer' && (
                            <p className="text-sm text-gray-400 mt-1 truncate">{transaction.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Amount and Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-bold text-lg ${config.color}`}>
                            {transaction.type === 'send' ? '' : '+'}
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className={`w-16 h-16 rounded-full ${getTransactionTypeConfig(selectedTransaction.type).bgColor} border-2 ${getTransactionTypeConfig(selectedTransaction.type).borderColor} flex items-center justify-center`}>
                    {selectedTransaction.type === 'send' && <ArrowUpRight className={`w-8 h-8 ${getTransactionTypeConfig(selectedTransaction.type).color}`} />}
                    {selectedTransaction.type === 'receive' && <ArrowDownLeft className={`w-8 h-8 ${getTransactionTypeConfig(selectedTransaction.type).color}`} />}
                    {selectedTransaction.type === 'payment' && <CreditCard className={`w-8 h-8 ${getTransactionTypeConfig(selectedTransaction.type).color}`} />}
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className={`text-3xl font-bold ${getTransactionTypeConfig(selectedTransaction.type).color}`}>
                    {selectedTransaction.type === 'send' ? '' : '+'}
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                  <p className="text-gray-500 mt-1">{formatDateTime(selectedTransaction.createdAt)}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-sm text-gray-900">{selectedTransaction._id}</span>
                  </div>
                  
                  {selectedTransaction.senderName && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">From</span>
                      <span className="text-gray-900">{selectedTransaction.senderName}</span>
                    </div>
                  )}
                  
                  {selectedTransaction.receiverName && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">To</span>
                      <span className="text-gray-900">{selectedTransaction.receiverName}</span>
                    </div>
                  )}
                  
                  {selectedTransaction.description && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Description</span>
                      <span className="text-gray-900">{selectedTransaction.description}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Status</span>
                    <span className="text-green-600 font-medium">Completed</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-6"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;