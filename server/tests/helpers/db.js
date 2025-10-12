import bcrypt from 'bcrypt';

import { prisma } from '../../src/db/client.js';

export async function resetDb() {
  await prisma.payment.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedAdmin({ email = 'admin@example.com', password = 'admin123' } = {}) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { name: 'Admin', email, passwordHash: hash, role: 'admin' } });
}

export async function closeDb() {
  await prisma.$disconnect();
}

