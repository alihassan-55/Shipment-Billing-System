import { z } from 'zod';

export const UserRole = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  ACCOUNTANT: 'accountant'
};

export const UserSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.ACCOUNTANT]).default(UserRole.EMPLOYEE),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export class User {
  constructor(data) {
    Object.assign(this, UserSchema.parse(data));
  }

  toJSON() {
    const { password, ...user } = this;
    return user;
  }
}