# Design Spec: LiquidGlass Core UI Update
**Date:** 2026-04-20
**Status:** Draft

## 1. Vision & Goals
Transform the existing SecureAsset watermark tool into a premium, "LiquidGlass" inspired experience. The update focuses on a high-contrast dark aesthetic, improved mobile usability via bottom-anchored controls, and a more intuitive batch processing workflow.

## 2. Visual Design System
- **Theme:** Dark Mode (Absolute Black `#050505` base).
- **Glass Effects:**
    - `backdrop-filter: blur(40px) saturate(180%)`.
    - `background: rgba(10, 10, 10, 0.7)`.
    - `border: 1px solid rgba(255, 255, 255, 0.12)`.
- **Typography:**
    - Primary Font: **Inter** (Google Fonts).
    - Headings: Bold/Extra-Bold, high-contrast white.
    - Meta/Labels: Uppercase, tracking `0.2em` to `0.4em`, slate-500/600.
- **Accents:**
    - Background Blobs: Cyan (`#06b6d4`), Violet (`#7c3aed`), and Pink (`#db2777`) with heavy blur (120px).
    - Status: Emerald-500 for active/success states.

## 3. Architecture & Components
### Layout Strategy
- **Desktop:** Split-screen or multi-column layout with a sleek sidebar for settings and a large visual queue for batch assets.
- **Mobile:** Bottom-anchored action sheet (`liquid-sheet`) for primary inputs (Ownership ID, Protection Button). Center-focused asset preview.

### Key UI Elements
- **Floating Navbar:** Top-aligned, glass-morphic pill for switching between `PROTECT` and `VERIFY`.
- **Liquid Cards:** Rounded-3xl containers for asset items and configuration blocks.
- **Primary Action:** Large, white-on-black `btn-primary` with heavy shadow and hover lift.
- **Asset Thumbnails:** Rounded-2xl with subtle frosted borders and status indicators.

## 4. Interaction & UX
- **Transitions:** Smooth 300ms cubic-bezier transitions for all hover and state changes.
- **Feedback:** "Liquid" feel on buttons (slight scale on active, lift on hover).
- **Mobile Gestures:** Visual "handle" on bottom sheets to imply swipeability (even if implemented as click-to-expand initially).

## 5. Implementation Notes
- **Styling:** Vanilla Tailwind CSS with custom `extend` for blur and animation.
- **Responsiveness:** Mobile-first approach. Desktop will use `lg:` prefixes to transition from the bottom-sheet layout to a more expansive grid.
- **Icons:** Continue using `lucide-react` for a consistent, sharp look.
- **Cleanup:** Remove legacy `App.css` styles that conflict with the new glass-morphic system.

## 6. Success Criteria
- [ ] 100% Mobile responsive (no horizontal scroll, touch-friendly targets).
- [ ] Consistent "LiquidGlass" aesthetic across all screens.
- [ ] Improved batch processing visibility (clearer status indicators).
- [ ] Accessibility: Minimum 4.5:1 contrast for primary text.
