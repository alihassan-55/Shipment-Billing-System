import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { prisma } from '../db/client.js';

export async function generateInvoicePDF(invoiceId) {
  const pdfPath = `./uploads/invoices/invoice-${invoiceId}.pdf`;
  
  // Ensure directory exists
  const dir = path.dirname(pdfPath);
  await fs.mkdir(dir, { recursive: true });
  
  try {
    // Fetch invoice data with all related information
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        lineItems: {
          include: {
            shipment: {
              include: {
                sender: true,
                receiver: true,
                pickupAddress: true,
                deliveryAddress: true,
              },
            },
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: 'QuickRoute21',
        Subject: `Invoice for ${invoice.customer.name}`,
      }
    });

    // Pipe to file
    const stream = fsSync.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Define colors
    const colors = {
      primary: '#10b981',      // Green
      secondary: '#059669',    // Darker green
      dark: '#1f2937',         // Dark gray
      text: '#374151',         // Medium gray
      light: '#f3f4f6',        // Light gray
      white: '#ffffff',
      border: '#e5e7eb',
    };

    // ===== HEADER SECTION =====
    
    // Top green bar
    doc.rect(0, 0, 595, 15)
       .fill(colors.primary);

    // Company Logo area (left side with light background)
    doc.rect(0, 15, 200, 130)
       .fill(colors.light);

    // Company name/logo
    doc.fontSize(22)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('QUICKROUTE21', 60, 50);

    doc.fontSize(9)
       .fillColor(colors.text)
       .font('Helvetica')
       .text('NTN: H-218613', 60, 80);

    // Right side - INVOICE title with green background
    doc.polygon(
      [350, 15],
      [595, 15],
      [595, 80],
      [320, 80]
    ).fill(colors.primary);

    doc.fontSize(36)
       .fillColor(colors.white)
       .font('Helvetica-Bold')
       .text('INVOICE', 380, 35);

    // Invoice details box
    doc.fontSize(10)
       .fillColor(colors.dark)
       .font('Helvetica-Bold')
       .text('Invoice #:', 400, 100, { continued: true })
       .font('Helvetica')
       .text(` ${invoice.invoiceNumber}`, { align: 'left' });

    doc.font('Helvetica-Bold')
       .text('Date:', 400, 115, { continued: true })
       .font('Helvetica')
       .text(` ${new Date(invoice.issuedDate).toLocaleDateString()}`, { align: 'left' });

    if (invoice.dueDate) {
      doc.font('Helvetica-Bold')
         .text('Due Date:', 400, 130, { continued: true })
         .font('Helvetica')
         .text(` ${new Date(invoice.dueDate).toLocaleDateString()}`, { align: 'left' });
    }

    // ===== COMPANY & CUSTOMER INFO SECTION =====
    
    const infoY = 180;

    // Company info (left)
    doc.fontSize(9)
       .fillColor(colors.text)
       .font('Helvetica')
       .text('Office C3, Jawad Center Defence Road Sialkot', 60, infoY)
       .text('adhassanmughal@gmail.com', 60, infoY + 15)
       .text('+92 320 5662393', 60, infoY + 30);

    // Bill To section (right)
    doc.fontSize(11)
       .fillColor(colors.dark)
       .font('Helvetica-Bold')
       .text('Bill To:', 350, infoY);

    doc.fontSize(10)
       .fillColor(colors.text)
       .font('Helvetica')
       .text(invoice.customer.name, 350, infoY + 20);
    
    if (invoice.customer.company) {
      doc.text(invoice.customer.company, 350, infoY + 35);
    }
    
    if (invoice.customer.email) {
      doc.text(invoice.customer.email, 350, infoY + 50);
    }
    
    if (invoice.customer.phone) {
      doc.text(invoice.customer.phone, 350, infoY + 65);
    }

    // ===== TABLE SECTION =====
    
    const tableTop = 300;
    
    // Table header with green background
    doc.rect(50, tableTop, 495, 30)
       .fill(colors.primary);
    
    // Column headers
    doc.fontSize(10)
       .fillColor(colors.white)
       .font('Helvetica-Bold')
       .text('DESCRIPTION', 60, tableTop + 10)
       .text('WEIGHT', 300, tableTop + 10)
       .text('RATE', 380, tableTop + 10)
       .text('AMOUNT', 470, tableTop + 10);

    // Table rows
    let currentY = tableTop + 30;
    
    invoice.lineItems.forEach((item, index) => {
      const shipment = item.shipment;
      const rowHeight = 55;
      
      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(50, currentY, 495, rowHeight)
           .fill(colors.light);
      }
      
      // Service type
      doc.fontSize(10)
         .fillColor(colors.dark)
         .font('Helvetica-Bold')
         .text(shipment.serviceType, 60, currentY + 8);
      
      // From/To info
      doc.fontSize(8)
         .fillColor(colors.text)
         .font('Helvetica')
         .text(`From: ${shipment.sender.name}`, 60, currentY + 24)
         .text(`To: ${shipment.receiver.name}`, 60, currentY + 38);
      
      // Weight
      doc.fontSize(9)
         .fillColor(colors.text)
         .text(`${shipment.weight} kg`, 300, currentY + 20);
      
      // Rate
      doc.text(`$${item.unitPrice.toFixed(2)}`, 380, currentY + 20);
      
      // Amount
      doc.fontSize(10)
         .fillColor(colors.dark)
         .font('Helvetica-Bold')
         .text(`$${item.total.toFixed(2)}`, 470, currentY + 20);
      
      currentY += rowHeight;
    });

    // Table border
    doc.rect(50, tableTop, 495, currentY - tableTop)
       .stroke(colors.border);

    // ===== TOTALS SECTION =====
    
    const totalsY = currentY + 20;
    const totalsX = 380;

    // Subtotal
    doc.fontSize(10)
       .fillColor(colors.text)
       .font('Helvetica')
       .text('Subtotal:', totalsX, totalsY, { width: 90, align: 'right' })
       .text(`$${invoice.subtotal.toFixed(2)}`, totalsX + 90, totalsY, { align: 'right' });
    
    // Tax
    doc.text('Tax:', totalsX, totalsY + 20, { width: 90, align: 'right' })
       .text(`$${invoice.tax.toFixed(2)}`, totalsX + 90, totalsY + 20, { align: 'right' });
    
    // Total with green background
    doc.rect(totalsX, totalsY + 45, 165, 30)
       .fill(colors.primary);
    
    doc.fontSize(12)
       .fillColor(colors.white)
       .font('Helvetica-Bold')
       .text('TOTAL:', totalsX + 10, totalsY + 55)
       .text(`$${invoice.total.toFixed(2)}`, totalsX + 95, totalsY + 55);

    // ===== PAYMENT STATUS =====
    
    const statusY = totalsY + 90;
    
    // Status badge
    const statusColor = invoice.status === 'Paid' ? colors.primary : 
                       invoice.status === 'Unpaid' ? '#ef4444' : '#f59e0b';
    
    doc.roundedRect(50, statusY, 80, 25, 3)
       .fill(statusColor);
    
    doc.fontSize(11)
       .fillColor(colors.white)
       .font('Helvetica-Bold')
       .text(`${invoice.status}`, 50, statusY + 7, { width: 80, align: 'center' });

    // Payment history if available
    if (invoice.payments.length > 0) {
      doc.fontSize(10)
         .fillColor(colors.dark)
         .font('Helvetica-Bold')
         .text('Payment History:', 50, statusY + 40);
      
      invoice.payments.forEach((payment, index) => {
        doc.fontSize(9)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(
             `${new Date(payment.paymentDate).toLocaleDateString()} - $${payment.amount.toFixed(2)} (${payment.method})`, 
             60, 
             statusY + 60 + (index * 15)
           );
      });
    }

    // ===== FOOTER =====
    
    const footerY = 750;
    
    // Bottom green bar
    doc.rect(0, footerY + 30, 595, 15)
       .fill(colors.primary);

    // Watermark (optional)
    doc.fontSize(60)
       .fillColor(colors.light)
       .opacity(0.1)
       .text('QUICKROUTE21', 100, 400, { 
         width: 400, 
         align: 'center',
         angle: -45 
       });

    // Reset opacity
    doc.opacity(1);

    // Footer text
    doc.fontSize(9)
       .fillColor(colors.text)
       .font('Helvetica')
       .text('Thank you for your business!', 50, footerY, { align: 'center', width: 495 })
       .fontSize(8)
       .text('For any questions regarding this invoice, please contact us at adhassanmughal@gmail.com', 
             50, footerY + 15, { align: 'center', width: 495 });

    // Finalize PDF
    doc.end();

    // Wait for the PDF to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return pdfPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}