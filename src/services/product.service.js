import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const updateProductStock = async (productId, quantity, token) => {
  try {
    // Assume product service has endpoint to decrease stock
    const response = await axios.patch(
      `${process.env.PRODUCT_SERVICE_URL}/${productId}/stock`,
      { quantity: -quantity },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to update product stock:', error.message);
    // Continue even if stock update fails
  }
};