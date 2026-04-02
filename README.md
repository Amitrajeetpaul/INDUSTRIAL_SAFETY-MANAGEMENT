# 🛡️ InduSafe: Enterprise Industrial Safety Management System

**InduSafe** is a next-generation "Safety-as-a-Service" platform designed for high-risk industrial environments like manufacturing plants, chemical assembly lines, and warehouse logistics. It transforms workplace safety from a static "compliance checklist" into a proactive, real-time digital command center.

---

### 🏛️ 1. Project Vision
The system's core goal is to **zero out workplace accidents** by providing instant visibility into environmental conditions, worker readiness, and operational risks. It leverages real-time data streaming and AI-driven insights to help managers transition from reactive firefighting to predictive protection.

---

### 🛠️ 2. Key Features

#### **A. Real-Time Command Center (Dashboard)**
*   **Safety Scoreboard**: Live tracking of incident counts, active cases, and a risk-weighted safety score.
*   **Sensor Insight**: High-precision monitoring for Air Quality (PM2.5, CO2), Water systems (pH, Turbidity), and Machine Health (Temperature, Vibration).
*   **Interactive Floorplan**: A "Digital Twin" of the facility with real-time incident markers mapping where safety risks are occurring.
*   **Emergency Drill Mode**: One-click activation that overlays animated evacuation routes, safety wardens, and fire exits.

#### **B. Workforce Compliance**
*   **Safety Training Dashboard**: Monitors worker certifications (Forklift, First Aid, Hazmat) with automated visual alerts for **Valid**, **Expiring Soon**, and **Expired** statuses.
*   **PPE Inventory Control**: Live stock tracking for safety gear (Hard Hats, Respirators, Goggles) with inspection history and governance records.

#### **C. Sustainability & ESG**
*   **Energy Monitoring**: Real-time tracking of electricity usage per production area (kWh).
*   **Carbon Analysis**: Automated conversion of energy usage into CO2 footprint data for ESG auditing.

---

### 💻 3. Technology Stack

*   **Frontend**: ⚛️ React.js, ⚡ Vite, 🎨 Tailwind CSS, ✨ Framer Motion, 📊 Recharts.
*   **Backend**: 🟢 Node.js, 🚀 Express.js, 🧠 Zod (Validation).
*   **Database**: 🐘 PostgreSQL with 💧 Drizzle ORM.
*   **Auth**: 🔑 Passport.js with Session-based security.

---

### 🚀 4. Getting Started

1.  **Clone the repository**:
    ```bash
    git clone [your-repo-link]
    cd Industrial-Safe-System
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment**:
    Create a `.env` file with:
    ```env
    DATABASE_URL=your_postgres_url
    SESSION_SECRET=your_random_secret
    ```

4.  **Run migrations**:
    ```bash
    npm run db:push
    ```

5.  **Start Development Server**:
    ```bash
    npm run dev
    ```

6.  **Access the Portal**:
    Open `http://localhost:5000` (Default: `admin` / `password123`)

---

### 💰 5. Business Value
1.  **Risk Mitigation**: Drastically reduces insurance premiums by providing data-driven "proof of safety."
2.  **Regulatory Compliance**: Ensures the facility is always audit-ready for OSHA/HSE inspections.
3.  **Operational Excellence**: Prevents "Down Time" by identifying machine failure before it leads to an accident.

---
**Developed with ❤️ by the InduSafe Team.**
