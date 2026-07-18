import Product from '../models/Product.js';

let catalogData = null;
let lastLoadTime = null;
const CACHE_DURATION = 1 * 60 * 1000; // Cache for 1 minute

/**
 * Load catalog from MongoDB
 * Caches data for 5 minutes to reduce database queries
 */
async function loadCatalog() {
  try {
    // Return cached data if still valid
    if (catalogData && lastLoadTime && (Date.now() - lastLoadTime < CACHE_DURATION)) {
      return true;
    }

    // Fetch all products from database
    const products = await Product.find({ inStock: true }).sort({ category: 1, name: 1 });

    // Organize data by category (same structure as before)
    const organized = {};
    
    for (const product of products) {
      const category = product.category;

      if (!organized[category]) {
        organized[category] = [];
      }

      organized[category].push({
        name: product.name,
        weight: product.weight,
        unit: product.unit,
        price: product.price
      });
    }

    catalogData = organized;
    lastLoadTime = Date.now();
    
    return true;
  } catch (error) {
    console.error('❌ Error loading catalog from MongoDB:', error.message);
    return false;
  }
}

/**
 * Get all categories
 */
async function getCategories() {
  if (!catalogData) {
    await loadCatalog();
  }
  return Object.keys(catalogData || {});
}

/**
 * Get items in a specific category
 */
async function getItemsByCategory(category) {
  if (!catalogData) {
    await loadCatalog();
  }
  
  // Case-insensitive search
  const categoryKey = Object.keys(catalogData || {}).find(
    key => key.toLowerCase() === category.toLowerCase()
  );
  
  return catalogData?.[categoryKey] || [];
}

/**
 * Search for a category by number (e.g., user types "1" for first category)
 */
async function getCategoryByNumber(number) {
  const categories = await getCategories();
  const index = parseInt(number) - 1;
  
  if (index >= 0 && index < categories.length) {
    return categories[index];
  }
  return null;
}

/**
 * Force reload catalog (clears cache)
 * Use this after updating products in MongoDB
 */
async function refreshCatalog() {
  catalogData = null;
  lastLoadTime = null;
  await loadCatalog();
  return true;
}

export {
  loadCatalog,
  getCategories,
  getItemsByCategory,
  getCategoryByNumber,
  refreshCatalog
};
