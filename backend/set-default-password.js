// Sets every staff account password to the default "2021", hashed exactly once.
// Uses direct collection updates so the model's pre("save") hook cannot hash twice.
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mesra_hms";
const DEFAULT_PASSWORD = "2021";

(async () => {
  await mongoose.connect(MONGO_URI);
  const staffs = mongoose.connection.db.collection("staffs");
  const users = await staffs.find({}).toArray();

  console.log(`Database: ${MONGO_URI}`);
  console.log(`Resetting ${users.length} staff password(s) to "${DEFAULT_PASSWORD}"\n`);

  let updated = 0;
  for (const user of users) {
    // A fresh salt per account: never share one hash across users.
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await staffs.updateOne({ _id: user._id }, { $set: { password: hash } });
    updated += 1;
  }

  const after = await staffs.find({}).toArray();
  let ok = 0;
  const failures = [];
  for (const user of after) {
    const matches =
      typeof user.password === "string" &&
      /^\$2[aby]?\$\d{2}\$/.test(user.password) &&
      (await bcrypt.compare(DEFAULT_PASSWORD, user.password));
    if (matches) ok += 1;
    else failures.push(user.email);
  }

  console.log(`Updated: ${updated}`);
  console.log(`Verified "${DEFAULT_PASSWORD}" works for: ${ok}/${after.length}`);
  if (failures.length) console.log(`FAILED for: ${failures.join(", ")}`);

  await mongoose.disconnect();
  process.exit(failures.length ? 1 : 0);
})().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
