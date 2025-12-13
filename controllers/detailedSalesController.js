import DetailedSales from '../models/DetailedSales.js';
import colors from 'colors';

// Helper function to parse M/D/YYYY date string to Date object
const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  return new Date(year, month, day);
};

// @desc    Get all detailed sales
// @route   GET /api/detailed-sales
// @access  Private - Admin only
export const getDetailedSales = async (req, res) => {
  try {
    const user = req.user;
    const { 
      branchCode, 
      invoiceNumber, 
      invoiceDate,
      startDate,
      endDate,
      invoiceType, 
      salesName, 
      materialNumber,
      customerName,
      search,
      limit,
      skip,
    } = req.query;
    
    // Only admin can access detailed sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view detailed sales.',
        reason: 'You must be an administrator to access detailed sales.',
      });
    }
    
    // Build query object
    const query = {};
    
    if (branchCode) {
      query.BranchCode = parseInt(branchCode);
    }
    
    if (invoiceNumber) {
      query.InvoiceNumber = parseInt(invoiceNumber);
    }
    
    // Handle date range filtering
    const dateRangeConditions = [];
    if (startDate || endDate) {
      if (startDate) {
        const start = parseDateString(startDate);
        if (start) {
          dateRangeConditions.push({
            $expr: {
              $gte: [
                {
                  $dateFromString: {
                    dateString: {
                      $concat: [
                        { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 2] },
                        '-',
                        { $cond: [{ $lt: [{ $convert: { input: { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }, to: 'int', onError: 0 } }, 10] }, 
                          { $concat: ['0', { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }] }, 
                          { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }] },
                        '-',
                        { $cond: [{ $lt: [{ $convert: { input: { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }, to: 'int', onError: 0 } }, 10] }, 
                          { $concat: ['0', { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }] }, 
                          { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }] }
                      ]
                    },
                    onError: null
                  }
                },
                start
              ]
            }
          });
        }
      }
      if (endDate) {
        const end = parseDateString(endDate);
        if (end) {
          end.setHours(23, 59, 59, 999);
          dateRangeConditions.push({
            $expr: {
              $lte: [
                {
                  $dateFromString: {
                    dateString: {
                      $concat: [
                        { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 2] },
                        '-',
                        { $cond: [{ $lt: [{ $convert: { input: { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }, to: 'int', onError: 0 } }, 10] }, 
                          { $concat: ['0', { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }] }, 
                          { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }] },
                        '-',
                        { $cond: [{ $lt: [{ $convert: { input: { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }, to: 'int', onError: 0 } }, 10] }, 
                          { $concat: ['0', { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }] }, 
                          { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }] }
                      ]
                    },
                    onError: null
                  }
                },
                end
              ]
            }
          });
        }
      }
    }
    
    // Legacy support for invoiceDate (single date)
    if (invoiceDate && !startDate && !endDate) {
      query.InvoiceDate = new RegExp(invoiceDate, 'i');
    }
    
    if (invoiceType) {
      query.InvoiceType = invoiceType;
    }
    
    if (salesName) {
      query.SalesName = new RegExp(salesName, 'i');
    }
    
    if (customerName) {
      query.CustomerName = new RegExp(customerName, 'i');
    }
    
    if (materialNumber) {
      query.MaterialNumber = parseInt(materialNumber);
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    // Combine date range conditions with other filters
    if (dateRangeConditions.length > 0) {
      if (Object.keys(query).length > 0) {
        query.$and = [
          ...(query.$and || []),
          ...dateRangeConditions
        ];
      } else {
        Object.assign(query, { $and: dateRangeConditions });
      }
    }
    
    const pageLimit = parseInt(limit) || 100;
    const pageSkip = parseInt(skip) || 0;
    
    const detailedSales = await DetailedSales.find(query)
      .sort({ InvoiceDate: -1, createdAt: -1 })
      .limit(pageLimit)
      .skip(pageSkip);
    
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
// @access  Private - Admin only
export const getDetailedSale = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access detailed sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view detailed sales.',
        reason: 'You must be an administrator to access detailed sales.',
      });
    }
    
    const detailedSale = await DetailedSales.findById(req.params.id);
    
    if (!detailedSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
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
// @access  Private - Admin only
export const createDetailedSale = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can create detailed sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can create detailed sales.',
        reason: 'You must be an administrator to create detailed sales.',
      });
    }
    
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
// @access  Private - Admin only
export const createBulkDetailedSales = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can bulk create detailed sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can bulk create detailed sales.',
        reason: 'You must be an administrator to bulk create detailed sales.',
      });
    }
    
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
// @access  Private - Admin only
export const updateDetailedSale = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can update detailed sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can update detailed sales.',
        reason: 'You must be an administrator to update detailed sales.',
      });
    }
    
    const detailedSale = await DetailedSales.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!detailedSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
    }
    
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
// @access  Private - Admin only
export const deleteDetailedSale = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can delete detailed sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete detailed sales.',
        reason: 'You must be an administrator to delete detailed sales.',
      });
    }
    
    const detailedSale = await DetailedSales.findByIdAndDelete(req.params.id);
    
    if (!detailedSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
    }
    
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

// @desc    Get insurance sales (filtered by insurance company names)
// @route   GET /api/detailed-sales/insurance
// @access  Private - Admin only
export const getInsuranceSales = async (req, res) => {
  try {
    const user = req.user;
    const { 
      branchCode, 
      invoiceNumber, 
      invoiceDate,
      startDate,
      endDate,
      invoiceType, 
      salesName, 
      materialNumber,
      search,
      limit,
      skip,
    } = req.query;
    
    // Only admin can access insurance sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view insurance sales.',
        reason: 'You must be an administrator to access insurance sales.',
      });
    }
    
    // List of insurance company names to filter by
    const insuranceCompanies = [
      'Al-Etihad Cooperative Insurance Com',
      'Allied Cooperative Insurance Group',
      'Al-Rajhi Company for Cooperative In',
      'Amana Cooperative Insurance Company',
      'Arabia Insurance Cooperative Compan',
      'Arabian Shield Cooperative Insuranc',
      'BUPA ARABIA',
      'Buruj Cooperative Insurance Company',
      'GOSI',
      'Gulf Union Alahlia Cooperateive',
      'Malaz',
      'MEDGULF',
      'Mena Medical Clinic',
      'Nextcare/Al Jazira Takaful Company',
      'Tawuniya',
      'Total/Al Sagr Cooperative Insurance',
      'United Cooperative Insurance Compan',
    ];
    
    // Build insurance company filter using $or
    // Match company names that contain any of the insurance company names (case-insensitive)
    const insuranceFilter = {
      $or: insuranceCompanies.map(company => ({
        CustomerName: new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      }))
    };
    
    // Build other filters
    const otherFilters = {};
    
    if (branchCode) {
      otherFilters.BranchCode = parseInt(branchCode);
    }
    
    if (invoiceNumber) {
      otherFilters.InvoiceNumber = parseInt(invoiceNumber);
    }
    
    // Handle date range filtering
    const dateRangeConditions = [];
    if (startDate || endDate) {
      if (startDate) {
        const start = parseDateString(startDate);
        if (start) {
          dateRangeConditions.push({
            $expr: {
              $gte: [
                {
                  $dateFromString: {
                    dateString: {
                      $concat: [
                        { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 2] },
                        '-',
                        { $cond: [{ $lt: [{ $convert: { input: { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }, to: 'int', onError: 0 } }, 10] }, 
                          { $concat: ['0', { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }] }, 
                          { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }] },
                        '-',
                        { $cond: [{ $lt: [{ $convert: { input: { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }, to: 'int', onError: 0 } }, 10] }, 
                          { $concat: ['0', { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }] }, 
                          { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }] }
                      ]
                    },
                    onError: null
                  }
                },
                start
              ]
            }
          });
        }
      }
      if (endDate) {
        const end = parseDateString(endDate);
        if (end) {
          end.setHours(23, 59, 59, 999);
          dateRangeConditions.push({
            $expr: {
              $lte: [
                {
                  $dateFromString: {
                    dateString: {
                      $concat: [
                        { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 2] },
                        '-',
                        { $cond: [{ $lt: [{ $convert: { input: { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }, to: 'int', onError: 0 } }, 10] }, 
                          { $concat: ['0', { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }] }, 
                          { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 0] }] },
                        '-',
                        { $cond: [{ $lt: [{ $convert: { input: { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }, to: 'int', onError: 0 } }, 10] }, 
                          { $concat: ['0', { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }] }, 
                          { $arrayElemAt: [{ $split: ['$InvoiceDate', '/'] }, 1] }] }
                      ]
                    },
                    onError: null
                  }
                },
                end
              ]
            }
          });
        }
      }
    }
    
    // Legacy support for invoiceDate (single date)
    if (invoiceDate && !startDate && !endDate) {
      otherFilters.InvoiceDate = new RegExp(invoiceDate, 'i');
    }
    
    if (invoiceType) {
      otherFilters.InvoiceType = invoiceType;
    }
    
    if (salesName) {
      otherFilters.SalesName = new RegExp(salesName, 'i');
    }
    
    if (materialNumber) {
      otherFilters.MaterialNumber = parseInt(materialNumber);
    }
    
    if (search) {
      otherFilters.$text = { $search: search };
    }
    
    // Combine date range conditions with other filters
    if (dateRangeConditions.length > 0) {
      if (Object.keys(otherFilters).length > 0) {
        otherFilters.$and = [
          ...(otherFilters.$and || []),
          ...dateRangeConditions
        ];
      } else {
        Object.assign(otherFilters, { $and: dateRangeConditions });
      }
    }
    
    // Combine filters using $and
    const query = Object.keys(otherFilters).length > 0
      ? { $and: [insuranceFilter, otherFilters] }
      : insuranceFilter;
    
    const pageLimit = parseInt(limit) || 100;
    const pageSkip = parseInt(skip) || 0;
    
    const insuranceSales = await DetailedSales.find(query)
      .sort({ InvoiceDate: -1, createdAt: -1 })
      .limit(pageLimit)
      .skip(pageSkip);
    
    const total = await DetailedSales.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: insuranceSales.length,
      total,
      data: insuranceSales,
    });
  } catch (error) {
    console.error('Error fetching insurance sales:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance sales',
      error: error.message,
    });
  }
};

// @desc    Get insurance sales aggregated by customer name
// @route   GET /api/detailed-sales/insurance/by-customer
// @access  Private - Admin only
export const getInsuranceSalesByCustomer = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access insurance sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view insurance sales.',
        reason: 'You must be an administrator to access insurance sales.',
      });
    }
    
    // List of insurance company names to filter by
    const insuranceCompanies = [
      'Al-Etihad Cooperative Insurance Com',
      'Allied Cooperative Insurance Group',
      'Al-Rajhi Company for Cooperative In',
      'Amana Cooperative Insurance Company',
      'Arabia Insurance Cooperative Compan',
      'Arabian Shield Cooperative Insuranc',
      'BUPA ARABIA',
      'Buruj Cooperative Insurance Company',
      'GOSI',
      'Gulf Union Alahlia Cooperateive',
      'Malaz',
      'MEDGULF',
      'Mena Medical Clinic',
      'Nextcare/Al Jazira Takaful Company',
      'Tawuniya',
      'Total/Al Sagr Cooperative Insurance',
      'United Cooperative Insurance Compan',
    ];
    
    // Build insurance company filter using $or
    const insuranceFilter = {
      $or: insuranceCompanies.map(company => ({
        CustomerName: new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      }))
    };
    
    // Aggregate insurance sales by customer name
    const aggregationResult = await DetailedSales.aggregate([
      {
        $match: insuranceFilter
      },
      {
        $group: {
          _id: '$CustomerName',
          totalNetPrice: { $sum: '$NetTotal' },
          totalItemsNetPrice: { $sum: '$ItemsNetPrice' },
          totalVAT: { $sum: '$TotalVAT' },
          totalDiscount: { $sum: '$TotalDiscount' },
          totalQuantity: { $sum: '$Quantity' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          customerName: '$_id',
          totalNetPrice: 1,
          totalItemsNetPrice: 1,
          totalVAT: 1,
          totalDiscount: 1,
          totalQuantity: 1,
          transactionCount: 1
        }
      },
      {
        $sort: { totalNetPrice: -1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      count: aggregationResult.length,
      data: aggregationResult,
    });
  } catch (error) {
    console.error('Error fetching insurance sales by customer:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance sales by customer',
      error: error.message,
    });
  }
};

