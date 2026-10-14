# ✂️ Sonal Tailor — Workshop Companion & Measurement Viewer

A streamlined, mobile- and tablet-optimized companion application built specifically for the tailoring workshop and cutting floor of **Sonal Boutique**.

<p align="left">
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## 🤝 Relationship with Sonal Boutique

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     Sonal Boutique (Admin)      │           │     Sonal Tailor (Workshop)     │
│  - POS Billing                  │           │  - Bill Number Quick Search     │
│  - Record Customer Measurements │           │  - Measurement Inspector        │
│  - Upload Fabric / Sketch Photos│           │  - Fullscreen Design Lightbox   │
│  - Accounting, Ledgers & Bishi  │           │  - Mobile & Tablet Friendly     │
└────────────────┬────────────────┘           └────────────────┬────────────────┘
                 │                                             │
                 │                 Shared                      │
                 └──────────────►  Supabase  ◄─────────────────┘
                                   Database
```

Both applications operate against the **same shared Supabase PostgreSQL database**:
- **Sonal Boutique** creates orders, inputs customer body measurements, and uploads reference design photos to Supabase Storage (`job-specifications`).
- **Sonal Tailor** provides cutters, masters, and tailors instant, read-only access to active tailoring jobs and measurement specifications without requiring administrative login or navigating POS billing screens.

---

## 💡 Core Workflows & Features

### 1. Instant Bill Lookup
- Search any tailoring order simply by entering the customer's **Bill Number** (e.g., `1042`).
- Friction-free access on cutting tables without password prompts or session timeouts.
- Displays customer name, phone number, and transaction date.

### 2. Active Tailoring Workload Filtering
- Filters out inactive, cancelled, or retail-only transactions.
- Displays active tailoring jobs progressing through workshop stages:
  - `ordered` ➔ `preparation` ➔ `cutting` ➔ `stitching` ➔ `finishing` ➔ `ironing` ➔ `complete`
- Clearly tags cloth ownership (**Customer Provided** vs **Boutique Provided**).

### 3. Comprehensive Garment Measurements
Deep, structured breakdown of garment specifications for each job item:
- **Core Lengths**: Full Length, Body Length, Kurti Length, Blouse Length
- **Upper Body**: Shoulder, Chest, About, Waist, Stomach, Hips
- **Silhouettes & Cuts**: Cut, Gher, Front Neck, Back Neck
- **Sleeves Specification**: Full, 3/4th, Elbow, and Short Sleeves (displaying Length `L` and Gher `g`)
- **Bottom / Pant Measurements**: Pant Length, Pant Thighs, Pant Knee, Pant Ankle
- **Custom Workshop Notes**: Direct special instructions from the customer or boutique designer.

### 4. Interactive Design & Sketch Lightbox Gallery
- Inspect high-resolution customer reference photos, embroidery patterns, and fabric swatches.
- **Responsive Fullscreen Lightbox Viewer**:
  - ⬅️ ➡️ **Keyboard Navigation**: Left/Right arrow keys cycle images; Escape key closes.
  - 📱 **Touch Swipe Support**: Tailors on phones or tablets can swipe smoothly through multi-photo references.
  - 🔍 **Detail Zoom**: Full-screen resolution preview for inspecting fine embroidery and stitch patterns.

### 5. Due Date Urgency & Overdue Indicators
- Formatted delivery dates with calendar icons.
- High-visibility warning badges for overdue orders so the workshop can prioritize urgent deadlines.

---

## 📁 Project Structure

```plaintext
SonalTailor/
├── app/
│   ├── job/[id]/     # Measurement inspector & design lightbox gallery
│   └── page.tsx      # Main Bill search & active workload dashboard
├── components/
│   └── ui/           # Touch-friendly button and input components
├── utils/
│   └── supabase/     # Supabase client instantiation
└── tailwind.config.ts# Responsive layout & styling config
```

---

## 🚀 Setup & Getting Started

### 1. Prerequisites
- **Node.js**: v18.18.0 or higher
- **npm** / **yarn** / **pnpm**
- The shared **Sonal Boutique** Supabase backend instance

### 2. Environment Variables
Create a `.env.local` file in the `SonalTailor/` root directory:

```env
# Shared Supabase Project Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Installation & Run

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the assigned port if running concurrently with Sonal Boutique) to start using the workshop portal.
