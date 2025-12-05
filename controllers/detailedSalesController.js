import DetailedSales from '../models/DetailedSales.js';
import Pharmacy from '../models/Pharmacy.js';
import mongoose from 'mongoose';
import colors from 'colors';

// @desc    Get all detailed sales
// @route   GET /api/detailed-sales
// @access  Private
export const getDetailedSales = async (req, res) => {
  try {
    const user = req.user;
    const { 
      branchCode, 
      invoiceNumber, 
      invoiceDate, 
      invoiceType, 
      salesName, 
      materialNumber,
      startDate,
      endDate,
      search 
    } = req.query;
    
    // Build query object
    const query = {};
    
    // If user is a pharmacy supervisor, check permissions
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      // If branchCode is provided, verify supervisor is assigned to that pharmacy
      if (branchCode) {
        const pharmacy = await Pharmacy.findOne({ branchCode: parseInt(branchCode) })
          .populate('supervisor', '_id');
        if (!pharmacy) {
          return res.status(404).json({
            success: false,
            message: 'Pharmacy not found for the provided branch code',
          });
        }
        
        // Check if supervisor is assigned to this pharmacy
        // Convert both IDs to strings for reliable comparison
        const supervisorIdStr = pharmacy.supervisor 
          ? (pharmacy.supervisor._id ? pharmacy.supervisor._id.toString() : pharmacy.supervisor.toString())
          : null;
        const userIdStr = user._id.toString();
        
        // Simple string comparison - most reliable
        const isAuthorized = supervisorIdStr === userIdStr;
        
        if (!pharmacy.supervisor || !isAuthorized) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not authorized to view reports for this pharmacy.',
            reason: 'You are not assigned as a supervisor for this pharmacy. Only the assigned supervisor or an administrator can view pharmacy reports.',
          });
        }
        
        // Supervisor is authorized, add branchCode to query
        query.BranchCode = parseInt(branchCode);
      } else {
        // If no branchCode provided, supervisor can only see reports for their assigned pharmacies
        // Get all pharmacies assigned to this supervisor
        const assignedPharmacies = await Pharmacy.find({ supervisor: user._id });
        const assignedBranchCodes = assignedPharmacies.map(p => p.branchCode);
        
        if (assignedBranchCodes.length === 0) {
          // Supervisor has no assigned pharmacies, return empty result
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            data: [],
          });
        }
        
        // Filter by assigned branch codes
        query.BranchCode = { $in: assignedBranchCodes };
      }
    } else {
      // For non-supervisors (admin, etc.), allow all queries
      if (branchCode) {
        query.BranchCode = parseInt(branchCode);
      }
    }
    
    if (invoiceNumber) {
      query.InvoiceNumber = new RegExp(invoiceNumber, 'i');
    }
    
    if (invoiceDate) {
      const date = new Date(invoiceDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.InvoiceDate = {
        $gte: date,
        $lt: nextDay,
      };
    }
    
    if (startDate && endDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
      };
    } else if (endDate) {
      query.InvoiceDate = {
        $lte: new Date(endDate),
      };
    }
    
    if (invoiceType) {
      query.InvoiceType = invoiceType;
    }
    
    if (salesName) {
      query.SalesName = new RegExp(salesName, 'i');
    }
    
    if (materialNumber) {
      query.MaterialNumber = parseInt(materialNumber);
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const detailedSales = await DetailedSales.find(query)
      .sort({ InvoiceDate: -1, createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100)
      .skip(parseInt(req.query.skip) || 0);
    
    const total = await DetailedSales.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: detailedSales.length,
      total,
      data: detailedSales,
    });
  } catch (error) {
    console.error('Error fetching detailed sales:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed sales',
      error: error.message,
    });
  }
};

// @desc    Get single detailed sale
// @route   GET /api/detailed-sales/:id
// @access  Private
export const getDetailedSale = async (req, res) => {
  try {
    const user = req.user;
    const detailedSale = await DetailedSales.findById(req.params.id);
    
    if (!detailedSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
    }
    
    // If user is a pharmacy supervisor, check permissions
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      // Find the pharmacy with this branch code
      const pharmacy = await Pharmacy.findOne({ branchCode: detailedSale.BranchCode })
        .populate('supervisor', '_id');
      
      if (!pharmacy) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Pharmacy not found for this sale.',
        });
      }
      
      // Check if supervisor is assigned to this pharmacy
      // Convert both IDs to strings for reliable comparison
      const supervisorIdStr = pharmacy.supervisor 
        ? (pharmacy.supervisor._id ? pharmacy.supervisor._id.toString() : pharmacy.supervisor.toString())
        : null;
      const userIdStr = user._id.toString();
      
      // Simple string comparison - most reliable
      const isAuthorized = supervisorIdStr === userIdStr;
      
      if (!pharmacy.supervisor || !isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to view this sale.',
          reason: 'You are not assigned as a supervisor for this pharmacy. Only the assigned supervisor or an administrator can view pharmacy reports.',
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: detailedSale,
    });
  } catch (error) {
    console.error('Error fetching detailed sale:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed sale',
      error: error.message,
    });
  }
};

// @desc    Create new detailed sale
// @route   POST /api/detailed-sales
// @access  Private
export const createDetailedSale = async (req, res) => {
  try {
    const detailedSale = await DetailedSales.create(req.body);
    
    res.status(201).json({
      success: true,
      data: detailedSale,
    });
  } catch (error) {
    console.error('Error creating detailed sale:'.red, error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating detailed sale',
      error: error.message,
    });
  }
};

// @desc    Create multiple detailed sales (bulk insert)
// @route   POST /api/detailed-sales/bulk
// @access  Private
export const createBulkDetailedSales = async (req, res) => {
  try {
    const { sales } = req.body;
    
    if (!Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sales array is required and must not be empty',
      });
    }
    
    const detailedSales = await DetailedSales.insertMany(sales, {
      ordered: false,
    });
    
    res.status(201).json({
      success: true,
      count: detailedSales.length,
      data: detailedSales,
    });
  } catch (error) {
    console.error('Error creating bulk detailed sales:'.red, error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating bulk detailed sales',
      error: error.message,
    });
  }
};

// @desc    Update detailed sale
// @route   PUT /api/detailed-sales/:id
// @access  Private
export const updateDetailedSale = async (req, res) => {
  try {
    const user = req.user;
    
    // First, get the existing sale to check permissions
    const existingSale = await DetailedSales.findById(req.params.id);
    
    if (!existingSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
    }
    
    // If user is a pharmacy supervisor, check permissions
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      // Find the pharmacy with this branch code
      const pharmacy = await Pharmacy.findOne({ branchCode: existingSale.BranchCode })
        .populate('supervisor', '_id');
      
      if (!pharmacy) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Pharmacy not found for this sale.',
        });
      }
      
      // Check if supervisor is assigned to this pharmacy
      const supervisorIdStr = pharmacy.supervisor 
        ? (pharmacy.supervisor._id ? pharmacy.supervisor._id.toString() : pharmacy.supervisor.toString())
        : null;
      const userIdStr = user._id.toString();
      const isAuthorized = supervisorIdStr === userIdStr;
      
      if (!pharmacy.supervisor || !isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to update this sale.',
          reason: 'You are not assigned as a supervisor for this pharmacy. Only the assigned supervisor or an administrator can modify pharmacy reports.',
        });
      }
    }
    
    const detailedSale = await DetailedSales.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    res.status(200).json({
      success: true,
      data: detailedSale,
    });
  } catch (error) {
    console.error('Error updating detailed sale:'.red, error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating detailed sale',
      error: error.message,
    });
  }
};

// @desc    Delete detailed sale
// @route   DELETE /api/detailed-sales/:id
// @access  Private
export const deleteDetailedSale = async (req, res) => {
  try {
    const user = req.user;
    
    // First, get the existing sale to check permissions
    const existingSale = await DetailedSales.findById(req.params.id);
    
    if (!existingSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
    }
    
    // If user is a pharmacy supervisor, check permissions
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      // Find the pharmacy with this branch code
      const pharmacy = await Pharmacy.findOne({ branchCode: existingSale.BranchCode })
        .populate('supervisor', '_id');
      
      if (!pharmacy) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Pharmacy not found for this sale.',
        });
      }
      
      // Check if supervisor is assigned to this pharmacy
      const supervisorIdStr = pharmacy.supervisor 
        ? (pharmacy.supervisor._id ? pharmacy.supervisor._id.toString() : pharmacy.supervisor.toString())
        : null;
      const userIdStr = user._id.toString();
      const isAuthorized = supervisorIdStr === userIdStr;
      
      if (!pharmacy.supervisor || !isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to delete this sale.',
          reason: 'You are not assigned as a supervisor for this pharmacy. Only the assigned supervisor or an administrator can delete pharmacy reports.',
        });
      }
    }
    
    const detailedSale = await DetailedSales.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Detailed sale deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting detailed sale:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting detailed sale',
      error: error.message,
    });
  }
};

// @desc    Get sales statistics
// @route   GET /api/detailed-sales/stats/summary
// @access  Private
export const getSalesStatistics = async (req, res) => {
  try {
    const user = req.user;
    const { branchCode, startDate, endDate } = req.query;
    
    const query = {};
    
    // If user is a pharmacy supervisor, check permissions
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      // If branchCode is provided, verify supervisor is assigned to that pharmacy
      if (branchCode) {
        const pharmacy = await Pharmacy.findOne({ branchCode: parseInt(branchCode) })
          .populate('supervisor', '_id');
        if (!pharmacy) {
          return res.status(404).json({
            success: false,
            message: 'Pharmacy not found for the provided branch code',
          });
        }
        
        // Check if supervisor is assigned to this pharmacy
        // Convert both IDs to strings for reliable comparison
        const supervisorIdStr = pharmacy.supervisor 
          ? (pharmacy.supervisor._id ? pharmacy.supervisor._id.toString() : pharmacy.supervisor.toString())
          : null;
        const userIdStr = user._id.toString();
        
        // Simple string comparison - most reliable
        const isAuthorized = supervisorIdStr === userIdStr;
        
        if (!pharmacy.supervisor || !isAuthorized) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not authorized to view statistics for this pharmacy.',
            reason: 'You are not assigned as a supervisor for this pharmacy. Only the assigned supervisor or an administrator can view pharmacy statistics.',
          });
        }
        
        // Supervisor is authorized, add branchCode to query
        query.BranchCode = parseInt(branchCode);
      } else {
        // If no branchCode provided, supervisor can only see statistics for their assigned pharmacies
        // Get all pharmacies assigned to this supervisor
        const assignedPharmacies = await Pharmacy.find({ supervisor: user._id });
        const assignedBranchCodes = assignedPharmacies.map(p => p.branchCode);
        
        if (assignedBranchCodes.length === 0) {
          // Supervisor has no assigned pharmacies, return empty statistics
          return res.status(200).json({
            success: true,
            data: {
              totalSales: 0,
              totalItems: 0,
              totalDiscount: 0,
              totalVAT: 0,
              totalDeliveryFees: 0,
              count: 0,
              averageSale: 0,
            },
          });
        }
        
        // Filter by assigned branch codes
        query.BranchCode = { $in: assignedBranchCodes };
      }
    } else {
      // For non-supervisors (admin, etc.), allow all queries
      if (branchCode) {
        query.BranchCode = parseInt(branchCode);
      }
    }
    
    if (startDate && endDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const stats = await DetailedSales.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$NetTotal' },
          totalItems: { $sum: '$Quantity' },
          totalDiscount: { $sum: '$TotalDiscount' },
          totalVAT: { $sum: '$TotalVAT' },
          totalDeliveryFees: { $sum: '$DeliveryFees' },
          count: { $sum: 1 },
          averageSale: { $avg: '$NetTotal' },
        },
      },
    ]);
    
    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalSales: 0,
        totalItems: 0,
        totalDiscount: 0,
        totalVAT: 0,
        totalDeliveryFees: 0,
        count: 0,
        averageSale: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching sales statistics:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales statistics',
      error: error.message,
    });
  }
};

// @desc    Get pharmacy statistics by branch code
// @route   GET /api/detailed-sales/stats/pharmacies-by-branch
// @access  Private
export const getPharmaciesByBranchCode = async (req, res) => {
  try {
    const user = req.user;
    
    // Build query for branch codes based on user role
    let branchCodeQuery = {};
    
    // If user is a pharmacy supervisor, only show statistics for pharmacies assigned to them
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      // Get all pharmacies assigned to this supervisor
      const assignedPharmacies = await Pharmacy.find({ supervisor: user._id });
      const assignedBranchCodes = assignedPharmacies.map(p => p.branchCode);
      
      if (assignedBranchCodes.length === 0) {
        // Supervisor has no assigned pharmacies, return empty statistics
        return res.status(200).json({
          success: true,
          data: {
            statistics: [],
            summary: {
              totalBranchCodes: 0,
              totalPharmacies: 0,
              totalSales: 0,
            },
          },
        });
      }
      
      // Filter by assigned branch codes
      branchCodeQuery = { BranchCode: { $in: assignedBranchCodes } };
    }
    
    // Get all distinct branch codes from detailed sales (filtered by supervisor if applicable)
    const distinctBranchCodes = await DetailedSales.distinct('BranchCode', branchCodeQuery);
    
    // Aggregate ItemsNetPrice by branch code (filtered by supervisor if applicable)
    const salesByBranch = await DetailedSales.aggregate([
      ...(Object.keys(branchCodeQuery).length > 0 ? [{ $match: branchCodeQuery }] : []),
      {
        $group: {
          _id: '$BranchCode',
          totalSales: { $sum: '$ItemsNetPrice' },
        },
      },
    ]);
    
    // Create a map for quick lookup
    const salesMap = {};
    salesByBranch.forEach((item) => {
      salesMap[item._id] = item.totalSales || 0;
    });
    
    // For each branch code, count how many pharmacies have that branchCode
    const statistics = await Promise.all(
      distinctBranchCodes.map(async (branchCode) => {
        const pharmacyQuery = { branchCode };
        // If supervisor, only count pharmacies assigned to them
        if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
          const assignedPharmacies = await Pharmacy.find({ supervisor: user._id, branchCode });
          const pharmacyCount = assignedPharmacies.length;
          return {
            branchCode,
            pharmacyCount,
            totalSales: salesMap[branchCode] || 0,
          };
        } else {
          const pharmacyCount = await Pharmacy.countDocuments(pharmacyQuery);
          return {
            branchCode,
            pharmacyCount,
            totalSales: salesMap[branchCode] || 0,
          };
        }
      })
    );
    
    // Sort by branch code
    statistics.sort((a, b) => a.branchCode - b.branchCode);
    
    // Calculate totals
    let totalPharmacies;
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      // Count only pharmacies assigned to supervisor
      const assignedPharmacies = await Pharmacy.find({ supervisor: user._id });
      totalPharmacies = assignedPharmacies.length;
    } else {
      totalPharmacies = await Pharmacy.countDocuments();
    }
    const totalBranchCodes = distinctBranchCodes.length;
    const grandTotalSales = statistics.reduce((sum, stat) => sum + stat.totalSales, 0);
    
    // Calculate percentage for each branch code
    const statisticsWithPercentage = statistics.map((stat) => ({
      ...stat,
      percentage: grandTotalSales > 0 ? (stat.totalSales / grandTotalSales) * 100 : 0,
    }));
    
    res.status(200).json({
      success: true,
      data: {
        statistics: statisticsWithPercentage,
        summary: {
          totalBranchCodes,
          totalPharmacies,
          totalSales: grandTotalSales,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching pharmacy statistics by branch code:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacy statistics by branch code',
      error: error.message,
    });
  }
};

// @desc    Get sales statistics by sales name
// @route   GET /api/detailed-sales/stats/sales-by-name
// @access  Private
export const getSalesBySalesName = async (req, res) => {
  try {
    const user = req.user;
    
    // Build query for branch codes based on user role
    let branchCodeQuery = {};
    
    // If user is a pharmacy supervisor, only show sales from pharmacies assigned to them
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      // Get all pharmacies assigned to this supervisor
      const assignedPharmacies = await Pharmacy.find({ supervisor: user._id });
      const assignedBranchCodes = assignedPharmacies.map(p => p.branchCode);
      
      if (assignedBranchCodes.length === 0) {
        // Supervisor has no assigned pharmacies, return empty statistics
        return res.status(200).json({
          success: true,
          data: {
            statistics: [],
            summary: {
              totalSalesPersons: 0,
              totalSales: 0,
              totalTransactions: 0,
              totalQuantity: 0,
            },
          },
        });
      }
      
      // Filter by assigned branch codes
      branchCodeQuery = { BranchCode: { $in: assignedBranchCodes } };
    }
    
    // Aggregate sales by SalesName (filtered by supervisor if applicable)
    const salesByName = await DetailedSales.aggregate([
      ...(Object.keys(branchCodeQuery).length > 0 ? [{ $match: branchCodeQuery }] : []),
      {
        $group: {
          _id: '$SalesName',
          totalSales: { $sum: '$ItemsNetPrice' },
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: '$Quantity' },
          totalNetTotal: { $sum: '$NetTotal' },
        },
      },
      {
        $sort: { totalSales: -1 }, // Sort by total sales descending
      },
    ]);
    
    // Format the results
    const statistics = salesByName.map((item) => ({
      salesName: item._id,
      totalSales: item.totalSales || 0,
      totalTransactions: item.totalTransactions || 0,
      totalQuantity: item.totalQuantity || 0,
      totalNetTotal: item.totalNetTotal || 0,
    }));
    
    // Calculate totals
    const totalSalesPersons = statistics.length;
    const grandTotalSales = statistics.reduce((sum, stat) => sum + stat.totalSales, 0);
    const grandTotalTransactions = statistics.reduce((sum, stat) => sum + stat.totalTransactions, 0);
    const grandTotalQuantity = statistics.reduce((sum, stat) => sum + stat.totalQuantity, 0);
    
    // Calculate percentage for each sales person
    const statisticsWithPercentage = statistics.map((stat) => ({
      ...stat,
      percentage: grandTotalSales > 0 ? (stat.totalSales / grandTotalSales) * 100 : 0,
    }));
    
    res.status(200).json({
      success: true,
      data: {
        statistics: statisticsWithPercentage,
        summary: {
          totalSalesPersons,
          totalSales: grandTotalSales,
          totalTransactions: grandTotalTransactions,
          totalQuantity: grandTotalQuantity,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sales statistics by sales name:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales statistics by sales name',
      error: error.message,
    });
  }
};

// @desc    Get sales statistics by invoice type
// @route   GET /api/detailed-sales/stats/sales-by-invoice-type
// @access  Private
export const getSalesByInvoiceType = async (req, res) => {
  try {
    const user = req.user;
    const { branchCode } = req.query;
    
    // Build query for branch codes based on user role
    let branchCodeQuery = {};
    
    // If user is a pharmacy supervisor, only show sales from pharmacies assigned to them
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      // If branchCode is provided, verify supervisor is assigned to that pharmacy
      if (branchCode) {
        const pharmacy = await Pharmacy.findOne({ branchCode: parseInt(branchCode) })
          .populate('supervisor', '_id');
        if (!pharmacy) {
          return res.status(404).json({
            success: false,
            message: 'Pharmacy not found for the provided branch code',
          });
        }
        
        // Check if supervisor is assigned to this pharmacy
        const supervisorIdStr = pharmacy.supervisor 
          ? (pharmacy.supervisor._id ? pharmacy.supervisor._id.toString() : pharmacy.supervisor.toString())
          : null;
        const userIdStr = user._id.toString();
        const isAuthorized = supervisorIdStr === userIdStr;
        
        if (!pharmacy.supervisor || !isAuthorized) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not authorized to view statistics for this pharmacy.',
            reason: 'You are not assigned as a supervisor for this pharmacy. Only the assigned supervisor or an administrator can view pharmacy statistics.',
          });
        }
        
        // Supervisor is authorized, add branchCode to query
        branchCodeQuery = { BranchCode: parseInt(branchCode) };
      } else {
        // Get all pharmacies assigned to this supervisor
        const assignedPharmacies = await Pharmacy.find({ supervisor: user._id });
        const assignedBranchCodes = assignedPharmacies.map(p => p.branchCode);
        
        if (assignedBranchCodes.length === 0) {
          // Supervisor has no assigned pharmacies, return empty statistics
          return res.status(200).json({
            success: true,
            data: {
              statistics: [],
              summary: {
                totalInvoiceTypes: 0,
                totalSales: 0,
                totalTransactions: 0,
                totalQuantity: 0,
              },
            },
          });
        }
        
        // Filter by assigned branch codes
        branchCodeQuery = { BranchCode: { $in: assignedBranchCodes } };
      }
    } else {
      // For non-supervisors (admin, etc.), allow all queries
      if (branchCode) {
        branchCodeQuery = { BranchCode: parseInt(branchCode) };
      }
    }
    
    // Aggregate sales by InvoiceType (filtered by supervisor if applicable)
    const salesByInvoiceType = await DetailedSales.aggregate([
      ...(Object.keys(branchCodeQuery).length > 0 ? [{ $match: branchCodeQuery }] : []),
      {
        $group: {
          _id: '$InvoiceType',
          totalSales: { $sum: '$ItemsNetPrice' },
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: '$Quantity' },
          totalNetTotal: { $sum: '$NetTotal' },
        },
      },
      {
        $sort: { totalSales: -1 }, // Sort by total sales descending
      },
    ]);
    
    // Format the results
    const statistics = salesByInvoiceType.map((item) => ({
      invoiceType: item._id,
      totalSales: item.totalSales || 0,
      totalTransactions: item.totalTransactions || 0,
      totalQuantity: item.totalQuantity || 0,
      totalNetTotal: item.totalNetTotal || 0,
    }));
    
    // Calculate totals
    const totalInvoiceTypes = statistics.length;
    const grandTotalSales = statistics.reduce((sum, stat) => sum + stat.totalSales, 0);
    const grandTotalTransactions = statistics.reduce((sum, stat) => sum + stat.totalTransactions, 0);
    const grandTotalQuantity = statistics.reduce((sum, stat) => sum + stat.totalQuantity, 0);
    
    // Calculate percentage for each invoice type
    const statisticsWithPercentage = statistics.map((stat) => ({
      ...stat,
      percentage: grandTotalSales > 0 ? (stat.totalSales / grandTotalSales) * 100 : 0,
    }));
    
    res.status(200).json({
      success: true,
      data: {
        statistics: statisticsWithPercentage,
        summary: {
          totalInvoiceTypes,
          totalSales: grandTotalSales,
          totalTransactions: grandTotalTransactions,
          totalQuantity: grandTotalQuantity,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sales statistics by invoice type:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales statistics by invoice type',
      error: error.message,
    });
  }
};

