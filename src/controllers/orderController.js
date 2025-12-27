import Order from '../models/Order.js';
import { asyncHandler, successResponse, errorResponse, notFoundResponse, validationError } from '../utils/responseHandler.js';

// Helper to find order by _id or orderId
const findOrder = async (id) => {
  try {
    // Try to find by MongoDB _id first
    let order = await Order.findById(id);
    if (order) return order;
  } catch (error) {
    // If invalid ObjectId format, skip to orderId search
    console.log('Invalid ObjectId format, searching by orderId:', id);
  }
  
  // If not found by _id or invalid format, try orderId
  const order = await Order.findOne({ orderId: id });
  return order;
};

// Get all orders with search and filter
export const getAllOrders = asyncHandler(async (req, res) => {
    const { 
      search, 
      status, 
      paymentStatus, 
      startDate, 
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 50
    } = req.query;
    
    // Build query
    let query = {};
    
    // Search by orderId, customer name, or phone number
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = startDate;
      if (endDate) query.orderDate.$lte = endDate;
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);
    
    return successResponse(res, {
      count: orders.length,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / parseInt(limit)),
      data: orders
    });
});

// Get single order by ID or orderId
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await findOrder(id);
  
  if (!order) {
    return notFoundResponse(res, 'Order');
  }
  
  return successResponse(res, { data: order });
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Updating order status:', { id, status });
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return validationError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const order = await findOrder(id);
    
    if (!order) {
      console.log('Order not found:', id);
      return notFoundResponse(res, 'Order');
    }
    
    console.log('Found order:', order.orderId);
    order.status = status;
    await order.save();
    
    console.log('Order status updated successfully');
    return successResponse(res, { data: order }, `Order status updated to ${status}`);
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error; // Let asyncHandler handle it
  }
});

// Update full order
export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Prevent updating certain fields
  delete updates._id;
  delete updates.orderId;
  delete updates.createdAt;
  
  const order = await findOrder(id);
  
  if (!order) {
    return notFoundResponse(res, 'Order');
  }
  
  // Update fields
  Object.assign(order, updates);
  await order.save();
  
  return successResponse(res, { data: order }, 'Order updated successfully');
});

// Delete order (soft delete - mark as cancelled)
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permanent } = req.query;
  
  const order = await findOrder(id);
  
  if (!order) {
    return notFoundResponse(res, 'Order');
  }
  
  if (permanent === 'true') {
    // Permanent delete
    await Order.findByIdAndDelete(order._id);
    return successResponse(res, {}, 'Order permanently deleted');
  } else {
    // Soft delete - mark as cancelled
    order.status = 'cancelled';
    await order.save();
    return successResponse(res, { data: order }, 'Order cancelled');
  }
});

// Get order statistics
export const getOrderStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateFilter = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;
  }
  
  const query = dateFilter.$gte || dateFilter.$lte ? { orderDate: dateFilter } : {};
  
  const [
    totalOrders,
    statusCounts,
    paymentCounts,
    totalRevenue
  ] = await Promise.all([
    Order.countDocuments(query),
    Order.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: query },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { ...query, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);
  
  return successResponse(res, {
    data: {
      totalOrders,
      statusCounts: statusCounts.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {}),
      paymentCounts: paymentCounts.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {}),
      totalRevenue: totalRevenue[0]?.total || 0
    }
  });
});
