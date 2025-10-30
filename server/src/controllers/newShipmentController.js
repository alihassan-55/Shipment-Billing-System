// File: newShipmentController.js
// Purpose: Enhanced shipment management with integrated billing and ledger tracking
// Dependencies: prisma client, integrationService

import { prisma } from '../db/client.js';
import crypto from 'crypto';
import { IntegrationService } from '../services/integrationService.js';

// Constants
const VOLUME_DIVISOR = 5000;

// Helper function to calculate volumetric weight
function calculateVolumetricWeight(lengthCm, widthCm, heightCm) {
  return (lengthCm * widthCm * heightCm) / VOLUME_DIVISOR;
}

function generateReferenceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PREFIX-${date}-${random}`;
}

export async function createShipment(req, res) {
  console.log('Received shipment data:', JSON.stringify(req.body, null, 2));
  console.log('User from token:', req.user);
  
  const {
    referenceNumber,
    serviceProviderId,
    customerId,
    consigneeId,
    terms,
    boxes,
    actualWeightKg,
    productInvoice,
    billingInvoice,
    status = 'Draft'
  } = req.body;

  // Validation
  if (!serviceProviderId || !customerId || !consigneeId || !terms || !boxes || !actualWeightKg) {
    return res.status(400).json({ 
      error: 'Missing required fields: serviceProviderId, customerId, consigneeId, terms, boxes, actualWeightKg' 
    });
  }

  if (!['DAP', 'DDP'].includes(terms)) {
    return res.status(400).json({ error: 'Terms must be either DAP or DDP' });
  }

  if (!Array.isArray(boxes) || boxes.length === 0) {
    return res.status(400).json({ error: 'At least one box is required' });
  }

  // Data type validation
  const actualWeight = parseFloat(actualWeightKg);
  if (isNaN(actualWeight) || actualWeight <= 0) {
    return res.status(400).json({ error: 'actualWeightKg must be a positive number' });
  }

  // Validate billing invoice data types
  if (billingInvoice) {
    if (billingInvoice.ratePerKg && isNaN(parseFloat(billingInvoice.ratePerKg))) {
      return res.status(400).json({ error: 'ratePerKg must be a valid number' });
    }
    if (billingInvoice.totalRate && isNaN(parseFloat(billingInvoice.totalRate))) {
      return res.status(400).json({ error: 'totalRate must be a valid number' });
    }
    if (billingInvoice.grandTotal && isNaN(parseFloat(billingInvoice.grandTotal))) {
      return res.status(400).json({ error: 'grandTotal must be a valid number' });
    }
  }

  try {
    // Use Integration Service for cohesive shipment creation
    // Calculate weights
    const boxesWithVolumetric = (boxes || []).map((box, index) => ({
      ...box,
      index: box.index ?? index + 1,
      volumetricWeightKg: calculateVolumetricWeight(
        parseFloat(box.lengthCm),
        parseFloat(box.widthCm),
        parseFloat(box.heightCm)
      )
    }));

    const totalVolumeWeight = boxesWithVolumetric.reduce((sum, b) => sum + (b.volumetricWeightKg || 0), 0);
    const totalActualWeight = boxesWithVolumetric.reduce((sum, b) => sum + (parseFloat(b.actualWeightKg || 0)), 0) || actualWeight;
    const chargedWeightKg = Math.max(totalActualWeight, totalVolumeWeight);

    const shipmentData = {
      referenceNumber: referenceNumber || generateReferenceNumber(),
      serviceProviderId,
      customerId,
      consigneeId,
      terms,
      boxes: boxesWithVolumetric,
      actualWeightKg: totalActualWeight,
      volumeWeightKg: totalVolumeWeight,
      chargedWeightKg,
      productInvoice,
      billingInvoice,
      status
    };

    const shipment = await IntegrationService.createShipmentWithBilling(shipmentData, req.user.sub);

    return res.status(201).json(shipment);
  } catch (error) {
    console.error('Shipment creation error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    return res.status(500).json({ 
      error: 'Failed to create shipment: ' + error.message,
      details: error.message,
      code: error.code
    });
  }
}

export async function getShipments(req, res) {
  const {
    referenceNumber,
    status,
    from,
    to,
    page = 1,
    limit = 20,
  } = req.query;

  const where = {};
  if (referenceNumber) where.referenceNumber = { contains: referenceNumber, mode: 'insensitive' };
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [shipments, total] = await Promise.all([
      prisma.shipments.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          service_providers: true,
          Customer: true,
          consignees: true,
          shipment_boxes: true,
          product_invoice_items: true,
          billing_invoices: true,
          User: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.shipments.count({ where })
    ]);

    return res.json({
      shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return res.status(500).json({ error: 'Failed to fetch shipments' });
  }
}

export async function getShipmentById(req, res) {
  const { id } = req.params;

  try {
    const shipment = await prisma.shipments.findUnique({
      where: { id },
      include: {
        service_providers: true,
        Customer: true,
        consignees: true,
        shipment_boxes: true,
        product_invoice_items: true,
        billing_invoices: true,
        User: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    return res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return res.status(500).json({ error: 'Failed to fetch shipment' });
  }
}

export async function updateShipment(req, res) {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Get existing shipment
    const existingShipment = await prisma.shipments.findUnique({
      where: { id },
      include: {
        Customer: true,
        billing_invoices: true
      }
    });

    if (!existingShipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Filter out non-updatable fields
    const { id: _, createdAt, createdById, ...filteredUpdates } = updateData;

    // Handle billing invoice updates
    if (updateData.billingInvoice) {
      const billingData = updateData.billingInvoice;
      
      if (existingShipment.billing_invoices) {
        // Update existing billing invoice
        await prisma.billing_invoices.update({
          where: { id: existingShipment.billing_invoices.id },
          data: {
            ratePerKg: billingData.ratePerKg ? parseFloat(billingData.ratePerKg) : null,
            totalRate: billingData.totalRate ? parseFloat(billingData.totalRate) : null,
            eFormCharges: parseFloat(billingData.eFormCharges || 0),
            remoteAreaCharges: parseFloat(billingData.remoteAreaCharges || 0),
            boxCharges: parseFloat(billingData.boxCharges || 0),
            grandTotal: parseFloat(billingData.grandTotal || 0),
            paymentMethod: billingData.paymentMethod,
            customerAccountId: billingData.customerAccountId,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new billing invoice
        await prisma.billing_invoices.create({
          data: {
            id: crypto.randomUUID(),
            shipmentId: id,
            ratePerKg: billingData.ratePerKg ? parseFloat(billingData.ratePerKg) : null,
            totalRate: billingData.totalRate ? parseFloat(billingData.totalRate) : null,
            eFormCharges: parseFloat(billingData.eFormCharges || 0),
            remoteAreaCharges: parseFloat(billingData.remoteAreaCharges || 0),
            boxCharges: parseFloat(billingData.boxCharges || 0),
            grandTotal: parseFloat(billingData.grandTotal || 0),
            paymentMethod: billingData.paymentMethod,
            customerAccountId: billingData.customerAccountId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      // Handle ledger entries for updated billing
      if (billingData.paymentMethod === 'Credit' && billingData.customerAccountId) {
        await prisma.ledgerEntry.create({
          data: {
            id: crypto.randomUUID(),
            customerId: existingShipment.customerId,
            referenceId: id,
            entryType: 'INVOICE',
            description: `Shipment ${existingShipment.referenceNumber} - Credit Payment (Updated)`,
            debit: parseFloat(billingData.grandTotal),
            credit: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    // Update the shipment
    const shipment = await prisma.shipments.update({
      where: { id },
      data: filteredUpdates,
      include: {
        service_providers: true,
        Customer: true,
        consignees: true,
        shipment_boxes: true,
        product_invoice_items: true,
        billing_invoices: true,
        User: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return res.json(shipment);
  } catch (error) {
    console.error('Shipment update error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Shipment not found' });
    return res.status(500).json({ error: 'Failed to update shipment: ' + error.message });
  }
}

export async function updateAirwayBill(req, res) {
  const { id } = req.params;
  const { airwayBillNumber } = req.body;

  if (!airwayBillNumber) {
    return res.status(400).json({ error: 'Airway bill number is required' });
  }

  try {
    const shipment = await prisma.shipments.update({
      where: { id },
      data: { 
        airwayBillNumber,
        updatedAt: new Date()
      },
      include: {
        service_providers: true,
        Customer: true,
        consignees: true,
        shipment_boxes: true,
        product_invoice_items: true,
        billing_invoices: true,
        User: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.json(shipment);
  } catch (error) {
    console.error('Airway bill update error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Shipment not found' });
    return res.status(500).json({ error: 'Failed to update airway bill: ' + error.message });
  }
}

export async function addShipmentEvent(req, res) {
  const { id } = req.params;
  const { eventType, description } = req.body;

  if (!eventType || !description) {
    return res.status(400).json({ error: 'Event type and description are required' });
  }

  try {
    const event = await prisma.shipmentEvent.create({
      data: {
        id: crypto.randomUUID(),
        shipmentId: id,
        eventType,
        description,
        timestamp: new Date(),
        createdById: req.user.sub
      }
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error('Error adding shipment event:', error);
    return res.status(500).json({ error: 'Failed to add event' });
  }
}

export async function confirmShipment(req, res) {
  const { id } = req.params;

  try {
    console.log('Confirming shipment:', id);
    
    // Use Integration Service for cohesive confirmation
    const result = await IntegrationService.confirmShipmentWithInvoices(id, req.user.sub);

    return res.json(result);
  } catch (error) {
    console.error('Shipment confirmation error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Shipment not found' });
    return res.status(500).json({ error: 'Failed to confirm shipment: ' + error.message });
  }
}

// DELETE /api/shipments/:id - Delete shipment
export async function deleteShipment(req, res) {
  const { id } = req.params;

  try {
    console.log('Deleting shipment:', id);

    // Perform comprehensive hard delete within transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete ledger entries created by shipment invoices
      const shipmentInvoices = await tx.shipment_invoices.findMany({
        where: { shipmentId: id },
        select: { id: true, postedLedgerEntryId: true }
      });

      for (const invoice of shipmentInvoices) {
        if (invoice.postedLedgerEntryId) {
          await tx.ledgerEntry.deleteMany({
            where: { id: invoice.postedLedgerEntryId }
          });
        }
        
        // Delete ledger entries linked to this invoice
        await tx.ledgerEntry.deleteMany({
          where: { referenceId: invoice.id }
        });
      }

      // 2. Delete shipment invoice line items
      await tx.shipment_invoice_line_items.deleteMany({
        where: { shipmentInvoice: { shipmentId: id } }
      });

      // 3. Delete shipment invoices
      await tx.shipment_invoices.deleteMany({
        where: { shipmentId: id }
      });

      // 4. Delete billing invoices and their related ledger entries
      const billingInvoices = await tx.billing_invoices.findMany({
        where: { shipmentId: id },
        select: { id: true }
      });

      for (const billingInvoice of billingInvoices) {
        await tx.ledgerEntry.deleteMany({
          where: { referenceId: billingInvoice.id }
        });
      }

      await tx.billing_invoices.deleteMany({
        where: { shipmentId: id }
      });

      // 5. Delete any ledger entries directly referencing the shipment
      await tx.ledgerEntry.deleteMany({
        where: { referenceId: id }
      });

      // 6. Delete product invoice items
      await tx.product_invoice_items.deleteMany({
        where: { shipmentId: id }
      });

      // 7. Delete shipment boxes
      await tx.shipment_boxes.deleteMany({
        where: { shipmentId: id }
      });

      // 8. Delete shipment events
      await tx.shipmentEvent.deleteMany({
        where: { shipmentId: id }
      });

      // 9. Finally delete the shipment
      await tx.shipments.delete({
        where: { id }
      });
    });

    return res.json({ message: 'Shipment and all related data deleted successfully' });
  } catch (error) {
    console.error('Shipment deletion error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Shipment not found' });
    return res.status(500).json({ error: 'Failed to delete shipment: ' + error.message });
  }
}