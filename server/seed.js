import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          passwordHash: hashedPassword,
          role: 'admin',
          isActive: true
        }
      });

      console.log('Admin user created:', adminUser);
    }

    // Create sample shippers (customers with personName)
    const sampleShippers = [
      {
        name: 'Ali Ahmed',
        personName: 'Ali Ahmed',
        phone: '+92-300-1234567',
        address: '123 Main Street, Gulberg',
        city: 'Lahore',
        country: 'Pakistan',
        email: 'ali.ahmed@email.com'
      },
      {
        name: 'Fatima Khan',
        personName: 'Fatima Khan',
        phone: '+92-301-2345678',
        address: '456 Commercial Area',
        city: 'Karachi',
        country: 'Pakistan',
        email: 'fatima.khan@email.com'
      },
      {
        name: 'Muhammad Hassan',
        personName: 'Muhammad Hassan',
        phone: '+92-302-3456789',
        address: '789 University Road',
        city: 'Islamabad',
        country: 'Pakistan',
        email: 'm.hassan@email.com'
      }
    ];

    for (const shipper of sampleShippers) {
      try {
        await prisma.customer.upsert({
          where: { email: shipper.email },
          update: {},
          create: shipper
        });
        console.log(`✓ Created shipper: ${shipper.personName}`);
      } catch (error) {
        console.error(`✗ Failed to create shipper ${shipper.personName}:`, error.message);
      }
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();

