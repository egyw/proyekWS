const mongoose = require("mongoose");
const { seedData } = require("./src/Seeder/Seeder2");
require("dotenv").config();

const runSeeder = async () => {
  try {
    // Koneksi ke database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Jalankan seeder
    await seedData();

    // Tutup koneksi
    await mongoose.connection.close();
    console.log("Seeding completed and connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

runSeeder();
