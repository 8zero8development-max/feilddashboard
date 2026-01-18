# Scheduler Modernization Plan

**Author:** Denzil Dashboard, UX & Workflow Specialist
**Status:** Draft
**Target Component:** `frontend/src/pages/Scheduler.jsx`

## Executive Summary

The current Scheduler provides basic functionality but lacks the visual fidelity and workflow efficiency required for a high-performance Field Service Management (FSM) dashboard. This modernization plan aims to transform the Scheduler into a "Mission Control" center—visually stunning, intuitively interactive, and data-rich.

Our goal is to reduce dispatcher cognitive load by visualizing resource availability clearly and streamlining the assignment process through direct manipulation (drag-and-drop).

## 1. UX & Visual Overhaul

### 1.1 "Mission Control" Aesthetic
*   **Design System Integration:** Fully leverage `shadcn/ui` components to replace generic HTML/CSS. Use consistent typography, spacing, and rounded corners (radius-md).
*   **Color Palette:** Move away from basic primary colors to a semantic palette:
    *   **Status:** Emerald (Completed), Amber (In Progress), Slate (Pending), Rose (Urgent).
    *   **Resources:** Distinct, soft pastel backgrounds for engineer rows in Resource view to aid readability.
*   **Typography:** Use a monospaced font for times and job numbers for quick scanning.

### 1.2 Enhanced Event Cards
Replace the standard "blue bar" with a rich `EventComponent`:
*   **Header:** Job Number (bold) + Priority Indicator (color-coded border/strip).
*   **Body:** Customer Name (truncated), Site Name.
*   **Footer:** Icons representing Job Type (Wrench for Repair, Clipboard for PM) and Status.
*   **Interaction:**
    *   **Hover:** `HoverCard` revealing full details (Contact, Description, SLA) without clicking.
    *   **Click:** Opens the detailed `JobSheet` modal.

## 2. Core Functional Upgrades

### 2.1 The "Parking Lot" (Unscheduled Jobs Sidebar)
*   **Concept:** A dedicated sidebar panel containing jobs that need attention (Unassigned or Pending).
*   **Layout:**
    *   Implemented using `react-resizable-panels` to allow the dispatcher to adjust the workspace.
    *   Searchable and Filterable (e.g., "Show only Urgent repairs").
*   **Interaction:** These items are "Draggable Sources" that can be dropped onto the main calendar.

### 2.2 Resource View (Timeline)
*   **The Problem:** The current Week/Month views hide resource conflicts.
*   **The Solution:** Implement a `resource` view where:
    *   **Y-Axis:** Engineers (represented by Avatar + Name + Skills badges).
    *   **X-Axis:** Time (continuous timeline).
*   **Benefit:** Instantly see who is free at 2 PM, who is overbooked, and who is traveling.

### 2.3 Drag-and-Drop Workflow
*   **Sidebar to Calendar:** Dragging a job from the "Parking Lot" to an engineer's timeline slot:
    1.  Updates the `scheduled_date` and `scheduled_time`.
    2.  Updates the `assigned_engineer_id`.
    3.  Optimistically updates the UI.
*   **Calendar to Calendar:**
    *   **Reschedule:** Move horizontally to change time.
    *   **Reassign:** Move vertically to change engineer.
*   **Conflict Handling:** Visual cues (red outline) when dragging over an occupied slot.

## 3. Technical Implementation Strategy

### 3.1 Dependencies
*   **Drag & Drop:** Integrate `react-dnd` and `react-dnd-html5-backend`. While `react-big-calendar` has a DnD addon, a full `react-dnd` implementation offers greater control for the external "Parking Lot" interactions.
*   **UI Components:** Usage of `shadcn/ui` (Card, Badge, Avatar, ScrollArea, Popover, Tooltip).

### 3.2 State Management & Performance
*   **Data Fetching:**
    *   Split the massive `Promise.all` into focused hooks (e.g., `useScheduledJobs`, `useUnscheduledJobs`, `useResources`).
    *   Implement `refetch` capabilities to update the board without a full page reload after a drop action.
*   **Filtering Logic:**
    *   Client-side filtering for immediate feedback on small datasets (< 500 jobs).
    *   Preparation for server-side filtering params if data grows.

### 3.3 Proposed Component Structure
```text
Scheduler.jsx
├── SchedulerLayout (Resizable Panels)
│   ├── UnscheduledSidebar (The Parking Lot)
│   │   ├── FilterBar
│   │   └── DraggableJobCard List
│   └── MainCalendarArea
│       ├── CalendarToolbar (View switcher, Date nav, Global Filters)
│       └── BigCalendar (with DnD context)
│           ├── CustomEventComponent (The rich card)
│           └── ResourceHeader (Engineer profiles)
└── JobEditDialog (The existing modal, refined)
```

## 4. Next Steps (Action Plan)

1.  **Scaffold Layout:** Implement the `react-resizable-panels` structure.
2.  **Build the "Parking Lot":** Create the sidebar and fetch logic for unscheduled jobs.
3.  **Upgrade Calendar:** Switch to `resource` view configuration and style the custom Event components.
4.  **Wire up DnD:** Implement the drag-and-drop logic for assignment and rescheduling.
5.  **Refine & Polish:** Apply the "Mission Control" visual styling and test interactions.
