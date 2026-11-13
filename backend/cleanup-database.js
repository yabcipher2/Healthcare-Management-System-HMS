const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/mesra_hms';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected\n');
    
    // Find documents with null staffId
    const nullStaffIds = await mongoose.connection.db.collection('staffs')
      .find({ staffId: null })
      .toArray();
    
    console.log(`📊 Found ${nullStaffIds.length} documents with null staffId\n`);
    
    // Update each one with a unique staffId
    for (let i = 0; i < nullStaffIds.length; i++) {
      const doc = nullStaffIds[i];
      const timestamp = Date.now() + i;
      const random = Math.random().toString(36).substr(2, 9);
      
      const updates = {};
      if (!doc.staffId) updates.staffId = `STAFF-${timestamp}-${random}`;
      if (!doc.id) updates.id = `ID-${timestamp}-${random}`;
      if (!doc.profileId) updates.profileId = `PROFILE-${timestamp}-${random}`;
      if (!doc.nationalId) updates.nationalId = `NID-${timestamp}`;
      if (!doc.certificationNo) updates.certificationNo = `CERT-${timestamp}`;
      
      await mongoose.connection.db.collection('staffs').updateOne(
        { _id: doc._id },
        { $set: updates }
      );
      
      console.log(`✅ Fixed: ${doc.email || doc.name || 'Unknown'}`);
    }
    
    console.log(`\n🎉 Fixed ${nullStaffIds.length} documents!\n`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
