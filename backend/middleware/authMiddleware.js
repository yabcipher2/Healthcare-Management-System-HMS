const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protectRoute = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Extract token from header [cite: 74]
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Inject user payload into the request object while excluding the password hash [cite: 76, 77]
      req.user = await User.findById(decoded.id).select("-password");
      return next();
    } catch (error) {
      const message =
        error.name === "TokenExpiredError"
          ? "Access Denied: Token Expired"
          : "Access Denied: Invalid Token";
      return res.status(401).json({ success: false, message });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No Token Injected" });
  }
};

// Staff records and login accounts spell the same job differently ("Lab Tech"
// in the staff directory, "Laboratory" in the route lists). Normalise before
// the role check so a technician is not locked out of their own module.
const ROLE_ALIASES = {
  "lab": "Laboratory",
  "lab tech": "Laboratory",
  "lab technician": "Laboratory",
  "laboratory": "Laboratory",
  "lab cashier": "Laboratory Cashier",
  "laboratory cashier": "Laboratory Cashier",
  "ward": "Ward",
  "ward manager": "Ward",
  "charge nurse": "Ward",
};

const canonicalRole = (role) => {
  const key = String(role || "").trim().toLowerCase();
  return ROLE_ALIASES[key] || role;
};

const authorizeRoles = (...allowedRoles) => {
  const allowed = allowedRoles.map(canonicalRole);
  return (req, res, next) => {
    if (!req.user || !allowed.includes(canonicalRole(req.user.role))) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Access Restricted" });
    }
    next();
  };
};

module.exports = { protectRoute, authorizeRoles, canonicalRole };
