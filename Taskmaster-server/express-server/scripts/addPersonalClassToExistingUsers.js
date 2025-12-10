/**
 * Migration script to add "Personal" class to all existing users
 * Run this once to update existing users
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import Class from '../models/classModel.js';

dotenv.config();

async function addPersonalClassToExistingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB");

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if user already has a Personal class
      const existingPersonal = await Class.findOne({
        user: user._id,
        isPersonal: true
      });

      if (existingPersonal) {
        console.log(`User ${user.userName} already has Personal class`);
        skipped++;
        continue;
      }

      // Create Personal class for this user
      const personalClass = new Class({
        name: "Personal",
        professor: "",
        timing: "",
        location: "",
        topics: [],
        textbooks: [],
        gradingPolicy: "",
        contactInfo: "",
        user: user._id,
        isPersonal: true,
      });

      await personalClass.save();
      console.log(`Created Personal class for user ${user.userName}`);
      created++;
    }

    console.log(`\nSummary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${users.length}`);

    await mongoose.disconnect();
    console.log("\nMigration complete!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the migration
addPersonalClassToExistingUsers();

