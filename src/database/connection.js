const mongoose = require('mongoose');
const config = require('../config/config');


const connectDB = async () => {
  try{
    const mongoURI = config.mongoURI;
    if (!mongoURI) {
      throw new Error("mongoDB URI adalah undifined. Pastikan Anda telah mengatur MONGO_URI di file .env!");
    }

    await mongoose.connect(mongoURI);

    console.log("MongoDB terkoneksi dengan baik!");
  } catch (error) {
    console.error("Koneksi MongoDB gagal: ", error);
  }
}

module.exports = connectDB;
