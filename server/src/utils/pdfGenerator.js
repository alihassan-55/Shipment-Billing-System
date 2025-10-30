import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced PDF generation for shipment invoices
export async function generateInvoicePDF(invoiceId, type = null, invoiceData = null) {
  return new Promise(async (resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads/invoices');
      await fs.promises.mkdir(uploadsDir, { recursive: true });
      
      const pdfPath = path.join(uploadsDir, `invoice-${invoiceId}.pdf`);
      
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Shipment Receipt - ${type}`,
          Author: 'Courier Billing System',
          Subject: 'Shipment Invoice'
        }
      });

      // Create write stream for PDF file
      const writeStream = fs.createWriteStream(pdfPath);
      
      // Handle stream events
      writeStream.on('error', (error) => {
        console.error('PDF write stream error:', error);
        reject(error);
      });

      writeStream.on('finish', () => {
        console.log(`PDF generated successfully: ${pdfPath}`);
        resolve(`/uploads/invoices/invoice-${invoiceId}.pdf`);
      });

      // Pipe PDF to file
      doc.pipe(writeStream);

      // Generate PDF content based on invoice type
      if (type === 'DECLARED_VALUE') {
        generateDeclaredValueInvoicePDF(doc, invoiceData);
      } else if (type === 'BILLING') {
        generateBillingInvoicePDF(doc, invoiceData);
      } else if (type === 'MAIN') {
        generateMainInvoicePDF(doc, invoiceData);
      } else {
        generateGenericInvoicePDF(doc, invoiceId);
      }

      // Finalize PDF
      doc.end();
      
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
}

// Generate Declared Value Invoice PDF
function generateDeclaredValueInvoicePDF(doc, invoice) {
  try {
    console.log('Generating Declared Value Invoice PDF for:', invoice.id);
    
    const shipment = invoice.shipments;
    const shipper = shipment.Customer;
    const consignee = shipment.consignees;
  
  // Colors
  const darkGray = '#2C2C2C';
  const limeGreen = '#00FF00';
  const lightGreen = '#90EE90';
  
  // Header with decorative blocks
  doc.rect(0, 0, 100, 80).fill(darkGray); // Top-left block
  doc.rect(doc.page.width - 100, 0, 50, 80).fill(darkGray); // Top-right dark block
  doc.rect(doc.page.width - 50, 0, 50, 80).fill(limeGreen); // Top-right green block
  
  // Main title
  doc.fontSize(32)
     .font('Helvetica-Bold')
     .fillColor('black')
     .text('SHIPMENT RECEIPT', 120, 30);
  
  // Green line under title
  doc.rect(50, 70, doc.page.width - 100, 3).fill(limeGreen);
  
  // Total declared value (top right)
  doc.fontSize(12)
     .font('Helvetica')
     .text('TOTAL DECLARED VALUE', doc.page.width - 200, 100);
  
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .text(`Rs ${invoice.total.toFixed(2)}`, doc.page.width - 200, 120);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`, doc.page.width - 200, 160);
  
  // Line under date
  doc.rect(doc.page.width - 200, 175, 150, 1).fill('black');
  
  // Receiver section
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('RECEIVER', 50, 200);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Receiver Name: ${consignee.personName}`, 50, 230)
     .text(`Address (Country): ${consignee.address}, ${consignee.city}, ${consignee.country}`, 50, 250)
     .text(`Phone Number: ${consignee.phone}`, 50, 270);
  
  // Declared Value section
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('DECLARED VALUE', 50, 310);
  
  // Products table
  const tableTop = 340;
  const tableLeft = 50;
  const colWidths = [200, 80, 100, 100];
  
  // Table header
  doc.rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), 25).fill(darkGray);
  
  doc.fillColor('white')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('PRODUCTS', tableLeft + 5, tableTop + 8)
     .text('QUANTITY', tableLeft + colWidths[0] + 5, tableTop + 8)
     .text('PER PRODUCT', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 8)
     .text('TOTAL', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 8);
  
  // Table rows
  let currentY = tableTop + 25;
  let totalValue = 0;
  
  if (invoice.lineItems && invoice.lineItems.length > 0) {
    invoice.lineItems.forEach(item => {
      doc.fillColor('black')
         .fontSize(10)
         .font('Helvetica')
         .text(item.description, tableLeft + 5, currentY + 5)
         .text(item.quantity?.toString() || '1', tableLeft + colWidths[0] + 5, currentY + 5)
         .text(`Rs ${item.unitPrice?.toFixed(2) || '0.00'}`, tableLeft + colWidths[0] + colWidths[1] + 5, currentY + 5)
         .text(`Rs ${item.total.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
      
      totalValue += item.total;
      currentY += 20;
    });
  } else {
    // No products case
    doc.fillColor('black')
       .fontSize(10)
       .font('Helvetica')
       .text('No products declared', tableLeft + 5, currentY + 5);
    currentY += 20;
  }
  
  // Total row
  doc.fillColor('black')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Total:', tableLeft + colWidths[0] + 5, currentY + 5)
     .text(`Rs ${totalValue.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
  
  // Shipment details
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Shipment details', 50, currentY + 40);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Service: ${shipment.service_providers.name}`, 50, currentY + 70);
  
  // Shipper section
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('SHIPPER', 50, currentY + 100);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`${shipper.personName}`, 50, currentY + 130)
     .text(`ID Card Number: ${shipper.cnic || '[]'}`, 50, currentY + 150)
     .text(`NTN: ${shipper.ntn || '[]'}`, 50, currentY + 170);
  
  // Shipping Policy
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Shipping Policy', 50, currentY + 200);
  
  doc.fontSize(10)
     .font('Helvetica')
     .text('For all shipments processed through our service, the maximum declared value for any parcel is set at Rs 100. In the case of a lost or damaged parcel, the maximum compensation that can be claimed will not exceed Rs 100. No claims above this amount will be accepted under any circumstances.', 50, currentY + 230, {
       width: doc.page.width - 100,
       align: 'left'
     });
  
  // Footer decorative elements
  const footerY = doc.page.height - 60;
  doc.circle(50, footerY, 30).fill(lightGreen);
  doc.circle(80, footerY, 25).fill(limeGreen);
  doc.rect(0, doc.page.height - 20, doc.page.width, 20).fill(darkGray);
  
  console.log('Declared Value Invoice PDF content generated successfully');
  } catch (error) {
    console.error('Error generating Declared Value Invoice PDF:', error);
    throw error;
  }
}

// Generate Billing Invoice PDF
function generateBillingInvoicePDF(doc, invoice) {
  try {
    console.log('Generating Billing Invoice PDF for:', invoice.id);
    
    const shipment = invoice.shipments;
    const shipper = shipment.Customer;
    const consignee = shipment.consignees;
  
  // Colors
  const darkGray = '#2C2C2C';
  const limeGreen = '#00FF00';
  const lightGreen = '#90EE90';
  
  // Header with decorative blocks
  doc.rect(0, 0, 100, 80).fill(darkGray); // Top-left block
  doc.rect(doc.page.width - 100, 0, 50, 80).fill(darkGray); // Top-right dark block
  doc.rect(doc.page.width - 50, 0, 50, 80).fill(limeGreen); // Top-right green block
  
  // Main title
  doc.fontSize(32)
     .font('Helvetica-Bold')
     .fillColor('black')
     .text('SHIPMENT RECEIPT', 120, 30);
  
  // Green line under title
  doc.rect(50, 70, doc.page.width - 100, 3).fill(limeGreen);
  
  // Total billed amount (top right)
  doc.fontSize(12)
     .font('Helvetica')
     .text('TOTAL BILLED AMOUNT', doc.page.width - 200, 100);
  
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .text(`Rs ${invoice.total.toFixed(2)}`, doc.page.width - 200, 120);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`, doc.page.width - 200, 160);
  
  // Line under date
  doc.rect(doc.page.width - 200, 175, 150, 1).fill('black');
  
  // Receiver section
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('RECEIVER', 50, 200);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Receiver Name: ${consignee.personName}`, 50, 230)
     .text(`Address (Country): ${consignee.address}, ${consignee.city}, ${consignee.country}`, 50, 250)
     .text(`Phone Number: ${consignee.phone}`, 50, 270);
  
  // Billing details section
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('BILLING DETAILS', 50, 310);
  
  // Billing table
  const tableTop = 340;
  const tableLeft = 50;
  const colWidths = [200, 80, 100, 100];
  
  // Table header
  doc.rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), 25).fill(darkGray);
  
  doc.fillColor('white')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('ITEM DESCRIPTION', tableLeft + 5, tableTop + 8)
     .text('WEIGHT', tableLeft + colWidths[0] + 5, tableTop + 8)
     .text('DM WEIGHT', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 8)
     .text('AMOUNT', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 8);
  
  // Table rows
  let currentY = tableTop + 25;
  let totalAmount = 0;
  
  if (invoice.lineItems && invoice.lineItems.length > 0) {
    invoice.lineItems.forEach(item => {
      doc.fillColor('black')
         .fontSize(10)
         .font('Helvetica')
         .text(item.description, tableLeft + 5, currentY + 5)
         .text(item.quantity ? `${item.quantity} kg` : '---', tableLeft + colWidths[0] + 5, currentY + 5)
         .text('---', tableLeft + colWidths[0] + colWidths[1] + 5, currentY + 5)
         .text(`Rs ${item.total.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
      
      totalAmount += item.total;
      currentY += 20;
    });
  }
  
  // Total row
  doc.fillColor('black')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Total:', tableLeft + colWidths[0] + 5, currentY + 5)
     .text(`Rs ${totalAmount.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
  
  // Shipment details
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Shipment details', 50, currentY + 40);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Service: ${shipment.service_providers.name}`, 50, currentY + 70)
     .text(`Actual Weight: ${shipment.actualWeightKg}kg`, 50, currentY + 90)
     .text(`Volumetric Weight: ${shipment.volumeWeightKg}kg`, 50, currentY + 110)
     .text(`Charged Weight: ${shipment.chargedWeightKg}kg`, 50, currentY + 130);
  
  // Shipper section
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('SHIPPER', 50, currentY + 160);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`${shipper.personName}`, 50, currentY + 190)
     .text(`ID Card Number: ${shipper.cnic || '[]'}`, 50, currentY + 210)
     .text(`NTN: ${shipper.ntn || '[]'}`, 50, currentY + 230);
  
  // Footer decorative elements
  const footerY = doc.page.height - 60;
  doc.circle(50, footerY, 30).fill(lightGreen);
  doc.circle(80, footerY, 25).fill(limeGreen);
  doc.rect(0, doc.page.height - 20, doc.page.width, 20).fill(darkGray);
  
  console.log('Billing Invoice PDF content generated successfully');
  } catch (error) {
    console.error('Error generating Billing Invoice PDF:', error);
    throw error;
  }
}

// Generate Main Invoice PDF
function generateMainInvoicePDF(doc, invoice) {
  try {
    console.log('Generating Main Invoice PDF for:', invoice.id);
    
    const customer = invoice.customer;
  
    // Colors
    const darkGray = '#2C2C2C';
    const limeGreen = '#00FF00';
    const lightGreen = '#90EE90';
    
    // Header with decorative blocks
    doc.rect(0, 0, 100, 80).fill(darkGray); // Top-left block
    doc.rect(doc.page.width - 100, 0, 50, 80).fill(darkGray); // Top-right dark block
    doc.rect(doc.page.width - 50, 0, 50, 80).fill(limeGreen); // Top-right green block
    
    // Main title
    doc.fontSize(32)
       .font('Helvetica-Bold')
       .fillColor('black')
       .text('INVOICE', 120, 30);
    
    // Green line under title
    doc.rect(50, 70, doc.page.width - 100, 3).fill(limeGreen);
    
    // Invoice details (top right)
    doc.fontSize(12)
       .font('Helvetica')
       .text('INVOICE NUMBER', doc.page.width - 200, 100);
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(invoice.invoiceNumber, doc.page.width - 200, 120);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Date: ${new Date(invoice.issuedDate).toLocaleDateString()}`, doc.page.width - 200, 150);
    
    if (invoice.dueDate) {
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, doc.page.width - 200, 170);
    }
    
    // Line under details
    doc.rect(doc.page.width - 200, 185, 150, 1).fill('black');
    
    // Customer section
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('BILL TO', 50, 200);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Name: ${customer.name}`, 50, 230);
    
    if (customer.company) {
      doc.text(`Company: ${customer.company}`, 50, 250);
    }
    if (customer.email) {
      doc.text(`Email: ${customer.email}`, 50, 270);
    }
    if (customer.phone) {
      doc.text(`Phone: ${customer.phone}`, 50, 290);
    }
    
    // Invoice items section
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('INVOICE ITEMS', 50, 330);
    
    // Items table
    const tableTop = 360;
    const tableLeft = 50;
    const colWidths = [200, 80, 100, 100];
    
    // Table header
    doc.rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), 25).fill(darkGray);
    
    doc.fillColor('white')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('DESCRIPTION', tableLeft + 5, tableTop + 8)
       .text('QUANTITY', tableLeft + colWidths[0] + 5, tableTop + 8)
       .text('UNIT PRICE', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 8)
       .text('TOTAL', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 8);
    
    // Table rows
    let currentY = tableTop + 25;
    let subtotal = 0;
    
    if (invoice.lineItems && invoice.lineItems.length > 0) {
      invoice.lineItems.forEach(item => {
        doc.fillColor('black')
           .fontSize(10)
           .font('Helvetica')
           .text(item.description || 'Service', tableLeft + 5, currentY + 5)
           .text(item.quantity?.toString() || '1', tableLeft + colWidths[0] + 5, currentY + 5)
           .text(`Rs ${item.unitPrice?.toFixed(2) || '0.00'}`, tableLeft + colWidths[0] + colWidths[1] + 5, currentY + 5)
           .text(`Rs ${item.total.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
        
        subtotal += item.total;
        currentY += 20;
      });
    } else {
      // No items case
      doc.fillColor('black')
         .fontSize(10)
         .font('Helvetica')
         .text('No items', tableLeft + 5, currentY + 5);
      currentY += 20;
    }
    
    // Totals section
    currentY += 20;
    doc.fillColor('black')
       .fontSize(12)
       .font('Helvetica')
       .text('Subtotal:', tableLeft + colWidths[0] + 5, currentY + 5)
       .text(`Rs ${subtotal.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
    
    currentY += 20;
    doc.text('Tax:', tableLeft + colWidths[0] + 5, currentY + 5)
       .text(`Rs ${invoice.tax?.toFixed(2) || '0.00'}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
    
    currentY += 20;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Total:', tableLeft + colWidths[0] + 5, currentY + 5)
       .text(`Rs ${invoice.total.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
    
    // Payment status
    currentY += 40;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('PAYMENT STATUS', 50, currentY);
    
    currentY += 30;
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Status: ${invoice.status}`, 50, currentY);
    
    if (invoice.amountPaid > 0) {
      currentY += 20;
      doc.text(`Amount Paid: Rs ${invoice.amountPaid.toFixed(2)}`, 50, currentY);
    }
    
    if (invoice.balanceDue > 0) {
      currentY += 20;
      doc.text(`Balance Due: Rs ${invoice.balanceDue.toFixed(2)}`, 50, currentY);
    }
    
    // Payment history
    if (invoice.payments && invoice.payments.length > 0) {
      currentY += 40;
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('PAYMENT HISTORY', 50, currentY);
      
      currentY += 30;
      invoice.payments.forEach(payment => {
        doc.fontSize(10)
           .font('Helvetica')
           .text(`${new Date(payment.createdAt).toLocaleDateString()} - ${payment.paymentType} - Rs ${payment.amount.toFixed(2)}`, 50, currentY);
        currentY += 15;
      });
    }
    
    // Footer decorative elements
    const footerY = doc.page.height - 60;
    doc.circle(50, footerY, 30).fill(lightGreen);
    doc.circle(80, footerY, 25).fill(limeGreen);
    doc.rect(0, doc.page.height - 20, doc.page.width, 20).fill(darkGray);
    
    console.log('Main Invoice PDF content generated successfully');
  } catch (error) {
    console.error('Error generating Main Invoice PDF:', error);
    throw error;
  }
}

// Generate generic invoice PDF
function generateGenericInvoicePDF(doc, invoiceId) {
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text('Invoice', 50, 100);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Invoice ID: ${invoiceId}`, 50, 150)
     .text(`Generated: ${new Date().toLocaleString()}`, 50, 170);
}


