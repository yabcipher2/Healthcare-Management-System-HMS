const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('\n❌ Missing MONGO_URI environment variable');
    console.error('Please add MONGO_URI to your .env file:\n');
    console.error('Option 1 (Cloud - Recommended):');
    console.error('  MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hms_digital');
    console.error('  Get free MongoDB Atlas at: https://www.mongodb.com/cloud/atlas\n');
    console.error('Option 2 (Local):');
    console.error('  MONGO_URI=mongodb://127.0.0.1:27017/hms_digital');
    console.error('  Install MongoDB Community: https://www.mongodb.com/try/download/community\n');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Database Engine Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Local MongoDB: Start MongoDB service or run: mongod');
    console.error('2. MongoDB Atlas: Check your connection string and IP whitelist');
    console.error('3. Network: Verify firewall allows connections to MongoDB port\n');
    process.exit(1);
  }
};

module.exports = connectDB;