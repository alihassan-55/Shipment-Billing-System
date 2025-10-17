import { prisma } from '../db/client.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

export async function bulkImportShipments(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file required' });
  }

  const results = {
    success: [],
    errors: [],
    total: 0,
  };

  try {
    const csvData = [];
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => csvData.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    results.total = csvData.length;

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      try {
        // Validate required fields
        const requiredFields = ['sender_name', 'receiver_name', 'destination', 'weight_kg', 'service_type'];
        const missingFields = requiredFields.filter(field => !row[field]);
        
        if (missingFields.length > 0) {
          results.errors.push({
            row: i + 1,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            data: row,
          });
          continue;
        }

        // Create or find customers
        const sender = await prisma.customer.upsert({
          where: { email: row.sender_email || `sender-${i}@temp.com` },
          update: { name: row.sender_name, phone: row.sender_phone },
          create: {
            name: row.sender_name,
            email: row.sender_email || `sender-${i}@temp.com`,
            phone: row.sender_phone,
          },
        });

        const receiver = await prisma.customer.upsert({
          where: { email: row.receiver_email || `receiver-${i}@temp.com` },
          update: { name: row.receiver_name, phone: row.receiver_phone },
          create: {
            name: row.receiver_name,
            email: row.receiver_email || `receiver-${i}@temp.com`,
            phone: row.receiver_phone,
          },
        });

        // Create addresses
        const pickupAddress = await prisma.address.create({
          data: {
            customerId: sender.id,
            type: 'pickup',
            line1: row.pickup_address || 'Default Address',
            city: row.pickup_city || 'Default City',
            state: row.pickup_state || 'Default State',
            postalCode: row.pickup_postal || '00000',
            country: row.pickup_country || 'US',
          },
        });

        const deliveryAddress = await prisma.address.create({
          data: {
            customerId: receiver.id,
            type: 'delivery',
            line1: row.destination,
            city: row.delivery_city || 'Default City',
            state: row.delivery_state || 'Default State',
            postalCode: row.delivery_postal || '00000',
            country: row.delivery_country || 'US',
          },
        });

        // Generate waybill
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const waybill = `CMS-${date}-${random}`;

        // Create shipment
        const shipment = await prisma.shipment.create({
          data: {
            waybill,
            senderId: sender.id,
            receiverId: receiver.id,
            pickupAddressId: pickupAddress.id,
            deliveryAddressId: deliveryAddress.id,
            weight: parseFloat(row.weight_kg),
            dimensions: row.dimensions,
            serviceType: row.service_type,
            declaredValue: row.declared_value ? parseFloat(row.declared_value) : null,
            codAmount: row.cod_amount ? parseFloat(row.cod_amount) : null,
            status: 'Pending',
            bookedAt: row.shipment_date ? new Date(row.shipment_date) : new Date(),
            expectedDelivery: row.expected_delivery ? new Date(row.expected_delivery) : null,
            createdById: req.user.sub || req.user.id,
          },
        });

        results.success.push({
          row: i + 1,
          waybill: shipment.waybill,
          shipmentId: shipment.id,
        });

      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error.message,
          data: row,
        });
      }
    }

    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process CSV file' });
  }
}



