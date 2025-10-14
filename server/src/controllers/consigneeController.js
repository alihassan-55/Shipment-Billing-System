import { prisma } from '../db/client.js';

export async function getConsignees(req, res) {
  const { query } = req.query;
  
  try {
    const where = query ? {
      OR: [
        { personName: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } }
      ]
    } : {};

    const consignees = await prisma.consignee.findMany({
      where,
      orderBy: { personName: 'asc' },
      take: 20
    });

    return res.json(consignees);
  } catch (error) {
    console.error('Error fetching consignees:', error);
    return res.status(500).json({ error: 'Failed to fetch consignees' });
  }
}

export async function createConsignee(req, res) {
  const { personName, phone, address, city, country, email } = req.body;

  if (!personName || !phone || !address || !city || !country) {
    return res.status(400).json({ 
      error: 'Missing required fields: personName, phone, address, city, country' 
    });
  }

  try {
    const consignee = await prisma.consignee.create({
      data: {
        personName,
        phone,
        address,
        city,
        country,
        email: email || null
      }
    });

    return res.status(201).json(consignee);
  } catch (error) {
    console.error('Error creating consignee:', error);
    return res.status(500).json({ error: 'Failed to create consignee' });
  }
}

export async function getConsignee(req, res) {
  const { id } = req.params;

  try {
    const consignee = await prisma.consignee.findUnique({
      where: { id }
    });

    if (!consignee) {
      return res.status(404).json({ error: 'Consignee not found' });
    }

    return res.json(consignee);
  } catch (error) {
    console.error('Error fetching consignee:', error);
    return res.status(500).json({ error: 'Failed to fetch consignee' });
  }
}
