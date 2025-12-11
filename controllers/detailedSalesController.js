import DetailedSales from '../models/DetailedSales.js';
import Pharmacy from '../models/Pharmacy.js';
import mongoose from 'mongoose';
import colors from 'colors';

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
      invoiceType, 
      salesName, 
      materialNumber,
      startDate,
      endDate,
      search,
      customerName,
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

    if (customerName) {
      query.CustomerName = new RegExp(customerName, 'i');
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
// @access  Private - Admin only
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
    
    // Only admin can access detailed sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view detailed sales.',
        reason: 'You must be an administrator to access detailed sales.',
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

// @desc    Get cash detailed sales (filtered by specific customer names)
// @route   GET /api/detailed-sales/cash-detailed
// @access  Private - Admin only
export const getAllCashDetailedSales = async (req, res) => {
  try {
    const user = req.user;
    const { branchCode, year, month, limit, skip } = req.query;
    
    // Only admin can access detailed sales
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view detailed sales.',
        reason: 'You must be an administrator to access detailed sales.',
      });
    }

    // Allowed cash customer names
    const cashCustomerNames = [
      'N/A',
      'Milk Discount',
      'Hospitals & Clinics employee',
      'Ministry of Human Resources and Soc',
      'TAMARA',
      'Near Care',
      'Saudi Tabby for Communications and',
    ];

    // Build query
    const query = {
      CustomerName: { $in: cashCustomerNames },
    };

    if (branchCode) {
      query.BranchCode = parseInt(branchCode);
    }

    // Date filter by year-month if provided
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      query.InvoiceDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const pageLimit = parseInt(limit) || 100;
    const pageSkip = parseInt(skip) || 0;

    const cashSales = await DetailedSales.find(query)
      .sort({ InvoiceDate: -1, createdAt: -1 })
      .limit(pageLimit)
      .skip(pageSkip);

    const total = await DetailedSales.countDocuments(query);

    // Summary aggregation
    const summaryAgg = await DetailedSales.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$ItemsNetPrice' },
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: '$Quantity' },
          totalNetTotal: { $sum: '$NetTotal' },
        },
      },
    ]);

    const summary = summaryAgg.length > 0 ? summaryAgg[0] : {
      totalSales: 0,
      totalTransactions: 0,
      totalQuantity: 0,
      totalNetTotal: 0,
    };

    res.status(200).json({
      success: true,
      count: cashSales.length,
      total,
      data: cashSales,
      summary: {
        totalSales: summary.totalSales || 0,
        totalTransactions: summary.totalTransactions || 0,
        totalQuantity: summary.totalQuantity || 0,
        totalNetTotal: summary.totalNetTotal || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching cash detailed sales:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cash detailed sales',
      error: error.message,
    });
  }
};

// @desc    Get cash detailed sales statistics grouped by CustomerName
// @route   GET /api/detailed-sales/cash-detailed/statistics
// @access  Private - Admin only
export const getCashDetailedSalesStatistics = async (req, res) => {
  try {
    const user = req.user;
    const { branchCode, year, month } = req.query;

    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view detailed sales.',
        reason: 'You must be an administrator to access detailed sales.',
      });
    }

    const cashCustomerNames = [
      'N/A',
      'Milk Discount',
      'Hospitals & Clinics employee',
      'Ministry of Human Resources and Soc',
      'TAMARA',
      'Near Care',
      'Saudi Tabby for Communications and',
    ];

    const match = {
      CustomerName: { $in: cashCustomerNames },
    };

    if (branchCode) {
      match.BranchCode = parseInt(branchCode);
    }

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      match.InvoiceDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const stats = await DetailedSales.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$CustomerName',
          totalSales: { $sum: '$ItemsNetPrice' },
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: '$Quantity' },
          totalNetTotal: { $sum: '$NetTotal' },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    const statistics = stats.map((item) => ({
      customerName: item._id,
      totalSales: item.totalSales || 0,
      totalTransactions: item.totalTransactions || 0,
      totalQuantity: item.totalQuantity || 0,
      totalNetTotal: item.totalNetTotal || 0,
    }));

    const grandTotalSales = statistics.reduce((sum, s) => sum + s.totalSales, 0);
    const grandTotalTransactions = statistics.reduce((sum, s) => sum + s.totalTransactions, 0);
    const grandTotalQuantity = statistics.reduce((sum, s) => sum + s.totalQuantity, 0);

    res.status(200).json({
      success: true,
      data: {
        statistics,
        summary: {
          totalCustomers: statistics.length,
          totalSales: grandTotalSales,
          totalTransactions: grandTotalTransactions,
          totalQuantity: grandTotalQuantity,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching cash detailed sales statistics:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cash detailed sales statistics',
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
    
    const existingSale = await DetailedSales.findById(req.params.id);
    
    if (!existingSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
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
    
    const existingSale = await DetailedSales.findById(req.params.id);
    
    if (!existingSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
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
// @access  Private - Admin only
export const getSalesStatistics = async (req, res) => {
  try {
    const user = req.user;
    const { branchCode, startDate, endDate } = req.query;
    
    // Only admin can access sales statistics
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view sales statistics.',
        reason: 'You must be an administrator to access sales statistics.',
      });
    }
    
    const query = {};
    
    if (branchCode) {
      query.BranchCode = parseInt(branchCode);
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
// @access  Private - Admin only
export const getPharmaciesByBranchCode = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access pharmacy statistics
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view pharmacy statistics.',
        reason: 'You must be an administrator to access pharmacy statistics.',
      });
    }
    
    // Build query for branch codes
    let branchCodeQuery = {};
    
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
        const pharmacyCount = await Pharmacy.countDocuments(pharmacyQuery);
        return {
          branchCode,
          pharmacyCount,
          totalSales: salesMap[branchCode] || 0,
        };
      })
    );
    
    // Sort by branch code
    statistics.sort((a, b) => a.branchCode - b.branchCode);
    
    // Calculate totals
    const totalPharmacies = await Pharmacy.countDocuments();
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
// @access  Private - Admin only
export const getSalesBySalesName = async (req, res) => {
  try {
    const user = req.user;
    const { branchCode, year, month } = req.query;
    
    // Only admin can access sales statistics
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view sales statistics.',
        reason: 'You must be an administrator to access sales statistics.',
      });
    }
    
    // Build query for branch codes and date range
    let query = {};
    
    if (branchCode) {
      query.BranchCode = parseInt(branchCode);
    }
    
    // Add date filter if year and month are provided
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      
      query.InvoiceDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }
    
    // Aggregate sales by SalesName (filtered by supervisor if applicable)
    const salesByName = await DetailedSales.aggregate([
      ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
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
// @access  Private - Admin only
export const getSalesByInvoiceType = async (req, res) => {
  try {
    const user = req.user;
    const { branchCode, year, month } = req.query;
    
    // Only admin can access sales statistics
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view sales statistics.',
        reason: 'You must be an administrator to access sales statistics.',
      });
    }
    
    // Build query for branch codes and date range
    let query = {};
    
    if (branchCode) {
      query.BranchCode = parseInt(branchCode);
    }
    
    // Add date filter if year and month are provided
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      
      query.InvoiceDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }
    
    // Aggregate sales by InvoiceType (filtered by supervisor if applicable)
    const salesByInvoiceType = await DetailedSales.aggregate([
      ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
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
    
    // Find and combine insurance and returninsurance into Total insurance
    const insuranceStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'insurance'
    );
    const returnInsuranceStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'returninsurance'
    );
    
    // Find and combine Online and ReturnOnline into Total Online
    const onlineStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'online'
    );
    const returnOnlineStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'returnonline'
    );
    
    // Find and combine CashCustomer and ReturnCashCustomer into Total CashCustomer
    const cashCustomerStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'cashcustomer'
    );
    const returnCashCustomerStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'returncashcustomer'
    );
    
    // Find and combine CreditCustomer and ReturnCreditCustomer into Total CreditCustomer
    const creditCustomerStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'creditcustomer'
    );
    const returnCreditCustomerStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'returncreditcustomer'
    );
    
    // Find and combine Wasfaty and ReturnWasfaty into Total Wasfaty
    const wasfatyStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'wasfaty'
    );
    const returnWasfatyStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'returnwasfaty'
    );
    
    // Find and combine Normal and Return into Total Normal
    const normalStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'normal'
    );
    const returnStat = statistics.find(stat => 
      stat.invoiceType && stat.invoiceType.toLowerCase() === 'return'
    );
    
    // Filter out insurance, returninsurance, online, returnonline, cashcustomer, returncashcustomer, creditcustomer, returncreditcustomer, wasfaty, returnwasfaty, normal, and return
    const filteredStatistics = statistics.filter(stat => {
      const invoiceTypeLower = stat.invoiceType?.toLowerCase();
      return invoiceTypeLower !== 'insurance' && 
             invoiceTypeLower !== 'returninsurance' &&
             invoiceTypeLower !== 'online' &&
             invoiceTypeLower !== 'returnonline' &&
             invoiceTypeLower !== 'cashcustomer' &&
             invoiceTypeLower !== 'returncashcustomer' &&
             invoiceTypeLower !== 'creditcustomer' &&
             invoiceTypeLower !== 'returncreditcustomer' &&
             invoiceTypeLower !== 'wasfaty' &&
             invoiceTypeLower !== 'returnwasfaty' &&
             invoiceTypeLower !== 'normal' &&
             invoiceTypeLower !== 'return';
    });
    
    // Add Total insurance if insurance or returninsurance exists
    if (insuranceStat || returnInsuranceStat) {
      const totalInsuranceEntry = {
        invoiceType: 'Total insurance',
        totalSales: (insuranceStat?.totalSales || 0) + (returnInsuranceStat?.totalSales || 0),
        totalTransactions: (insuranceStat?.totalTransactions || 0) + (returnInsuranceStat?.totalTransactions || 0),
        totalQuantity: (insuranceStat?.totalQuantity || 0) + (returnInsuranceStat?.totalQuantity || 0),
        totalNetTotal: (insuranceStat?.totalNetTotal || 0) + (returnInsuranceStat?.totalNetTotal || 0),
      };
      filteredStatistics.push(totalInsuranceEntry);
    }
    
    // Add Total Online if Online or ReturnOnline exists
    if (onlineStat || returnOnlineStat) {
      const totalOnlineEntry = {
        invoiceType: 'Total Online',
        totalSales: (onlineStat?.totalSales || 0) + (returnOnlineStat?.totalSales || 0),
        totalTransactions: (onlineStat?.totalTransactions || 0) + (returnOnlineStat?.totalTransactions || 0),
        totalQuantity: (onlineStat?.totalQuantity || 0) + (returnOnlineStat?.totalQuantity || 0),
        totalNetTotal: (onlineStat?.totalNetTotal || 0) + (returnOnlineStat?.totalNetTotal || 0),
      };
      filteredStatistics.push(totalOnlineEntry);
    }
    
    // Add Total CashCustomer if CashCustomer or ReturnCashCustomer exists
    if (cashCustomerStat || returnCashCustomerStat) {
      const totalCashCustomerEntry = {
        invoiceType: 'Total CashCustomer',
        totalSales: (cashCustomerStat?.totalSales || 0) + (returnCashCustomerStat?.totalSales || 0),
        totalTransactions: (cashCustomerStat?.totalTransactions || 0) + (returnCashCustomerStat?.totalTransactions || 0),
        totalQuantity: (cashCustomerStat?.totalQuantity || 0) + (returnCashCustomerStat?.totalQuantity || 0),
        totalNetTotal: (cashCustomerStat?.totalNetTotal || 0) + (returnCashCustomerStat?.totalNetTotal || 0),
      };
      filteredStatistics.push(totalCashCustomerEntry);
    }
    
    // Add Total CreditCustomer if CreditCustomer or ReturnCreditCustomer exists
    if (creditCustomerStat || returnCreditCustomerStat) {
      const totalCreditCustomerEntry = {
        invoiceType: 'Total CreditCustomer',
        totalSales: (creditCustomerStat?.totalSales || 0) + (returnCreditCustomerStat?.totalSales || 0),
        totalTransactions: (creditCustomerStat?.totalTransactions || 0) + (returnCreditCustomerStat?.totalTransactions || 0),
        totalQuantity: (creditCustomerStat?.totalQuantity || 0) + (returnCreditCustomerStat?.totalQuantity || 0),
        totalNetTotal: (creditCustomerStat?.totalNetTotal || 0) + (returnCreditCustomerStat?.totalNetTotal || 0),
      };
      filteredStatistics.push(totalCreditCustomerEntry);
    }
    
    // Add Total Wasfaty if Wasfaty or ReturnWasfaty exists
    if (wasfatyStat || returnWasfatyStat) {
      const totalWasfatyEntry = {
        invoiceType: 'Total Wasfaty',
        totalSales: (wasfatyStat?.totalSales || 0) + (returnWasfatyStat?.totalSales || 0),
        totalTransactions: (wasfatyStat?.totalTransactions || 0) + (returnWasfatyStat?.totalTransactions || 0),
        totalQuantity: (wasfatyStat?.totalQuantity || 0) + (returnWasfatyStat?.totalQuantity || 0),
        totalNetTotal: (wasfatyStat?.totalNetTotal || 0) + (returnWasfatyStat?.totalNetTotal || 0),
      };
      filteredStatistics.push(totalWasfatyEntry);
    }
    
    // Add Total Normal if Normal or Return exists
    if (normalStat || returnStat) {
      const totalNormalEntry = {
        invoiceType: 'Total Normal',
        totalSales: (normalStat?.totalSales || 0) + (returnStat?.totalSales || 0),
        totalTransactions: (normalStat?.totalTransactions || 0) + (returnStat?.totalTransactions || 0),
        totalQuantity: (normalStat?.totalQuantity || 0) + (returnStat?.totalQuantity || 0),
        totalNetTotal: (normalStat?.totalNetTotal || 0) + (returnStat?.totalNetTotal || 0),
      };
      filteredStatistics.push(totalNormalEntry);
    }
    
    // Calculate totals based on filtered statistics
    const totalInvoiceTypes = filteredStatistics.length;
    const grandTotalSales = filteredStatistics.reduce((sum, stat) => sum + stat.totalSales, 0);
    const grandTotalTransactions = filteredStatistics.reduce((sum, stat) => sum + stat.totalTransactions, 0);
    const grandTotalQuantity = filteredStatistics.reduce((sum, stat) => sum + stat.totalQuantity, 0);
    
    // Calculate percentage for each invoice type
    const statisticsWithPercentage = filteredStatistics.map((stat) => ({
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

// @desc    Get sales statistics by month
// @route   GET /api/detailed-sales/stats/sales-by-month
// @access  Private - Admin only
export const getSalesByMonth = async (req, res) => {
  try {
    const user = req.user;
    const { branchCode } = req.query;
    
    // Only admin can access sales statistics
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view sales statistics.',
        reason: 'You must be an administrator to access sales statistics.',
      });
    }
    
    // Build query for branch codes
    let branchCodeQuery = {};
    
    if (branchCode) {
      branchCodeQuery = { BranchCode: parseInt(branchCode) };
    }
    
    // Aggregate sales by month
    const salesByMonth = await DetailedSales.aggregate([
      ...(Object.keys(branchCodeQuery).length > 0 ? [{ $match: branchCodeQuery }] : []),
      {
        $group: {
          _id: {
            year: { $year: '$InvoiceDate' },
            month: { $month: '$InvoiceDate' },
          },
          totalSales: { $sum: '$ItemsNetPrice' },
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: '$Quantity' },
          totalNetTotal: { $sum: '$NetTotal' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }, // Sort by year and month ascending
      },
    ]);
    
    // Get count of unique days with invoices per month
    const daysWithInvoices = await DetailedSales.aggregate([
      ...(Object.keys(branchCodeQuery).length > 0 ? [{ $match: branchCodeQuery }] : []),
      {
        $group: {
          _id: {
            year: { $year: '$InvoiceDate' },
            month: { $month: '$InvoiceDate' },
            day: { $dayOfMonth: '$InvoiceDate' },
          },
        },
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
          },
          uniqueDays: { $sum: 1 },
        },
      },
    ]);
    
    // Create a map for quick lookup
    const daysMap = {};
    daysWithInvoices.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      daysMap[key] = item.uniqueDays;
    });
    
    // Format the results
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const statistics = salesByMonth.map((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      const daysWithInvoicesCount = daysMap[key] || 0;
      const totalSales = item.totalSales || 0;
      const averageSalesPerDay = daysWithInvoicesCount > 0 ? totalSales / daysWithInvoicesCount : 0;
      
      return {
        year: item._id.year,
        month: item._id.month,
        monthName: monthNames[item._id.month - 1],
        monthYear: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        totalSales: totalSales,
        totalTransactions: item.totalTransactions || 0,
        totalQuantity: item.totalQuantity || 0,
        totalNetTotal: item.totalNetTotal || 0,
        averageSalesPerDay: averageSalesPerDay,
        daysWithInvoices: daysWithInvoicesCount,
      };
    });
    
    // Calculate totals
    const totalMonths = statistics.length;
    const grandTotalSales = statistics.reduce((sum, stat) => sum + stat.totalSales, 0);
    const grandTotalTransactions = statistics.reduce((sum, stat) => sum + stat.totalTransactions, 0);
    const grandTotalQuantity = statistics.reduce((sum, stat) => sum + stat.totalQuantity, 0);
    
    // Calculate percentage for each month
    const statisticsWithPercentage = statistics.map((stat) => ({
      ...stat,
      percentage: grandTotalSales > 0 ? (stat.totalSales / grandTotalSales) * 100 : 0,
    }));
    
    res.status(200).json({
      success: true,
      data: {
        statistics: statisticsWithPercentage,
        summary: {
          totalMonths,
          totalSales: grandTotalSales,
          totalTransactions: grandTotalTransactions,
          totalQuantity: grandTotalQuantity,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sales statistics by month:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales statistics by month',
      error: error.message,
    });
  }
};

// @desc    Get sales statistics by day for a specific month
// @route   GET /api/detailed-sales/stats/sales-by-day
// @access  Private - Admin only
export const getSalesByDay = async (req, res) => {
  try {
    const user = req.user;
    const { branchCode, year, month } = req.query;
    
    // Only admin can access sales statistics
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view sales statistics.',
        reason: 'You must be an administrator to access sales statistics.',
      });
    }
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required',
      });
    }
    
    // Build query for branch codes and date range
    let query = {};
    
    if (branchCode) {
      query.BranchCode = parseInt(branchCode);
    }
    
    // Set date range for the specific month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    
    query.InvoiceDate = {
      $gte: startDate,
      $lte: endDate,
    };
    
    // Aggregate sales by day
    const salesByDay = await DetailedSales.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$InvoiceDate' },
            month: { $month: '$InvoiceDate' },
            day: { $dayOfMonth: '$InvoiceDate' },
          },
          totalSales: { $sum: '$ItemsNetPrice' },
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: '$Quantity' },
          totalNetTotal: { $sum: '$NetTotal' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }, // Sort by year, month, and day ascending
      },
    ]);
    
    // Format the results
    const statistics = salesByDay.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1, item._id.day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      return {
        year: item._id.year,
        month: item._id.month,
        day: item._id.day,
        date: date.toISOString().split('T')[0],
        dayName: dayName,
        dayLabel: `${item._id.day} (${dayName})`,
        totalSales: item.totalSales || 0,
        totalTransactions: item.totalTransactions || 0,
        totalQuantity: item.totalQuantity || 0,
        totalNetTotal: item.totalNetTotal || 0,
      };
    });
    
    // Calculate totals
    const totalDays = statistics.length;
    const grandTotalSales = statistics.reduce((sum, stat) => sum + stat.totalSales, 0);
    const grandTotalTransactions = statistics.reduce((sum, stat) => sum + stat.totalTransactions, 0);
    const grandTotalQuantity = statistics.reduce((sum, stat) => sum + stat.totalQuantity, 0);
    
    // Calculate percentage for each day
    const statisticsWithPercentage = statistics.map((stat) => ({
      ...stat,
      percentage: grandTotalSales > 0 ? (stat.totalSales / grandTotalSales) * 100 : 0,
    }));
    
    res.status(200).json({
      success: true,
      data: {
        statistics: statisticsWithPercentage,
        summary: {
          totalDays,
          totalSales: grandTotalSales,
          totalTransactions: grandTotalTransactions,
          totalQuantity: grandTotalQuantity,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sales statistics by day:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales statistics by day',
      error: error.message,
    });
  }
};

