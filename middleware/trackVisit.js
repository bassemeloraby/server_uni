import Visit from '../models/Visit.js';
import colors from 'colors';

/**
 * Middleware to track page visits
 * Should be used after authentication middleware
 */
export const trackVisit = async (req, res, next) => {
  try {
    // Only track if user is authenticated
    if (req.user) {
      // Don't track visits to the visits page itself to avoid recursion
      // and don't track API calls that are not page visits
      const path = req.path;
      const isApiCall = path.startsWith('/api/');
      
      // Only track actual page visits, not API calls
      // We'll track visits from the frontend instead
      // This middleware can be used for API endpoint tracking if needed
      
      // For now, we'll skip tracking in middleware
      // Visits will be tracked from the frontend
    }
    
    next();
  } catch (error) {
    // Don't block the request if tracking fails
    console.error('Error tracking visit:'.red, error);
    next();
  }
};

export default trackVisit;

