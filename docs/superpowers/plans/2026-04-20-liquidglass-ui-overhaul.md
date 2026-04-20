# LiquidGlass Core UI Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the SecureAsset UI to a high-contrast dark "LiquidGlass" aesthetic with mobile-optimized bottom-anchored controls.

**Architecture:** 
1. **Global Styles:** Inject Google Fonts (Inter) and define custom Tailwind animations/utilities for the glass effect.
2. **Layout Overhaul:** Replace the current grid system with a mobile-first bottom-anchored sheet and desktop-first sidebar layout.
3. **Component Refinement:** Surgical update of existing `App.tsx` components to use the new glass-morphic primitives.

**Tech Stack:** React 19, Tailwind CSS 3.4, Lucide-React, Google Fonts.

---

### Task 1: Global Design Tokens & Typography

**Files:**
- Modify: `index.html` (Inject Fonts)
- Modify: `tailwind.config.js` (Custom utilities)
- Modify: `src/index.css` (Glass-morphic base)

- [ ] **Step 1: Inject Inter Font in `index.html`**

Modify `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Extend Tailwind Config for Blurs & Contrast**

Modify `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'liquid': '40px',
      },
      animation: {
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Define Global Glass Utilities in `src/index.css`**

Modify `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .glass-card {
    @apply bg-white/[0.03] backdrop-blur-liquid border border-white/10 shadow-2xl;
  }
  .liquid-input {
    @apply bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-white/30 transition-all duration-300;
  }
  .btn-liquid-primary {
    @apply bg-white text-black font-extrabold uppercase tracking-widest py-4 px-8 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl;
  }
}

body {
  @apply bg-[#050505] text-slate-200 overflow-x-hidden;
}

.bg-blob {
  @apply absolute rounded-full filter blur-[100px] opacity-40 mix-blend-screen animate-blob;
}
```

- [ ] **Step 4: Commit**

```bash
git add index.html tailwind.config.js src/index.css
git commit -m "style: add liquidglass design tokens and global styles"
```

---

### Task 2: Background Atmosphere & Layout Shell

**Files:**
- Modify: `src/App.tsx` (Layout structure)

- [ ] **Step 1: Add Atmosphere Blobs to `App.tsx`**

Modify the root `div` in `App.tsx`:
```tsx
return (
  <div className="min-h-screen relative overflow-hidden flex flex-col font-sans selection:bg-white/30">
    {/* Atmosphere */}
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="bg-blob bg-cyan-500 w-[500px] h-[500px] -top-48 -left-48" />
      <div className="bg-blob bg-purple-600 w-[600px] h-[600px] -bottom-48 -right-48 animation-delay-2000" />
      <div className="bg-blob bg-pink-500 w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
    </div>

    <div className="relative z-10 flex-1 flex flex-col">
      {/* Rest of components */}
    </div>
  </div>
);
```

- [ ] **Step 2: Re-architect Header as Floating Pill**

Modify Header in `src/App.tsx`:
```tsx
<header className="flex flex-col items-center gap-6 pt-12 pb-8 px-6">
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
      <Shield className="w-6 h-6" />
    </div>
    <h1 className="text-2xl font-black tracking-tighter text-white">SecureAsset</h1>
  </div>
  
  <nav className="flex glass-card p-1 rounded-full border-white/5">
    <button 
      onClick={() => setActiveTab('watermark')} 
      className={`px-8 py-2.5 rounded-full text-[10px] font-black tracking-[0.2em] transition-all ${activeTab === 'watermark' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}
    >
      PROTECT
    </button>
    <button 
      onClick={() => setActiveTab('verify')} 
      className={`px-8 py-2.5 rounded-full text-[10px] font-black tracking-[0.2em] transition-all ${activeTab === 'verify' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}
    >
      VERIFY
    </button>
  </nav>
</header>
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "ui: add background atmosphere and floating header"
```

---

### Task 3: Mobile Action Sheet & Main Content Area

**Files:**
- Modify: `src/App.tsx` (Main content & Mobile sheet)

- [ ] **Step 1: Implement Main Content Area (Preview Focus)**

Modify `src/App.tsx` main grid to separate Preview from Controls:
```tsx
<main className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-12 lg:p-12 relative">
  {/* Left/Center: Visual Queue & Preview */}
  <div className="flex-1 p-6 lg:p-0 space-y-12">
     {/* Asset grid logic here */}
  </div>

  {/* Right/Bottom: Controls */}
  <div className="lg:w-[420px] pb-32 lg:pb-0">
    {/* Control sheet logic here */}
  </div>
</main>
```

- [ ] **Step 2: Transform Settings into Liquid Bottom Sheet (Mobile)**

Update the settings container in `src/App.tsx`:
```tsx
<section className="fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto glass-card rounded-t-[3rem] lg:rounded-[3rem] p-8 pb-12 lg:pb-8 border-t border-white/20 lg:border-white/10 flex flex-col gap-8 transition-transform duration-500 translate-y-0 z-50">
  <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2 lg:hidden" /> {/* Handle */}
  
  <div className="flex justify-between items-center">
    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration</h2>
    {/* Save Preset Button */}
  </div>

  <div className="space-y-6">
    <div className="space-y-2">
      <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Recipient Identity</label>
      <input 
        type="text" 
        className="liquid-input w-full"
        placeholder="Enter name..."
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
    </div>

    <button 
      onClick={applyWatermarkAll}
      className="btn-liquid-primary w-full flex items-center justify-center gap-4"
    >
      <Shield className="w-5 h-5" />
      Initiate Protection
    </button>
  </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "ui: implement mobile bottom sheet and main content layout"
```

---

### Task 4: Asset Card & Verification View Overhaul

**Files:**
- Modify: `src/App.tsx` (Asset cards & Verification view)

- [ ] **Step 1: Update Asset Queue Cards to LiquidGlass Style**

Update `imageList.map` in `src/App.tsx`:
```tsx
<div 
  key={img.id} 
  onClick={() => setSelectedPreviewId(img.id)} 
  className={`group relative glass-card p-4 rounded-[2.5rem] transition-all duration-500 cursor-pointer ${selectedPreviewId === img.id ? 'border-white/40 ring-1 ring-white/20 scale-[1.02]' : 'border-transparent hover:border-white/20'}`}
>
  <div className="aspect-square rounded-[2rem] overflow-hidden bg-black/40 mb-4 border border-white/5">
    <img src={img.previewSrc || img.watermarkedSrc || img.src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
  </div>
  {/* Status & Name labels */}
</div>
```

- [ ] **Step 2: Update Verification View**

Update `verify` tab content in `src/App.tsx`:
```tsx
<div className="max-w-2xl mx-auto p-8 space-y-12">
  <div className="text-center space-y-4">
    <h2 className="text-[10px] font-black tracking-[0.5em] text-white uppercase">Authentication Gateway</h2>
    <p className="text-slate-500 text-xs font-light tracking-widest">Verify forensic digital signatures and ownership data.</p>
  </div>

  <div 
    onClick={() => verifyInputRef.current?.click()} 
    className="glass-card rounded-[3rem] p-12 border-dashed border-white/10 hover:border-white/30 transition-all duration-700 cursor-pointer group text-center"
  >
     {/* Upload/Preview logic */}
  </div>

  <button className="btn-liquid-primary w-full">Start Deep Scan</button>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "ui: overhaul asset cards and verification view"
```

---

### Task 5: Final Refinement & Accessibility Check

**Files:**
- Modify: `src/index.css` (Animations & Contrast)
- Modify: `src/App.tsx` (Final tweaks)

- [ ] **Step 1: Add animation-delay utility**

Modify `src/index.css`:
```css
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
```

- [ ] **Step 2: Verify Contrast & Touch Targets**
Ensure all buttons have `min-h-[60px]` for mobile and contrast ratio > 4.5:1 for labels.

- [ ] **Step 3: Commit**

```bash
git add src/index.css src/App.tsx
git commit -m "polish: final liquidglass refinements and a11y check"
```
