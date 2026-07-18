/**
 * Price Calculator Utility
 * Handles dynamic price calculation based on product weight and selected quantity
 */

/**
 * Convert weight to grams for standardization
 * @param {number|string} weight - Weight value
 * @param {string} unit - Unit (gm, kg, g, grams, etc.)
 * @returns {number} Weight in grams
 */
export function convertToGrams(weight, unit) {
  const weightNum = parseFloat(weight);
  const unitLower = unit.toLowerCase().trim();
  
  // Handle different unit formats
  if (unitLower === 'kg' || unitLower === 'kilogram' || unitLower === 'kilograms') {
    return weightNum * 1000;
  } else if (unitLower === 'gm' || unitLower === 'g' || unitLower === 'gram' || unitLower === 'grams') {
    return weightNum;
  }
  
  // Default to grams
  return weightNum;
}

/**
 * Calculate price based on selected quantity
 * @param {object} product - Product object with weight, unit, and price
 * @param {number} requestedQuantityInGrams - Quantity user wants in grams
 * @returns {number} Calculated price
 */
export function calculatePrice(product, requestedQuantityInGrams) {
  // Convert product base weight to grams
  const baseWeightInGrams = convertToGrams(product.weight, product.unit);
  const basePrice = parseFloat(product.price);
  
  // Calculate price per gram
  const pricePerGram = basePrice / baseWeightInGrams;
  
  // Calculate total price for requested quantity
  const totalPrice = pricePerGram * requestedQuantityInGrams;
  
  return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Get price per unit (for display purposes)
 * @param {object} product - Product object
 * @returns {object} Price breakdown
 */
export function getPriceBreakdown(product) {
  const baseWeightInGrams = convertToGrams(product.weight, product.unit);
  const basePrice = parseFloat(product.price);
  const pricePerGram = basePrice / baseWeightInGrams;
  
  return {
    baseWeight: baseWeightInGrams,
    basePrice: basePrice,
    pricePerGram: Math.round(pricePerGram * 100) / 100,
    pricePerKg: Math.round(pricePerGram * 1000 * 100) / 100
  };
}
