import User from '../models/User.js';
import colors from 'colors';



// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password',
      });
    }

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    // Simple password check (in production, use bcrypt for hashing)
    // For now, we'll do a simple comparison
    // TODO: Implement proper password hashing with bcrypt
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Generate a simple token (in production, use JWT)
    // For now, we'll use a simple token
    const token = `token_${user._id}_${Date.now()}`;

    res.status(200).json({
      success: true,
      data: {
        user: {
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token: token,
      },
    });
  } catch (error) {
    console.error('Error during login:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    // In a real app, you'd get user from JWT token
    // For now, we'll use a simple approach
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    const user = await User.findOne({ username: username.toLowerCase() }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

