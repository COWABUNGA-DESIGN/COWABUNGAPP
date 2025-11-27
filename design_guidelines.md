# ELEVEX ERP Design Guidelines

## Design Approach
**System:** Custom enterprise design system inspired by Carbon Design and Fluent Design, adapted for data-heavy lift dealership operations with ELEVEX branding overlay.

**Rationale:** This is a utility-focused, information-dense ERP system requiring efficiency and clarity. The existing ELEVEX login establishes strong visual identity that will be maintained throughout while prioritizing functionality.

## Core Design Elements

### A. Typography
**Font Family:** Inter (via Google Fonts CDN)
- Headings: Inter 600-700 (semibold to bold)
- Body text: Inter 400-500 (regular to medium)
- Data tables/forms: Inter 400 (regular)
- Buttons/UI elements: Inter 500-600 (medium to semibold)

**Hierarchy:**
- Page titles: text-2xl to text-3xl, font-semibold
- Section headers: text-xl, font-semibold
- Card titles: text-lg, font-medium
- Body/labels: text-sm to text-base
- Data tables: text-sm, tabular-nums for numbers

### B. Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Table cells: p-3, p-4

**Grid Structure:**
- Dashboard: 12-column grid with responsive breakpoints
- Sidebar navigation: Fixed 256px (w-64) on desktop, collapsible on mobile
- Main content area: max-w-7xl with px-4 to px-8 padding
- Data tables: Full-width within containers, horizontal scroll on mobile

### C. Component Library

**Navigation:**
- Fixed left sidebar (dark background #0f0f19) with animated ELEVEX logo at top
- Animated logo GIF displays brand identity with subtle motion
- Department icons with labels (Sales, Service, Parts, Accounting, etc.)
- Top bar with subtle gradient overlay (cyan → purple → pink at 10% opacity)
- Language toggle (FR/EN) in top-right
- Employee business card banner displays on dashboard

**Cards & Containers:**
- Background: rgba(15, 15, 25, 0.92) with backdrop-blur
- Border: 1px solid rgba(255,255,255,0.12)
- Border-radius: rounded-xl (12px) for cards, rounded-lg (8px) for smaller elements
- Box-shadow: Subtle elevation, 0 4px 12px rgba(0,0,0,0.3)

**Forms:**
- Input fields: Dark background rgba(255,255,255,0.07), border rgba(255,255,255,0.2)
- Focus state: Red accent border (#c00), subtle glow
- Labels: text-sm font-medium, mb-2
- Icon prefixes: 16px left padding for inputs with icons
- Validation: Red error text, green success text

**Data Tables:**
- Striped rows for readability (alternate row background)
- Sticky header on scroll
- Sortable columns with arrow indicators
- Row hover state: Subtle highlight
- Action buttons in rightmost column
- Pagination at bottom with page size selector

**Buttons:**
- Primary: Red background #c00, white text, font-semibold
- Secondary: Transparent with border, white text
- Ghost: No border, hover background change
- Sizes: px-4 py-2 (small), px-6 py-3 (medium), px-8 py-4 (large)
- Border-radius: rounded-lg
- Icons: 18-20px, positioned left or right of text

**GPS Map Component:**
- Full-height container within main area
- Mapbox GL JS or Leaflet integration
- Technician markers with color coding (available, busy, offline)
- Popup cards showing technician name, current job, last update
- Route history toggle
- Real-time position updates

**Chat Interface:**
- Split view: Channel list (w-80) + message area
- Message bubbles: Rounded, sender vs. recipient styling
- Department channels with # prefix
- Direct messages with user avatars
- Typing indicators and read receipts
- File attachment support with preview

**Work Order Cards:**
- Status badge (New, Assigned, In Progress, Completed)
- Customer info section with icon
- Equipment details with part numbers
- Assigned technician with avatar
- Timeline showing status changes
- Action buttons (Edit, Assign, Close, Bill)

**Employee Business Card Banner:**
- Horizontal layout in top bar
- Avatar or department icon on left (48px circular)
- Name (font-semibold), role, phone, email in vertical stack
- Red accent line or border
- Hover state shows full contact card

### D. Visual Treatment

**Color Palette (from ELEVEX branding):**
- Background: #0a0a0a
- Surface: rgba(15, 15, 25, 0.92)
- Primary accent: #8ACCD5 (Cyan/Turquoise - HSL: 184 39% 68%)
- Secondary accents:
  - Purple: #8E7DBE (HSL: 253 30% 63%)
  - Pink: #FF90BB (HSL: 339 100% 78%)
  - Light Pink: #FFC1DA (HSL: 345 100% 85%)
  - Cream: #F8F8E1 (HSL: 60 85% 93%)
  - Teal: #1BCFB4 (HSL: 170 75% 45%)
- Text primary: #ffffff
- Text secondary: rgba(255,255,255,0.7)
- Borders: rgba(255,255,255,0.12)
- Success: #10b981
- Warning: #f59e0b
- Error: #ef4444

**Gradient Effects:**
- Cyan to Purple: `linear-gradient(135deg, #8ACCD5 0%, #8E7DBE 100%)`
- Pink to Blue: `linear-gradient(135deg, #FF90BB 0%, #8ACCD5 100%)`
- Full spectrum: `linear-gradient(135deg, #8ACCD5 0%, #8E7DBE 50%, #FF90BB 100%)`
- Utility classes: `.gradient-cyan-purple`, `.gradient-pink-blue`, `.gradient-text`

**Background Patterns:**
- Subtle hexagonal texture overlay on main background (from login)
- Carbon fiber texture on sidebar
- Gradient overlays for hero sections (if any)

**Depth & Elevation:**
- Cards: 0 4px 12px rgba(0,0,0,0.3)
- Modals: 0 20px 50px rgba(0,0,0,0.6)
- Dropdowns: 0 8px 24px rgba(0,0,0,0.4)

## Page-Specific Layouts

**Dashboard:**
- 3-column grid of stat cards (Sales Today, Active Work Orders, Technicians On Route)
- Recent activity feed in left column
- Quick actions panel in right column
- Recent work orders table below

**Work Order Management:**
- Filter bar at top (Status, Department, Date Range, Technician)
- Kanban board view option OR table view toggle
- Work order cards with all relevant info
- Click to expand full details in modal or side panel

**GPS Tracking:**
- Full-screen map as primary view
- Collapsible technician list on left (filter by status)
- Selected technician details panel on right
- Real-time updates with WebSocket

**Parts Inventory:**
- Search bar with filters (Category, Stock Status, Supplier)
- Grid or table view of parts
- Stock level indicators with color coding
- Quick reorder button with modal form

**Billing Dashboard:**
- Pending work orders requiring invoicing
- Invoice generation wizard
- Payment tracking table
- Financial summary cards

## Icons
**Library:** Font Awesome 6.x (via CDN)
- Department icons: fa-solid variants
- Actions: fa-regular for secondary, fa-solid for primary
- Status indicators: fa-circle with color classes
- Navigation: fa-home, fa-truck, fa-wrench, fa-box, fa-calculator

## Images
**No hero images required** - this is a functional ERP dashboard application, not a marketing site. Focus on data visualization, charts, and UI clarity.

## Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation throughout
- Focus indicators visible on all focusable elements
- Color contrast ratios meeting WCAG AA standards
- Screen reader announcements for status changes

## Animations
**Minimal, purposeful only:**
- Smooth transitions on hover states (0.2s ease)
- Loading spinners for data fetching
- Toast notifications slide in/out from top-right
- Modal fade-in with backdrop blur
- **No decorative animations** - this is a productivity tool