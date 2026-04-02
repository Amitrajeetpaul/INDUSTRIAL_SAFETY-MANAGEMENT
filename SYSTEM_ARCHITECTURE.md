# 🧩 InduSafe: Comprehensive System Logic & Architecture

This document explains the "Total Logic" of how InduSafe functions, from the database triggers to the smooth animations on your screen.

---

### 🔙 1. The Backend Logic (The Brain)

The backend is built using **Node.js** and **Express**, with **Postgres** for persistent data.

#### **A. The Data Model (Single-Source-of-Truth)**
The backend logic starts in `shared/schema.ts`. We use **Drizzle ORM** to define tables. This ensures that every piece of data (Incident, Sensor, Training Record) has a strict structure that the frontend also understands.

#### **B. The Simulation Engine**
This is what makes the app feel "alive." In `server/routes.ts`, we implemented a **background event loop** (`setInterval`). Every 10 seconds, it:
1.  Fetches all environmental metrics.
2.  Adds a small random "noise" to the values (e.g., pH goes from 7.0 to 7.1).
3.  Saves the new value to the database.
4.  Updates the Sustainability power-load metrics.

#### **C. API & Authentication**
We use **Session-based Authentication** via **Passport.js**. When you login, a "Cookie" is stored in your browser. Every future request to `/api/incidents` or `/api/training` sends this cookie back. The server checks it before returning data—ensuring privacy.

---

### 🎨 2. The Frontend Logic (The Body)

The frontend is a **Single Page Application (SPA)** built with **React** and **Vite**.

#### **A. Smart Data Fetching (TanStack Query)**
Instead of just fetching data once, the frontend uses a "Polling" logic. 
*   **Logic**: `useQuery({ queryKey: ['/api/metrics'], refetchInterval: 10000 })`
*   **Result**: Every 10 seconds, the frontend automatically asks the backend "Is there anything new?" If the backend says yes, the UI updates instantly without a page refresh.

#### **B. SVG Interaction & Mapping**
The **Floorplan Map** is the most complex frontend logic.
*   **Internal Routing**: We use **Wouter** for lightweight routing (e.g., `/ppe`, `/training`).
*   **Layering**: The map is an SVG. We use "Conditional Rendering" to stack layers:
    1.  Base Map (The factory walls).
    2.  Drill Overlays (The flashing routes).
    3.  Incident Markers (The icons).
*   **Event Handling**: When you click a marker, a state variable `selectedIncident` is updated, which triggers the "Insight" modal to fade into view.

#### **C. Data Visualization**
We use **Recharts** for the analytics. The logic here is "Transformation." We take a raw array of numbers from the backend and transform them into a "Point Map" that the charts can draw as smooth curves.

---

### 🔄 3. Putting it Together: The "Report" Flow

To explain the **Total Logic** to an HR manager, use this sequence:
1.  **Input**: A worker fills out a form on the **Report Incident** page.
2.  **Processing**: The frontend sends a `POST` request to `/api/incidents`.
3.  **Storage**: The backend validates the data using **Zod** (schema validation) and saves it to **Postgres**.
4.  **Feedback**: The backend returns the new incident with a unique ID.
5.  **Broadcast**: The **Dashboard** (which is polling the API) sees the new incident and automatically places a red marker on the **Floorplan Map** via the SVG layer—all in under 10 seconds.

---

### 🛡️ 4. Security & Roles
*   **Logic**: The `Navigation` component parses the `user.role` from the `useAuth` hook.
*   **Effect**: If the role is NOT `admin` or `manager`, the sidebar links to "PPE Inventory" or "Training" are logically hidden from the DOM, and the router blocks access to those URLs.
