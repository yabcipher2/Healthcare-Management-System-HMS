const mongoose = require("mongoose");

const LOCAL_FALLBACK = "mongodb://127.0.0.1:27017/mesra_hms";

// Accept both names: MONGO_URI is this project's original key, MONGODB_URI is
// the name Atlas itself puts in the connection string it hands you.
const resolveUri = () =>
  process.env.MONGO_URI || process.env.MONGODB_URI || LOCAL_FALLBACK;

const describeTarget = (uri) => {
  const isAtlas =
    uri.startsWith("mongodb+srv://") || /\.mongodb\.net/i.test(uri);
  // Never log credentials, but show enough of the target to spot a typo.
  const safe = uri.replace(/\/\/[^@/]*@/, "//<credentials>@").split("?")[0];
  return { isAtlas, label: isAtlas ? "MongoDB Atlas" : "local MongoDB", safe };
};

const connectionHint = (error) => {
  const message = error.message || "";
  if (/bad auth|authentication failed/i.test(message)) {
    return "Atlas rejected the database user. Check the username/password in MONGO_URI, URL-encode special characters, and confirm the user exists under Database Access.";
  }
  if (/not allowed|whitelist|IP address/i.test(message)) {
    return "This machine is not on the cluster's IP access list. In Atlas open Network Access and add your current IP (0.0.0.0/0 only for development).";
  }
  if (/ENOTFOUND|querySrv|dns/i.test(message)) {
    return "The cluster hostname could not be resolved. Copy the connection string again from Atlas → Connect → Drivers.";
  }
  if (/ECONNREFUSED/i.test(message)) {
    return "Nothing is listening at that address. Start the local MongoDB service, or point MONGO_URI at your Atlas cluster.";
  }
  if (/TLS|SSL|certificate/i.test(message)) {
    return "TLS handshake failed. Use the mongodb+srv:// string from Atlas unchanged; a network proxy that inspects TLS will break this.";
  }
  return "";
};

const connectDB = async () => {
  const mongoUri = resolveUri();
  const target = describeTarget(mongoUri);

  try {
    const conn = await mongoose.connect(mongoUri, {
      // Atlas free clusters can take a while on a cold start / distant region.
      serverSelectionTimeoutMS: 30000,
      // Retry writes in case of temporary network issues
      retryWrites: true,
      // Write concern for production
      w: 'majority',
    });
    console.log(
      `✅ MongoDB Connected Successfully (${target.label}): ${conn.connection.host}/${conn.connection.name}`,
    );
    return conn;
  } catch (error) {
    console.error(
      `⚠️  Database Connection Failed (${target.label} → ${target.safe}): ${error.message}`,
    );
    const hint = connectionHint(error);
    if (hint) console.error(`💡 Hint: ${hint}`);
    
    // In production, log the error but don't exit - let the server run without DB
    // The health endpoint and error middleware will show DB is unavailable
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  Server will continue running without database connection');
      console.error('⚠️  Please fix MongoDB Atlas Network Access and restart');
      return null;
    } else {
      // In development, exit immediately to fix the issue
      process.exit(1);
    }
  }
};

module.exports = connectDB;
