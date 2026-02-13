// src/server.js
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3004;

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
