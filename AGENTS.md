# TracAuto Frontend — Codex / Copilot Agent Rules

> This file defines the non-negotiable principles for any AI agent (OpenAI Codex, GitHub Copilot Workspace, etc.) working on this codebase.

## Project Context

- **Stack**: React + TypeScript + Vite + TailwindCSS + i18next + React Query.
- **Type**: Main frontend for TracAuto, a multi-tenant SaaS for automotive fleet management.
- **Includes**: Fleet management, marketplace, B2B/B2C rental modules.

## Non-Negotiable Implementation Principles

### API Calls
ALWAYS use `apiClient` (authenticated) or `publicApiClient` (public). NEVER `fetch`/`axios` directly. Client includes interceptors for auth, error handling, and token refresh.

### Error Handling
All API screens MUST use `useErrorHandler`, `ApiErrorBanner`, `EstadoError`, or equivalent. Route tree under `ErrorBoundary`. 5xx → backend `ISupportService` creates Jira ticket.

### i18n (mandatory)
ALL text via `useTranslation()`. No hardcoded strings. Errors: `errors.{Contexto}.{Codigo}` with `{{param0}}`, `{{param1}}`. Always add `es.json` + `en.json` entries for new errors.

### Page States (mandatory)
Loading (spinner/skeleton), Empty (`EstadoVacio`), Error (`EstadoError` with retry). Every page must handle all three.

### Protected Routes
Auth routes → `ProtectedRoute`. B2C uses separate auth flow.

### Multi-tenancy
`organizacion_id` from JWT. No org switcher. One user = one org. Never expose tenant IDs/PII.

### Cache Awareness
Backend uses Redis (`ICachedQuery`/`ICacheInvalidatingCommand`). After mutations → invalidate React Query caches. Force refetch when needed.

### CQRS Contracts
Each backend use case = one Command/Query. Frontend services mirror 1:1. Contracts stable unless BREAKING.

### Soft Delete
Backend uses `Activo`. Lists show active records only.

### Clean Code
No dead code. No commented-out blocks. If unused, delete it.

### DTOs Only
Backend returns DTOs, never entities. TypeScript types should match backend DTOs. Don't assume internal DB fields.

### Rate Limiting
Handle HTTP 429 gracefully: user-friendly message + retry with backoff/cooldown.

### Tenant-Scoped Config
Each org has own config (branding, Stripe, notifications) in backend DB. Read via queries. Never hardcode org-specific values.

### Time Handling
Backend stores UTC. Frontend converts to user's local timezone for display. Use proper date formatting libraries.

### Webhook-Driven Updates
Some states change via backend webhooks (Stripe payments). Use polling or WebSocket where real-time updates needed.

### Security
JWT short-lived (~15 min). Refresh via HttpOnly cookie. API client handles refresh transparently. Never store tokens in localStorage or expose in URLs/logs.
