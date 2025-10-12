import { prisma } from '../db/client.js';
import { withDatabaseRetry, handleDatabaseError } from '../middleware/database.js';

export async function createCustomer(req, res) {
  const { name, company, email, phone, addresses } = req.body;

  if (!name) return res.status(400).json({ error: 'Name required' });

  try {
    const customer = await withDatabaseRetry(async () => {
      return await prisma.customer.create({
        data: {
          name,
          company,
          email,
          phone,
          addresses: addresses ? {
            create: addresses.map(addr => ({
              type: addr.type || 'default',
              line1: addr.line1,
              line2: addr.line2,
              city: addr.city,
              state: addr.state,
              postalCode: addr.postalCode,
              country: addr.country || 'US',
            })),
          } : undefined,
        },
        include: {
          addresses: true,
        },
      });
    });

    return res.status(201).json(customer);
  } catch (error) {
    const { error: message } = handleDatabaseError(error, 'create customer');
    return res.status(500).json({ error: message });
  }
}

export async function getCustomers(req, res) {
  const { page = 1, limit = 20, search } = req.query;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [customers, total] = await withDatabaseRetry(async () => {
      return await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: { addresses: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.customer.count({ where }),
      ]);
    });

    return res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    const { error: message } = handleDatabaseError(error, 'fetch customers');
    return res.status(500).json({ error: message });
  }
}

export async function getCustomer(req, res) {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        invoices: true,
      },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    return res.json(customer);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch customer' });
  }
}

export async function updateCustomer(req, res) {
  const { id } = req.params;
  const updates = req.body;

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: updates,
      include: { addresses: true },
    });

    return res.json(customer);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Customer not found' });
    return res.status(500).json({ error: 'Failed to update customer' });
  }
}


