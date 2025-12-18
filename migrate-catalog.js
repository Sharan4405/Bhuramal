import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_FILE_PATH = path.join(__dirname, 'data/Catalog.xlsx');

async function migrateExcelToMongoDB() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in .env file');
    }
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      dbName: 'chatbot'
    });
    console.log('✅ Connected to MongoDB');

    // Read Excel file
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${jsonData.length} rows in Excel`);

    // Clear existing products (optional - remove if you want to keep existing data)
    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});

    // Prepare products for insertion
    const products = [];
    
    for (const row of jsonData) {
      const category = row.CATEGORY || '';
      const itemName = row.ITEM || '';
      const weight = row.WEIGHT || '';
      const unit = row.UNIT || '';
      const price = row.PRICE || '';

      // Skip rows with no item name
      if (!itemName || !itemName.trim()) {
        continue;
      }

      // Convert price to number
      const priceNum = typeof price === 'number' ? price : parseFloat(price) || 0;

      products.push({
        category: category.trim(),
        name: itemName.trim(),
        weight: weight,
        unit: unit.trim() || 'gm',
        price: priceNum,
        inStock: true
      });
    }

    // Bulk insert products
    console.log(`📦 Inserting ${products.length} products into MongoDB...`);
    const result = await Product.insertMany(products);
    
    console.log(`✅ Successfully migrated ${result.length} products!`);
    
    // Show summary by category
    const categories = await Product.distinct('category');
    console.log('\n📋 Categories migrated:');
    for (const category of categories) {
      const count = await Product.countDocuments({ category });
      console.log(`   - ${category}: ${count} items`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateExcelToMongoDB();
