import { prisma } from '../db/client.js';

export async function getShippers(req, res) {
  const { query } = req.query;
  
  try {
    const where = query ? {
      OR: [
        { personName: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { cnic: { contains: query, mode: 'insensitive' } },
        { ntn: { contains: query, mode: 'insensitive' } }
      ]
    } : {};

    const shippers = await prisma.shippers.findMany({
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
  const { personName, phone, address, city, email, cnic, ntn } = req.body;

  if (!personName || !phone || !address || !city) {
    return res.status(400).json({ 
      error: 'Missing required fields: personName, phone, address, city' 
    });
  }

  // Validate CNIC format if provided
  if (cnic && !/^[0-9-]{5,20}$/.test(cnic)) {
    return res.status(400).json({ 
      error: 'CNIC must contain only digits and dashes, 5-20 characters' 
    });
  }

  // Validate NTN format if provided
  if (ntn && !/^[A-Za-z0-9-]{3,25}$/.test(ntn)) {
    return res.status(400).json({ 
      error: 'NTN must be alphanumeric with dashes, 3-25 characters' 
    });
  }

  try {
    const shipper = await prisma.shippers.create({
      data: {
        personName,
        phone,
        address,
        city,
        country: 'Pakistan', // Always Pakistan
        email: email || null,
        cnic: cnic || null,
        ntn: ntn || null
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
    const shipper = await prisma.shippers.findUnique({
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
