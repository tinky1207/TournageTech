// backend/src/middleware/auth.middleware.js
export const protectRoute = (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ 
        message: "Unauthorized - you must be logged in",
        error: "Authentication required"
      });
    }
    console.log('Auth middleware - User ID:', req.auth.userId);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      message: "Authentication failed",
      error: error.message 
    });
  }
};