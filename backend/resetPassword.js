const mongoose = require("mongoose");
const User = require("./models/user");
require("dotenv").config();

const email = "hana@gmail.com";
const newPassword = "1234";

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mesra_hms")
  .then(async () => {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User ${email} not found!`);
      process.exit(1);
    }
    
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();
    
    console.log(`✓ Password reset successfully for ${email}`);
    console.log(`  New password: ${newPassword}`);
    process.exit(0);
  })
  .catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
  });
