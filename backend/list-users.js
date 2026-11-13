const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/mesra_hms';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected\n');
    
    const users = await mongoose.connection.db.collection('staffs')
      .find({})
      .project({ name: 1, email: 1, role: 1, password: 1 })
      .toArray();
    
    console.log('📋 All Users in Database:\n');
    users.forEach((user, index) => {
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
