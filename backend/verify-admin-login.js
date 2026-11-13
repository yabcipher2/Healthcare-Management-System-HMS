const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/mesra_hms';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected\n');
    
    // Get admin user
    const admin = await mongoose.connection.db.collection('staffs')
      .findOne({ email: 'admin@mesra.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }
    
    console.log('✅ Admin found:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Has password:', !!admin.password);
    
    // Test password comparison
    const testPassword = 'admin123';
    console.log('\n🔐 Testing password:', testPassword);
    
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    console.log('🔑 Password match result:', isMatch ? '✅ YES' : '❌ NO');
    
    if (!isMatch) {
      console.log('\n❌ Password does NOT match!');
      console.log('   The password in database does not match "admin123"');
      console.log('   Updating it now...\n');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await mongoose.connection.db.collection('staffs').updateOne(
        { email: 'admin@mesra.com' },
        { $set: { password: hashedPassword } }
      );
      
      console.log('✅ Password updated successfully!');
      console.log('   Try logging in again with admin123');
    } else {
      console.log('\n✅ Login credentials are correct!');
      console.log('   Email: admin@mesra.com');
      console.log('   Password: admin123');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
