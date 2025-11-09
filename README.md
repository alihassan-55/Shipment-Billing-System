# Shipment Billing System

This repository contains a courier shipment and billing application (frontend + backend). I prepared this repository for pushing to a new remote — non-code files and common sensitive files are ignored via `.gitignore`.

Contents
- client/: React frontend (Vite + Tailwind)
- server/: Node/Express backend with Prisma
- docs/: Project docs

Notes
- I removed tracking of workspace files and temporary files and added a conservative `.gitignore` so only source code and essential project files are pushed.
- I did not change application logic — only cleanup and ignored files.

How to run (quick)

1. Install dependencies (server and client):
   - Server: run `npm install` in the `server` folder
   - Client: run `npm install` in the `client` folder
2. Start development server(s) as per existing `package.json` scripts.

If anything else should be excluded or if you want comment cleanup beyond workspace/temp files, tell me exactly which comment markers to remove.
