# 🛠️ InduSafe: Technical Deep-Dive & Animation Guide

This guide is designed to help you answer technical interview questions about the InduSafe codebase, covering architecture, animations, and feature logic.

---

### ⚛️ 1. Core Tech Stack
*   **Frontend**: React (UI), Vite (Build Tool), Tailwind CSS (Styling), Framer Motion (Animations), Recharts (Data Visualization).
*   **Backend**: Node.js (Runtime), Express (Web Framework), Drizzle ORM (Database Layer), Postgres (Database).
*   **State Management**: TanStack Query (React Query) for server state and caching.

---

### ✨ 2. How Animations Work
We use **Framer Motion** for almost all UI interactions to give it a "Premium" feel.

#### **A. Page Transitions**
*   **How it works**: Every page is wrapped in a `<motion.div>` with `initial`, `animate`, and `exit` props.
*   **Visual Effect**: Content subtley slides up and fades in, making the app feel fluid rather than "staccato."

#### **B. Emergency Drill Animation**
*   **How it works**: When `drillMode` is toggled, we use CSS `stroke-dasharray` and `animate` to create the "pulsing" or "moving" effect on SVG paths (the evacuation routes).
*   **Specifics**: The "⚠️ DRILL ACTIVE" button uses a scale animation (`animate={{ scale: [1, 1.05, 1] }}`) repeating infinitely to create a heartbeat effect.

#### **C. Metric Fluctuations**
*   **How it works**: The sensor reading cards use `framer-motion`'s `layout` prop. If data changes, the numbers transition smoothly rather than jumping.

---

### ⚙️ 3. Component Logic: "How does Option X work?"

#### **Q: How is the Floorplan Map rendered?**
*   **A**: It’s an **SVG (Scalable Vector Graphics)** component. We map incident coordinates directly to the SVG space. When an incident is selected, we calculate its position and render an overlay `div` on top.

#### **Q: How do you simulate "Live" data?**
*   **A**: In `server/routes.ts`, we use a `setInterval` that runs every 10 seconds. It randomly fluctuates the `value` of environmental metrics and power load, then saves them to the database. The frontend uses React Query with a `refetchInterval` to "poll" these changes and update the UI instantly.

#### **Q: How does the PDF Export work?**
*   **A**: We implemented a mock API endpoint `/api/incidents/:id/pdf`. In a production environment, this would use a library like `jspdf` or `puppeteer` to convert a HTML template into a PDF file.

#### **Q: How is security handled?**
*   **A**: We use **Passport.js** for authentication. Each API route is protected by a `req.isAuthenticated()` check. Furthermore, we implemented **Role-Based Access Control (RBAC)**—certain pages (like Risks and PPE) check `user.role` before allowing entry.

---

### 📊 4. Data Layer Architecture
*   **Single Source of Truth**: All data models (Users, Incidents, Training, Sustainability) are defined in `shared/schema.ts`. This file is shared between the frontend and backend to ensure zero "type-mismatch" errors.
*   **Storage Abstraction**: We use an `IStorage` interface (`server/storage.ts`). This allows us to potentially switch from the current Postgres database to something else without changing the rest of the server code.

---

### 🌟 5. Summary of "Win" Features for Demos
1.  **The Polling Logic**: Mention how you used `refetchInterval` to avoid manual refreshes.
2.  **The SVG Interaction**: Explain how you handled coordinate mapping for the interactive floorplan.
3.  **The Schema Sharing**: Show off how the `shared` folder prevents bugs by keeping types in one place.
