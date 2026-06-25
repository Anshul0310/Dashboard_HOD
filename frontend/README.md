# Department KPI Dashboard

A frontend-only React + TypeScript + Tailwind CSS web application for tracking institutional key performance indicators (KPIs). Features a real Power BI report embed on the Overview screen and 15-section KPI data-entry forms.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Architecture

```
src/
├── components/          # Reusable UI and layout components
│   ├── layout/          # AppLayout, Sidebar, TopBar, RoleGate
│   ├── powerbi/         # KpiReportEmbed (Power BI wrapper)
│   └── ui/              # KpiCard, StatusChip, DataTable, etc.
├── lib/                 # Data layer (types, store, mock data)
│   ├── types.ts         # All TypeScript interfaces
│   ├── store.ts         # Zustand state management
│   ├── mockData.ts      # Mock data for 6 periods (Jan-Jun 2026)
│   ├── powerbi.ts       # Power BI embed config stub ← SWAP POINT
│   ├── sectionSchema.ts # KPI section/field definitions
│   └── utils.ts         # Helpers, derived metrics
└── pages/               # Route-level page components
```

## Roles

| Role | Access |
|------|--------|
| **HOD** (Head of Department) | Full access — KPI data entry, dashboard, reports, notifications |
| **Management** (Viewer) | Read-only — Dashboard, reports, notifications |

Use the role switcher on the login page or the avatar dropdown to switch roles. No real authentication — just a client-side state flag.

## Power BI Integration

The Overview page has a real `<PowerBIEmbed>` component from `powerbi-client-react`. In development, it shows a placeholder state ("Connect a Power BI report to see live data"). To connect a real report:

### Prerequisites (NOT part of this frontend)

1. **A `.pbix` report** built in Power BI Desktop, modeled on the 15 KPI sections (Faculty, LMS, Publications, Placements, etc.), published to a **Power BI workspace** (requires Power BI Pro or PPU licensing).

2. **An Azure AD app registration** with permissions to embed reports (`Report.Read.All`, `Dataset.Read.All`).

3. **A backend endpoint** (e.g. `POST /api/powerbi/embed-token`) that:
   - Authenticates using the Azure AD app credentials (client ID + client secret)
   - Calls the Power BI REST API to generate a short-lived embed token
   - Returns `{ reportId: string, embedUrl: string, accessToken: string }`

### How to Connect

Edit **`src/lib/powerbi.ts`** — the `getEmbedConfig()` function:

```typescript
// Replace the stub with:
export async function getEmbedConfig(periodId: string): Promise<EmbedConfig | null> {
  const res = await fetch(`/api/powerbi/embed-token?period=${periodId}`);
  if (!res.ok) throw new Error('Failed to get embed token');
  const { reportId, embedUrl, accessToken } = await res.json();
  return {
    type: 'report',
    id: reportId,
    embedUrl,
    accessToken,
    tokenType: 1, // models.TokenType.Embed
    settings: POWERBI_SETTINGS,
  };
}
```

This is the **only file** that needs to change for Power BI connectivity.

## Backend Swap Points

The frontend is designed so a real backend can be connected by modifying only the data layer files in `src/lib/`:

| File | Current State | To Connect Backend |
|------|--------------|-------------------|
| `powerbi.ts` | Returns `null` (placeholder) | Fetch from `/api/powerbi/embed-token` |
| `store.ts` | Zustand store with local mock data | Replace with API calls or React Query |
| `mockData.ts` | Static JSON data | Remove once real API is connected |

## KPI Sections (15 total)

The following KPI sections are tracked, matching the official institutional KPI sheet:

1. Faculty (designation counts, student-faculty ratio, resignations)
2. LMS (lesson plan compliance, posting activity)
3. Late Punch In (faculty arriving after 09:15)
4. Faculty Publications (Q1, Q2, conference, journal papers)
5. Student Publications (same breakdown as faculty)
6. Funded Projects (under execution, proposals in preparation)
7. PhD Guideship (registered guides, eligible but unregistered)
8. MoUs (active MoUs, monthly activities)
9. FDP — Faculty Development Programs (participation, hours)
10. Placement — Graduating Batch (CTC bands, offer rates)
11. Awards — Faculty
12. Awards — Students (academic, sports, music)
13. Consultancy (under execution, new this month)
14. Partial Delivery of Teaching by Industry (subjects, hours, experts)
15. Patents / IPR (filed, published, granted)

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS v4** (styling)
- **Zustand** (state management)
- **React Router v7** (client-side routing)
- **powerbi-client-react** (Power BI embed)
- **Recharts** (supplementary charts on drill-down pages)
- **Lucide React** (icons)

## License

Private — Internal use only.
