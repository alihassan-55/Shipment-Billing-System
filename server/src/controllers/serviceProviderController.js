import { prisma } from '../db/client.js';
import { randomUUID } from 'crypto';

export async function getServiceProviders(req, res) {
  console.log('=== SERVICE PROVIDER FETCH DEBUG ===');
  try {
    const serviceProviders = await prisma.service_providers.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('Found service providers:', serviceProviders.length);
    console.log('Service providers:', serviceProviders);
    return res.json(serviceProviders);
  } catch (error) {
    console.error('Error fetching service providers:', error);
    console.error('Error details:', error.message);
    return res.status(500).json({ error: 'Failed to fetch service providers' });
  }
}

export async function createServiceProvider(req, res) {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Service provider name is required' });
  }

  try {
    const serviceProvider = await prisma.service_providers.create({
      data: { 
        id: randomUUID(),
        name 
      }
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
