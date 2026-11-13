#!/usr/bin/env node
/**
 * Copy this HMS database from the local MongoDB to a MongoDB Atlas cluster.
 *
 *   node scripts/migrate-to-atlas.js --target "mongodb+srv://..." --dry-run
 *   node scripts/migrate-to-atlas.js --target "mongodb+srv://..." --yes
 *
 * The target can also come from ATLAS_URI in .env, so the credential never has
 * to sit in your shell history:
 *
 *   ATLAS_URI=mongodb+srv://... npm run migrate:atlas -- --yes
 *
 * Flags
 *   --dry-run   List what would be copied from the local database. No writes.
 *   --yes       Required for a real run.
 *   --drop      Empty each target collection before copying (replace instead of
 *               merge). Without it, existing records are kept and duplicates
 *               are skipped.
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");

const LOCAL_FALLBACK = "mongodb://127.0.0.1:27017/mesra_hms";
const BATCH_SIZE = 500;

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const flagValue = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const dryRun = hasFlag("--dry-run");
const confirmed = hasFlag("--yes");
const drop = hasFlag("--drop");

const sourceUri =
  flagValue("--source") ||
  process.env.SOURCE_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  LOCAL_FALLBACK;
const targetUri = flagValue("--target") || process.env.ATLAS_URI || "";

const usage = `
Usage:
  node scripts/migrate-to-atlas.js --target <atlas-uri> --yes [--drop]
  node scripts/migrate-to-atlas.js --dry-run

  --target <uri>  Atlas connection string (or set ATLAS_URI in .env)
  --source <uri>  Source database (defaults to MONGO_URI / localhost)
  --dry-run       Report what would be copied; no target connection, no writes
  --yes           Confirm the real write
  --drop          Empty each target collection before copying
`;

const connect = async (uri, label) => {
  // Atlas free clusters can be slow to answer the first handshake from a cold
  // start or a distant region, so allow a generous selection window.
  const conn = await mongoose
    .createConnection(uri, { serverSelectionTimeoutMS: 45000 })
    .asPromise();
  console.log(`${label}: ${conn.host}/${conn.name}`);
  return conn;
};

const copyCollection = async (source, target, name) => {
  const docs = await source.db.collection(name).find({}).toArray();
  if (docs.length && drop) {
    await target.db.collection(name).deleteMany({});
  }

  let inserted = 0;
  let skipped = 0;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    try {
      const result = await target.db
        .collection(name)
        .insertMany(batch, { ordered: false });
      inserted += result.insertedCount || batch.length;
    } catch (error) {
      // 11000 = duplicate key: those records already exist in the target.
      if (error.code === 11000) {
        inserted += error.result?.insertedCount || 0;
        skipped += batch.length - (error.result?.insertedCount || 0);
      } else {
        throw error;
      }
    }
  }

  // Recreate the model indexes (unique codes, MRN lookups, ...).
  let indexes = 0;
  const existingIndexes = await source.db.collection(name).indexes().catch(() => []);
  for (const index of existingIndexes) {
    if (index.name === "_id_") continue;
    const { key, name: indexName, v, ns, background, ...options } = index;
    try {
      await target.db.collection(name).createIndex(key, { name: indexName, ...options });
      indexes += 1;
    } catch (error) {
      console.warn(`  ! index ${indexName} skipped on ${name}: ${error.message}`);
    }
  }

  return { docs: docs.length, inserted, skipped, indexes };
};

const run = async () => {
  if (!dryRun && !targetUri) {
    console.error("No Atlas connection string. Pass --target <uri> or set ATLAS_URI.\n" + usage);
    process.exit(1);
  }
  if (!dryRun && !confirmed) {
    console.error("Refusing to write without --yes.\n" + usage);
    process.exit(1);
  }
  if (!dryRun && targetUri === sourceUri) {
    console.error("Source and target are the same database. Nothing to do.");
    process.exit(1);
  }

  const source = await connect(sourceUri, "Source");
  // The modern driver returns a cursor here, not { collections }.
  const collections = await source.db.listCollections().toArray();
  const names = collections.map((c) => c.name).sort();

  const counts = [];
  for (const name of names) {
    counts.push({ name, count: await source.db.collection(name).countDocuments() });
  }

  if (dryRun) {
    console.log("\nDry run — nothing will be written.");
    for (const { name, count } of counts) {
      console.log(`  ${name.padEnd(24)} ${count} document(s)`);
    }
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    console.log(`\n${counts.length} collection(s), ${total} document(s) would be copied.`);
    console.log("Run again with --target <atlas-uri> --yes to copy them.");
    await source.close();
    return;
  }

  const target = await connect(targetUri, "Target (Atlas)");

  console.log("\nCopying collections...");
  let copiedDocs = 0;
  for (const { name } of counts) {
    const result = await copyCollection(source, target, name);
    copiedDocs += result.inserted;
    console.log(
      `  ${name.padEnd(24)} ${result.inserted} inserted, ${result.skipped} skipped, ${result.indexes} index(es)`,
    );
  }

  console.log(`\nDone: ${copiedDocs} document(s) written to Atlas.`);
  console.log("Now set MONGO_URI to the Atlas string in backend/.env and restart the backend.");

  await source.close();
  await target.close();
};

run().catch(async (error) => {
  console.error(`\nMigration failed: ${error.message}`);
  if (/bad auth|authentication failed/i.test(error.message)) {
    console.error("Hint: check the Atlas database user and URL-encode special characters in the password.");
  }
  if (/IP address|whitelist|not allowed/i.test(error.message)) {
    console.error("Hint: add this machine's IP in Atlas → Network Access.");
  }
  if (/ENOTFOUND|querySrv/i.test(error.message)) {
    console.error("Hint: re-copy the connection string from Atlas → Connect → Drivers.");
  }
  process.exit(1);
});
