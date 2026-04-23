# Final Vercel Deployment Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the Vercel "No Output Directory named 'public' found" error and final 404 issues by using standard Vercel monorepo conventions.

**Architecture:** 
1. **Simplified Build:** Remove the manual `public` directory creation and file copying. We will rely on Vercel's ability to point to a specific directory for static files.
2. **Dashboard-Centric Routing:** Instruct the user to set the "Output Directory" in the Vercel Dashboard to the actual build output of the frontend.
3. **Robust Rewrites:** Configure `vercel.json` to handle both the API bridge and SPA routing relative to the build output.

---

### Task 1: Clean up Build Scripts and Routing

**Files:**
- Modify: `package.json` (Root)
- Modify: `vercel.json`
- Modify: `README.md`

- [ ] **Step 1: Simplify Root Build Script**
Remove the complex `rm`, `mkdir`, and `cp` logic. Vercel will handle the directory management.
```json
  "scripts": {
    "build": "npm run build:frontend",
    "dev:frontend": "npm run dev -w packages/frontend",
    "dev:backend": "npm run dev -w packages/backend",
    "build:frontend": "npm run build -w packages/frontend",
    "db:up": "docker-compose up -d",
    "db:down": "docker-compose down"
  },
```

- [ ] **Step 2: Update Vercel Configuration**
Update `vercel.json` to be as simple as possible. Note that when "Output Directory" is set to `packages/frontend/dist` in the dashboard, the rewrites for static files are relative to that folder.
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.ts" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 3: Update README Deployment Guide**
Provide crystal-clear, step-by-step instructions for the Vercel Dashboard to ensure no further 404s.

- [ ] **Step 4: Commit**
```bash
git add package.json vercel.json README.md
git commit -m "fix: simplify vercel deployment by using standard output directory settings"
```
