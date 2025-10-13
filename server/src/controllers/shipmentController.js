import { prisma } from '../db/client.js';

export async function createShipment(req, res) {
  const {
    senderId,
    receiverId,
    pickupAddressId,
    deliveryAddressId,
    weight,
    dimensions,
    serviceType,
    declaredValue,
    codAmount,
    expectedDelivery,
    // Additional fields from comprehensive form
    shipperAddress1,
    shipperAddress2,
    shipperCity,
    shipperState,
    shipperZipCode,
    shipperCountry,
    consigneeAddress,
    consigneeCity,
    consigneeState,
    consigneePostalCode,
    consigneeCountry,
  } = req.body;

  if (!senderId || !receiverId || !weight || !serviceType) {
    return res.status(400).json({ error: 'Missing required fields: senderId, receiverId, weight, serviceType' });
  }

  // Generate unique waybill (format: CMS-YYYYMMDD-XXXX)
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const waybill = `CMS-${date}-${random}`;

  try {
    // Handle pickup address - use provided ID or create from form data
    let finalPickupAddressId = pickupAddressId;
    if (!finalPickupAddressId && shipperAddress1 && shipperCity) {
      const pickupAddress = await prisma.address.create({
        data: {
          customerId: senderId,
          type: 'pickup',
          line1: shipperAddress1,
          line2: shipperAddress2 || null,
          city: shipperCity,
          state: shipperState || null,
          postalCode: shipperZipCode || null,
          country: shipperCountry || 'US',
        },
      });
      finalPickupAddressId = pickupAddress.id;
    }

    // Handle delivery address - use provided ID or create from form data
    let finalDeliveryAddressId = deliveryAddressId;
    if (!finalDeliveryAddressId && consigneeAddress && consigneeCity) {
      const deliveryAddress = await prisma.address.create({
        data: {
          customerId: receiverId,
          type: 'delivery',
          line1: consigneeAddress,
          line2: null,
          city: consigneeCity,
          state: consigneeState || null,
          postalCode: consigneePostalCode || null,
          country: consigneeCountry || 'US',
        },
      });
      finalDeliveryAddressId = deliveryAddress.id;
    }

    // If still no addresses, create default ones
    if (!finalPickupAddressId) {
      const pickupAddress = await prisma.address.create({
        data: {
          customerId: senderId,
          type: 'pickup',
          line1: 'Default Pickup Address',
          city: 'Unknown',
          country: 'US',
        },
      });
      finalPickupAddressId = pickupAddress.id;
    }

    if (!finalDeliveryAddressId) {
      const deliveryAddress = await prisma.address.create({
        data: {
          customerId: receiverId,
          type: 'delivery',
          line1: 'Default Delivery Address',
          city: 'Unknown',
          country: 'US',
        },
      });
      finalDeliveryAddressId = deliveryAddress.id;
    }

    const shipment = await prisma.shipment.create({
      data: {
        waybill,
        senderId,
        receiverId,
        pickupAddressId: finalPickupAddressId,
        deliveryAddressId: finalDeliveryAddressId,
        weight: parseFloat(weight),
        dimensions,
        serviceType,
        declaredValue: declaredValue ? parseFloat(declaredValue) : null,
        codAmount: codAmount ? parseFloat(codAmount) : null,
        status: 'Pending',
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        createdById: req.user.sub,
      },
      include: {
        sender: true,
        receiver: true,
        pickupAddress: true,
        deliveryAddress: true,
      },
    });

    return res.status(201).json(shipment);
  } catch (error) {
    console.error('Shipment creation error:', error);
    return res.status(500).json({ error: 'Failed to create shipment: ' + error.message });
  }
}

export async function getShipments(req, res) {
  const {
    waybill,
    status,
    from,
    to,
    page = 1,
    limit = 20,
  } = req.query;

  const where = {};
  if (waybill) where.waybill = { contains: waybill, mode: 'insensitive' };
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
          sender: true,
          receiver: true,
          pickupAddress: true,
          deliveryAddress: true,
          invoice: true,
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
    return res.status(500).json({ error: 'Failed to fetch shipments' });
  }
}

export async function getShipment(req, res) {
  const { id } = req.params;

  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        sender: true,
        receiver: true,
        pickupAddress: true,
        deliveryAddress: true,
        events: { orderBy: { occurredAt: 'desc' } },
        invoice: true,
      },
    });

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    return res.json(shipment);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch shipment' });
  }
}

export async function updateShipment(req, res) {
  const { id } = req.params;
  const updates = req.body;

  // Define allowed fields for update (exclude relations and computed fields)
  const allowedFields = [
    'status',
    'serviceType', 
    'weight',
    'dimensions',
    'declaredValue',
    'codAmount',
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
        sender: true,
        receiver: true,
        pickupAddress: true,
        deliveryAddress: true,
      },
    });

    return res.json(shipment);
  } catch (error) {
    console.error('Shipment update error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Shipment not found' });
    return res.status(500).json({ error: 'Failed to update shipment: ' + error.message });
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
    return res.status(500).json({ error: 'Failed to add event' });
  }
}

