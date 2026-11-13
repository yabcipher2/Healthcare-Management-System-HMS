const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, ...args) => console.log(color, ...args, colors.reset);

async function testConnection() {
  log(colors.cyan, '\n🔍 Testing MongoDB Atlas Connection...\n');
  
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!mongoUri) {
    log(colors.red, '❌ Error: MONGO_URI not found in environment variables');
    log(colors.yellow, '💡 Tip: Create a .env file with MONGO_URI=your-connection-string');
    process.exit(1);
  }

  // Mask credentials for display
  const safeUri = mongoUri.replace(/\/\/[^@/]*@/, '//<credentials>@').split('?')[0];
  log(colors.blue, '📍 Connection Target:', safeUri);

  try {
    log(colors.yellow, '\n⏳ Connecting to MongoDB Atlas...');
    
    const startTime = Date.now();
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
    });
    const duration = Date.now() - startTime;

    log(colors.green, '\n✅ Connection Successful!');
    log(colors.green, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(colors.cyan, '🏠 Host:', conn.connection.host);
    log(colors.cyan, '🗄️  Database:', conn.connection.name);
    log(colors.cyan, '📊 Connection State:', conn.connection.readyState === 1 ? 'Connected' : 'Unknown');
    log(colors.cyan, '⚡ Connection Time:', `${duration}ms`);
    log(colors.green, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Test database operations
    log(colors.yellow, '\n🔬 Testing Database Operations...');
    
    const collections = await conn.connection.db.listCollections().toArray();
    log(colors.cyan, `📚 Collections Found: ${collections.length}`);
    
    if (collections.length > 0) {
      log(colors.blue, '\nCollections:');
      collections.forEach(col => {
        log(colors.blue, `  • ${col.name}`);
      });
    }

    // Test a simple query
    const users = await mongoose.connection.db.collection('users').countDocuments();
    log(colors.cyan, `\n👥 Total Users: ${users}`);

    log(colors.green, '\n✅ All Database Tests Passed!\n');
    
    await mongoose.connection.close();
    log(colors.yellow, '🔌 Connection closed gracefully');
    
    process.exit(0);
  } catch (error) {
    log(colors.red, '\n❌ Connection Failed!');
    log(colors.red, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(colors.red, 'Error:', error.message);
    
    // Provide helpful hints
    if (error.message.includes('authentication failed')) {
      log(colors.yellow, '\n💡 Authentication Issue:');
      log(colors.yellow, '  • Check username and password in MONGO_URI');
      log(colors.yellow, '  • Ensure the database user exists in Atlas (Database Access)');
      log(colors.yellow, '  • URL-encode special characters in password');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      log(colors.yellow, '\n💡 IP Access Issue:');
      log(colors.yellow, '  • Add your IP to Network Access in MongoDB Atlas');
      log(colors.yellow, '  • For development, you can use 0.0.0.0/0 (not recommended for production)');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      log(colors.yellow, '\n💡 DNS/Hostname Issue:');
      log(colors.yellow, '  • Check the cluster hostname in your connection string');
      log(colors.yellow, '  • Copy the connection string from Atlas → Connect → Drivers');
    }
    
    log(colors.red, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(1);
  }
}

testConnection();
