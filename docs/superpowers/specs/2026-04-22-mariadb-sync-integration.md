222# Specification: MariaDB Integration & Automated Sync

## 1. Overview
SecureAsset is transitioning from a standalone frontend to a monorepo architecture. This change introduces a MariaDB backend for persistent storage of templates, user settings, and tracking metadata, while maintaining a robust local-first experience.

## 2. Architecture
The project will be organized as an npm monorepo with the following structure:
- `packages/frontend`: Existing React/Vite application.
- `packages/backend`: New Node.js/Express server.
- `infrastructure/db`: Database migration scripts and configuration.

## 3. Data Storage Strategy
We will employ a "Local-First, Cloud-Synced" model:
- **Primary Interface:** Frontend interacts primarily with a local `IndexedDB` (via Zustand persistence).
- **Secondary Interface:** A background process (Sync Manager) periodically or reactively synchronizes local changes to MariaDB.
- **Failover:** If the backend is unreachable, the application continues to function normally using local storage. Data is queued for synchronization once connectivity is restored.

## 4. Synchronization Logic
- **Automated Sync:** No user intervention is required.
- **Conflict Resolution:** Last Write Wins (LWW). Every record includes an `updated_at` timestamp. The backend will only accept updates where the incoming timestamp is greater than the existing one.
- **Payload Integrity:** JSON objects will be used to store configuration data within MariaDB's `JSON` column type.

## 5. Schema Design (Liquibase)
The database will be initialized with the following tables:
- `user_settings`: User-specific global configurations.
- `watermark_templates`: Reusable protection configurations.
- `tracking_registry`: Metadata for each protected asset (ID, hash, owner, creation date).

## 6. Development Workflow
- **Database Migrations:** Managed exclusively via Liquibase.
- **Containerization:** A `docker-compose.yml` will be provided for easy local development with MariaDB.
