import { prisma } from '../db/client.js';
import { withDatabaseRetry, handleDatabaseError } from '../middleware/database.js';

export async function createCustomer(req, res) {
  const {
    name,
    company,
    email,
    phone,
    addresses,
    // Shipper-specific fields
    personName,
    address,
    city,
    country,
    cnic,
    ntn
  } = req.body;

  // Determine if this is a shipper creation
  const isShipper = personName && address && city;

  if (!name && !personName) {
    return res.status(400).json({ error: 'Name or Person Name required' });
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
    const customer = await withDatabaseRetry(async () => {
      return await prisma.customer.create({
        data: {
          name: name || personName, // Use personName as name if creating shipper
          company,
          email,
          phone,
          // Shipper-specific fields
          personName: isShipper ? personName : null,
          address: isShipper ? address : null,
          city: isShipper ? city : null,
          country: isShipper ? (country || 'Pakistan') : null,
          cnic: isShipper ? cnic : null,
          ntn: isShipper ? ntn : null,
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
  const { page = 1, limit = 20, search, query, sortBy = 'createdAt', sortOrder = 'desc', type } = req.query;

  const where = {};

  // Use query parameter if search is not provided (for autocomplete)
  const searchTerm = search || query;

  // If type is 'shipper', only return customers with shipper data
  if (type === 'shipper') {
    where.personName = { not: null };
  }

  if (searchTerm) {
    if (type === 'shipper') {
      // For shipper search, search in personName, city, phone, cnic, ntn
      where.OR = [
        { personName: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { cnic: { contains: searchTerm, mode: 'insensitive' } },
        { ntn: { contains: searchTerm, mode: 'insensitive' } }
      ];
    } else {
      // For regular customer search
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { company: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
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

// Shipper-specific functions (for backward compatibility with frontend)
export async function getShippers(req, res) {
  const { query } = req.query;

  console.log('getShippers called with query:', query);

  try {
    // Only return customers that have shipper data (personName is not null)
    const where = {
      personName: { not: null }
    };

    if (query) {
      where.OR = [
        { personName: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { cnic: { contains: query, mode: 'insensitive' } },
        { ntn: { contains: query, mode: 'insensitive' } }
      ];
    }

    console.log('Searching customers with where clause:', JSON.stringify(where, null, 2));

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { personName: 'asc' },
      take: 20,
      select: {
        id: true,
        name: true,        // Added name field
        personName: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        email: true,
        cnic: true,
        ntn: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Found customers:', customers.length);

    // Transform to match expected shipper format
    const shippers = customers.map(customer => ({
      id: customer.id,
      personName: customer.personName || customer.name, // Fallback to name if personName is null
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: customer.country || 'Pakistan',
      email: customer.email,
      cnic: customer.cnic,
      ntn: customer.ntn,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }));

    return res.json(shippers);
  } catch (error) {
    console.error('Error fetching shippers:', error);
    return res.status(500).json({ error: 'Failed to fetch shippers' });
  }
}

export async function createShipper(req, res) {
  // Use the existing createCustomer function with shipper data
  return createCustomer(req, res);
}

export async function getShipper(req, res) {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id,
        personName: { not: null } // Only customers with shipper data
      },
      select: {
        id: true,
        personName: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        email: true,
        cnic: true,
        ntn: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Shipper not found' });
    }

    // Transform to match expected shipper format
    const shipper = {
      id: customer.id,
      personName: customer.personName,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      email: customer.email,
      cnic: customer.cnic,
      ntn: customer.ntn,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };

    return res.json(shipper);
  } catch (error) {
    console.error('Error fetching shipper:', error);
    return res.status(500).json({ error: 'Failed to fetch shipper' });
  }
}

// Phone-based search for shippers (Task 3)
export async function searchShippersByPhone(req, res) {
  const { phone } = req.query;

  console.log('=== PHONE SEARCH DEBUG ===');
  console.log('searchShippersByPhone called with phone:', phone);
  console.log('Request URL:', req.url);
  console.log('Request path:', req.path);
  console.log('Request query:', req.query);

  if (!phone) {
    console.log('No phone provided, returning 400');
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Clean the phone number for searching (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    console.log('Cleaned phone for search:', cleanPhone);

    // First, let's see what customers exist in the database
    const allCustomers = await prisma.customer.findMany({
      where: { personName: { not: null } },
      select: { id: true, personName: true, phone: true }
    });
    console.log('All shippers in database:', allCustomers);

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: phone }, // Exact match
          { phone: { contains: cleanPhone, mode: 'insensitive' } }, // Partial match
          { phone: { contains: phone, mode: 'insensitive' } } // Original phone match
        ],
        personName: { not: null } // Only customers with shipper data
      },
      select: {
        id: true,
        name: true,
        personName: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        email: true,
        cnic: true,
        ntn: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Found customer:', customer);

    if (!customer) {
      console.log('No customer found, returning not found');
      return res.json({ found: false, message: 'No shipper found with this phone number' });
    }

    // Transform to match expected shipper format
    const shipper = {
      id: customer.id,
      personName: customer.personName || customer.name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      email: customer.email,
      cnic: customer.cnic,
      ntn: customer.ntn,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };

    console.log('Returning shipper:', shipper);
    return res.json({ found: true, shipper });
  } catch (error) {
    console.error('Error searching shipper by phone:', error);
    return res.status(500).json({ error: 'Failed to search shipper by phone' });
  }
}


