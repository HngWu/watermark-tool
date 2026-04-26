# SecureAsset - Gemini CLI Context

This project is a high-security, full-stack asset protection and verification suite. It utilizes forensic watermarking (LSB, DCT, EXIF), a liquid-glass UI aesthetic, and automated cloud synchronization via MariaDB.

## Project Overview

- **Purpose:** Protect digital assets through multi-layered visible and invisible watermarking.
- **Core Features:**
  - **Visible Watermarking:** Highly customizable tilted text and QR code overlays.
  - **Invisible Watermarking:** Redundant LSB and robust DCT embedding layers.
  - **Metadata Protection:** EXIF metadata fallback for robust ownership tracking.
  - **LiquidGlass UI:** Modern, high-contrast dark theme with mobile-optimized bottom-anchored controls.
  - **Automated Sync:** Real-time synchronization of templates and settings to a MariaDB database.
  - **Verification Gateway:** Deep-scan authentication to verify signatures and detect tampering.

## Technologies

- **Frontend:** [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/), [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Backend:** [Node.js](https://nodejs.org/), [Express 4](https://expressjs.com/), [MySQL2](https://github.com/sidorares/node-mysql2)
- **Database:** [MariaDB 10.11+](https://mariadb.org/)
- **DevOps:** [Vercel](https://vercel.com/) (Serverless), [Docker Compose](https://docs.docker.com/compose/)
- **Utility:** [lucide-react](https://lucide.dev/), [zustand](https://github.com/pmndrs/zustand), [tweetnacl](https://github.com/dchest/tweetnacl-js)

## Architecture (Monorepo)

- `packages/frontend/`: React application containing the UI and client-side processing logic.
- `packages/backend/`: Express server handling database synchronization and health checks.
- `api/`: Vercel serverless bridge that exports the backend `app`.
- `infrastructure/db/`: Database schema definitions and Liquibase changelogs.
- `docs/superpowers/`: Project specifications and implementation plans.

## Building and Running

### Root Commands (Workspaces)
- `npm install`: Install dependencies for the entire monorepo.
- `npm run build`: Build the frontend for production.
- `npm run dev:frontend`: Start the React development server.
- `npm run dev:backend`: Start the Express backend (via `tsx watch`).
- `npm run db:up`: Start the local MariaDB container (Port 3307).

## Development Conventions

- **Security:** Ensure all image processing (LSB/DCT) remains strictly client-side.
- **State Management:** Use Zustand with persistence for the frontend store.
- **Styling:** Adhere to the LiquidGlass aesthetic (bg-[#050505], glass-card, animate-blob).
- **Database:** Always include `updated_at` timestamps for the Last-Write-Wins sync logic.
- **Deployment:** Maintain the `api/` bridge and root-level build mapping for Vercel compatibility.
