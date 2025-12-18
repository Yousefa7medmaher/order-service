import Order from '../models/order.model.js';
import { getCart, clearCart } from '../services/cart.service.js';
import { updateProductStock } from '../services/product.service.js';

export const createOrderFromCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const token = req.headers.authorization?.split(' ')[1];
    const { shippingAddress, paymentMethod, notes } = req.body;

    console.log('Creating order for user:', userId);

    // Get user's cart
    let cart;
    try {
      cart = await getCart(token);
      console.log('Cart retrieved:', cart);
    } catch (error) {
      console.error('Error getting cart:', error.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to retrieve cart: ' + error.message
      });
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart is empty' 
      });
    }

    // Prepare order items
    const orderItems = cart.items.map(item => ({
      productId: item.productId,
      productName: item.productName || 'Product',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }));

    console.log('Order items prepared:', orderItems);

    // Generate order number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;

    console.log('Generated order number:', orderNumber);

    // Create order
    const order = new Order({
      orderNumber,
      userId,
      userEmail: req.user.email,
      userName: req.user.name,
      items: orderItems,
      totalAmount: cart.totalAmount,
      totalItems: cart.totalItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'cash',
      notes
    });

    await order.save();
    console.log('Order saved:', order.orderNumber);

    // Update product stocks (optional - fire and forget)
    cart.items.forEach(item => {
      updateProductStock(item.productId, item.quantity, token)
        .catch(err => console.error('Stock update failed:', err.message));
    });

    // Clear cart after successful order
    try {
      await clearCart(token);
      console.log('Cart cleared successfully');
    } catch (error) {
      console.error('Failed to clear cart:', error.message);
      // Don't fail the order if cart clearing fails
    }

    res.status(201).json({ 
      success: true, 
      message: 'Order created successfully',
      order 
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({ 
      success: true,
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getOrderByNumber = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber, userId });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending orders can be cancelled' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      order 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Admin Controllers
export const getAllOrders = async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({ 
      success: true,
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    order.status = status;
    await order.save();

    res.json({ 
      success: true, 
      message: 'Order status updated successfully',
      order 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({ 
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        byStatus: stats
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

