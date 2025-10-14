import { prisma } from '../db/client.js';

export async function getServiceProviders(req, res) {
  try {
    const serviceProviders = await prisma.serviceProvider.findMany({
      orderBy: { name: 'asc' }
    });

    return res.json(serviceProviders);
  } catch (error) {
    console.error('Error fetching service providers:', error);
    return res.status(500).json({ error: 'Failed to fetch service providers' });
  }
}

export async function createServiceProvider(req, res) {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Service provider name is required' });
  }

  try {
    const serviceProvider = await prisma.serviceProvider.create({
      data: { name }
    });

    return res.status(201).json(serviceProvider);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Service provider with this name already exists' });
    }
    console.error('Error creating service provider:', error);
    return res.status(500).json({ error: 'Failed to create service provider' });
  }
}
