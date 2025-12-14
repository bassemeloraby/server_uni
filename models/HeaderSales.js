import mongoose from 'mongoose';

const headerSalesSchema = new mongoose.Schema({
  StoreCode: {
    type: Number,
    required: [true, 'Store code is required'],
  },
  InvoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true,
  },
  Year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2000, 'Year must be valid'],
    max: [2100, 'Year must be valid'],
  },
  Month: {
    type: String,
    required: [true, 'Month is required'],
    trim: true,
    enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  Date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  Time: {
    type: String,
    required: [true, 'Time is required'],
    trim: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'],
  },
  InvoiceType: {
    type: String,
    required: [true, 'Invoice type is required'],
    trim: true,
  },
  CustomerName: {
    type: String,
    trim: true,
    default: '',
  },
  ConsumerName: {
    type: String,
    trim: true,
    default: '',
  },
  UserName: {
    type: String,
    trim: true,
    default: '',
  },
  TotalAmountAfterDiscount: {
    type: Number,
    required: [true, 'Total amount after discount is required'],
    min: [0, 'Total amount must be a positive number'],
  },
}, {
  timestamps: true,
});

// Index for faster search
headerSalesSchema.index({ StoreCode: 1 });
headerSalesSchema.index({ InvoiceNumber: 1 });
headerSalesSchema.index({ Date: -1 });
headerSalesSchema.index({ Year: 1, Month: 1 });
headerSalesSchema.index({ UserName: 'text' });
headerSalesSchema.index({ CustomerName: 'text' });
headerSalesSchema.index({ ConsumerName: 'text' });

const HeaderSales = mongoose.model('HeaderSales', headerSalesSchema);

export default HeaderSales;

