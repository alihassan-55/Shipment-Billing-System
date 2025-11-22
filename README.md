# Shipment Billing System

Contents
- client/: React frontend (Vite + Tailwind)
- server/: Node/Express backend with Prisma

## How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Ensure it's running and you have a database created)

### 1. Installation
The project has a convenient script to install dependencies for both client and server.
Run the following command from the **root** directory:

```bash
npm run install:all
```

### 2. Environment Setup
You need to set up environment variables for both the server and client.

**Server (`server/.env`):**
Create a `.env` file in the `server` directory with the following variables:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=3001
# Add other necessary variables (e.g., JWT_SECRET, etc.)
```

**Client (`client/.env`):**
Create a `.env` file in the `client` directory (if needed) or use the default Vite configuration.
```env
VITE_API_TARGET="http://localhost:3001"
```

### 3. Database Setup
Initialize the database schema using Prisma. Run this from the **root** directory:

```bash
npm run prisma:migrate
```
*(Or run `cd server && npx prisma migrate dev`)*

### 4. Running the Application
You can run the server and client separately.

**Start Server:**
```bash
npm run dev:server
```
*Server runs on [http://localhost:3001](http://localhost:3001)*

**Start Client:**
```bash
npm run dev:client
```
*Client runs on [http://localhost:5173](http://localhost:5173)*

### Useful Scripts
- `npm run install:all` - Install all dependencies
- `npm run dev:server` - Start server in dev mode
- `npm run dev:client` - Start client in dev mode
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

