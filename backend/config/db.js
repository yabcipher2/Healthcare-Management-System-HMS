const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mesra_hms";
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Refused: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
