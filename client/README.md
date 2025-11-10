# Courier Management System - Frontend

A modern React frontend for the Courier Management System built with Vite, Tailwind CSS, and ShadCN/UI components.

## Features

- 🔐 **Authentication** - JWT-based login system
- 📊 **Dashboard** - Overview with key metrics and quick actions
- 👥 **Customer Management** - CRUD operations for customers
- 📦 **Shipment Tracking** - Create and track shipments with waybill numbers
- 📄 **Invoice Management** - Generate and manage invoices
- 💳 **Payment Tracking** - Record and track payments
- 📈 **Reports** - Analytics and export functionality
- 📤 **Bulk Import** - CSV upload for bulk data entry

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **ShadCN/UI** - Component library
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3000`

## API Integration

The frontend automatically proxies API calls to the backend server running on `http://localhost:3001`. Make sure your backend server is running before using the frontend.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # ShadCN/UI components
│   └── Layout.jsx     # Main layout component
├── pages/              # Page components
├── stores/             # Zustand state stores
├── lib/                # Utility functions
└── App.jsx            # Main app component
```

