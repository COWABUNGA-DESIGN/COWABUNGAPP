# ELEVEX ERP - Lift Dealership Management System

## Overview

ELEVEX ERP is a comprehensive enterprise resource planning system designed for lift and material handling equipment dealerships. It manages sales, rentals, service operations, parts inventory, warranty claims, and accounting. The application features a React-based frontend with a distinctive gradient color scheme and animated ELEVEX branding, and an Express backend with PostgreSQL integration. Key capabilities include real-time equipment/parts inventory management, a real-time messaging system, robust user and profile management, a comprehensive notification system, a work order demand workflow, and detailed dashboard statistics. The system prioritizes security, type safety, and operational efficiency for dealership management.

## Recent Updates (Nov 24, 2025)

**Mood Feature Added to Dashboard - COMPLETED ✅**
- ✅ Users can now choose their daily mood from 5 emoticons (Happy, Focused, Tired, Stressed, Neutral)
- ✅ Mood selector card displayed on dashboard below welcome header
- ✅ Moods persist to database and display in real-time
- ✅ Mood emoji shows next to username in direct message conversations
- ✅ Mood displays in chat header when viewing direct messages
- ✅ Added mood column to users table with default "neutral" value
- ✅ API endpoint PATCH /api/auth/user/mood for updating mood
- ✅ Moods update instantly across all chat interfaces

**Background Hex Zoom Fixed & Unicorn Theme Icon Updated - COMPLETED ✅**
- ✅ Fixed hexagon background zoom - reduced from bg-cover to backgroundSize: 200% (2x zoom out)
- ✅ Hexagons now appear less zoomed in on all themes (Dark, Light, Unicorn)
- ✅ Background fills more visible area without heavy distortion
- ✅ Replaced Sparkles icon with Wand2 (magic wand) for Unicorn theme toggle
- ✅ Added magical rotation animation to Wand2 icon when unicorn theme is active
- ✅ Better visual distinction between all three theme options

**Default Avatar Implemented for All Users - COMPLETED ✅**
- ✅ Set up custom pixelated gaming avatar (IMG_8538) as system-wide default
- ✅ Image copied to client/public/default-avatar.jpeg for server-side serving
- ✅ Updated createUser method to assign default avatar to all new users
- ✅ Updated all 6 existing users in database with default avatar
- ✅ Avatar displays properly in chat conversations with user identification
- ✅ Works in channels (HQ, Department) and direct messages
- ✅ Users can still customize their avatars after account creation

**Chat Architecture Redesigned & Fixed - COMPLETED ✅**
- ✅ Created unified `UnifiedChat.tsx` component consolidating duplicate chat functionality
- ✅ Merged separate PrivateChatWindow and ChatInterface components into single cohesive system
- ✅ Implemented proper tab-based navigation between Channels and Direct Messages
- ✅ Added conversation list with user avatars, names, and real-time updates
- ✅ Integrated NewMessageDialog for creating new direct message conversations
- ✅ Fixed conversation creation with `/api/conversations` endpoint
- ✅ Implemented getOrCreateConversation method in storage layer
- ✅ Added proper user data fetching for conversation participants
- ✅ Enhanced WebSocket message delivery to update conversations in real-time
- ✅ Fixed all TypeScript errors with proper null checks and fallbacks
- ✅ Simplified message UI with better visual distinction (current user vs other user)
- ✅ System now properly displays channels (HQ, Department) and direct messages in organized tabs

**Work Order Attachments & Notes Fully Editable - COMPLETED ✅**
- ✅ Added notes and attachment editing to work order detail page
- ✅ Implemented edit button to toggle between view and edit modes
- ✅ Added photo upload functionality (JPG, PNG, GIF, WebP up to 10MB)
- ✅ Notes editable anytime, regardless of work order status
- ✅ Photos display in grid layout with proper formatting
- ✅ Changes sync in real-time across all views via React Query

**Work Order Punch System Fixed - COMPLETED ✅**
- ✅ Work order detail now shows active punch with technician name
- ✅ Displays time punched in (start time) for active work
- ✅ Shows time allowed remaining (budgeted - actual so far) per task
- ✅ Displays efficiency % per task with color coding (Green ≥100%, Yellow 80-99%, Red <80%)
- ✅ Active punch card shows duration in real-time (hours and minutes)
- ✅ Task headers now display all metrics: Budgeted, Remaining, Efficiency

**Break Feature Added to Dashboard - COMPLETED ✅**
- ✅ Added "Take Break" button (Coffee icon) visible while punch is active
- ✅ Break dialog allows users to input break duration in minutes (1-480 min)
- ✅ Break time is automatically subtracted from total work hours on dashboard
- ✅ Breaks are recorded as separate punch records with punchType "other"
- ✅ Stats calculation now deducts break hours from work hours
- ✅ Daily hours now = work hours - break hours (never goes negative)
- ✅ Break feature persists to database and syncs in real-time
- ✅ Toast notification confirms break was recorded

**Efficiency Calculation Fixed & Dashboard Syncing - COMPLETED ✅**
- ✅ Fixed efficiency calculation formula: changed from (actual/budgeted) to (budgeted/actual)*100
- ✅ Now correctly shows: >100% = on/under budget (good), <100% = over budget (bad)
- ✅ WorkOrderDetail now calculates efficiency correctly from real-time punches
- ✅ Dashboard efficiency polling reduced from 10s to 5s for faster sync
- ✅ Dashboard color coding: Green (≥100%), Yellow (80-99%), Red (<80%)
- ✅ Efficiency updates on dashboard immediately after work order completion

**Lunch Feature Removed - COMPLETED ✅**
- ✅ Removed `/api/tasks/:id/lunch` endpoint from backend
- ✅ Removed lunch button UI from WorkOrderDetail.tsx and TaskTimePunches.tsx
- ✅ Removed Coffee and Utensils icon imports
- ✅ Removed lunchInMutation, lunchOutMutation, lunchMutation code
- ✅ Punch task feature is now clean without lunch complexity
- ✅ Dashboard work order card syncs punch data every 1 second via React Query polling

**Work Order Punch Endpoints Fixed - COMPLETED ✅**
- ✅ Created missing `/api/work-orders/:id/punch-in` endpoint for punching into work orders
- ✅ Created missing `/api/work-orders/:id/punch-out` endpoint for punching out of work orders
- ✅ Created missing `/api/tasks/:id/punch` endpoint for task-level punch in/out (toggle)
- ✅ All endpoints now properly create time punch records with work order and task IDs
- ✅ All endpoints update work order status and actual hours when punches are created/closed
- ✅ Error handling prevents multiple active punches per user
- ✅ Data now syncs properly to database and UI updates via React Query cache invalidation (1s polling)

**Photo Attachments Fixed on Work Orders - COMPLETED ✅**
- ✅ Fixed DemandForm sending to wrong API endpoint (/api/work-orders instead of /api/work-orders/demands)
- ✅ Updated DemandForm to call correct endpoint that properly handles photos array
- ✅ Fixed API field mapping - demandedBy field now correctly mapped to advisorId for demand endpoint
- ✅ Added isLoadingAdvisors prop to FormContent component to prevent TypeScript errors
- ✅ Photos now properly persist to database when creating work order demands
- ✅ Photos correctly display on work order detail page in gallery grid
- ✅ Photo upload validation already working (jpeg, jpg, png, gif, webp, max 10MB)

**Work Order Punch API Calls Fixed - COMPLETED ✅**
- ✅ Fixed punch in/out mutations sending incorrectly formatted data
- ✅ Corrected apiRequest calls in WorkOrderDetail.tsx to use proper format
- ✅ Fixed punchInMutation, punchOutMutation, lunchInMutation, lunchOutMutation
- ✅ All four mutations now properly send { workOrderId } data instead of { headers, body }
- ✅ Punch operations now work correctly in work order detail page

**Private Chat System Fixed - COMPLETED ✅**
- ✅ Fixed private chat conversations not displaying user data (avatars/usernames)
- ✅ Added automatic fetching of conversation participant user data when conversations list loads
- ✅ Fixed missing user information in both ChatInterface and PrivateChatWindow components
- ✅ Conversation lists now properly display other user's avatar and username
- ✅ Private messages now fully functional with real-time WebSocket support
- ✅ Users can now create new conversations with NewMessageDialog and start messaging

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18, TypeScript, and Vite. It uses Wouter for routing and TanStack Query for server state management. UI components are built with shadcn/ui (Radix UI based) and styled with Tailwind CSS, following a custom design system. It features dark mode, ELEVEX brand colors (Cyan, Purple, Pink) with gradients, and leverages React Hook Form with Zod for validation. The interface is information-dense, with a fixed sidebar, a 12-column responsive grid, and card-based UI. Bilingual support (French/English) is integrated.

### Backend Architecture

The backend uses Express.js for its HTTP server and API, following a RESTful design with JSON. It implements session-based authentication. PostgreSQL is the primary data store, managed with Drizzle ORM for type-safe queries. Development uses `tsx` and `esbuild` for production builds.

### Data Storage

PostgreSQL (Neon serverless) is used, employing WebSocket-based connections and connection pooling. Drizzle ORM and Drizzle Kit manage type-safe queries and schema migrations, integrated with Zod for runtime validation. A shared directory defines the schema for frontend/backend consistency, with UUID primary keys for users.

### Equipment & Parts Inventory

A `Machines` table stores equipment inventory, categorized (Lift, Hoist, Platform, Stairs, Ramp, Other) with operational status, location tracking, and service scheduling. A `Parts` table maintains replacement parts inventory by category (Motor, Gear, Bearing, Hydraulic, Electrical, Fastener, Other), including quantity, unit costs, supplier info, and reorder levels.

### System Design Choices

- **Real-Time Messaging:** WebSocket-based system (`/ws`) with headquarters-based isolation, profile picture display, and real-time broadcasting.
- **Profile Management:** Comprehensive interface for custom or default profile pictures with real-time previews.
- **Security:** Strict authentication and authorization across all endpoints and WebSocket connections, with PII restricted.
- **Searchable User Selector:** Combobox pattern for user selection in forms, supporting large lists, real-time filtering, and accessibility.
- **Notification System:** Dual delivery (in-app and email via Resend API) for critical events, with in-app bell icon, unread count, and mark-as-read functionality.
- **Work Order Workflow:** Enhanced DemandForm allows technical advisor selection, triggering dual notifications upon assignment. Authorization governs time punch editing based on user roles and work order status.
- **Equipment Tracking:** Real-time inventory management for lift equipment and parts with status indicators, location tracking, and service scheduling.
- **Dashboard & Statistics:** Provides user statistics, including hours worked, work order counts, and efficiency metrics, calculated upon work order completion.
- **UI/UX:** Animated ELEVEX logo, gradient brand colors, WCAG AA compliant contrast, 8 core reusable components, and main application pages. Hexagonal wallpapers are applied globally across all themes (Dark, Light, Unicorn).

## External Dependencies

- **UI Component Libraries:** Radix UI primitives, lucide-react, cmdk, vaul, react-day-picker, embla-carousel-react, input-otp.
- **Utility Libraries:** class-variance-authority (cva), clsx, tailwind-merge, date-fns, nanoid.
- **Development & Build Tools:** Vite plugins (runtime-error-modal, cartographer, dev-banner), PostCSS with Autoprefixer, Font Awesome 6.5.0 CDN.
- **Database & Backend:** @neondatabase/serverless (PostgreSQL connection), ws (WebSocket), drizzle-orm, drizzle-kit, connect-pg-simple (PostgreSQL session storage).
- **Email Integration:** Resend API for transactional emails.
- **Type Safety & Validation:** zod, @hookform/resolvers, TypeScript.
- **Theming & Assets:** Google Fonts CDN (Inter), shadcn/ui ("new-york" style), Tailwind CSS variables.