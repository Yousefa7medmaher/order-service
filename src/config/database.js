import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let attempts = 0;
const maxAttempts = 5;

while (attempts < maxAttempts) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
    break;
  } catch (err) {
    attempts++;
    console.error(`MongoDB connection attempt ${attempts} failed`);
    await new Promise(res => setTimeout(res, 3000));
  }
}

if (attempts === maxAttempts) process.exit(1);