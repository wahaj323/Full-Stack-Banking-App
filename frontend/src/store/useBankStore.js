import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

export const useBankStore = create((set, get) => ({
  balance: 0,
  transactions: [],
  recentTransactions: [],
  card: null,
  isLoading: false,
  isTransferring: false,
  error: null,

  fetchBalance: async () => {
    try {
      set({ isLoading: true, error: null });

      const res = await axiosInstance.get('/balance');
      set({ balance: res.data.balance, isLoading: false });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch balance';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchTransactions: async () => {
    try {
      set({ isLoading: true, error: null });

      const res = await axiosInstance.get('/transactions');
      const transactions = res.data.transactions || [];
      const recentTransactions = transactions.slice(0, 7);

      set({ transactions, recentTransactions, isLoading: false });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch transactions';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchCard: async () => {
    try {
      set({ isLoading: true, error: null });

      const res = await axiosInstance.get('/card');
      set({ card: res.data.card, isLoading: false });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch card';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  transfer: async (transferData) => {
    try {
      set({ isTransferring: true, error: null });

      const res = await axiosInstance.post('/transfer', transferData);
      set({ balance: res.data.newBalance, isTransferring: false });

      await get().fetchTransactions();

      toast.success('Transfer successful!');
      return res.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Transfer failed';
      set({ error: message, isTransferring: false });
      toast.error(message);
      throw error;
    }
  },

  getReceiver: async (accountNumber) => {
    const res = await axiosInstance.post('/getreceiver', { accountNumber });
    return res.data;
  },

  getTransactionTypeConfig: (type) => {
    const configs = {
      send: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '↗',
        label: 'Sent'
      },
      receive: {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: '↙',
        label: 'Received'
      },
      payment: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: '💳',
        label: 'Payment'
      }
    };
    return configs[type] || configs.payment;
  },

  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  formatDateTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-PK', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  },

  initializeBankData: async () => {
    try {
      set({ isLoading: true });
      await Promise.all([
        get().fetchBalance(),
        get().fetchTransactions(),
        get().fetchCard(),
      ]);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Initialization error:', error);
    }
  },

  clearBankData: () => {
    set({
      balance: 0,
      transactions: [],
      recentTransactions: [],
      card: null,
      isLoading: false,
      isTransferring: false,
      error: null,
    });
  }
}));
