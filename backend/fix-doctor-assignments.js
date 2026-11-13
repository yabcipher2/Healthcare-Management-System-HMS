// Relink patient records whose assigned doctor points at an id from the old
// `users` collection (or any id that is not a real staff login account) to the
// matching doctor account in `staffs`, by name.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mesra_hms");
  const db = mongoose.connection.db;
  const patients = db.collection("patientrecords");
  const staffs = db.collection("staffs");
  const legacyUsers = db.collection("users");

  const records = await patients
    .find({ "consultation.assignedDoctor": { $exists: true, $ne: null } })
    .project({ cardId: 1, patientName: 1, consultation: 1 })
    .toArray();

  console.log(`records with an assigned doctor: ${records.length}`);

  const cache = new Map();
  let fixed = 0;
  const unresolved = [];

  for (const record of records) {
    const raw = record.consultation.assignedDoctor;
    const id = raw && raw._bsontype ? raw : /^[0-9a-fA-F]{24}$/.test(String(raw))
      ? new mongoose.Types.ObjectId(String(raw))
      : null;

    if (!id) {
      unresolved.push(`${record.cardId} (invalid id)`);
      continue;
    }

    if (await staffs.findOne({ _id: id }, { projection: { _id: 1 } })) {
      continue; // already points at a real account
    }

    if (!cache.has(String(id))) {
      const legacy = await legacyUsers.findOne({ _id: id });
      let target = null;
      if (legacy && legacy.name) {
        const escaped = legacy.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        target = await staffs.findOne({
          role: "Doctor",
          name: { $regex: new RegExp(`^${escaped}$`, "i") },
        });
      }
      cache.set(String(id), target);
    }

    const target = cache.get(String(id));
    if (!target) {
      unresolved.push(`${record.cardId} (doctor ${String(id)} has no matching account)`);
      continue;
    }

    await patients.updateOne(
      { _id: record._id },
      {
        $set: {
          "consultation.assignedDoctor": target._id,
          "consultation.assignedDoctorName": target.name || "",
          "consultation.assignedDoctorEmail": target.email || "",
        },
      },
    );
    fixed += 1;
    console.log(`relinked ${record.cardId} -> ${target.name} (${target.email})`);
  }

  console.log(`relinked records: ${fixed}`);
  if (unresolved.length) {
    console.log("could not relink:");
    unresolved.forEach((line) => console.log(" -", line));
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
