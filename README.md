# 🏔️ Everest Annapurna Deposter

**Tour Capacity, Rotational Seating & Driver Manifest App**  
Designed for Himalayan 4x4 Scorpio Jeeps & EV Vans on Everest, Annapurna, Mustang, and Muktinath routes.

---

## 🚀 Instant Deployment to GitHub Pages (Make It Live in 2 Minutes)

Because this repository contains a self-contained `index.html` at the root, you can publish it directly to the web with zero server setup or build commands:

1. **Initialize Git & Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Everest Annapurna Deposter"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** → **Pages** (under "Code and automation" in the left sidebar).
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and `/ (root)`.
   - Click **Save**.
   - In 1–2 minutes, your live URL will be active at:  
     `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`

---

## 🌟 Key Features

### 1. Dual User Roles (Admin vs Staff)
- **👑 Admin Role**:
  - Full authority over tours, vehicles, agencies, and driver allocation.
  - **In-App Package & Route Manager (`⚙️ Edit Packages`)**: Rename any tour package, customize default vehicle (Scorpio 8 vs EV Van 12), adjust capacities, or add new Himalayan routes directly in the UI.
  - **Exclusive permission to depost drivers**: Enter Driver Name (mandatory), phone, vehicle plate, fuel/advance deposit, and lock the assignment.
  - Can create and modify tour routes, set private charter status, and reset data.
- **📋 Staff Role**:
  - Streamlined operational view for counter and dispatch staff.
  - Add, edit, and release passenger groups.
  - View calendar, open capacity, and remaining cash balances.
  - Copy driver WhatsApp manifests.
  - **Driver Deposting is locked**: Staff cannot depost or change driver details (`🔒 Admin Only`).

### 2. Mandatory Driver Name Deposting
- A driver cannot be officially deposted without a **Driver Name**.
- Dedicated **Admin Driver Deposter Station** with quick-autofill presets for veteran Himalayan drivers (Pasang Sherpa, Mingma Lama, Dipak Tamang, etc.).
- Depost status badges (`✅ Deposted` vs `⚠️ Pending Admin Depost`) appear across the dashboard, calendar, and manifests.

### 3. Rotational Seating (Fair Himalayan Travel)
- Strict rotational seating principle: **No fixed seat numbers** printed or assigned.
- Eliminates guest arguments over window or front seats on bumpy Himalayan mountain journeys.

### 4. Remaining Amount Only
- No confusing deposit ledger for drivers.
- Only the **Remaining Cash to Collect** is tracked and highlighted on the WhatsApp manifest.

### 5. 1-Click WhatsApp Manifests
- Produces clean, emoji-formatted WhatsApp manifests ready to send to drivers, guides, and agencies.
- Includes direct WhatsApp click links (`wa.me`) for instant dispatch.

---

## ⚡ Supabase Cloud & Real-time Multi-Device Sync

**Everest Annapurna Deposter** connects directly to **Supabase** via the official JavaScript SDK with zero server or backend build required. This allows your team members to log in from their smartphones, tablets, and office PCs simultaneously and see seat bookings update live on their screens in real-time.

### Pre-Configured Live Connection

The app is now pre-configured out-of-the-box with your project:
- **Project URL:** `https://mxvawuawegujcehjypcm.supabase.co`
- **Anon Public API Key:** Pre-embedded in the code.
- **Pre-loaded Tour:** Upper Mustang Overland (Kartik 5 gatey, Ujwal Baiju - 7 Pax, NPR 83,500 remaining) is already live in your database!

Whenever you or your team members open `index.html` (or push it to GitHub Pages), it connects to **Live Cloud** with real-time sync active immediately.

---

---

## 🔑 Team Authentication & Default Access Credentials

The portal features unified authentication for agency staff and dispatch administrators:

| Role | Agency | Default Email / Username | Password | Access Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin** | **Lalitpur Holidays** | `admin@lalitpurholidays.com` | `lalitpurholidays` | Full control: Depost drivers, edit packages & routes, select booking agency, view all financials |
| **📋 Staff** | **Batuwa Trip** | `staff@batuwatrip.com` | `Batuwa Trip` | Counter staff: Add/edit passenger bookings, view live seats, generate driver WhatsApp manifests |

> [!NOTE]
> • For quick access, the landing page also provides **1-Click Direct Access buttons** (`👑 Admin` and `📋 Staff`).
> • Driver manifests strictly protect agency privacy: booking agency names are confidential and omitted from WhatsApp driver manifests.

---

## 🛠️ Offline & Local Storage Resilience
- If Supabase credentials are not entered, or if internet connectivity drops in remote Himalayan areas, the app automatically runs seamlessly in offline mode using `localStorage`.
- No data is lost; you can still create departures, add passengers, and export WhatsApp manifests anywhere in Nepal.
