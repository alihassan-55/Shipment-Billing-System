import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'employee', 'accountant']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(req, res) {
    try {
      const parse = registerSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
      }

      const result = await this.authService.register(parse.data);
      res.status(201).json(result);
    } catch (error) {
      if (error.message === 'Email already in use') {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req, res) {
    try {
      const parse = loginSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
      }

      const result = await this.authService.login(parse.data);
      res.json(result);
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}