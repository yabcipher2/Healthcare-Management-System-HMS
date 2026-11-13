const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGO_URI = 'mongodb://localhost:27017/mesra_hms';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('2021', salt);
    
    // Update user directly
    const result = await mongoose.connection.db.collection('staffs').updateOne(
      { email: 'hana@gmail.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Password updated for hana@gmail.com');
    console.log('📊 Result:', result);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
