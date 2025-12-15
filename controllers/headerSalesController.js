import HeaderSales from '../models/HeaderSales.js';
import colors from 'colors';

// @desc    Get all header sales
// @route   GET /api/header-sales
// @access  Private
export const getHeaderSales = async (req, res) => {
  try {
    const { 
      StoreCode, 
      InvoiceNumber,
      Year,
      Month,
      Date,
      InvoiceType,
      UserName,
      CustomerName,
      ConsumerName,
      minAmount,
      maxAmount,
      page = 1,
      limit = 50,
      sortByDate,
      sortByAmount
    } = req.query;
    
    // Build query object
    const query = {};
    
    if (StoreCode) {
      query.StoreCode = parseInt(StoreCode);
    }
    
    if (InvoiceNumber) {
      query.InvoiceNumber = new RegExp(InvoiceNumber, 'i');
    }
    
    if (Year) {
      query.Year = parseInt(Year);
    }
    
    if (Month) {
      query.Month = Month;
    }
    
    if (Date) {
      query.Date = new Date(Date);
    }
    
    if (InvoiceType) {
      query.InvoiceType = new RegExp(InvoiceType, 'i');
    }
    
    if (UserName) {
      query.UserName = new RegExp(UserName, 'i');
    }
    
    if (CustomerName) {
      query.CustomerName = new RegExp(CustomerName, 'i');
    }
    
    if (ConsumerName) {
      query.ConsumerName = new RegExp(ConsumerName, 'i');
    }
    
    if (minAmount || maxAmount) {
      query.TotalAmountAfterDiscount = {};
      if (minAmount) {
        query.TotalAmountAfterDiscount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        query.TotalAmountAfterDiscount.$lte = parseFloat(maxAmount);
      }
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Determine sort order
    let sortOrder = { createdAt: -1 }; // Default sort
    if (sortByDate === 'desc' || sortByDate === 'true') {
      sortOrder = { Date: -1 };
    } else if (sortByDate === 'asc') {
      sortOrder = { Date: 1 };
    } else if (sortByAmount === 'desc' || sortByAmount === 'true') {
      sortOrder = { TotalAmountAfterDiscount: -1 };
    } else if (sortByAmount === 'asc') {
      sortOrder = { TotalAmountAfterDiscount: 1 };
    }
    
    const headerSales = await HeaderSales.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum);
    
    const total = await HeaderSales.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: headerSales.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: headerSales,
    });
  } catch (error) {
    console.error('Error fetching header sales:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching header sales',
      error: error.message,
    });
  }
};

// @desc    Get single header sale
// @route   GET /api/header-sales/:id
// @access  Private
export const getHeaderSale = async (req, res) => {
  try {
    const headerSale = await HeaderSales.findById(req.params.id);
    
    if (!headerSale) {
      return res.status(404).json({
        success: false,
        message: 'Header sale not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: headerSale,
    });
  } catch (error) {
    console.error('Error fetching header sale:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching header sale',
      error: error.message,
    });
  }
};

// @desc    Create new header sale
// @route   POST /api/header-sales
// @access  Private
export const createHeaderSale = async (req, res) => {
  try {
    const headerSale = await HeaderSales.create(req.body);
    
    res.status(201).json({
      success: true,
      data: headerSale,
    });
  } catch (error) {
    console.error('Error creating header sale:'.red, error);
    
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
      message: 'Error creating header sale',
      error: error.message,
    });
  }
};

// @desc    Update header sale
// @route   PUT /api/header-sales/:id
// @access  Private
export const updateHeaderSale = async (req, res) => {
  try {
    const headerSale = await HeaderSales.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!headerSale) {
      return res.status(404).json({
        success: false,
        message: 'Header sale not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: headerSale,
    });
  } catch (error) {
    console.error('Error updating header sale:'.red, error);
    
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
      message: 'Error updating header sale',
      error: error.message,
    });
  }
};

// @desc    Delete header sale
// @route   DELETE /api/header-sales/:id
// @access  Private
export const deleteHeaderSale = async (req, res) => {
  try {
    const headerSale = await HeaderSales.findByIdAndDelete(req.params.id);
    
    if (!headerSale) {
      return res.status(404).json({
        success: false,
        message: 'Header sale not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Header sale deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting header sale:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting header sale',
      error: error.message,
    });
  }
};

// @desc    Bulk create header sales
// @route   POST /api/header-sales/bulk
// @access  Private
export const bulkCreateHeaderSales = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty',
      });
    }
    
    const headerSales = await HeaderSales.insertMany(items, {
      ordered: false,
    });
    
    res.status(201).json({
      success: true,
      count: headerSales.length,
      data: headerSales,
    });
  } catch (error) {
    console.error('Error bulk creating header sales:'.red, error);
    
    if (error.writeErrors) {
      return res.status(400).json({
        success: false,
        message: 'Some items failed to create',
        errors: error.writeErrors.map(err => ({
          index: err.index,
          error: err.errmsg,
        })),
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error bulk creating header sales',
      error: error.message,
    });
  }
};

// @desc    Get header sales grouped by month
// @route   GET /api/header-sales/by-month
// @access  Private
export const getHeaderSalesByMonth = async (req, res) => {
  try {
    const { Year } = req.query;
    
    // Build match query
    const matchQuery = {};
    if (Year) {
      matchQuery.Year = parseInt(Year);
    }
    
    // Aggregation pipeline to group by Year and Month, and sum TotalAmountAfterDiscount
    const salesByMonth = await HeaderSales.aggregate([
      // Match documents based on year filter
      { $match: matchQuery },
      // Group by Year and Month, sum TotalAmountAfterDiscount
      {
        $group: {
          _id: {
            Year: '$Year',
            Month: '$Month'
          },
          TotalAmountAfterDiscount: { $sum: '$TotalAmountAfterDiscount' },
          count: { $sum: 1 }
        }
      },
      // Sort by Year and Month
      {
        $sort: {
          '_id.Year': 1,
          '_id.Month': 1
        }
      },
      // Project to reshape the output
      {
        $project: {
          _id: 0,
          Year: '$_id.Year',
          Month: '$_id.Month',
          TotalAmountAfterDiscount: 1,
          count: 1
        }
      }
    ]);
    
    // Get all available years for the filter
    const availableYears = await HeaderSales.distinct('Year');
    const sortedYears = availableYears.sort((a, b) => b - a); // Sort descending
    
    res.status(200).json({
      success: true,
      data: salesByMonth,
      availableYears: sortedYears,
      selectedYear: Year ? parseInt(Year) : null,
    });
  } catch (error) {
    console.error('Error fetching header sales by month:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching header sales by month',
      error: error.message,
    });
  }
};

// @desc    Get cash header sales grouped by month with invoice type totals
// @route   GET /api/header-sales/cash-by-month
// @access  Private
export const getCashHeaderSalesByMonth = async (req, res) => {
  try {
    const { Year } = req.query;
    
    // Build match query
    const matchQuery = {};
    if (Year) {
      matchQuery.Year = parseInt(Year);
    }
    
    // Aggregation pipeline to group by Year and Month, and calculate totals by invoice type
    const salesByMonth = await HeaderSales.aggregate([
      // Match documents based on year filter
      { $match: matchQuery },
      // Group by Year and Month, calculate totals for each invoice type
      {
        $group: {
          _id: {
            Year: '$Year',
            Month: '$Month'
          },
          CashCustomer: {
            $sum: {
              $cond: [{ $eq: ['$InvoiceType', 'CashCustomer'] }, '$TotalAmountAfterDiscount', 0]
            }
          },
          CreditCustomer: {
            $sum: {
              $cond: [{ $eq: ['$InvoiceType', 'CreditCustomer'] }, '$TotalAmountAfterDiscount', 0]
            }
          },
          Normal: {
            $sum: {
              $cond: [{ $eq: ['$InvoiceType', 'Normal'] }, '$TotalAmountAfterDiscount', 0]
            }
          },
          Online: {
            $sum: {
              $cond: [{ $eq: ['$InvoiceType', 'Online'] }, '$TotalAmountAfterDiscount', 0]
            }
          },
          Return: {
            $sum: {
              $cond: [{ $eq: ['$InvoiceType', 'Return'] }, '$TotalAmountAfterDiscount', 0]
            }
          },
          ReturnCashCustomer: {
            $sum: {
              $cond: [{ $eq: ['$InvoiceType', 'ReturnCashCustomer'] }, '$TotalAmountAfterDiscount', 0]
            }
          },
          ReturnCreditCustomer: {
            $sum: {
              $cond: [{ $eq: ['$InvoiceType', 'ReturnCreditCustomer'] }, '$TotalAmountAfterDiscount', 0]
            }
          },
          ReturnOnline: {
            $sum: {
              $cond: [{ $eq: ['$InvoiceType', 'ReturnOnline'] }, '$TotalAmountAfterDiscount', 0]
            }
          },
          totalCount: { $sum: 1 }
        }
      },
      // Sort by Year and Month
      {
        $sort: {
          '_id.Year': 1,
          '_id.Month': 1
        }
      },
      // Project to reshape the output and calculate Total for each month
      {
        $project: {
          _id: 0,
          Year: '$_id.Year',
          Month: '$_id.Month',
          CashCustomer: 1,
          CreditCustomer: 1,
          Normal: 1,
          Online: 1,
          Return: 1,
          ReturnCashCustomer: 1,
          ReturnCreditCustomer: 1,
          ReturnOnline: 1,
          totalCount: 1,
          Total: {
            $add: [
              '$CashCustomer',
              '$CreditCustomer',
              '$Normal',
              '$Online',
              '$Return',
              '$ReturnCashCustomer',
              '$ReturnCreditCustomer',
              '$ReturnOnline'
            ]
          }
        }
      }
    ]);
    
    // Calculate grand totals for all months
    const grandTotals = salesByMonth.reduce((acc, item) => {
      acc.CashCustomer += item.CashCustomer || 0;
      acc.CreditCustomer += item.CreditCustomer || 0;
      acc.Normal += item.Normal || 0;
      acc.Online += item.Online || 0;
      acc.Return += item.Return || 0;
      acc.ReturnCashCustomer += item.ReturnCashCustomer || 0;
      acc.ReturnCreditCustomer += item.ReturnCreditCustomer || 0;
      acc.ReturnOnline += item.ReturnOnline || 0;
      acc.Total += item.Total || 0;
      acc.totalCount += item.totalCount || 0;
      return acc;
    }, {
      CashCustomer: 0,
      CreditCustomer: 0,
      Normal: 0,
      Online: 0,
      Return: 0,
      ReturnCashCustomer: 0,
      ReturnCreditCustomer: 0,
      ReturnOnline: 0,
      Total: 0,
      totalCount: 0
    });
    
    // Get all available years for the filter
    const availableYears = await HeaderSales.distinct('Year');
    const sortedYears = availableYears.sort((a, b) => b - a); // Sort descending
    
    res.status(200).json({
      success: true,
      data: salesByMonth,
      grandTotals: grandTotals,
      availableYears: sortedYears,
      selectedYear: Year ? parseInt(Year) : null,
    });
  } catch (error) {
    console.error('Error fetching cash header sales by month:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cash header sales by month',
      error: error.message,
    });
  }
};

// @desc    Get insurance header sales grouped by month with invoice type totals
// @route   GET /api/header-sales/insurance-by-month
// @access  Private
export const getInsuranceHeaderSalesByMonth = async (req, res) => {
  try {
    const { Year } = req.query;
    
    // Build match query - filter for insurance-related invoice types
    const matchQuery = {
      InvoiceType: { $regex: /insurance/i } // Case-insensitive match for insurance
    };
    if (Year) {
      matchQuery.Year = parseInt(Year);
    }
    
    // First, get all distinct insurance invoice types
    const insuranceInvoiceTypes = await HeaderSales.distinct('InvoiceType', {
      InvoiceType: { $regex: /insurance/i }
    });
    
    console.log('Insurance invoice types found:'.green, insuranceInvoiceTypes);
    
    // If no insurance invoice types found, return empty result
    if (!insuranceInvoiceTypes || insuranceInvoiceTypes.length === 0) {
      const availableYears = await HeaderSales.distinct('Year', {
        InvoiceType: { $regex: /insurance/i }
      });
      return res.status(200).json({
        success: true,
        data: [],
        grandTotals: {
          Total: 0,
          totalCount: 0
        },
        availableYears: availableYears.sort((a, b) => b - a),
        selectedYear: Year ? parseInt(Year) : null,
        insuranceInvoiceTypes: [],
      });
    }
    
    // Build dynamic group stage with all insurance invoice types
    const groupStage = {
      _id: {
        Year: '$Year',
        Month: '$Month'
      },
      totalCount: { $sum: 1 }
    };
    
    // Add a field for each insurance invoice type
    insuranceInvoiceTypes.forEach(invoiceType => {
      groupStage[invoiceType] = {
        $sum: {
          $cond: [{ $eq: ['$InvoiceType', invoiceType] }, '$TotalAmountAfterDiscount', 0]
        }
      };
    });
    
    // Aggregation pipeline to group by Year and Month, and calculate totals by invoice type
    const salesByMonth = await HeaderSales.aggregate([
      // Match documents based on year filter and insurance invoice types
      { $match: matchQuery },
      // Group by Year and Month, calculate totals for each insurance invoice type
      {
        $group: groupStage
      },
      // Sort by Year and Month
      {
        $sort: {
          '_id.Year': 1,
          '_id.Month': 1
        }
      },
      // Project to reshape the output and calculate Total for each month
      {
        $project: (() => {
          const projectStage = {
            _id: 0,
            Year: '$_id.Year',
            Month: '$_id.Month',
            totalCount: 1
          };
          
          // Dynamically include all insurance invoice types
          insuranceInvoiceTypes.forEach(type => {
            projectStage[type] = 1;
          });
          
          // Calculate total by summing all insurance invoice types
          if (insuranceInvoiceTypes.length > 0) {
            const addArray = insuranceInvoiceTypes.map(type => {
              // Escape special characters in field names if needed
              return `$${type}`;
            });
            projectStage.Total = { $add: addArray };
          } else {
            projectStage.Total = 0;
          }
          
          return projectStage;
        })()
      }
    ]);
    
    // Calculate grand totals for all months
    const grandTotals = salesByMonth.reduce((acc, item) => {
      insuranceInvoiceTypes.forEach(type => {
        acc[type] = (acc[type] || 0) + (item[type] || 0);
      });
      acc.Total = (acc.Total || 0) + (item.Total || 0);
      acc.totalCount = (acc.totalCount || 0) + (item.totalCount || 0);
      return acc;
    }, {
      Total: 0,
      totalCount: 0
    });
    
    // Initialize all invoice types in grandTotals
    insuranceInvoiceTypes.forEach(type => {
      if (!grandTotals[type]) {
        grandTotals[type] = 0;
      }
    });
    
    // Get all available years for the filter
    const availableYears = await HeaderSales.distinct('Year', {
      InvoiceType: { $regex: /insurance/i }
    });
    const sortedYears = availableYears.sort((a, b) => b - a); // Sort descending
    
    console.log('Insurance sales by month result:'.green, {
      count: salesByMonth.length,
      years: sortedYears,
      invoiceTypes: insuranceInvoiceTypes
    });
    
    res.status(200).json({
      success: true,
      data: salesByMonth,
      grandTotals: grandTotals,
      availableYears: sortedYears,
      selectedYear: Year ? parseInt(Year) : null,
      insuranceInvoiceTypes: insuranceInvoiceTypes,
    });
  } catch (error) {
    console.error('Error fetching insurance header sales by month:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance header sales by month',
      error: error.message,
    });
  }
};

// @desc    Get Wasfaty header sales grouped by month with Wasfaty and ReturnWasfaty totals
// @route   GET /api/header-sales/wasfaty-by-month
// @access  Private
export const getWasfatyHeaderSalesByMonth = async (req, res) => {
  try {
    const { Year } = req.query;

    // Build match query - filter for Wasfaty-related invoice types
    const matchQuery = {
      InvoiceType: { $regex: /wasf/i },
    };
    if (Year) {
      matchQuery.Year = parseInt(Year);
    }

    // Aggregation pipeline to group by Year and Month, and calculate totals for Wasfaty and ReturnWasfaty
    const salesByMonth = await HeaderSales.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            Year: '$Year',
            Month: '$Month',
          },
          Wasfaty: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $regexMatch: { input: '$InvoiceType', regex: /wasf/i } },
                    { $not: [{ $regexMatch: { input: '$InvoiceType', regex: /return/i } }] },
                  ],
                },
                '$TotalAmountAfterDiscount',
                0,
              ],
            },
          },
          ReturnWasfaty: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $regexMatch: { input: '$InvoiceType', regex: /wasf/i } },
                    { $regexMatch: { input: '$InvoiceType', regex: /return/i } },
                  ],
                },
                '$TotalAmountAfterDiscount',
                0,
              ],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.Year': 1,
          '_id.Month': 1,
        },
      },
      {
        $project: {
          _id: 0,
          Year: '$_id.Year',
          Month: '$_id.Month',
          Wasfaty: 1,
          ReturnWasfaty: 1,
          totalCount: 1,
          Total: {
            $add: ['$Wasfaty', '$ReturnWasfaty'],
          },
        },
      },
    ]);

    // Calculate grand totals for all months
    const grandTotals = salesByMonth.reduce(
      (acc, item) => {
        acc.Wasfaty += item.Wasfaty || 0;
        acc.ReturnWasfaty += item.ReturnWasfaty || 0;
        acc.Total += item.Total || 0;
        acc.totalCount += item.totalCount || 0;
        return acc;
      },
      {
        Wasfaty: 0,
        ReturnWasfaty: 0,
        Total: 0,
        totalCount: 0,
      }
    );

    // Get all available years for the filter (only where Wasfaty/ReturnWasfaty exists)
    const availableYears = await HeaderSales.distinct('Year', {
      InvoiceType: { $regex: /wasf/i },
    });
    const sortedYears = availableYears.sort((a, b) => b - a);

    res.status(200).json({
      success: true,
      data: salesByMonth,
      grandTotals,
      availableYears: sortedYears,
      selectedYear: Year ? parseInt(Year) : null,
    });
  } catch (error) {
    console.error('Error fetching Wasfaty header sales by month:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Wasfaty header sales by month',
      error: error.message,
    });
  }
};

// @desc    Get Online header sales (Online + ReturnOnline) grouped by month
// @route   GET /api/header-sales/online-by-month
// @access  Private
export const getOnlineHeaderSalesByMonth = async (req, res) => {
  try {
    const { Year } = req.query;

    // Build match query - filter for Online-related invoice types
    const matchQuery = {
      InvoiceType: { $in: ['Online', 'ReturnOnline'] },
    };
    if (Year) {
      matchQuery.Year = parseInt(Year);
    }

    // Aggregation pipeline to group by Year and Month, and calculate totals for Online and ReturnOnline
    const salesByMonth = await HeaderSales.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            Year: '$Year',
            Month: '$Month',
          },
          Online: {
            $sum: {
              $cond: [
                { $eq: ['$InvoiceType', 'Online'] },
                '$TotalAmountAfterDiscount',
                0,
              ],
            },
          },
          ReturnOnline: {
            $sum: {
              $cond: [
                { $eq: ['$InvoiceType', 'ReturnOnline'] },
                '$TotalAmountAfterDiscount',
                0,
              ],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.Year': 1,
          '_id.Month': 1,
        },
      },
      {
        $project: {
          _id: 0,
          Year: '$_id.Year',
          Month: '$_id.Month',
          Online: 1,
          ReturnOnline: 1,
          totalCount: 1,
          // Online total = Online + ReturnOnline
          Total: {
            $add: ['$Online', '$ReturnOnline'],
          },
        },
      },
    ]);

    // Calculate grand totals for all months
    const grandTotals = salesByMonth.reduce(
      (acc, item) => {
        acc.Online += item.Online || 0;
        acc.ReturnOnline += item.ReturnOnline || 0;
        acc.Total += item.Total || 0;
        acc.totalCount += item.totalCount || 0;
        return acc;
      },
      {
        Online: 0,
        ReturnOnline: 0,
        Total: 0,
        totalCount: 0,
      }
    );

    // Get all available years for the filter (only where Online/ReturnOnline exists)
    const availableYears = await HeaderSales.distinct('Year', {
      InvoiceType: { $in: ['Online', 'ReturnOnline'] },
    });
    const sortedYears = availableYears.sort((a, b) => b - a);

    res.status(200).json({
      success: true,
      data: salesByMonth,
      grandTotals,
      availableYears: sortedYears,
      selectedYear: Year ? parseInt(Year) : null,
    });
  } catch (error) {
    console.error('Error fetching Online header sales by month:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Online header sales by month',
      error: error.message,
    });
  }
};
