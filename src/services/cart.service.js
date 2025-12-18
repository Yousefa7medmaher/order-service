import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const getCart = async (token) => {
  try {
    const response = await axios.get(
      `${process.env.CART_SERVICE_URL}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.cart;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get cart');
  }
};

export const clearCart = async (token) => {
  try {
    const response = await axios.delete(
      `${process.env.CART_SERVICE_URL}/clear`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to clear cart');
  }
};