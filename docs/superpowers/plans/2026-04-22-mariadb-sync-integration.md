# MariaDB Integration & Automated Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition SecureAsset to a monorepo with a MariaDB backend and automated local-first synchronization.

**Architecture:** A monorepo using npm workspaces containing a React frontend and Express backend. Synchronization follows a "Local-First, Cloud-Synced" pattern using IndexedDB and a background sync manager.

**Tech Stack:** React 19, Express, MariaDB 11, Liquibase, Docker Compose, Zustand, npm workspaces.

---

### Task 1: Monorepo Restructuring

**Files:**
- Create: `package.json` (root)
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Modify: `packages/frontend/package.json` (moved from root)
- Modify: `vite.config.ts` (path adjustment)

- [ ] **Step 1: Create root package.json for workspaces**
```json
{
  "name": "secureasset-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev:frontend": "npm run dev -w packages/frontend",
    "dev:backend": "npm run dev -w packages/backend",
    "build:frontend": "npm run build -w packages/frontend",
    "db:up": "docker-compose up -d",
    "db:down": "docker-compose down"
  }
}
```

- [ ] **Step 2: Initialize folder structure**
Run: `mkdir -p packages/frontend packages/backend infrastructure/db`

- [ ] **Step 3: Move existing frontend files**
Move all current root files (except `.git`, `docs`, `packages`, `infrastructure`, and the new root `package.json`) into `packages/frontend/`.

- [ ] **Step 4: Create docker-compose.yml for MariaDB**
```yaml
services:
  mariadb:
    image: mariadb:11
    container_name: secureasset-db
    environment:
      MARIADB_ROOT_PASSWORD: root
      MARIADB_DATABASE: secureasset
      MARIADB_USER: user
      MARIADB_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - mariadb_data:/var/lib/mysql

volumes:
  mariadb_data:
```

- [ ] **Step 5: Verify frontend still builds**
Run: `npm run build:frontend`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add .
git commit -m "chore: restructure into monorepo with npm workspaces"
```

---

### Task 2: Backend Initialization & Schema (Liquibase)

**Files:**
- Create: `packages/backend/package.json`
- Create: `packages/backend/index.ts`
- Create: `infrastructure/db/changelog.xml`
- Create: `infrastructure/db/liquibase.properties`

- [ ] **Step 1: Initialize backend package.json**
```json
{
  "name": "@secureasset/backend",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "scripts": {
    "dev": "tsx watch index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.21.0",
    "mariadb": "^3.3.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "tsx": "^4.19.1",
    "typescript": "^5.6.2"
  }
}
```

- [ ] **Step 2: Create basic Express server with MariaDB connection**
```typescript
import express from 'express';
import cors from 'cors';
import mariadb from 'mariadb';

const app = express();
app.use(cors());
app.use(express.json());

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'user',
  password: 'password',
  database: 'secureasset',
  connectionLimit: 5
});

app.get('/api/health', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    res.json({ status: 'ok', database: 'connected' });
    conn.release();
  } catch (err) {
    res.status(503).json({ status: 'error', message: 'DB Unreachable' });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));
```

- [ ] **Step 3: Create Liquibase master changelog**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.0.xsd">

    <changeSet id="1" author="secureasset">
        <createTable tableName="templates">
            <column name="id" type="VARCHAR(36)">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="name" type="VARCHAR(255)"/>
            <column name="config" type="JSON"/>
            <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
        </createTable>
    </changeSet>

    <changeSet id="2" author="secureasset">
        <createTable tableName="settings">
            <column name="key" type="VARCHAR(50)">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="value" type="JSON"/>
            <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
        </createTable>
    </changeSet>
</databaseChangeLog>
```

- [ ] **Step 4: Verify backend and DB connectivity**
1. Run `npm run db:up`
2. Run `npm run dev:backend`
3. Check `http://localhost:3001/api/health`
Expected: `{ "status": "ok", "database": "connected" }`

- [ ] **Step 5: Commit**
```bash
git add packages/backend infrastructure/db
git commit -m "feat: init backend server and liquibase schema"
```

---

### Task 3: Frontend Sync Manager Implementation

**Files:**
- Create: `packages/frontend/src/utils/syncManager.ts`
- Modify: `packages/frontend/src/store/watermarkStore.ts`

- [ ] **Step 1: Define Sync Logic in frontend**
```typescript
// packages/frontend/src/utils/syncManager.ts
export const syncWithCloud = async (templates: any[], settings: any) => {
  try {
    const response = await fetch('http://localhost:3001/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templates, settings, timestamp: Date.now() })
    });
    return response.ok;
  } catch (e) {
    return false;
  }
};
```

- [ ] **Step 2: Update Zustand Store to trigger sync**
Add a subscription to the store that triggers the sync manager whenever templates change and the navigator is online.

- [ ] **Step 3: Implement Backend Sync Endpoint**
Add `POST /api/sync` to `packages/backend/index.ts` that performs upserts into MariaDB using `ON DUPLICATE KEY UPDATE` and timestamp checks.

- [ ] **Step 4: Verify sync**
1. Change a template in the UI.
2. Check MariaDB console: `SELECT * FROM templates;`
Expected: Data reflects the UI changes.

- [ ] **Step 5: Commit**
```bash
git add .
git commit -m "feat: implement automated background sync"
```
