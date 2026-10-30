const mongoose = require("mongoose");
const User = require("./models/user");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mesra_hms")
  .then(async () => {
    console.log("\n=== Users in Database ===\n");
    const users = await User.find({}, 'name email role dept').lean();
    
    if (users.length === 0) {
      console.log("No users found in database!");
    } else {
      users.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Role: ${user.role}`);
        console.log(`Dept: ${user.dept || 'N/A'}`);
        console.log('---');
      });
      console.log(`\nTotal users: ${users.length}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
  });
