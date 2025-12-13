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

## Common Development Workflows

### Adding a New Feature

1. **Database Changes** (if needed):
   - Update `shared/schema.ts` with new tables or columns
   - Run `npm run db:push` to apply changes
   - Create corresponding Zod schemas using `createInsertSchema` and `createSelectSchema`

2. **Backend API**:
   - Add storage methods in `server/storage.ts` for data access
   - Create new route handlers in `server/routes.ts`
   - Ensure proper authentication and validation

3. **Frontend**:
   - Create React components in `client/src/components/`
   - Use TanStack Query hooks for data fetching
   - Follow design system guidelines from `design_guidelines.md`

### Creating a New API Endpoint

```typescript
// In server/routes.ts
app.post("/api/resource", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const validatedData = insertResourceSchema.parse(req.body);
    const result = await storage.createResource(validatedData);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Creating a New Database Table

```typescript
// In shared/schema.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const resources = pgTable("resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create Zod schemas
export const insertResourceSchema = createInsertSchema(resources);
export const selectResourceSchema = createSelectSchema(resources);
```

### Creating a Form Component

```typescript
// Use React Hook Form with Zod validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

function ResourceForm() {
  const form = useForm({
    resolver: zodResolver(insertResourceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
      {/* Form fields using shadcn/ui components */}
    </form>
  );
}
```

## File Organization Best Practices

### Client Structure
- `client/src/components/` - Reusable UI components
- `client/src/pages/` - Page-level components
- `client/src/hooks/` - Custom React hooks
- `client/src/lib/` - Utility functions and helpers

### Server Structure
- Keep route handlers thin - business logic goes in `storage.ts`
- Use middleware for common functionality (auth, logging)
- Group related endpoints together

## Troubleshooting

### Common Issues

**TypeScript Errors**:
- Run `npm run check` to see all type errors
- Ensure imports use correct path aliases (`@/*` for client, `@shared/*` for shared)

**Database Issues**:
- Verify connection string in environment variables
- Run `npm run db:push` after schema changes
- Check Drizzle ORM documentation for query syntax

**Build Failures**:
- Clear `dist/` directory and rebuild
- Check for circular dependencies
- Ensure all dependencies are installed

**WebSocket Issues**:
- Verify WebSocket server is running on correct port
- Check browser console for connection errors
- Ensure proper CORS configuration

## Security Best Practices

1. **Input Validation**: Always validate with Zod before database operations
2. **Authentication**: Check `req.isAuthenticated()` on protected routes
3. **SQL Injection**: Use Drizzle ORM parameterized queries (automatic)
4. **XSS Prevention**: React handles escaping by default, be careful with `dangerouslySetInnerHTML`
5. **Secrets**: Never commit API keys or credentials - use environment variables

## Performance Considerations

- Use TanStack Query's caching effectively
- Implement pagination for large data sets
- Use database indexes for frequently queried columns
- Optimize bundle size - lazy load routes and heavy components
- Use WebSocket selectively - only for real-time updates

## Accessibility Guidelines

- Follow WCAG AA standards
- Use semantic HTML elements
- Provide ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain sufficient color contrast (see `design_guidelines.md`)
