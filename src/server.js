import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const MONGO_URI = process.env.MONGODB_URI ;

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); 
  }
}

app.get('/api/orders', (req, res) => {
  res.json({ success: true, orders: [] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Order Service', timestamp: new Date() });
});

app.get('/ready', (req, res) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    return res.status(200).json({ status: 'OK', service: 'Order Service ready' });
  }
  return res.status(503).json({ status: 'NOT_READY', service: 'Database not connected' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message });
});

async function startServer() {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Order Service running on port ${PORT}`);
  });
}

startServer();