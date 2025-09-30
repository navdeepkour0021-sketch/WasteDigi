import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import wasteRoutes from './routes/waste.js';
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/users.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:5173',
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'WasteWise API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});