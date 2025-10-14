import { prisma } from '../db/client.js';

export async function getShippers(req, res) {
  const { query } = req.query;
  
  try {
    const where = query ? {
      OR: [
        { personName: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } }
      ]
    } : {};

    const shippers = await prisma.shipper.findMany({
      where,
      orderBy: { personName: 'asc' },
      take: 20
    });

    return res.json(shippers);
  } catch (error) {
    console.error('Error fetching shippers:', error);
    return res.status(500).json({ error: 'Failed to fetch shippers' });
  }
}

export async function createShipper(req, res) {
  const { personName, phone, address, city, email } = req.body;

  if (!personName || !phone || !address || !city) {
    return res.status(400).json({ 
      error: 'Missing required fields: personName, phone, address, city' 
    });
  }

  try {
    const shipper = await prisma.shipper.create({
      data: {
        personName,
        phone,
        address,
        city,
        country: 'Pakistan', // Always Pakistan
        email: email || null
      }
    });

    return res.status(201).json(shipper);
  } catch (error) {
    console.error('Error creating shipper:', error);
    return res.status(500).json({ error: 'Failed to create shipper' });
  }
}

export async function getShipper(req, res) {
  const { id } = req.params;

  try {
    const shipper = await prisma.shipper.findUnique({
      where: { id }
    });

    if (!shipper) {
      return res.status(404).json({ error: 'Shipper not found' });
    }

    return res.json(shipper);
  } catch (error) {
    console.error('Error fetching shipper:', error);
    return res.status(500).json({ error: 'Failed to fetch shipper' });
  }
}
