import Product from '../models/Product.js';
import { refreshCatalog } from '../services/catalogService.js';
import { asyncHandler, successResponse, errorResponse, notFoundResponse, validationError } from '../utils/responseHandler.js';

// Get all products with search and filter
export const getAllProducts = asyncHandler(async (req, res) => {
  const { search, category, inStock, sortBy = 'createdAt', order = 'desc' } = req.query;
  
  // Build query
  let query = {};
  
  // Text search on name and category
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Filter by category
  if (category) {
    query.category = category;
  }
  
  // Filter by stock status
  if (inStock !== undefined) {
    query.inStock = inStock === 'true';
  }
  
  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = order === 'asc' ? 1 : -1;
  
  const products = await Product.find(query).sort(sortOptions);
  
  return successResponse(res, { count: products.length, data: products });
});

// Create new product
export const createProduct = asyncHandler(async (req, res) => {
  const { category, name, weight, unit, price, inStock, description } = req.body;
  
  // Validation
  if (!category || !name || !weight || !unit || price === undefined) {
    return validationError(res, 'Missing required fields: category, name, weight, unit, price');
  }
  
  const product = new Product({
    category,
    name,
    weight,
    unit,
    price,
    inStock: inStock !== undefined ? inStock : true,
    description
  });
  
  await product.save();
  await refreshCatalog();
  
  return successResponse(res, { data: product }, 'Product created successfully', 201);
});

// Update product
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Prevent updating _id or timestamps
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;
  
  const product = await Product.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );
  
  if (!product) {
    return notFoundResponse(res, 'Product');
  }
  
  await refreshCatalog();
  
  return successResponse(res, { data: product }, 'Product updated successfully');
});

// Delete product
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findByIdAndDelete(id);
  
  if (!product) {
    return notFoundResponse(res, 'Product');
  }
  
  await refreshCatalog();
  
  return successResponse(res, { data: product }, 'Product deleted successfully');
});

// Get all unique categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  
  return successResponse(res, { data: categories });
});

// Bulk update stock status
export const bulkUpdateStock = asyncHandler(async (req, res) => {
  const { productIds, inStock } = req.body;
  
  if (!productIds || !Array.isArray(productIds) || inStock === undefined) {
    return validationError(res, 'Invalid request: productIds array and inStock boolean required');
  }
  
  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: { inStock } }
  );
  
  await refreshCatalog();
  
  return successResponse(res, { data: result }, `Updated ${result.modifiedCount} products`);
});
