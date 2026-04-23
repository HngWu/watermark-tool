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

- [x] **Step 1: Create root package.json for workspaces**
- [x] **Step 2: Initialize folder structure**
- [x] **Step 3: Move existing frontend files**
- [x] **Step 4: Create docker-compose.yml for MariaDB**
- [x] **Step 5: Verify frontend still builds**
- [x] **Step 6: Commit**

---

### Task 2: Backend Initialization & Schema (Liquibase)

**Files:**
- Create: `packages/backend/package.json`
- Create: `packages/backend/index.ts`
- Create: `infrastructure/db/changelog.xml`
- Create: `infrastructure/db/liquibase.properties`

- [x] **Step 1: Initialize backend package.json**
- [x] **xStep 2: Create basic Express server with MariaDB connection**
- [x] **Step 3: Create Liquibase master changelog**
- [x] **Step 4: Verify backend and DB connectivity**
- [x] **Step 5: Commit**

---

### Task 3: Frontend Sync Manager Implementation

**Files:**
- Create: `packages/frontend/src/utils/syncManager.ts`
- Modify: `packages/frontend/src/store/watermarkStore.ts`

- [x] **Step 1: Define Sync Logic in frontend**
- [x] **Step 2: Update Zustand Store to trigger sync**
- [x] **Step 3: Implement Backend Sync Endpoint**
- [x] **Step 4: Verify sync**
- [x] **Step 5: Commit**
