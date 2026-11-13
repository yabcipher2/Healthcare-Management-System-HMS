const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/mesra_hms';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected\n');
    
    // Find all admin users
    const admins = await mongoose.connection.db.collection('staffs')
      .find({ role: 'Administrator' })
      .toArray();
    
    console.log(`📋 Found ${admins.length} Administrator account(s):\n`);
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name || 'N/A'}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Has Password: ${admin.password ? '✅ Yes' : '❌ No'}`);
      console.log(`   Dept: ${admin.dept || 'N/A'}`);
      console.log('');
    });
    
    // Also check for any user with 'admin' in email
    console.log('\n📧 Checking for emails with "admin":\n');
    const adminEmails = await mongoose.connection.db.collection('staffs')
      .find({ email: /admin/i })
      .toArray();
    
    adminEmails.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'N/A'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Has Password: ${user.password ? '✅ Yes' : '❌ No'}`);
      console.log('');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
