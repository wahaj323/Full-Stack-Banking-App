// Add this at the top of your server.js
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-connection-string';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Adjust this to your frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  cnic: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  password: { type: String, required: true },
  accountNumber: { type: String, required: true, unique: true },
  balance: { type: Number, default: 500 }, // ₨500 bonus
  createdAt: { type: Date, default: Date.now }
});

// Card Schema
const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cardNumber: { type: String, required: true, unique: true },
  csv: { type: String, required: true },
  expiryDate: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String, default: 'Bank' },
  receiverName: { type: String },
  senderAccountNumber: { type: String },
  receiverAccountNumber: { type: String },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['send', 'receive', 'payment'], required: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Card = mongoose.model('Card', cardSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// Helper Functions
const generateAccountNumber = () => {
  return Math.random().toString().substr(2, 12);
};

const generateCardNumber = () => {
  const randomDigits = Math.random().toString().substr(2, 12);
  return `4016${randomDigits}`;
};

const generateCSV = () => {
  return Math.random().toString().substr(2, 3);
};

const generateExpiryDate = () => {
  const now = new Date();
  const futureDate = new Date(now.getFullYear() + 5, now.getMonth());
  return `${String(futureDate.getMonth() + 1).padStart(2, '0')}/${String(futureDate.getFullYear()).substr(-2)}`;
};

// Authentication Middleware - Updated to check both cookies and headers
const authenticateToken = (req, res, next) => {
  // Check for token in cookies first, then in authorization header
  let token = req.cookies.token;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to set cookie
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    sameSite: 'lax', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Routes

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, cnic, phone, email, address, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { cnic }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or CNIC' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const accountNumber = generateAccountNumber();
    const user = new User({
      fullName,
      cnic,
      phone,
      email,
      address,
      password: hashedPassword,
      accountNumber,
      balance: 500 // ₨500 bonus
    });

    await user.save();

    // Create virtual debit card
    const card = new Card({
      userId: user._id,
      cardNumber: generateCardNumber(),
      csv: generateCSV(),
      expiryDate: generateExpiryDate()
    });

    await card.save();

    // Create initial transaction (bonus credit)
    const transaction = new Transaction({
      receiverId: user._id,
      receiverName: user.fullName,
      receiverAccountNumber: user.accountNumber,
      senderAccountNumber: 'BANK-0000',
      senderName: 'Bank',
      amount: 500,
      type: 'receive',
      description: 'Welcome bonus'
    });

    await transaction.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        cnic: user.cnic,
        phone: user.phone,
        address: user.address,
        accountNumber: user.accountNumber,
        balance: user.balance,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    setTokenCookie(res, token);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        cnic: user.cnic,
        phone: user.phone,
        address: user.address,
        accountNumber: user.accountNumber,
        balance: user.balance,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check Authentication Status
app.get('/api/auth/check', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      isAuthenticated: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        cnic: user.cnic,
        phone: user.phone,
        address: user.address,
        accountNumber: user.accountNumber,
        balance: user.balance,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout - Fixed to properly clear cookies
app.post('/api/auth/logout', (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    res.json({ 
      message: 'Logout successful',
      success: true 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update User Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { fullName, phone, address },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Card
app.get('/api/card', authenticateToken, async (req, res) => {
  try {
    const card = await Card.findOne({ userId: req.user.userId });
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ card });
  } catch (error) {
    console.error('Card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/getreceiver', authenticateToken, async (req, res) => {
  const { accountNumber } = req.body;
  const receiver = await User.findOne({ accountNumber});
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver account not found' });
    }
    res.json({
      name: receiver.fullName,
      email: receiver.email,
    })

})

// Send Money
app.post('/api/transfer', authenticateToken, async (req, res) => {
  try {
    const { receiverAccountNumber, amount, description } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Find sender
    const sender = await User.findById(req.user.userId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Check balance
    if (sender.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Find receiver
    const receiver = await User.findOne({ accountNumber: receiverAccountNumber });
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver account not found' });
    }

    if (sender.accountNumber === receiverAccountNumber) {
      return res.status(400).json({ error: 'Cannot transfer to same account' });
    }

    // Update balances
    sender.balance = Number(sender.balance) - Number(amount);
    receiver.balance = Number(receiver.balance) + Number(amount);

    await sender.save();
    await receiver.save();

    // Create transactions
    const sendTransaction = new Transaction({
      senderId: sender._id,
      receiverId: receiver._id,
      senderName: sender.fullName,
      senderAccountNumber: sender.accountNumber,
      receiverAccountNumber: receiver.accountNumber,
      receiverName: receiver.fullName,
      amount: amount * -1,
      type: 'send',
      description: description || 'Money transfer'
    });

    const receiveTransaction = new Transaction({
      senderId: sender._id,
      receiverId: receiver._id,
      senderName: sender.fullName,
      senderAccountNumber: sender.accountNumber,
      receiverAccountNumber: receiver.accountNumber,
      receiverName: receiver.fullName,
      amount,
      type: 'receive',
      description: description || 'Money transfer'
    });

    await sendTransaction.save();
    await receiveTransaction.save();

    res.json({
      message: 'Transfer successful',
      newBalance: sender.balance,
      transaction: sendTransaction
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { senderId: req.user.userId, amount: {$lt: 0} },
        { receiverId: req.user.userId, amount: {$gt: 0} }
      ]
    }).sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public Payment API for E-commerce
app.post('/api/payments', async (req, res) => {
  try {
    const { cardNumber, csv, expiry, amount } = req.body;

    if (!cardNumber || !csv || !expiry || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Find card
    const card = await Card.findOne({ 
      cardNumber: cardNumber.replace(/\s/g, ''), 
      csv, 
      expiryDate: expiry,
      isActive: true 
    });

    if (!card) {
      return res.status(400).json({ error: 'Invalid Card Details' });
    }

    // Find user associated with card
    const user = await User.findById(card.userId);
    if (!user) {
      return res.status(400).json({ error: 'Invalid Card Details' });
    }

    // Check balance
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient Balance' });
    }

    // Deduct amount
    user.balance -= amount;
    await user.save();

    // Create payment transaction
    const transaction = new Transaction({
      senderId: user._id,
      senderName: user.fullName,
      receiverName: 'Merchant',
      amount,
      type: 'payment',
      description: 'Online payment'
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Payment successful',
      transactionId: transaction._id,
      remainingBalance: user.balance
    });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Current Balance
app.get('/api/balance', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ balance: user.balance });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change Password
app.put('/api/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Banking API is running' });
});

if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;