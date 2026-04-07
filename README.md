# Mindora

Mindora is a desktop-first mind map editor built with React, TypeScript, Vite,
and Tauri. The app focuses on fast node editing, multiple layout modes, local
file workflows, export, and recovery of unsaved drafts.

## Stack

- React 19 + Vite for the UI shell
- TypeScript with strict checking
- Tauri 2 for desktop file access and native window integration
- Vitest + Testing Library for regression coverage
- ESLint + Prettier + EditorConfig for code quality

## Scripts

- `npm run dev`: start the Vite dev server
- `npm run tauri dev`: run the desktop app in development
- `npm run typecheck`: run TypeScript checks for app and tooling config
- `npm run lint`: run ESLint across the repo
- `npm run test`: run the Vitest suite
- `npm run build`: typecheck and build the production frontend bundle

## Architecture

The refactor in this repo organizes code around a few clear layers:

- `src/app`: application composition and top-level shells
- `src/domain`: pure business logic and domain types
- `src/features`: UI-facing feature modules for editor and export flows
- `src/platform`: browser and Tauri side effects
- `src/shared`: cross-cutting helpers that are not domain specific

The goal is to keep domain logic testable and framework-agnostic while pushing
file system access, window APIs, and rendering-specific code to feature and
platform layers.

## Development Notes

- The desktop backend lives in `src-tauri`.
- Recent files and draft recovery remain local-only.
- Export and file persistence compatibility are intentionally preserved during
  the refactor so existing documents continue to open without migration.
