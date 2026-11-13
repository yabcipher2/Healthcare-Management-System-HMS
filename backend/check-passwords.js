// Read-only diagnostic: reports which stored staff passwords match known defaults.
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mesra_hms";
const CANDIDATES = ["2021", "password123", "admin123"];

(async () => {
  await mongoose.connect(MONGO_URI);
  const staffs = mongoose.connection.db.collection("staffs");
  const users = await staffs.find({}).toArray();

  console.log(`Database: ${MONGO_URI}`);
  console.log(`Total staff accounts: ${users.length}\n`);

  const hashOwners = new Map();

  for (const user of users) {
    const hash = user.password || "";
    const isBcrypt = /^\$2[aby]?\$\d{2}\$/.test(hash);
    const matches = [];

    if (isBcrypt) {
      for (const candidate of CANDIDATES) {
        if (await bcrypt.compare(candidate, hash)) matches.push(candidate);
      }
    }

    const owner = hashOwners.get(hash);
    hashOwners.set(hash, user.email);

    console.log(`${user.email}  [${user.role || "?"}]`);
    console.log(`   name:   ${user.name || "N/A"}`);
    console.log(
      `   hash:   ${isBcrypt ? `${hash.slice(0, 7)}... (${hash.length} chars)` : "missing or not bcrypt"}`,
    );
    console.log(
      `   known:  ${matches.length ? `matches "${matches.join('", "')}"` : "does NOT match any default"}`,
    );
    if (owner) console.log(`   note:   identical hash to ${owner}`);
    console.log("");
  }

  const emails = users.map((u) => u.email);
  const lowercased = emails.filter((e) => e && e !== e.toLowerCase().trim());
  if (lowercased.length) {
    console.log(`Emails that are not lowercase/trimmed: ${lowercased.join(", ")}`);
  }
  const uniqueHashes = new Set(users.map((u) => u.password));
  if (users.length > 1 && uniqueHashes.size === 1) {
    console.log(
      "All accounts share one identical hash (a bulk password reset script was used).",
    );
  }

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
