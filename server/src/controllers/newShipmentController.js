import { prisma } from '../db/client.js';
import crypto from 'crypto';

// Constants
const VOLUME_DIVISOR = 5000;

// Helper function to calculate volumetric weight
function calculateVolumetricWeight(lengthCm, widthCm, heightCm) {
  const volume = (lengthCm * widthCm * heightCm) / VOLUME_DIVISOR;
  return Math.ceil(volume); // Round up to next integer
}

// Helper function to generate reference number
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
    customerId, // Changed from shipperId
    consigneeId,
    terms,
    boxes,
    actualWeightKg,
    productInvoice,
    billingInvoice,
    status = 'DRAFT'
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
    // Calculate volumetric weights and charged weight
    let totalVolumeWeight = 0;
    const processedBoxes = boxes.map((box, index) => {
      const lengthCm = parseFloat(box.lengthCm);
      const widthCm = parseFloat(box.widthCm);
      const heightCm = parseFloat(box.heightCm);
      
      if (isNaN(lengthCm) || isNaN(widthCm) || isNaN(heightCm) || 
          lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
        throw new Error(`Invalid box dimensions for box ${index + 1}`);
      }
      
      const volumetricWeight = calculateVolumetricWeight(lengthCm, widthCm, heightCm);
      totalVolumeWeight += volumetricWeight;
      
      return {
        index: index + 1,
        lengthCm,
        widthCm,
        heightCm,
        volumetricWeightKg: volumetricWeight,
        actualWeightKg: box.actualWeightKg ? parseFloat(box.actualWeightKg) : null
      };
    });

    const chargedWeightKg = Math.max(actualWeight, totalVolumeWeight);

    // Calculate customs value from product invoice
    let customsValue = 0;
    if (productInvoice && productInvoice.items) {
      customsValue = productInvoice.items.reduce((sum, item) => sum + (item.pieces * item.unitValue), 0);
    }

    // Generate reference number if not provided
    const finalReferenceNumber = referenceNumber || generateReferenceNumber();

    // Check if user exists - Backward compatibility
    const userId = req.user.sub || req.user.id;
    console.log('Looking for user with ID:', userId);
    console.log('User from token:', req.user);
    
    // Let's also check what users exist in the database
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, isActive: true }
    });
    console.log('All users in database:', allUsers);
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('Found user:', user);

    if (!user) {
      console.log('User not found in database');
      return res.status(400).json({ error: 'User not found' });
    }

    // Check for duplicate reference number
    const existingShipment = await prisma.shipments.findUnique({
      where: { referenceNumber: finalReferenceNumber }
    });

    if (existingShipment) {
      return res.status(409).json({ error: 'Reference number already exists' });
    }

    // Create shipment with related data
    console.log('Creating shipment with data:', {
      referenceNumber: finalReferenceNumber,
      serviceProviderId,
      customerId,
      consigneeId,
      terms,
      actualWeightKg,
      volumeWeightKg: totalVolumeWeight,
      chargedWeightKg,
      customsValue: customsValue > 0 ? customsValue : null,
      status,
      createdById: req.user.sub
    });
    
    const shipment = await prisma.shipments.create({
      data: {
        id: crypto.randomUUID(),
        referenceNumber: finalReferenceNumber,
        serviceProviderId,
        customerId,
        consigneeId,
        terms,
        actualWeightKg: actualWeight,
        volumeWeightKg: totalVolumeWeight,
        chargedWeightKg,
        customsValue: customsValue > 0 ? customsValue : null,
        status,
        createdById: userId,
        updatedAt: new Date(),
        shipment_boxes: {
          create: processedBoxes.map(box => ({
            id: crypto.randomUUID(),
            ...box,
            createdAt: new Date()
          }))
        },
        product_invoice_items: productInvoice?.items ? {
          create: productInvoice.items.map(item => ({
            id: crypto.randomUUID(),
            boxIndex: parseInt(item.boxIndex),
            description: item.description,
            hsCode: item.hsCode,
            pieces: parseInt(item.pieces),
            unitValue: parseFloat(item.unitValue),
            total: parseInt(item.pieces) * parseFloat(item.unitValue),
            createdAt: new Date()
          }))
        } : undefined,
        billing_invoices: billingInvoice ? {
          create: {
            id: crypto.randomUUID(),
            ratePerKg: billingInvoice.ratePerKg ? parseFloat(billingInvoice.ratePerKg) : null,
            totalRate: billingInvoice.totalRate ? parseFloat(billingInvoice.totalRate) : null,
            eFormCharges: parseFloat(billingInvoice.otherCharges?.eFormCharges || 0),
            remoteAreaCharges: parseFloat(billingInvoice.otherCharges?.remoteAreaCharges || 0),
            boxCharges: parseFloat(billingInvoice.otherCharges?.boxCharges || 0),
            grandTotal: parseFloat(billingInvoice.grandTotal || 0),
            paymentMethod: billingInvoice.paymentMethod,
            customerAccountId: billingInvoice.customerAccountId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        } : undefined
      },
      include: {
        service_providers: true,
        Customer: true, // Changed from shippers to Customer
        consignees: true,
        shipment_boxes: true,
        product_invoice_items: true,
        billing_invoices: true,
        User: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create ledger entry if payment method is Credit
    if (billingInvoice?.paymentMethod === 'Credit' && billingInvoice?.customerAccountId) {
      await prisma.ledger_entries.create({
        data: {
          id: crypto.randomUUID(),
          shipmentId: shipment.id,
          customerAccountId: billingInvoice.customerAccountId,
          amount: parseFloat(billingInvoice.grandTotal),
          currency: 'PKR',
          status: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

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

  console.log('getShipments called with query:', req.query);

  const where = {};
  if (referenceNumber) where.referenceNumber = { contains: referenceNumber, mode: 'insensitive' };
  if (status) where.status = status;
  if (from || to) {
    where.bookedAt = {};
    if (from) where.bookedAt.gte = new Date(from);
    if (to) where.bookedAt.lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    console.log('Searching shipments with where clause:', JSON.stringify(where, null, 2));
    
    const [shipments, total] = await Promise.all([
      prisma.shipments.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          service_providers: true,
          Customer: true, // Changed from shippers to Customer
          consignees: true,
          shipment_boxes: true,
          product_invoice_items: true,
          billing_invoices: true,
          User: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { bookedAt: 'desc' },
      }),
      prisma.shipments.count({ where }),
    ]);

    console.log('Found shipments:', shipments.length, 'Total:', total);

    return res.json({
      shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return res.status(500).json({ error: 'Failed to fetch shipments' });
  }
}

export async function getShipment(req, res) {
  const { id } = req.params;

  try {
    const shipment = await prisma.shipments.findUnique({
      where: { id },
      include: {
        serviceProvider: true,
        shipper: true,
        consignee: true,
        boxes: true,
        productInvoiceItems: true,
        billingInvoice: true,
        events: { orderBy: { occurredAt: 'desc' } },
        User: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    return res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return res.status(500).json({ error: 'Failed to fetch shipment' });
  }
}

export async function updateShipment(req, res) {
  const { id } = req.params;
  const updates = req.body;

  // Define allowed fields for update
  const allowedFields = [
    'status',
    'terms',
    'actualWeightKg',
    'expectedDelivery',
    'deliveredAt'
  ];

  // Filter updates to only include allowed fields
  const filteredUpdates = {};
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  });

  try {
    const shipment = await prisma.shipments.update({
      where: { id },
      data: filteredUpdates,
      include: {
        service_providers: true,
        Customer: true, // Changed from shippers to Customer
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
    // First, check if the shipment exists and if airway bill is already set
    const existingShipment = await prisma.shipments.findUnique({
      where: { id },
      select: { 
        id: true, 
        airwayBillNumber: true, 
        status: true,
        referenceNumber: true
      }
    });

    if (!existingShipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Check if airway bill is already set (make it non-editable)
    if (existingShipment.airwayBillNumber) {
      return res.status(400).json({ 
        error: 'Airway bill number has already been set and cannot be modified',
        currentAirwayBill: existingShipment.airwayBillNumber
      });
    }

    // Check if shipment is in a valid status for airway bill update
    if (!['CONFIRMED', 'In Transit', 'Out for Delivery'].includes(existingShipment.status)) {
      return res.status(400).json({ 
        error: 'Airway bill can only be updated for shipments with status: CONFIRMED, In Transit, or Out for Delivery',
        currentStatus: existingShipment.status
      });
    }

    // Update the airway bill number
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
        User: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return res.json({
      message: 'Airway bill number updated successfully',
      shipment
    });
  } catch (error) {
    console.error('Airway bill update error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Shipment not found' });
    return res.status(500).json({ error: 'Failed to update airway bill: ' + error.message });
  }
}

export async function getAirwayBillStatus(req, res) {
  const { id } = req.params;

  try {
    const shipment = await prisma.shipments.findUnique({
      where: { id },
      select: { 
        id: true, 
        airwayBillNumber: true, 
        status: true,
        referenceNumber: true
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const isEditable = !shipment.airwayBillNumber && 
                      ['CONFIRMED', 'In Transit', 'Out for Delivery'].includes(shipment.status);

    return res.json({
      shipmentId: shipment.id,
      referenceNumber: shipment.referenceNumber,
      airwayBillNumber: shipment.airwayBillNumber,
      status: shipment.status,
      isEditable,
      canUpdate: isEditable,
      reason: isEditable ? 'Airway bill can be updated' : 
              shipment.airwayBillNumber ? 'Airway bill already set' : 
              'Shipment status does not allow airway bill update'
    });
  } catch (error) {
    console.error('Airway bill status error:', error);
    return res.status(500).json({ error: 'Failed to get airway bill status: ' + error.message });
  }
}

export async function addShipmentEvent(req, res) {
  const { id } = req.params;
  const { eventType, description, location, occurredAt } = req.body;

  if (!eventType) return res.status(400).json({ error: 'Event type required' });

  try {
    const event = await prisma.ShipmentEvent.create({
      data: {
        shipmentId: id,
        eventType,
        description,
        location,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        recordedBy: userId,
      },
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
    // Update shipment status to CONFIRMED
    const shipment = await prisma.shipments.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        service_providers: true,
        Customer: true, // Changed from shippers to Customer
        consignees: true,
        shipment_boxes: true,
        product_invoice_items: true,
        billing_invoices: true,
        User: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Import the invoice service
    const { ShipmentInvoiceService } = await import('../services/shipmentInvoiceService.js');
    
    // Create invoices for the confirmed shipment
    const invoices = await ShipmentInvoiceService.createForShipment(id);

    return res.json({
      shipment,
      invoices: {
        declaredValueInvoice: invoices.declaredValueInvoice,
        billingInvoice: invoices.billingInvoice
      }
    });
  } catch (error) {
    console.error('Shipment confirmation error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Shipment not found' });
    return res.status(500).json({ error: 'Failed to confirm shipment: ' + error.message });
  }
}
