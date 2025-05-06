import api from './axios';

const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  // Get user's orders
  getMyOrders: async () => {
    const response = await api.get('/orders/myorders');
    return response.data;
  },
  
  // Get order details
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
  
  // Update payment status
  updateOrderToPaid: async (orderId, paymentResult) => {
    const response = await api.put(`/orders/${orderId}/pay`, paymentResult);
    return response.data;
  },
  
  // Admin functions
  // Get all orders
  getOrders: async (params) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  
  // Update order status
  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },
  
  // Delete order
  deleteOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },
  
  // Get order statistics for dashboard
  getOrderStats: async () => {
    try {
      const ordersResponse = await api.get('/orders', { params: { limit: 5 } });
      
      // Calculate totals from the available orders
      const orders = ordersResponse.data?.data || [];
      let totalRevenue = 0;
      
      orders.forEach(order => {
        if (order.status !== 'cancelled' && order.totalPrice) {
          totalRevenue += order.totalPrice;
        }
      });
      
      return {
        totalOrders: ordersResponse.data?.pagination?.total || orders.length,
        totalRevenue,
        recentOrders: orders
      };
    } catch (error) {
      console.error("Error fetching order stats:", error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        recentOrders: []
      };
    }
  }
};

export default orderService;