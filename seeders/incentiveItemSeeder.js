import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import IncentiveItem from '../models/IncentiveItem.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

// Sample incentive items data
const incentiveItemsData = [
  {
    Class: "S",
    SAP_Code: 100003,
    form: "TAB",
    form_category: "EFF",
    Description: "ACC LONG 600mg 10EFF TABS.",
    Division: "Pharma - OTC",
    Category: "Medicated OTC",
    "Sub category": "Cough Products",
    Price: 16.55,
    IncentivePercentage: 0.032,
    "incentive value": 0.5296
  }
];

const seedIncentiveItems = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Starting incentive items seeding...'.cyan.bold);
    
    // Check for existing items and insert only new ones
    const insertedItems = [];
    const skippedItems = [];
    
    for (const itemData of incentiveItemsData) {
      // Check if item with this SAP_Code already exists
      const existingItem = await IncentiveItem.findOne({ SAP_Code: itemData.SAP_Code });
      
      if (existingItem) {
        skippedItems.push(itemData);
        console.log(`Skipped: Item with SAP Code ${itemData.SAP_Code} already exists`.yellow);
      } else {
        // Calculate incentive value if not provided
        if (itemData.Price && itemData.IncentivePercentage && !itemData['incentive value']) {
          itemData['incentive value'] = itemData.Price * itemData.IncentivePercentage;
        }
        
        const newItem = await IncentiveItem.create(itemData);
        insertedItems.push(newItem);
        console.log(`Inserted: ${newItem.Description} (SAP Code: ${newItem.SAP_Code})`.green);
      }
    }
    
    console.log(`\nSeeding completed!`.cyan.bold);
    console.log(`Successfully inserted: ${insertedItems.length} items`.green);
    console.log(`Skipped (already exist): ${skippedItems.length} items`.yellow);
    
    // Display summary
    if (insertedItems.length > 0) {
      console.log('\nInserted Items:'.cyan.bold);
      insertedItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.Description} (SAP Code: ${item.SAP_Code})`.green);
      });
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed'.cyan);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding incentive items:'.red.bold, error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
seedIncentiveItems();
