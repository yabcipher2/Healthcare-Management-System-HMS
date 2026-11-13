const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/mesra_hms';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected\n');
    
    // Hash default password "password123"
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Update ALL users
    const result = await mongoose.connection.db.collection('staffs').updateMany(
      {},
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ All user passwords updated to: password123');
    console.log('📊 Updated', result.modifiedCount, 'users');
    console.log('\n🔑 Login with ANY email and password: password123\n');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
