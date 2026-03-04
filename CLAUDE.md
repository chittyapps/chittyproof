# Document Proofing Application

## Stack
- Full-stack TypeScript (ESM) on Cloudflare Workers + Hono + React 19 + Vite 7
- Database: Neon PostgreSQL via Hyperdrive with Drizzle ORM (schema in `shared/schema.ts`)
- Client routing: wouter (not react-router)
- Data fetching: @tanstack/react-query with custom `apiRequest` in `client/src/lib/queryClient.ts`
- UI: Radix UI primitives + Tailwind CSS v4 + shadcn-style components in `client/src/components/ui/`
- Forms: react-hook-form + zod

## Commands
- `npm run dev` - Start Workers dev server via wrangler (port 8787)
- `npm run dev:client` - Start Vite client dev server with HMR (port 5173, proxies /api to wrangler)
- `npm run build` - Vite production build to `dist/public`
- `npm run deploy` - Build + deploy to Cloudflare Workers
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push Drizzle schema to database

## Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

## Project Structure
- `client/src/pages/` - Page components (dashboard, document-view)
- `client/src/components/ui/` - Reusable UI components (Radix-based)
- `client/src/components/layout/` - Layout wrappers
- `server/index.ts` - Hono Workers entry point
- `server/routes.ts` - API route registration (Hono handlers)
- `server/storage.ts` - Data access layer (Drizzle + Neon via Hyperdrive)
- `shared/schema.ts` - Drizzle schema + Zod validation schemas
- `wrangler.toml` - Cloudflare Workers configuration
