import api from './axios';

const couponService = {
  // Get all coupons (admin)
  getCoupons: async () => {
    const response = await api.get('/coupons');
    return response.data;
  },
  
  // Get specific coupon details (admin)
  getCoupon: async (id) => {
    const response = await api.get(`/coupons/${id}`);
    return response.data;
  },
  
  // Create a new coupon (admin)
  createCoupon: async (couponData) => {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },
  
  // Update a coupon (admin)
  updateCoupon: async (id, couponData) => {
    const response = await api.put(`/coupons/${id}`, couponData);
    return response.data;
  },
  
  // Delete a coupon (admin)
  deleteCoupon: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  }
};

export default couponService;