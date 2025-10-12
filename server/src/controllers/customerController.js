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
  const { page = 1, limit = 50, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const orderBy = { [sortBy]: sortOrder };

  try {
    const [customers, total] = await withDatabaseRetry(async () => {
      return await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: { 
            addresses: {
              select: {
                id: true,
                type: true,
                city: true,
                state: true,
                country: true
              }
            } 
          },
          orderBy,
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
        hasNext: skip + parseInt(limit) < total,
        hasPrev: page > 1,
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
    const customer = await withDatabaseRetry(async () => {
      return await prisma.customer.findUnique({
        where: { id },
        include: {
          addresses: true,
          invoices: true,
        },
      });
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    return res.json(customer);
  } catch (error) {
    const { error: message } = handleDatabaseError(error, 'fetch customer');
    return res.status(500).json({ error: message });
  }
}

export async function updateCustomer(req, res) {
  const { id } = req.params;
  const { name, company, email, phone, addresses } = req.body;

  try {
    const customer = await withDatabaseRetry(async () => {
      // First, delete existing addresses if new ones are provided
      if (addresses) {
        await prisma.address.deleteMany({
          where: { customerId: id }
        });
      }

      return await prisma.customer.update({
        where: { id },
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
        include: { addresses: true },
      });
    });

    return res.json(customer);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Customer not found' });
    const { error: message } = handleDatabaseError(error, 'update customer');
    return res.status(500).json({ error: message });
  }
}

export async function deleteCustomer(req, res) {
  const { id } = req.params;

  try {
    // Check if customer has any shipments or invoices
    const [shipments, invoices] = await withDatabaseRetry(async () => {
      return await Promise.all([
        prisma.shipment.count({
          where: {
            OR: [
              { senderId: id },
              { receiverId: id }
            ]
          }
        }),
        prisma.invoice.count({
          where: { customerId: id }
        })
      ]);
    });

    if (shipments > 0 || invoices > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing shipments or invoices' 
      });
    }

    await withDatabaseRetry(async () => {
      // Delete addresses first (due to foreign key constraint)
      await prisma.address.deleteMany({
        where: { customerId: id }
      });
      
      // Then delete the customer
      await prisma.customer.delete({
        where: { id }
      });
    });

    return res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Customer not found' });
    const { error: message } = handleDatabaseError(error, 'delete customer');
    return res.status(500).json({ error: message });
  }
}


