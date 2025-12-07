import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import Contest from '../models/Contest.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

// Sample contest data
const contestData = [
  {
    Company: 'Sanofi_Consumer',
    SAP_Code: 100498,
    'WH Description': 'Bronchicare Ivy ',
    'Total Incentive': 11, // 11% stored as number
    Category: 'Cough Medications',
    Price: 45.75,
    Incentive: 5.0325
  }
];

const seedContests = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Starting contest seeding...'.cyan.bold);
    
    // Check for existing items and insert only new ones
    const insertedItems = [];
    const skippedItems = [];
    
    for (const itemData of contestData) {
      // Check if item with this SAP_Code already exists
      const existingItem = await Contest.findOne({ SAP_Code: itemData.SAP_Code });
      
      if (existingItem) {
        skippedItems.push(itemData);
        console.log(`Skipped: Contest with SAP Code ${itemData.SAP_Code} already exists`.yellow);
      } else {
        const newItem = await Contest.create(itemData);
        insertedItems.push(newItem);
        console.log(`Inserted: ${newItem['WH Description']} (SAP Code: ${newItem.SAP_Code})`.green);
      }
    }
    
    console.log(`\nSeeding completed!`.cyan.bold);
    console.log(`Successfully inserted: ${insertedItems.length} items`.green);
    console.log(`Skipped (already exist): ${skippedItems.length} items`.yellow);
    
    // Display summary
    if (insertedItems.length > 0) {
      console.log('\nInserted Items:'.cyan.bold);
      insertedItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item['WH Description']} (SAP Code: ${item.SAP_Code})`.green);
      });
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed'.cyan);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding contests:'.red.bold, error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
seedContests();
