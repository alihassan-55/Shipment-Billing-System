import { prisma } from '../db/client.js';

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
    shipperId,
    consigneeId,
    terms,
    boxes,
    actualWeightKg,
    productInvoice,
    billingInvoice,
    status = 'Draft'
  } = req.body;

  // Validation
  if (!serviceProviderId || !shipperId || !consigneeId || !terms || !boxes || !actualWeightKg) {
    return res.status(400).json({ 
      error: 'Missing required fields: serviceProviderId, shipperId, consigneeId, terms, boxes, actualWeightKg' 
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub }
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check for duplicate reference number
    const existingShipment = await prisma.shipment.findUnique({
      where: { referenceNumber: finalReferenceNumber }
    });

    if (existingShipment) {
      return res.status(409).json({ error: 'Reference number already exists' });
    }

    // Create shipment with related data
    console.log('Creating shipment with data:', {
      referenceNumber: finalReferenceNumber,
      serviceProviderId,
      shipperId,
      consigneeId,
      terms,
      actualWeightKg,
      volumeWeightKg: totalVolumeWeight,
      chargedWeightKg,
      customsValue: customsValue > 0 ? customsValue : null,
      status,
      createdById: req.user.sub
    });
    
    const shipment = await prisma.shipment.create({
      data: {
        referenceNumber: finalReferenceNumber,
        serviceProviderId,
        shipperId,
        consigneeId,
        terms,
        actualWeightKg: actualWeight,
        volumeWeightKg: totalVolumeWeight,
        chargedWeightKg,
        customsValue: customsValue > 0 ? customsValue : null,
        status,
        createdById: req.user.sub,
        boxes: {
          create: processedBoxes
        },
        productInvoiceItems: productInvoice?.items ? {
          create: productInvoice.items.map(item => ({
            boxIndex: parseInt(item.boxIndex),
            description: item.description,
            hsCode: item.hsCode,
            pieces: parseInt(item.pieces),
            unitValue: parseFloat(item.unitValue),
            total: parseInt(item.pieces) * parseFloat(item.unitValue)
          }))
        } : undefined,
        billingInvoice: billingInvoice ? {
          create: {
            ratePerKg: billingInvoice.ratePerKg ? parseFloat(billingInvoice.ratePerKg) : null,
            totalRate: billingInvoice.totalRate ? parseFloat(billingInvoice.totalRate) : null,
            eFormCharges: parseFloat(billingInvoice.otherCharges?.eFormCharges || 0),
            remoteAreaCharges: parseFloat(billingInvoice.otherCharges?.remoteAreaCharges || 0),
            boxCharges: parseFloat(billingInvoice.otherCharges?.boxCharges || 0),
            grandTotal: parseFloat(billingInvoice.grandTotal || 0),
            paymentMethod: billingInvoice.paymentMethod,
            customerAccountId: billingInvoice.customerAccountId
          }
        } : undefined
      },
      include: {
        serviceProvider: true,
        shipper: true,
        consignee: true,
        boxes: true,
        productInvoiceItems: true,
        billingInvoice: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create ledger entry if payment method is Credit
    if (billingInvoice?.paymentMethod === 'Credit' && billingInvoice?.customerAccountId) {
      await prisma.ledgerEntry.create({
        data: {
          shipmentId: shipment.id,
          customerAccountId: billingInvoice.customerAccountId,
          amount: parseFloat(billingInvoice.grandTotal),
          currency: 'PKR',
          status: 'Pending'
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
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          serviceProvider: true,
          shipper: true,
          consignee: true,
          boxes: true,
          productInvoiceItems: true,
          billingInvoice: true,
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { bookedAt: 'desc' },
      }),
      prisma.shipment.count({ where }),
    ]);

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
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        serviceProvider: true,
        shipper: true,
        consignee: true,
        boxes: true,
        productInvoiceItems: true,
        billingInvoice: true,
        events: { orderBy: { occurredAt: 'desc' } },
        createdBy: {
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
    const shipment = await prisma.shipment.update({
      where: { id },
      data: filteredUpdates,
      include: {
        serviceProvider: true,
        shipper: true,
        consignee: true,
        boxes: true,
        productInvoiceItems: true,
        billingInvoice: true,
        createdBy: {
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
    const shipment = await prisma.shipment.update({
      where: { id },
      data: { airwayBillNumber },
      include: {
        serviceProvider: true,
        shipper: true,
        consignee: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
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
  const { eventType, description, location, occurredAt } = req.body;

  if (!eventType) return res.status(400).json({ error: 'Event type required' });

  try {
    const event = await prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        eventType,
        description,
        location,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        recordedBy: req.user.sub,
      },
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error('Error adding shipment event:', error);
    return res.status(500).json({ error: 'Failed to add event' });
  }
}
