# Watermark Tool - Gemini CLI Context

This project is a high-security, browser-based image watermarking and verification tool. It utilizes a dual-layer approach (LSB + EXIF) to ensure watermark robustness and provides tamper detection via CRC32.

## Project Overview

- **Purpose:** Protect digital assets through visible and invisible watermarks.
- **Core Features:**
  - **Visible Watermarking:** Customizable text and QR code overlays.
  - **Invisible Watermarking (LSB):** Redundant Least Significant Bit embedding in three image regions for crop resistance.
  - **EXIF Metadata Fallback:** Robust backup storage in image metadata.
  - **Tamper Detection:** Uses CRC32 checksums to verify watermark integrity.
  - **Forensic Tracking:** Adds subtle noise patterns (fingerprinting) and DRM grids.
  - **Privacy:** All processing occurs locally in the browser; images are never uploaded to a server.

## Technologies

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite 7](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Image Metadata:** [piexifjs](https://github.com/hMatoba/piexifjs) (loaded via CDN)

## Architecture

The application is structured as a single-page React application.

- `src/App.tsx`: Contains the core logic for both watermarking and verification, including:
  - CRC32 utility functions.
  - LSB embedding and extraction algorithms.
  - EXIF manipulation via `piexifjs`.
  - Forensic and DRM protection layers.
  - UI state management for both "Watermark" and "Verify" tabs.
- `src/main.tsx`: Entry point for the React application.
- `src/index.css`: Global styles including Tailwind imports.

## Building and Running

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## Development Conventions

- **Styling:** Follow the existing Tailwind CSS patterns found in `src/App.tsx`. Use the established color palette (Slate, Purple, Pink, Cyan).
- **Icons:** Use `lucide-react` for consistent iconography.
- **Safety:** Ensure all image processing remains client-side.
- **Robustness:** Maintain the dual-layer (LSB + EXIF) and redundant (3-region) strategy for any updates to the watermarking logic.
- **Validation:** Always verify both LSB and EXIF layers during the verification process.
