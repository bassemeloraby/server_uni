import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import HeaderSales from '../models/HeaderSales.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

// Sample header sales data from the image
const headerSalesData = [
  {
    StoreCode: 415,
    InvoiceNumber: '250324160415020001',
    Year: 2025,
    Month: 'Mar',
    Date: new Date('2025-03-24'),
    Time: '16:20',
    InvoiceType: 'Normal',
    CustomerName: '',
    ConsumerName: '',
    UserName: 'مهند العروي',
    TotalAmountAfterDiscount: 15.75,
  }
];

const seedHeaderSales = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Starting header sales seeding...'.cyan.bold);
    
    // Check for existing items and insert only new ones
    const insertedItems = [];
    const skippedItems = [];
    
    for (const itemData of headerSalesData) {
      // Check if item with this InvoiceNumber already exists
      const existingItem = await HeaderSales.findOne({ InvoiceNumber: itemData.InvoiceNumber });
      
      if (existingItem) {
        skippedItems.push(itemData);
        console.log(`Skipped: Header sale with Invoice Number ${itemData.InvoiceNumber} already exists`.yellow);
      } else {
        const newItem = await HeaderSales.create(itemData);
        insertedItems.push(newItem);
        console.log(`Inserted: Header sale ${newItem.InvoiceNumber} (Store Code: ${newItem.StoreCode})`.green);
      }
    }
    
    console.log(`\nSeeding completed!`.cyan.bold);
    console.log(`Successfully inserted: ${insertedItems.length} items`.green);
    console.log(`Skipped (already exist): ${skippedItems.length} items`.yellow);
    
    // Display summary
    if (insertedItems.length > 0) {
      console.log('\nInserted Items:'.cyan.bold);
      insertedItems.forEach((item, index) => {
        console.log(`${index + 1}. Invoice ${item.InvoiceNumber} - Store: ${item.StoreCode} - Amount: ${item.TotalAmountAfterDiscount} - User: ${item.UserName}`.green);
      });
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed'.cyan);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding header sales:'.red.bold, error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
seedHeaderSales();

