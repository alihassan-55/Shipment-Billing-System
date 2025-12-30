import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const password = 'adminpassword123';
    const name = 'Admin User';

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (!existingUser) {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: 'ADMIN',
                isActive: true,
            },
        });
        console.log(`Created admin user: ${user.email}`);
    } else {
        // Ensure existing user is ADMIN
        if (existingUser.role !== 'ADMIN') {
            const updatedUser = await prisma.user.update({
                where: { email },
                data: { role: 'ADMIN' }
            });
            console.log(`Updated existing user to ADMIN: ${updatedUser.email}`);
        } else {
            console.log(`Admin user already exists: ${existingUser.email}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
