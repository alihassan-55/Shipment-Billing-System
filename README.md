# Courier Management System

A non-industrial but high-quality, scalable Courier Management System. Clean architecture with React + Express + PostgreSQL and JWT, designed for maintainability and future growth.

## Documentation
- Full SRS & implementation blueprint: `docs/SRS.md`

## Tech Stack
- Frontend: React (Vite), Tailwind CSS, ShadCN/UI
- Backend: Node.js, Express.js
- Database: PostgreSQL (Prisma or Sequelize)
- Auth: JWT
- PDFs: PDFKit

## Getting Started
1. Start infra services
   - `docker compose up -d`
2. Backend setup
   - `cd server`
   - `npm install`
   - Create `.env` with:
     - `PORT=3001`
     - `NODE_ENV=development`
     - `JWT_SECRET=replace-with-strong-secret`
     - `DATABASE_URL=postgresql://postgres:Hassan$322.$@localhost:5432/postgres`
   - `npm run prisma:generate`
   - `npm run prisma:migrate` (create initial DB)
   - `npm run dev`
3. Open healthcheck: `http://localhost:3001/api/health`

## Quick Auth Test
1. Create an admin user directly in DB or via a temporary script. Example SQL:
   - Insert a user with a bcrypt hash in `User` table and role `admin`.
2. Login:
   - POST `http://localhost:3001/api/auth/login` with `{ "email": "admin@example.com", "password": "<password>" }`
   - Copy the returned `token`.
3. Get current user:
   - GET `http://localhost:3001/api/users/me` with header `Authorization: Bearer <token>`
4. Create a user (admin only):
   - POST `http://localhost:3001/api/users` with JSON `{ "name":"Test", "email":"t@example.com", "password":"pass123", "role":"operator" }` and the same `Authorization` header.

## Roadmap
See `docs/SRS.md` section 16 for suggested sprints.

