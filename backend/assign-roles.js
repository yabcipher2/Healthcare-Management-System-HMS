/**
 * Fills in the `role` field for staff accounts that have none.
 *
 * Accounts created before `role` was persisted in the staffs collection can log
 * in but have no dashboard to land on, so the portal sends them back to the
 * landing page. This script assigns a role using, in order:
 *   1. the email domain (daniel@nurse.com -> Nurse, kidu@labcashier.com -> Laboratory Cashier ...)
 *   2. the role recorded for the same email in the legacy `users` collection
 * and reports anything it cannot classify.
 *
 * Run from the backend directory:  node assign-roles.js
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");

const DOMAIN_ROLES = [
  { test: /@labcashier\.com$/i, role: "Laboratory Cashier" },
  { test: /@phacashier\.com$/i, role: "Pharmacy Cashier" },
  { test: /@cashiers?\.com$/i, role: "Cashier" },
  { test: /@nurse\.com$/i, role: "Nurse" },
  { test: /@ultra\.com$/i, role: "Radiology" },
  { test: /@ward\.com$/i, role: "Ward" },
  { test: /@store\.com$/i, role: "Store Manager" },
  { test: /@(doc|doctor)\.com$/i, role: "Doctor" },
];

// Legacy spellings -> the values the portal routes on.
const ROLE_ALIASES = {
  laboratory: "Lab Tech",
  "ward manager": "Ward",
  "charge nurse": "Ward",
  ward: "Ward",
  triage: "Triage",
  nurse: "Nurse",
  doctor: "Doctor",
  pharmacist: "Pharmacist",
  receptionist: "Receptionist",
  administrator: "Administrator",
  cashier: "Cashier",
  "laboratory cashier": "Laboratory Cashier",
  "pharmacy cashier": "Pharmacy Cashier",
  "store manager": "Store Manager",
  radiology: "Radiology",
  "lab tech": "Lab Tech",
};

const canonical = (role) => {
  if (!role) return null;
  return ROLE_ALIASES[role.toString().trim().toLowerCase()] || null;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const staffs = mongoose.connection.db.collection("staffs");
  const legacy = mongoose.connection.db.collection("users");

  const legacyRoles = new Map();
  for (const doc of await legacy.find({}).toArray()) {
    if (doc.email) legacyRoles.set(doc.email.toLowerCase(), doc.role);
  }

  const missing = await staffs.find({ $or: [{ role: { $exists: false } }, { role: null }, { role: "" }] }).toArray();
  const assigned = [];
  const unresolved = [];

  for (const user of missing) {
    const email = (user.email || "").toLowerCase();
    if (!email) {
      unresolved.push(`${user.name} (no email address on record)`);
      continue;
    }

    const hint = DOMAIN_ROLES.find((entry) => entry.test.test(email));
    const role = hint?.role || canonical(legacyRoles.get(email));

    if (!role) {
      unresolved.push(`${email} (${user.name})`);
      continue;
    }

    await staffs.updateOne({ _id: user._id }, { $set: { role } });
    assigned.push(`${email} -> ${role}`);
  }

  console.log(`Assigned roles: ${assigned.length}`);
  assigned.forEach((line) => console.log("  " + line));

  if (unresolved.length) {
    console.log(`\nStill without a role: ${unresolved.length}`);
    unresolved.forEach((line) => console.log("  " + line));
  }

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("assign-roles failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
