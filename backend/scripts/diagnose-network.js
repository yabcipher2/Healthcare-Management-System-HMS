const dns = require('dns').promises;
const net = require('net');
const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, ...args) => console.log(color, ...args, colors.reset);

async function diagnoseMongoDB() {
  log(colors.cyan, '\n🔍 MongoDB Atlas Network Diagnostics\n');
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    log(colors.red, '❌ No MONGO_URI found in environment');
    return;
  }

  // Parse connection string
  const match = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)/);
  if (!match) {
    log(colors.red, '❌ Invalid MongoDB URI format');
    return;
  }

  const [, username, password, host] = match;
  const clusterHost = host.split('?')[0];

  log(colors.blue, '📊 Connection Details:');
  log(colors.cyan, `  Host: ${clusterHost}`);
  log(colors.cyan, `  Username: ${username}`);
  log(colors.cyan, `  Password: ${'*'.repeat(password.length)}\n`);

  // Test 1: DNS Resolution
  log(colors.yellow, '🔍 Test 1: DNS Resolution');
  try {
    const addresses = await dns.resolve4(clusterHost);
    log(colors.green, `  ✅ DNS resolved to: ${addresses.join(', ')}`);
  } catch (error) {
    log(colors.red, `  ❌ DNS resolution failed: ${error.message}`);
    log(colors.yellow, '  💡 This might indicate:');
    log(colors.yellow, '     - Invalid cluster hostname');
    log(colors.yellow, '     - DNS server issues');
    log(colors.yellow, '     - Network connectivity problems');
    return;
  }

  // Test 2: SRV Record Lookup (MongoDB specific)
  log(colors.yellow, '\n🔍 Test 2: MongoDB SRV Record');
  try {
    const srvRecords = await dns.resolveSrv(`_mongodb._tcp.${clusterHost}`);
    log(colors.green, `  ✅ Found ${srvRecords.length} MongoDB servers:`);
    srvRecords.forEach((srv, i) => {
      log(colors.cyan, `     ${i + 1}. ${srv.name}:${srv.port}`);
    });
  } catch (error) {
    log(colors.red, `  ❌ SRV lookup failed: ${error.message}`);
  }

  // Test 3: TCP Connection to MongoDB port
  log(colors.yellow, '\n🔍 Test 3: TCP Connectivity');
  try {
    const srvRecords = await dns.resolveSrv(`_mongodb._tcp.${clusterHost}`);
    if (srvRecords.length > 0) {
      const target = srvRecords[0];
      const connected = await testTCPConnection(target.name, target.port);
      if (connected) {
        log(colors.green, `  ✅ TCP connection successful to ${target.name}:${target.port}`);
      } else {
        log(colors.red, `  ❌ TCP connection failed to ${target.name}:${target.port}`);
        log(colors.yellow, '  💡 This suggests:');
        log(colors.yellow, '     - Firewall blocking outbound connections');
        log(colors.yellow, '     - IP not whitelisted in MongoDB Atlas');
        log(colors.yellow, '     - Network/VPN issues');
      }
    }
  } catch (error) {
    log(colors.red, `  ❌ TCP test failed: ${error.message}`);
  }

  // Test 4: Internet Connectivity
  log(colors.yellow, '\n🔍 Test 4: General Internet Connectivity');
  try {
    const connected = await testHTTPS('www.google.com');
    if (connected) {
      log(colors.green, '  ✅ Internet connection working');
    } else {
      log(colors.red, '  ❌ No internet connection detected');
    }
  } catch (error) {
    log(colors.red, `  ❌ Internet test failed: ${error.message}`);
  }

  // Test 5: MongoDB Atlas API Reachability
  log(colors.yellow, '\n🔍 Test 5: MongoDB Atlas Reachability');
  try {
    const connected = await testHTTPS('cloud.mongodb.com');
    if (connected) {
      log(colors.green, '  ✅ MongoDB Atlas is reachable');
    } else {
      log(colors.red, '  ❌ Cannot reach MongoDB Atlas');
    }
  } catch (error) {
    log(colors.red, `  ❌ Atlas reachability test failed: ${error.message}`);
  }

  log(colors.cyan, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.yellow, '\n📝 Recommendations:\n');
  log(colors.cyan, '1. Check MongoDB Atlas Network Access:');
  log(colors.cyan, '   → https://cloud.mongodb.com → Network Access');
  log(colors.cyan, '   → Add current IP or 0.0.0.0/0 for testing\n');
  log(colors.cyan, '2. Verify firewall settings:');
  log(colors.cyan, '   → Allow outbound connections to port 27017');
  log(colors.cyan, '   → Check corporate firewall/proxy settings\n');
  log(colors.cyan, '3. Try different network:');
  log(colors.cyan, '   → Use mobile hotspot to test');
  log(colors.cyan, '   → Check if VPN is blocking connections\n');
  log(colors.cyan, '4. Verify credentials:');
  log(colors.cyan, '   → Username and password are correct');
  log(colors.cyan, '   → Special characters are URL-encoded\n');
}

function testTCPConnection(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

function testHTTPS(host) {
  return new Promise((resolve) => {
    const req = https.get(`https://${host}`, { timeout: 5000 }, (res) => {
      resolve(res.statusCode < 500);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

diagnoseMongoDB().catch(error => {
  log(colors.red, `\n❌ Diagnostic failed: ${error.message}`);
  process.exit(1);
});
