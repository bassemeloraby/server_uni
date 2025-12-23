import colors from 'colors';

/**
 * Middleware to check if user is admin
 * Should be used after protect middleware
 */
export const admin = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    // Check if user is admin
    if (req.user.role?.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    next();
  } catch (error) {
    console.error('Error in admin middleware:'.red, error);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin privileges',
      error: error.message,
    });
  }
};

export default admin;

