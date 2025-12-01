# Copilot Instructions for ELEVEX ERP

## Project Overview

ELEVEX ERP is a comprehensive enterprise resource planning system designed for lift and material handling equipment dealerships. It manages sales, rentals, service operations, parts inventory, warranty claims, and accounting. The application prioritizes security, type safety, and operational efficiency for dealership management.

## Architecture

### Technology Stack

- **Frontend**: React 18 with TypeScript, Vite for bundling
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Components**: shadcn/ui (Radix UI based) with Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Validation**: Zod schemas
- **Real-time Communication**: WebSockets

### Directory Structure

```
├── client/              # Frontend React application
│   ├── src/             # React source code
│   └── public/          # Static assets
├── server/              # Backend Express application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   ├── db.ts            # Database connection
│   ├── storage.ts       # Data access layer
│   └── email.ts         # Email service integration
├── shared/              # Shared code between frontend and backend
│   └── schema.ts        # Drizzle ORM schema and Zod validators
├── migrations/          # Database migrations
└── uploads/             # File upload storage
```

### Path Aliases

- `@/*` → `./client/src/*` (frontend imports)
- `@shared/*` → `./shared/*` (shared imports)

## Code Style Guidelines

### TypeScript

- Use strict TypeScript configuration
- Prefer explicit type annotations for function parameters and return types
- Use Zod schemas for runtime validation
- Use UUID primary keys for database tables

### React Components

- Use functional components with hooks
- Prefer `const` arrow function syntax for components
- Use TanStack Query for server state management
- Use React Hook Form with Zod resolvers for forms

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow the custom design system in `design_guidelines.md`
- Use dark theme as default with support for light and unicorn themes
- Use brand colors: Cyan (#8ACCD5), Purple (#8E7DBE), Pink (#FF90BB)

### Backend

- Follow RESTful API design with JSON responses
- Use session-based authentication
- Use Drizzle ORM for type-safe database queries
- Validate all inputs with Zod schemas

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Type checking
npm run check

# Database operations
npm run db:push    # Push schema changes to database
```

## Key Conventions

### API Endpoints

- All API routes are prefixed with `/api`
- Authentication endpoints under `/api/auth`
- Use plural nouns for resources (e.g., `/api/work-orders`, `/api/users`)
- Return appropriate HTTP status codes

### Database Schema

- All tables defined in `shared/schema.ts`
- Use Drizzle ORM patterns for table definitions
- Use `createInsertSchema` and `createSelectSchema` from `drizzle-zod` for validation
- Use UUID primary keys for user-related tables

### Error Handling

- Return consistent error response format
- Use appropriate HTTP status codes (400 for validation, 401 for auth, 404 for not found)
- Log errors server-side but don't expose internal details to clients

### Security

- Validate all user inputs
- Use parameterized queries (handled by Drizzle ORM)
- Implement proper authentication checks on protected routes
- Don't expose sensitive data in API responses

## Design System Reference

See `design_guidelines.md` for detailed information on:
- Typography (Inter font via Google Fonts CDN)
- Color palette and gradients
- Component styling patterns
- Layout system and spacing
- Accessibility requirements (WCAG AA compliant)

## Testing

When adding new features:
- Ensure TypeScript compilation passes (`npm run check`)
- Test API endpoints manually or with tools like Postman
- Verify UI changes work across themes (Dark, Light, Unicorn)
- Check real-time features work with WebSockets

## Important Files to Understand

- `shared/schema.ts` - Database schema and Zod validators
- `server/routes.ts` - All API endpoint definitions
- `server/storage.ts` - Data access layer methods
- `design_guidelines.md` - UI/UX design specifications
- `client/src/` - React components and pages
