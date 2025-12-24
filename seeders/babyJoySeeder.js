import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import BabyJoy from '../models/BabyJoy.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

// Baby Joy items data
const babyJoyItemsData = [
  {
    Material: 400769,
    SapDescription: "Baby Joy 20141 Wet Wipes Thick&Lar.12X40",
    Brand: "Baby Joy",
    Price: 23.00,
    MaterialDetail: "مناديل مبللة بيبي جوي 20141 سميكة وكبيرة",
    UnitsInCartoon: 12,
    NumberOfBacket: null,
    Form: "Wipes"
  },
  {
    Material: 400057,
    SapDescription: "Baby Joy 20151 Wet Wipes 18X50",
    Brand: "Baby Joy",
    Price: 16.10,
    MaterialDetail: "بيبي جوي 20051 مناديل 18x50",
    UnitsInCartoon: 18,
    QuantityInUnits: null,
    NumberOfBacket: null,
    Form: "Wipes"
  },
  {
    Material: 400058,
    SapDescription: "Baby Joy 20181A Wet Wipes W/Flip 80X12",
    Brand: "Baby Joy",
    Price: 20.00,
    MaterialDetail: "بيبي جوي 20181 مناديل مبللة  8",
    UnitsInCartoon: 12,
    NumberOfBacket: null,
    Form: "Wipes"
  }
];

const seedBabyJoyItems = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Starting baby joy items seeding...'.cyan.bold);
    
    // Check for existing items and insert only new ones
    const insertedItems = [];
    const skippedItems = [];
    
    for (const itemData of babyJoyItemsData) {
      // Check if item with this Material already exists
      const existingItem = await BabyJoy.findOne({ Material: itemData.Material });
      
      if (existingItem) {
        skippedItems.push(itemData);
        console.log(`Skipped: Item with Material ${itemData.Material} already exists`.yellow);
      } else {
        const newItem = await BabyJoy.create(itemData);
        insertedItems.push(newItem);
        console.log(`Inserted: ${newItem.SapDescription} (Material: ${newItem.Material})`.green);
      }
    }
    
    console.log(`\nSeeding completed!`.cyan.bold);
    console.log(`Successfully inserted: ${insertedItems.length} items`.green);
    console.log(`Skipped (already exist): ${skippedItems.length} items`.yellow);
    
    // Display summary
    if (insertedItems.length > 0) {
      console.log('\nInserted Items:'.cyan.bold);
      insertedItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.SapDescription} (Material: ${item.Material})`.green);
      });
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed'.cyan);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding baby joy items:'.red.bold, error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
seedBabyJoyItems();

