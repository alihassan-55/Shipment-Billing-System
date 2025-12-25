import PDFDocument from 'pdfkit';
import { s3Client } from '../config/supabase.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

// Enhanced PDF generation for shipment invoices
// Design: Modern Green & White Theme

const COLORS = {
   primary: '#2E7D32', // Forest Green
   secondary: '#4CAF50', // Standard Green
   accent: '#A5D6A7', // Light Green
   dark: '#1B5E20', // Dark Green
   text: '#333333',
   lightText: '#666666',
   white: '#FFFFFF',
   tableHeader: '#2E7D32',
   tableRowEven: '#F1F8E9', // Very light green
   border: '#E0E0E0'
};

const COMPANY_INFO = {
   name: 'Courier Billing System',
   address: '123 Logistics Avenue, Business District',
   city: 'Commerce City, 54000',
   email: 'billing@courier-system.com',
   phone: '+92 300 1234567',
   website: 'www.courier-system.com'
};

export async function generateInvoicePDF(invoiceId, type = null, invoiceData = null) {
   return new Promise((resolve, reject) => {
      try {
         // Create PDF document
         const doc = new PDFDocument({
            size: 'A4',
            margin: 0, // We handle margins manually for full-bleed headers
            info: {
               Title: `Shipment Invoice - ${type}`,
               Author: COMPANY_INFO.name,
               Subject: 'Shipment Invoice'
            }
         });

         // Buffer to store PDF data
         const buffers = [];
         doc.on('data', buffers.push.bind(buffers));

         doc.on('end', async () => {
            try {
               const pdfData = Buffer.concat(buffers);
               const fileName = `invoice-${invoiceId}.pdf`;

               const pdflen = pdfData.length;
               console.log(`PDF Buffer created. Size: ${pdflen} bytes. Starting S3 upload...`);

               // Upload to Supabase Storage via S3 Protocol
               const command = new PutObjectCommand({
                  Bucket: 'invoices',
                  Key: fileName,
                  Body: pdfData,
                  ContentType: 'application/pdf',
               });

               const response = await s3Client.send(command);
               console.log(`PDF generated and uploaded successfully via S3: ${fileName}`, response);

               // Return the path (Key)
               resolve(fileName);
            } catch (err) {
               console.error('Error uploading PDF to Supabase (S3):', err);
               reject(err);
            }
         });

         doc.on('error', (error) => {
            console.error('PDF document error:', error);
            reject(error);
         });

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

         // Finalize PDF - this triggers the 'end' event
         doc.end();
      } catch (error) {
         console.error('Error in PDF generation:', error);
         reject(error);
      }
   });
}

// --- Shared Helper Functions ---

function cleanText(text) {
   if (!text) return '';
   // Replace numbers with more than 2 decimal places with 2 decimal places
   return String(text).replace(/(\d+\.\d{3,})/g, (match) => Number(match).toFixed(2));
}

function drawHeader(doc, title, invoiceNumber, date) {
   // Left Geometric shape (Green Triangle/Polygon)
   doc.save();
   doc.moveTo(0, 0)
      .lineTo(250, 0)
      .lineTo(180, 120)
      .lineTo(0, 120)
      .fill(COLORS.primary);

   // Lighter accent shape
   doc.moveTo(0, 0)
      .lineTo(150, 0)
      .lineTo(100, 120)
      .lineTo(0, 120)
      .fillOpacity(0.3)
      .fill(COLORS.accent);
   doc.restore();

   // Company Info (White text on Green background)
   // Logo placeholder
   // doc.rect(30, 20, 40, 40).fill('white'); // Placeholder for logo if needed

   doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.white)
      .text(COMPANY_INFO.name, 30, 30, { width: 200 }); // Constrain width

   doc.font('Helvetica').fontSize(9).fillColor(COLORS.white)
      .text(COMPANY_INFO.address, 30, 55, { width: 140 })
      .text(COMPANY_INFO.city, 30, 80, { width: 140 }) // Adjusted Y
      .text(COMPANY_INFO.email, 30, 95, { width: 140 });

   // Right Side: Title and Invoice Details
   // Reduced font size to prevent overlapping
   doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.primary)
      .text(title.toUpperCase(), 300, 40, { align: 'right', width: 250 });

   doc.rect(300, 70, 250, 2).fill(COLORS.secondary);

   doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text)
      .text('INVOICE #', 350, 80, { align: 'right', width: 200 });
   doc.font('Helvetica').fontSize(10).fillColor(COLORS.lightText)
      .text(invoiceNumber || 'N/A', 350, 95, { align: 'right', width: 200 });

   doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text)
      .text('DATE', 350, 115, { align: 'right', width: 200 });
   doc.font('Helvetica').fontSize(10).fillColor(COLORS.lightText)
      .text(date, 350, 130, { align: 'right', width: 200 });
}

function drawInfoSection(doc, y, leftTitle, leftData, rightTitle, rightData) {
   const leftX = 40;
   const rightX = 300;

   // Left Column (e.g., Shipper)
   doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.primary)
      .text(leftTitle, leftX, y);
   doc.rect(leftX, y + 15, 200, 1).fill(COLORS.secondary);

   let currentY = y + 25;
   doc.font('Helvetica').fontSize(9).fillColor(COLORS.text);
   leftData.forEach(line => {
      doc.text(line, leftX, currentY);
      currentY += 14;
   });

   // Right Column (e.g., Consignee)
   doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.primary)
      .text(rightTitle, rightX, y);
   doc.rect(rightX, y + 15, 200, 1).fill(COLORS.secondary);

   currentY = y + 25;
   doc.font('Helvetica').fontSize(9).fillColor(COLORS.text);
   rightData.forEach(line => {
      doc.text(line, rightX, currentY);
      currentY += 14;
   });

   return Math.max(currentY, y + 25 + (Math.max(leftData.length, rightData.length) * 14)) + 20;
}

function drawTable(doc, y, columns, data) {
   const tableLeft = 40;
   const tableWidth = 515;
   const headerHeight = 30;
   const rowHeight = 25;
   const colSpacing = 5;

   // Draw Header Background
   doc.rect(tableLeft, y, tableWidth, headerHeight).fill(COLORS.tableHeader);

   // Draw Header Text
   let currentX = tableLeft + 10;
   doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white);

   columns.forEach((col, i) => {
      doc.text(col.header, currentX, y + 10, { width: col.width, align: col.align || 'left' });
      currentX += col.width + colSpacing;
   });

   let currentY = y + headerHeight;

   // Draw Rows
   doc.font('Helvetica').fontSize(9).fillColor(COLORS.text);

   data.forEach((row, index) => {
      if (index % 2 === 0) {
         doc.rect(tableLeft, currentY, tableWidth, rowHeight).fill(COLORS.tableRowEven);
      }

      // Reset color for text
      doc.fillColor(COLORS.text);

      let rowX = tableLeft + 10;
      columns.forEach((col) => {
         const text = row[col.field] !== undefined ? String(row[col.field]) : '';
         doc.text(text, rowX, currentY + 8, { width: col.width, align: col.align || 'left' });
         rowX += col.width + colSpacing;
      });

      currentY += rowHeight;
   });

   // Bottom border
   doc.moveTo(tableLeft, currentY).lineTo(tableLeft + tableWidth, currentY).strokeColor(COLORS.primary).stroke();

   return currentY + 20; // Return new Y position
}

function drawSummary(doc, y, items) {
   const x = 350;
   const width = 200;

   items.forEach(item => {
      // Background for total
      if (item.isTotal) {
         doc.rect(x - 10, y - 5, width + 10, 25).fill(COLORS.primary);
         doc.fillColor(COLORS.white).font('Helvetica-Bold');
      } else {
         doc.fillColor(COLORS.text).font('Helvetica');
      }

      doc.text(item.label, x, y, { align: 'left' });
      doc.text(item.value, x, y, { align: 'right', width: width });

      y += 25;
   });

   return y;
}

function drawFooter(doc) {
   const footerY = doc.page.height - 100;

   // Terms & Conditions Box
   doc.rect(40, footerY, 250, 60).strokeColor(COLORS.accent).lineWidth(1).stroke();
   doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.primary).text('TERMS & CONDITIONS', 50, footerY + 10);
   doc.font('Helvetica').fontSize(6).fillColor(COLORS.lightText)
      .text('1. All claims must be made within 7 days.', 50, footerY + 25)
      .text('2. Max declared value claim is Rs 100.', 50, footerY + 35)
      .text('3. Subject to company policies.', 50, footerY + 45);

   // Signature Line
   doc.moveTo(350, footerY + 50).lineTo(550, footerY + 50).strokeColor(COLORS.text).lineWidth(0.5).stroke();
   doc.font('Helvetica').fontSize(8).fillColor(COLORS.text).text('Authorized Signature', 350, footerY + 55, { align: 'center', width: 200 });

   // Decorative Bottom
   const bottomY = doc.page.height - 25;
   doc.rect(0, bottomY, doc.page.width, 25).fill(COLORS.primary);

   // Generated By and Time
   const generatedText = `Generated by ${COMPANY_INFO.name} - ${new Date().toLocaleString()}`;
   doc.font('Helvetica').fontSize(8).fillColor(COLORS.white)
      .text(generatedText, 0, bottomY + 8, { align: 'center', width: doc.page.width });
}


// --- Specific Invoice Generators ---

function generateDeclaredValueInvoicePDF(doc, invoice) {
   console.log('Generating Modern Invoice: Declared Value', invoice.id);
   const shipment = invoice.shipments;
   const shipper = shipment?.Customer;
   const consignee = shipment?.consignees;

   // 1. Header
   drawHeader(doc, 'DECLARED VALUE INVOICE', invoice.id.substring(0, 8).toUpperCase(), new Date().toLocaleDateString());

   // 2. Info Section
   const shipperData = [
      shipper?.personName || 'N/A',
      `CNIC: ${shipper?.cnic || 'N/A'}`,
      `NTN: ${shipper?.ntn || 'N/A'}`,
      `Service: ${invoice.shipments?.service_providers?.name || 'N/A'}`
   ];

   const consigneeData = [
      consignee?.personName || 'N/A',
      consignee?.address || 'N/A',
      `${consignee?.city || ''}, ${consignee?.country || ''}`,
      `Phone: ${consignee?.phone || 'N/A'}`
   ];

   let y = 160;
   y = drawInfoSection(doc, y, 'CUSTOMER (SHIPPER)', shipperData, 'CONSIGNEE (RECEIVER)', consigneeData);

   // 3. Table
   // Corrected widths to sum to 515 (approx)
   // 255 + 60 + 100 + 100 = 515
   const columns = [
      { header: 'DESCRIPTION', width: 255, field: 'description' },
      { header: 'QTY', width: 60, field: 'qty', align: 'center' },
      { header: 'UNIT VALUE', width: 100, field: 'price', align: 'right' },
      { header: 'TOTAL', width: 100, field: 'total', align: 'right' }
   ];

   const tableData = (invoice.lineItems || []).map(item => ({
      description: cleanText(item.description),
      qty: item.quantity || 1,
      price: `Rs ${item.unitPrice?.toFixed(2) || '0.00'}`,
      total: `Rs ${item.total?.toFixed(2) || '0.00'}`
   }));

   if (tableData.length === 0) {
      tableData.push({ description: 'No items declared', qty: '-', price: '-', total: 'Rs 0.00' });
   }

   y = drawTable(doc, y, columns, tableData);

   // 4. Summary
   const summaryItems = [
      { label: 'Total Declared Value:', value: `Rs ${invoice.total.toFixed(2)}`, isTotal: true }
   ];
   drawSummary(doc, y, summaryItems);

   // 5. Footer
   drawFooter(doc);
}

function generateBillingInvoicePDF(doc, invoice) {
   console.log('Generating Modern Invoice: Billing', invoice.id);
   const shipment = invoice.shipments;
   const shipper = shipment?.Customer;
   const consignee = shipment?.consignees;

   // 1. Header
   drawHeader(doc, 'SHIPPING BILL', invoice.id.substring(0, 8).toUpperCase(), new Date().toLocaleDateString());

   // 2. Info Section
   const shipperData = [
      shipper?.personName || 'N/A',
      `CNIC: ${shipper?.cnic || 'N/A'}`,
      `NTN: ${shipper?.ntn || 'N/A'}`,
      `Origin: ${shipment?.origin_cities?.name || 'N/A'}`
   ];

   const consigneeData = [
      consignee?.personName || 'N/A',
      `Destination: ${shipment?.destination_cities?.name || 'N/A'}`,
      `Service: ${shipment?.service_providers?.name || 'N/A'}`
   ];

   let y = 160;
   y = drawInfoSection(doc, y, 'SHIPPER DETAILS', shipperData, 'SHIPMENT DETAILS', consigneeData);

   // 3. Table
   // Corrected widths to sum to 515
   // 255 + 80 + 80 + 100 = 515
   const columns = [
      { header: 'DESCRIPTION', width: 255, field: 'description' },
      { header: 'WEIGHT (KG)', width: 80, field: 'weight', align: 'center' },
      { header: 'VOL. WEIGHT', width: 80, field: 'volWeight', align: 'center' },
      { header: 'AMOUNT', width: 100, field: 'amount', align: 'right' }
   ];

   let tableData = [];
   if (invoice.lineItems && invoice.lineItems.length > 0) {
      tableData = invoice.lineItems.map(item => ({
         description: cleanText(item.description),
         weight: item.quantity || shipment.actualWeightKg,
         volWeight: shipment.volumeWeightKg || '-',
         amount: `Rs ${item.total.toFixed(2)}`
      }));
   } else {
      tableData.push({
         description: 'Shipping Charges',
         weight: shipment.actualWeightKg,
         volWeight: shipment.volumeWeightKg,
         amount: `Rs ${invoice.total.toFixed(2)}`
      });
   }

   y = drawTable(doc, y, columns, tableData);

   // 4. Summary
   const summaryItems = [
      { label: 'Charged Weight:', value: `${shipment.chargedWeightKg} KG` },
      { label: 'Total Amount:', value: `Rs ${invoice.total.toFixed(2)}`, isTotal: true }
   ];
   drawSummary(doc, y, summaryItems);

   // 5. Footer
   drawFooter(doc);
}

function generateMainInvoicePDF(doc, invoice) {
   const customer = invoice.customer;

   drawHeader(doc, 'GENERAL INVOICE', invoice.invoiceNumber, new Date(invoice.issuedDate).toLocaleDateString());

   const customerData = [
      customer?.name || 'Guest',
      customer?.company || '',
      customer?.email || '',
      customer?.phone || ''
   ];

   let y = 160;
   y = drawInfoSection(doc, y, 'ISSUED TO', customerData, 'PAYMENT INFO', [`Status: ${invoice.status}`, `Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`]);

   // 255 + 60 + 100 + 100 = 515
   const columns = [
      { header: 'ITEM', width: 255, field: 'description' },
      { header: 'QTY', width: 60, field: 'qty', align: 'center' },
      { header: 'UNIT PRICE', width: 100, field: 'price', align: 'right' },
      { header: 'TOTAL', width: 100, field: 'total', align: 'right' }
   ];

   const tableData = (invoice.lineItems || []).map(item => ({
      description: cleanText(item.description || 'Item'),
      qty: item.quantity || 1,
      price: `Rs ${item.unitPrice?.toFixed(2) || 0}`,
      total: `Rs ${item.total?.toFixed(2) || 0}`
   }));

   y = drawTable(doc, y, columns, tableData);

   const summaryItems = [
      { label: 'Subtotal:', value: `Rs ${(invoice.total - (invoice.tax || 0)).toFixed(2)}` },
      { label: 'Tax:', value: `Rs ${invoice.tax?.toFixed(2) || '0.00'}` },
      { label: 'Total Due:', value: `Rs ${invoice.total.toFixed(2)}`, isTotal: true }
   ];

   drawSummary(doc, y, summaryItems);
   drawFooter(doc);
}

function generateGenericInvoicePDF(doc, invoiceId) {
   drawHeader(doc, 'INVOICE', invoiceId, new Date().toLocaleDateString());
   doc.text('Details not available.', 50, 200);
   drawFooter(doc);
}