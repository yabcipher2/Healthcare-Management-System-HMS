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

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Access Restricted" });
    }
    next();
  };
};

module.exports = { protectRoute, authorizeRoles };
