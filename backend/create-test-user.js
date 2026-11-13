const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/mesra_hms';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    
    // Create test user
    const testUser = {
      staffId: `TEST-${Date.now()}`,
      id: `ID-TEST-${Date.now()}`,
      name: 'Test Doctor',
      email: 'test@doctor.com',
      password: hashedPassword,
      role: 'Doctor',
      dept: 'General Medicine',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await mongoose.connection.db.collection('staffs').updateOne(
      { email: 'test@doctor.com' },
      { $set: testUser },
      { upsert: true }
    );
    
    console.log('✅ Test user created/updated:');
    console.log('   Email: test@doctor.com');
    console.log('   Password: test123');
    console.log('   Role: Doctor');
    console.log('📊 Result:', result);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
