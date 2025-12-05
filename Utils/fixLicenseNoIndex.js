/**
 * Fix licenseNo Index - Drop and recreate as sparse
 * 
 * Run this script once to fix the duplicate key error for licenseNo
 * 
 * Usage: node Utils/fixLicenseNoIndex.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function fixLicenseNoIndex() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_DB_URL || process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error("❌ MongoDB URL not found in environment variables (MONGO_DB_URL, MONGO_URI, or MONGODB_URI)");
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const collection = db.collection("ragisterusers");

        // Check existing indexes
        const indexes = await collection.indexes();
        console.log("\n📋 Current indexes:", indexes.map(idx => idx.name));

        // Drop existing licenseNo_1 index if it exists
        try {
            await collection.dropIndex("licenseNo_1");
            console.log("✅ Dropped existing licenseNo_1 index");
        } catch (error) {
            if (error.code === 27 || error.codeName === 'IndexNotFound') {
                console.log("ℹ️  licenseNo_1 index doesn't exist, skipping drop");
            } else {
                throw error;
            }
        }

        // Create new sparse unique index
        await collection.createIndex(
            { licenseNo: 1 },
            { 
                unique: true, 
                sparse: true,
                name: "licenseNo_1"
            }
        );
        console.log("✅ Created new sparse unique index on licenseNo");

        // Verify the new index
        const newIndexes = await collection.indexes();
        const licenseNoIndex = newIndexes.find(idx => idx.name === "licenseNo_1");
        console.log("\n✅ New licenseNo index:", JSON.stringify(licenseNoIndex, null, 2));

        console.log("\n🎉 Index fix completed successfully!");
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error("❌ Error fixing index:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the fix
fixLicenseNoIndex();

