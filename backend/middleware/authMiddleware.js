const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protectRoute = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Pull user profile context from database without projecting the password field
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Access Denied: Invalid Auth Token Token' });
    }
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied: No Token Injected' });
  }
};

// Check if a staff member's role matches the required roles for an endpoint
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Access restricted for profile role type [${req.user?.role || 'Guest'}]` 
      });
    }
    next();
  };
};

module.exports = { protectRoute, authorizeRoles };