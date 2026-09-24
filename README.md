# 🌆 CityNexus AI - Citizen-to-Municipality Decision Support Platform
### *AI-Powered Civic Incident Triage Aligned with UN SDG 11: Sustainable Cities & Communities*

---

## 🌟 Mission & UN SDG 11 Alignment

Municipalities worldwide struggle with overwhelming citizen service backlogs, redundant reports for visible public failures, and subjective urgency triage. Minor issues often get addressed before life-threatening hazards, while critical infrastructure degradation goes unnoticed until catastrophic failure occurs.

**CityNexus AI** bridges the citizen-to-government divide by uniting:
1. **Multimodal Citizen Reporting**: Photos, GPS coordinate pinning, and natural Web Speech Voice AI.
2. **Gemini 2.5 Flash Visual Triage**: Automated structural threat evaluation, safety factor scoring ($1-15$), environmental hazard scoring ($1-10$), and cascading urban risk diagnosis.
3. **Deterministic Municipal Priority GIS Engine**: Algorithmic scoring on a $0 - 100$ scale combining AI hazard scores, Haversine geospatial duplicate clustering ($<150\text{m}$), and public transit corridor proximity bonuses ($<85\text{m}$).
4. **Actionable Municipal Dispatch Command Center**: Real-time cross-departmental queue, field crew assignment, live state synchronization with the interactive GIS map, and transparent public audit logs.

### UN SDG 11 Target Alignment
- **Target 11.1 (Safe Housing & Basic Services)**: Fast isolation of subterranean water main ruptures saves thousands of gallons of drinking water and prevents foundation washouts.
- **Target 11.2 (Sustainable Transport Corridors)**: Automated $+10$ point priority weighting for incidents within $85\text{m}$ of bus and light-rail routes protects transit reliability and cyclist safety.
- **Target 11.6 (Municipal Solid Waste & Air Quality)**: Rapid triage of hazardous chemicals, illegal refuse dumps, and microplastics prevents stormwater contamination.
- **Target 11.B (Disaster Risk Reduction & Resilience)**: Proactive clearing of choked stormwater drainage culverts mitigates street flooding before storm events.

---

## 📐 Algorithmic Priority Engine Specification

The system computes an objective **Priority Score ($0 - 100$)** for every civic report:

$$\text{Priority Score} = \min\left(100, \text{Base Severity} + \text{Duplicate Score} + \text{Safety Factor} + \text{Environmental Factor} + \text{Transit Bonus}\right)$$

### 1. Base Severity Score (AI-Determined)
- **Critical (P0)**: $+40$ points
- **High**: $+30$ points
- **Medium**: $+20$ points
- **Low**: $+10$ points

### 2. Duplicate Report Multiplier (Geospatial Clustering)
$$5 \times \text{nearby matching reports within } 150\text{ meters (capped at 25 points)}$$
When multiple citizens flag the same issue, the parent ticket priority automatically escalates, ensuring acute community concerns surface immediately.

### 3. Safety Threat Factor Score
- Inherited directly from the Gemini 2.5 Flash multimodal inspection ($1 - 15$ points).
- Accounts for high-voltage risks, pedestrian fall hazards, vehicle tire-burst threats, and toxic vapor exposure.

### 4. Environmental Threat Factor Score
- Inherited from Gemini ($1 - 10$ points).
- Evaluates potable water loss, stormwater culvert contamination, leachate generation, and microplastic dispersion.

### 5. Transit Proximity Bonus
- $+10$ points if the coordinates fall within $85\text{m}$ of designated rapid transit trunks (e.g. Market St Streetcar, Mission Transit Corridor, Van Ness BRT, Geary Blvd Express).

### Priority Score Thresholds
| Range | Label | Marker Color | Action SLA |
|---|---|---|---|
| **80 – 100** | **Critical** | Pulsing Red / Rose | Immediate Emergency Dispatch (<1 hr) |
| **60 – 79** | **High** | Vivid Orange | 4-Hour Rapid Response Crew |
| **30 – 59** | **Medium** | Yellow | 24-Hour Maintenance Window |
| **0 – 29** | **Low** | Emerald Green | Routine Preventive Maintenance |

---

## 🛡️ Zero Broken Flows & Resilient Architecture

1. **Deterministic Heuristic Fallback**:
   If the `GEMINI_API_KEY` is missing, invalid, or rate-limited, the backend automatically transitions to an internal deterministic linguistic & structural hazard analyzer. **The live demo never crashes.**
2. **Strict Security**:
   `GEMINI_API_KEY` is kept strictly server-side and never exposed to client-side code or browser network inspectors. All AI requests pass through `/api/analyze` and `/api/voice-assist`.
3. **No Mock Clicks**:
   Every status dropdown, map pin, voice button, and preset test scenario mutates real application state and syncs across the GIS map, KPIs, and audit trails.

---

## 🗂️ Project Directory Structure

```
citynexus-ai/
├── backend/
│   ├── .env.example              # Server environment variable template
│   ├── server.js                 # Standalone Express backend entry
│   ├── data/
│   │   └── seedData.ts           # 20 pre-seeded geocoded incidents with duplicate clusters
│   ├── services/
│   │   ├── geminiService.ts      # Gemini 2.5 Flash SDK integration + heuristic fallback
│   │   └── priorityEngine.ts     # Deterministic Haversine distance, transit routing & scoring
│   └── routes/
│       └── issues.ts             # Express REST API endpoints
├── src/
│   ├── index.css                 # Tailwind CSS & Leaflet custom pulse styling
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Master state coordinator & tab switcher
│   ├── components/
│   │   ├── Navbar.tsx            # Brand, SDG 11 badge, live counters & triggers
│   │   ├── LandingPage.tsx       # Hero, KPI ticker, 4-step pipeline & testbed
│   │   ├── CityMap.tsx           # Leaflet GIS map with pulsing markers & transit overlays
│   │   ├── MunicipalDashboard.tsx# Chart.js metrics & interactive dispatch table
│   │   ├── ReportIssueModal.tsx  # Photo upload, coordinate picker & side-by-side AI triage
│   │   ├── IssueDetailsModal.tsx # Full diagnostic breakdown, audit trail & dispatch controls
│   │   ├── VoiceAssistantModal.tsx# Web Speech API recognition & synthetic vocal playback
│   │   └── ImpactSDG11.tsx       # UN SDG 11 target analytics & carbon abatement calculator
│   └── utils/
│       └── api.ts                # TypeScript frontend API client
├── server.ts                     # Root fullstack Express + Vite dev server
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Step-by-Step Installation & Running Instructions

### Prerequisites
- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later

### Step 1: Clone the Repository
```bash
git clone https://github.com/example/urbanpulse-ai.git
cd urbanpulse-ai
```

### Step 2: Configure Environment Variables
Create your local `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Open `.env` and configure your API key (optional; system includes automated heuristic fallback):
```env
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
NODE_ENV=development
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run Application
Start the full-stack server (runs Express API + Vite frontend on port 3000):
```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

## 🌐 API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/issues` | Retrieve all civic reports with category, priority, and status filtering |
| `GET` | `/api/issues/:id` | Get comprehensive incident telemetry, photo, and audit trail |
| `POST` | `/api/analyze` | Standalone AI triage preview for the live side-by-side report modal |
| `POST` | `/api/issues` | Create new report with automated AI scoring and duplicate clustering |
| `PATCH` | `/api/issues/:id/status` | Update issue status (`Reported`, `Assigned`, `In Progress`, `Resolved`), assign crew, and append audit note |
| `POST` | `/api/issues/:id/vote` | Register citizen endorsement / upvote |
| `POST` | `/api/voice-assist` | Process natural citizen speech into structured civic report fields |
| `POST` | `/api/issues/reset` | Resets dataset back to the 20 preloaded realistic seed incidents |
| `GET` | `/api/health` | Health check endpoint reporting API status |

---

## 🧪 Hackathon Demonstration Scenarios

To test the application quickly during evaluation:
1. **Preset Testbed**: On the landing page, click any of the 4 **Instant Scenario Simulations** (e.g. *Water Main Break* or *Exposed Wires on Pole*). The Report modal opens pre-filled with real GIS coordinates, visual evidence, and descriptions.
2. **Side-by-Side Live AI Preview**: Click **"Preview Live Gemini Multimodal AI Triage"** to watch the animated AI pulse and view the real-time reasoning and safety scores.
3. **Voice Reporting**: Click **Voice AI** in the navbar, speak or choose a sample prompt, and listen to the synthetic vocal response confirmation.
4. **Geospatial GIS Map**: Navigate to **City Map** to view pulsing markers for P0 hazards, transit corridor lines, and duplicate cluster badges.
5. **Municipal Dispatch Table**: Change an incident status to **"In Progress"** or **"Resolved"** and watch the KPIs, doughnut chart, and GIS map markers reflect the change immediately.

---

## 📜 License
Licensed under Apache License 2.0. Built for Google AI Studio Build Hackathon.
