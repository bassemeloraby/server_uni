import Visit from '../models/Visit.js';
import User from '../models/User.js';
import colors from 'colors';

// @desc    Create a visit record
// @route   POST /api/visits
// @access  Private
export const createVisit = async (req, res) => {
  try {
    const { path, method = 'GET', ipAddress, userAgent, referer } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        message: 'Path is required',
      });
    }

    const visit = await Visit.create({
      user: req.user._id,
      path,
      method,
      ipAddress: ipAddress || req.ip || req.connection.remoteAddress,
      userAgent: userAgent || req.get('user-agent'),
      referer: referer || req.get('referer'),
    });

    res.status(201).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    console.error('Error creating visit:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error creating visit',
      error: error.message,
    });
  }
};

// @desc    Get all visits
// @route   GET /api/visits
// @access  Private/Admin
export const getVisits = async (req, res) => {
  try {
    const { 
      userId, 
      path, 
      startDate, 
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = {};

    if (userId) {
      query.user = userId;
    }

    if (path) {
      query.path = { $regex: path, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const visits = await Visit.find(query)
      .populate('user', 'username firstName lastName email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Visit.countDocuments(query);

    res.status(200).json({
      success: true,
      count: visits.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: visits,
    });
  } catch (error) {
    console.error('Error fetching visits:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visits',
      error: error.message,
    });
  }
};

// @desc    Get visit statistics
// @route   GET /api/visits/stats
// @access  Private/Admin
export const getVisitStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date query
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        dateQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Total visits
    const totalVisits = await Visit.countDocuments(dateQuery);

    // Unique users
    const uniqueUsers = await Visit.distinct('user', dateQuery);

    // Most visited pages
    const mostVisitedPages = await Visit.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Visits by user
    const visitsByUser = await Visit.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          lastVisit: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Populate user info for visits by user
    const visitsByUserWithInfo = await Promise.all(
      visitsByUser.map(async (item) => {
        if (item._id) {
          const user = await User.findById(item._id).select('username firstName lastName email role');
          return {
            user,
            count: item.count,
            lastVisit: item.lastVisit,
          };
        }
        return item;
      })
    );

    // Visits by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const visitsByDay = await Visit.aggregate([
      {
        $match: {
          ...dateQuery,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalVisits,
        uniqueUsers: uniqueUsers.length,
        mostVisitedPages,
        visitsByUser: visitsByUserWithInfo,
        visitsByDay,
      },
    });
  } catch (error) {
    console.error('Error fetching visit stats:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visit statistics',
      error: error.message,
    });
  }
};

