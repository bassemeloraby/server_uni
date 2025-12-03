import User from '../models/User.js';
import colors from 'colors';

// @desc    Protect routes - verify user is authenticated
// @access  Private
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please provide a valid token.',
      });
    }

    // Parse token to extract user ID
    // Token format: token_${user._id}_${Date.now()}
    const tokenParts = token.split('_');
    if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.',
      });
    }

    const userId = tokenParts[1];

    // Find user by ID
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    // Verify user is authenticated (any valid role can access)
    // All authenticated users with valid roles can access pharmacies and detailed sales

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in protect middleware:'.red, error);
    return res.status(500).json({
      success: false,
      message: 'Error authenticating user',
      error: error.message,
    });
  }
};

