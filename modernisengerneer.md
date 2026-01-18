# Modernisation Strategy for Engineer Mobile App

This document outlines a comprehensive approach to modernising the `EngineerMobile.jsx` page, transforming it into a robust, offline-first Progressive Web App (PWA) tailored for field engineers.

## Executive Summary

The current implementation is a monolithic component using local state, which makes it fragile and difficult to maintain. While it has basic offline detection, it lacks true offline capability (write support). The goal is to refactor this into a modular, performant application that guarantees data integrity regardless of network conditions.

## 1. Architecture & State Management

### Current Issues
- Monolithic `useState` for all data (jobs, customers, parts, form state).
- No persistence for form data if the app is closed or refreshed.
- Offline support is visual-only; write operations fail without network.

### Proposed Solution

#### A. Data Fetching & Caching: **TanStack Query (React Query)**
Replace `useEffect` data fetching with React Query.
- **Benefits**: Automatic background refetching, caching, and loading/error states.
- **Offline Read**: React Query can persist the cache to `localStorage` or `IndexedDB`, allowing engineers to view jobs even after restarting the app offline.

#### B. Local Database: **Dexie.js (IndexedDB)**
Implement a local database to store:
- **Jobs**: Full details of assigned jobs.
- **Lookups**: Customers, Sites, Assets, Parts.
- **Offline Mutation Queue**: Actions taken while offline (e.g., "Complete Job", "Update Status").

#### C. Offline-First "Write" Strategy
Instead of calling the API directly:
1.  **Action**: Engineer clicks "Complete Job".
2.  **Local Commit**: Update the local `Dexie` database immediately (UI updates instantly).
3.  **Queue**: Add a task to the `MutationQueue` table.
4.  **Sync**: A background process (or Service Worker) watches the queue and sends requests when online.

## 2. PWA Enhancements

### A. Manifest File
**Critical Missing Piece**: The project currently lacks a `manifest.json` in `frontend/public`.
- **Action**: Create `manifest.json` defining the app name, icons, theme color (`#0f172a` for slate-900), and `display: standalone`.

### B. Service Worker & Background Sync
The current `service-worker.js` has a placeholder for `sync-job-completions`.
- **Action**: Implement the `sync` event listener fully.
- Connect it to IndexedDB to read pending mutations and execute them.
- Use the **Background Sync API** so syncs happen even if the app is closed.

## 3. Component Refactoring

Decompose `EngineerMobile.jsx` (currently ~500 lines) into focused components:

- **`EngineerLayout.jsx`**: Handles the shell, bottom navigation, and offline indicators.
- **`JobCard.jsx`**: Individual job summary for the list view.
- **`JobSheet.jsx`**: The main workspace for a specific job.
- **`JobTabs/`**:
    - `DetailsTab.jsx`: Site info, assets, status buttons.
    - `ChecklistTab.jsx`: Dynamic checklist handling.
    - `PartsTab.jsx`: Parts search and "used parts" list.
    - `CompletionTab.jsx`: Notes, photos, time tracking.
- **`SignaturePad.jsx`**: Reusable wrapper for the signature canvas.

## 4. UX/UI Modernisation

### Navigation
- **Current**: Conditional rendering `!showJobSheet ? ... : ...`.
- **Proposed**: Use `react-router-dom` nested routes.
  - `/engineer/jobs`: List view.
  - `/engineer/jobs/:jobId`: Detail view.
  - **Benefit**: Browser back button works naturally; deep linking is possible.

### Gestures & Interactions
- **Swipe Actions**: Swipe a job card right to "Start Travel", left to "Reject" (if applicable).
- **Pull-to-Refresh**: specific action to force a sync/download of new jobs.
- **Haptic Feedback**: Use `navigator.vibrate` when completing a checklist item or scanning a code.

### Visual Feedback
- **Toast Notifications**: Differentiate between "Saved to Server" (Green) and "Saved to Outbox" (Amber).
- **Skeleton Loading**: Replace full-screen spinners with skeleton UI for cards to perceive faster loading.
- **Dark Mode**: Ensure consistent dark mode implementation (currently hardcoded slate-900), possibly supporting system preference.

## 5. Implementation Roadmap

### Phase 1: Foundation (No Logic Changes)
1.  Extract UI components (`JobCard`, `Tabs`, etc.) from the main file.
2.  Implement `react-router-dom` routing for the Job Sheet.

### Phase 2: Data Layer (Read)
1.  Install `tanstack/react-query` and `dexie`.
2.  Create the `Dexie` database schema.
3.  Replace `axios.get` calls with React Query hooks that seed the Dexie DB.

### Phase 3: Offline Write & Sync
1.  Implement the `MutationQueue` in Dexie.
2.  Create a custom hook `useMutateJob` that writes to DB and manages the queue.
3.  Implement the "Replay" logic to process the queue when online.

### Phase 4: PWA Polish
1.  Add `manifest.json`.
2.  Update Service Worker for aggressive caching of static assets.
3.  Add "Install to Home Screen" prompt logic.

## Recommended Tech Stack Additions
- `@tanstack/react-query`: Data fetching/caching.
- `dexie`: IndexedDB wrapper.
- `react-use-gesture` (optional): For swipe interactions.
- `idb`: Lightweight IndexedDB alternative if Dexie is too heavy (though Dexie is recommended for DX).
