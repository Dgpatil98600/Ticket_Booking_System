
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.log(' [Auth Error] Access denied. No token provided.');
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      console.log(` [Auth Error] User ID ${decoded.id} not found in DB.`);
      return errorResponse(res, 'User not found. Token invalid.', 401);
    }

    if (!user.isActive) {
      console.log(` [Auth Error] User account ${user.email} is deactivated.`);
      return errorResponse(res, 'Account has been deactivated.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log(' [Auth Error] Token has expired.');
      return errorResponse(res, 'Token has expired. Please login again.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      console.log(' [Auth Error] Invalid token.');
      return errorResponse(res, 'Invalid token. Please login again.', 401);
    }
    console.log(' [Auth Error] Authentication failed:', error.message);
    return errorResponse(res, 'Authentication failed.', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      console.log(`️ [Authz Error] User ${req.user.email} denied. Has role '${req.user.role}', requires ${roles.join(' or ')}`);
      return errorResponse(
        res,
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    
  }
  next();
};

export { protect, authorize, optionalAuth };
