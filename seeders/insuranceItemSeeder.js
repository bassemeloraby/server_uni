import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import InsuranceItem from '../models/InsuranceItem.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

// Sample insurance items data
const insuranceItemsData = [
  {
    Category: "Blood Pressure",
    SAP_Code: 207294,
    description: "MICROLIFE BLOOD PRESSURE B1 CLASSIC"
  }
];

const seedInsuranceItems = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Starting insurance items seeding...'.cyan.bold);
    
    // Check for existing items and insert only new ones
    const insertedItems = [];
    const skippedItems = [];
    
    for (const itemData of insuranceItemsData) {
      // Check if item with this SAP_Code already exists
      const existingItem = await InsuranceItem.findOne({ SAP_Code: itemData.SAP_Code });
      
      if (existingItem) {
        skippedItems.push(itemData);
        console.log(`Skipped: Item with SAP Code ${itemData.SAP_Code} already exists`.yellow);
      } else {
        const newItem = await InsuranceItem.create(itemData);
        insertedItems.push(newItem);
        console.log(`Inserted: ${newItem.description} (SAP Code: ${newItem.SAP_Code})`.green);
      }
    }
    
    console.log(`\nSeeding completed!`.cyan.bold);
    console.log(`Successfully inserted: ${insertedItems.length} items`.green);
    console.log(`Skipped (already exist): ${skippedItems.length} items`.yellow);
    
    // Display summary
    if (insertedItems.length > 0) {
      console.log('\nInserted Items:'.cyan.bold);
      insertedItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.description} (SAP Code: ${item.SAP_Code}, Category: ${item.Category})`.green);
      });
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed'.cyan);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding insurance items:'.red.bold, error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
seedInsuranceItems();





