# Customer Portal Modernization Plan
**Prepared by:** Denzil Dashboard, UX & Workflow Expert
**Objective:** Transform the current functional portal into a comprehensive "Customer Success Hub" that empowers clients, reduces support friction, and provides complete transparency.

## 1. Executive Vision
The current Customer Portal is functional but passive. It displays data (read-only) but doesn't invite interaction. My vision is to shift the paradigm from **"Viewing Records"** to **"Managing Facilities"**. The new portal will be visually immersive, mobile-first, and action-oriented.

## 2. Visual & UX Strategy

### A. "Premium Client" Aesthetic
*   **Palette:** Shift from the heavy "Admin Slate" to a lighter, airier interface.
    *   **Backgrounds:** Pure white content areas on soft gray (#f8fafc) canvas.
    *   **Accents:** Use the primary brand Cyan for actions, but introduce a sophisticated Navy for navigation and deep text.
*   **Typography:** Implement a strict hierarchy. Large, friendly greetings vs. crisp, tabular data.
*   **Feedback:** Every action (request sent, invoice paid) must have immediate, delightful visual feedback (Confetti or success animations).

### B. Navigation & Layout
*   **Desktop:** Retain the sidebar but make it collapsible. Introduce a "Top Bar" for global search (search any asset, site, or job) and notifications.
*   **Mobile:** **Crucial Change** - Move to a **Bottom Navigation Bar** for primary actions (Home, Request, Assets, More). This mimics native app behavior and improves thumb-reachability.

## 3. Core Feature Enhancements

### A. The "Smart" Dashboard
Instead of static numbers, the dashboard will tell a story:
1.  **Welcome Widget:** "Good Morning, [Name]. All systems are operational," or "Attention: 2 Sites require approval."
2.  **Service Request Wizard (New Feature):** A prominent "Request Service" button that opens a guided modal:
    *   *Where is the issue?* (Select Site)
    *   *What equipment?* (Select Asset or "General")
    *   *What's happening?* (Description + Photo Upload)
3.  **Financial Health (Recharts):** A bar chart showing "Spend by Month" or "Spend by Category" (Maintenance vs. Repairs).

### B. Enhanced Asset Management
*   **Health Indicators:** Assets lists will feature a "Health Traffic Light" system:
    *   🟢 Good (PM up to date, low breakdown count)
    *   🟡 Attention (PM due soon, aging)
    *   🔴 Critical (Overdue PM, frequent breakdowns)
*   **Asset Detail View:** Clicking an asset opens a slide-over panel (Sheet) showing its full lifecycle, specific documents, and specific history, rather than navigating away.

### C. Actionable History & Quotes
*   **Timeline View:** Replace the table with a vertical timeline for job history, showing the progression from "Reported" -> "Scheduled" -> "En Route" -> "Completed".
*   **Quote Approval:** A dedicated "Approvals" section. Customers can view a PDF quote and click "Approve" or "Query" directly in the portal.

## 4. Technical Implementation Plan

### Phase 1: Structural & Visual Foundation
*   Refactor `CustomerPortalLayout` to support the new "Premium" theme.
*   Implement `TopBar` with Global Search.
*   Create `MobileBottomNav` component (visible only on mobile).

### Phase 2: Dashboard & Visualization
*   **Library:** specific use of `recharts` for the spending/stats widgets.
*   **Components:**
    *   `StatusCard`: A rich card with icon, trend indicator, and action button.
    *   `ServiceRequestModal`: A multi-step form using `shadcn/ui` Dialog and Form.

### Phase 3: Comprehensive Lists (Sites/Assets)
*   **Smart Tables:** Implement sorting, filtering, and "View" modes (Grid vs List).
*   **AssetHealthBadge:** Logic to calculate and display asset health status.

### Phase 4: Interactions
*   **Notifications:** Integrate a notification center for "Engineer En Route" or "New Invoice" alerts.
*   **Skeleton Loading:** Replace spinners with `DashboardSkeleton` for a polished feel.

## 5. Mockup Concepts (Mental Model)

**Dashboard:**
```
[ Welcome, Acme Corp ] [ Search...          ] [ (Bell) (Profile) ]
------------------------------------------------------------------
[ Request Service (Primary CTA) ]  [ Download Monthly Report ]

[  Active Jobs  ] [   PM Compliance   ] [   YTD Spend    ]
[  (2) In Prog  ] [   (98%) Green     ] [    $12,450     ]
[   View >      ] [     View >        ] [   (Chart)      ]

[ Recent Activity ----------------------------------------- ]
| (Repaired) HVAC Unit 2 - Downtown Site          2 hrs ago |
| (Invoice)  PM Service #4592                     Yesterday |
| (Quote)    Compressor Replacement               Pending   |
-------------------------------------------------------------
```

**Mobile View:**
```
-----------------
| Hello, John   |
| [ Req Service]|
-----------------
| [Alert Card]  |
| PM Due @ Site A|
-----------------
| [Chart]       |
-----------------
[Home] [Assets] [Request] [Menu]
```
