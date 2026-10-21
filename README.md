# Everest Annapurna Deposter

**Himalayan Tour Capacity, Rotational Seating & Driver Manifest Portal**  
Designed for 4x4 Scorpio Jeeps & EV Vans on Everest, Annapurna, Mustang, Dhorpatan, and Muktinath routes across Nepal.

---

## 🎨 Design System & Visual Identity
The portal has been redesigned from the ground up to eliminate AI clichés (no purple/blue gradients, no neon glass, no emojis as icons, no left-border accent cards, and no generic dark dashboards):

- **Palette**: Warm paper background (`#F4EFE6`), near-black ink (`#1B1A17`), burnt-orange accent (`#B4570F`), and rust red (`#A4361F`) strictly reserved for unpaid balances & money still owed.
- **Typography**: Display headings in **Bricolage Grotesque**, body and form elements in **DM Sans** (via Google Fonts).
- **Iconography**: Clean, crisp inline SVGs only. Zero emojis as functional icons.
- **Mobile-First Ergonomics**: Tested and optimized for 390px mobile viewports (e.g., iPhone 12/13/14/15) with minimum 44px touch targets on all interactive controls. Customer manifests automatically transform into stacked tactile cards on mobile and expand to high-density editorial tables on desktop.
- **Seat Visualizer Matrix**: Each departure card features a visual row of small seat squares:
  - **Burnt Orange Filled Square (`#B4570F`)**: Booked seat.
  - **Outlined Canvas Square**: Available seat.
  - Live "X left" status badge and over-booking prevention.

---

## 👥 Dual Roles & Authorization Model

| Feature / Action | 👑 Admin (Lalitpur Holidays Dispatch) | 📋 Staff (Batuwa Trip & Travel Partners) |
| :--- | :--- | :--- |
| **View Departures & Seats** | Full access with financial summaries | Full access (open seats, route dates, vehicle) |
| **Add New Bookings** | Allowed with over-booking capacity checks | Allowed with over-booking capacity checks |
| **Edit Existing Bookings** | **Inline editing on all fields** (Name, Phone, Agency, Pax, Paid, direct Remaining edit) | **STRICTLY BLOCKED**: Rendered as static plain text |
| **Delete Bookings** | Allowed with confirmation & audit log | **STRICTLY BLOCKED**: No delete controls rendered |
| **Departure Total Owed** | Highlighted in Rust Red (`#A4361F`) | Hidden / Summary omitted |
| **Price Discrepancy Alert** | Warning if `Paid + Remaining ≠ Trip Price` | Non-blocking guidance during booking |
| **Instant Save & Audit Trail** | Auto-saves with "✓ Saved" pill & audit logging | N/A (read-only existing data) |
| **Driver Assignment & Depost** | Full control (Name, Phone, Plate, Presets) | View only |
| **Manage Packages & Routes** | Full control (Add, edit capacity, set rates) | View only |
| **Create / Edit Departures** | Full control (Mark private, change fleet run) | View only |

---

## 🔐 Real Supabase Auth & PostgreSQL Row Level Security (RLS)

The simulated toggle buttons have been replaced with **real Supabase Auth** backed by a PostgreSQL `profiles` table and strict Row Level Security:

### 1. Zero-Setup Automatic Connection (`config.js`)
- The manual connection modal has been removed for normal users.
- `config.js` defines `window.DEPOSTER_CONFIG` containing the Supabase Project URL and **public Anon key**.
- The key is cryptographically verified to contain `role: "anon"` and never exposes the `service_role` secret key.
- Every device running the app automatically connects on boot without any manual credential configuration.

### 2. Login Portal & Server-Enforced Role Authority
- **Warm Paper Login Artboard (`#loginView`)**:
  - Background: `#F4EFE6`, Ink: `#1B1A17`, Accent: `#B4570F`, 48px input touch targets.
  - Headings in **Bricolage Grotesque**, body in **DM Sans**.
  - Portal mode intent selector (Admin Dispatcher vs Staff Booking) with secure credentials.
  - A PostgreSQL `public.profiles` table stores each user's authenticated UUID (`id`), `role` (`admin` or `staff`), and `agency`.
  - The signed-in role is loaded from `profiles.role` in the database, **never trusted from the user's selector**. If a user selects "Admin" in the login screen but signs in with a staff account, they are safely initialized as **STAFF**, and a toast notification informs them of the database role enforcement.
- **Session & Sign Out**:
  - Supabase Auth session persistence keeps users logged in across refreshes.
  - Clicking **Sign Out** securely destroys the session, resets application state, and returns to `#loginView`.
  - Unauthenticated visitors cannot view or access the dispatch dashboard.

### 3. PostgreSQL Row Level Security (RLS)
The database tables are governed by strict RLS policies:
- **Signed-Out (Anon) Users**: Zero read access. `SELECT` queries on `customers`, `departures`, and `packages` return `0` rows.
- **Staff Users**: Can `SELECT` departures, packages, and bookings; can `INSERT` new passenger bookings only. Direct API attempts to `UPDATE` or `DELETE` customer records, adjust remaining balances, or edit departures are **rejected at the PostgreSQL level** (`0 rows modified`).
- **Admin Users**: Full authority to `SELECT`, `INSERT`, `UPDATE`, and `DELETE` customer records, adjust balances, assign drivers, and manage packages.

---

## 🔑 Production Authentication & Accounts

User accounts and role authorizations are secured by Supabase Auth and PostgreSQL `public.profiles`:

| Account | Email / Username | Database Role | Associated Agency |
| :--- | :--- | :--- | :--- |
| **Admin Dispatcher** | `admin@lalitpurholidays.com` (or `admin`) | `admin` | Lalitpur Holidays |
| **Staff Booking** | `staff@batuwatrip.com` (or `staff`) | `staff` | Batuwa Trip |

> [!NOTE]
> All passwords are encrypted in PostgreSQL via `pgcrypto` (`bf` / bcrypt). Default passwords have been replaced with strong credentials prior to production deployment.


