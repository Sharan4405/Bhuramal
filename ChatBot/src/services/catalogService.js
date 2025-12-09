import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your Excel file - adjust this to match your file location
const EXCEL_FILE_PATH = path.join(__dirname, '../../data/Catalog.xlsx');

let catalogData = null;

/**
 * Load and parse Excel file
 * Expected Excel structure:
 * Column A: CATEGORY
 * Column B: ITEM
 * Column C: WEIGHT
 * Column D: UNIT
 * Column E: PRICE
 */
function loadCatalog() {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0]; // First sheet
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Debug first row
    if (jsonData.length > 0) {
      console.log('First row columns:', Object.keys(jsonData[0]));
      console.log('Sample row data:', jsonData[0]);
    }

    // Organize data by category
    const organized = {};
    
    for (const row of jsonData) {
      // Handle exact column names matching your Excel structure
      const category = row.CATEGORY || '';
      const itemName = row.ITEM || '';
      const weight = row.WEIGHT || '';
      const unit = row.UNIT || '';
      const price = row.PRICE || '';

      // Debug price extraction for first few rows
      if (jsonData.indexOf(row) < 3) {
        console.log(`Row ${jsonData.indexOf(row) + 1} debug:`, {
          'Available keys': Object.keys(row),
          'row.PRICE': row.PRICE,
          'row["PRICE "]': row['PRICE '],
          'Final price': price
        });
      }

      // Skip rows with no item name
      if (!itemName || !itemName.trim()) continue;

      if (!organized[category]) {
        organized[category] = [];
      }

      organized[category].push({
        name: itemName.trim(),
        weight: weight,
        unit: unit,
        price: price
      });
    }

    catalogData = organized;
    console.log('✅ Catalog loaded successfully');
    console.log(`📦 Categories: ${Object.keys(catalogData).join(', ')}`);
    return true;
  } catch (error) {
    console.error('❌ Error loading catalog:', error.message);
    return false;
  }
}

/**
 * Get all categories
 */
function getCategories() {
  if (!catalogData) {
    loadCatalog();
  }
  return Object.keys(catalogData || {});
}

/**
 * Get items in a specific category
 */
function getItemsByCategory(category) {
  if (!catalogData) {
    loadCatalog();
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
function getCategoryByNumber(number) {
  const categories = getCategories();
  const index = parseInt(number) - 1;
  
  if (index >= 0 && index < categories.length) {
    return categories[index];
  }
  return null;
}



export {
  loadCatalog,
  getCategories,
  getItemsByCategory,
  getCategoryByNumber
};
