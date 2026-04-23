# SecureAsset: Forensic Watermarking & Asset Protection

SecureAsset is a high-performance, forensic watermarking tool designed for asset protection and verification. It features a modern **LiquidGlass UI** and a **local-first, cloud-synced** architecture powered by MariaDB.

## 🚀 Key Features
- **Forensic Watermarking:** Supports LSB, DCT, and EXIF embedding layers for robust protection.
- **LiquidGlass UI:** High-contrast, dark-themed interface with mobile-optimized controls.
- **Real-time Synchronization:** Automated background sync with a cloud-hosted MariaDB database.
- **Verifiable Integrity:** Deep-scan authentication to verify forensic digital signatures and ownership data.
- **Monorepo Architecture:** Organized as an npm workspace for seamless full-stack development.

## 🛠️ Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide-React, Zustand.
- **Backend:** Node.js, Express, MySQL2 (compatible with MariaDB).
- **Database:** MariaDB (Local Docker or Cloud-hosted).
- **Deployment:** Optimized for Vercel Serverless Functions.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- npm (v10+)
- Docker Desktop (optional, for local DB)

### 2. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 3. Database Configuration
You can run MariaDB locally via Docker:
```bash
npm run db:up
```
*Note: The local database is mapped to port **3307** to avoid conflicts.*

### 4. Environment Variables
Create a `.env` file in `packages/backend/`:
```bash
cp packages/backend/.env.example packages/backend/.env
```
Fill in your local or cloud database credentials in `packages/backend/.env`.

### 5. Start the Application
Run both frontend and backend in development mode:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

---

## ☁️ Hosting & Deployment Guide (Vercel)

SecureAsset is pre-configured for **Vercel** as a monorepo.

### 1. Database Hosting (Cloud MariaDB)
First, obtain a hosted MariaDB instance from a provider like **Aiven**, **Railway**, or **PlanetScale**. 
- Create a database named `secureasset`.
- Run the table creation scripts (see `infrastructure/db/changelog.xml` or manual SQL in project history).

### 2. Vercel Project Setup
1.  **Connect to GitHub:** Push your repository to GitHub and link it to a new project in the [Vercel Dashboard](https://vercel.com).
2.  **Framework Preset:** Set this to **Other** (important for monorepos).
3.  **Build Settings:**
    - **Build Command:** `npm run build`
    - **Output Directory:** Leave this **Empty** (default). Vercel will automatically serve from the `public` folder created by the build command.
4.  **Environment Variables:** Add the following variables in the Vercel project settings:
    - `DB_HOST`: Your cloud database host.
    - `DB_PORT`: `3306` (or as specified by your provider).
    - `DB_USER`: Database username.
    - `DB_PASSWORD`: Database password.
    - `DB_NAME`: `secureasset`.
5.  **Deploy:** Click **Deploy**. Vercel will now correctly build the frontend and serve the backend from the `api/` directory.

### ⚠️ Troubleshooting Build Failures
If you see a `sh: line 1: tsc: command not found` error during the build:
1. Ensure you have **NOT** manually set `NODE_ENV: production` in the Vercel Dashboard Environment Variables. Vercel sets this automatically during runtime, but setting it manually in the dashboard can cause the build process to skip installing necessary tools like `typescript`.
2. If you must keep `NODE_ENV: production`, ensure you set `NPM_CONFIG_PRODUCTION=false` in the Vercel dashboard to force the installation of build tools.


### 3. Verification
Once deployed, your frontend will be live at `https://your-project.vercel.app`, and your backend API will be accessible at `https://your-project.vercel.app/api`.

---

## 📂 Project Structure
```text
├── packages/
│   ├── frontend/      # React + Vite UI
│   └── backend/       # Express + MySQL2 API
├── infrastructure/
│   └── db/            # Database schema & Liquibase migrations
├── vercel.json        # Vercel monorepo configuration
└── package.json       # Root workspace configuration
```

## 📜 License
This project is private and intended for secure asset management.
