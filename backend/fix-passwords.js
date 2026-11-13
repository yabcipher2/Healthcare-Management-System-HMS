const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  dept: String,
}, { collection: 'staffs' });

const User = mongoose.model('User', UserSchema);

async function fixPasswords() {
  try {
    // Find users without passwords
    const usersWithoutPasswords = await User.find({
      $or: [
        { password: { $exists: false } },
        { password: null },
        { password: '' }
      ]
    });

    console.log(`\n📊 Found ${usersWithoutPasswords.length} users without passwords\n`);

    if (usersWithoutPasswords.length === 0) {
      console.log('✅ All users have passwords!');
      process.exit(0);
    }

    // Hash the default password "2021"
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('2021', salt);

    // Update all users without passwords
    for (const user of usersWithoutPasswords) {
      user.password = hashedPassword;
      await user.save();
      console.log(`✅ Updated password for: ${user.email} (${user.name})`);
    }

    console.log(`\n🎉 Successfully updated ${usersWithoutPasswords.length} users with default password: 2021\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPasswords();
