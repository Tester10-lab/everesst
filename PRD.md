# Product Requirements Document (PRD)
## Everest Annapurna Deposter - Himalayan Tour Capacity & Rotational Seat Management

### 1. Executive Summary & Context
**Everest Annapurna Deposter** is a mission-critical seat-availability and departure dispatch web application used daily by a tight-knit core operations team (4 dispatchers at Lalitpur Holidays) and partner travel agencies (Batuwa Trip, Hike on Treks, Samakhusi, Manjushree, etc.) across Nepal. It coordinates 4x4 Scorpio Jeeps (8-seat) and EV Vans (12-seat) across high-demand Himalayan routes (Upper Mustang, Ghandruk & Pokhara, Ama Yangri, Dhorpatan, Rara Lake, Muktinath, Everest Trailheads).

This redesign elevates the application from a generic dark dashboard with emoji clutter to a bespoke, editorial, high-trust dispatch tool crafted with warm paper aesthetics, crisp typography, rigorous role enforcement, and seamless mobile ergonomics.

---

### 2. Design Tokens & Visual Language
*Explicitly designed to avoid AI clichés: zero purple/blue neon gradients, no glassy neon cards, no emoji-as-icons, no generic left-border strips, no generic dark mode defaults.*

| Token Name | Hex Code / Spec | Purpose & Usage Guidelines |
| :--- | :--- | :--- |
| **Warm Paper Background** | `#F4EFE6` | Primary page canvas evoking archival Himalayan maps and expedition journals |
| **Canvas Surface** | `#FCFAF6` | Card backgrounds, drawer surfaces, modal dialogs, elevated paper |
| **Ink (Near-Black)** | `#1B1A17` | Primary typography, borders, high-contrast headings, solid icons |
| **Ink Secondary** | `#57534E` | Metadata, departure route subtitles, helper notes, table headers |
| **Paper Rule / Border** | `#E5DEC9` | Crisp hairline dividers, table grid lines, card perimeters |
| **Burnt Orange Accent** | `#B4570F` | Primary interactive elements, active tabs, booked seat squares, brand marks |
| **Burnt Orange Deep** | `#8F4206` | Hover and active pressed states for burnt orange buttons |
| **Rust Red (Owed Only)**| `#A4361F` | **STRICTLY RESERVED** for money still owed, unpaid balances, & financial warnings |
| **Muted Sand / Outline** | `#DDD6C5` | Inactive seat squares, subtle hover fills, disabled states |
| **Typography - Display** | `Bricolage Grotesque` | Headings, package titles, route badges, seat counters (`700`/`800`) |
| **Typography - Body** | `DM Sans` | Body text, table rows, form inputs, audit trails (`400`/`500`/`600`/`700`) |

#### Accessibility & Ergonomics Standards:
- **WCAG 2.2 AA Contrast**: Minimum contrast 4.5:1 for normal body text, 7:1 for headers. Rust red (`#A4361F`) on warm paper (`#F4EFE6`) yields 6.1:1 contrast. Near-black (`#1B1A17`) on warm paper yields 13.8:1 contrast.
- **Touch Target Floor**: All interactive buttons, inputs, tabs, and toggles have a minimum height and width of **44px × 44px**.
- **Iconography**: Clean inline SVGs only (departure arrows, vehicle outlines, checkmarks, trash, user shields, edit pencils). **Zero emojis as functional icons**.
- **Semantic HTML**: Real `<button>`, `<label for="...">`, `<input>`, `<select>`, `<dialog>`/modal semantics with proper `aria-label`, `aria-expanded`, and `role="status"` attributes.

---

### 3. Core Roles & Authorization Model

#### A. Administrator (`👑 Admin` - Lalitpur Holidays Dispatch)
- **Customer Management**:
  - Full inline editing of all passenger fields in real time: Name, Phone, Agency, Pax count, Paid amount, and **Remaining Amount (directly editable)**.
  - Delete customer bookings with confirmation / undo.
  - Add customer bookings to any departure.
- **Departure & Tour Operations**:
  - Create new departures (Date, Nepali date, Package, Vehicle, Capacity, Driver).
  - Edit departure details, switch assigned tour packages, change vehicle type & capacity.
  - Assign or remove drivers (Driver Name, Phone, Plate, quick presets).
  - Mark departures as **Private Tour** (locks booking to designated agency only) vs **Shared Departure**.
  - Delete departures.
- **Package Management**:
  - Create, rename, and edit tour package templates, default vehicles, base capacities, and default package price per passenger.
- **Financial Visibility**:
  - Sees total NPR still owed across each departure (styled in Rust Red `#A4361F`).
  - Discrepancy warning indicator if `Paid + Remaining != Total Package Cost`.
- **Audit Logging**:
  - Automatic audit log capture on every customer/departure edit (who changed what, previous value, new value, timestamp).

#### B. Travel Partner Staff (`📋 Staff` - Batuwa Trip & Partner Desks)
- **View Access**:
  - Browse all active departures, seat availability matrices, dates, and driver assignment statuses.
  - View passenger lists and booking agency names for coordination.
- **Booking Capability**:
  - Can **ADD NEW CUSTOMER BOOKINGS** into open seats up to remaining vehicle capacity.
- **Strict Restrictions**:
  - **CANNOT edit existing customer data**: existing rows display as clean static text, never editable inputs.
  - **CANNOT delete customer bookings**: no delete triggers rendered or executable.
  - **CANNOT edit packages, cannot edit departures, cannot change drivers, cannot delete departures**.
  - Explicit role banner ("STAFF ACCESS - View & Book Only") visible at all times with 1-click switcher for authorized credentials.

---

### 4. Data Security & Backend Enforcement
1. **Client-Side Gatekeeper**:
   - `enforceRolePermission(action, entity)` interceptor validates `state.role === 'admin'` before executing any `updateCustomer`, `deleteCustomer`, `updateDeparture`, `deleteDeparture`, or `updatePackage`.
   - Any unauthorized invocation immediately halts, rejects, logs an authorization denial, and notifies user.
2. **Supabase Database Row Level Security (RLS)**:
   - Configured in `supabase_setup.sql`:
     - `customers`:
       - `SELECT`: Allowed for all authenticated team members (`true`).
       - `INSERT`: Allowed for all team members (staff + admin).
       - `UPDATE`: Restricted to `auth.jwt()->>'role' = 'admin'` or admin email match.
       - `DELETE`: Restricted to `auth.jwt()->>'role' = 'admin'` or admin email match.
     - `departures` & `packages`:
       - `SELECT`: Allowed for all.
       - `INSERT`, `UPDATE`, `DELETE`: Restricted to `admin` role.

---

### 5. Mobile & Desktop Component Architecture
1. **Header & Navigation**:
   - Brand lockup: "EVEREST ANNAPURNA DEPOSTER" with route subtitle.
   - Role Indicator Badge: High-visibility pill showing current role (`Admin` or `Staff`) with quick role switcher.
   - Sync Status Indicator: Live Cloud WebSocket sync status or Local Storage fallback.
   - Global Quick Actions: "+ New Departure" (Admin only), "Manage Packages" (Admin only), "Search & Filter".
2. **Package & Departure Cards**:
   - Package title, next departure date (Gregorian + Nepali Bikram Sambat date).
   - Vehicle type (Scorpio 4x4 or EV Van) with capacity and driver badge (Name or "Pending Driver").
   - "X seats left" count with status color.
   - **Seat Visualizer Matrix**: A grid/row of clean seat squares:
     - Filled square (`#B4570F` burnt orange): Booked seat.
     - Outlined square (`#E5DEC9` on `#FCFAF6`): Open seat.
   - Tap/click anywhere on the card toggles the customer booking drawer below it.
3. **Customer Manifest Drawer**:
   - **Desktop Layout**: Elegant, high-density editorial table:
     - Columns: Customer (Name & Phone), Agency, Pax, Paid (NPR), Remaining (NPR), Actions / Status.
     - Admin mode: Editable input fields styled like clean ledger inputs with immediate blur/change auto-save and "Saved" flash pill.
     - Staff mode: Crisp static typography rows.
   - **Mobile Layout (390px)**: Stacked customer card view:
     - Card header: Customer Name & Agency badge.
     - Card body: 2-column or 3-column metric grid: Pax count, Paid amount, Remaining balance (in Rust Red `#A4361F`).
     - Admin mode: Form fields with touch-friendly 44px hitboxes.
     - Staff mode: Pure text display cards.
4. **Over-booking Prevention & Financial Guard**:
   - Vehicle capacity enforcement: Calculates `available = departure.capacity - totalBookedPax`.
   - If user attempts to add pax > available seats: Form locks, shows high-visibility alert banner with exact remaining seats and alternative suggestions.
   - Financial warning: If `customer.paid + customer.remaining !== (pax * packagePrice)` (or departure trip price), renders a gentle warning flag: `⚠️ Paid (NPR X) + Remaining (NPR Y) ≠ Expected (NPR Z)`.
5. **Instant Save & Audit Trail**:
   - Every admin inline edit triggers an automatic save to `state` & Supabase.
   - A discreet "✓ Saved" toast/pill confirms completion without intrusive page jumps.
   - An expandable "Departure Activity & Audit Trail" displays the recent history of changes with timestamps and authors.

---

### 4. Authentication Architecture & Security Model

#### Hosting & Backend Environment
- **Hosting**: **GitHub Pages** (`https://tester10-lab.github.io/everesst`) — Static client hosting (HTML5, Vanilla CSS, JS).
- **Backend & Database**: **Supabase Free Tier** (`https://mxvawuawegujcehjypcm.supabase.co`) — Managed PostgreSQL with `pgcrypto`, Row Level Security (RLS), and Security Definer Remote Procedure Calls (RPCs).

#### Authentication & Session Design
1. **User Storage (`public.app_users`)**:
   - Stores `username`, `password_hash` (hashed with `crypt(password, gen_salt('bf', 10))`), `role` (`admin` or `staff`), `agency`, and `created_at`.
   - Passwords are never stored in plaintext.
2. **Session Persistence (`public.app_sessions`)**:
   - Valid session tokens (cryptographically generated 64-character hex strings) mapped to user IDs with 30-day expiration timestamps.
   - Stored in browser `localStorage` as `deposter_session_v1`.
   - Session verified on page load via `app_verify_session(token)`.
3. **Database-Driven Role Authority**:
   - The user's role is strictly retrieved from the database record during `app_login`.
   - The UI Admin/Staff selector is an intent indicator; if an account with role `staff` logs in while the selector is on "Admin", the backend signs them in as `staff`.
4. **Access Gating**:
   - Unauthenticated / signed-out users cannot view the dashboard. They are gated at the Login page.
   - Database queries require valid session authentication; unauthenticated requests return zero rows.
5. **Staff Management Screen**:
   - Admin-exclusive panel to create staff accounts (`app_admin_create_staff`) and reset passwords (`app_admin_reset_password`).
6. **Server-Side Role Enforcement**:
   - `app_mutate_customer` checks the session's database role: Staff cannot update or delete customer records; only Admin can mutate or delete.

---

### 5. Implementation & Verification Plan
- **Phase 1**: Architecture & PRD Specification (Hosting & Backend proposal).
- **Phase 2**: Database Schema, Tables & Security Functions (`supabase_setup.sql`).
- **Phase 3**: Login Page UI (Warm paper, Bricolage Grotesque, 48px inputs, Admin/Staff selector).
- **Phase 4**: Session Management & Routing (Auto-redirect, sign-out, role view routing).
- **Phase 5**: Server/Database Role Enforcement (Direct API prevention).
- **Phase 6**: Admin Staff Management & Password Reset Interface.
- **Phase 7**: Automated Testing & Security Verification.

