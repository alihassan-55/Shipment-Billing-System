import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function seedServiceProviders() {
  const serviceProviders = [
    'UPS via DXB',
    'USPS USA',
    'DPD via UK',
    'Parcel Force UK',
    'UPS via UK',
    'FedEx',
    'DHL',
    'TNT',
    'Aramex'
  ];

  console.log('Seeding service providers...');

  for (const name of serviceProviders) {
    try {
      await prisma.service_providers.upsert({
        where: { name },
        update: {},
        create: { 
          id: randomUUID(),
          name 
        }
      });
      console.log(`✓ Created service provider: ${name}`);
    } catch (error) {
      console.error(`✗ Failed to create service provider ${name}:`, error.message);
    }
  }

  console.log('Service providers seeding completed!');
}

async function main() {
  try {
    await seedServiceProviders();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
