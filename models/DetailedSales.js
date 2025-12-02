import mongoose from 'mongoose';

const detailedSalesSchema = new mongoose.Schema({
  BranchCode: {
    type: Number,
    required: [true, 'Branch code is required'],
  },
  InvoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true,
  },
  InvoiceDate: {
    type: Date,
    required: [true, 'Invoice date is required'],
  },
  InvoiceTime: {
    type: String,
    required: [true, 'Invoice time is required'],
    trim: true,
  },
  InvoiceType: {
    type: String,
    required: [true, 'Invoice type is required'],
    trim: true,
    enum: ['Normal', 'Return', 'Exchange', 'Other'],
    default: 'Normal',
  },
  SalesName: {
    type: String,
    required: [true, 'Sales name is required'],
    trim: true,
  },
  MaterialNumber: {
    type: Number,
    required: [true, 'Material number is required'],
  },
  Name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  UnitOfMeasurement: {
    type: String,
    required: [true, 'Unit of measurement is required'],
    trim: true,
  },
  Quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
  },
  ItemUnitPrice: {
    type: Number,
    required: [true, 'Item unit price is required'],
    min: [0, 'Item unit price cannot be negative'],
  },
  TotalDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Total discount cannot be negative'],
  },
  ItemsNetPrice: {
    type: Number,
    required: [true, 'Items net price is required'],
    min: [0, 'Items net price cannot be negative'],
  },
  TotalVAT: {
    type: Number,
    default: 0,
    min: [0, 'Total VAT cannot be negative'],
  },
  NetTotal: {
    type: Number,
    required: [true, 'Net total is required'],
    min: [0, 'Net total cannot be negative'],
  },
  DeliveryFees: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fees cannot be negative'],
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
detailedSalesSchema.index({ BranchCode: 1 });
detailedSalesSchema.index({ InvoiceNumber: 1 });
detailedSalesSchema.index({ InvoiceDate: -1 });
detailedSalesSchema.index({ MaterialNumber: 1 });
detailedSalesSchema.index({ SalesName: 'text', Name: 'text' });
detailedSalesSchema.index({ BranchCode: 1, InvoiceDate: -1 });

const DetailedSales = mongoose.model('DetailedSales', detailedSalesSchema);

export default DetailedSales;

