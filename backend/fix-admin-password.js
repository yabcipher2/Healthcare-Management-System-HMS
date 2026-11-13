const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/mesra_hms';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected\n');
    
    // First, let's see what admin has
    const admin = await mongoose.connection.db.collection('staffs').findOne({ email: 'admin@mesra.com' });
    console.log('📧 Admin user found:', admin ? 'Yes' : 'No');
    if (admin) {
      console.log('   Name:', admin.name);
      console.log('   Email:', admin.email);
      console.log('   Has password:', !!admin.password);
    }
    
    // Hash password "admin123"
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update admin
    const result = await mongoose.connection.db.collection('staffs').updateOne(
      { email: 'admin@mesra.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('\n✅ Admin password updated to: admin123');
    console.log('📊 Result:', result);
    console.log('\n🔑 Login with:');
    console.log('   Email: admin@mesra.com');
    console.log('   Password: admin123\n');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
