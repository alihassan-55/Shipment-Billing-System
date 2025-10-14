import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const sampleShippers = [
  {
    personName: 'Ali Ahmed',
    phone: '+92-300-1234567',
    address: '123 Main Street, Gulberg',
    city: 'Lahore',
    country: 'Pakistan',
    email: 'ali.ahmed@email.com'
  },
  {
    personName: 'Fatima Khan',
    phone: '+92-301-2345678',
    address: '456 Commercial Area',
    city: 'Karachi',
    country: 'Pakistan',
    email: 'fatima.khan@email.com'
  },
  {
    personName: 'Muhammad Hassan',
    phone: '+92-302-3456789',
    address: '789 University Road',
    city: 'Islamabad',
    country: 'Pakistan',
    email: 'm.hassan@email.com'
  }
];

const sampleConsignees = [
  {
    personName: 'John Smith',
    phone: '+1-555-123-4567',
    address: '123 Business Ave',
    city: 'New York',
    country: 'USA',
    email: 'john.smith@email.com'
  },
  {
    personName: 'Sarah Johnson',
    phone: '+44-20-1234-5678',
    address: '456 High Street',
    city: 'London',
    country: 'UK',
    email: 'sarah.johnson@email.com'
  },
  {
    personName: 'Ahmed Al-Rashid',
    phone: '+971-50-123-4567',
    address: '789 Sheikh Zayed Road',
    city: 'Dubai',
    country: 'UAE',
    email: 'ahmed.rashid@email.com'
  }
];

async function seedShippers() {
  console.log('Seeding shippers...');
  
  for (const shipper of sampleShippers) {
    try {
      await prisma.shipper.upsert({
        where: { personName: shipper.personName },
        update: {},
        create: shipper
      });
      console.log(`✓ Created shipper: ${shipper.personName}`);
    } catch (error) {
      console.error(`✗ Failed to create shipper ${shipper.personName}:`, error.message);
    }
  }
}

async function seedConsignees() {
  console.log('Seeding consignees...');
  
  for (const consignee of sampleConsignees) {
    try {
      await prisma.consignee.upsert({
        where: { personName: consignee.personName },
        update: {},
        create: consignee
      });
      console.log(`✓ Created consignee: ${consignee.personName}`);
    } catch (error) {
      console.error(`✗ Failed to create consignee ${consignee.personName}:`, error.message);
    }
  }
}

async function main() {
  try {
    await seedShippers();
    await seedConsignees();
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
